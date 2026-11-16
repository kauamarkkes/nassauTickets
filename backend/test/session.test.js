import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { obterPool, encerrarPool } from "../src/db.js";
import { gerarHashSenha } from "../src/auth/password.js";
import {
  criarSessao, usuarioDaSessao, encerrarSessao,
  definirCookieSessao, limparCookieSessao,
} from "../src/auth/session.js";

test("login, restauração e logout usam sessão persistida no MySQL", async () => {
  const pool = obterPool();
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const login = `teste_${randomUUID().slice(0, 12)}`;
    const senha = "senha de teste sem dados reais";
    const hash = await gerarHashSenha(senha);
    await conexao.execute(
      "INSERT INTO atendentes (login, nome, senha_hash, perfil) VALUES (?, ?, ?, ?)",
      [login, "Atendente de teste", hash, "ATENDENTE"]
    );

    assert.equal(await criarSessao(login, "incorreta", conexao), null);
    const sessao = await criarSessao(login, senha, conexao);
    assert.equal(sessao.usuario.login, login);
    assert.equal(sessao.usuario.senha_hash, undefined);
    const [linhas] = await conexao.execute(
      "SELECT token_hash FROM sessoes_atendentes WHERE atendente_id = ?",
      [sessao.usuario.id]
    );
    assert.equal(linhas.length, 1);
    assert.notEqual(linhas[0].token_hash, sessao.token);

    const resposta = { setHeader(_nome, valor) { this.cookie = valor; } };
    definirCookieSessao(resposta, sessao.token);
    assert.match(resposta.cookie, /HttpOnly; SameSite=Lax/);
    const req = { headers: { cookie: resposta.cookie.split(";")[0] } };
    assert.equal((await usuarioDaSessao(req, conexao)).login, login);
    await encerrarSessao(req, conexao);
    assert.equal(await usuarioDaSessao(req, conexao), null);
    limparCookieSessao(resposta);
    assert.match(resposta.cookie, /Max-Age=0/);
  } finally {
    try { await conexao.rollback(); }
    finally { conexao.release(); await encerrarPool(); }
  }
});
