import { useCallback, useEffect, useState } from 'react';
import {
  Botao,
  Campo,
  Carregando,
  ErroComAcao,
  Intro,
  Marcar,
  Nota,
  Opcoes,
  Rotulo,
  Secao,
  SeletorData,
  Tela,
  Vazio,
} from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { PropsTela } from '../navegacao/rotas';
import { listarEnderecos } from '../servicos/contaServico';
import { dataCurta, dataIso, hora } from '../servicos/formatacao';
import { listarGatos } from '../servicos/gatoServico';
import { DURACOES, validarSolicitacao } from '../servicos/regras';
import { solicitarVisita } from '../servicos/visitaServico';

function amanhaAsDez(): Date {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  data.setHours(10, 0, 0, 0);
  return data;
}

export function SolicitarVisitaTela({ route, navigation }: PropsTela<'SolicitarVisita'>) {
  const { cuidadorId, cuidadorNome } = route.params;
  const gatos = useDados(listarGatos);
  const enderecos = useDados(listarEnderecos);
  const [gatoIds, setGatoIds] = useState<number[]>([]);
  const [enderecoId, setEnderecoId] = useState<number | undefined>(route.params.enderecoId);
  const [inicio, setInicio] = useState<Date>(amanhaAsDez);
  const [duracao, setDuracao] = useState(60);
  const [instrucoes, setInstrucoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!enderecoId && enderecos.dados?.length) {
      setEnderecoId(enderecos.dados[0].id);
    }
  }, [enderecoId, enderecos.dados]);

  const alternarGato = useCallback((id: number, marcado: boolean) => {
    setGatoIds((atuais) => (marcado ? [...atuais, id] : atuais.filter((g) => g !== id)));
  }, []);

  const regraInvalida = validarSolicitacao(gatoIds.length, inicio);

  function juntarData(escolhida: Date) {
    const nova = new Date(inicio);
    nova.setFullYear(escolhida.getFullYear(), escolhida.getMonth(), escolhida.getDate());
    setInicio(nova);
  }

  function juntarHora(escolhida: Date) {
    const nova = new Date(inicio);
    nova.setHours(escolhida.getHours(), escolhida.getMinutes(), 0, 0);
    setInicio(nova);
  }

  async function aoSolicitar() {
    if (!enderecoId) {
      setErro('Escolha o endereço da visita.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const visita = await solicitarVisita({
        cuidadorId,
        gatoIds,
        enderecoId,
        inicio: inicio.toISOString(),
        duracaoMinutos: duracao,
        instrucoes: instrucoes.trim(),
      });
      navigation.replace('DetalheVisita', { visitaId: visita.id });
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if ((gatos.carregando && !gatos.dados) || (enderecos.carregando && !enderecos.dados)) {
    return (
      <Tela>
        <Carregando />
      </Tela>
    );
  }
  if (gatos.erro && !gatos.dados) {
    return (
      <Tela>
        <ErroComAcao mensagem={gatos.erro} aoTentar={gatos.recarregar} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Intro>Cuidador escolhido: {cuidadorNome}.</Intro>
      <Secao>Quais gatos serão atendidos</Secao>
      {gatos.dados?.length === 0 ? <Vazio texto="Cadastre um gato antes de solicitar uma visita." /> : null}
      {gatos.dados?.map((gato) => (
        <Marcar
          key={gato.id}
          texto={gato.nome}
          marcado={gatoIds.includes(gato.id)}
          aoMudar={(m) => alternarGato(gato.id, m)}
          extra={gato.tomaRemedio ? <Rotulo texto="Toma remédio" tom="erro" /> : undefined}
        />
      ))}
      {enderecos.dados?.length ? (
        <Opcoes
          rotulo="Endereço da visita"
          valor={enderecoId ?? 0}
          aoMudar={setEnderecoId}
          opcoes={enderecos.dados.map((e) => ({ valor: e.id, texto: e.apelido }))}
        />
      ) : (
        <Nota tom="erro">Cadastre um endereço em Meu perfil antes de solicitar uma visita.</Nota>
      )}
      <SeletorData rotulo="Data" valor={inicio} aoMudar={juntarData} minimo={new Date()} formatar={(d) => dataCurta(dataIso(d))} />
      <SeletorData rotulo="Horário de início" valor={inicio} modo="time" aoMudar={juntarHora} formatar={hora} />
      <Opcoes rotulo="Duração" valor={duracao} aoMudar={setDuracao} opcoes={DURACOES.map((d) => ({ valor: d, texto: `${d} min` }))} />
      <Campo rotulo="Instruções para o cuidador" value={instrucoes} onChangeText={setInstrucoes} multiline placeholder="Onde fica a ração, horários do remédio..." />
      {regraInvalida ? <Nota tom="erro">{regraInvalida}</Nota> : null}
      {erro ? <Nota tom="erro">{erro}</Nota> : null}
      <Botao titulo="Solicitar visita" aoTocar={aoSolicitar} desativado={!!regraInvalida} carregando={enviando} />
    </Tela>
  );
}
