import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/global.css";

const links = [
  { nome: "Início", rota: "/" },
  { nome: "Totem", rota: "/totem" },
  { nome: "Painel", rota: "/painel" },
  { nome: "Atendimento", rota: "/atendimento" },
];

function Header() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="nt-header">
      <div className="nt-container nt-header__inner">
        <Link
          className="nt-header__brand"
          to="/"
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
            {links.map(({ nome, rota }) => (
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
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;