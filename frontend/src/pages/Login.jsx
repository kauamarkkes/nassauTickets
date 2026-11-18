import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import Button from "../components/Button";
import Message from "../components/Message";
import ROUTES from "../routes/paths";
import "../styles/global.css";

function Login({ aoEntrar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    if (!login.trim() || !senha) {
      setErro("Informe o login e a senha.");
      return;
    }

    setCarregando(true);
    setErro("");
    try {
      const { usuario } = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login: login.trim(), senha }),
      });
      setSenha("");
      aoEntrar(usuario);
      navigate(usuario.perfil === "GESTOR" ? ROUTES.admin : ROUTES.attendant, { replace: true });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page nt-container">
      <div className="login-card">
        <h1>Entrar no atendimento</h1>
        <p>Use o login e a senha da sua conta de atendente.</p>
        {location.state?.sessaoExpirada && (
          <Message tipo="warning">Sua sessão expirou. Entre novamente para continuar.</Message>
        )}
        <form onSubmit={enviar}>
          <label htmlFor="login">Login</label>
          <input
            id="login"
            name="login"
            type="text"
            autoComplete="username"
            value={login}
            onChange={(evento) => setLogin(evento.target.value)}
            disabled={carregando}
            required
          />
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            disabled={carregando}
            required
          />
          {erro && <Message tipo="error">{erro}</Message>}
          <Button type="submit" disabled={carregando} bloco>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <details className="login-ajuda">
          <summary>Esqueceu a senha?</summary>
          <p>No ambiente local de teste, você pode usar o código de redefinição.</p>
          <Button to={ROUTES.resetPassword} variante="secondary">Redefinir senha</Button>
        </details>
      </div>
    </main>
  );
}

export default Login;
