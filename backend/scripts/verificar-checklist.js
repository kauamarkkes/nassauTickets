// Só confere a lista. Não altera código de ninguém.
// Rodar com backend ligado: node backend/scripts/verificar-checklist.js
const API = process.env.API_URL || "http://localhost:3000";
let passou = 0, falhou = 0;
function ok(nome, cond, detalhe = "") {
  if (cond) { passou++; console.log(`✅ PASS - ${nome}`); }
  else { falhou++; console.log(`❌ FAIL - ${nome} ${detalhe}`); }
}
async function req(path, opt = {}) {
  const r = await fetch(API + path, { ...opt, headers: { "Content-Type": "application/json", ...opt.headers } });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, dados: j.dados ?? j };
}
async function login() {
  const r = await fetch(API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login: "admin", senha: "Admin12345678" }) });
  return r.headers.get("set-cookie") || "";
}
async function main() {
  // Backend 1 - Numeração YYMMDD-PPSQ, sequência independente por tipo, reinício diário
  const s1 = await req("/senhas", { method: "POST", body: JSON.stringify({ tipo: "SP" }) });
  const s2 = await req("/senhas", { method: "POST", body: JSON.stringify({ tipo: "SP" }) });
  const s3 = await req("/senhas", { method: "POST", body: JSON.stringify({ tipo: "SE" }) });
  const hoje = new Date();
  const yymmdd = String(hoje.getFullYear()).slice(2) + String(hoje.getMonth()+1).padStart(2,"0") + String(hoje.getDate()).padStart(2,"0");
  const seq = (n) => Number(n.split("-")[1].slice(2));
  ok("Numeração formato YYMMDD-PPSQ", /^\d{6}-(SP|SE|SG)\d{3}$/.test(s1.dados.numero), s1.dados.numero);
  ok("Sequência independente por tipo", seq(s2.dados.numero) === seq(s1.dados.numero)+1 && seq(s3.dados.numero) === 1, `${s1.dados.numero} / ${s2.dados.numero} / ${s3.dados.numero}`);
  ok("Reinício diário - data de hoje", s1.dados.numero.startsWith(yymmdd), s1.dados.numero);

  // Backend 2 - Prioridade e alternância
  const cookie = await login();
  const auth = { headers: { Cookie: cookie } };
  for (let i=0;i<10;i++){ const c = await req("/atendimentos/proxima", { method:"POST", body: JSON.stringify({ guiche: 99 }), ...auth }); if(c.status===404) break; }
  await req("/senhas", { method:"POST", body: JSON.stringify({ tipo:"SE" }) });
  await req("/senhas", { method:"POST", body: JSON.stringify({ tipo:"SP" }) });
  await req("/senhas", { method:"POST", body: JSON.stringify({ tipo:"SG" }) });
  const c1 = await req("/atendimentos/proxima", { method:"POST", body: JSON.stringify({ guiche: 90 }), ...auth });
  ok("Prioridade: SP antes de SE/SG", c1.dados.tipo === "SP", `chamou ${c1.dados.tipo}`);
  const c2 = await req("/atendimentos/proxima", { method:"POST", body: JSON.stringify({ guiche: 91 }), ...auth });
  ok("Alternância: após SP, chama não-SP", c2.dados.tipo !== "SP", `chamou ${c2.dados.tipo}`);

  // Backend 3 - Transições e bloqueio
  const t = await req("/senhas", { method:"POST", body: JSON.stringify({ tipo:"SG" }) });
  const fin = await req(`/senhas/${t.dados.numero}/finalizar`, { method:"PATCH", ...auth });
  ok("Bloqueia finalizar sem iniciar", fin.status === 409 || fin.status === 400, `status ${fin.status}`);
  const ini = await req(`/senhas/${t.dados.numero}/iniciar`, { method:"PATCH", ...auth });
  ok("Bloqueia iniciar sem chamar", ini.status === 409 || ini.status === 400, `status ${ini.status}`);
  const rec = await req(`/senhas/${t.dados.numero}/chamar-novamente`, { method:"POST", ...auth });
  ok("Bloqueia rechamar sem ter sido chamada", rec.status === 409 || rec.status === 400, `status ${rec.status}`);
  const inv = await req("/senhas", { method:"POST", body: JSON.stringify({ tipo:"XX" }) });
  ok("Bloqueia tipo inválido", inv.status === 400, `status ${inv.status}`);

  // Backend 4 - Chamadas concorrentes, MySQL indisponível e recuperação
  await req("/senhas", { method:"POST", body: JSON.stringify({ tipo:"SP" }) });
  const [p1, p2] = await Promise.all([
    req("/atendimentos/proxima", { method:"POST", body: JSON.stringify({ guiche: 80 }), ...auth }),
    req("/atendimentos/proxima", { method:"POST", body: JSON.stringify({ guiche: 81 }), ...auth }),
  ]);
  ok("Concorrência: 2 chamadas não pegam a mesma senha", p1.dados.numero !== p2.dados.numero, `${p1.dados.numero} vs ${p2.dados.numero}`);
  const health = await req("/");
  ok("API responde com MySQL ligado", health.status === 200, `status ${health.status}`);
  console.log("MANUAL - MySQL indisponível/recuperação: desligue o MySQL, tente emitir (deve dar erro sem expor SQL), ligue de novo e emita (deve voltar).");

  // Backend 5 - Relatórios diários/mensais e auditoria
  const hojeISO = new Date().toISOString().slice(0,10);
  const dia = await req(`/admin/resumo?inicio=${hojeISO}&fim=${hojeISO}`, auth);
  ok("Relatório diário", dia.status === 200 && typeof dia.dados.total === "number", `status ${dia.status}`);
  const mes = hojeISO.slice(0,7);
  const inicioMes = `${mes}-01`;
  const fimMes = new Date(new Date(inicioMes).getFullYear(), new Date(inicioMes).getMonth()+1, 0).toISOString().slice(0,10);
  const mensal = await req(`/admin/resumo?inicio=${inicioMes}&fim=${fimMes}`, auth);
  ok("Relatório mensal", mensal.status === 200 && Array.isArray(mensal.dados.porDia), `status ${mensal.status}`);
  const audit = await req("/admin/auditoria", auth);
  if (audit.status === 404) console.log("⚠️ Auditoria: ROTA NÃO EXISTE - marcar PENDENTE");
  else ok("Auditoria", audit.status === 200, `status ${audit.status}`);

  console.log(`\nRESULTADO: PASS ${passou} | FAIL ${falhou}`);
}
main().catch(e => console.error("Erro:", e.message));
