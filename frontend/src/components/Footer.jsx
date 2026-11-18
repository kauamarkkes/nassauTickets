import "../styles/global.css";

const ANO = new Date().getFullYear();

/**
 * Rodapé do sistema.
 * - nota: texto do meio (opcional)
 */
function Footer({ nota = "Controle de atendimento" }) {
  return (
    <footer className="nt-footer">
      <div className="nt-container nt-footer__inner">
        <span className="nt-footer__brand">nassauTickets</span>
        <span className="nt-footer__note">{nota}</span>
        <span className="nt-footer__copy">© {ANO}</span>
      </div>
    </footer>
  );
}

export default Footer;