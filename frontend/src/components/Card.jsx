import "../styles/global.css";

/**
 * Cartão reutilizável.
 * - rotulo: texto pequeno acima do título (ex.: "01 / CLIENTE")
 * - sigla: destaque à direita (ex.: "SP", "SE", "SG" no totem)
 * - titulo / descricao: texto principal
 * - children: conteúdo livre
 * - rodape: área inferior (ex.: botão "Emitir")
 * - as: elemento HTML (padrão "section")
 */
function Card({
  as: Tag = "section",
  rotulo,
  sigla,
  titulo,
  descricao,
  children,
  rodape,
  className = "",
  ...rest
}) {
  return (
    <Tag className={["nt-card", className].filter(Boolean).join(" ")} {...rest}>
      {(rotulo || sigla) && (
        <div className="nt-card__top">
          {rotulo && <span className="nt-card__label">{rotulo}</span>}
          {sigla && <span className="nt-card__badge">{sigla}</span>}
        </div>
      )}
      {titulo && <h3 className="nt-card__title">{titulo}</h3>}
      {descricao && <p className="nt-card__description">{descricao}</p>}
      {children && <div className="nt-card__body">{children}</div>}
      {rodape && <div className="nt-card__footer">{rodape}</div>}
    </Tag>
  );
}

export default Card;