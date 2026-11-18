import "../styles/global.css";

function TicketTypeBadge({ tipo, children }) {
  return (
    <span className={`badge badge-${String(tipo).toLowerCase()}`}>
      {children ?? tipo}
    </span>
  );
}

export default TicketTypeBadge;
