import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Bloco,
  Botao,
  Campo,
  Carregando,
  ErroComAcao,
  Intro,
  Marcar,
  Nota,
  Rotulo,
  Secao,
  Tela,
} from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { ErroDePermissao, tirarFoto } from '../dados/dispositivo';
import { PropsTela } from '../navegacao/rotas';
import { enviarOuEnfileirar } from '../servicos/filaServico';
import { hora, periodoDaVisita } from '../servicos/formatacao';
import { janelaDeCheckin, MAXIMO_FOTOS, pendenciasDoRelatorio } from '../servicos/regras';
import { coletarCheckin, detalharVisita, prepararRelatorio, RecusaLocal } from '../servicos/visitaServico';
import { cores } from '../tema/tema';

export function ExecucaoVisitaTela({ route, navigation }: PropsTela<'ExecucaoVisita'>) {
  const { visitaId } = route.params;
  const { dados: visita, carregando, erro, recarregar } = useDados(useCallback(() => detalharVisita(visitaId), [visitaId]));
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [avisoFila, setAvisoFila] = useState<string | null>(null);
  const [tarefas, setTarefas] = useState({ alimentou: false, trocouAgua: false, limpouCaixa: false, medicou: false });
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);

  if (!visita) {
    return (
      <Tela>
        {carregando ? <Carregando /> : null}
        {erro ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      </Tela>
    );
  }

  const janela = janelaDeCheckin(visita.inicio);
  const pendencias = pendenciasDoRelatorio(tarefas, fotos.length, visita.precisaMedicar);

  async function fazerCheckin() {
    setErroAcao(null);
    setAvisoFila(null);
    setProcessando(true);
    try {
      const dados = await coletarCheckin(visita!);
      const enviado = await enviarOuEnfileirar('CHECKIN', visitaId, dados);
      if (!enviado) {
        setAvisoFila('Check-in salvo no celular. Ele será enviado quando a internet voltar.');
      }
      await recarregar();
    } catch (falha) {
      setErroAcao(
        falha instanceof RecusaLocal || falha instanceof ErroDePermissao || falha instanceof Error
          ? falha.message
          : 'Não foi possível fazer o check-in.',
      );
    } finally {
      setProcessando(false);
    }
  }

  async function adicionarFoto() {
    try {
      const uri = await tirarFoto();
      if (uri) {
        setFotos((atuais) => [...atuais, uri]);
      }
    } catch (falha) {
      Alert.alert(falha instanceof ErroDePermissao ? 'Permissão necessária' : 'Não deu certo', (falha as Error).message);
    }
  }

  async function concluir() {
    setErroAcao(null);
    setProcessando(true);
    try {
      const enviado = await enviarOuEnfileirar('RELATORIO', visitaId, prepararRelatorio(tarefas, observacoes.trim(), fotos));
      if (!enviado) {
        Alert.alert('Relatório salvo', 'Sem internet agora. O relatório e as fotos serão enviados quando a conexão voltar.');
      }
      navigation.goBack();
    } catch (falha) {
      setErroAcao((falha as Error).message);
    } finally {
      setProcessando(false);
    }
  }

  if (visita.situacao === 'ACEITA') {
    return (
      <Tela atualizando={carregando} aoAtualizar={recarregar}>
        <Bloco
          titulo={periodoDaVisita(visita.inicio, visita.fim)}
          info={`${visita.endereco.logradouro}, ${visita.endereco.numero}, ${visita.endereco.bairro}`}
          direita={<Rotulo texto="Check-in pendente" tom="alerta" />}
        />
        <Secao>Check-in</Secao>
        <Intro>
          Faça o check-in ao chegar, das {hora(janela.de)} às {hora(janela.ate)}, a até 200 metros do endereço.
        </Intro>
        {erroAcao ? <Nota tom="erro">{erroAcao}</Nota> : null}
        <Botao titulo="Fazer check-in" aoTocar={fazerCheckin} carregando={processando} />
      </Tela>
    );
  }

  if (visita.situacao !== 'EM_ANDAMENTO') {
    return (
      <Tela>
        <Nota tom="ok" titulo="Tudo certo">Esta visita não está mais em execução.</Nota>
        <Botao titulo="Voltar" variante="secundario" aoTocar={() => navigation.goBack()} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Bloco titulo={periodoDaVisita(visita.inicio, visita.fim)} direita={<Rotulo texto="Em andamento" tom="ok" />} />
      {avisoFila ? <Nota>{avisoFila}</Nota> : null}
      {visita.aguardandoEnvio && !avisoFila ? <Nota>O check-in está salvo no celular e será enviado quando a internet voltar.</Nota> : null}
      {visita.instrucoes ? <Intro>{visita.instrucoes}</Intro> : null}
      <Secao>Lista de tarefas</Secao>
      <Marcar texto="Alimentou" marcado={tarefas.alimentou} aoMudar={(v) => setTarefas({ ...tarefas, alimentou: v })} />
      <Marcar texto="Trocou a água" marcado={tarefas.trocouAgua} aoMudar={(v) => setTarefas({ ...tarefas, trocouAgua: v })} />
      <Marcar texto="Limpou a caixa" marcado={tarefas.limpouCaixa} aoMudar={(v) => setTarefas({ ...tarefas, limpouCaixa: v })} />
      {visita.precisaMedicar ? (
        <Marcar
          texto="Medicou"
          marcado={tarefas.medicou}
          aoMudar={(v) => setTarefas({ ...tarefas, medicou: v })}
          extra={<Rotulo texto="Obrigatório" tom="erro" />}
        />
      ) : null}
      <Campo rotulo="Observações" value={observacoes} onChangeText={setObservacoes} multiline placeholder="Como os gatos estavam?" />
      <Secao>{`Fotos (${fotos.length} de ${MAXIMO_FOTOS})`}</Secao>
      <View style={folha.fotos}>
        {fotos.map((uri, i) => (
          <Pressable
            key={uri}
            onPress={() => setFotos(fotos.filter((f) => f !== uri))}
            accessibilityRole="button"
            accessibilityLabel={`Remover foto ${i + 1}`}
          >
            <Image source={{ uri }} style={folha.foto} />
            <Text style={folha.remover}>Remover</Text>
          </Pressable>
        ))}
      </View>
      <Botao titulo="Tirar foto" variante="secundario" aoTocar={adicionarFoto} desativado={fotos.length >= MAXIMO_FOTOS} />
      {pendencias.length > 0 ? <Nota titulo="Para concluir, falta:">{pendencias.join(', ') + '.'}</Nota> : null}
      {erroAcao ? <Nota tom="erro">{erroAcao}</Nota> : null}
      <Botao titulo="Concluir visita" aoTocar={concluir} desativado={pendencias.length > 0} carregando={processando} />
    </Tela>
  );
}

const folha = StyleSheet.create({
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foto: { width: 96, height: 96, borderRadius: 12, backgroundColor: cores.linha },
  remover: { fontSize: 13, color: cores.vermelho, textAlign: 'center', paddingVertical: 12, fontWeight: '600' },
});
