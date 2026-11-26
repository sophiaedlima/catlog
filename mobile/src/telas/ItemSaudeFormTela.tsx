import { useState } from 'react';
import { Alert } from 'react-native';
import { Bloco, Botao, Campo, Nota, Opcoes, SeletorData, Tela } from '../componentes/Interface';
import { PropsTela } from '../navegacao/rotas';
import { dataCurta, dataIso, lerDataIso } from '../servicos/formatacao';
import { excluirItemSaude, salvarItemSaude, validarItemSaude } from '../servicos/gatoServico';
import { TipoItemSaude } from '../tipos/modelos';

const TIPOS: { valor: TipoItemSaude; texto: string }[] = [
  { valor: 'VACINA', texto: 'Vacina' },
  { valor: 'VERMIFUGO', texto: 'Vermífugo' },
  { valor: 'REMEDIO', texto: 'Remédio' },
];

// Exemplos mostrados em cinza nos campos vazios, de acordo com o tipo escolhido.
const EXEMPLOS: Record<TipoItemSaude, { nome: string; instrucoes: string }> = {
  VACINA: { nome: 'Ex.: Antirrábica, V4', instrucoes: 'Ex.: Aplicada na clínica do bairro' },
  VERMIFUGO: { nome: 'Ex.: Drontal', instrucoes: 'Ex.: 1 comprimido, repetir em 15 dias' },
  REMEDIO: { nome: 'Ex.: Metimazol 2,5 mg', instrucoes: 'Ex.: Todos os dias às 8h, com a ração úmida' },
};

export function ItemSaudeFormTela({ route, navigation }: PropsTela<'ItemSaudeForm'>) {
  const { gatoId, item } = route.params;
  const [tipo, setTipo] = useState<TipoItemSaude>(item?.tipo ?? 'VACINA');
  const [nome, setNome] = useState(item?.nome ?? '');
  const [aplicacao, setAplicacao] = useState<Date>(item ? lerDataIso(item.dataAplicacao) : new Date());
  const [proxima, setProxima] = useState<Date | null>(item?.proximaDose ? lerDataIso(item.proximaDose) : null);
  const [instrucoes, setInstrucoes] = useState(item?.instrucoes ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSalvar() {
    const dados = {
      tipo,
      nome: nome.trim(),
      dataAplicacao: dataIso(aplicacao),
      proximaDose: proxima ? dataIso(proxima) : null,
      instrucoes: instrucoes.trim() || null,
    };
    const invalido = validarItemSaude(dados);
    setErro(invalido);
    if (invalido) {
      return;
    }
    setEnviando(true);
    try {
      await salvarItemSaude(gatoId, item?.id, dados);
      navigation.goBack();
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir cuidado', `Quer mesmo excluir ${item?.nome}?`, [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirItemSaude(gatoId, item!.id);
            navigation.goBack();
          } catch (falha) {
            setErro((falha as Error).message);
          }
        },
      },
    ]);
  }

  const exemplo = EXEMPLOS[tipo];

  return (
    <Tela>
      {item ? (
        <Bloco titulo="Tipo" info={TIPOS.find((t) => t.valor === tipo)?.texto} />
      ) : (
        <Opcoes rotulo="Tipo" valor={tipo} aoMudar={setTipo} opcoes={TIPOS} />
      )}
      <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder={exemplo.nome} />
      <SeletorData rotulo="Data de aplicação" valor={aplicacao} aoMudar={setAplicacao} maximo={new Date()} formatar={(d) => dataCurta(dataIso(d))} />
      <SeletorData
        rotulo={tipo === 'REMEDIO' ? 'Próxima dose (opcional para uso contínuo)' : 'Próxima dose'}
        valor={proxima}
        aoMudar={setProxima}
        formatar={(d) => dataCurta(dataIso(d))}
      />
      {tipo === 'REMEDIO' && proxima ? <Botao titulo="Remover próxima dose" variante="secundario" aoTocar={() => setProxima(null)} /> : null}
      <Campo rotulo="Instruções (opcional)" value={instrucoes} onChangeText={setInstrucoes} multiline placeholder={exemplo.instrucoes} />
      {erro ? <Nota tom="erro">{erro}</Nota> : null}
      <Botao titulo="Salvar" aoTocar={aoSalvar} carregando={enviando} />
      {item ? <Botao titulo="Excluir cuidado" variante="perigo" aoTocar={confirmarExclusao} /> : null}
    </Tela>
  );
}
