import * as SecureStore from 'expo-secure-store';
import { Sessao } from '../tipos/modelos';

const CHAVE = 'catlog.sessao';

export async function lerSessao(): Promise<Sessao | null> {
  const salvo = await SecureStore.getItemAsync(CHAVE);
  return salvo ? (JSON.parse(salvo) as Sessao) : null;
}

export async function salvarSessao(sessao: Sessao) {
  await SecureStore.setItemAsync(CHAVE, JSON.stringify(sessao));
}

export async function apagarSessao() {
  await SecureStore.deleteItemAsync(CHAVE);
}
