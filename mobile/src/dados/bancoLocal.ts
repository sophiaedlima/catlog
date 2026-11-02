import * as SQLite from 'expo-sqlite';

/** Cópia local dos dados (R5, RNF04) e fila das ações feitas sem internet. */
let banco: SQLite.SQLiteDatabase | null = null;

export async function abrirBanco(): Promise<SQLite.SQLiteDatabase> {
  if (banco) {
    return banco;
  }
  const aberto = await SQLite.openDatabaseAsync('catlog.db');
  await aberto.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS gato (id INTEGER PRIMARY KEY, dados TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS item_saude (id INTEGER PRIMARY KEY, gato_id INTEGER NOT NULL, dados TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS registro_peso (id INTEGER PRIMARY KEY, gato_id INTEGER NOT NULL, dados TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS visita (id INTEGER PRIMARY KEY, inicio TEXT NOT NULL, situacao TEXT NOT NULL, dados TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS consulta (chave TEXT PRIMARY KEY, dados TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS fila_acao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      visita_id INTEGER NOT NULL,
      dados TEXT NOT NULL,
      erro TEXT,
      criada_em TEXT NOT NULL
    );
  `);
  banco = aberto;
  return aberto;
}

export async function salvarConsulta(chave: string, dados: unknown) {
  const db = await abrirBanco();
  await db.runAsync('INSERT OR REPLACE INTO consulta (chave, dados) VALUES (?, ?)', chave, JSON.stringify(dados));
}

export async function lerConsulta<T>(chave: string): Promise<T | null> {
  const db = await abrirBanco();
  const linha = await db.getFirstAsync<{ dados: string }>('SELECT dados FROM consulta WHERE chave = ?', chave);
  return linha ? (JSON.parse(linha.dados) as T) : null;
}

export async function substituirLinhas(
  tabela: 'gato',
  linhas: { id: number; dados: unknown }[],
): Promise<void> {
  const db = await abrirBanco();
  await db.withExclusiveTransactionAsync(async (transacao) => {
    await transacao.runAsync(`DELETE FROM ${tabela}`);
    for (const linha of linhas) {
      await transacao.runAsync(`INSERT INTO ${tabela} (id, dados) VALUES (?, ?)`, linha.id, JSON.stringify(linha.dados));
    }
  });
}

export async function lerLinhas<T>(tabela: 'gato'): Promise<T[]> {
  const db = await abrirBanco();
  const linhas = await db.getAllAsync<{ dados: string }>(`SELECT dados FROM ${tabela}`);
  return linhas.map((l) => JSON.parse(l.dados) as T);
}

export async function substituirDoGato(
  tabela: 'item_saude' | 'registro_peso',
  gatoId: number,
  linhas: { id: number }[],
): Promise<void> {
  const db = await abrirBanco();
  await db.withExclusiveTransactionAsync(async (transacao) => {
    await transacao.runAsync(`DELETE FROM ${tabela} WHERE gato_id = ?`, gatoId);
    for (const linha of linhas) {
      await transacao.runAsync(
        `INSERT INTO ${tabela} (id, gato_id, dados) VALUES (?, ?, ?)`,
        linha.id,
        gatoId,
        JSON.stringify(linha),
      );
    }
  });
}

export async function lerDoGato<T>(tabela: 'item_saude' | 'registro_peso', gatoId: number): Promise<T[]> {
  const db = await abrirBanco();
  const linhas = await db.getAllAsync<{ dados: string }>(
    `SELECT dados FROM ${tabela} WHERE gato_id = ? ORDER BY id`,
    gatoId,
  );
  return linhas.map((l) => JSON.parse(l.dados) as T);
}

/** Apaga os dados locais, usado ao sair da conta para não deixar nada de um usuário para o próximo. */
export async function limparTudo() {
  const db = await abrirBanco();
  await db.execAsync(`
    DELETE FROM gato; DELETE FROM item_saude; DELETE FROM registro_peso;
    DELETE FROM visita; DELETE FROM consulta; DELETE FROM fila_acao;
  `);
}
