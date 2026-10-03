import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Painel from "./pages/Painel";
import Attendant from "./pages/Attendant";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="/atendimento" element={<Attendant />} />
    </Routes>
  );
}

export default App;