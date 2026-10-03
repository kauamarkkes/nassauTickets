import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/global.css";

const LINKS = [
  { nome: "Início", rota: "/" },
  { nome: "Totem", rota: "/totem" },
  { nome: "Painel", rota: "/painel" },
  { nome: "Atendimento", rota: "/atendimento" },
];

/**
 * Cabeçalho com a marca nassauTickets e o menu de navegação.
 * Destaca a página atual automaticamente (useLocation).
 * No celular o menu fica recolhido e abre pelo botão "Menu".
 */
function Header() {
  const { pathname } = useLocation();
  const [aberto, setAberto] = useState(false);

  return (
    <header className="nt-header">
      <div className="nt-container nt-header__inner">
        <Link className="nt-header__brand" to="/" onClick={() => setAberto(false)}>
          nassauTickets
        </Link>

        <button
          type="button"
          className="nt-header__toggle"
          aria-expanded={aberto}
          aria-controls="nt-menu-principal"
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? "Fechar" : "Menu"}
        </button>

        <nav
          id="nt-menu-principal"
          className={`nt-header__nav${aberto ? " is-open" : ""}`}
          aria-label="Navegação principal"
        >
          <ul className="nt-header__list">
            {LINKS.map((l) => {
              const ativo = pathname === l.rota;
              return (
                <li key={l.rota}>
                  <Link
                    to={l.rota}
                    className={`nt-header__link${ativo ? " is-active" : ""}`}
                    aria-current={ativo ? "page" : undefined}
                    onClick={() => setAberto(false)}
                  >
                    {l.nome}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;