import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import { test } from "node:test";

test("API lê o MySQL e preserva respostas sem gravar dados de teste", async () => {
  const reserva = net.createServer();
  reserva.listen(0, "127.0.0.1");
  await once(reserva, "listening");
  const porta = reserva.address().port;
  await new Promise((resolve) => reserva.close(resolve));

  const filho = spawn(process.execPath, ["--input-type=module", "-e",
    "process.on('message', () => { process.disconnect(); process.emit('SIGTERM'); }); await import('./src/server.js');"
  ], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(porta) },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  let saida = "";
  let erros = "";
  filho.stdout.on("data", (dados) => { saida += dados; });
  filho.stderr.on("data", (dados) => { erros += dados; });
  const terminou = once(filho, "exit");

  try {
    const limite = Date.now() + 10000;
    while (!saida.includes("Servidor rodando") && !erros) {
      assert.ok(Date.now() < limite, "Tempo esgotado ao iniciar a API");
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(erros, "");
    const url = `http://127.0.0.1:${porta}`;
    const raiz = await fetch(url);
    assert.equal(raiz.status, 200);
    assert.deepEqual(await raiz.json(), { mensagem: "API nassauTickets funcionando" });

    const senhas = await fetch(`${url}/senhas`);
    assert.equal(senhas.status, 401);

    const painel = await fetch(`${url}/painel`);
    assert.equal(painel.status, 200);
    assert.ok(Array.isArray((await painel.json()).anteriores));

    const invalida = await fetch(`${url}/senhas`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "XX" }),
    });
    assert.equal(invalida.status, 400);

    const sessao = await fetch(`${url}/auth/session`);
    assert.equal(sessao.status, 401);

    const login = await fetch(`${url}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: "inexistente", senha: "senha errada" }),
    });
    assert.equal(login.status, 401);

    const protegido = await fetch(`${url}/senhas/000000-SP000/iniciar`, { method: "PATCH" });
    assert.equal(protegido.status, 401);

    const origemIndevida = await fetch(`${url}/auth/logout`, {
      method: "POST", headers: { Origin: "https://example.invalid" },
    });
    assert.equal(origemIndevida.status, 403);

    const logout = await fetch(`${url}/auth/logout`, { method: "POST" });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  } finally {
    if (filho.connected) filho.send("stop");
    await terminou;
    if (filho.exitCode === null) filho.kill();
  }
});
