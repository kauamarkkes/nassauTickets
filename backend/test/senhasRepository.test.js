import assert from "node:assert/strict";
import { test } from "node:test";
import { obterPool, encerrarPool } from "../src/db.js";
import {
  emitirSenha,
  inserirSenhaNaTransacao,
  listarSenhas,
} from "../src/senhasRepository.js";

test("emissão no MySQL preserva formato, sequência e dados após rollback", async () => {
  const pool = obterPool();
  const conexao = await pool.getConnection();
  try {
    const [antes] = await pool.execute("SELECT COUNT(*) AS total FROM senhas");
    await conexao.beginTransaction();

    const agora = new Date(2026, 10, 16, 12);
    const sp = await inserirSenhaNaTransacao(conexao, "SP", agora);
    const sg = await inserirSenhaNaTransacao(conexao, "SG", agora);
    const outroSp = await inserirSenhaNaTransacao(conexao, "SP", agora);

    assert.match(sp.numero, /^\d{6}-SP\d{3}$/);
    assert.equal(sg.numero.slice(-3), sp.numero.slice(-3));
    assert.equal(
      Number(outroSp.numero.slice(-3)),
      Number(sp.numero.slice(-3)) + 1
    );
    assert.equal(sp.status, "AGUARDANDO");
    assert.equal(sp.chamadas, 0);
    assert.equal(sp.guiche, null);
    assert.match(sp.dataHoraEmissao, /Z$/);
    await assert.rejects(inserirSenhaNaTransacao(conexao, "X", agora), {
      code: "TIPO_INVALIDO",
    });

    await conexao.rollback();
    const [depois] = await pool.execute("SELECT COUNT(*) AS total FROM senhas");
    assert.equal(depois[0].total, antes[0].total);
    assert.equal((await listarSenhas()).length, antes[0].total);
    await assert.rejects(emitirSenha("X"), { code: "TIPO_INVALIDO" });
  } finally {
    try {
      await conexao.rollback();
    } finally {
      conexao.release();
      await encerrarPool();
    }
  }
});
