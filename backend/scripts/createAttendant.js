import { emitKeypressEvents } from "node:readline";
import { obterPool, encerrarPool } from "../src/db.js";
import { gerarHashSenha } from "../src/auth/password.js";
import { redefinirSenhaAtendente } from "../src/auth/resetPassword.js";

const argumentos = process.argv.slice(2);
const redefinir = argumentos[0] === "--reset";
const [login, nome, perfil = "ATENDENTE"] = redefinir ? [argumentos[1]] : argumentos;
if (!/^[a-zA-Z0-9._-]{3,80}$/.test(login ?? "") ||
    (redefinir ? argumentos.length !== 2 :
      argumentos.length < 2 || argumentos.length > 3 || !nome || nome.length > 120 ||
      !["ATENDENTE", "GESTOR"].includes(perfil))) {
  console.error('Uso: node --env-file=.env scripts/createAttendant.js <login> "<nome>" [ATENDENTE|GESTOR]');
  console.error('Ou:  node --env-file=.env scripts/createAttendant.js --reset <login>');
  process.exitCode = 1;
} else if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  console.error("Execute em um terminal interativo para digitar a senha sem exibi-la.");
  process.exitCode = 1;
} else {
  try {
    function solicitarSenha(rotulo) {
      return new Promise((resolve, reject) => {
        let texto = "";
        emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdout.write(`${rotulo}: `);
        function terminar(erro) {
          process.stdin.off("keypress", tecla);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          if (erro) reject(erro);
          else resolve(texto);
        }
        function tecla(caractere, chave) {
          if (chave?.ctrl && chave.name === "c") return terminar(new Error("Operação cancelada."));
          if (chave?.name === "return" || chave?.name === "enter") return terminar();
          if (chave?.name === "backspace") texto = [...texto].slice(0, -1).join("");
          else if (caractere && !/[\x00-\x1f\x7f]/.test(caractere)) texto += caractere;
        }
        process.stdin.on("keypress", tecla);
      });
    }
    const senha = await solicitarSenha(`${redefinir ? "Nova senha" : "Senha do atendente"} (mínimo 12 caracteres)`);
    if ([...senha].length < 12) throw new Error("A senha precisa ter pelo menos 12 caracteres.");
    const confirmacao = await solicitarSenha("Confirme a senha");
    if (senha !== confirmacao) throw new Error("As senhas não conferem.");
    if (redefinir) {
      await redefinirSenhaAtendente(login, senha);
      console.log(`Senha do atendente ${login} redefinida.`);
    } else {
      const hash = await gerarHashSenha(senha);
      await obterPool().execute(
        "INSERT INTO atendentes (login, nome, senha_hash, perfil) VALUES (?, ?, ?, ?)",
        [login, nome, hash, perfil]
      );
      console.log(`Atendente ${login} cadastrado.`);
    }
  } catch (erro) {
    console.error(erro.code === "ER_DUP_ENTRY" ? "Este login já existe." : erro.message);
    process.exitCode = 1;
  } finally {
    await encerrarPool();
  }
}
