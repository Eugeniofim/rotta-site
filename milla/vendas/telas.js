/* =====================================================
   TELAS DO MILLA VENDAS (12/11/2026) — o que se vê; os cliques moram no app.js.
     #/inicio      o dia: quentes, próximos passos, os números de cada vendedor
     #/leads       as imobiliárias interessadas, com calor e etapa
     #/vendedores  os parceiros (só o Eugênio vê) · #/meulink para o vendedor
     #/comissoes   cada pagamento recebido e a divisão 25 / 37,5 / 37,5
   ===================================================== */
'use strict';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const fmtR = v => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: (Number(v) || 0) % 1 ? 2 : 0, maximumFractionDigits: 2 });
const fmtD = iso => iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
const fmtMes = m => { const [a, b] = String(m).split('-'); return ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(b) - 1] + '/' + a.slice(2); };
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const ICO = {
  inicio: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  leads: 'M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01',
  vendedores: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M15.5 4.1a3.5 3.5 0 0 1 0 6.8',
  meulink: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  comissoes: 'M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  sair: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
  mais: 'M12 5v14M5 12h14',
  whats: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-4.6A8 8 0 1 1 21 12z',
};
const SIMBOLO = (cls = '') => `<svg class="simbolo ${cls}" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 8H46.5V41.5H8V26A18 18 0 0 1 26 8Z"/><path d="M8 48.5H46.5V82H26L8 92Z"/><path d="M53.5 48.5H92V64A18 18 0 0 1 74 82H53.5Z"/><path class="luz" d="M53.5 8H74A18 18 0 0 1 92 26V41.5H53.5Z"/></svg>`;
const LOGO = `<span class="logo-milla">${SIMBOLO()}<b>Milla</b></span>`;
function av(nome) {
  const ini = String(nome || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('') || '?';
  return `<span class="av" aria-hidden="true">${esc(ini)}</span>`;
}
const calorTag = c => `<span class="temp t-${esc(c || 'morno')}">${esc((CALOR.find(x => x[0] === c) || CALOR[1])[1])}</span>`;
const etapaNome = e => (ETAPAS.find(x => x[0] === e) || ETAPAS[0])[1];
const linkDe = slug => (APP_CONFIG.site || '') + '?de=' + encodeURIComponent(slug);
const waDe = (num, txt) => 'https://wa.me/' + (soDig(num).length <= 11 ? '55' : '') + soDig(num) + (txt ? '?text=' + encodeURIComponent(txt) : '');
const atrasado = l => l.proximo && l.proximo < hojeIso() && ABERTA(l.etapa);
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 3200); }

/* ---------- menu ---------- */
const menu = () => [['inicio', 'Início'], ['leads', 'Leads'], EH_ADMIN() ? ['vendedores', 'Vendedores'] : ['meulink', 'Meu link'], ['comissoes', 'Comissões']];
function renderLado(tela) {
  const n = leadsVisiveis().filter(l => ABERTA(l.etapa) && (l.etapa === 'novo' || atrasado(l))).length;
  const quem = EH_ADMIN() ? 'Você vê tudo' : 'Vendedor: ' + nomeVendedor(meuVendedor());
  const verComo = !NUVEM() ? `<label class="ver-como"><span class="conta-rot">Demonstração · ver como</span>
      <select class="inp" data-act="ver-como" aria-label="Ver a demonstração como">
        <option value="" ${EH_ADMIN() ? 'selected' : ''}>Eugênio (tudo)</option>
        ${DB.vendedores.map(v => `<option value="${esc(v.id)}" ${meuVendedor() === v.id ? 'selected' : ''}>${esc(v.nome)} (vendedor)</option>`).join('')}
      </select></label>` : '';
  $('lado').innerHTML = `<a class="marca" href="#/inicio" aria-label="Milla Vendas, início">${LOGO}</a>
    <div class="conta"><span class="conta-rot">CRM de vendas</span><b>Milla Vendas</b><span class="sm">${esc(quem)}</span></div>
    ${verComo}
    <nav class="menu" aria-label="Menu">${menu().map(([id, l]) => `<a class="mi ${tela === id ? 'on' : ''}" href="#/${id}" ${tela === id ? 'aria-current="page"' : ''}>${svg(ICO[id])}<span>${l}</span>${id === 'leads' && n ? `<span class="n">${n}</span>` : ''}</a>`).join('')}</nav>
    <div class="rodape">Cada vendedor vê só os clientes que trouxe. A divisão de cada pagamento: 25% Ti Artes, 37,5% Eugênio, 37,5% o vendedor.</div>
    <div class="quem">${NUVEM() ? `<span class="sm">${esc(authEmail() || '')}</span><button type="button" class="btn btn-line btn-p" data-act="sair">${svg(ICO.sair)}Sair</button>`
      : `<span class="sm">Dados inventados, guardados só neste navegador.</span><button type="button" class="btn btn-line btn-p" data-act="demo-recomeca">Recomeçar a demonstração</button>`}</div>`;
  $('barra-cel').innerHTML = menu().map(([id, l]) => `<a href="#/${id}" class="${tela === id ? 'on' : ''}" ${tela === id ? 'aria-current="page"' : ''}>${svg(ICO[id])}${l}</a>`).join('');
}
function faixaCel() {
  return `<div class="demo-faixa"><a href="#/inicio" class="faixa-marca" aria-label="Milla Vendas, início">${SIMBOLO()}<span><b>Milla Vendas</b><small>${esc(EH_ADMIN() ? 'Você vê tudo' : nomeVendedor(meuVendedor()))}</small></span></a>
    ${NUVEM() ? '<button type="button" class="btn btn-line btn-p" data-act="sair">Sair</button>' : `<select class="inp ver-cel" data-act="ver-como" aria-label="Ver a demonstração como"><option value="">Eugênio</option>${DB.vendedores.map(v => `<option value="${esc(v.id)}" ${meuVendedor() === v.id ? 'selected' : ''}>${esc(v.nome)}</option>`).join('')}</select>`}</div>`;
}

