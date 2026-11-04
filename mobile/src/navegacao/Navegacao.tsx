import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNavigationContainerRef, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSessao } from '../contexto/SessaoContext';
import { sincronizar } from '../servicos/filaServico';
import {
  aoTocarNaNotificacao,
  atualizarLembretesDeSaude,
  mostrarNotificacoesDaApi,
  prepararNotificacoes,
} from '../servicos/notificacaoServico';
import { baixarVisitasDoCuidador } from '../servicos/visitaServico';
import { cores, fontes } from '../tema/tema';
import { AgendaCuidadorTela } from '../telas/AgendaCuidadorTela';
import { BuscarCuidadoresTela } from '../telas/BuscarCuidadoresTela';
import { CadastroTela } from '../telas/CadastroTela';
import { CarteiraSaudeTela } from '../telas/CarteiraSaudeTela';
import { DetalheVisitaTela } from '../telas/DetalheVisitaTela';
import { EnderecoFormTela } from '../telas/EnderecoFormTela';
import { ExecucaoVisitaTela } from '../telas/ExecucaoVisitaTela';
import { GatoFormTela } from '../telas/GatoFormTela';
import { InicioTutorTela } from '../telas/InicioTutorTela';
import { ItemSaudeFormTela } from '../telas/ItemSaudeFormTela';
import { LoginTela } from '../telas/LoginTela';
import { MeusGatosTela } from '../telas/MeusGatosTela';
import { MeuPerfilTela } from '../telas/MeuPerfilTela';
import { PerfilFormTela } from '../telas/PerfilFormTela';
import { PerfilGatoTela } from '../telas/PerfilGatoTela';
import { SolicitarVisitaTela } from '../telas/SolicitarVisitaTela';
import { VisitasTela } from '../telas/VisitasTela';
import { Rotas } from './rotas';

const Pilha = createNativeStackNavigator<Rotas>();
const Abas = createBottomTabNavigator();
const referencia = createNavigationContainerRef<Rotas>();
const INTERVALO_NOTIFICACOES_MS = 60000;

const opcoesCabecalho = {
  headerStyle: { backgroundColor: cores.tinta },
  headerTintColor: cores.papel,
  headerTitleStyle: { fontFamily: fontes.titulo },
  contentStyle: { backgroundColor: cores.fundo },
};

const tema = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: cores.fundo } };

function IconeAba({ nome, cor }: { nome: 'inicio' | 'gatos' | 'busca' | 'perfil' | 'agenda'; cor: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {nome === 'inicio' ? (
        <>
          <Path d="M4 11l8-7 8 7" />
          <Path d="M6 10v9h12v-9" />
        </>
      ) : null}
      {nome === 'gatos' ? (
        <>
          <Circle cx={7} cy={9} r={2.2} />
          <Circle cx={12} cy={6.5} r={2.2} />
          <Circle cx={17} cy={9} r={2.2} />
          <Path d="M12 12c3 0 5 2.4 5 4.6 0 1.6-1.4 2.4-3 2.4h-4c-1.6 0-3-.8-3-2.4C7 14.4 9 12 12 12z" />
        </>
      ) : null}
      {nome === 'busca' ? (
        <>
          <Circle cx={11} cy={11} r={6} />
          <Path d="M16 16l4 4" />
        </>
      ) : null}
      {nome === 'perfil' ? (
        <>
          <Circle cx={12} cy={8} r={3.5} />
          <Path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
        </>
      ) : null}
      {nome === 'agenda' ? (
        <>
          <Path d="M5 6h14v14H5z" />
          <Path d="M5 10h14M9 3v4M15 3v4" />
        </>
      ) : null}
    </Svg>
  );
}

const opcoesAbas = {
  ...opcoesCabecalho,
  tabBarActiveTintColor: cores.verde,
  tabBarInactiveTintColor: cores.tintaSuave,
  tabBarLabelStyle: { fontSize: 12, fontWeight: '600' as const },
  tabBarStyle: { backgroundColor: cores.papel, borderTopColor: cores.linha, borderTopWidth: 2 },
  sceneStyle: { backgroundColor: cores.fundo },
};

