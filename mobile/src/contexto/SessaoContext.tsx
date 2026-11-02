import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { definirAoSessaoExpirar, definirToken } from '../dados/api';
import { limparTudo } from '../dados/bancoLocal';
import { apagarSessao, lerSessao, salvarSessao } from '../dados/sessaoLocal';
import { cancelarTodasAsNotificacoes } from '../servicos/notificacaoServico';
import { Sessao, Usuario } from '../tipos/modelos';

interface ValorSessao {
  usuario: Usuario | null;
  iniciando: boolean;
  iniciarSessao: (sessao: Sessao) => Promise<void>;
  atualizarUsuario: (usuario: Usuario) => Promise<void>;
  encerrarSessao: () => Promise<void>;
}

const Contexto = createContext<ValorSessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [iniciando, setIniciando] = useState(true);

  const encerrarSessao = useCallback(async () => {
    definirToken(null);
    setSessao(null);
    await apagarSessao();
    await limparTudo();
    await cancelarTodasAsNotificacoes();
  }, []);

  useEffect(() => {
    definirAoSessaoExpirar(encerrarSessao);
    lerSessao()
      .then((salva) => {
        if (salva) {
          definirToken(salva.token);
          setSessao(salva);
        }
      })
      .finally(() => setIniciando(false));
  }, [encerrarSessao]);

  const valor = useMemo<ValorSessao>(
    () => ({
      usuario: sessao?.usuario ?? null,
      iniciando,
      encerrarSessao,
      iniciarSessao: async (nova) => {
        definirToken(nova.token);
        await salvarSessao(nova);
        setSessao(nova);
      },
      atualizarUsuario: async (usuario) => {
        if (sessao) {
          const atualizada = { ...sessao, usuario };
          await salvarSessao(atualizada);
          setSessao(atualizada);
        }
      },
    }),
    [sessao, iniciando, encerrarSessao],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao() {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('useSessao precisa estar dentro de SessaoProvider');
  }
  return valor;
}
