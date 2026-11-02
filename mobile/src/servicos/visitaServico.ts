import { api, ErroDeRede } from '../dados/api';
import { abrirBanco, lerConsulta, salvarConsulta } from '../dados/bancoLocal';
import { guardarFotoPendente, obterLocalizacao } from '../dados/dispositivo';
import {
  Cuidador,
  Pagina,
  ResumoCuidador,
  ResumoTutor,
  SituacaoVisita,
  Visita,
} from '../tipos/modelos';
import { comCopiaLocal, Resultado } from './comCopiaLocal';
import { dia, hora } from './formatacao';
import { acessoDoCuidadorVencido, DISTANCIA_CHECKIN_METROS, distanciaMetros, janelaDeCheckin, TarefasDoRelatorio } from './regras';

const SITUACOES_COM_COPIA_DE_GATOS: SituacaoVisita[] = ['ACEITA', 'EM_ANDAMENTO'];

async function guardarVisita(visita: Visita) {
  const db = await abrirBanco();
  const anterior = await lerVisitaLocal(visita.id);
  const dados: Visita = visita.dadosGatos ? visita : { ...visita, dadosGatos: visita.dadosGatosLiberados ? anterior?.dadosGatos ?? null : null };
  await db.runAsync(
    'INSERT OR REPLACE INTO visita (id, inicio, situacao, dados) VALUES (?, ?, ?, ?)',
    visita.id,
    visita.inicio,
    visita.situacao,
    JSON.stringify(dados),
  );
}

export async function lerVisitaLocal(id: number): Promise<Visita | null> {
  const db = await abrirBanco();
  const linha = await db.getFirstAsync<{ dados: string }>('SELECT dados FROM visita WHERE id = ?', id);
  return linha ? (JSON.parse(linha.dados) as Visita) : null;
}

async function lerVisitasLocais(): Promise<Visita[]> {
  const db = await abrirBanco();
  const linhas = await db.getAllAsync<{ dados: string }>('SELECT dados FROM visita ORDER BY inicio DESC');
  return linhas.map((l) => JSON.parse(l.dados) as Visita);
}

/** RN08: tira do celular os dados dos gatos das visitas cujo período de acesso terminou. */
export async function apagarDadosVencidosDoCuidador() {
  const db = await abrirBanco();
  for (const visita of await lerVisitasLocais()) {
    if (visita.dadosGatos && acessoDoCuidadorVencido(visita)) {
      const semDados: Visita = { ...visita, dadosGatos: null, dadosGatosLiberados: false };
      await db.runAsync('UPDATE visita SET dados = ? WHERE id = ?', JSON.stringify(semDados), visita.id);
    }
  }
}

/** Coloca por cima da cópia as ações que ainda estão na fila, para a tela mostrar o que a pessoa já fez. */
async function aplicarFila(visita: Visita): Promise<Visita> {
  const db = await abrirBanco();
  const acoes = await db.getAllAsync<{ tipo: string }>(
    'SELECT tipo FROM fila_acao WHERE visita_id = ? AND erro IS NULL',
    visita.id,
  );
  if (acoes.some((a) => a.tipo === 'RELATORIO')) {
    return { ...visita, situacao: 'CONCLUIDA', aguardandoEnvio: true, podeCancelar: false };
  }
  if (acoes.some((a) => a.tipo === 'CHECKIN')) {
    return { ...visita, situacao: 'EM_ANDAMENTO', aguardandoEnvio: true, podeCancelar: false };
  }
  return visita;
}

export interface FiltroVisitas {
  situacoes?: SituacaoVisita[];
  de?: Date;
  ate?: Date;
  pagina?: number;
}

export async function listarVisitas(filtro: FiltroVisitas = {}): Promise<Resultado<Visita[]>> {
  const parametros: string[] = [`pagina=${filtro.pagina ?? 0}`, 'tamanho=50'];
  if (filtro.situacoes?.length) parametros.push(`situacoes=${filtro.situacoes.join(',')}`);
  if (filtro.de) parametros.push(`de=${filtro.de.toISOString()}`);
  if (filtro.ate) parametros.push(`ate=${filtro.ate.toISOString()}`);

  try {
    const { itens } = await api.get<Pagina<Visita>>(`/api/visitas?${parametros.join('&')}`);
    for (const visita of itens) {
      await guardarVisita(visita);
    }
    return { dados: await Promise.all(itens.map(aplicarFila)), daCopiaLocal: false };
  } catch (erro) {
    if (!(erro instanceof ErroDeRede)) {
      throw erro;
    }
    const locais = await Promise.all((await lerVisitasLocais()).map(aplicarFila));
    const filtradas = locais.filter((v) => {
      const inicio = new Date(v.inicio);
      return (
        (!filtro.situacoes?.length || filtro.situacoes.includes(v.situacao)) &&
        (!filtro.de || inicio >= filtro.de) &&
        (!filtro.ate || inicio < filtro.ate)
      );
    });
    return { dados: filtradas, daCopiaLocal: true };
  }
}

