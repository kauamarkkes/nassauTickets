import { Link, useLocation } from "react-router-dom";

function TopNavTemp() {
  const { pathname } = useLocation();

  const links = [
    { nome: "Início", rota: "/" },
    { nome: "Totem", rota: "/totem" },
    { nome: "Painel", rota: "/painel" },
    { nome: "Atendimento", rota: "/atendimento" },
  ];

  return (
    <nav className="nav-temp">
      <span className="nav-temp-logo">nassauTickets</span>
      <div className="nav-temp-links">
        {links.map((l) => (
          <Link
            key={l.rota}
            to={l.rota}
            className={pathname === l.rota ? "ativo" : ""}
          >
            {l.nome}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default TopNavTemp;