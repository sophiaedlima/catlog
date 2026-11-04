import { SituacaoSaude, SituacaoVisita, TipoItemSaude } from '../tipos/modelos';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Data local no formato AAAA-MM-DD usado pela API. */
export function dataIso(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** Lê AAAA-MM-DD como data local, sem o deslocamento de fuso que new Date(texto) causaria. */
export function lerDataIso(texto: string): Date {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function dataCurta(texto: string | null | undefined): string {
  if (!texto) {
    return '';
  }
  const [ano, mes, dia] = texto.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export function dia(data: Date): string {
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`;
}

export function hora(data: Date): string {
  return `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

export function diaEHora(texto: string): string {
  const data = new Date(texto);
  return `${dia(data)} às ${hora(data)}`;
}

export function periodoDaVisita(inicio: string, fim: string): string {
  const de = new Date(inicio);
  return `${DIAS[de.getDay()]}, ${dia(de)}, ${hora(de)} às ${hora(new Date(fim))}`;
}

export function nomeDoMes(dataIsoTexto: string): string {
  return MESES[Number(dataIsoTexto.slice(5, 7)) - 1];
}

export function numero(valor: number, casas = 1): string {
  return valor.toFixed(casas).replace('.', ',');
}

export function idade(nascimento: string | null | undefined): string {
  if (!nascimento) {
    return '';
  }
  const inicio = lerDataIso(nascimento);
  const hoje = new Date();
  let meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + hoje.getMonth() - inicio.getMonth();
  if (hoje.getDate() < inicio.getDate()) {
    meses -= 1;
  }
  if (meses < 12) {
    return meses === 1 ? '1 mês' : `${Math.max(meses, 0)} meses`;
  }
  const anos = Math.floor(meses / 12);
  return anos === 1 ? '1 ano' : `${anos} anos`;
}

export function descricaoDoGato(gato: { raca?: string | null; sexo: string; dataNascimento?: string | null }): string {
  return [gato.raca, idade(gato.dataNascimento), gato.sexo === 'FEMEA' ? 'fêmea' : 'macho'].filter(Boolean).join(', ');
}

export function mascararCep(texto: string): string {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);
  return numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
}

export function mascararTelefone(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) {
    return n;
  }
  const meio = n.length === 11 ? 7 : 6;
  return n.length <= meio ? `(${n.slice(0, 2)}) ${n.slice(2)}` : `(${n.slice(0, 2)}) ${n.slice(2, meio)}-${n.slice(meio)}`;
}

export const TEXTO_SITUACAO_VISITA: Record<SituacaoVisita, string> = {
  SOLICITADA: 'Solicitada',
  ACEITA: 'Confirmada',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
};

export const TEXTO_SITUACAO_SAUDE: Record<SituacaoSaude, string> = {
  EM_DIA: 'Em dia',
  A_VENCER: 'A vencer',
  VENCIDO: 'Vencido',
};

export const TEXTO_TIPO_SAUDE: Record<TipoItemSaude, string> = {
  VACINA: 'Vacina',
  VERMIFUGO: 'Vermífugo',
  REMEDIO: 'Remédio',
};

export type TomRotulo = 'ok' | 'alerta' | 'erro' | 'neutro';

export const TOM_SITUACAO_VISITA: Record<SituacaoVisita, TomRotulo> = {
  SOLICITADA: 'alerta',
  ACEITA: 'ok',
  RECUSADA: 'erro',
  CANCELADA: 'erro',
  EXPIRADA: 'neutro',
  EM_ANDAMENTO: 'ok',
  CONCLUIDA: 'neutro',
};

export const TOM_SITUACAO_SAUDE: Record<SituacaoSaude, TomRotulo> = {
  EM_DIA: 'ok',
  A_VENCER: 'alerta',
  VENCIDO: 'erro',
};
