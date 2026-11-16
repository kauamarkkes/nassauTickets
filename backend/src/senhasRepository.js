import { obterPool } from "./db.js";

const TIPOS = new Set(["SP", "SG", "SE"]);

const COLUNAS = `numero, data_emissao, tipo, sequencia, status, emitida_em,
  guiche, atendente, chamadas, primeira_chamada_em, segunda_chamada_em,
  inicio_atendimento_em, finalizacao_em, ordem_chamada`;

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
    "INSERT INTO senhas (numero, data_emissao, tipo, sequencia, emitida_em) VALUES (?, ?, ?, ?, ?)",
    [numero, data, tipo, sequencia, dataHoraMysql(agora)]
  );
  const [criadas] = await conexao.execute(
    `SELECT ${COLUNAS} FROM senhas WHERE numero = ?`,
    [numero]
  );
  return formatarSenha(criadas[0]);
}
