import mysql from "mysql2/promise";

let pool;

export function obterPool() {
  if (pool) return pool;

  const host = process.env.DB_HOST || "127.0.0.1";
  const portaTexto = process.env.DB_PORT || "3306";
  const port = Number(portaTexto);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (
    !user?.trim() ||
    !password ||
    !/^\d+$/.test(portaTexto) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    const erro = new Error(
      "Defina DB_USER, DB_PASSWORD e uma DB_PORT válida (1 a 65535)."
    );
    erro.code = "DB_CONFIG_INVALID";
    throw erro;
  }

  // Sem database: esta etapa valida somente o acesso ao servidor MySQL.
  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    connectionLimit: 5,
    connectTimeout: 10000,
  });

  return pool;
}

export async function verificarConexao() {
  await obterPool().execute("SELECT 1");
}

export async function encerrarPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
