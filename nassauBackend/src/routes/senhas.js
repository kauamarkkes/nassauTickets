// src/routes/senhas.js
import { Router } from 'express';
import { repos } from '../repositories/index.js';
import { auth } from '../middleware/auth.js';
import { db } from '../data/store.js'; // só usado pros guiches até o cara do banco fazer guiches.repo
const router = Router();

router.post('/', async (req, res) => {
  const { tipo } = req.body;
  if (!['SP','SE','SG'].includes(tipo)) return res.status(400).json({ erro: 'Tipo deve ser SP, SE ou SG' });
  const senha = await repos.senhas.emitir(tipo);
  res.status(201).json(senha);
});

router.get('/fila', async (req, res) => res.json(await repos.senhas.listarFila()));
router.get('/ultimas', async (req, res) => res.json(await repos.senhas.ultimas()));
router.get('/historico', auth, async (req, res) => res.json(await repos.senhas.historico(req.query)));

router.post('/chamar', auth, async (req, res) => {
  const senha = await repos.senhas.chamarProxima(req.body.guiche_id, req.usuario.id);
  if (!senha) return res.status(404).json({ erro: 'Nenhuma senha aguardando' });
  res.json(senha);
});

router.post('/:id/iniciar', auth, async (req, res) => {
  const senha = await repos.senhas.buscarPorId(req.params.id);
  if (!senha || !['CHAMADA','AGUARDANDO'].includes(senha.status)) return res.status(400).json({ erro: 'Senha não pode ser iniciada' });
  senha.status = 'EM_ATENDIMENTO'; senha.inicio_atendimento = new Date().toISOString();
  res.json({ mensagem: 'Atendimento iniciado', senha: await repos.senhas.atualizar(senha) });
});

router.post('/:id/finalizar', auth, async (req, res) => {
  const senha = await repos.senhas.buscarPorId(req.params.id);
  if (!senha || senha.status !== 'EM_ATENDIMENTO') return res.status(400).json({ erro: 'Senha não está em atendimento' });
  senha.status = 'FINALIZADA'; senha.fim_atendimento = new Date().toISOString();
  res.json({ mensagem: 'Finalizada', senha: await repos.senhas.atualizar(senha) });
});

router.post('/:id/cancelar', auth, async (req, res) => {
  const senha = await repos.senhas.buscarPorId(req.params.id);
  if (!senha) return res.status(404).json({ erro: 'Senha não encontrada' });
  senha.status = 'CANCELADA';
  res.json({ mensagem: 'Cancelada', senha: await repos.senhas.atualizar(senha) });
});
export default router;
