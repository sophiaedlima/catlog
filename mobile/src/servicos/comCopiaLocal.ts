import { ErroDeRede } from '../dados/api';

export interface Resultado<T> {
  dados: T;
  daCopiaLocal: boolean;
}

/** Busca na API e guarda a resposta. Sem conexão, devolve a última cópia salva no celular. */
export async function comCopiaLocal<T>(
  buscar: () => Promise<T>,
  salvar: (dados: T) => Promise<void>,
  lerCopia: () => Promise<T | null>,
): Promise<Resultado<T>> {
  try {
    const dados = await buscar();
    await salvar(dados);
    return { dados, daCopiaLocal: false };
  } catch (erro) {
    if (erro instanceof ErroDeRede) {
      const copia = await lerCopia();
      if (copia !== null) {
        return { dados: copia, daCopiaLocal: true };
      }
    }
    throw erro;
  }
}
