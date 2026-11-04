const URL_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080').replace(/\/$/, '');
const TEMPO_LIMITE_MS = 15000;

/** A API não respondeu: sem internet, servidor fora do ar ou tempo esgotado. */
export class ErroDeRede extends Error {
  constructor() {
    super('Sem conexão com o servidor. Confira sua internet e tente de novo.');
  }
}

/** A API respondeu recusando o pedido, com uma mensagem pronta para o usuário. */
export class ErroDaApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

let token: string | null = null;
let aoSessaoExpirar: (() => void) | null = null;
let aoMudarConexao: ((alcancavel: boolean) => void) | null = null;

export function definirToken(novo: string | null) {
  token = novo;
}

export function definirAoSessaoExpirar(funcao: () => void) {
  aoSessaoExpirar = funcao;
}

export function definirAoMudarConexao(funcao: (alcancavel: boolean) => void) {
  aoMudarConexao = funcao;
}

export function urlDaFoto(caminho: string | null | undefined): string | undefined {
  if (!caminho) {
    return undefined;
  }
  return caminho.startsWith('/') ? URL_BASE + caminho : caminho;
}

async function requisitar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  const cabecalhos: Record<string, string> = {};
  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }
  const ehFormulario = corpo instanceof FormData;
  if (corpo !== undefined && !ehFormulario) {
    cabecalhos['Content-Type'] = 'application/json';
  }

  let resposta: Response;
  try {
    resposta = await fetch(URL_BASE + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: ehFormulario ? corpo : corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
  } catch {
    aoMudarConexao?.(false);
    throw new ErroDeRede();
  } finally {
    clearTimeout(limite);
  }
  aoMudarConexao?.(true);

  if (resposta.status === 204) {
    return undefined as T;
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    if (resposta.status === 401 && token) {
      aoSessaoExpirar?.();
    }
    throw new ErroDaApi(resposta.status, dados?.mensagem ?? 'Algo deu errado. Tente de novo.');
  }
  return dados as T;
}

export const api = {
  get: <T>(caminho: string) => requisitar<T>('GET', caminho),
  post: <T>(caminho: string, corpo?: unknown) => requisitar<T>('POST', caminho, corpo),
  put: <T>(caminho: string, corpo?: unknown) => requisitar<T>('PUT', caminho, corpo),
  delete: (caminho: string) => requisitar<void>('DELETE', caminho),
};
