const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiRequest(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...opcoes.headers,
      },
    });
  } catch {
    throw new Error("Não foi possível conectar à API. Verifique se o backend está ligado.");
  }

  const dados = await resposta.json();

  if (!resposta.ok) {
    const erro = new Error(dados.erro || `Erro na API: ${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}
