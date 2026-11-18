import { Navigate, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Painel from "../pages/Painel";
import Attendant from "../pages/Attendant";
import Totem from "../pages/Totem";
import Login from "../pages/Login";
import ResetTest from "../pages/ResetTest";
import Admin from "../pages/Admin";
import ProtectedRoute from "../components/ProtectedRoute";
import ROUTES from "./paths";

function AppRoutes({ sessao, aoEntrar, aoSessaoExpirada }) {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<Home />} />
      <Route path={ROUTES.totem} element={<Totem />} />
      <Route path={ROUTES.panel} element={<Painel />} />
      <Route path={ROUTES.login} element={sessao.verificando
        ? <p className="nt-container" role="status">Verificando sessão...</p>
        : sessao.usuario
          ? <Navigate to={sessao.usuario.perfil === "GESTOR" ? ROUTES.admin : ROUTES.attendant} replace />
          : <Login aoEntrar={aoEntrar} />
      } />
      <Route path={ROUTES.attendant} element={
        <ProtectedRoute sessao={sessao}>
          <Attendant aoSessaoExpirada={aoSessaoExpirada} />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.admin} element={
        <ProtectedRoute sessao={sessao} perfil="GESTOR">
          <Admin aoSessaoExpirada={aoSessaoExpirada} />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.resetPassword} element={<ResetTest />} />
    </Routes>
  );
}

export default AppRoutes;
