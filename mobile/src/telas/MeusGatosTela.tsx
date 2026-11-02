import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Avatar, Botao, Campo, Carregando, ErroComAcao, ItemLista, Rotulo, Tela, Vazio } from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { Rotas } from '../navegacao/rotas';
import { descricaoDoGato, TEXTO_SITUACAO_SAUDE, TOM_SITUACAO_SAUDE } from '../servicos/formatacao';
import { listarGatos } from '../servicos/gatoServico';

export function MeusGatosTela() {
  const navigation = useNavigation<NativeStackNavigationProp<Rotas>>();
  const { dados, carregando, erro, recarregar } = useDados(listarGatos);
  const [busca, setBusca] = useState('');

  const termo = busca.trim().toLowerCase();
  const achados = (dados ?? []).filter((g) => g.nome.toLowerCase().includes(termo));

  return (
    <Tela atualizando={carregando && !!dados} aoAtualizar={recarregar}>
      <Campo rotulo="Buscar por nome" value={busca} onChangeText={setBusca} placeholder="Digite o nome do gato" />
      {carregando && !dados ? <Carregando texto="Carregando seus gatos..." /> : null}
      {erro && !dados ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      {dados && achados.length === 0 ? (
        <Vazio
          texto={
            termo
              ? 'Nenhum gato com esse nome. Tente outro ou cadastre um gato novo.'
              : 'Você ainda não cadastrou nenhum gato. Que tal começar agora?'
          }
        />
      ) : null}
      {achados.map((gato) => (
        <ItemLista
          key={gato.id}
          titulo={gato.nome}
          subtitulo={descricaoDoGato(gato)}
          esquerda={<Avatar nome={gato.nome} fotoUrl={gato.fotoUrl} />}
          direita={<Rotulo texto={TEXTO_SITUACAO_SAUDE[gato.situacaoSaude]} tom={TOM_SITUACAO_SAUDE[gato.situacaoSaude]} />}
          aoTocar={() => navigation.navigate('PerfilGato', { gatoId: gato.id })}
        />
      ))}
      <Botao titulo="Cadastrar gato" aoTocar={() => navigation.navigate('GatoForm')} />
    </Tela>
  );
}
