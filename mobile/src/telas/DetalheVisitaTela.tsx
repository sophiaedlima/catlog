import { useCallback, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Bloco,
  Botao,
  Campo,
  Carregando,
  ErroComAcao,
  Intro,
  Nota,
  Rotulo,
  Secao,
  Tela,
} from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { useSessao } from '../contexto/SessaoContext';
import { urlDaFoto } from '../dados/api';
import { PropsTela } from '../navegacao/rotas';
import {
  dataCurta,
  descricaoDoGato,
  diaEHora,
  periodoDaVisita,
  TEXTO_SITUACAO_SAUDE,
  TEXTO_SITUACAO_VISITA,
  TOM_SITUACAO_SAUDE,
  TOM_SITUACAO_VISITA,
} from '../servicos/formatacao';
import { aceitarVisita, cancelarVisita, detalharVisita, recusarVisita } from '../servicos/visitaServico';
import { cores } from '../tema/tema';
import { GatoDetalheVisita, Visita } from '../tipos/modelos';

const ETAPAS: { texto: string; feita: (v: Visita) => boolean }[] = [
  { texto: 'Solicitada', feita: () => true },
  { texto: 'Confirmada pelo cuidador', feita: (v) => ['ACEITA', 'EM_ANDAMENTO', 'CONCLUIDA'].includes(v.situacao) },
  { texto: 'Check-in do cuidador no endereço', feita: (v) => ['EM_ANDAMENTO', 'CONCLUIDA'].includes(v.situacao) },
  { texto: 'Visita concluída e relatório enviado', feita: (v) => v.situacao === 'CONCLUIDA' },
];

function DadosDoGato({ gato }: { gato: GatoDetalheVisita }) {
  const alertas = gato.itensSaude.filter((i) => i.situacao !== 'EM_DIA');
  return (
    <View style={folha.gato}>
      <Bloco
        titulo={gato.nome}
        info={[descricaoDoGato(gato), gato.cuidadosEspeciais || 'Sem cuidados especiais'].filter(Boolean).join('. ')}
        direita={gato.tomaRemedio ? <Rotulo texto="Toma remédio" tom="erro" /> : undefined}
      />
      {gato.itensSaude
        .filter((i) => i.tipo === 'REMEDIO')
        .map((item) => (
          <Text key={item.id} style={folha.remedio}>
            {item.nome}
            {item.instrucoes ? `: ${item.instrucoes}` : ''}
          </Text>
        ))}
      {alertas.map((item) => (
        <View key={item.id} style={folha.alerta}>
          <Text style={folha.remedio}>
            {item.nome}, dose em {dataCurta(item.proximaDose)}
          </Text>
          <Rotulo texto={TEXTO_SITUACAO_SAUDE[item.situacao]} tom={TOM_SITUACAO_SAUDE[item.situacao]} />
        </View>
      ))}
    </View>
  );
}

