import { Link } from "react-router-dom";
import "../styles/global.css";

/**
 * Botão reutilizável.
 * - Sem `to`: renderiza <button>.
 * - Com `to`: renderiza <Link> (rota interna) com aparência de botão.
 * - variante: "primary" | "secondary" | "ghost"
 * - tamanho: "md" | "lg"
 * - bloco: ocupa a largura toda
 */
function Button({
  children,
  variante = "primary",
  tamanho = "md",
  bloco = false,
  to,
  type = "button",
  disabled = false,
  className = "",
  ...rest
}) {
  const classes = [
    "nt-btn",
    `nt-btn--${variante}`,
    tamanho === "lg" ? "nt-btn--lg" : "",
    bloco ? "nt-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to && !disabled) {
    return (
      <Link className={classes} to={to} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

export default Button;