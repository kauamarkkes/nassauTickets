
import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ API rodando em http://localhost:${PORT} | driver: ${process.env.DB_DRIVER || 'memory'}`));
