import mysql from "mysql2/promise";

let pool;

export function obterPool() {
  if (pool) return pool;

  const host = process.env.DB_HOST || "127.0.0.1";
  const portaTexto = process.env.DB_PORT || "3306";
  const port = Number(portaTexto);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME?.trim();

  if (
    !user?.trim() ||
    !password ||
    !database ||
    !/^\d+$/.test(portaTexto) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    const erro = new Error(
      "Defina DB_USER, DB_PASSWORD, DB_NAME e uma DB_PORT válida (1 a 65535)."
    );
    erro.code = "DB_CONFIG_INVALID";
    throw erro;
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    dateStrings: true,
    connectionLimit: 5,
    connectTimeout: 10000,
  });

  return pool;
}

export async function verificarConexao() {
  await obterPool().execute("SELECT 1");
  const [estado] = await obterPool().execute(
    "SELECT id FROM estado_fila WHERE id = 1"
  );
  if (estado.length !== 1) {
    const erro = new Error("Estado da fila não inicializado.");
    erro.code = "DB_SCHEMA_INVALID";
    throw erro;
  }
  await obterPool().execute("SELECT id FROM atendentes LIMIT 1");
  await obterPool().execute("SELECT token_hash FROM sessoes_atendentes LIMIT 1");
  await obterPool().execute("SELECT encerrada_em FROM senhas LIMIT 1");
}

export async function encerrarPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