export async function detalharVisita(id: number): Promise<Resultado<Visita>> {
  try {
    const visita = await api.get<Visita>(`/api/visitas/${id}`);
    await guardarVisita(visita);
    return { dados: await aplicarFila(visita), daCopiaLocal: false };
  } catch (erro) {
    const copia = erro instanceof ErroDeRede ? await lerVisitaLocal(id) : null;
    if (copia) {
      return { dados: await aplicarFila(copia), daCopiaLocal: true };
    }
    throw erro;
  }
}

/** Baixa os dados dos gatos das próximas visitas aceitas, para o cuidador consultar sem internet (RNF04). */
export async function baixarVisitasDoCuidador() {
  await apagarDadosVencidosDoCuidador();
  const { itens } = await api.get<Pagina<Visita>>(
    `/api/visitas?situacoes=${SITUACOES_COM_COPIA_DE_GATOS.join(',')}&tamanho=50`,
  );
  for (const visita of itens) {
    await guardarVisita(await api.get<Visita>(`/api/visitas/${visita.id}`));
  }
}

export function buscarCuidadores(enderecoId: number, distanciaMaximaKm: number, ordem: 'distancia' | 'nome') {
  return api.get<Pagina<Cuidador>>(
    `/api/cuidadores?enderecoId=${enderecoId}&distanciaMaximaKm=${distanciaMaximaKm}&ordem=${ordem}`,
  );
}

export function solicitarVisita(dados: {
  cuidadorId: number;
  gatoIds: number[];
  enderecoId: number;
  inicio: string;
  duracaoMinutos: number;
  instrucoes: string;
}) {
  return api.post<Visita>('/api/visitas', dados);
}

export const aceitarVisita = (id: number) => api.post<Visita>(`/api/visitas/${id}/aceitar`);
export const recusarVisita = (id: number) => api.post<Visita>(`/api/visitas/${id}/recusar`);
export const cancelarVisita = (id: number, motivo: string) => api.post<Visita>(`/api/visitas/${id}/cancelar`, { motivo });

export function resumoTutor() {
  return comCopiaLocal(
    () => api.get<ResumoTutor>('/api/resumo/tutor'),
    (dados) => salvarConsulta('resumo-tutor', dados),
    () => lerConsulta<ResumoTutor>('resumo-tutor'),
  );
}

export function resumoCuidador() {
  return comCopiaLocal(
    () => api.get<ResumoCuidador>('/api/resumo/cuidador'),
    (dados) => salvarConsulta('resumo-cuidador', dados),
    () => lerConsulta<ResumoCuidador>('resumo-cuidador'),
  );
}

export class RecusaLocal extends Error {}

/** RN03: confere distância e horário no celular. Sem internet esta é a única checagem antes de entrar na fila. */
export async function coletarCheckin(visita: Visita) {
  const agora = new Date();
  const { de, ate } = janelaDeCheckin(visita.inicio);
  if (agora < de || agora > ate) {
    throw new RecusaLocal(`O check-in desta visita é permitido em ${dia(de)}, das ${hora(de)} às ${hora(ate)}.`);
  }
  const posicao = await obterLocalizacao();
  const { latitude, longitude } = visita.endereco;
  if (latitude !== null && longitude !== null) {
    const distancia = distanciaMetros(posicao.latitude, posicao.longitude, latitude, longitude);
    if (distancia > DISTANCIA_CHECKIN_METROS) {
      throw new RecusaLocal(
        `Você está a ${Math.round(distancia)} metros do endereço. O check-in só é aceito a até ${DISTANCIA_CHECKIN_METROS} metros.`,
      );
    }
  }
  return { ...posicao, capturadoEm: agora.toISOString() };
}

export function prepararRelatorio(tarefas: TarefasDoRelatorio, observacoes: string, fotosLocais: string[]) {
  return {
    ...tarefas,
    observacoes,
    fotos: fotosLocais.map((local) => ({ local: guardarFotoPendente(local), remota: null as string | null })),
    capturadoEm: new Date().toISOString(),
  };
}

export type RelatorioPreparado = ReturnType<typeof prepararRelatorio>;
