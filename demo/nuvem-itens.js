/* =====================================================
   NUVEM POR LINHA — o que é PRIVADO da guia (base, 18/10/2026)

   Veio do app da Mari e da Sandra (skill app-sempre-junto):
   "Um banco. Muitas janelas. Cada registro é uma linha." Celular e
   computador olham para o mesmo banco: mexeu num, o outro recebe.

   Por que existe: o cloud.js só sincroniza o catálogo, as datas e os ajustes
   (appstate — PÚBLICO, qualquer visitante lê) e as reservas e pedidos
   (tabelas próprias). Tarefas, recados, despesas, agências, roteiros,
   avaliações, fichas, e-mails, motoristas, pontos e vale-presentes ficavam
   presos no aparelho em que ela mexeu — e a página de planos promete
   "sincronizado na nuvem". Nada disso pode ir para o appstate (é público):
   sobe como linhas da tabela `itens` (só a dona lê e escreve).

   As 4 peças: SOMBRA (o que este aparelho sabe que já está no banco), FILA
   (o que ainda não subiu — sobrevive a fechar o app), MARCA (até que hora
   já leu) e EM DIA (só depois da primeira leitura o app manda coisas).

   TRAVA CONTRA PERDA TOTAL: o "em dia" mora DENTRO do DB (DB._itensEmDia),
   não numa chave separada. No app da Sandra/Mari ele morava ao lado: o botão
   "Sincronizar de novo" apagava o DB e deixava a sombra cheia, e o primeiro
   envio depois marcava TUDO como apagado no banco. Agora, DB apagado ou
   trocado = "em dia" some junto = o aparelho relê o banco inteiro antes de
   mandar qualquer coisa, e o que só ele tinha sobe (junta, não troca).

   Duas portas para quem NÃO é a dona:
   - avaliação do QR do fim do passeio: o visitante CRIA uma linha
     'avaliacoes' não publicada (a sala só aceita assim);
   - roteiro publicado: o cliente lê pelo código (função roteiro_publico).
   E as avaliações que ela publica vão para os ajustes (públicos), senão o
   visitante não veria o depoimento.
   ===================================================== */
'use strict';

/* pedidos NÃO: têm tabela própria (cloud.js). cliquesIngressos NÃO: é um
   contador do aparelho do visitante, nunca chegou à dona. */
const ITENS_COLS = ['tarefas', 'recados', 'despesas', 'agencias', 'trabalhosAgencia', 'roteiros',
                    'avaliacoes', 'fichas', 'emails', 'motoristas', 'pontos', 'giftcards'];
const IT_NS = (typeof DB_KEY !== 'undefined' ? String(DB_KEY).replace(/_db_v\d+$/, '') : 'vi') + '_';
const IT_SOMBRA = IT_NS + 'sombra_v1', IT_FILA = IT_NS + 'fila_v1', IT_MARCA = IT_NS + 'marca_v1';
const itLe = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const itGrava = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const itEmDia = () => typeof DB !== 'undefined' && !!DB && DB._itensEmDia === true;

function itensDe(col) {
  const v = typeof DB !== 'undefined' && DB && DB[col];
  return (Array.isArray(v) ? v : []).filter(x => x && x.id).map(x => [x.id, x]);
}
/* a dona, logada e com banco: só assim o app manda e lê os itens */
const itPronto = () => typeof temNuvem === 'function' && temNuvem() && typeof isLoggedIn === 'function' && isLoggedIn();

/* DUAS JANELAS (26/10/2026 — no app da Ingrid uma janela velha apagou guias e folgas):
   a sombra mora no localStorage, que as janelas do mesmo navegador DIVIDEM, mas
   cada janela tem o seu DB na memória. Uma janela aberta antes olhava a sombra
   cheia, não achava os registros no DB DELA e mandava "apagado" para o banco.
   Agora: (1) só apaga o que ESTA janela tinha e tirou; (2) o que está na sombra
   e esta janela nunca viu veio de outra janela → entra no DB, não sai; (3) o
   apagado leva junto o último conteúdo (dá para recuperar). */
