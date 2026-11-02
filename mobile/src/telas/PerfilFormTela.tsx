import { useState } from 'react';
import { Botao, Campo, Nota, Tela } from '../componentes/Interface';
import { useSessao } from '../contexto/SessaoContext';
import { PropsTela } from '../navegacao/rotas';
import { atualizarPerfil } from '../servicos/contaServico';
import { mascararTelefone } from '../servicos/formatacao';

export function PerfilFormTela({ navigation }: PropsTela<'PerfilForm'>) {
  const { usuario, atualizarUsuario } = useSessao();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [telefone, setTelefone] = useState(mascararTelefone(usuario?.telefone ?? ''));
  const [apresentacao, setApresentacao] = useState(usuario?.apresentacao ?? '');
  const [raio, setRaio] = useState(String(usuario?.raioAtendimentoKm ?? 10));
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const ehCuidador = usuario?.perfil === 'CUIDADOR';

  async function aoSalvar() {
    if (!nome.trim()) {
      setErro('Informe seu nome.');
      return;
    }
    if (telefone.replace(/\D/g, '').length < 10) {
      setErro('Informe um telefone com DDD.');
      return;
    }
    const raioKm = Number(raio);
    if (ehCuidador && (!Number.isInteger(raioKm) || raioKm < 1 || raioKm > 50)) {
      setErro('O raio de atendimento precisa estar entre 1 e 50 km.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const atualizado = await atualizarPerfil({
        nome: nome.trim(),
        telefone,
        apresentacao: ehCuidador ? apresentacao.trim() || null : null,
        raioAtendimentoKm: ehCuidador ? raioKm : undefined,
      });
      await atualizarUsuario(atualizado);
      navigation.goBack();
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} />
      <Campo rotulo="Telefone" value={telefone} onChangeText={(t) => setTelefone(mascararTelefone(t))} keyboardType="phone-pad" />
      {ehCuidador ? (
        <>
          <Campo rotulo="Apresentação" value={apresentacao} onChangeText={setApresentacao} multiline placeholder="Sua experiência com gatos" />
          <Campo rotulo="Raio de atendimento (km)" value={raio} onChangeText={setRaio} keyboardType="number-pad" />
        </>
      ) : null}
      {erro ? <Nota tom="erro">{erro}</Nota> : null}
      <Botao titulo="Salvar" aoTocar={aoSalvar} carregando={enviando} />
    </Tela>
  );
}
