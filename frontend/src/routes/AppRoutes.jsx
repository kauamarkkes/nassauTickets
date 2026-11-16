import { Navigate, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Painel from "../pages/Painel";
import Attendant from "../pages/Attendant";
import Totem from "../pages/Totem";
import Login from "../pages/Login";
import ResetTest from "../pages/ResetTest";

function AppRoutes({ sessao, aoEntrar }) {
  const atendimento = sessao.verificando
    ? <p className="nt-container" role="status">Verificando sessão...</p>
    : sessao.usuario
      ? <Attendant />
      : <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/totem" element={<Totem />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="/login" element={sessao.verificando
        ? <p className="nt-container" role="status">Verificando sessão...</p>
        : sessao.usuario
          ? <Navigate to="/atendimento" replace />
          : <Login aoEntrar={aoEntrar} />
      } />
      <Route path="/atendimento" element={atendimento} />
      <Route path="/redefinir-senha" element={<ResetTest />} />
    </Routes>
  );
}

export default AppRoutes;
