import { api, ErroDaApi } from '../dados/api';
import { abrirBanco } from '../dados/bancoLocal';
import { apagarFotoPendente } from '../dados/dispositivo';
import { Visita } from '../tipos/modelos';
import { enviarFoto } from './gatoServico';
import { RelatorioPreparado } from './visitaServico';

/** Fila das ações feitas sem internet (RF16, B28): envia em ordem e guarda o que falhar para tentar de novo. */
interface LinhaFila {
  id: number;
  tipo: 'CHECKIN' | 'RELATORIO';
  visita_id: number;
  dados: string;
  erro: string | null;
}

export interface AcaoComErro {
  id: number;
  tipo: string;
  visitaId: number;
  erro: string;
}

let ouvintes: (() => void)[] = [];
let sincronizando: Promise<void> | null = null;

export function aoMudarFila(funcao: () => void) {
  ouvintes.push(funcao);
  return () => {
    ouvintes = ouvintes.filter((o) => o !== funcao);
  };
}

const avisar = () => ouvintes.forEach((o) => o());

export async function enfileirar(tipo: LinhaFila['tipo'], visitaId: number, dados: unknown) {
  const db = await abrirBanco();
  await db.runAsync(
    'INSERT INTO fila_acao (tipo, visita_id, dados, criada_em) VALUES (?, ?, ?, ?)',
    tipo,
    visitaId,
    JSON.stringify(dados),
    new Date().toISOString(),
  );
  avisar();
}

export async function contarPendentes(): Promise<number> {
  const db = await abrirBanco();
  const linha = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM fila_acao WHERE erro IS NULL');
  return linha?.total ?? 0;
}

export async function listarComErro(): Promise<AcaoComErro[]> {
  const db = await abrirBanco();
  const linhas = await db.getAllAsync<LinhaFila>('SELECT * FROM fila_acao WHERE erro IS NOT NULL ORDER BY id');
  return linhas.map((l) => ({ id: l.id, tipo: l.tipo, visitaId: l.visita_id, erro: l.erro ?? '' }));
}

export async function descartarAcao(id: number) {
  const db = await abrirBanco();
  const linha = await db.getFirstAsync<LinhaFila>('SELECT * FROM fila_acao WHERE id = ?', id);
  if (linha?.tipo === 'RELATORIO') {
    (JSON.parse(linha.dados) as RelatorioPreparado).fotos.forEach((f) => apagarFotoPendente(f.local));
  }
  await db.runAsync('DELETE FROM fila_acao WHERE id = ?', id);
  avisar();
}

async function enviarAcao(linha: LinhaFila) {
  const db = await abrirBanco();
  if (linha.tipo === 'CHECKIN') {
    await api.post<Visita>(`/api/visitas/${linha.visita_id}/checkin`, JSON.parse(linha.dados));
    return;
  }

  const relatorio = JSON.parse(linha.dados) as RelatorioPreparado;
  for (const foto of relatorio.fotos) {
    if (!foto.remota) {
      foto.remota = await enviarFoto(foto.local);
      await db.runAsync('UPDATE fila_acao SET dados = ? WHERE id = ?', JSON.stringify(relatorio), linha.id);
    }
  }
  await api.post<Visita>(`/api/visitas/${linha.visita_id}/relatorio`, {
    ...relatorio,
    fotos: relatorio.fotos.map((f) => f.remota),
  });
  relatorio.fotos.forEach((f) => apagarFotoPendente(f.local));
}

async function processar() {
  const db = await abrirBanco();
  const linhas = await db.getAllAsync<LinhaFila>('SELECT * FROM fila_acao WHERE erro IS NULL ORDER BY id');
  for (const linha of linhas) {
    try {
      await enviarAcao(linha);
      await db.runAsync('DELETE FROM fila_acao WHERE id = ?', linha.id);
      avisar();
    } catch (erro) {
      if (erro instanceof ErroDaApi && erro.status < 500) {
        await db.runAsync('UPDATE fila_acao SET erro = ? WHERE id = ?', erro.message, linha.id);
        avisar();
        continue;
      }
      // Sem conexão ou servidor fora do ar: a ação continua na fila, na mesma ordem, para a próxima tentativa.
      return;
    }
  }
}

/** Uma só execução por vez, pois a volta da internet e a abertura de uma tela podem pedir juntas. */
export function sincronizar(): Promise<void> {
  if (!sincronizando) {
    sincronizando = processar().finally(() => {
      sincronizando = null;
    });
  }
  return sincronizando;
}

/** Tenta enviar agora. Se não houver conexão, a ação fica na fila e a função devolve false. */
export async function enviarOuEnfileirar(tipo: LinhaFila['tipo'], visitaId: number, dados: unknown): Promise<boolean> {
  await enfileirar(tipo, visitaId, dados);
  await sincronizar();
  const db = await abrirBanco();
  const linha = await db.getFirstAsync<LinhaFila>(
    'SELECT * FROM fila_acao WHERE visita_id = ? AND tipo = ? ORDER BY id DESC',
    visitaId,
    tipo,
  );
  if (!linha) {
    return true;
  }
  if (linha.erro) {
    const mensagem = linha.erro;
    await db.runAsync('DELETE FROM fila_acao WHERE id = ?', linha.id);
    avisar();
    throw new ErroDaApi(422, mensagem);
  }
  return false;
}
