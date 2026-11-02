import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle, Path } from 'react-native-svg';
import { useConexao } from '../contexto/ConexaoContext';
import { urlDaFoto } from '../dados/api';
import { TomRotulo } from '../servicos/formatacao';
import { ALTURA_MINIMA_TOQUE, cores, fontes } from '../tema/tema';

export function Tela({
  children,
  atualizando,
  aoAtualizar,
}: {
  children: ReactNode;
  atualizando?: boolean;
  aoAtualizar?: () => void;
}) {
  return (
    <KeyboardAvoidingView style={estilos.preencher} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AvisoDeConexao />
      <ScrollView
        style={estilos.tela}
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          aoAtualizar ? <RefreshControl refreshing={!!atualizando} onRefresh={aoAtualizar} colors={[cores.verde]} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AvisoDeConexao() {
  const { online, pendentes } = useConexao();
  if (online && pendentes === 0) {
    return null;
  }
  const texto = !online
    ? pendentes > 0
      ? `Sem internet. ${pendentes} ${pendentes === 1 ? 'envio aguardando' : 'envios aguardando'} a conexão voltar.`
      : 'Sem internet. Você está vendo os últimos dados salvos.'
    : 'Enviando o que ficou guardado no celular...';
  return (
    <View style={estilos.avisoConexao} accessibilityRole="alert">
      <Text style={estilos.avisoConexaoTexto}>{texto}</Text>
    </View>
  );
}

type VarianteBotao = 'principal' | 'secundario' | 'perigo';

export function Botao({
  titulo,
  aoTocar,
  variante = 'principal',
  desativado,
  carregando,
  dica,
}: {
  titulo: string;
  aoTocar: () => void;
  variante?: VarianteBotao;
  desativado?: boolean;
  carregando?: boolean;
  dica?: string;
}) {
  const inativo = desativado || carregando;
  return (
    <Pressable
      onPress={aoTocar}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      style={({ pressed }) => [
        estilos.botao,
        variante === 'secundario' && estilos.botaoSecundario,
        variante === 'perigo' && estilos.botaoPerigo,
        inativo && estilos.botaoInativo,
        pressed && estilos.botaoPressionado,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={cores.tinta} />
      ) : (
        <Text style={[estilos.botaoTexto, variante === 'perigo' && { color: cores.vermelho }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Campo({
  rotulo,
  erro,
  ...props
}: TextInputProps & { rotulo: string; erro?: string | null }) {
  const [focado, setFocado] = useState(false);
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotuloCampo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.tintaSuave}
        {...props}
        onFocus={(e) => {
          setFocado(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          props.onBlur?.(e);
        }}
        style={[estilos.entrada, props.multiline && estilos.entradaLonga, focado && { borderColor: cores.amarelo }, erro ? { borderColor: cores.vermelho } : null]}
      />
      {erro ? <Text style={estilos.erroCampo}>{erro}</Text> : null}
    </View>
  );
}

export function SeletorData({
  rotulo,
  valor,
  modo = 'date',
  aoMudar,
  minimo,
  maximo,
  vazio = 'Escolher',
  formatar,
}: {
  rotulo: string;
  valor: Date | null;
  modo?: 'date' | 'time';
  aoMudar: (data: Date) => void;
  minimo?: Date;
  maximo?: Date;
  vazio?: string;
  formatar: (data: Date) => string;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotuloCampo}>{rotulo}</Text>
      <Pressable
        onPress={() => setAberto(true)}
        style={estilos.entrada}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor ? formatar(valor) : vazio}. Toque para alterar.`}
      >
        <Text style={estilos.textoEntrada}>{valor ? formatar(valor) : vazio}</Text>
      </Pressable>
      {aberto ? (
        <DateTimePicker
          value={valor ?? new Date()}
          mode={modo}
          is24Hour
          minimumDate={minimo}
          maximumDate={maximo}
          onValueChange={(_evento, data) => {
            setAberto(false);
            aoMudar(data);
          }}
          onDismiss={() => setAberto(false)}
        />
      ) : null}
    </View>
  );
}

export function Opcoes<T extends string | number>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  rotulo: string;
  opcoes: { valor: T; texto: string }[];
  valor: T;
  aoMudar: (valor: T) => void;
}) {
  return (
    <View style={estilos.campo} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
      <Text style={estilos.rotuloCampo}>{rotulo}</Text>
      <View style={estilos.opcoes}>
        {opcoes.map((opcao) => {
          const marcada = opcao.valor === valor;
          return (
            <Pressable
              key={String(opcao.valor)}
              onPress={() => aoMudar(opcao.valor)}
              accessibilityRole="radio"
              accessibilityState={{ selected: marcada, checked: marcada }}
              style={[estilos.opcao, marcada && estilos.opcaoMarcada]}
            >
              <Text style={[estilos.opcaoTexto, marcada && { color: cores.papel }]}>{opcao.texto}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Marcar({
  texto,
  marcado,
  aoMudar,
  extra,
}: {
  texto: string;
  marcado: boolean;
  aoMudar: (marcado: boolean) => void;
  extra?: ReactNode;
}) {
  return (
    <Pressable
      onPress={() => aoMudar(!marcado)}
      accessibilityRole="checkbox"
      accessibilityLabel={texto}
      accessibilityState={{ checked: marcado }}
      style={[estilos.marcar, marcado && { borderColor: cores.verde }]}
    >
      <View style={[estilos.caixa, marcado && estilos.caixaMarcada]}>
        {marcado ? (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={cores.papel} strokeWidth={3.5}>
            <Path d="M5 13l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        ) : null}
      </View>
      <Text style={estilos.marcarTexto}>{texto}</Text>
      {extra}
    </Pressable>
  );
}

const COR_ROTULO: Record<TomRotulo, string> = {
  ok: cores.verde,
  alerta: cores.amareloTexto,
  erro: cores.vermelho,
  neutro: cores.tintaSuave,
};

export function Rotulo({ texto, tom }: { texto: string; tom: TomRotulo }) {
  const cor = COR_ROTULO[tom];
  return (
    <View style={estilos.rotulo}>
      <View style={[estilos.rotuloBola, { backgroundColor: cor }]} />
      <Text style={[estilos.rotuloTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

export function Nota({
  titulo,
  children,
  tom = 'alerta',
}: {
  titulo?: string;
  children?: ReactNode;
  tom?: 'alerta' | 'erro' | 'ok';
}) {
  const borda = { alerta: cores.amarelo, erro: cores.vermelho, ok: cores.verde }[tom];
  const fundo = { alerta: cores.amareloFraco, erro: cores.vermelhoFraco, ok: cores.verdeFraco }[tom];
  return (
    <View style={[estilos.nota, { borderColor: borda, backgroundColor: fundo }]} accessibilityRole={tom === 'erro' ? 'alert' : undefined}>
      {titulo ? <Text style={estilos.notaTitulo}>{titulo}</Text> : null}
      {typeof children === 'string' ? <Text style={estilos.notaTexto}>{children}</Text> : children}
    </View>
  );
}

const CORES_AVATAR = [cores.rosa, cores.verde, cores.tinta, cores.tintaSuave];

export function Avatar({ nome, fotoUrl, tamanho = 44 }: { nome: string; fotoUrl?: string | null; tamanho?: number }) {
  const uri = urlDaFoto(fotoUrl);
  const forma = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };
  if (uri) {
    return <Image source={{ uri }} style={forma} accessibilityIgnoresInvertColors accessible={false} />;
  }
  const indice = nome.split('').reduce((soma, letra) => soma + letra.charCodeAt(0), 0) % CORES_AVATAR.length;
  return (
    <View style={[estilos.avatar, forma, { backgroundColor: CORES_AVATAR[indice] }]} importantForAccessibility="no-hide-descendants">
      <Text style={[estilos.avatarTexto, { fontSize: tamanho * 0.4 }]}>{nome.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function ItemLista({
  titulo,
  subtitulo,
  direita,
  esquerda,
  aoTocar,
  rotuloAcessivel,
}: {
  titulo: string;
  subtitulo?: string;
  direita?: ReactNode;
  esquerda?: ReactNode;
  aoTocar?: () => void;
  rotuloAcessivel?: string;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      disabled={!aoTocar}
      accessibilityRole={aoTocar ? 'button' : undefined}
      accessibilityLabel={rotuloAcessivel}
      style={({ pressed }) => [estilos.item, pressed && { borderColor: cores.amarelo }]}
    >
      {esquerda}
      <View style={estilos.cresce}>
        <View style={estilos.entre}>
          <Text style={[estilos.itemTitulo, estilos.cresce]}>{titulo}</Text>
          {direita}
        </View>
        {subtitulo ? <Text style={estilos.info}>{subtitulo}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Bloco({ titulo, info, direita }: { titulo: string; info?: string; direita?: ReactNode }) {
  return (
    <View style={estilos.bloco}>
      <View style={estilos.entre}>
        <Text style={[estilos.itemTitulo, estilos.cresce]}>{titulo}</Text>
        {direita}
      </View>
      {info ? <Text style={estilos.info}>{info}</Text> : null}
    </View>
  );
}

export const Secao = ({ children }: { children: string }) => (
  <Text style={estilos.secao} accessibilityRole="header">
    {children}
  </Text>
);

export const Intro = ({ children }: { children: ReactNode }) => <Text style={estilos.intro}>{children}</Text>;

export const TituloGrande = ({ children }: { children: ReactNode }) => (
  <Text style={estilos.tituloGrande} accessibilityRole="header">
    {children}
  </Text>
);

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <View style={estilos.estado} accessibilityRole="progressbar" accessibilityLabel={texto}>
      <ActivityIndicator size="large" color={cores.verde} />
      <Text style={estilos.estadoTexto}>{texto}</Text>
    </View>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <View style={estilos.estado}>
      <LogoGato tamanho={54} cor={cores.tintaSuave} comRosto={false} />
      <Text style={estilos.estadoTexto}>{texto}</Text>
    </View>
  );
}

export function ErroComAcao({ mensagem, aoTentar }: { mensagem: string; aoTentar: () => void }) {
  return (
    <View>
      <Nota tom="erro" titulo="Não deu certo">
        {mensagem}
      </Nota>
      <Botao titulo="Tentar de novo" variante="secundario" aoTocar={aoTentar} />
    </View>
  );
}

export function LogoGato({
  tamanho = 86,
  cor = cores.amarelo,
  comRosto = true,
}: {
  tamanho?: number;
  cor?: string;
  comRosto?: boolean;
}) {
  return (
    <Svg width={tamanho} height={tamanho * 0.875} viewBox="0 0 64 56" fill="none" stroke={cor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 22 L12 6 L26 15" />
      <Path d="M50 22 L52 6 L38 15" />
      <Path d="M32 13c11 0 19 8 19 19s-8 19-19 19-19-8-19-19 8-19 19-19z" />
      {comRosto ? (
        <>
          <Circle cx={24} cy={30} r={2} fill={cores.tinta} stroke="none" />
          <Circle cx={40} cy={30} r={2} fill={cores.tinta} stroke="none" />
          <Path d="M32 36l-3 3 3 2 3-2-3-3z" fill={cores.rosa} stroke="none" />
          <Path d="M6 32h10M48 32h10M7 39l9-3M48 36l9 3" />
        </>
      ) : null}
    </Svg>
  );
}

export const estilos = StyleSheet.create({
  preencher: { flex: 1, backgroundColor: cores.fundo },
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, paddingBottom: 32 },
  cresce: { flex: 1, minWidth: 0 },
  entre: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between' },
  centro: { alignItems: 'center' },
  avisoConexao: { backgroundColor: cores.tinta, paddingHorizontal: 16, paddingVertical: 8 },
  avisoConexaoTexto: { color: cores.papel, fontSize: 14, fontWeight: '600' },
  botao: {
    minHeight: 50,
    borderWidth: 2,
    borderColor: cores.tinta,
    borderRadius: 12,
    backgroundColor: cores.amarelo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  botaoSecundario: { backgroundColor: cores.papel },
  botaoPerigo: { backgroundColor: cores.papel, borderColor: cores.vermelho },
  botaoInativo: { opacity: 0.45 },
  botaoPressionado: { opacity: 0.8 },
  botaoTexto: { color: cores.tinta, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  campo: { marginBottom: 14 },
  rotuloCampo: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: cores.tinta },
  entrada: {
    minHeight: ALTURA_MINIMA_TOQUE,
    borderWidth: 2,
    borderColor: cores.linha,
    borderRadius: 12,
    backgroundColor: cores.papel,
    color: cores.tinta,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  entradaLonga: { minHeight: 90, textAlignVertical: 'top' },
  textoEntrada: { fontSize: 16, color: cores.tinta },
  erroCampo: { color: cores.vermelho, fontSize: 14, marginTop: 4 },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: {
    minHeight: ALTURA_MINIMA_TOQUE,
    borderWidth: 2,
    borderColor: cores.linha,
    backgroundColor: cores.papel,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoMarcada: { backgroundColor: cores.tinta, borderColor: cores.tinta },
  opcaoTexto: { fontSize: 14, fontWeight: '600', color: cores.tinta },
  marcar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    minHeight: ALTURA_MINIMA_TOQUE,
    borderWidth: 2,
    borderColor: cores.linha,
    borderRadius: 12,
    backgroundColor: cores.papel,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  marcarTexto: { flex: 1, fontSize: 16, color: cores.tinta },
  caixa: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: cores.tintaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaMarcada: { backgroundColor: cores.verde, borderColor: cores.verde },
  rotulo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rotuloBola: { width: 8, height: 8, borderRadius: 4 },
  rotuloTexto: { fontSize: 13, fontWeight: '700' },
  nota: { borderWidth: 2, borderRadius: 14, padding: 12, marginBottom: 14 },
  notaTitulo: { fontWeight: '700', fontSize: 15, color: cores.tinta, marginBottom: 2 },
  notaTexto: { fontSize: 14, color: cores.tinta },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: cores.papel, fontFamily: fontes.titulo },
  item: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    minHeight: ALTURA_MINIMA_TOQUE,
    backgroundColor: cores.papel,
    borderWidth: 2,
    borderColor: cores.linha,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  itemTitulo: { fontWeight: '700', fontSize: 15, color: cores.tinta },
  info: { color: cores.tintaSuave, fontSize: 14, marginTop: 2 },
  bloco: { borderBottomWidth: 1, borderBottomColor: cores.linha, paddingVertical: 12, paddingHorizontal: 2 },
  secao: { fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 8, color: cores.tintaSuave },
  intro: { color: cores.tintaSuave, fontSize: 14, marginBottom: 14 },
  tituloGrande: { fontFamily: fontes.titulo, fontSize: 21, color: cores.tinta, marginBottom: 2 },
  estado: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 8, gap: 10 },
  estadoTexto: { color: cores.tintaSuave, fontSize: 14, textAlign: 'center' },
});
