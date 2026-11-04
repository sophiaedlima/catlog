import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../dados/api';
import { Gato, ItemSaude, Notificacao, Pagina } from '../tipos/modelos';
import { lerDataIso } from './formatacao';

const CANAL = 'catlog';
const HORA_DO_LEMBRETE = 9;
const DIAS_ANTES = 7;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function prepararNotificacoes() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Lembretes e visitas',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const atual = await Notifications.getPermissionsAsync();
  if (!atual.granted) {
    await Notifications.requestPermissionsAsync();
  }
}

async function agendarLembrete(gato: Gato, item: ItemSaude, data: Date, mensagem: string) {
  if (data.getTime() <= Date.now()) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Lembrete de saúde: ${gato.nome}`,
      body: mensagem,
      data: { gatoId: gato.id, gatoNome: gato.nome },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: data, channelId: CANAL },
  });
}

/** RF08 e RN04: lembretes 7 dias antes e no dia. Ficam no próprio celular, então funcionam sem internet. */
export async function atualizarLembretesDeSaude() {
  try {
    const { itens: gatos } = await api.get<Pagina<Gato>>('/api/gatos?tamanho=100');
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const gato of gatos) {
      const itens = await api.get<ItemSaude[]>(`/api/gatos/${gato.id}/itens-saude`);
      for (const item of itens) {
        if (!item.proximaDose) {
          continue;
        }
        const noDia = lerDataIso(item.proximaDose);
        noDia.setHours(HORA_DO_LEMBRETE);
        const antes = new Date(noDia);
        antes.setDate(antes.getDate() - DIAS_ANTES);
        await agendarLembrete(gato, item, antes, `${item.nome} vence em ${DIAS_ANTES} dias.`);
        await agendarLembrete(gato, item, noDia, `${item.nome} vence hoje.`);
      }
    }
  } catch {
    // Sem conexão, os lembretes já agendados continuam valendo até a próxima atualização.
  }
}

/** RF19: mostra no celular as mudanças de situação das visitas que a API guardou para este usuário. */
export async function mostrarNotificacoesDaApi() {
  try {
    const pendentes = await api.post<Notificacao[]>('/api/notificacoes/entregar');
    for (const aviso of pendentes) {
      await Notifications.scheduleNotificationAsync({
        content: { title: aviso.titulo, body: aviso.mensagem, data: { visitaId: aviso.visitaId } },
        trigger: { channelId: CANAL },
      });
    }
  } catch {
    // Tenta de novo na próxima verificação.
  }
}

export function aoTocarNaNotificacao(funcao: (dados: Record<string, unknown>) => void) {
  const inscricao = Notifications.addNotificationResponseReceivedListener((resposta) => {
    funcao(resposta.notification.request.content.data as Record<string, unknown>);
  });
  return () => inscricao.remove();
}

export async function cancelarTodasAsNotificacoes() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
