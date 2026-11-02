import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  Avatar,
  Bloco,
  Botao,
  Carregando,
  ErroComAcao,
  estilos,
  Intro,
  Nota,
  Tela,
} from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { PropsTela } from '../navegacao/rotas';
import { dataCurta, descricaoDoGato, numero } from '../servicos/formatacao';
import { buscarGato, excluirGato } from '../servicos/gatoServico';
import { fontes } from '../tema/tema';

export function PerfilGatoTela({ route, navigation }: PropsTela<'PerfilGato'>) {
  const { gatoId } = route.params;
  const { dados: gato, carregando, erro, recarregar } = useDados(useCallback(() => buscarGato(gatoId), [gatoId]));
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  function confirmarExclusao() {
    Alert.alert('Excluir gato', `Tem certeza que quer excluir ${gato?.nome}? O histórico de saúde também será apagado.`, [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirGato(gatoId);
            navigation.goBack();
          } catch (falha) {
            setErroExcluir((falha as Error).message);
          }
        },
      },
    ]);
  }

  if (!gato) {
    return (
      <Tela>
        {carregando ? <Carregando /> : null}
        {erro ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      </Tela>
    );
  }

  return (
    <Tela atualizando={carregando} aoAtualizar={recarregar}>
      <View style={[estilos.centro, { marginBottom: 14 }]}>
        <Avatar nome={gato.nome} fotoUrl={gato.fotoUrl} tamanho={96} />
        <Text style={{ fontFamily: fontes.titulo, fontSize: 21, marginTop: 8 }} accessibilityRole="header">
          {gato.nome}
        </Text>
        <Intro>{descricaoDoGato(gato)}</Intro>
      </View>
      {gato.situacaoSaude === 'VENCIDO' ? <Nota tom="erro" titulo="Cuidado de saúde vencido">Abra a carteira de saúde para ver o que está atrasado.</Nota> : null}
      {gato.situacaoSaude === 'A_VENCER' ? <Nota titulo="Cuidado de saúde a vencer">Há uma dose nos próximos 7 dias.</Nota> : null}
      <Bloco
        titulo="Peso atual"
        info={gato.pesoAtualKg !== null ? `${numero(Number(gato.pesoAtualKg), 2)} kg, medido em ${dataCurta(gato.pesoMedidoEm)}` : 'Nenhum peso registrado'}
      />
      <Bloco titulo="Cuidados especiais" info={gato.cuidadosEspeciais || 'Nenhum cuidado especial registrado.'} />
      {erroExcluir ? <Nota tom="erro">{erroExcluir}</Nota> : null}
      <Botao titulo="Abrir carteira de saúde" aoTocar={() => navigation.navigate('CarteiraSaude', { gatoId, gatoNome: gato.nome })} />
      <Botao titulo="Editar dados" variante="secundario" aoTocar={() => navigation.navigate('GatoForm', { gato })} />
      <Botao titulo="Excluir gato" variante="perigo" aoTocar={confirmarExclusao} />
    </Tela>
  );
}
