import "../styles/global.css";

/**
 * Mensagem de feedback.
 * - tipo: "info" | "success" | "warning" | "error"
 * - Erros e avisos usam role="alert"; os demais, role="status",
 *   para leitores de tela anunciarem a mudança.
 * - aoFechar (opcional): mostra o botão de fechar.
 */
function Message({ tipo = "info", titulo, children, aoFechar, className = "" }) {
  const urgente = tipo === "error" || tipo === "warning";

  return (
    <div
      className={["nt-message", `nt-message--${tipo}`, className].filter(Boolean).join(" ")}
      role={urgente ? "alert" : "status"}
    >
      <div className="nt-message__content">
        {titulo && <strong className="nt-message__title">{titulo}</strong>}
        {children && <span>{children}</span>}
      </div>
      {aoFechar && (
        <button
          type="button"
          className="nt-message__close"
          onClick={aoFechar}
          aria-label="Fechar mensagem"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Message;