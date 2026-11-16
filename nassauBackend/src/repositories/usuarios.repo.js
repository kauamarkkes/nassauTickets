
import { db } from '../data/store.js';
export const usuariosRepo = {
  async buscarPorEmail(email) { return db.usuarios.find(u => u.email === email); },
  async criar({ nome, email, senha_hash, papel }) {
    const novo = { id: db.nextUsuarioId++, nome, email, senha_hash, papel };
    db.usuarios.push(novo);
    return novo;
  }
};
