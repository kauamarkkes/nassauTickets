
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import senhasRoutes from './routes/senhas.js';
import guichesRoutes from './routes/guiches.js';
import relatoriosRoutes from './routes/relatorios.js';
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ ok: true, driver: process.env.DB_DRIVER || 'memory' }));
app.use('/api/auth', authRoutes);
app.use('/api/senhas', senhasRoutes);
app.use('/api/guiches', guichesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ erro: 'Erro interno' }); });
export default app;
