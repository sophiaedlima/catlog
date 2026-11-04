import { Visita } from '../tipos/modelos';

/**
 * Verificações antecipadas das regras de negócio, para avisar o usuário mais rápido.
 * A palavra final é sempre da API; estas funções só valem sozinhas quando não há internet.
 */
const HORA_MS = 3600 * 1000;
const MINUTO_MS = 60 * 1000;

export const DISTANCIA_CHECKIN_METROS = 200;
export const MAXIMO_FOTOS = 5;
export const DURACOES = [30, 60, 90, 120];

export function validarSolicitacao(gatos: number, inicio: Date | null): string | null {
  if (gatos === 0) {
    return 'Escolha pelo menos um gato para a visita.';
  }
  if (!inicio) {
    return 'Escolha a data e o horário da visita.';
  }
  if (inicio.getTime() < Date.now() + 12 * HORA_MS) {
    return 'A visita precisa ser marcada com pelo menos 12 horas de antecedência. Escolha outro horário.';
  }
  return null;
}

export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const emRadianos = (graus: number) => (graus * Math.PI) / 180;
  const dLat = emRadianos(lat2 - lat1);
  const dLng = emRadianos(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(emRadianos(lat1)) * Math.cos(emRadianos(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function janelaDeCheckin(inicio: string): { de: Date; ate: Date } {
  const horario = new Date(inicio).getTime();
  return { de: new Date(horario - 15 * MINUTO_MS), ate: new Date(horario + 30 * MINUTO_MS) };
}

export interface TarefasDoRelatorio {
  alimentou: boolean;
  trocouAgua: boolean;
  limpouCaixa: boolean;
  medicou: boolean;
}

/** RN05: lista do que ainda falta para liberar o botão de concluir. */
export function pendenciasDoRelatorio(tarefas: TarefasDoRelatorio, fotos: number, precisaMedicar: boolean): string[] {
  const faltando: string[] = [];
  if (!tarefas.alimentou) faltando.push('marcar que alimentou');
  if (!tarefas.trocouAgua) faltando.push('marcar que trocou a água');
  if (!tarefas.limpouCaixa) faltando.push('marcar que limpou a caixa');
  if (precisaMedicar && !tarefas.medicou) faltando.push('marcar que medicou');
  if (fotos === 0) faltando.push('anexar pelo menos 1 foto');
  return faltando;
}

/** RN08: confere pelo relógio do celular, para apagar os dados mesmo sem internet. */
export function acessoDoCuidadorVencido(visita: Visita): boolean {
  if (['ACEITA', 'EM_ANDAMENTO'].includes(visita.situacao)) {
    return false;
  }
  if (visita.situacao === 'CONCLUIDA' && visita.concluidaEm) {
    return Date.now() >= new Date(visita.concluidaEm).getTime() + 24 * HORA_MS;
  }
  return true;
}
