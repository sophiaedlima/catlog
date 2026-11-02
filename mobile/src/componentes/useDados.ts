import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { Resultado } from '../servicos/comCopiaLocal';

/** Carrega os dados toda vez que a tela volta ao foco e expõe os estados pedidos na RNF10. */
export function useDados<T>(carregar: () => Promise<Resultado<T>>) {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [daCopiaLocal, setDaCopiaLocal] = useState(false);
  const ultimaChamada = useRef(0);

  const recarregar = useCallback(async () => {
    const chamada = ++ultimaChamada.current;
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await carregar();
      if (chamada === ultimaChamada.current) {
        setDados(resultado.dados);
        setDaCopiaLocal(resultado.daCopiaLocal);
      }
    } catch (falha) {
      if (chamada === ultimaChamada.current) {
        setErro(falha instanceof Error ? falha.message : 'Algo deu errado. Tente de novo.');
      }
    } finally {
      if (chamada === ultimaChamada.current) {
        setCarregando(false);
      }
    }
  }, [carregar]);

  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar]),
  );

  return { dados, carregando, erro, daCopiaLocal, recarregar };
}

export const online = <T,>(dados: T): Resultado<T> => ({ dados, daCopiaLocal: false });
