import { obterPool } from "./db.js";

const TIPOS = new Set(["SP", "SG", "SE"]);

const COLUNAS = `numero, data_emissao, tipo, sequencia, status, emitida_em,
  guiche, atendente, chamadas, primeira_chamada_em, segunda_chamada_em,
  inicio_atendimento_em, finalizacao_em, encerrada_em, ordem_chamada`;

function horarioUtc(valor) {
  return valor === null ? null : `${valor.replace(" ", "T")}Z`;
}

function formatarSenha(linha) {
  return {
    numero: linha.numero,
    tipo: linha.tipo,
    status: linha.status,
    data: linha.data_emissao,
    dataHoraEmissao: horarioUtc(linha.emitida_em),
    guiche: linha.guiche,
    atendente: linha.atendente,
    chamadas: linha.chamadas,
    primeiraChamada: horarioUtc(linha.primeira_chamada_em),
    segundaChamada: horarioUtc(linha.segunda_chamada_em),
    inicioAtendimento: horarioUtc(linha.inicio_atendimento_em),
    finalizacao: horarioUtc(linha.finalizacao_em),
    encerradaEm: horarioUtc(linha.encerrada_em),
    ordemChamada: Number(linha.ordem_chamada),
  };
}

function dataLocal(agora) {
  const ano = String(agora.getFullYear()).slice(-2);
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}${mes}${dia}`;
}

function dataHoraMysql(agora) {
  return agora.toISOString().slice(0, 23).replace("T", " ");
}

export async function listarSenhas() {
  const [linhas] = await obterPool().execute(
    `SELECT ${COLUNAS} FROM senhas ORDER BY emitida_em, numero`
  );
  return linhas.map(formatarSenha);
}

export async function encerrarSenhasPendentes(agora = new Date()) {
  const hoje = dataLocal(agora);
  const modoDemo = process.env.NODE_ENV !== "production" && process.env.DEMO_OUTSIDE_HOURS === "true";
  const ateHoje = !modoDemo && agora.getHours() >= 17;
  return transacao(async (conexao) => {
    await conexao.execute("SELECT id FROM estado_fila WHERE id = 1 FOR UPDATE");
    const [resultado] = await conexao.execute(
      `UPDATE senhas SET status = 'ENCERRADA', encerrada_em = ?
       WHERE status IN ('EMITIDA', 'AGUARDANDO') AND data_emissao ${ateHoje ? "<=" : "<"} ?`,
      [dataHoraMysql(agora), hoje]
    );
    return resultado.affectedRows;
  });
}

export async function emitirSenha(tipo) {
  if (!TIPOS.has(tipo)) {
    const erro = new Error("Escolha SP, SG ou SE.");
    erro.code = "TIPO_INVALIDO";
    throw erro;
  }

  const conexao = await obterPool().getConnection();
  try {
    await conexao.beginTransaction();
    const criada = await inserirSenhaNaTransacao(conexao, tipo);
    await conexao.commit();
    return criada;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

// Recebe uma transação existente para permitir composição com outras operações.
export async function inserirSenhaNaTransacao(conexao, tipo, agora = new Date()) {
  if (!TIPOS.has(tipo)) {
    const erro = new Error("Escolha SP, SG ou SE.");
    erro.code = "TIPO_INVALIDO";
    throw erro;
  }

  // A mesma linha serializa emissões e, futuramente, chamadas da fila.
  const [estado] = await conexao.execute(
    "SELECT id FROM estado_fila WHERE id = 1 FOR UPDATE"
  );
  if (estado.length !== 1) {
    throw new Error("Estado da fila não inicializado.");
  }

  const data = dataLocal(agora);
  const [linhas] = await conexao.execute(
    "SELECT COALESCE(MAX(sequencia), 0) AS ultima FROM senhas WHERE data_emissao = ? AND tipo = ?",
    [data, tipo]
  );
  const sequencia = linhas[0].ultima + 1;
  if (sequencia > 999) {
    const erro = new Error("Limite diário de senhas deste tipo atingido.");
    erro.code = "LIMITE_DIARIO";
    throw erro;
  }

  const numero = `${data}-${tipo}${String(sequencia).padStart(3, "0")}`;
  await conexao.execute(
    "INSERT INTO senhas (numero, data_emissao, tipo, sequencia, status, emitida_em) VALUES (?, ?, ?, ?, 'AGUARDANDO', ?)",
    [numero, data, tipo, sequencia, dataHoraMysql(agora)]
  );
  const [criadas] = await conexao.execute(
    `SELECT ${COLUNAS} FROM senhas WHERE numero = ?`,
    [numero]
  );
  return formatarSenha(criadas[0]);
}

function falha(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

async function transacao(operacao) {
  const conexao = await obterPool().getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await operacao(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

async function obterSenha(conexao, numero) {
  const [linhas] = await conexao.execute(
    `SELECT ${COLUNAS} FROM senhas WHERE numero = ? FOR UPDATE`,
    [numero]
  );
  if (!linhas.length) throw falha(404, "Senha não encontrada.");
  return linhas[0];
}

async function lerSenha(conexao, numero) {
  const [linhas] = await conexao.execute(
    `SELECT ${COLUNAS} FROM senhas WHERE numero = ?`,
    [numero]
  );
  return formatarSenha(linhas[0]);
}

export async function chamarProxima(guiche, atendente = "Atendente 01") {
  if (!Number.isInteger(guiche) || guiche < 1 || guiche > 65535) {
    throw falha(400, "Informe um guichê válido.");
  }
  return transacao((conexao) => chamarProximaNaTransacao(conexao, guiche, atendente));
}

export async function chamarProximaNaTransacao(conexao, guiche, atendente = "Atendente 01", agora = new Date()) {
  const [estados] = await conexao.execute(
    "SELECT ultima_foi_sp, proximo_nao_sp, ordem_chamada FROM estado_fila WHERE id = 1 FOR UPDATE"
  );
  if (estados.length !== 1) throw new Error("Estado da fila não inicializado.");
  const estado = estados[0];

  const [ocupadas] = await conexao.execute(
    "SELECT numero FROM senhas WHERE guiche = ? AND status IN ('CHAMADA', 'CHAMADA_NOVAMENTE', 'EM_ATENDIMENTO') LIMIT 1",
    [guiche]
  );
  if (ocupadas.length) throw falha(409, "Este guichê já possui uma senha ativa.");

  const hoje = dataLocal(agora);
  const [aguardando] = await conexao.execute(
    "SELECT numero, tipo FROM senhas WHERE data_emissao = ? AND status IN ('AGUARDANDO', 'EMITIDA') ORDER BY sequencia, numero",
    [hoje]
  );
  const sp = aguardando.find((senha) => senha.tipo === "SP");
  const se = aguardando.find((senha) => senha.tipo === "SE");
  const sg = aguardando.find((senha) => senha.tipo === "SG");
  let proxima;
  if (sp && !estado.ultima_foi_sp) {
    proxima = sp;
  } else {
    proxima = estado.proximo_nao_sp === "SE" ? (se ?? sg) : (sg ?? se);
    proxima ??= sp;
  }
  if (!proxima) throw falha(404, "Não há senhas aguardando.");

  const ordem = Number(estado.ordem_chamada) + 1;
  await conexao.execute(
    "UPDATE senhas SET status = 'CHAMADA', guiche = ?, atendente = ?, chamadas = 1, primeira_chamada_em = ?, ordem_chamada = ? WHERE numero = ?",
    [guiche, atendente, dataHoraMysql(new Date()), ordem, proxima.numero]
  );
  const ultimaFoiSp = proxima.tipo === "SP";
  const proximoNaoSp = ultimaFoiSp ? estado.proximo_nao_sp : (proxima.tipo === "SE" ? "SG" : "SE");
  await conexao.execute(
    "UPDATE estado_fila SET ultima_foi_sp = ?, proximo_nao_sp = ?, ordem_chamada = ? WHERE id = 1",
    [ultimaFoiSp, proximoNaoSp, ordem]
  );
  return lerSenha(conexao, proxima.numero);
}

export async function iniciarAtendimento(numero) {
  return transacao((conexao) => iniciarAtendimentoNaTransacao(conexao, numero));
}

export async function iniciarAtendimentoNaTransacao(conexao, numero) {
  const senha = await obterSenha(conexao, numero);
  if (!["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senha.status)) {
    throw falha(409, "Esta senha não pode iniciar atendimento.");
  }
  await conexao.execute(
    "UPDATE senhas SET status = 'EM_ATENDIMENTO', inicio_atendimento_em = ? WHERE numero = ?",
    [dataHoraMysql(new Date()), numero]
  );
  return lerSenha(conexao, numero);
}

export async function finalizarAtendimento(numero) {
  return transacao((conexao) => finalizarAtendimentoNaTransacao(conexao, numero));
}

export async function finalizarAtendimentoNaTransacao(conexao, numero) {
  const senha = await obterSenha(conexao, numero);
  if (senha.status !== "EM_ATENDIMENTO") {
    throw falha(409, "Inicie o atendimento antes de finalizar.");
  }
  await conexao.execute(
    "UPDATE senhas SET status = 'ATENDIDA', finalizacao_em = ? WHERE numero = ?",
    [dataHoraMysql(new Date()), numero]
  );
  return lerSenha(conexao, numero);
}

export async function chamarNovamente(numero) {
  return transacao((conexao) => chamarNovamenteNaTransacao(conexao, numero));
}

export async function chamarNovamenteNaTransacao(conexao, numero) {
  const [estados] = await conexao.execute(
    "SELECT ordem_chamada FROM estado_fila WHERE id = 1 FOR UPDATE"
  );
  if (estados.length !== 1) throw new Error("Estado da fila não inicializado.");
  const senha = await obterSenha(conexao, numero);
  if (senha.status !== "CHAMADA" || senha.chamadas !== 1) {
    throw falha(409, "Esta senha não pode ser chamada novamente.");
  }
  const ordem = Number(estados[0].ordem_chamada) + 1;
  await conexao.execute(
    "UPDATE senhas SET status = 'CHAMADA_NOVAMENTE', chamadas = 2, segunda_chamada_em = ?, ordem_chamada = ? WHERE numero = ?",
    [dataHoraMysql(new Date()), ordem, numero]
  );
  await conexao.execute("UPDATE estado_fila SET ordem_chamada = ? WHERE id = 1", [ordem]);
  return lerSenha(conexao, numero);
}

export async function marcarNaoCompareceu(numero) {
  return transacao((conexao) => marcarNaoCompareceuNaTransacao(conexao, numero));
}

export async function marcarNaoCompareceuNaTransacao(conexao, numero) {
  const senha = await obterSenha(conexao, numero);
  if (senha.status !== "CHAMADA_NOVAMENTE" || senha.chamadas !== 2) {
    throw falha(409, "A senha precisa ter sido chamada duas vezes.");
  }
  await conexao.execute(
    "UPDATE senhas SET status = 'NÃO_COMPARECEU', finalizacao_em = ? WHERE numero = ?",
    [dataHoraMysql(new Date()), numero]
  );
  return lerSenha(conexao, numero);
}

export async function obterPainel() {
  const [linhas] = await obterPool().execute(
    `SELECT ${COLUNAS} FROM senhas WHERE data_emissao = ? AND ordem_chamada > 0 ORDER BY ordem_chamada DESC LIMIT 5`,
    [dataLocal(new Date())]
  );
  const senhas = linhas.map(formatarSenha);
  return { atual: senhas[0] ?? null, anteriores: senhas.slice(1) };
}
