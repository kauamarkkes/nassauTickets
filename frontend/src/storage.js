import { apiRequest } from "./api";

export function obterSenhas() {
  return apiRequest("/senhas");
}

export function emitirSenha(tipo) {
  return apiRequest("/senhas", {
    method: "POST",
    body: JSON.stringify({ tipo }),
  });
}

export function chamarProxima(
  guiche,
  atendente = "Atendente 01"
) {
  return apiRequest("/atendimentos/proxima", {
    method: "POST",
    body: JSON.stringify({
      guiche,
      atendente,
    }),
  });
}

export function iniciarAtendimento(numero) {
  return apiRequest(
    `/senhas/${numero}/iniciar`,
    {
      method: "PATCH",
    }
  );
}

export function finalizarAtendimento(numero) {
  return apiRequest(
    `/senhas/${numero}/finalizar`,
    {
      method: "PATCH",
    }
  );
}

export function chamarNovamente(numero) {
  return apiRequest(
    `/senhas/${numero}/chamar-novamente`,
    {
      method: "POST",
    }
  );
}

export function marcarNaoCompareceu(numero) {
  return apiRequest(
    `/senhas/${numero}/nao-compareceu`,
    {
      method: "PATCH",
    }
  );
}

export function obterPainel() {
  return apiRequest("/painel");
}