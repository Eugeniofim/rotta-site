/* =====================================================
   CATÁLOGO — os imóveis da AD7 (dados/imoveis.json, gerado pelo importador).
   Tudo que o site mostra passa por aqui: busca, filtros, destaques, parecidos.
   Na entrega 2 os imóveis passam a morar no banco e este arquivo lê de lá;
   as funções continuam as mesmas.
   ===================================================== */
'use strict';

let IMOVEIS = [];
const CAT = { pronto: false, erro: '' };
const TRANS = { venda: 'Venda', aluguel: 'Aluguel', temporada: 'Temporada' };
const TRANS_VERBO = { venda: 'à venda', aluguel: 'para alugar', temporada: 'para temporada' };

async function carregarCatalogo(versao) {
  try {
    const r = await fetch('dados/imoveis.json?v=' + encodeURIComponent(versao || ''));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    IMOVEIS = (await r.json()).filter(im => im && im.publicado !== false);
  } catch (e) { CAT.erro = String(e && e.message || e); IMOVEIS = []; }
  CAT.pronto = true;
  return IMOVEIS;
}

function fmtPreco(v) {
  if (v == null || isNaN(v)) return 'Consulte';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function rotuloPreco(im) {
  if (im.preco == null) return 'Consulte';
  if (im.transacao === 'aluguel') return fmtPreco(im.preco) + '/mês';
  return fmtPreco(im.preco);
}
function fmtArea(v) { return v == null ? '' : (Number.isInteger(v) ? v : String(v).replace('.', ',')) + ' m²'; }

function porRef(ref) { ref = String(ref || '').trim(); return IMOVEIS.find(im => im.ref === ref) || null; }

function textoBusca(im) {
  return [im.ref, im.titulo, im.tipo, im.bairro, im.cidade, im.perfil, im.situacao].join(' ').toLowerCase();
}

/* f: { neg, tipo, cidade, bairro, q, min, max, dorm, vagas, mar, piscina, ordem } */
function filtrar(f) {
  f = f || {};
  const q = String(f.q || '').trim().toLowerCase();
  let lista = IMOVEIS.filter(im => {
    if (f.neg && im.transacao !== f.neg) return false;
    if (f.tipo && im.tipo.toLowerCase() !== String(f.tipo).toLowerCase()) return false;
    if (f.cidade && im.cidade !== f.cidade) return false;
    if (f.bairro && im.bairro !== f.bairro) return false;
    if (f.perfil && im.perfil.toLowerCase() !== String(f.perfil).toLowerCase()) return false;
    if (f.min && (im.preco == null || im.preco < +f.min)) return false;
    if (f.max && (im.preco == null || im.preco > +f.max)) return false;
    if (f.dorm && im.dorm < +f.dorm) return false;
    if (f.vagas && im.vagas < +f.vagas) return false;
    if (f.mar && im.proximoMar < 3) return false;
    if (f.piscina && !(im.caracteristicas || []).some(c => /piscina/i.test(c))) return false;
    if (f.mobiliado && !/mobiliado/i.test(im.mobiliado || '')) return false;
    if (q && !textoBusca(im).includes(q)) return false;
    return true;
  });
  const ordem = f.ordem || 'recentes';
  if (ordem === 'menor') lista = lista.slice().sort((a, b) => (a.preco ?? Infinity) - (b.preco ?? Infinity));
  else if (ordem === 'maior') lista = lista.slice().sort((a, b) => (b.preco ?? -1) - (a.preco ?? -1));
  else lista = lista.slice().sort((a, b) => (b.atualizado || 0) - (a.atualizado || 0));
  return lista;
}

function unicos(lista, chave) {
  return [...new Set(lista.map(im => im[chave]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
function opcoes(f) {
  const base = f && f.neg ? IMOVEIS.filter(im => im.transacao === f.neg) : IMOVEIS;
  const daCidade = f && f.cidade ? base.filter(im => im.cidade === f.cidade) : base;
  return { tipos: unicos(base, 'tipo'), cidades: unicos(base, 'cidade'), bairros: unicos(daCidade, 'bairro') };
}

function destaques(f, n) { return filtrar(f).slice(0, n || 4); }

function parecidos(im, n) {
  const mesmo = IMOVEIS.filter(x => x.ref !== im.ref && x.transacao === im.transacao);
  const pontua = x => (x.tipo === im.tipo ? 2 : 0) + (x.bairro === im.bairro ? 2 : 0) + (x.cidade === im.cidade ? 1 : 0)
    + (im.preco && x.preco && Math.abs(x.preco - im.preco) / im.preco < 0.35 ? 1 : 0);
  return mesmo.sort((a, b) => pontua(b) - pontua(a)).slice(0, n || 3);
}

function resumoCatalogo() {
  const c = {};
  for (const im of IMOVEIS) c[im.transacao] = (c[im.transacao] || 0) + 1;
  return { total: IMOVEIS.length, porTransacao: c, cidades: unicos(IMOVEIS, 'cidade'), bairros: unicos(IMOVEIS, 'bairro') };
}

if (typeof module !== 'undefined') module.exports = { carregarCatalogo, filtrar, opcoes, destaques, parecidos, porRef, fmtPreco, rotuloPreco, fmtArea, resumoCatalogo, TRANS, TRANS_VERBO, _set: l => { IMOVEIS = l; CAT.pronto = true; } };
