export interface EnderecoDoCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Devolve null quando o CEP não existe ou o serviço falha, e a pessoa preenche à mão. */
export async function buscarCep(cep: string): Promise<EnderecoDoCep | null> {
  const numeros = cep.replace(/\D/g, '');
  if (numeros.length !== 8) {
    return null;
  }
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 6000);
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${numeros}/json/`, { signal: controle.signal });
    const dados = await resposta.json();
    if (!resposta.ok || dados.erro) {
      return null;
    }
    return { logradouro: dados.logradouro, bairro: dados.bairro, cidade: dados.localidade, uf: dados.uf };
  } catch {
    return null;
  } finally {
    clearTimeout(limite);
  }
}
