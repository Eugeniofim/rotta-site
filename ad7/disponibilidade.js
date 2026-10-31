/* =====================================================
   DISPONIBILIDADE — o calendário da temporada, estilo Airbnb.

   A AD7 marca os dias reservados e os indisponíveis (no painel do site de
   verdade, ou na gestão da demonstração). O site mostra o calendário na página
   do imóvel; o visitante toca na entrada e na saída e já vê o pacote: noites,
   total, sinal de reserva e restante, e pede a reserva pelo WhatsApp com tudo
   escrito. O robô de atendimento vai usar estas mesmas contas e este calendário.

   Onde mora: com banco, na coleção `disponibilidade` da tabela `itens` da sala
   (1 linha por imóvel, id = ref; leitura pública, escrita só da dona — ver
   SALA-ad7-disponibilidade.sql). Sem banco (demonstração): no aparelho, que o
   site e a gestão da demo dividem por estarem no mesmo endereço.
   ===================================================== */
'use strict';

const DISPO_KEY = 'ad7_dispo_v1';
const DISPO_COLECAO = 'disponibilidade';
const DISPO_ESTADOS = { res: 'Reservado', blq: 'Indisponível' };
const DISPO_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DISPO_PADRAO = { sinalPct: 50, minNoites: 2 };
var DISPO = { porRef: {}, nuvem: false, pronto: false, semear: true, modo: 'res', sel: null, periodo: null, mes: { editar: 0, ver: 0 }, aviso: '' };

/* ---- datas (sem fuso: a data é a data) ---- */
function dispoIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dispoData(iso) { const [y, m, d] = String(iso).split('-').map(Number); return new Date(y, m - 1, d); }
function dispoHoje() { return typeof DISPO_HOJE_FIXO === 'string' ? dispoData(DISPO_HOJE_FIXO) : new Date(); }
function dispoSoma(iso, n) { const d = dispoData(iso); d.setDate(d.getDate() + n); return dispoIso(d); }
function dispoIntervalo(a, b) { let ini = a < b ? a : b, fim = a < b ? b : a; const l = []; for (let x = ini; x <= fim; x = dispoSoma(x, 1)) { l.push(x); if (l.length > 400) break; } return l; }
function dispoNoites(ini, fim) { return Math.round((dispoData(fim) - dispoData(ini)) / 86400000); }
function dispoFmtCurta(iso) { const d = dispoData(iso); return d.getDate() + ' de ' + DISPO_MESES[d.getMonth()].slice(0, 3); }
function dispoFmtPeriodo(ini, fim) {
  if (ini === fim) return dispoFmtCurta(ini);
  const a = dispoData(ini), b = dispoData(fim);
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() ? a.getDate() + ' a ' + dispoFmtCurta(fim) : dispoFmtCurta(ini) + ' a ' + dispoFmtCurta(fim);
}
function dispoFmtBr(iso) { const d = dispoData(iso); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }
function dispoReal(v) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function dispoEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---- guarda ---- */
function dispoLocal() { try { return JSON.parse(localStorage.getItem(DISPO_KEY)) || {}; } catch (e) { return {}; } }
function dispoGravarLocal(mapa) { try { localStorage.setItem(DISPO_KEY, JSON.stringify(mapa)); } catch (e) {} }
function dispoDe(ref) { return DISPO.porRef[String(ref)] || { dias: {} }; }
function dispoDias(ref) { return dispoDe(ref).dias || {}; }
function dispoRegras(ref) { const r = dispoDe(ref); return { sinalPct: r.sinalPct != null ? r.sinalPct : DISPO_PADRAO.sinalPct, minNoites: r.minNoites != null ? r.minNoites : DISPO_PADRAO.minNoites }; }

