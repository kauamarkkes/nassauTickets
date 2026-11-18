import { obterPool } from "../db.js";
import { gerarHashSenha } from "./password.js";

export async function redefinirSenhaAtendente(login, senha, somenteAtendente = false) {
  const hash = await gerarHashSenha(senha);
  const conexao = await obterPool().getConnection();
  try {
    await conexao.beginTransaction();
    const [usuarios] = await conexao.execute(
      "SELECT id, perfil FROM atendentes WHERE login = ? AND ativo = TRUE FOR UPDATE", [login]
    );
    if (usuarios.length !== 1 || (somenteAtendente && usuarios[0].perfil !== "ATENDENTE")) {
      const erro = new Error("Atendente ativo não encontrado.");
      erro.code = "ATENDENTE_NAO_ENCONTRADO";
      throw erro;
    }
    await conexao.execute(
      "UPDATE atendentes SET senha_hash = ? WHERE id = ?", [hash, usuarios[0].id]
    );
    await conexao.execute(
      "DELETE FROM sessoes_atendentes WHERE atendente_id = ?", [usuarios[0].id]
    );
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}
