import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import Button from "../components/Button";
import Message from "../components/Message";
import "../styles/global.css";

function ResetTest() {
  const [login, setLogin] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    if (novaSenha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }
    setCarregando(true);
    try {
      const resposta = await apiRequest("/auth/reset-test", {
        method: "POST",
        body: JSON.stringify({ login: login.trim(), codigo, novaSenha }),
      });
      setSucesso(resposta.mensagem);
      setCodigo("");
      setNovaSenha("");
      setConfirmacao("");
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page nt-container">
      <div className="login-card">
        <h1>Redefinir senha</h1>
        <p>Disponível apenas no servidor local de teste.</p>
        <form onSubmit={enviar}>
          <label htmlFor="reset-login">Login</label>
          <input id="reset-login" value={login} onChange={(evento) => setLogin(evento.target.value)}
            autoComplete="username" disabled={carregando} required />

          <label htmlFor="reset-codigo">Código de teste</label>
          <input id="reset-codigo" value={codigo} onChange={(evento) => setCodigo(evento.target.value)}
            inputMode="numeric" pattern="[0-9]{4}" maxLength={4} disabled={carregando} required />

          <label htmlFor="reset-senha">Nova senha (mínimo 12 caracteres)</label>
          <input id="reset-senha" type="password" value={novaSenha}
            onChange={(evento) => setNovaSenha(evento.target.value)} autoComplete="new-password"
            minLength={12} disabled={carregando} required />

          <label htmlFor="reset-confirmacao">Confirme a nova senha</label>
          <input id="reset-confirmacao" type="password" value={confirmacao}
            onChange={(evento) => setConfirmacao(evento.target.value)} autoComplete="new-password"
            minLength={12} disabled={carregando} required />

          {erro && <Message tipo="error">{erro}</Message>}
          {sucesso && <Message tipo="success">{sucesso}</Message>}
          <Button type="submit" disabled={carregando} bloco>
            {carregando ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>
        <p><Link to="/login">Voltar ao login</Link></p>
      </div>
    </main>
  );
}

export default ResetTest;
