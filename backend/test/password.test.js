import assert from "node:assert/strict";
import { test } from "node:test";
import { gerarHashSenha, verificarSenha } from "../src/auth/password.js";

test("hash de senha aceita somente a credencial correta", async () => {
  const hash = await gerarHashSenha("Senha acadêmica 2026!");
  assert.match(hash, /^scrypt\$16384\$8\$5\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  assert.equal(hash.includes("Senha acadêmica"), false);
  assert.equal(await verificarSenha("Senha acadêmica 2026!", hash), true);
  assert.equal(await verificarSenha("senha errada", hash), false);
});

test("cada hash usa um salt distinto", async () => {
  const primeiro = await gerarHashSenha("mesma senha de teste");
  const segundo = await gerarHashSenha("mesma senha de teste");
  assert.notEqual(primeiro, segundo);
  assert.equal(await verificarSenha("mesma senha de teste", primeiro), true);
  assert.equal(await verificarSenha("mesma senha de teste", segundo), true);
});

test("entradas inválidas e hashes malformados são rejeitados", async () => {
  await assert.rejects(gerarHashSenha(""), TypeError);
  await assert.rejects(gerarHashSenha("x".repeat(1025)), TypeError);
  assert.equal(await verificarSenha("teste", "hash inválido"), false);
  assert.equal(await verificarSenha("teste", "scrypt$999999999$8$5$"), false);
  assert.equal(await verificarSenha(null, "hash inválido"), false);
});
