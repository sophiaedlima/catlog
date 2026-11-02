import NetInfo from '@react-native-community/netinfo';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { definirAoMudarConexao } from '../dados/api';
import { aoMudarFila, contarPendentes, sincronizar } from '../servicos/filaServico';

interface Conexao {
  online: boolean;
  pendentes: number;
}

const Contexto = createContext<Conexao>({ online: true, pendentes: 0 });

export function ConexaoProvider({ children }: { children: ReactNode }) {
  const [redeLigada, setRedeLigada] = useState(true);
  const [apiAlcancavel, setApiAlcancavel] = useState(true);
  const [pendentes, setPendentes] = useState(0);

  const atualizarPendentes = useCallback(() => {
    contarPendentes().then(setPendentes);
  }, []);

  useEffect(() => {
    definirAoMudarConexao(setApiAlcancavel);
    atualizarPendentes();
    const pararFila = aoMudarFila(atualizarPendentes);
    const pararRede = NetInfo.addEventListener((estado) => {
      const ligada = estado.isConnected !== false;
      setRedeLigada(ligada);
      if (ligada) {
        sincronizar();
      }
    });
    return () => {
      pararFila();
      pararRede();
    };
  }, [atualizarPendentes]);

  return (
    <Contexto.Provider value={{ online: redeLigada && apiAlcancavel, pendentes }}>{children}</Contexto.Provider>
  );
}

export const useConexao = () => useContext(Contexto);
