import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { GraficoPeso } from '../componentes/GraficoPeso';
import {
  Bloco,
  Botao,
  Campo,
  Carregando,
  ErroComAcao,
  Intro,
  ItemLista,
  Nota,
  Opcoes,
  Rotulo,
  SeletorData,
  Tela,
  Vazio,
} from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { PropsTela } from '../navegacao/rotas';
import { dataCurta, dataIso, numero, TEXTO_SITUACAO_SAUDE, TEXTO_TIPO_SAUDE, TOM_SITUACAO_SAUDE } from '../servicos/formatacao';
import { excluirPeso, listarItensSaude, listarPesos, registrarPeso, validarPeso } from '../servicos/gatoServico';
import { cores } from '../tema/tema';
import { ItemSaude } from '../tipos/modelos';

function descricaoDoItem(item: ItemSaude): string {
  const aplicado = `Aplicado em ${dataCurta(item.dataAplicacao)}`;
  const proxima = item.proximaDose ? `, próxima dose em ${dataCurta(item.proximaDose)}` : '';
  const instrucoes = item.instrucoes ? `. ${item.instrucoes}` : '';
  return `${TEXTO_TIPO_SAUDE[item.tipo]}. ${aplicado}${proxima}${instrucoes}`;
}

export function CarteiraSaudeTela({ route, navigation }: PropsTela<'CarteiraSaude'>) {
  const { gatoId, gatoNome } = route.params;
  const [secao, setSecao] = useState<'saude' | 'peso'>('saude');

  return (
    <Tela>
      <Opcoes
        rotulo={`Carteira de ${gatoNome}`}
        valor={secao}
        aoMudar={setSecao}
        opcoes={[
          { valor: 'saude', texto: 'Vacinas e remédios' },
          { valor: 'peso', texto: 'Peso' },
        ]}
      />
      {secao === 'saude' ? (
        <SecaoSaude gatoId={gatoId} aoEditar={(item) => navigation.navigate('ItemSaudeForm', { gatoId, item })} aoAdicionar={() => navigation.navigate('ItemSaudeForm', { gatoId })} />
      ) : (
        <SecaoPeso gatoId={gatoId} gatoNome={gatoNome} />
      )}
    </Tela>
  );
}

function SecaoSaude({
  gatoId,
  aoEditar,
  aoAdicionar,
}: {
  gatoId: number;
  aoEditar: (item: ItemSaude) => void;
  aoAdicionar: () => void;
}) {
  const { dados, carregando, erro, recarregar } = useDados(useCallback(() => listarItensSaude(gatoId), [gatoId]));
  return (
    <View>
      {carregando && !dados ? <Carregando /> : null}
      {erro && !dados ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      {dados && dados.length === 0 ? <Vazio texto="Nenhum cuidado registrado ainda. Adicione a primeira vacina, vermífugo ou remédio." /> : null}
      {dados?.map((item) => (
        <ItemLista
          key={item.id}
          titulo={item.nome}
          subtitulo={descricaoDoItem(item)}
          direita={<Rotulo texto={TEXTO_SITUACAO_SAUDE[item.situacao]} tom={TOM_SITUACAO_SAUDE[item.situacao]} />}
          aoTocar={() => aoEditar(item)}
        />
      ))}
      <Botao titulo="Adicionar cuidado" aoTocar={aoAdicionar} />
    </View>
  );
}

function SecaoPeso({ gatoId, gatoNome }: { gatoId: number; gatoNome: string }) {
  const { dados, carregando, erro, recarregar } = useDados(useCallback(() => listarPesos(gatoId), [gatoId]));
  const [peso, setPeso] = useState('');
  const [data, setData] = useState(new Date());
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ultimo = dados?.[dados.length - 1];

  async function aoRegistrar() {
    const invalido = validarPeso(peso);
    setErroForm(invalido);
    if (invalido) {
      return;
    }
    setEnviando(true);
    try {
      await registrarPeso(gatoId, Number(peso.replace(',', '.')), dataIso(data));
      setPeso('');
      await recarregar();
    } catch (falha) {
      setErroForm((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  function confirmarExclusao(id: number) {
    Alert.alert('Excluir registro', 'Quer mesmo excluir esse registro de peso?', [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => excluirPeso(gatoId, id).then(recarregar, (falha) => setErroForm(falha.message)),
      },
    ]);
  }

  return (
    <View>
      {carregando && !dados ? <Carregando /> : null}
      {erro && !dados ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      {dados && dados.length === 0 ? <Vazio texto="Nenhum peso registrado ainda." /> : null}
      {dados && dados.length > 0 ? (
        <>
          <Intro>Peso de {gatoNome} nos últimos registros, em quilos.</Intro>
          <GraficoPeso registros={dados} />
          {ultimo?.alerta ? (
            <Nota titulo="Atenção ao peso">
              {`${gatoNome} teve uma variação de ${numero(Math.abs(Number(ultimo.variacaoPercentual)))}% em relação ao registro anterior. Vale marcar uma consulta com o veterinário.`}
            </Nota>
          ) : null}
        </>
      ) : null}
      <Campo rotulo="Novo peso (kg)" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" placeholder="4,2" erro={erroForm} />
      <SeletorData rotulo="Data da medição" valor={data} aoMudar={setData} maximo={new Date()} formatar={(d) => dataCurta(dataIso(d))} />
      <Botao titulo="Registrar peso" aoTocar={aoRegistrar} carregando={enviando} />
      {dados && dados.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: cores.tintaSuave, fontWeight: '700' }}>Histórico</Text>
          {[...dados].reverse().map((r) => (
            <Bloco
              key={r.id}
              titulo={`${numero(Number(r.pesoKg), 2)} kg`}
              info={dataCurta(r.dataMedicao)}
              direita={<Botao titulo="Excluir" variante="perigo" aoTocar={() => confirmarExclusao(r.id)} />}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
