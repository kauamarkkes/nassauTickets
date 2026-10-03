import { Link } from "react-router-dom";
import TopNavTemp from "../components/TopNavTemp";
import "../styles/global.css";

function Home() {
  return (
    <div>
      <TopNavTemp />

      <section className="hero">
        <h1>
          Mais organização.
          <br />
          Menos espera.
        </h1>
        <p>Emissão, fila e atendimento em um só lugar.</p>
        <Link className="btn-primary" to="/totem">
          Retirar uma senha
        </Link>
      </section>

      <section className="features">
        <div className="feature-card">
          <span className="feature-tag">01 / CLIENTE</span>
          <h3>Totem de senhas</h3>
          <p>Escolha o atendimento e emita sua senha.</p>
        </div>

        <div className="feature-card">
          <span className="feature-tag">02 / CHAMADAS</span>
          <h3>Painel ao vivo</h3>
          <p>Veja a senha chamada e o guichê.</p>
        </div>

        <div className="feature-card">
          <span className="feature-tag">03 / EQUIPE</span>
          <h3>Terminal</h3>
          <p>Acompanhe e organize a fila.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;