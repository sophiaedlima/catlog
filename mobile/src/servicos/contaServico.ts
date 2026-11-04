import { api } from '../dados/api';
import { lerConsulta, salvarConsulta } from '../dados/bancoLocal';
import { Endereco, EnderecoDados, Perfil, Sessao, Usuario } from '../tipos/modelos';
import { comCopiaLocal } from './comCopiaLocal';

export function validarCadastro(nome: string, email: string, telefone: string, senha: string): string | null {
  if (!nome.trim()) return 'Informe seu nome.';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Informe um e-mail válido.';
  if (telefone.replace(/\D/g, '').length < 10) return 'Informe um telefone com DDD.';
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  return null;
}

export function entrar(email: string, senha: string) {
  return api.post<Sessao>('/api/auth/login', { email, senha });
}

export function cadastrar(dados: { nome: string; email: string; telefone: string; senha: string; perfil: Perfil }) {
  return api.post<Sessao>('/api/auth/cadastro', dados);
}

export function atualizarPerfil(dados: {
  nome: string;
  telefone: string;
  apresentacao?: string | null;
  raioAtendimentoKm?: number;
}) {
  return api.put<Usuario>('/api/me', dados);
}

export function excluirConta() {
  return api.delete('/api/me');
}

export function listarEnderecos() {
  return comCopiaLocal(
    () => api.get<Endereco[]>('/api/enderecos'),
    (dados) => salvarConsulta('enderecos', dados),
    () => lerConsulta<Endereco[]>('enderecos'),
  );
}

export function salvarEndereco(id: number | undefined, dados: EnderecoDados) {
  return id ? api.put<Endereco>(`/api/enderecos/${id}`, dados) : api.post<Endereco>('/api/enderecos', dados);
}

export function excluirEndereco(id: number) {
  return api.delete(`/api/enderecos/${id}`);
}
