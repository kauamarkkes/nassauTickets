
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { repos } from '../repositories/index.js';
import { auth } from '../middleware/auth.js';
const router = Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const user = await repos.usuarios.buscarPorEmail(email);
  if (!user) return res.status(401).json({ erro: 'Credenciais inválidas' });
  if (!(await bcrypt.compare(senha, user.senha_hash))) return res.status(401).json({ erro: 'Credenciais inválidas' });
  const token = jwt.sign({ id: user.id, nome: user.nome, papel: user.papel }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, usuario: { id: user.id, nome: user.nome, email: user.email, papel: user.papel } });
});

router.post('/register', auth, async (req, res) => {
  const { nome, email, senha, papel = 'atendente' } = req.body;
  if (await repos.usuarios.buscarPorEmail(email)) return res.status(400).json({ erro: 'Email já existe' });
  const novo = await repos.usuarios.criar({ nome, email, senha_hash: await bcrypt.hash(senha, 10), papel });
  res.status(201).json({ id: novo.id, nome, email, papel });
});

router.get('/me', auth, (req, res) => res.json(req.usuario));
router.post('/logout', auth, (req, res) => res.json({ mensagem: 'Logout realizado. Descarte o token.' }));
export default router;
