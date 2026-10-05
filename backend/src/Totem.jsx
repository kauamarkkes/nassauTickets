import { useState } from "react";

export default function Totem() {
  // 1. useState - requisito obrigatório
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [senhaEmitida, setSenhaEmitida] = useState(null);

  // Função que emite a senha
  function emitirSenha(tipo) {
    setCarregando(true); // Mostra mensagem de carregamento
    setErro(""); // Limpa erro antigo
    setSenhaEmitida(null); // Limpa senha antiga

    // Simula um tempo de espera, como se fosse API
    setTimeout(() => {
      try {
        // Lógica pra criar a senha: SP01, SG02, SE03
        const numero = Math.floor(Math.random() * 100) + 1;
        const novaSenha = `${tipo}${String(numero).padStart(2, "0")}`;

        // 2. Mostrar a senha emitida
        setSenhaEmitida({ tipo: tipo, codigo: novaSenha, hora: new Date().toLocaleTimeString() });

        // 3. Salvar temporariamente no localStorage - requisito
        localStorage.setItem("ultimaSenha", JSON.stringify(novaSenha));
        localStorage.setItem("historicoSenhas", JSON.stringify([...(JSON.parse(localStorage.getItem("historicoSenhas") || "[]")), novaSenha]));

        setCarregando(false);
      } catch (e) {
        // 4. Mostrar mensagem de erro
        setErro("Erro ao emitir senha. Tente novamente.");
        setCarregando(false);
      }
    }, 1000); // 1 segundo carregando
  }

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", textAlign: "center", fontFamily: "Arial" }}>
      <h1>Totem - Retire sua Senha</h1>
      <p>Escolha uma opção abaixo:</p>

      {/* Botões de emissão - requisito */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        <button onClick={() => emitirSenha("SP")} style={estiloBotao}>
          SP - Senha Prioritária
        </button>
        <button onClick={() => emitirSenha("SG")} style={estiloBotao}>
          SG - Senha Geral
        </button>
        <button onClick={() => emitirSenha("SE")} style={estiloBotao}>
          SE - Retirada de Exames
        </button>
      </div>

      {/* 5. Mensagem de carregamento - requisito */}
      {carregando && <p style={{ marginTop: "20px", color: "blue", fontWeight: "bold" }}>Gerando sua senha...</p>}

      {/* 6. Mensagem de erro - requisito */}
      {erro && <p style={{ marginTop: "20px", color: "red", background: "#ffe0e0", padding: "10px" }}>{erro}</p>}

      {/* 7. Mostrar a senha emitida - requisito */}
      {senhaEmitida && !carregando && (
        <div style={{ marginTop: "20px", background: "#e0ffe0", padding: "20px", borderRadius: "10px" }}>
          <h2>Sua senha é:</h2>
          <h1 style={{ fontSize: "50px", margin: "10px 0" }}>{senhaEmitida.codigo}</h1>
          <p>Emitida às {senhaEmitida.hora}</p>
        </div>
      )}
    </div>
  );
}

const estiloBotao = {
  padding: "20px",
  fontSize: "18px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};
