import { Navigate, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Painel from "../pages/Painel";
import Attendant from "../pages/Attendant";
import Totem from "../pages/Totem";
import Login from "../pages/Login";
import ResetTest from "../pages/ResetTest";
import Admin from "../pages/Admin";
import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes({ sessao, aoEntrar, aoSessaoExpirada }) {
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
      <Route path="/atendimento" element={
        <ProtectedRoute sessao={sessao}>
          <Attendant aoSessaoExpirada={aoSessaoExpirada} />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute sessao={sessao} perfil="GESTOR">
          <Admin aoSessaoExpirada={aoSessaoExpirada} />
        </ProtectedRoute>
      } />
      <Route path="/redefinir-senha" element={<ResetTest />} />
    </Routes>
  );
}

export default AppRoutes;
