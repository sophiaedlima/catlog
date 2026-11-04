import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  Avatar,
  Bloco,
  Botao,
  Carregando,
  ErroComAcao,
  estilos,
  Intro,
  ItemLista,
  Nota,
  Rotulo,
  Secao,
  Tela,
  Vazio,
} from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { useConexao } from '../contexto/ConexaoContext';
import { useSessao } from '../contexto/SessaoContext';
import { Rotas } from '../navegacao/rotas';
import { excluirConta, listarEnderecos } from '../servicos/contaServico';
import { mascararTelefone } from '../servicos/formatacao';
import { fontes } from '../tema/tema';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function MeuPerfilTela() {
  const navigation = useNavigation<NativeStackNavigationProp<Rotas>>();
  const { usuario, encerrarSessao } = useSessao();
  const { pendentes } = useConexao();
  const { dados: enderecos, carregando, erro, recarregar } = useDados(listarEnderecos);
  const [erroConta, setErroConta] = useState<string | null>(null);

  if (!usuario) {
    return null;
  }
  const desde = new Date(usuario.criadoEm);

  function sair() {
    const aviso = pendentes > 0
      ? `Você tem ${pendentes} ${pendentes === 1 ? 'envio guardado' : 'envios guardados'} no celular que ainda não chegaram ao servidor. Se sair agora, eles serão perdidos.`
      : 'Quer mesmo sair da sua conta?';
    Alert.alert('Sair da conta', aviso, [
      { text: 'Ficar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: encerrarSessao },
    ]);
  }

  function excluir() {
    Alert.alert('Excluir conta', 'Sua conta e todos os seus dados serão apagados para sempre. Quer continuar?', [
      { text: 'Manter conta', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirConta();
            await encerrarSessao();
          } catch (falha) {
            setErroConta((falha as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <Tela atualizando={carregando && !!enderecos} aoAtualizar={recarregar}>
      <View style={[estilos.centro, { marginBottom: 14 }]}>
        <Avatar nome={usuario.nome} tamanho={84} />
        <Text style={{ fontFamily: fontes.titulo, fontSize: 21, marginTop: 8 }} accessibilityRole="header">
          {usuario.nome}
        </Text>
        <Intro>
          {usuario.perfil === 'TUTOR' ? 'Tutor' : 'Cuidador'}, desde {MESES[desde.getMonth()]} de {desde.getFullYear()}
        </Intro>
      </View>
      <Bloco titulo="E-mail" info={usuario.email} />
      <Bloco titulo="Telefone" info={mascararTelefone(usuario.telefone)} />
      {usuario.perfil === 'CUIDADOR' ? (
        <>
          <Bloco titulo="Apresentação" info={usuario.apresentacao || 'Conte um pouco sobre você para os tutores.'} />
          <Bloco titulo="Raio de atendimento" info={`Até ${usuario.raioAtendimentoKm} km`} />
        </>
      ) : null}
      <Botao titulo="Editar dados" variante="secundario" aoTocar={() => navigation.navigate('PerfilForm')} />

      <Secao>Meus endereços</Secao>
      {carregando && !enderecos ? <Carregando /> : null}
      {erro && !enderecos ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      {enderecos?.length === 0 ? <Vazio texto="Nenhum endereço cadastrado ainda." /> : null}
      {enderecos?.map((endereco) => (
        <ItemLista
          key={endereco.id}
          titulo={endereco.apelido}
          subtitulo={`${endereco.logradouro}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}${endereco.latitude === null ? '. Não localizado no mapa, confira a rua e o número.' : ''}`}
          direita={endereco.principal ? <Rotulo texto="Principal" tom="neutro" /> : undefined}
          aoTocar={() => navigation.navigate('EnderecoForm', { endereco })}
        />
      ))}
      <Botao titulo="Adicionar endereço" variante="secundario" aoTocar={() => navigation.navigate('EnderecoForm')} />

      <Secao>Conta</Secao>
      {usuario.perfil === 'CUIDADOR' ? (
        <Botao titulo="Histórico de visitas" variante="secundario" aoTocar={() => navigation.navigate('Visitas')} />
      ) : null}
      {erroConta ? <Nota tom="erro">{erroConta}</Nota> : null}
      <Botao titulo="Sair da conta" variante="perigo" aoTocar={sair} />
      <Botao titulo="Excluir minha conta" variante="perigo" aoTocar={excluir} />
    </Tela>
  );
}
