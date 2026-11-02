import { useState } from 'react';
import { Alert } from 'react-native';
import { Botao, Campo, Marcar, Nota, Tela } from '../componentes/Interface';
import { buscarCep } from '../dados/viaCep';
import { PropsTela } from '../navegacao/rotas';
import { excluirEndereco, salvarEndereco } from '../servicos/contaServico';
import { mascararCep } from '../servicos/formatacao';

export function EnderecoFormTela({ route, navigation }: PropsTela<'EnderecoForm'>) {
  const endereco = route.params?.endereco;
  const [apelido, setApelido] = useState(endereco?.apelido ?? '');
  const [cep, setCep] = useState(endereco?.cep ?? '');
  const [logradouro, setLogradouro] = useState(endereco?.logradouro ?? '');
  const [numero, setNumero] = useState(endereco?.numero ?? '');
  const [complemento, setComplemento] = useState(endereco?.complemento ?? '');
  const [bairro, setBairro] = useState(endereco?.bairro ?? '');
  const [cidade, setCidade] = useState(endereco?.cidade ?? '');
  const [uf, setUf] = useState(endereco?.uf ?? '');
  const [principal, setPrincipal] = useState(endereco?.principal ?? false);
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoMudarCep(texto: string) {
    const mascarado = mascararCep(texto);
    setCep(mascarado);
    setAvisoCep(null);
    if (mascarado.length !== 9) {
      return;
    }
    setBuscandoCep(true);
    const achado = await buscarCep(mascarado);
    setBuscandoCep(false);
    if (achado) {
      setLogradouro(achado.logradouro);
      setBairro(achado.bairro);
      setCidade(achado.cidade);
      setUf(achado.uf);
    } else {
      setAvisoCep('Não conseguimos buscar esse CEP. Preencha o endereço à mão.');
    }
  }

  async function aoSalvar() {
    const faltando = !apelido.trim()
      ? 'Dê um nome para o endereço, como Casa.'
      : cep.length !== 9
        ? 'Informe um CEP com 8 números.'
        : !logradouro.trim()
          ? 'Informe a rua.'
          : !numero.trim()
            ? 'Informe o número.'
            : !bairro.trim()
              ? 'Informe o bairro.'
              : !cidade.trim()
                ? 'Informe a cidade.'
                : uf.trim().length !== 2
                  ? 'Informe o estado com 2 letras.'
                  : null;
    setErro(faltando);
    if (faltando) {
      return;
    }
    setEnviando(true);
    try {
      await salvarEndereco(endereco?.id, {
        apelido: apelido.trim(),
        cep,
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim() || null,
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        principal,
      });
      navigation.goBack();
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir endereço', `Quer mesmo excluir ${endereco?.apelido}?`, [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirEndereco(endereco!.id);
            navigation.goBack();
          } catch (falha) {
            setErro((falha as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <Tela>
      <Campo rotulo="Nome do endereço" value={apelido} onChangeText={setApelido} placeholder="Casa, Casa da minha mãe..." />
      <Campo rotulo={buscandoCep ? 'CEP (buscando...)' : 'CEP'} value={cep} onChangeText={aoMudarCep} keyboardType="number-pad" placeholder="74000-000" />
      {avisoCep ? <Nota>{avisoCep}</Nota> : null}
      <Campo rotulo="Rua" value={logradouro} onChangeText={setLogradouro} />
      <Campo rotulo="Número" value={numero} onChangeText={setNumero} />
      <Campo rotulo="Complemento (opcional)" value={complemento} onChangeText={setComplemento} />
      <Campo rotulo="Bairro" value={bairro} onChangeText={setBairro} />
      <Campo rotulo="Cidade" value={cidade} onChangeText={setCidade} />
      <Campo rotulo="Estado" value={uf} onChangeText={(t) => setUf(t.slice(0, 2))} autoCapitalize="characters" placeholder="GO" />
      <Marcar texto="Usar como endereço principal" marcado={principal} aoMudar={setPrincipal} />
      {erro ? <Nota tom="erro">{erro}</Nota> : null}
      <Botao titulo="Salvar" aoTocar={aoSalvar} carregando={enviando} />
      {endereco ? <Botao titulo="Excluir endereço" variante="perigo" aoTocar={confirmarExclusao} /> : null}
    </Tela>
  );
}