const ITENS_DIC = [];
const itemId = (col, x) => x && x.id;
const itConhecidos = {};
let itResgatados = 0;
function itConhecer() {
  for (const col of ITENS_COLS) { const k = itConhecidos[col] = itConhecidos[col] || new Set(); for (const [id] of itensDe(col)) k.add(id); }
}
function itAdota(col, id, json) {
  let x; try { x = JSON.parse(json); } catch (e) { return false; }
  if (ITENS_DIC.includes(col)) { DB[col] = DB[col] || {}; if (!(id in DB[col])) DB[col][id] = x; }
  else { DB[col] = Array.isArray(DB[col]) ? DB[col] : []; if (!DB[col].some(y => itemId(col, y) === id)) DB[col].push(x); }
  (itConhecidos[col] = itConhecidos[col] || new Set()).add(id);
  return true;
}
/* compara com a SOMBRA e põe na FILA só o que mudou (e o que sumiu vira apagado) */
function itEnfileirar() {
  if (!itPronto() || !itEmDia()) return 0;
  const sombra = itLe(IT_SOMBRA, {}), fila = itLe(IT_FILA, {});
  let n = 0, adotou = 0;
  for (const col of ITENS_COLS) {
    const s = sombra[col] = sombra[col] || {}, vivos = new Set(), conhe = itConhecidos[col] = itConhecidos[col] || new Set();
    for (const [id, x] of itensDe(col)) {
      vivos.add(id); conhe.add(id); const j = JSON.stringify(x);
      if (s[id] !== j) { s[id] = j; fila[col + '\u0001' + id] = { colecao: col, id, dados: x, apagado: false }; n++; }
    }
    for (const id of Object.keys(s)) if (!vivos.has(id)) {
      if (!conhe.has(id)) { if (itAdota(col, id, s[id])) adotou++; continue; }   /* veio de outra janela: fica */
      let ult = {}; try { ult = JSON.parse(s[id]) || {}; } catch (e) {}
      delete s[id]; conhe.delete(id); fila[col + '\u0001' + id] = { colecao: col, id, dados: ult, apagado: true }; n++;
    }
  }
  if (adotou) try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) {}
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
  const sombra = itLe(IT_SOMBRA, {}), fila = itLe(IT_FILA, {});
  let mudou = 0;
  for (const l of linhas) {
    const col = l.colecao; if (!ITENS_COLS.includes(col)) continue;
    /* o que este aparelho mexeu e ainda não subiu vale mais que a cópia do banco */
    if (fila[col + '\u0001' + l.id]) continue;
    /* RESGATE (26/10/2026): "apagado" SEM conteúdo veio do defeito das duas janelas
       (o apagar de verdade agora leva o conteúdo junto). Se este aparelho ainda tem
       o registro, ele NÃO apaga: devolve para o banco. */
    if (l.apagado && String(l.atualizado_em || '') >= '2026-10-24' && (!l.dados || !Object.keys(l.dados).length)) {
      const local = ITENS_DIC.includes(col) ? (DB[col] || {})[l.id] : (Array.isArray(DB[col]) ? DB[col] : []).find(x => x && itemId(col, x) === l.id);
      if (local) { fila[col + '\u0001' + l.id] = { colecao: col, id: l.id, dados: local, apagado: false }; itGrava(IT_FILA, fila); itResgatados++; continue; }
    }
    const s = sombra[col] = sombra[col] || {};
    DB[col] = Array.isArray(DB[col]) ? DB[col] : [];
    const i = DB[col].findIndex(x => x && x.id === l.id);
    if (l.apagado) { if (i >= 0) DB[col].splice(i, 1); }
    else if (i >= 0) DB[col][i] = l.dados; else DB[col].push(l.dados);
    if (l.apagado) delete s[l.id]; else s[l.id] = JSON.stringify(l.dados);
    mudou++;
  }
  itGrava(IT_SOMBRA, sombra);
  itConhecer();
  if (mudou) try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) {}
  return mudou;
}
async function itPuxar() {
  if (!itPronto()) return { ok: false };
  const marca = itLe(IT_MARCA, '');
  let r;
  try { r = await supaFetch('itens?select=colecao,id,dados,apagado,atualizado_em' + (marca ? '&atualizado_em=gt.' + encodeURIComponent(marca) : '') + '&order=atualizado_em.asc&limit=5000', { headers: { Prefer: '' } }); }
  catch (e) { return { ok: false }; }
  if (!r.ok) return { ok: false };   /* tabela ainda não criada: fica tudo no aparelho, como antes */
  const linhas = await r.json();
  const n = itAplicar(linhas);
  if (linhas.length) itGrava(IT_MARCA, linhas[linhas.length - 1].atualizado_em);
  return { ok: true, n };
}
/* O RITUAL DE ABRIR: lê o banco (insistindo), junta o que este aparelho
   tinha e o banco não, e só então passa a mandar. */
