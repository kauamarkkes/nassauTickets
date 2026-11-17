import { Navigate } from "react-router-dom";

function ProtectedRoute({ sessao, perfil, children }) {
  if (sessao.verificando) {
    return <p className="nt-container" role="status">Verificando sessão...</p>;
  }

  if (!sessao.usuario) {
    return <Navigate to="/login" replace />;
  }

  if (perfil && sessao.usuario.perfil !== perfil) {
    return <p className="nt-container" role="alert">Acesso reservado ao gestor.</p>;
  }

  return children;
}

export default ProtectedRoute;
