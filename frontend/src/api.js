const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiRequest(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: {
      "Content-Type": "application/json",
      ...opcoes.headers,
    },
    ...opcoes,
  });

  if (!resposta.ok) {
    throw new Error(`Erro na API: ${resposta.status}`);
  }

  if (resposta.status === 204) {
    return null;
  }

  return resposta.json();
}