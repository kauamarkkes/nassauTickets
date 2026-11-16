import bcrypt from 'bcryptjs';
const senhaAdmin = await bcrypt.hash('123456', 10);

export const db = {
  usuarios: [
    { id: 1, nome: 'Admin', email: 'admin@lab.com', senha_hash: senhaAdmin, papel: 'admin' },
    { id: 2, nome: 'Atendente 1', email: 'atendente@lab.com', senha_hash: senhaAdmin, papel: 'atendente' },
  ],
  guiches: [
    { id: 1, numero: 1, atendente_id: null, status: 'livre' },
    { id: 2, numero: 2, atendente_id: null, status: 'livre' },
    { id: 3, numero: 3, atendente_id: null, status: 'livre' },
  ],
  senhas: [],
  contador: {},
  auditoria: [],
  nextSenhaId: 1,
  nextUsuarioId: 3,
};
