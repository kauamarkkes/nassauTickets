import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import ROUTES from "../routes/paths";
import "../styles/global.css";

const links = [
  { nome: "Início", rota: ROUTES.home },
  { nome: "Totem", rota: ROUTES.totem },
  { nome: "Painel", rota: ROUTES.panel },
];

function Header({ usuario, verificando, aoSair, saindo, erroSair }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const linksVisiveis = [
    ...links,
    ...(usuario ? [{ nome: "Atendimento", rota: ROUTES.attendant }] :
      verificando ? [] : [{ nome: "Entrar", rota: ROUTES.login }]),
    ...(usuario?.perfil === "GESTOR" ? [{ nome: "Admin", rota: ROUTES.admin }] : []),
  ];

  return (
    <header className="nt-header">
      <div className="nt-container nt-header__inner">
        <Link
          className="nt-header__brand"
          to={ROUTES.home}
          onClick={() => setMenuAberto(false)}
        >
          nassauTickets
        </Link>

        <button
          type="button"
          className="nt-header__toggle"
          aria-controls="nt-menu-principal"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          {menuAberto ? "Fechar" : "Menu"}
        </button>

        <nav
          id="nt-menu-principal"
          aria-label="Navegação principal"
          className={`nt-header__nav${menuAberto ? " is-open" : ""}`}
        >
          <ul className="nt-header__list">
            {linksVisiveis.map(({ nome, rota }) => (
              <li key={rota}>
                <NavLink
                  to={rota}
                  onClick={() => setMenuAberto(false)}
                  className={({ isActive }) =>
                    `nt-header__link${isActive ? " is-active" : ""}`
                  }
                >
                  {nome}
                </NavLink>
              </li>
            ))}
            {usuario && (
              <li>
                <button
                  type="button"
                  className="nt-header__link nt-header__button"
                  onClick={() => { setMenuAberto(false); aoSair(); }}
                  disabled={saindo}
                >
                  {saindo ? "Saindo..." : "Sair"}
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
      {erroSair && <p className="nt-container" role="alert">{erroSair}</p>}
    </header>
  );
}

export default Header;