/* dados de demonstração: reservas perto de hoje para o calendário não nascer vazio */
function dispoSemente() {
  const h = dispoIso(dispoHoje()); const m = {};
  const marca = (ref, ini, n, est) => { m[ref] = m[ref] || { dias: {} }; for (let i = 0; i < n; i++) m[ref].dias[dispoSoma(ini, i)] = est; };
  marca('406', dispoSoma(h, 5), 3, 'res'); marca('406', '2026-12-28', 6, 'res'); marca('406', '2027-02-13', 5, 'res');
  marca('221', dispoSoma(h, 12), 5, 'res'); marca('221', dispoSoma(h, 20), 2, 'blq'); marca('221', '2026-12-28', 6, 'res');
  marca('303', dispoSoma(h, 3), 3, 'blq'); marca('303', dispoSoma(h, 33), 7, 'res');
  marca('301', dispoSoma(h, 1), 2, 'res');
  return m;
}

async function dispoCarregarTudo() {
  let mapa = null;
  if (typeof temNuvem === 'function' && temNuvem()) {
    try {
      const r = await supaFetch('itens?colecao=eq.' + DISPO_COLECAO + '&apagado=eq.false&select=id,dados');
      if (r.ok) { mapa = {}; for (const x of await r.json()) mapa[x.id] = Object.assign({ dias: {} }, x.dados || {}); DISPO.nuvem = true; }
    } catch (e) {}
  }
  if (!mapa) {
    mapa = dispoLocal(); DISPO.nuvem = false;
    if (!Object.keys(mapa).length && DISPO.semear) { mapa = dispoSemente(); dispoGravarLocal(mapa); }
  }
  DISPO.porRef = mapa; DISPO.pronto = true;
  return mapa;
}

