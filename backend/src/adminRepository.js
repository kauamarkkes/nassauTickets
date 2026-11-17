import { obterPool } from "./db.js";
import { gerarHashSenha } from "./auth/password.js";
import { redefinirSenhaAtendente } from "./auth/resetPassword.js";

function falha(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function hojeLocal() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

function validarSenha(senha) {
  if (typeof senha !== "string" || [...senha].length < 12 || Buffer.byteLength(senha, "utf8") > 1024) {
    throw falha(400, "A senha precisa ter entre 12 caracteres e 1024 bytes.");
  }
}

const STATUS = new Set([
  "EMITIDA", "AGUARDANDO", "CHAMADA", "CHAMADA_NOVAMENTE",
  "EM_ATENDIMENTO", "ATENDIDA", "NÃO_COMPARECEU",
]);

function validarData(valor) {
  if (typeof valor !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(valor)) {
    throw falha(400, "Informe datas no formato AAAA-MM-DD.");
  }
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    throw falha(400, "Informe uma data válida.");
  }
  return data;
}

export async function obterResumoDia(banco = obterPool(), filtros = {}) {
  const inicio = filtros.inicio || hojeLocal();
  const fim = filtros.fim || inicio;
  const dataInicio = validarData(inicio);
  const dataFim = validarData(fim);
  const dias = (dataFim - dataInicio) / 86400000;
  if (dias < 0 || dias > 365) throw falha(400, "Escolha um período de até 366 dias em ordem cronológica.");
  const tipo = filtros.tipo || "";
  const status = filtros.status || "";
  const guiche = filtros.guiche || "";
  if (tipo && !["SP", "SG", "SE"].includes(tipo)) throw falha(400, "Tipo de senha inválido.");
  if (status && !STATUS.has(status)) throw falha(400, "Situação inválida.");
  if (guiche && (!/^\d{1,5}$/.test(String(guiche)) || Number(guiche) < 1 || Number(guiche) > 65535)) {
    throw falha(400, "Guichê inválido.");
  }
  const condicoes = ["data_emissao BETWEEN ? AND ?"];
  const parametros = [inicio.slice(2).replaceAll("-", ""), fim.slice(2).replaceAll("-", "")];
  if (tipo) { condicoes.push("tipo = ?"); parametros.push(tipo); }
  if (status) { condicoes.push("status = ?"); parametros.push(status); }
  if (guiche) { condicoes.push("guiche = ?"); parametros.push(Number(guiche)); }
  const onde = `WHERE ${condicoes.join(" AND ")}`;
  const [grupos] = await banco.execute(
    `SELECT tipo, status, COUNT(*) AS quantidade FROM senhas ${onde} GROUP BY tipo, status`,
    parametros
  );
  const [ultimasChamadas] = await banco.execute(
    `SELECT numero, tipo, status, guiche, atendente FROM senhas
     ${onde} AND ordem_chamada > 0 ORDER BY ordem_chamada DESC LIMIT 5`,
    parametros
  );
  const porTipo = { SP: 0, SG: 0, SE: 0 };
  const porStatus = {};
  let total = 0;
  for (const grupo of grupos) {
    const quantidade = Number(grupo.quantidade);
    total += quantidade;
    porTipo[grupo.tipo] = (porTipo[grupo.tipo] ?? 0) + quantidade;
    porStatus[grupo.status] = (porStatus[grupo.status] ?? 0) + quantidade;
  }
  let porDia = total ? [{ data: parametros[0], quantidade: total }] : [];
  if (inicio !== fim) {
    const [diasAgrupados] = await banco.execute(
      `SELECT data_emissao, COUNT(*) AS quantidade FROM senhas ${onde}
       GROUP BY data_emissao ORDER BY data_emissao`,
      parametros
    );
    porDia = diasAgrupados.map((linha) => ({ data: linha.data_emissao, quantidade: Number(linha.quantidade) }));
  }
  return {
    inicio, fim, total, porTipo, porStatus,
    porDia,
    ultimasChamadas,
  };
}

export async function listarUsuarios(banco = obterPool()) {
  const [usuarios] = await banco.execute(
    "SELECT id, login, nome, perfil, ativo FROM atendentes ORDER BY nome, login"
  );
  return usuarios;
}

export async function criarUsuario(dados, banco = obterPool()) {
  const login = typeof dados?.login === "string" ? dados.login.trim() : "";
  const nome = typeof dados?.nome === "string" ? dados.nome.trim() : "";
  const perfil = dados?.perfil;
  if (typeof login !== "string" || !/^[a-zA-Z0-9._-]{3,80}$/.test(login) ||
      typeof nome !== "string" || !nome || nome.length > 120 ||
      !["ATENDENTE", "GESTOR"].includes(perfil)) {
    throw falha(400, "Informe login, nome e perfil válidos.");
  }
  validarSenha(dados.senha);
  const hash = await gerarHashSenha(dados.senha);
  try {
    const [resultado] = await banco.execute(
      "INSERT INTO atendentes (login, nome, senha_hash, perfil) VALUES (?, ?, ?, ?)",
      [login, nome, hash, perfil]
    );
    return { id: resultado.insertId, login, nome, perfil, ativo: true };
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY") throw falha(409, "Este login já existe.");
    throw erro;
  }
}

export async function redefinirSenhaUsuario(dados) {
  const login = dados?.login;
  if (typeof login !== "string" || !/^[a-zA-Z0-9._-]{3,80}$/.test(login)) {
    throw falha(400, "Informe um login válido.");
  }
  validarSenha(dados.novaSenha);
  try {
    await redefinirSenhaAtendente(login, dados.novaSenha);
  } catch (erro) {
    if (erro.code === "ATENDENTE_NAO_ENCONTRADO") throw falha(404, "Usuário ativo não encontrado.");
    throw erro;
  }
  return { mensagem: "Senha redefinida e sessões anteriores encerradas." };
}

export async function obterOrdemFila(banco = obterPool()) {
  const [linhas] = await banco.execute("SELECT proximo_nao_sp FROM estado_fila WHERE id = 1");
  if (linhas.length !== 1) throw new Error("Estado da fila não inicializado.");
  return { proximoNaoPrioritario: linhas[0].proximo_nao_sp };
}

export async function definirOrdemFila(tipo, banco = obterPool()) {
  if (!["SE", "SG"].includes(tipo)) throw falha(400, "Escolha SE ou SG.");
  await banco.execute("UPDATE estado_fila SET proximo_nao_sp = ? WHERE id = 1", [tipo]);
  return { proximoNaoPrioritario: tipo };
}
