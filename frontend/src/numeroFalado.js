export function numeroFalado(numero) {
  return String(numero).replace("-", "").split("").join(", ");
}