/* grava o registro do imóvel (dias + regras). Com banco e dona logada: upsert na sala. */
async function dispoGravar(ref, registro) {
  ref = String(ref);
  const dias = {}; for (const [k, v] of Object.entries(registro.dias || {})) if (v) dias[k] = v;
  const reg = { dias, sinalPct: registro.sinalPct != null ? +registro.sinalPct : dispoRegras(ref).sinalPct, minNoites: registro.minNoites != null ? +registro.minNoites : dispoRegras(ref).minNoites };
  DISPO.porRef[ref] = reg;
  let nuvem = false;
  if (typeof temNuvem === 'function' && temNuvem() && typeof isLoggedIn === 'function' && isLoggedIn()) {
    try {
      const r = await supaFetch('itens?on_conflict=colecao,id', { method: 'POST', body: JSON.stringify({ colecao: DISPO_COLECAO, id: ref, dados: Object.assign({ ref, atualizadoEm: new Date().toISOString() }, reg), apagado: false }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
      nuvem = r.ok;
    } catch (e) {}
  }
  if (!nuvem) { const m = dispoLocal(); m[ref] = reg; dispoGravarLocal(m); }
  return { ok: true, nuvem };
}
function dispoAplicar(dias, lista, estado) { const n = Object.assign({}, dias); for (const iso of lista) { if (estado) n[iso] = estado; else delete n[iso]; } return n; }
/* noites ocupadas dentro de um período de hospedagem: da entrada até a véspera da saída */
function dispoConflito(ref, ini, fim) { const d = dispoDias(ref); const l = dispoIntervalo(ini, fim); if (l.length > 1) l.pop(); return l.filter(iso => d[iso]); }

/* primeiro trecho livre de pelo menos `min` noites a partir de hoje */
function dispoProximoLivre(ref, min, horizonte) {
  min = min || 2; horizonte = horizonte || 120;
  const d = dispoDias(ref); let ini = null, n = 0, iso = dispoIso(dispoHoje());
  for (let i = 0; i <= horizonte; i++, iso = dispoSoma(iso, 1)) {
    if (!d[iso]) { if (!ini) { ini = iso; n = 0; } n++; }
    else if (ini && n >= min) return { ini, fim: dispoSoma(ini, n) };
    else { ini = null; n = 0; }
  }
  return ini && n >= min ? { ini, fim: dispoSoma(ini, Math.min(n, 30)) } : null;
}
function dispoResumo(ref, dias) {
  const d = dispoDias(ref), hoje = dispoIso(dispoHoje()), fim = dispoSoma(hoje, dias || 90);
  let res = 0, blq = 0, prox = null;
  for (const iso of Object.keys(d).sort()) { if (iso < hoje || iso > fim) continue; if (d[iso] === 'res') { res++; if (!prox) prox = iso; } else blq++; }
  let proxFim = prox; while (prox && d[dispoSoma(proxFim, 1)] === 'res') proxFim = dispoSoma(proxFim, 1);
  return { reservados: res, bloqueados: blq, proxima: prox ? { ini: prox, fim: proxFim } : null };
}

/* o pacote: noites × diária, sinal e restante. É a conta que o robô também vai fazer. */
function dispoOrcamento(im, ini, fim) {
  const regras = dispoRegras(im.ref);
  const noites = Math.max(0, dispoNoites(ini, fim));
  const diaria = im.preco != null && !isNaN(im.preco) ? Number(im.preco) : null;
  const total = diaria != null ? diaria * noites : null;
  const sinal = total != null ? Math.round(total * regras.sinalPct / 100) : null;
  return { noites, diaria, total, sinal, restante: total != null ? total - sinal : null, sinalPct: regras.sinalPct, minNoites: regras.minNoites, poucasNoites: noites < regras.minNoites, conflito: dispoConflito(im.ref, ini, fim).length };
}
function dispoTextoWhats(im, ini, fim) {
  const o = dispoOrcamento(im, ini, fim);
  const l = ['Olá! Quero reservar o imóvel Ref. ' + im.ref + ' (' + im.tipo + ' em ' + im.bairro + ') para temporada.', 'Entrada ' + dispoFmtBr(ini) + ' · saída ' + dispoFmtBr(fim) + ' · ' + o.noites + (o.noites === 1 ? ' noite' : ' noites') + '.'];
  if (o.total != null) l.push('Pelo site: ' + o.noites + ' × ' + dispoReal(o.diaria) + ' = ' + dispoReal(o.total) + ' · sinal de reserva ' + dispoReal(o.sinal) + ' (' + o.sinalPct + '%) · restante ' + dispoReal(o.restante) + ' na entrada.');
  l.push('Está disponível? Como faço o sinal?');
  return l.join('\n');
}

/* ---- o calendário (HTML) ---- */
function dispoCalendarioHtml(o) {
  const hoje = dispoHoje(), hojeIso = dispoIso(hoje), ctx = o.ctx || 'ver', ref = String(o.ref);
  const off = DISPO.mes[ctx] || 0, dias = dispoDias(ref);
  const sel = DISPO.sel && DISPO.sel.ref === ref && DISPO.sel.ctx === ctx ? DISPO.sel.iso : null;
  const per = DISPO.periodo && DISPO.periodo.ref === ref && DISPO.periodo.ctx === ctx ? DISPO.periodo : null;
  const marcado = iso => sel === iso || (per && iso >= per.ini && iso <= per.fim);
  const meses = [];
  for (let m = 0; m < (o.meses || 2); m++) {
    const d0 = new Date(hoje.getFullYear(), hoje.getMonth() + off + m, 1);
    const nome = DISPO_MESES[d0.getMonth()] + ' ' + d0.getFullYear();
    const n = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
    let h = '<div class="cal-mes"><div class="cal-nome">' + nome + '</div><div class="cal" role="grid" aria-label="' + nome + '">' + ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => '<span class="cabd" aria-hidden="true">' + x + '</span>').join('');
    for (let i = 0; i < d0.getDay(); i++) h += '<span></span>';
    for (let d = 1; d <= n; d++) {
      const iso = dispoIso(new Date(d0.getFullYear(), d0.getMonth(), d)), est = dias[iso] || '', passado = iso < hojeIso;
      const cls = ['dia', est, passado ? 'passado' : '', iso === hojeIso ? 'hoje' : '', marcado(iso) ? 'sel' : ''].filter(Boolean).join(' ');
      const rot = (DISPO_ESTADOS[est] || 'Livre') + ', ' + d + ' de ' + DISPO_MESES[d0.getMonth()];
      h += passado ? '<span class="' + cls + '">' + d + '</span>' : '<button type="button" class="' + cls + '" data-act="dispo-dia" data-iso="' + iso + '" aria-label="' + rot + '" aria-pressed="' + !!marcado(iso) + '">' + d + '</button>';
    }
    meses.push(h + '</div></div>');
  }
  const nav = '<div class="cal-nav"><button type="button" class="cal-seta" data-act="dispo-mes" data-dir="-1" aria-label="Meses anteriores"' + (off <= 0 ? ' disabled' : '') + '>‹</button><button type="button" class="cal-seta" data-act="dispo-mes" data-dir="1" aria-label="Próximos meses"' + (off >= 12 ? ' disabled' : '') + '>›</button></div>';
  const legenda = '<div class="legenda"><span><i class="l-livre"></i>Livre</span><span><i class="l-res"></i>Reservado</span><span><i class="l-blq"></i>Indisponível</span><span><i class="l-sel"></i>Selecionado</span></div>';
  return '<div class="dispo" data-dispo="' + ctx + '" data-ref="' + dispoEsc(ref) + '"><div class="cal-cab">' + legenda + nav + '</div><div class="cal-meses">' + meses.join('') + '</div></div>';
}

/* o editor (painel do site de verdade e gestão da demo) */
function dispoEditorHtml(ref, im) {
  ref = String(ref);
  const sel = DISPO.sel && DISPO.sel.ref === ref && DISPO.sel.ctx === 'editar' ? DISPO.sel.iso : null;
  const r = dispoResumo(ref), regras = dispoRegras(ref);
  const modos = [['res', 'Reservado'], ['blq', 'Indisponível'], ['livre', 'Livre (apagar)']];
  const diaria = im && im.preco != null ? dispoReal(im.preco) + '/diária' : 'diária a combinar';
  return '<div class="dispo-editor" data-dispo="editar" data-ref="' + dispoEsc(ref) + '">'
    + '<div class="dispo-modos" role="group" aria-label="O que marcar">' + modos.map(([v, t]) => '<button type="button" class="dispo-modo' + (DISPO.modo === v ? ' on' : '') + '" data-act="dispo-modo" data-v="' + v + '" aria-pressed="' + (DISPO.modo === v) + '">' + t + '</button>').join('') + '</div>'
    + '<p class="dispo-dica">' + (sel ? '<b>Começa em ' + dispoFmtCurta(sel) + '.</b> Agora toque no último dia (ou no mesmo dia, para um dia só). <button type="button" class="dispo-link" data-act="dispo-limpar">Cancelar</button>' : 'Escolha acima o que marcar, toque no primeiro dia e depois no último. O site muda na hora.') + '</p>'
    + (DISPO.aviso ? '<div class="dispo-aviso" role="status">' + dispoEsc(DISPO.aviso) + '</div>' : '')
    + dispoCalendarioHtml({ ref, ctx: 'editar', meses: 2 })
    + '<div class="dispo-regras"><label>Sinal de reserva <span><input type="number" min="0" max="100" step="5" value="' + regras.sinalPct + '" data-act="dispo-regra" data-campo="sinalPct" aria-label="Sinal de reserva em porcento">%</span></label><label>Mínimo de noites <input type="number" min="1" max="30" value="' + regras.minNoites + '" data-act="dispo-regra" data-campo="minNoites" aria-label="Mínimo de noites"></label><span class="dispo-dica">' + dispoEsc(diaria) + ' · o site calcula o pacote e o sinal com isto.</span></div>'
    + '<div class="dispo-resumo">Próximos 90 dias: <b>' + r.reservados + '</b> ' + (r.reservados === 1 ? 'noite reservada' : 'noites reservadas') + ', <b>' + r.bloqueados + '</b> ' + (r.bloqueados === 1 ? 'indisponível' : 'indisponíveis') + (r.proxima ? ' · próxima reserva: <b>' + dispoFmtPeriodo(r.proxima.ini, r.proxima.fim) + '</b>' : ' · nenhuma reserva marcada') + '</div>'
    + '</div>';
}

/* o que o visitante vê na página do imóvel */
function dispoVisitanteHtml(im, opcoes) {
  const ref = String(im.ref), wa = opcoes && opcoes.wa;
  const sel = DISPO.sel && DISPO.sel.ref === ref && DISPO.sel.ctx === 'ver' ? DISPO.sel.iso : null;
  const per = DISPO.periodo && DISPO.periodo.ref === ref && DISPO.periodo.ctx === 'ver' ? DISPO.periodo : null;
  const prox = dispoProximoLivre(ref, dispoRegras(ref).minNoites);
  let acao;
  if (per) {
    const o = dispoOrcamento(im, per.ini, per.fim);
    const linhas = '<div class="dispo-conta"><div><span>' + dispoFmtPeriodo(per.ini, per.fim) + '</span><b>' + o.noites + (o.noites === 1 ? ' noite' : ' noites') + '</b></div>'
      + (o.total != null ? '<div><span>' + o.noites + ' × ' + dispoReal(o.diaria) + '</span><b>' + dispoReal(o.total) + '</b></div><div><span>Sinal de reserva (' + o.sinalPct + '%)</span><b>' + dispoReal(o.sinal) + '</b></div><div><span>Restante, na entrada</span><b>' + dispoReal(o.restante) + '</b></div>' : '<div><span>Valor</span><b>a combinar</b></div>') + '</div>';
    if (o.conflito) acao = '<div class="dispo-aviso erro" role="alert">Esse período tem ' + o.conflito + (o.conflito === 1 ? ' noite já reservada' : ' noites já reservadas') + '. Escolha outras datas.</div><button type="button" class="dispo-link" data-act="dispo-limpar">Escolher outras datas</button>';
    else if (o.poucasNoites) acao = '<div class="dispo-aviso erro" role="alert">Este imóvel pede no mínimo ' + o.minNoites + ' noites.</div><button type="button" class="dispo-link" data-act="dispo-limpar">Escolher outras datas</button>';
    else acao = linhas + '<div class="dispo-acao"><a class="btn btn-gold btn-quad" target="_blank" rel="noopener" href="' + (wa ? wa(dispoTextoWhats(im, per.ini, per.fim)) : '#') + '">Pedir reserva no WhatsApp</a><button type="button" class="dispo-link" data-act="dispo-limpar">Trocar as datas</button></div><p class="dispo-dica">Valores com base na diária anunciada; a AD7 confirma o total e o sinal no WhatsApp.</p>';
  } else if (sel) acao = '<p class="dispo-dica"><b>Entrada: ' + dispoFmtCurta(sel) + '.</b> Agora toque no dia da saída. <button type="button" class="dispo-link" data-act="dispo-limpar">Cancelar</button></p>';
  else acao = '<p class="dispo-dica">Toque no dia de entrada e depois no dia de saída: o site calcula as noites, o total e o sinal de reserva.</p>';
  return '<div class="cal-titulo"><h2>Datas disponíveis</h2>' + (prox ? '<span class="dispo-prox">Livre de ' + dispoFmtPeriodo(prox.ini, prox.fim) + '</span>' : '') + '</div>'
    + dispoCalendarioHtml({ ref, ctx: 'ver', meses: 2 }) + acao;
}

/* ---- cliques e campos (o app chama e diz como redesenhar e avisar) ---- */
async function dispoClique(el, o) {
  const act = el.dataset.act || ''; if (!act.startsWith('dispo-')) return false;
  const cx = el.closest('[data-dispo]'); if (!cx) return true;
  const ctx = cx.dataset.dispo, ref = cx.dataset.ref;
  if (act === 'dispo-mes') { DISPO.mes[ctx] = Math.max(0, Math.min(12, (DISPO.mes[ctx] || 0) + (+el.dataset.dir || 1))); o.aoMudar(ref); return true; }
  if (act === 'dispo-modo') { DISPO.modo = el.dataset.v; DISPO.sel = null; o.aoMudar(ref); return true; }
  if (act === 'dispo-limpar') { DISPO.sel = null; DISPO.periodo = null; DISPO.aviso = ''; o.aoMudar(ref); return true; }
  if (act === 'dispo-dia') {
    const iso = el.dataset.iso;
    if (!DISPO.sel || DISPO.sel.ref !== ref || DISPO.sel.ctx !== ctx) { DISPO.sel = { ref, ctx, iso }; DISPO.periodo = null; DISPO.aviso = ''; o.aoMudar(ref); return true; }
    const lista = dispoIntervalo(DISPO.sel.iso, iso), ini = lista[0], fim = lista[lista.length - 1];
    DISPO.sel = null;
    if (ctx === 'editar') {
      const estado = DISPO.modo === 'livre' ? '' : DISPO.modo;
      const r = await dispoGravar(ref, Object.assign({}, dispoDe(ref), { dias: dispoAplicar(dispoDias(ref), lista, estado) }));
      DISPO.aviso = (estado ? DISPO_ESTADOS[estado] : 'Livre') + ': ' + dispoFmtPeriodo(ini, fim) + (r.nuvem ? '. Já está no site.' : DISPO.nuvem ? '. Não gravou no banco (entre de novo e tente outra vez); ficou só neste aparelho.' : '. Gravado neste aparelho; na demonstração o site deste mesmo aparelho já mostra.');
      if (o.avisar) o.avisar(DISPO.aviso);
    } else {
      if (ini === fim) { DISPO.sel = { ref, ctx, iso }; o.aoMudar(ref); return true; }   /* entrada e saída no mesmo dia: continua esperando a saída */
      DISPO.periodo = { ref, ctx, ini, fim };
    }
    o.aoMudar(ref); return true;
  }
  return false;
}
async function dispoCampo(el, o) {
  if (el.dataset.act !== 'dispo-regra') return false;
  const cx = el.closest('[data-dispo]'); if (!cx) return true;
  const ref = cx.dataset.ref, campo = el.dataset.campo, v = Math.max(0, +el.value || 0);
  const reg = Object.assign({}, dispoDe(ref)); reg[campo] = campo === 'minNoites' ? Math.max(1, v) : Math.min(100, v);
  const r = await dispoGravar(ref, reg);
  DISPO.aviso = (campo === 'sinalPct' ? 'Sinal de reserva: ' + reg.sinalPct + '%' : 'Mínimo: ' + reg.minNoites + ' noites') + (r.nuvem ? '. Já vale no site.' : DISPO.nuvem ? '. Não gravou no banco.' : '. Gravado neste aparelho.');
  if (o.avisar) o.avisar(DISPO.aviso);
  return true;
}

if (typeof module !== 'undefined') module.exports = { DISPO, dispoIso, dispoData, dispoSoma, dispoIntervalo, dispoNoites, dispoFmtPeriodo, dispoCarregarTudo, dispoGravar, dispoAplicar, dispoConflito, dispoProximoLivre, dispoResumo, dispoOrcamento, dispoTextoWhats, dispoCalendarioHtml, dispoEditorHtml, dispoVisitanteHtml, dispoClique, dispoCampo, dispoRegras, dispoSemente };
