import assert from "node:assert/strict";
import { test } from "node:test";
import { obterPool, encerrarPool } from "../src/db.js";
import {
  emitirSenha,
  inserirSenhaNaTransacao,
  listarSenhas,
  chamarProximaNaTransacao,
  iniciarAtendimentoNaTransacao,
  finalizarAtendimentoNaTransacao,
  chamarNovamenteNaTransacao,
  marcarNaoCompareceuNaTransacao,
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

test("chamada, atendimento e ausência seguem os estados sem persistir dados de teste", async () => {
  const pool = obterPool();
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const agora = new Date();
    const sp = await inserirSenhaNaTransacao(conexao, "SP", agora);
    const se = await inserirSenhaNaTransacao(conexao, "SE", agora);
    const sg = await inserirSenhaNaTransacao(conexao, "SG", agora);

    const primeira = await chamarProximaNaTransacao(conexao, 60001, "Teste");
    assert.equal(primeira.numero, sp.numero);
    assert.equal(primeira.status, "CHAMADA");
    await assert.rejects(chamarProximaNaTransacao(conexao, 60001, "Teste"), {
      status: 409,
    });
    const iniciada = await iniciarAtendimentoNaTransacao(conexao, sp.numero);
    assert.equal(iniciada.status, "EM_ATENDIMENTO");
    const finalizada = await finalizarAtendimentoNaTransacao(conexao, sp.numero);
    assert.equal(finalizada.status, "ATENDIDA");

    const segunda = await chamarProximaNaTransacao(conexao, 60002, "Teste");
    assert.equal(segunda.numero, se.numero);
    const rechamada = await chamarNovamenteNaTransacao(conexao, se.numero);
    assert.equal(rechamada.chamadas, 2);
    assert.equal(rechamada.status, "CHAMADA_NOVAMENTE");
    const ausente = await marcarNaoCompareceuNaTransacao(conexao, se.numero);
    assert.equal(ausente.status, "NÃO_COMPARECEU");
    const terceira = await chamarProximaNaTransacao(conexao, 60003, "Teste");
    assert.equal(terceira.numero, sg.numero);
  } finally {
    try {
      await conexao.rollback();
    } finally {
      conexao.release();
      await encerrarPool();
    }
  }
});
