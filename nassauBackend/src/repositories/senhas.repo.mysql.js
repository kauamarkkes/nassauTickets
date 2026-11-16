// NÃO PRECISA MEXER. Quando DB_DRIVER=mysql, esse arquivo assume.
// O contrato é idêntico ao memory: mesmos nomes de métodos, mesmo retorno.
import { pool } from '../config/db.js';
import { gerarCodigo, hojeISO } from '../utils/codigo.js';

export const senhasRepoMysql = {
  async emitir(tipo) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const hoje = hojeISO();
      await conn.query('SELECT * FROM contador_diario WHERE data = ? AND tipo = ? FOR UPDATE', [hoje, tipo]);
      const [cont] = await conn.query('SELECT ultimo_numero FROM contador_diario WHERE data = ? AND tipo = ?', [hoje, tipo]);
      const proximo = (cont[0]?.ultimo_numero || 0) + 1;
      await conn.query('INSERT INTO contador_diario (data, tipo, ultimo_numero) VALUES (?,?,?) ON DUPLICATE KEY UPDATE ultimo_numero = ?', [hoje, tipo, proximo, proximo]);
      const codigo = gerarCodigo(tipo, proximo);
      const [r] = await conn.query('INSERT INTO senhas (codigo, tipo) VALUES (?,?)', [codigo, tipo]);
      await conn.commit();
      return { id: r.insertId, codigo, tipo, status: 'AGUARDANDO', guiche_id: null, atendente_id: null, emitida_em: new Date().toISOString(), chamada_em: null, inicio_atendimento: null, fim_atendimento: null };
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  },

  async listarFila() {
    const [rows] = await pool.query(`
      SELECT s.*, g.numero as guiche_numero FROM senhas s
      LEFT JOIN guiches g ON s.guiche_id = g.id
      WHERE s.status IN ('AGUARDANDO','CHAMADA','EM_ATENDIMENTO')
      ORDER BY CASE s.tipo WHEN 'SP' THEN 1 WHEN 'SE' THEN 2 WHEN 'SG' THEN 3 END, s.emitida_em ASC`);
    return rows;
  },

  async ultimas() {
    const [rows] = await pool.query(`
      SELECT s.codigo, s.tipo, s.status, g.numero as guiche_numero, s.chamada_em
      FROM senhas s LEFT JOIN guiches g ON s.guiche_id = g.id
      WHERE s.chamada_em IS NOT NULL ORDER BY s.chamada_em DESC LIMIT 5`);
    return rows;
  },

  async historico({ tipo, status, data }) {
    let sql = 'SELECT * FROM senhas WHERE 1=1'; const p = [];
    if (tipo) { sql += ' AND tipo = ?'; p.push(tipo); }
    if (status) { sql += ' AND status = ?'; p.push(status); }
    if (data) { sql += ' AND DATE(emitida_em) = ?'; p.push(data); }
    sql += ' ORDER BY emitida_em DESC LIMIT 200';
    const [rows] = await pool.query(sql, p);
    return rows;
  },

  async chamarProxima(guiche_id, atendente_id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query(`
        SELECT * FROM senhas WHERE status = 'AGUARDANDO'
        ORDER BY CASE tipo WHEN 'SP' THEN 1 WHEN 'SE' THEN 2 WHEN 'SG' THEN 3 END, emitida_em ASC LIMIT 1 FOR UPDATE`);
      if (!rows.length) { await conn.rollback(); return null; }
      const senha = rows[0];
      await conn.query('UPDATE senhas SET status = ?, guiche_id = ?, atendente_id = ?, chamada_em = NOW() WHERE id = ?', ['CHAMADA', guiche_id, atendente_id, senha.id]);
      await conn.query('UPDATE guiches SET status = ? WHERE id = ?', ['ocupado', guiche_id]);
      await conn.commit();
      return { ...senha, status: 'CHAMADA', guiche_id: Number(guiche_id) };
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  },

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM senhas WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async atualizar(senha) {
    await pool.query('UPDATE senhas SET status = ?, guiche_id = ?, atendente_id = ?, chamada_em = ?, inicio_atendimento = ?, fim_atendimento = ? WHERE id = ?',
      [senha.status, senha.guiche_id, senha.atendente_id, senha.chamada_em, senha.inicio_atendimento, senha.fim_atendimento, senha.id]);
    if (senha.status === 'FINALIZADA' && senha.guiche_id) {
      await pool.query("UPDATE guiches SET status = 'livre' WHERE id = ?", [senha.guiche_id]);
    }
    return senha;
  },

  async listarDoDia(data) {
    const [rows] = await pool.query('SELECT * FROM senhas WHERE DATE(emitida_em) = ?', [data]);
    return rows;
  },
};
