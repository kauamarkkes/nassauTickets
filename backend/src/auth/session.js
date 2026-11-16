import { createHash, randomBytes } from "node:crypto";
import { obterPool } from "../db.js";
import { verificarSenha } from "./password.js";

const NOME_COOKIE = "nt_sessao";
const DURACAO_SEGUNDOS = 8 * 60 * 60;
const TOKEN_VALIDO = /^[0-9a-f]{64}$/;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenDaRequisicao(req) {
  const entrada = req.headers.cookie?.split(";").map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${NOME_COOKIE}=`));
  const token = entrada?.slice(NOME_COOKIE.length + 1);
  return TOKEN_VALIDO.test(token ?? "") ? token : null;
}

function cookie(valor, limpar = false) {
  const atributos = [
    `${NOME_COOKIE}=${valor}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${limpar ? 0 : DURACAO_SEGUNDOS}`,
  ];
  if (process.env.NODE_ENV === "production") atributos.push("Secure");
  return atributos.join("; ");
}

export async function criarSessao(login, senha, banco = obterPool()) {
  if (typeof login !== "string" || !/^[a-zA-Z0-9._-]{3,80}$/.test(login) ||
      typeof senha !== "string" || !senha || Buffer.byteLength(senha, "utf8") > 1024) {
    return null;
  }

  const [linhas] = await banco.execute(
    "SELECT id, login, nome, perfil, senha_hash FROM atendentes WHERE login = ? AND ativo = TRUE",
    [login]
  );
  const atendente = linhas[0];
  if (!atendente || !(await verificarSenha(senha, atendente.senha_hash))) return null;

  const token = randomBytes(32).toString("hex");
  await banco.execute(
    `INSERT INTO sessoes_atendentes (token_hash, atendente_id, criada_em, expira_em)
     VALUES (?, ?, UTC_TIMESTAMP(3), DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND))`,
    [hashToken(token), atendente.id, DURACAO_SEGUNDOS]
  );
  return { token, usuario: { id: atendente.id, login: atendente.login, nome: atendente.nome, perfil: atendente.perfil } };
}

export async function usuarioDaSessao(req, banco = obterPool()) {
  const token = tokenDaRequisicao(req);
  if (!token) return null;
  const [linhas] = await banco.execute(
    `SELECT a.id, a.login, a.nome, a.perfil
     FROM sessoes_atendentes s JOIN atendentes a ON a.id = s.atendente_id
     WHERE s.token_hash = ? AND s.expira_em > UTC_TIMESTAMP(3) AND a.ativo = TRUE`,
    [hashToken(token)]
  );
  return linhas[0] ?? null;
}

export async function encerrarSessao(req, banco = obterPool()) {
  const token = tokenDaRequisicao(req);
  if (token) {
    await banco.execute("DELETE FROM sessoes_atendentes WHERE token_hash = ?", [hashToken(token)]);
  }
}

export function definirCookieSessao(res, token) {
  res.setHeader("Set-Cookie", cookie(token));
}

export function limparCookieSessao(res) {
  res.setHeader("Set-Cookie", cookie("", true));
}
