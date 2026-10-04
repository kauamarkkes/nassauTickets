const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiRequest(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...opcoes.headers,
    },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || `Erro na API: ${resposta.status}`);
  }

  return dados;
}