import assert from "node:assert/strict";
import { test } from "node:test";
import { verificarSenha } from "../src/auth/password.js";
import { criarUsuario, definirOrdemFila, obterResumoDia } from "../src/adminRepository.js";

test("resumo do gestor agrega senhas do dia sem alterar o banco", async () => {
  const consultas = [];
  const banco = { async execute(sql, parametros) {
    consultas.push({ sql, parametros });
    if (sql.includes("COUNT(*)")) return [[
      { tipo: "SP", status: "ATENDIDA", quantidade: 2 },
      { tipo: "SG", status: "AGUARDANDO", quantidade: 1 },
    ]];
    return [[{ numero: "261116-SP001", tipo: "SP", status: "ATENDIDA", guiche: 1 }]];
  } };
  const resumo = await obterResumoDia(banco);
  assert.equal(resumo.total, 3);
  assert.deepEqual(resumo.porTipo, { SP: 2, SG: 1, SE: 0 });
  assert.equal(resumo.porStatus.ATENDIDA, 2);
  assert.equal(resumo.ultimasChamadas.length, 1);
  assert.equal(consultas.length, 2);
  assert.match(consultas[0].parametros[0], /^\d{6}$/);
  assert.equal(consultas[0].parametros[0], consultas[1].parametros[0]);
});

test("cadastro valida dados e grava apenas hash da senha", async () => {
  const comandos = [];
  const banco = { async execute(sql, parametros) {
    comandos.push({ sql, parametros });
    return [{ insertId: 7 }];
  } };
  await assert.rejects(criarUsuario({ login: "x", nome: "Teste", perfil: "ATENDENTE", senha: "senha longa de teste" }, banco), { status: 400 });
  await assert.rejects(criarUsuario({ login: 123, nome: "Teste", perfil: "ATENDENTE", senha: "senha longa de teste" }, banco), { status: 400 });
  assert.equal(comandos.length, 0);
  const usuario = await criarUsuario({ login: "atendente3", nome: "Teste", perfil: "ATENDENTE", senha: "senha longa de teste" }, banco);
  assert.deepEqual(usuario, { id: 7, login: "atendente3", nome: "Teste", perfil: "ATENDENTE", ativo: true });
  assert.notEqual(comandos[0].parametros[2], "senha longa de teste");
  assert.equal(await verificarSenha("senha longa de teste", comandos[0].parametros[2]), true);
});

test("gestor escolhe somente SE ou SG como próximo tipo não prioritário", async () => {
  const comandos = [];
  const banco = { async execute(sql, parametros) { comandos.push({ sql, parametros }); return [{ affectedRows: 1 }]; } };
  await assert.rejects(definirOrdemFila("SP", banco), { status: 400 });
  assert.equal(comandos.length, 0);
  assert.deepEqual(await definirOrdemFila("SG", banco), { proximoNaoPrioritario: "SG" });
  assert.deepEqual(comandos[0].parametros, ["SG"]);
});
