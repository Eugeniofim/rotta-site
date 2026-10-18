/* =====================================================
   NUVEM POR LINHA — o que é PRIVADO da Sandra (18/10/2026)

   Veio do app da Mari (app-mari/nuvem-itens.js, skill app-sempre-junto):
   "Um banco. Muitas janelas. Cada registro é uma linha." Celular e
   computador olham para o mesmo banco: mexeu num, o outro recebe.

   Por que existe: nesta base (demo de Londres) só o catálogo, as datas e os
   ajustes (appstate, PÚBLICO) e as reservas e pedidos (tabelas próprias)
   iam para a nuvem. Orçamentos, tarefas, roteiros, fichas, pontos e
   avaliações ficavam presos no aparelho em que ela mexeu. Agora sobem como
   linhas da tabela `itens` da sala (só a dona lê e escreve — SALA-sandra.sql).

   As 4 peças: SOMBRA (o que este aparelho sabe que já está no banco), FILA
   (o que ainda não subiu — sobrevive a fechar o app), MARCA (até que hora
   já leu) e EM_DIA (só depois da primeira leitura o app manda coisas).

   Duas portas para quem NÃO é a dona:
   - avaliação do QR do fim do passeio: o visitante CRIA uma linha
     'avaliacoes' não publicada (a sala só aceita assim);
   - roteiro publicado: o cliente lê pelo código (função roteiro_publico).
   E as avaliações que ela publica vão para os ajustes (públicos), senão o
   visitante não veria o depoimento do Marcelo.
   ===================================================== */
'use strict';

const ITENS_COLS = ['orcamentos', 'tarefas', 'recados', 'roteiros', 'fichas', 'pontos', 'avaliacoes'];
const IT_NS = (typeof DB_KEY !== 'undefined' ? String(DB_KEY).replace(/_db_v\d+$/, '') : 'ss') + '_';
const IT_SOMBRA = IT_NS + 'sombra_v1', IT_FILA = IT_NS + 'fila_v1', IT_MARCA = IT_NS + 'marca_v1', IT_EMDIA = IT_NS + 'emdia_v1';
const itLe = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const itGrava = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

function itensDe(col) {
  const v = typeof DB !== 'undefined' && DB && DB[col];
  return (Array.isArray(v) ? v : []).filter(x => x && x.id).map(x => [x.id, x]);
}
/* a dona, logada e com banco: só assim o app manda e lê os itens */
const itPronto = () => typeof temNuvem === 'function' && temNuvem() && typeof isLoggedIn === 'function' && isLoggedIn();

