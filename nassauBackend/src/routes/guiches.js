
import { Router } from 'express';
import { db } from '../data/store.js';
import { auth } from '../middleware/auth.js';
const router = Router();
router.get('/', (req, res) => res.json(db.guiches));
router.post('/:id/ocupar', auth, (req, res) => {
  const g = db.guiches.find(x => x.id === Number(req.params.id));
  if (!g) return res.status(404).json({ erro: 'Guichê não encontrado' });
  g.atendente_id = req.usuario.id; g.status = 'ocupado';
  res.json({ mensagem: 'Guichê ocupado', guiche: g });
});
export default router;
