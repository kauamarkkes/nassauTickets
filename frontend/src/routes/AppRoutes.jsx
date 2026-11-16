import { Navigate, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Painel from "../pages/Painel";
import Attendant from "../pages/Attendant";
import Totem from "../pages/Totem";
import Login from "../pages/Login";
import ResetTest from "../pages/ResetTest";
import Admin from "../pages/Admin";

function AppRoutes({ sessao, aoEntrar }) {
  const atendimento = sessao.verificando
    ? <p className="nt-container" role="status">Verificando sessão...</p>
    : sessao.usuario
      ? <Attendant />
      : <Navigate to="/login" replace />;
  const admin = sessao.verificando
    ? <p className="nt-container" role="status">Verificando sessão...</p>
    : !sessao.usuario
      ? <Navigate to="/login" replace />
      : sessao.usuario.perfil === "GESTOR"
        ? <Admin />
        : <p className="nt-container" role="alert">Acesso reservado ao gestor.</p>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/totem" element={<Totem />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="/login" element={sessao.verificando
        ? <p className="nt-container" role="status">Verificando sessão...</p>
        : sessao.usuario
          ? <Navigate to={sessao.usuario.perfil === "GESTOR" ? "/admin" : "/atendimento"} replace />
          : <Login aoEntrar={aoEntrar} />
      } />
      <Route path="/atendimento" element={atendimento} />
      <Route path="/admin" element={admin} />
      <Route path="/redefinir-senha" element={<ResetTest />} />
    </Routes>
  );
}

export default AppRoutes;