export function DetalheVisitaTela({ route, navigation }: PropsTela<'DetalheVisita'>) {
  const { visitaId } = route.params;
  const { usuario } = useSessao();
  const { dados: visita, carregando, erro, daCopiaLocal, recarregar } = useDados(
    useCallback(() => detalharVisita(visitaId), [visitaId]),
  );
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');

  if (!visita) {
    return (
      <Tela>
        {carregando ? <Carregando /> : null}
        {erro ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      </Tela>
    );
  }

  const ehCuidador = usuario?.perfil === 'CUIDADOR';
  const emAberto = ['SOLICITADA', 'ACEITA'].includes(visita.situacao);

  async function executar(acao: () => Promise<unknown>) {
    setErroAcao(null);
    setProcessando(true);
    try {
      await acao();
      await recarregar();
    } catch (falha) {
      setErroAcao((falha as Error).message);
    } finally {
      setProcessando(false);
    }
  }

  function confirmarCancelamento() {
    if (!motivo.trim()) {
      setErroAcao('Conte o motivo do cancelamento.');
      return;
    }
    setCancelando(false);
    executar(() => cancelarVisita(visita!.id, motivo.trim()));
  }

  return (
    <Tela atualizando={carregando} aoAtualizar={recarregar}>
      <Bloco
        titulo={periodoDaVisita(visita.inicio, visita.fim)}
        info={`${ehCuidador ? `Tutor: ${visita.tutor.nome}, ${visita.tutor.telefone}` : `Cuidador: ${visita.cuidador.nome}, ${visita.cuidador.telefone}`}\n${visita.endereco.logradouro}, ${visita.endereco.numero}, ${visita.endereco.bairro}, ${visita.endereco.cidade}`}
        direita={<Rotulo texto={TEXTO_SITUACAO_VISITA[visita.situacao]} tom={TOM_SITUACAO_VISITA[visita.situacao]} />}
      />
      {visita.aguardandoEnvio ? <Nota titulo="Aguardando internet">O que você registrou está salvo no celular e será enviado quando a conexão voltar.</Nota> : null}
      {daCopiaLocal && !visita.aguardandoEnvio ? <Intro>Mostrando os dados salvos no celular.</Intro> : null}

      {visita.instrucoes ? (
        <>
          <Secao>Instruções do tutor</Secao>
          <Intro>{visita.instrucoes}</Intro>
        </>
      ) : null}

      <Secao>Gatos desta visita</Secao>
      {visita.dadosGatosLiberados && visita.dadosGatos ? (
        visita.dadosGatos.map((gato) => <DadosDoGato key={gato.id} gato={gato} />)
      ) : (
        <>
          {visita.gatos.map((g) => (
            <Bloco key={g.id} titulo={g.nome} />
          ))}
          {ehCuidador ? (
            <Intro>Os dados de saúde ficam disponíveis do aceite da visita até 24 horas depois da conclusão.</Intro>
          ) : null}
        </>
      )}

      {['RECUSADA', 'EXPIRADA', 'CANCELADA'].includes(visita.situacao) ? (
        <Nota tom="erro" titulo={`Visita ${TEXTO_SITUACAO_VISITA[visita.situacao].toLowerCase()}`}>
          {visita.motivoCancelamento
            ? `Motivo: ${visita.motivoCancelamento}`
            : visita.situacao === 'EXPIRADA'
              ? 'O cuidador não respondeu até 2 horas antes do início.'
              : 'O cuidador não poderá fazer esta visita.'}
        </Nota>
      ) : (
        <>
          <Secao>Situação</Secao>
          {ETAPAS.map((etapa) => {
            const feita = etapa.feita(visita);
            return (
              <View key={etapa.texto} style={folha.etapa} accessible accessibilityLabel={`${etapa.texto}: ${feita ? 'feito' : 'ainda não'}`}>
                <View style={[folha.etapaBola, feita && folha.etapaBolaFeita]} />
                <Text style={[folha.etapaTexto, feita && folha.etapaTextoFeita]}>{etapa.texto}</Text>
              </View>
            );
          })}
        </>
      )}

      {visita.relatorio ? (
        <>
          <Secao>Relatório do cuidador</Secao>
          <Bloco
            titulo={`Enviado em ${diaEHora(visita.relatorio.registradoEm)}`}
            info={[
              visita.relatorio.alimentou && 'Alimentou',
              visita.relatorio.trocouAgua && 'trocou a água',
              visita.relatorio.limpouCaixa && 'limpou a caixa',
              visita.relatorio.medicou && 'medicou',
            ]
              .filter(Boolean)
              .join(', ')}
          />
          {visita.relatorio.observacoes ? <Intro>{visita.relatorio.observacoes}</Intro> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {visita.relatorio.fotos.map((foto, i) => (
              <Image
                key={foto}
                source={{ uri: urlDaFoto(foto) }}
                style={folha.foto}
                accessible
                accessibilityLabel={`Foto ${i + 1} enviada pelo cuidador`}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {erroAcao ? <Nota tom="erro">{erroAcao}</Nota> : null}

      {ehCuidador && visita.situacao === 'SOLICITADA' ? (
        <>
          <Botao titulo="Aceitar visita" aoTocar={() => executar(() => aceitarVisita(visita.id))} carregando={processando} />
          <Botao titulo="Recusar visita" variante="secundario" aoTocar={() => executar(() => recusarVisita(visita.id))} desativado={processando} />
        </>
      ) : null}
      {ehCuidador && ['ACEITA', 'EM_ANDAMENTO'].includes(visita.situacao) && !visita.relatorio ? (
        <Botao
          titulo={visita.situacao === 'ACEITA' ? 'Iniciar visita' : 'Continuar visita'}
          aoTocar={() => navigation.navigate('ExecucaoVisita', { visitaId: visita.id })}
        />
      ) : null}
      {emAberto ? (
        <>
          <Botao
            titulo="Cancelar visita"
            variante="perigo"
            desativado={!visita.podeCancelar || processando}
            aoTocar={() => {
              setMotivo('');
              setCancelando(true);
            }}
          />
          {!visita.podeCancelar ? (
            <Intro>Esta visita começa em menos de 6 horas e não pode mais ser cancelada pelo aplicativo.</Intro>
          ) : null}
        </>
      ) : null}

      <Modal visible={cancelando} transparent animationType="fade" onRequestClose={() => setCancelando(false)}>
        <View style={folha.fundoModal}>
          <View style={folha.modal}>
            <Campo rotulo="Por que você quer cancelar?" value={motivo} onChangeText={setMotivo} multiline autoFocus />
            {erroAcao ? <Nota tom="erro">{erroAcao}</Nota> : null}
            <Botao titulo="Confirmar cancelamento" variante="perigo" aoTocar={confirmarCancelamento} />
            <Botao titulo="Manter visita" variante="secundario" aoTocar={() => setCancelando(false)} />
          </View>
        </View>
      </Modal>
    </Tela>
  );
}

const folha = StyleSheet.create({
  gato: { marginBottom: 6 },
  remedio: { fontSize: 14, color: cores.tinta, paddingHorizontal: 2, paddingTop: 6, flexShrink: 1 },
  alerta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  etapa: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  etapaBola: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: cores.tintaSuave, backgroundColor: cores.papel },
  etapaBolaFeita: { backgroundColor: cores.verde, borderColor: cores.verde },
  etapaTexto: { fontSize: 15, color: cores.tintaSuave, flex: 1 },
  etapaTextoFeita: { color: cores.tinta, fontWeight: '600' },
  foto: { width: 120, height: 120, borderRadius: 12, marginRight: 8, backgroundColor: cores.linha },
  fundoModal: { flex: 1, backgroundColor: 'rgba(27,42,65,0.6)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: cores.papel, borderRadius: 16, padding: 16 },
});
