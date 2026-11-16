
import { senhasRepoMemory } from './senhas.repo.js';
import { senhasRepoMysql } from './senhas.repo.mysql.js';
import { usuariosRepo } from './usuarios.repo.js';

const isMysql = process.env.DB_DRIVER === 'mysql';

export const repos = {
  senhas: isMysql ? senhasRepoMysql : senhasRepoMemory,
  usuarios: usuariosRepo,
};
