import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Endereco, Gato, ItemSaude } from '../tipos/modelos';

export type Rotas = {
  Login: undefined;
  Cadastro: undefined;
  Abas: undefined;
  PerfilGato: { gatoId: number };
  GatoForm: { gato?: Gato } | undefined;
  CarteiraSaude: { gatoId: number; gatoNome: string };
  ItemSaudeForm: { gatoId: number; item?: ItemSaude };
  SolicitarVisita: { cuidadorId: number; cuidadorNome: string; enderecoId?: number };
  DetalheVisita: { visitaId: number };
  ExecucaoVisita: { visitaId: number };
  Visitas: undefined;
  PerfilForm: undefined;
  EnderecoForm: { endereco?: Endereco } | undefined;
};

export type PropsTela<T extends keyof Rotas> = NativeStackScreenProps<Rotas, T>;
