
import { Router } from 'express';
import { repos } from '../repositories/index.js';
import { auth } from '../middleware/auth.js';
import { hojeISO } from '../utils/codigo.js';
const router = Router();
router.get('/resumo', auth, async (req, res) => {
  const data = req.query.data || hojeISO();
  const doDia = await repos.senhas.listarDoDia(data);
  const porTipo = ['SP','SE','SG'].map(tipo => ({ tipo, total: doDia.filter(s => s.tipo === tipo).length }));
  const porStatus = [...new Set(doDia.map(s => s.status))].map(status => ({ status, total: doDia.filter(s => s.status === status).length }));
  res.json({ data, porTipo, porStatus });
});
export default router;
