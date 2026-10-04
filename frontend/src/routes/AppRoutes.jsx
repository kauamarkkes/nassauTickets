import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Painel from "../pages/Painel";
import Attendant from "../pages/Attendant";
import Totem from "../pages/Totem";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/totem" element={<Totem />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="/atendimento" element={<Attendant />} />
    </Routes>
  );
}

export default AppRoutes;