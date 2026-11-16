import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const navigate = useNavigate();
  const [sessao, setSessao] = useState({ verificando: true, usuario: null });
  const [saindo, setSaindo] = useState(false);
  const [erroSair, setErroSair] = useState("");

  useEffect(() => {
    let ativo = true;
    apiRequest("/auth/session")
      .then(({ usuario }) => {
        if (ativo) setSessao({ verificando: false, usuario });
      })
      .catch(() => {
        if (ativo) setSessao({ verificando: false, usuario: null });
      });
    return () => { ativo = false; };
  }, []);

  function aoEntrar(usuario) {
    setSessao({ verificando: false, usuario });
  }

  async function sair() {
    setSaindo(true);
    setErroSair("");
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      setSessao({ verificando: false, usuario: null });
      navigate("/login", { replace: true });
    } catch (erro) {
      setErroSair(erro.message);
    } finally {
      setSaindo(false);
    }
  }

  return (
    <>
      <Header
        usuario={sessao.usuario}
        verificando={sessao.verificando}
        aoSair={sair}
        saindo={saindo}
        erroSair={erroSair}
      />
      <AppRoutes sessao={sessao} aoEntrar={aoEntrar} />
      <Footer />
    </>
  );
}

export default App;