function AbasTutor() {
  return (
    <Abas.Navigator screenOptions={opcoesAbas}>
      <Abas.Screen name="Inicio" component={InicioTutorTela} options={{ title: 'Início', tabBarIcon: ({ color }) => <IconeAba nome="inicio" cor={color} /> }} />
      <Abas.Screen name="Gatos" component={MeusGatosTela} options={{ title: 'Meus gatos', tabBarLabel: 'Gatos', tabBarIcon: ({ color }) => <IconeAba nome="gatos" cor={color} /> }} />
      <Abas.Screen name="Cuidadores" component={BuscarCuidadoresTela} options={{ title: 'Buscar cuidadores', tabBarLabel: 'Cuidadores', tabBarIcon: ({ color }) => <IconeAba nome="busca" cor={color} /> }} />
      <Abas.Screen name="Perfil" component={MeuPerfilTela} options={{ title: 'Meu perfil', tabBarLabel: 'Perfil', tabBarIcon: ({ color }) => <IconeAba nome="perfil" cor={color} /> }} />
    </Abas.Navigator>
  );
}

function AbasCuidador() {
  return (
    <Abas.Navigator screenOptions={opcoesAbas}>
      <Abas.Screen name="Agenda" component={AgendaCuidadorTela} options={{ title: 'Minha agenda', tabBarLabel: 'Agenda', tabBarIcon: ({ color }) => <IconeAba nome="agenda" cor={color} /> }} />
      <Abas.Screen name="Perfil" component={MeuPerfilTela} options={{ title: 'Meu perfil', tabBarLabel: 'Perfil', tabBarIcon: ({ color }) => <IconeAba nome="perfil" cor={color} /> }} />
    </Abas.Navigator>
  );
}

export function Navegacao() {
  const { usuario } = useSessao();
  const id = usuario?.id;
  const ehTutor = usuario?.perfil === 'TUTOR';

  useEffect(() => {
    if (!id) {
      return;
    }
    const verificar = () => {
      sincronizar();
      mostrarNotificacoesDaApi();
      if (!ehTutor) {
        baixarVisitasDoCuidador().catch(() => {});
      }
    };
    prepararNotificacoes().then(() => {
      verificar();
      if (ehTutor) {
        atualizarLembretesDeSaude();
      }
    });
    const relogio = setInterval(mostrarNotificacoesDaApi, INTERVALO_NOTIFICACOES_MS);
    const aparencia = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        verificar();
      }
    });
    const pararToque = aoTocarNaNotificacao((dados) => {
      if (!referencia.isReady()) {
        return;
      }
      if (typeof dados.visitaId === 'number') {
        referencia.navigate('DetalheVisita', { visitaId: dados.visitaId });
      } else if (typeof dados.gatoId === 'number') {
        referencia.navigate('CarteiraSaude', { gatoId: dados.gatoId, gatoNome: String(dados.gatoNome ?? '') });
      }
    });
    return () => {
      clearInterval(relogio);
      aparencia.remove();
      pararToque();
    };
  }, [id, ehTutor]);

  return (
    <NavigationContainer ref={referencia} theme={tema}>
      <Pilha.Navigator screenOptions={opcoesCabecalho}>
        {!usuario ? (
          <>
            <Pilha.Screen name="Login" component={LoginTela} options={{ title: 'CatLog' }} />
            <Pilha.Screen name="Cadastro" component={CadastroTela} options={{ title: 'Criar conta' }} />
          </>
        ) : (
          <>
            <Pilha.Screen name="Abas" component={ehTutor ? AbasTutor : AbasCuidador} options={{ headerShown: false }} />
            <Pilha.Screen name="DetalheVisita" component={DetalheVisitaTela} options={{ title: 'Detalhe da visita' }} />
            <Pilha.Screen name="Visitas" component={VisitasTela} options={{ title: 'Minhas visitas' }} />
            <Pilha.Screen name="PerfilForm" component={PerfilFormTela} options={{ title: 'Editar dados' }} />
            <Pilha.Screen name="EnderecoForm" component={EnderecoFormTela} options={{ title: 'Endereço' }} />
            {ehTutor ? (
              <>
                <Pilha.Screen name="PerfilGato" component={PerfilGatoTela} options={{ title: 'Perfil do gato' }} />
                <Pilha.Screen name="GatoForm" component={GatoFormTela} options={{ title: 'Dados do gato' }} />
                <Pilha.Screen name="CarteiraSaude" component={CarteiraSaudeTela} options={{ title: 'Carteira de saúde' }} />
                <Pilha.Screen name="ItemSaudeForm" component={ItemSaudeFormTela} options={{ title: 'Cuidado de saúde' }} />
                <Pilha.Screen name="SolicitarVisita" component={SolicitarVisitaTela} options={{ title: 'Solicitar visita' }} />
              </>
            ) : (
              <Pilha.Screen name="ExecucaoVisita" component={ExecucaoVisitaTela} options={{ title: 'Execução da visita' }} />
            )}
          </>
        )}
      </Pilha.Navigator>
    </NavigationContainer>
  );
}