/* compara com a SOMBRA e põe na FILA só o que mudou (e o que sumiu vira apagado) */
function itEnfileirar() {
  if (!itPronto() || !itLe(IT_EMDIA, false)) return 0;
  const sombra = itLe(IT_SOMBRA, {}), fila = itLe(IT_FILA, {});
  let n = 0;
  for (const col of ITENS_COLS) {
    const s = sombra[col] = sombra[col] || {}, vivos = new Set();
    for (const [id, x] of itensDe(col)) {
      vivos.add(id); const j = JSON.stringify(x);
      if (s[id] !== j) { s[id] = j; fila[col + '\u0001' + id] = { colecao: col, id, dados: x, apagado: false }; n++; }
    }
    for (const id of Object.keys(s)) if (!vivos.has(id)) { delete s[id]; fila[col + '\u0001' + id] = { colecao: col, id, dados: {}, apagado: true }; n++; }
  }
  itGrava(IT_SOMBRA, sombra); itGrava(IT_FILA, fila);
  return n;
}
async function itEnviarFila() {
  if (!itPronto()) return false;
  const fila = itLe(IT_FILA, {}), linhas = Object.values(fila);
  if (!linhas.length) return true;
  for (let k = 0; k < linhas.length; k += 200) {
    const lote = linhas.slice(k, k + 200);
    try {
      const r = await supaFetch('itens?on_conflict=colecao,id', { method: 'POST', body: JSON.stringify(lote),
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
      if (!r.ok) return false;
      const f2 = itLe(IT_FILA, {});
      for (const l of lote) { const kk = l.colecao + '\u0001' + l.id; if (f2[kk] && JSON.stringify(f2[kk]) === JSON.stringify(l)) delete f2[kk]; }
      itGrava(IT_FILA, f2);
    } catch (e) { return false; }
  }
  return true;
}
/* aplica no DB o que veio do banco; grava só no aparelho (nunca re-enfileira) */
function itAplicar(linhas) {
  const sombra = itLe(IT_SOMBRA, {});
  let mudou = 0;
  for (const l of linhas) {
    const col = l.colecao; if (!ITENS_COLS.includes(col)) continue;
    const s = sombra[col] = sombra[col] || {};
    DB[col] = Array.isArray(DB[col]) ? DB[col] : [];
    const i = DB[col].findIndex(x => x && x.id === l.id);
    if (l.apagado) { if (i >= 0) DB[col].splice(i, 1); }
    else if (i >= 0) DB[col][i] = l.dados; else DB[col].push(l.dados);
    if (l.apagado) delete s[l.id]; else s[l.id] = JSON.stringify(l.dados);
    mudou++;
  }
  itGrava(IT_SOMBRA, sombra);
  if (mudou) try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) {}
  return mudou;
}
async function itPuxar() {
  if (!itPronto()) return { ok: false };
  const marca = itLe(IT_MARCA, '');
  let r;
  try { r = await supaFetch('itens?select=colecao,id,dados,apagado,atualizado_em' + (marca ? '&atualizado_em=gt.' + encodeURIComponent(marca) : '') + '&order=atualizado_em.asc&limit=5000', { headers: { Prefer: '' } }); }
  catch (e) { return { ok: false }; }
  if (!r.ok) return { ok: false };
  const linhas = await r.json();
  const n = itAplicar(linhas);
  if (linhas.length) itGrava(IT_MARCA, linhas[linhas.length - 1].atualizado_em);
  return { ok: true, n };
}
/* O RITUAL DE ABRIR: lê o banco (insistindo), junta o que este aparelho
   tinha e o banco não, e só então passa a mandar. */
async function itSincronizarAoAbrir() {
  if (!itPronto()) return { ok: false };
  let r = { ok: false };
  for (let k = 0; k < 3 && !r.ok; k++) { r = await itPuxar(); if (!r.ok) await new Promise(ok => setTimeout(ok, 1500 * (k + 1))); }
  if (!r.ok) return r;
  if (!itLe(IT_EMDIA, false)) itGrava(IT_EMDIA, true);   /* primeira vez: o que só este aparelho tinha sobe (junta, não troca) */
  itEnfileirar();
  await itEnviarFila();
  return { ok: true, n: r.n };
}
/* depois de qualquer gravação: enfileira e manda em ~1 s */
let itT = null;
function itAgendar() {
  if (!itPronto() || !itLe(IT_EMDIA, false)) return;
  clearTimeout(itT);
  itT = setTimeout(() => { itEnfileirar(); itEnviarFila(); }, 900);
}
/* de 25 em 25 s, e quando a internet volta (nunca depender só do aviso na hora) */
let itRelogio = null;
function itLigar(onChange) {
  if (itRelogio || !itPronto()) return;
  itSincronizarAoAbrir().then(r => { if (r.ok && r.n && onChange) onChange(r); });
  itRelogio = setInterval(async () => { if (!itPronto()) return; itEnfileirar(); await itEnviarFila(); const r = await itPuxar(); if (r.ok && r.n && onChange) onChange(r); }, 25000);
  if (typeof addEventListener === 'function') addEventListener('online', () => { itEnfileirar(); itEnviarFila(); });
}

/* ---------- as duas portas de quem não é a dona ---------- */
/* avaliação do QR: o visitante só CRIA, e sempre não publicada */
async function itAvaliacaoPublica(a) {
  if (!(typeof temNuvem === 'function' && temNuvem()) || !a || !a.id) return false;
  const dados = { ...a, publicar: false };
  try { const r = await supaFetch('itens', { method: 'POST', body: JSON.stringify({ colecao: 'avaliacoes', id: a.id, dados, apagado: false }) }); return r.ok || r.status === 409; }
  catch (e) { return false; }
}
/* roteiro publicado: o cliente lê pelo código, sem login */
async function itRoteiroPublico(codigo) {
  if (!(typeof temNuvem === 'function' && temNuvem())) return null;
  try {
    const r = await supaFetch('rpc/roteiro_publico', { method: 'POST', body: JSON.stringify({ cod: String(codigo || '') }), headers: { Prefer: '' } });
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.codigo ? d : null;
  } catch (e) { return null; }
}

/* ---------- avaliações publicadas: vão para os ajustes (públicos) ----------
   Só a dona empurra o catálogo (cloudPushState), então o que vai é a lista
   DELA. Só o necessário para a vitrine: nada de contato do cliente. */
function avaliacoesParaPublico() {
  return (DB.avaliacoes || []).filter(a => a && a.publicar && a.autorizou !== false && !a.exemplo && String(a.texto || '').trim())
    .map(a => ({ id: a.id, nome: a.nome, estrelas: +a.estrelas || 0, texto: a.texto, tourId: a.tourId || '', data: a.data || '', video: a.video || '' }));
}
/* o que a vitrine mostra: as do aparelho (dona / protótipo) + as publicadas que vieram da nuvem */
function avaliacoesPublicadas() {
  const local = avaliacoesParaPublico(), ids = new Set(local.map(a => a.id));
  return local.concat(((DB.settings && DB.settings.avaliacoesPub) || []).filter(a => a && !ids.has(a.id)));
}
if (typeof statePayload === 'function') {
  const _statePayloadBase = statePayload;
  statePayload = function () {
    /* com banco, só depois da primeira leitura dos itens: antes disso a lista do
       aparelho está vazia e apagaria do público o que já estava publicado */
    const pode = !(typeof temNuvem === 'function' && temNuvem()) || itLe(IT_EMDIA, false);
    if (pode && DB && DB.settings) DB.settings.avaliacoesPub = avaliacoesParaPublico();
    return _statePayloadBase();
  };
}

if (typeof module !== 'undefined') module.exports = { ITENS_COLS, avaliacoesParaPublico, avaliacoesPublicadas };
