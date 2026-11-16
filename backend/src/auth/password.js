import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PARAMETROS = { N: 16384, r: 8, p: 5, maxmem: 64 * 1024 * 1024 };
const TAMANHO_CHAVE = 32;
const TAMANHO_SALT = 16;
const LIMITE_SENHA_BYTES = 1024;
const PREFIXO = "scrypt$16384$8$5";
const FORMATO = /^scrypt\$16384\$8\$5\$([0-9a-f]{32})\$([0-9a-f]{64})$/;

function senhaValida(senha) {
  return typeof senha === "string" &&
    senha.length > 0 &&
    Buffer.byteLength(senha, "utf8") <= LIMITE_SENHA_BYTES;
}

export async function gerarHashSenha(senha) {
  if (!senhaValida(senha)) {
    throw new TypeError("Informe uma senha válida.");
  }

  const salt = randomBytes(TAMANHO_SALT);
  const chave = await scrypt(senha, salt, TAMANHO_CHAVE, PARAMETROS);
  return `${PREFIXO}$${salt.toString("hex")}$${chave.toString("hex")}`;
}

export async function verificarSenha(senha, hashArmazenado) {
  if (!senhaValida(senha) || typeof hashArmazenado !== "string") {
    return false;
  }

  const partes = FORMATO.exec(hashArmazenado);
  if (!partes) return false;

  const salt = Buffer.from(partes[1], "hex");
  const hashEsperado = Buffer.from(partes[2], "hex");
  const hashCalculado = await scrypt(senha, salt, TAMANHO_CHAVE, PARAMETROS);
  return timingSafeEqual(hashCalculado, hashEsperado);
}
