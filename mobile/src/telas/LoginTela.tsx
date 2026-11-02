import { useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, estilos, Intro, LogoGato, Nota, Tela } from '../componentes/Interface';
import { useSessao } from '../contexto/SessaoContext';
import { PropsTela } from '../navegacao/rotas';
import { entrar } from '../servicos/contaServico';
import { fontes } from '../tema/tema';

export function LoginTela({ navigation }: PropsTela<'Login'>) {
  const { iniciarSessao } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro('Informe seu e-mail e sua senha.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await iniciarSessao(await entrar(email.trim(), senha));
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <View style={[estilos.centro, { paddingVertical: 16 }]}>
        <LogoGato />
        <Text style={{ fontFamily: fontes.titulo, fontSize: 26, marginTop: 8 }} accessibilityRole="header">
          CatLog
        </Text>
        <Intro>A saúde dos seus gatos e as visitas do cuidador em um só lugar.</Intro>
      </View>
      <Campo rotulo="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="password" />
      {erro ? <Nota tom="erro">{erro}</Nota> : null}
      <Botao titulo="Entrar" aoTocar={aoEntrar} carregando={enviando} />
      <Botao titulo="Criar uma conta" variante="secundario" aoTocar={() => navigation.navigate('Cadastro')} />
    </Tela>
  );
}
