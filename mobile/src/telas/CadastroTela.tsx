import { useState } from 'react';
import { Botao, Campo, Intro, Nota, Opcoes, Tela } from '../componentes/Interface';
import { useSessao } from '../contexto/SessaoContext';
import { cadastrar, validarCadastro } from '../servicos/contaServico';
import { mascararTelefone } from '../servicos/formatacao';
import { Perfil } from '../tipos/modelos';

export function CadastroTela() {
  const { iniciarSessao } = useSessao();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('TUTOR');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoCadastrar() {
    const invalido = validarCadastro(nome, email, telefone, senha);
    setErro(invalido);
    if (invalido) {
      return;
    }
    setEnviando(true);
    try {
      await iniciarSessao(await cadastrar({ nome: nome.trim(), email: email.trim(), telefone, senha, perfil }));
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Intro>Qualquer pessoa pode criar uma conta gratuitamente e escolher como quer usar o CatLog.</Intro>
      <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} placeholder="Seu nome" autoComplete="name" />
      <Campo rotulo="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Campo rotulo="Telefone" value={telefone} onChangeText={(t) => setTelefone(mascararTelefone(t))} placeholder="(62) 90000-0000" keyboardType="phone-pad" />
      <Campo rotulo="Senha" value={senha} onChangeText={setSenha} placeholder="Mínimo de 8 caracteres" secureTextEntry autoComplete="new-password" />
      <Opcoes
        rotulo="Como você vai usar o aplicativo?"
        valor={perfil}
        aoMudar={setPerfil}
        opcoes={[
          { valor: 'TUTOR', texto: 'Tenho gatos' },
          { valor: 'CUIDADOR', texto: 'Cuido de gatos' },
        ]}
      />
      {erro ? <Nota tom="erro">{erro}</Nota> : null}
      <Botao titulo="Criar conta" aoTocar={aoCadastrar} carregando={enviando} />
    </Tela>
  );
}
