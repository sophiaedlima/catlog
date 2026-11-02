import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Avatar, Botao, Carregando, ErroComAcao, Intro, ItemLista, Opcoes, Rotulo, Tela, Vazio } from '../componentes/Interface';
import { online, useDados } from '../componentes/useDados';
import { Rotas } from '../navegacao/rotas';
import { listarEnderecos } from '../servicos/contaServico';
import { numero } from '../servicos/formatacao';
import { buscarCuidadores } from '../servicos/visitaServico';

export function BuscarCuidadoresTela() {
  const navigation = useNavigation<NativeStackNavigationProp<Rotas>>();
  const [enderecoId, setEnderecoId] = useState<number | null>(null);
  const [distancia, setDistancia] = useState(5);
  const [ordem, setOrdem] = useState<'distancia' | 'nome'>('distancia');

  const enderecos = useDados(listarEnderecos);
  const listaEnderecos = enderecos.dados;

  useEffect(() => {
    if (listaEnderecos?.length && !listaEnderecos.some((e) => e.id === enderecoId)) {
      setEnderecoId(listaEnderecos[0].id);
    }
  }, [listaEnderecos, enderecoId]);

  const carregarCuidadores = useCallback(async () => {
    if (!enderecoId) {
      return online([]);
    }
    const pagina = await buscarCuidadores(enderecoId, distancia, ordem);
    return online(pagina.itens);
  }, [enderecoId, distancia, ordem]);
  const cuidadores = useDados(carregarCuidadores);

  if (listaEnderecos && listaEnderecos.length === 0) {
    return (
      <Tela>
        <Vazio texto="Cadastre um endereço para encontrar quem atende perto de você." />
        <Botao titulo="Cadastrar endereço" aoTocar={() => navigation.navigate('EnderecoForm')} />
      </Tela>
    );
  }

  const enderecoAtual = listaEnderecos?.find((e) => e.id === enderecoId);

  return (
    <Tela atualizando={cuidadores.carregando && !!cuidadores.dados} aoAtualizar={cuidadores.recarregar}>
      {enderecoAtual ? <Intro>Quem atende perto de {enderecoAtual.logradouro}, {enderecoAtual.numero}, {enderecoAtual.bairro}.</Intro> : null}
      {listaEnderecos && listaEnderecos.length > 1 ? (
        <Opcoes
          rotulo="Endereço"
          valor={enderecoId ?? 0}
          aoMudar={setEnderecoId}
          opcoes={listaEnderecos.map((e) => ({ valor: e.id, texto: e.apelido }))}
        />
      ) : null}
      <Opcoes
        rotulo="Distância máxima"
        valor={distancia}
        aoMudar={setDistancia}
        opcoes={[
          { valor: 5, texto: 'Até 5 km' },
          { valor: 10, texto: 'Até 10 km' },
          { valor: 20, texto: 'Até 20 km' },
        ]}
      />
      <Opcoes
        rotulo="Ordenar por"
        valor={ordem}
        aoMudar={setOrdem}
        opcoes={[
          { valor: 'distancia', texto: 'Menor distância' },
          { valor: 'nome', texto: 'Nome' },
        ]}
      />
      {enderecos.erro && !listaEnderecos ? <ErroComAcao mensagem={enderecos.erro} aoTentar={enderecos.recarregar} /> : null}
      {cuidadores.carregando ? <Carregando texto="Procurando cuidadores..." /> : null}
      {!cuidadores.carregando && cuidadores.erro ? <ErroComAcao mensagem={cuidadores.erro} aoTentar={cuidadores.recarregar} /> : null}
      {!cuidadores.carregando && !cuidadores.erro && enderecoId && cuidadores.dados?.length === 0 ? (
        <Vazio texto="Nenhum cuidador nesta distância. Aumente o filtro para ver mais pessoas." />
      ) : null}
      {!cuidadores.carregando
        ? cuidadores.dados?.map((c) => (
            <ItemLista
              key={c.id}
              titulo={c.nome}
              subtitulo={[c.apresentacao, `atende até ${c.raioAtendimentoKm} km`].filter(Boolean).join(', ')}
              esquerda={<Avatar nome={c.nome} />}
              direita={<Rotulo texto={`${numero(c.distanciaKm)} km`} tom="neutro" />}
              aoTocar={() =>
                navigation.navigate('SolicitarVisita', {
                  cuidadorId: c.id,
                  cuidadorNome: c.nome,
                  enderecoId: enderecoId ?? undefined,
                })
              }
            />
          ))
        : null}
    </Tela>
  );
}