async function itSincronizarAoAbrir() {
  if (!itPronto()) return { ok: false };
  /* DB sem a marca = aparelho novo, navegador limpo ou "Sincronizar de novo".
     A sombra e a marca de leitura que sobraram não valem mais nada: zera e
     relê o banco inteiro. Sem isto, a sombra cheia + DB vazio virava
     "ela apagou tudo" no primeiro envio. A fila velha some junto: era de
     um DB que não existe mais. */
  if (!itEmDia()) { itGrava(IT_SOMBRA, {}); itGrava(IT_MARCA, ''); itGrava(IT_FILA, {}); }
  let r = { ok: false };
  for (let k = 0; k < 3 && !r.ok; k++) { r = await itPuxar(); if (!r.ok) await new Promise(ok => setTimeout(ok, 1500 * (k + 1))); }
  if (!r.ok) return r;
  if (!itEmDia()) {   /* primeira leitura: o que só este aparelho tinha sobe (junta, não troca) */
    DB._itensEmDia = true;
    try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) {}
  }
  itEnfileirar();
  await itEnviarFila();
  return { ok: true, n: r.n };
}
/* depois de qualquer gravação: enfileira e manda em ~1 s */
let itT = null;
function itAgendar() {
  if (!itPronto() || !itEmDia()) return;
  clearTimeout(itT);
  itT = setTimeout(() => { itEnfileirar(); itEnviarFila(); }, 900);
}
/* de 25 em 25 s, e quando a internet volta (nunca depender só do aviso na hora).
   O relógio também pega o que foi gravado sem passar pelo save(). */
let itRelogio = null;
/* outra janela gravou: esta janela passa a olhar o MESMO DB (nunca fica com o velho) */
if (typeof addEventListener === 'function') addEventListener('storage', (e) => {
  if (e.key !== DB_KEY || !e.newValue) return;
  try {
    const novo = JSON.parse(e.newValue); if (!novo || typeof novo !== 'object' || Array.isArray(novo)) return;
    DB = novo; if (typeof fillSettings === 'function' && DB.settings) DB.settings = fillSettings(DB.settings);
    itConhecer();
    const ae = typeof document !== 'undefined' && document.activeElement, digitando = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
    if (!digitando && typeof route === 'function') route();
  } catch (err) {}
});
function itLigar(onChange) {
  if (itRelogio || !itPronto()) return;
  itConhecer();
  itSincronizarAoAbrir().then(r => { if (r.ok && r.n && onChange) onChange(r); });
  itRelogio = setInterval(async () => {
    if (!itPronto()) return;
    if (!itEmDia()) { const r0 = await itSincronizarAoAbrir(); if (r0.ok && r0.n && onChange) onChange(r0); return; }
    itEnfileirar(); await itEnviarFila();
    const r = await itPuxar(); if (r.ok && r.n && onChange) onChange(r);
  }, 25000);
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
/* o que a vitrine mostra: as do aparelho (dona / protótipo) + as publicadas que vieram da nuvem.
   comExemplo: a página Avaliações da DEMONSTRAÇÃO sempre mostrou as de exemplo
   (o carrossel de depoimentos não). Com banco não existe exemplo. */
function avaliacoesPublicadas(comExemplo) {
  const demo = comExemplo && !(typeof temNuvem === 'function' && temNuvem());
  const local = demo ? (DB.avaliacoes || []).filter(a => a && a.publicar) : avaliacoesParaPublico(), ids = new Set(local.map(a => a.id));
  return local.concat(((DB.settings && DB.settings.avaliacoesPub) || []).filter(a => a && !ids.has(a.id)));
}
if (typeof statePayload === 'function') {
  const _statePayloadBase = statePayload;
  statePayload = function () {
    /* com banco, só depois da primeira leitura dos itens: antes disso a lista do
       aparelho está vazia e apagaria do público o que já estava publicado */
    const pode = !(typeof temNuvem === 'function' && temNuvem()) || itEmDia();
    if (pode && DB && DB.settings) DB.settings.avaliacoesPub = avaliacoesParaPublico();
    return _statePayloadBase();
  };
}

if (typeof module !== 'undefined') module.exports = { ITENS_COLS, avaliacoesParaPublico, avaliacoesPublicadas };
