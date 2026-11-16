import { db } from '../data/store.js';
import { gerarCodigo, hojeISO } from '../utils/codigo.js';

const PRIORIDADE = { SP: 1, SE: 2, SG: 3 };
let emitindo = false;
const esperar = (ms) => new Promise(r => setTimeout(r, ms));

export const senhasRepoMemory = {
  async emitir(tipo) {
    while (emitindo) await esperar(10);
    emitindo = true;
    try {
      const chave = `${hojeISO()}-${tipo}`;
      const proximo = (db.contador[chave] || 0) + 1;
      db.contador[chave] = proximo;
      const senha = {
        id: db.nextSenhaId++,
        codigo: gerarCodigo(tipo, proximo),
        tipo, status: 'AGUARDANDO',
        guiche_id: null, atendente_id: null,
        emitida_em: new Date().toISOString(),
        chamada_em: null, inicio_atendimento: null, fim_atendimento: null,
      };
      db.senhas.push(senha);
      return senha;
    } finally { emitindo = false; }
  },

  async listarFila() {
    return db.senhas
      .filter(s => ['AGUARDANDO', 'CHAMADA', 'EM_ATENDIMENTO'].includes(s.status))
      .sort((a, b) => PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo] || new Date(a.emitida_em) - new Date(b.emitida_em))
      .map(s => ({ ...s, guiche_numero: db.guiches.find(g => g.id === s.guiche_id)?.numero || null }));
  },

  async ultimas() {
    return db.senhas.filter(s => s.chamada_em)
      .sort((a, b) => new Date(b.chamada_em) - new Date(a.chamada_em)).slice(0, 5)
      .map(s => ({ codigo: s.codigo, tipo: s.tipo, status: s.status, guiche_numero: db.guiches.find(g => g.id === s.guiche_id)?.numero || null, chamada_em: s.chamada_em }));
  },

  async historico({ tipo, status, data }) {
    let lista = [...db.senhas];
    if (tipo) lista = lista.filter(s => s.tipo === tipo);
    if (status) lista = lista.filter(s => s.status === status);
    if (data) lista = lista.filter(s => s.emitida_em.slice(0, 10) === data);
    return lista.sort((a, b) => new Date(b.emitida_em) - new Date(a.emitida_em)).slice(0, 200);
  },

  async chamarProxima(guiche_id, atendente_id) {
    const senha = db.senhas.filter(s => s.status === 'AGUARDANDO')
      .sort((a, b) => PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo] || new Date(a.emitida_em) - new Date(b.emitida_em))[0];
    if (!senha) return null;
    senha.status = 'CHAMADA';
    senha.guiche_id = Number(guiche_id);
    senha.atendente_id = atendente_id;
    senha.chamada_em = new Date().toISOString();
    const g = db.guiches.find(x => x.id === Number(guiche_id));
    if (g) g.status = 'ocupado';
    return senha;
  },

  async buscarPorId(id) { return db.senhas.find(s => s.id === Number(id)); },
  async atualizar(senha) { return senha; }, // em memória já está atualizado por referência
  async listarDoDia(data) { return db.senhas.filter(s => s.emitida_em.slice(0, 10) === data); },
};
