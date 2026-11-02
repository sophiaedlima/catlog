import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Avatar,
  Botao,
  Carregando,
  ErroComAcao,
  estilos,
  Intro,
  ItemLista,
  Nota,
  Opcoes,
  Rotulo,
  Secao,
  Tela,
  TituloGrande,
  Vazio,
} from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { useConexao } from '../contexto/ConexaoContext';
import { useSessao } from '../contexto/SessaoContext';
import { Rotas } from '../navegacao/rotas';
import { AcaoComErro, descartarAcao, listarComErro, sincronizar } from '../servicos/filaServico';
import { periodoDaVisita, TEXTO_SITUACAO_VISITA, TOM_SITUACAO_VISITA } from '../servicos/formatacao';
import { apagarDadosVencidosDoCuidador, listarVisitas, resumoCuidador } from '../servicos/visitaServico';
import { cores, fontes } from '../tema/tema';
import { SituacaoVisita, Visita } from '../tipos/modelos';

type FiltroSituacao = 'TODAS' | 'SOLICITADA' | 'ACEITA' | 'CONCLUIDA';
type FiltroPeriodo = 'HOJE' | 'SEMANA' | 'MES' | 'TUDO';

function limitesDoPeriodo(periodo: FiltroPeriodo): { de?: Date; ate?: Date } {
  if (periodo === 'TUDO') {
    return {};
  }
  const de = new Date();
  de.setHours(0, 0, 0, 0);
  const ate = new Date(de);
  if (periodo === 'HOJE') {
    ate.setDate(ate.getDate() + 1);
  } else if (periodo === 'SEMANA') {
    ate.setDate(ate.getDate() + 7);
  } else {
    de.setDate(1);
    ate.setMonth(de.getMonth() + 1, 1);
  }
  return { de, ate };
}

const SITUACOES: Record<FiltroSituacao, SituacaoVisita[] | undefined> = {
  TODAS: undefined,
  SOLICITADA: ['SOLICITADA'],
  ACEITA: ['ACEITA', 'EM_ANDAMENTO'],
  CONCLUIDA: ['CONCLUIDA'],
};

export function AgendaCuidadorTela() {
  const navigation = useNavigation<NativeStackNavigationProp<Rotas>>();
  const { usuario } = useSessao();
  const { pendentes } = useConexao();
  const [situacao, setSituacao] = useState<FiltroSituacao>('TODAS');
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('SEMANA');
  const [comErro, setComErro] = useState<AcaoComErro[]>([]);

  const resumo = useDados(resumoCuidador);
  const carregarVisitas = useCallback(async () => {
    await apagarDadosVencidosDoCuidador();
    await sincronizar();
    setComErro(await listarComErro());
    return listarVisitas({ situacoes: SITUACOES[situacao], ...limitesDoPeriodo(periodo) });
  }, [situacao, periodo]);
  const visitas = useDados(carregarVisitas);

  useEffect(() => {
    listarComErro().then(setComErro);
  }, [pendentes]);

  const recarregarTudo = () => {
    resumo.recarregar();
    visitas.recarregar();
  };

  const ordenadas: Visita[] = [...(visitas.dados ?? [])].sort((a, b) => a.inicio.localeCompare(b.inicio));

  return (
    <Tela atualizando={visitas.carregando && !!visitas.dados} aoAtualizar={recarregarTudo}>
      <TituloGrande>Oi, {usuario?.nome.split(' ')[0]}</TituloGrande>
      {resumo.dados ? (
        <>
          <Intro>
            {resumo.dados.visitasHoje.length === 0
              ? 'Nenhuma visita para hoje.'
              : `${resumo.dados.visitasHoje.length} ${resumo.dados.visitasHoje.length === 1 ? 'visita' : 'visitas'} hoje.`}
            {resumo.dados.pendentes > 0 ? ` ${resumo.dados.pendentes} ${resumo.dados.pendentes === 1 ? 'pedido aguarda' : 'pedidos aguardam'} sua resposta.` : ''}
          </Intro>
          <View style={[estilos.entre, { marginBottom: 8 }]} accessible accessibilityLabel={`Neste mês: ${resumo.dados.concluidasMes} visitas concluídas e ${resumo.dados.agendadasMes} agendadas.`}>
            <Indicador valor={resumo.dados.concluidasMes} texto="concluídas no mês" />
            <Indicador valor={resumo.dados.agendadasMes} texto="agendadas no mês" />
          </View>
        </>
      ) : null}
      {comErro.map((acao) => (
        <Nota key={acao.id} tom="erro" titulo={`Não foi possível enviar ${acao.tipo === 'RELATORIO' ? 'o relatório' : 'o check-in'}`}>
          <Text style={{ color: cores.tinta }}>{acao.erro}</Text>
          <Botao titulo="Descartar" variante="perigo" aoTocar={() => descartarAcao(acao.id).then(recarregarTudo)} />
        </Nota>
      ))}
      <Opcoes
        rotulo="Situação"
        valor={situacao}
        aoMudar={setSituacao}
        opcoes={[
          { valor: 'TODAS', texto: 'Todas' },
          { valor: 'SOLICITADA', texto: 'Pedidos' },
          { valor: 'ACEITA', texto: 'Confirmadas' },
          { valor: 'CONCLUIDA', texto: 'Concluídas' },
        ]}
      />
      <Opcoes
        rotulo="Período"
        valor={periodo}
        aoMudar={setPeriodo}
        opcoes={[
          { valor: 'HOJE', texto: 'Hoje' },
          { valor: 'SEMANA', texto: '7 dias' },
          { valor: 'MES', texto: 'Mês' },
          { valor: 'TUDO', texto: 'Tudo' },
        ]}
      />
      <Secao>Visitas</Secao>
      {visitas.carregando && !visitas.dados ? <Carregando texto="Carregando sua agenda..." /> : null}
      {visitas.erro && !visitas.dados ? <ErroComAcao mensagem={visitas.erro} aoTentar={visitas.recarregar} /> : null}
      {visitas.dados && ordenadas.length === 0 ? <Vazio texto="Nenhuma visita com esses filtros. Experimente mudar o período." /> : null}
      {ordenadas.map((visita) => (
        <ItemLista
          key={visita.id}
          titulo={periodoDaVisita(visita.inicio, visita.fim)}
          subtitulo={`${visita.tutor.nome}, com ${visita.gatos.map((g) => g.nome).join(' e ')}. ${visita.endereco.bairro}.${visita.aguardandoEnvio ? ' Aguardando envio.' : ''}`}
          esquerda={<Avatar nome={visita.tutor.nome} />}
          direita={<Rotulo texto={TEXTO_SITUACAO_VISITA[visita.situacao]} tom={TOM_SITUACAO_VISITA[visita.situacao]} />}
          aoTocar={() => navigation.navigate('DetalheVisita', { visitaId: visita.id })}
        />
      ))}
    </Tela>
  );
}

function Indicador({ valor, texto }: { valor: number; texto: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: cores.papel, borderWidth: 2, borderColor: cores.linha, borderRadius: 14, padding: 12 }}>
      <Text style={{ fontFamily: fontes.titulo, fontSize: 26, color: cores.tinta }}>{valor}</Text>
      <Text style={{ fontSize: 14, color: cores.tintaSuave }}>{texto}</Text>
    </View>
  );
}
