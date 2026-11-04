export type Perfil = 'TUTOR' | 'CUIDADOR';
export type Sexo = 'MACHO' | 'FEMEA';
export type TipoItemSaude = 'VACINA' | 'VERMIFUGO' | 'REMEDIO';
export type SituacaoSaude = 'EM_DIA' | 'A_VENCER' | 'VENCIDO';
export type SituacaoVisita =
  | 'SOLICITADA'
  | 'ACEITA'
  | 'RECUSADA'
  | 'CANCELADA'
  | 'EXPIRADA'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA';

export interface Pagina<T> {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  total: number;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  perfil: Perfil;
  apresentacao: string | null;
  raioAtendimentoKm: number;
  criadoEm: string;
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}

export interface EnderecoDados {
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  principal: boolean;
}

export interface Endereco extends EnderecoDados {
  id: number;
  latitude: number | null;
  longitude: number | null;
}

export interface GatoDados {
  nome: string;
  raca?: string | null;
  sexo: Sexo;
  dataNascimento?: string | null;
  fotoUrl?: string | null;
  cuidadosEspeciais?: string | null;
}

export interface Gato extends GatoDados {
  id: number;
  pesoAtualKg: number | null;
  pesoMedidoEm: string | null;
  situacaoSaude: SituacaoSaude;
  tomaRemedio: boolean;
}

export interface ItemSaudeDados {
  tipo: TipoItemSaude;
  nome: string;
  dataAplicacao: string;
  proximaDose?: string | null;
  instrucoes?: string | null;
}

export interface ItemSaude extends ItemSaudeDados {
  id: number;
  gatoId: number;
  situacao: SituacaoSaude;
}

export interface RegistroPeso {
  id: number;
  pesoKg: number;
  dataMedicao: string;
  variacaoPercentual: number | null;
  alerta: boolean;
}

export interface Cuidador {
  id: number;
  nome: string;
  apresentacao: string | null;
  raioAtendimentoKm: number;
  distanciaKm: number;
}

export interface Pessoa {
  id: number;
  nome: string;
  telefone: string;
}

export interface GatoDetalheVisita {
  id: number;
  nome: string;
  raca: string | null;
  sexo: Sexo;
  dataNascimento: string | null;
  fotoUrl: string | null;
  cuidadosEspeciais: string | null;
  tomaRemedio: boolean;
  itensSaude: ItemSaude[];
}

export interface Relatorio {
  alimentou: boolean;
  trocouAgua: boolean;
  limpouCaixa: boolean;
  medicou: boolean;
  observacoes: string | null;
  registradoEm: string;
  fotos: string[];
}

export interface Visita {
  id: number;
  situacao: SituacaoVisita;
  inicio: string;
  fim: string;
  duracaoMinutos: number;
  instrucoes: string | null;
  tutor: Pessoa;
  cuidador: Pessoa;
  endereco: Endereco;
  gatos: { id: number; nome: string; fotoUrl: string | null }[];
  motivoCancelamento: string | null;
  canceladaPor: Perfil | null;
  checkinEm: string | null;
  concluidaEm: string | null;
  podeCancelar: boolean;
  dadosGatosLiberados: boolean;
  precisaMedicar: boolean;
  dadosGatos: GatoDetalheVisita[] | null;
  relatorio: Relatorio | null;
  /** Só existe no celular: a ação foi registrada sem internet e ainda não chegou à API. */
  aguardandoEnvio?: boolean;
}

export interface AlertaSaude {
  gatoId: number;
  gatoNome: string;
  itemId: number;
  itemNome: string;
  situacao: SituacaoSaude;
  proximaDose: string;
}

export interface ResumoTutor {
  alertas: AlertaSaude[];
  proximaVisita: Visita | null;
  ultimaVisita: Visita | null;
  nomesGatos: string[];
}

export interface ResumoCuidador {
  visitasHoje: Visita[];
  pendentes: number;
  concluidasMes: number;
  agendadasMes: number;
}

export interface Notificacao {
  id: number;
  visitaId: number | null;
  titulo: string;
  mensagem: string;
}