/* ---------- INÍCIO ---------- */
function numerosDe(slug) {
  const ls = DB.leads.filter(l => (l.vendedor || '') === slug), ps = DB.pagamentos.filter(p => (p.vendedor || '') === slug);
  const parte = p => slug ? partes(p).vendedor : partes(p).eugenio;
  return { abertos: ls.filter(l => ABERTA(l.etapa)).length, quentes: ls.filter(l => ABERTA(l.etapa) && l.calor === 'quente').length,
    fechados: ls.filter(l => l.etapa === 'fechou').length,
    recebido: ps.filter(p => p.recebido).reduce((s, p) => s + p.valor, 0),
    aRepassar: ps.filter(p => p.recebido && !p.repassado).reduce((s, p) => s + parte(p), 0),
    repassado: ps.filter(p => p.repassado).reduce((s, p) => s + parte(p), 0),
    previsto: ps.filter(p => !p.recebido).reduce((s, p) => s + parte(p), 0) };
}
function vInicio() {
  const ls = leadsVisiveis(), ps = pagsVisiveis(), mes = mesDe(hojeIso());
  const abertos = ls.filter(l => ABERTA(l.etapa));
  const fechMes = ls.filter(l => l.etapa === 'fechou' && l.venda && mesDe(l.venda.inicio) === mes).length;
  const doMes = ps.filter(p => mesDe(p.vence) === mes);
  const valMes = EH_ADMIN() ? doMes.reduce((s, p) => s + p.valor, 0) : doMes.reduce((s, p) => s + partes(p).vendedor, 0);
  const passos = abertos.filter(l => l.proximo && l.proximo <= somaDias(hojeIso(), 2)).sort((a, b) => a.proximo.localeCompare(b.proximo));
  const semPasso = abertos.filter(l => l.calor === 'quente' && !l.proximo);
  const kpi = (rot, n, sub, href, cls = '') => `<a class="kpi ${cls}" href="${href}"><span class="kpi-rot">${rot}</span><b>${n}</b><span class="sm">${sub}</span></a>`;
  const linhaPasso = l => `<button type="button" class="passo" data-act="abrir" data-id="${esc(l.id)}">${av(l.imobiliaria)}<span class="pt"><b>${esc(l.imobiliaria)}</b><span class="sm">${esc(l.passo || 'Próximo passo')} · ${esc(nomeVendedor(l.vendedor))}</span></span>
      <span class="pd ${atrasado(l) ? 'atr' : ''}">${l.proximo ? (atrasado(l) ? 'atrasado · ' : (l.proximo === hojeIso() ? 'hoje · ' : '')) + fmtD(l.proximo) : 'sem data'}</span>${calorTag(l.calor)}</button>`;
  const tabelaVend = () => {
    const linhas = [...DB.vendedores.map(v => [v.id, v.nome]), ['', 'Direto (Eugênio)']].map(([id, nome]) => { const x = numerosDe(id);
      return `<tr><th scope="row">${esc(nome)}</th><td class="num">${x.abertos}</td><td class="num">${x.quentes}</td><td class="num">${x.fechados}</td><td class="num">${fmtR(x.recebido)}</td><td class="num">${id ? fmtR(x.aRepassar) : '—'}</td></tr>`; }).join('');
    return `<section class="bloco"><div class="bloco-cab"><h2>Por vendedor</h2><a class="sm" href="#/vendedores">Vendedores</a></div><div class="rolagem"><table class="tab">
      <thead><tr><th scope="col">Quem</th><th scope="col">Em aberto</th><th scope="col">Quentes</th><th scope="col">Fechados</th><th scope="col">Recebido</th><th scope="col">A repassar</th></tr></thead><tbody>${linhas}</tbody></table></div></section>`;
  };
  const meus = () => { const x = numerosDe(meuVendedor());
    return `<section class="bloco"><div class="bloco-cab"><h2>Os seus números</h2><a class="sm" href="#/comissoes">Comissões</a></div><div class="meus">
      <div><span class="kpi-rot">Já recebeu</span><b>${fmtR(x.repassado)}</b></div><div><span class="kpi-rot">A receber</span><b>${fmtR(x.aRepassar)}</b></div>
      <div><span class="kpi-rot">Previsto nas próximas parcelas</span><b>${fmtR(x.previsto)}</b></div></div></section>`; };
  return `${faixaCel()}<header class="topo"><div><span class="olho">${EH_ADMIN() ? 'Tudo em um lugar' : 'Os clientes que você trouxe'}</span><h1>${saudacao()}.</h1></div>
      <div class="acoes"><button type="button" class="btn btn-navy btn-p" data-act="novo">${svg(ICO.mais)}Novo lead</button></div></header>
    <div class="kpis">${kpi('Em aberto', abertos.length, 'imobiliárias no funil', '#/leads')}${kpi('Quentes', abertos.filter(l => l.calor === 'quente').length, 'para fechar logo', '#/leads/quente', 'quente')}
      ${kpi('Fechados no mês', fechMes, 'contratos novos', '#/leads/fechou')}${kpi(EH_ADMIN() ? 'Entra no mês' : 'Sua parte no mês', fmtR(valMes), EH_ADMIN() ? 'parcelas deste mês' : '37,5% das parcelas', '#/comissoes')}</div>
    <div class="ini-grade"><section class="bloco"><div class="bloco-cab"><h2>Próximos passos</h2><a class="sm" href="#/leads">Todos os leads</a></div>
      <div class="passos">${passos.map(linhaPasso).join('') || '<div class="sm vazio-p">Nada para hoje nem para os próximos 2 dias.</div>'}
      ${semPasso.length ? `<div class="sm aviso-p">${semPasso.length} lead${semPasso.length > 1 ? 's' : ''} quente${semPasso.length > 1 ? 's' : ''} sem próximo passo: ${semPasso.map(l => `<button type="button" class="lk" data-act="abrir" data-id="${esc(l.id)}">${esc(l.imobiliaria)}</button>`).join(', ')}</div>` : ''}</div></section>
      ${EH_ADMIN() ? tabelaVend() : meus()}</div>`;
}
function saudacao() { const h = new Date().getHours(); return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'; }

/* ---------- LEADS ---------- */
function vLeads(S) {
  const todos = leadsVisiveis();
  const q = S.busca.trim().toLowerCase();
  const passa = l => (S.etapa === 'abertos' ? ABERTA(l.etapa) : S.etapa === 'todos' || l.etapa === S.etapa)
    && (!S.calor || l.calor === S.calor) && (!S.vend || (S.vend === '-' ? !l.vendedor : l.vendedor === S.vend))
    && (!q || [l.imobiliaria, l.contato, l.cidade, l.nota, l.whats].join(' ').toLowerCase().includes(q));
  const ordem = { quente: 0, morno: 1, frio: 2 };
  const lista = todos.filter(passa).sort((a, b) => (ordem[a.calor] - ordem[b.calor]) || String(a.proximo || '9').localeCompare(String(b.proximo || '9')));
  const conta = e => todos.filter(l => l.etapa === e).length;
  const funil = ETAPAS.map(([e, n]) => `<button type="button" class="${S.etapa === e ? 'on' : ''} f-${e}" data-act="etapa" data-v="${e}"><b>${conta(e)}</b><span>${n}</span></button>`).join('');
  const chipsC = CALOR.map(([c, n]) => `<button type="button" class="chip chip-${c} ${S.calor === c ? 'on' : ''}" data-act="calor" data-v="${c}"><span class="bolinha" aria-hidden="true"></span>${n} <span class="n">${todos.filter(l => ABERTA(l.etapa) && l.calor === c).length}</span></button>`).join('');
  const linha = l => `<div class="vl">${av(l.imobiliaria)}
      <button type="button" class="vt" data-act="abrir" data-id="${esc(l.id)}"><b>${esc(l.imobiliaria)}</b><span class="sm">${esc([l.contato, l.cidade].filter(Boolean).join(' · '))}</span>
        ${l.nota ? `<span class="resumo">${esc(l.nota)}</span>` : ''}
        <span class="sm vtags">${EH_ADMIN() ? `<span class="tag ${l.vendedor ? 'tag-gold' : 'tag-neu'}">${esc(nomeVendedor(l.vendedor))}</span>` : ''}<span class="tag tag-neu">${esc(ORIGENS[l.origem] || 'Cadastro manual')}</span>
        ${l.proximo && ABERTA(l.etapa) ? `<span class="${atrasado(l) ? 'atr' : ''}">${atrasado(l) ? 'Atrasado: ' : 'Próximo: '}${esc(l.passo || 'passo')} · ${fmtD(l.proximo)}</span>` : ''}</span></button>
      <span class="vr"><select class="inp temp-sel t-${esc(l.calor)}" data-act="mudar-calor" data-id="${esc(l.id)}" aria-label="Calor de ${esc(l.imobiliaria)}">${CALOR.map(([v, n]) => `<option value="${v}" ${l.calor === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <select class="inp" data-act="mudar-etapa" data-id="${esc(l.id)}" aria-label="Etapa de ${esc(l.imobiliaria)}">${ETAPAS.map(([v, n]) => `<option value="${v}" ${l.etapa === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
        ${l.whats ? `<a class="btn btn-line btn-p" href="${esc(waDe(l.whats, 'Oi, ' + (l.contato || '') + '! Aqui é da Milla.'))}" target="_blank" rel="noopener" data-act="wa">${svg(ICO.whats)}WhatsApp</a>` : ''}</span></div>`;
  return `${faixaCel()}<header class="topo"><div><h1>Leads <small>· ${EH_ADMIN() ? 'todas as imobiliárias' : 'as que você trouxe'}</small></h1></div>
      <div class="acoes"><button type="button" class="btn btn-navy btn-p" data-act="novo">${svg(ICO.mais)}Novo lead</button></div></header>
    <div class="funil" role="group" aria-label="Etapas">${funil}</div>
    <div class="filtros"><div class="chips"><button type="button" class="chip ${S.etapa === 'abertos' ? 'on' : ''}" data-act="etapa" data-v="abertos">Em aberto <span class="n">${todos.filter(l => ABERTA(l.etapa)).length}</span></button>
      <button type="button" class="chip ${S.etapa === 'todos' ? 'on' : ''}" data-act="etapa" data-v="todos">Todos <span class="n">${todos.length}</span></button>${chipsC}</div>
      <div class="filtros-dir">${EH_ADMIN() ? `<select class="inp" data-act="vend" aria-label="Filtrar por vendedor"><option value="">Todos os vendedores</option>${DB.vendedores.map(v => `<option value="${esc(v.id)}" ${S.vend === v.id ? 'selected' : ''}>${esc(v.nome)}</option>`).join('')}<option value="-" ${S.vend === '-' ? 'selected' : ''}>Direto (Eugênio)</option></select>` : ''}
      <input class="inp" type="search" id="busca" placeholder="Buscar imobiliária, contato, cidade" value="${esc(S.busca)}" aria-label="Buscar"></div></div>
    ${DB.erro ? `<div class="wz-aviso sm">${esc(DB.erro)}</div>` : ''}
    <div class="lead-lista">${lista.map(linha).join('') || `<div class="box sm">${todos.length ? 'Nenhum lead neste filtro.' : 'Nenhum lead ainda. Quando alguém preencher o formulário do site pelo seu link, aparece aqui.'}</div>`}</div>`;
}
