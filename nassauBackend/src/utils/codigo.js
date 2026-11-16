export function gerarCodigo(tipo, sequencia) {
  const agora = new Date();
  const yy = String(agora.getFullYear()).slice(2);
  const mm = String(agora.getMonth() + 1).padStart(2, '0');
  const dd = String(agora.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}-${tipo}${String(sequencia).padStart(2, '0')}`;
}
export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
