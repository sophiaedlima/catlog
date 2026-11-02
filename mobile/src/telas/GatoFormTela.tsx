import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Avatar, Botao, Campo, estilos, Nota, Opcoes, SeletorData, Tela } from '../componentes/Interface';
import { ErroDePermissao, escolherDaGaleria, tirarFoto } from '../dados/dispositivo';
import { PropsTela } from '../navegacao/rotas';
import { dataCurta, dataIso, lerDataIso } from '../servicos/formatacao';
import { enviarFoto, salvarGato } from '../servicos/gatoServico';
import { Sexo } from '../tipos/modelos';

export function GatoFormTela({ route, navigation }: PropsTela<'GatoForm'>) {
  const gato = route.params?.gato;
  const [nome, setNome] = useState(gato?.nome ?? '');
  const [raca, setRaca] = useState(gato?.raca ?? '');
  const [sexo, setSexo] = useState<Sexo>(gato?.sexo ?? 'FEMEA');
  const [nascimento, setNascimento] = useState<Date | null>(gato?.dataNascimento ? lerDataIso(gato.dataNascimento) : null);
  const [cuidados, setCuidados] = useState(gato?.cuidadosEspeciais ?? '');
  const [fotoUrl, setFotoUrl] = useState<string | null>(gato?.fotoUrl ?? null);
  const [fotoLocal, setFotoLocal] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pegarFoto(origem: () => Promise<string | null>) {
    try {
      const uri = await origem();
      if (uri) {
        setFotoLocal(uri);
      }
    } catch (falha) {
      Alert.alert(falha instanceof ErroDePermissao ? 'Permissão necessária' : 'Não deu certo', (falha as Error).message);
    }
  }

  async function aoSalvar() {
    if (!nome.trim()) {
      setErro('Informe o nome do gato.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const urlFinal = fotoLocal ? await enviarFoto(fotoLocal) : fotoUrl;
      await salvarGato(gato?.id, {
        nome: nome.trim(),
        raca: raca.trim() || null,
        sexo,
        dataNascimento: nascimento ? dataIso(nascimento) : null,
        fotoUrl: urlFinal,
        cuidadosEspeciais: cuidados.trim() || null,
      });
      navigation.goBack();
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <View style={[estilos.centro, { marginBottom: 8 }]}>
        <Avatar nome={nome || '?'} fotoUrl={fotoLocal ?? fotoUrl} tamanho={96} />
      </View>
      <Botao titulo="Tirar foto" variante="secundario" aoTocar={() => pegarFoto(tirarFoto)} />
      <Botao titulo="Escolher da galeria" variante="secundario" aoTocar={() => pegarFoto(escolherDaGaleria)} />
      <View style={{ height: 16 }} />
      <Campo rotulo="Nome" value={nome} onChangeText={setNome} />
      <Campo rotulo="Raça (opcional)" value={raca} onChangeText={setRaca} placeholder="SRD, Siamês..." />
      <Opcoes
        rotulo="Sexo"
        valor={sexo}
        aoMudar={setSexo}
        opcoes={[
          { valor: 'FEMEA', texto: 'Fêmea' },
          { valor: 'MACHO', texto: 'Macho' },
        ]}
      />
      <SeletorData
        rotulo="Data de nascimento (opcional)"
        valor={nascimento}
        aoMudar={setNascimento}
        maximo={new Date()}
        formatar={(d) => dataCurta(dataIso(d))}
      />
      <Campo rotulo="Cuidados especiais (opcional)" value={cuidados} onChangeText={setCuidados} multiline placeholder="Remédios, alimentação, manias..." />
      {erro ? <Nota tom="erro">{erro}</Nota> : null}
      <Botao titulo="Salvar" aoTocar={aoSalvar} carregando={enviando} />
    </Tela>
  );
}
