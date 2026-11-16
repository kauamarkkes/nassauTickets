import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool = null;

if (process.env.DB_DRIVER === 'mysql') {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
  console.log('🗄️  Modo: MYSQL');
} else {
  console.log('💾 Modo: MEMORY (sem banco, pronto pra plugar MySQL)');
}

export { pool };
