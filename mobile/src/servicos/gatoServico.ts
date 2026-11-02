import { api } from '../dados/api';
import { lerDoGato, lerLinhas, substituirDoGato, substituirLinhas } from '../dados/bancoLocal';
import {
  Gato,
  GatoDados,
  ItemSaude,
  ItemSaudeDados,
  Pagina,
  RegistroPeso,
} from '../tipos/modelos';
import { comCopiaLocal } from './comCopiaLocal';
import { lerDataIso } from './formatacao';
import { atualizarLembretesDeSaude } from './notificacaoServico';

const TAMANHO_PAGINA_GATOS = 100;

export function listarGatos() {
  return comCopiaLocal(
    async () => {
      const pagina = await api.get<Pagina<Gato>>(`/api/gatos?tamanho=${TAMANHO_PAGINA_GATOS}`);
      return pagina.itens;
    },
    (gatos) => substituirLinhas('gato', gatos.map((g) => ({ id: g.id, dados: g }))),
    async () => {
      const gatos = await lerLinhas<Gato>('gato');
      return gatos.length ? gatos.sort((a, b) => a.nome.localeCompare(b.nome)) : null;
    },
  );
}

export async function buscarGato(id: number) {
  return comCopiaLocal(
    () => api.get<Gato>(`/api/gatos/${id}`),
    async () => {},
    async () => (await lerLinhas<Gato>('gato')).find((g) => g.id === id) ?? null,
  );
}

export function salvarGato(id: number | undefined, dados: GatoDados) {
  return id ? api.put<Gato>(`/api/gatos/${id}`, dados) : api.post<Gato>('/api/gatos', dados);
}

export async function excluirGato(id: number) {
  await api.delete(`/api/gatos/${id}`);
  await atualizarLembretesDeSaude();
}

export function listarItensSaude(gatoId: number) {
  return comCopiaLocal(
    () => api.get<ItemSaude[]>(`/api/gatos/${gatoId}/itens-saude`),
    (itens) => substituirDoGato('item_saude', gatoId, itens),
    async () => {
      const itens = await lerDoGato<ItemSaude>('item_saude', gatoId);
      return itens.length ? itens : null;
    },
  );
}

export function validarItemSaude(dados: ItemSaudeDados): string | null {
  if (!dados.nome.trim()) return 'Informe o nome do cuidado.';
  if (!dados.dataAplicacao) return 'Informe a data de aplicação.';
  if (dados.tipo !== 'REMEDIO' && !dados.proximaDose) return 'Informe a data da próxima dose.';
  if (dados.proximaDose && lerDataIso(dados.proximaDose) < lerDataIso(dados.dataAplicacao)) {
    return 'A próxima dose não pode ser antes da data de aplicação.';
  }
  return null;
}

export async function salvarItemSaude(gatoId: number, id: number | undefined, dados: ItemSaudeDados) {
  const salvo = id
    ? await api.put<ItemSaude>(`/api/gatos/${gatoId}/itens-saude/${id}`, dados)
    : await api.post<ItemSaude>(`/api/gatos/${gatoId}/itens-saude`, dados);
  await atualizarLembretesDeSaude();
  return salvo;
}

export async function excluirItemSaude(gatoId: number, id: number) {
  await api.delete(`/api/gatos/${gatoId}/itens-saude/${id}`);
  await atualizarLembretesDeSaude();
}

export function listarPesos(gatoId: number) {
  return comCopiaLocal(
    () => api.get<RegistroPeso[]>(`/api/gatos/${gatoId}/pesos`),
    (pesos) => substituirDoGato('registro_peso', gatoId, pesos),
    async () => {
      const pesos = await lerDoGato<RegistroPeso>('registro_peso', gatoId);
      return pesos.length ? pesos : null;
    },
  );
}

export function validarPeso(texto: string): string | null {
  const valor = Number(texto.replace(',', '.'));
  if (!texto.trim() || Number.isNaN(valor)) return 'Informe o peso em quilos.';
  if (valor < 0.5 || valor > 15) return 'O peso precisa estar entre 0,5 e 15 kg.';
  return null;
}

export function registrarPeso(gatoId: number, pesoKg: number, dataMedicao: string) {
  return api.post<RegistroPeso>(`/api/gatos/${gatoId}/pesos`, { pesoKg, dataMedicao });
}

export function excluirPeso(gatoId: number, id: number) {
  return api.delete(`/api/gatos/${gatoId}/pesos/${id}`);
}

export async function enviarFoto(uri: string): Promise<string> {
  const formulario = new FormData();
  formulario.append('arquivo', { uri, name: 'foto.jpg', type: 'image/jpeg' } as unknown as Blob);
  const { url } = await api.post<{ url: string }>('/api/fotos', formulario);
  return url;
}
