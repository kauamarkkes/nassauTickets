import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import ROUTES from "../routes/paths";
import "../styles/global.css";

const recursos = [
  {
    rotulo: "01 / CLIENTE",
    titulo: "Totem de senhas",
    descricao: "Escolha o atendimento e emita sua senha.",
    to: ROUTES.totem,
  },
  {
    rotulo: "02 / CHAMADAS",
    titulo: "Painel ao vivo",
    descricao: "Veja a senha chamada e o guichê.",
    to: ROUTES.panel,
  },
  {
    rotulo: "03 / EQUIPE",
    titulo: "Terminal",
    descricao: "Acompanhe e organize a fila.",
    to: ROUTES.attendant,
  },
];

function Home() {
  return (
    <main>
      <section className="hero">
        <h1>
          Mais organização.
          <br />
          Menos espera.
        </h1>
        <p>Emissão, fila e atendimento em um só lugar.</p>
        <Button to={ROUTES.totem} className="home-cta">
          Retirar uma senha
        </Button>
      </section>

      <section className="features">
        {recursos.map((item) => (
          <Card
            key={item.rotulo}
            as={Link}
            className="feature-card feature-card-link"
            nivelTitulo={3}
            {...item}
          />
        ))}
      </section>
    </main>
  );
}

export default Home;
