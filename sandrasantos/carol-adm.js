/* =====================================================
   PAINEL DA SANDRA — as abas extras do ADM (Sikania Tour, 17/10/2026)

   O painel prometido no kit de boas-vindas: Hoje · Tarefas · Agenda ·
   Meus passeios · Pontos turísticos · Reservas · Orçamentos · Voucher ·
   Roteiros · Financeiro · Extrato · Clientes · Avaliações · Relatórios ·
   Ajustes, + o Atendimento e o assistente (que alcança todas).
   Saíram da base (demo de Londres): Agências, E-mails, Transfer (o pedido
   de transfer agora cai em Orçamentos), Cupons e brindes, Aparência e
   Marketing.

   - HOJE: lembretes de véspera, pedidos esperando orçamento, roteiros,
     avaliações novas, tarefas.
   - ROTEIROS: o dia a dia de uma viagem sob medida → link privado.
   - FINANCEIRO: recebido, a receber, prazos.
   - PONTOS: o banco de pontos dela (nasce vazio), importa KML.
   - AVALIAÇÕES: o QR do fim do passeio + aprovar o que vai para o app.
   - TAREFAS e RECADOS.
   Orçamentos e Voucher moram em orcamentos.js e voucher-padrao.js.
   ===================================================== */
'use strict';

/* ---------- abas ---------- */
Object.assign(STR, {
  admTarefas: { pt: 'Tarefas', en: 'Tasks' }, admRoteiros: { pt: 'Roteiros', en: 'Itineraries' },
  admFinanceiro: { pt: 'Financeiro', en: 'Finance' },
  admPontos: { pt: 'Pontos turísticos', en: 'Places' }, admAvaliacoes: { pt: 'Avaliações', en: 'Reviews' },
});
/* abas da base que NÃO estão no pacote dela (o roteador também não abre) */
const ABAS_FORA = ['coupons', 'look', 'marketing', 'agencias', 'emails', 'transfer'];
(function abas() {
  const poe = (id, k, depoisDe) => {
    if (ADM_TABS.some(([x]) => x === id)) return;
    const i = ADM_TABS.findIndex(([x]) => x === depoisDe);
    ADM_TABS.splice(i < 0 ? ADM_TABS.length : i + 1, 0, [id, k]);
  };
  for (const id of ABAS_FORA) { const i = ADM_TABS.findIndex(([x]) => x === id); if (i >= 0) ADM_TABS.splice(i, 1); }
  poe('tarefas', 'admTarefas', 'today');
  poe('roteiros', 'admRoteiros', 'bookings');
  poe('financeiro', 'admFinanceiro', 'roteiros');
  poe('pontos', 'admPontos', 'tours');
  poe('avaliacoes', 'admAvaliacoes', 'clients');
})();
const _viewAdmCarol = viewAdm;
viewAdm = function (tab, arg) {
  if (ABAS_FORA.includes(tab)) return viewAdm('today');
  const m = { tarefas: admTarefas, roteiros: admRoteiros, financeiro: admFinanceiro, pontos: admPontos, avaliacoes: admAvaliacoes };
  if (m[tab]) return m[tab](arg);
  return _viewAdmCarol(tab, arg);
};
/* página avulsa do painel: o QR da avaliação em tela cheia */
const _rotaExtraCarol = rotaExtra;
rotaExtra = function (p) {
  if (p[0] === 'qr-avaliacao') { viewQrAvaliacao(); return true; }
  return _rotaExtraCarol(p);
};

const dtBR = (iso) => iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '';
/* grava = save(): no aparelho, no catálogo público (só a dona empurra) e linha a linha no privado (nuvem-itens.js) */
const grava = () => { save(); };
const primeiroNome = (n) => String(n || '').trim().split(' ')[0];
const linkApp = (h) => location.origin + location.pathname + '#/' + h;

/* conflito de agenda: o dia já tem cliente? (um grupo por dia) */
function conflitoDoDia(data) {
  if (!data) return '';
  const b = DB.bookings.find(z => z.date === data && z.status === 'confirmed' && !(Tours.get(z.tourId) || {}).naoOcupaDia);
  if (b) return `${dtBR(data)} já tem ${primeiroNome(b.name)}`;
  return '';
}
function msgLembrete(b) {
  const x = Tours.get(b.tourId) || { name: { pt: 'tour' }, meeting: '' };
  const falta = Bookings.due(b);
  const encontro = x.encontroAberto ? (b.hotel ? 'no combinado (' + b.hotel + ')' : 'no ponto que combinamos') : noIdioma(x.meeting);
  return `Olá, ${primeiroNome(b.name)}! Aqui é a ${guiaNome()}, da ${guiaNegocio()} 😊\n\nAmanhã é o nosso ${tl(x.name)}!\n🕘 ${janelaDoTour({ time: b.time, horas: b.horas })}\n📍 ${encontro}\n`
    + (falta > 0 ? `💶 Restante a pagar: ${eur(falta)}\n` : '')
    + `\nSe for atrasar, me avise com antecedência.\n\nSeu voucher: ${typeof voucherLinkPublico === 'function' ? voucherLinkPublico(b.code) : linkApp('voucher/' + b.code)}\n\nAté amanhã! Menos estradas, mais histórias ❤️`;
}

/* =====================================================
   HOJE — o que precisa dela agora
   ===================================================== */
const _admTodayBase = admToday;
admToday = function () {
  _admTodayBase();
  const stage = $('#stage'); if (!stage) return;
  const hoje = isoToday(), amanha = addDays(hoje, 1);
  const lembretes = DB.bookings.filter(b => b.status === 'confirmed' && b.date === amanha);
  const roteiros = (DB.roteiros || []).filter(r => r.status !== 'publicado');
  const pedidos = (DB.pedidos || []).filter(p => !p.respondido);
  const aval = (DB.avaliacoes || []).filter(a => !a.publicar && !a.vista);
  const tarefas = (DB.tarefas || []).filter(t2 => !t2.feita && t2.data && t2.data <= hoje);
  const proximas = DB.bookings.filter(b => b.status === 'confirmed' && b.date > amanha && b.date <= addDays(hoje, 14)).sort((a, b) => a.date.localeCompare(b.date));
  const item = (ic, tit, sub, acao, cls = '') => `<div class="hjItem ${cls}"><span class="hjIc">${ic}</span><div><b>${tit}</b>${sub ? `<small>${sub}</small>` : ''}</div>${acao || ''}</div>`;
  const blocos = [];
  if (pedidos.length) blocos.push(`<section class="card hj"><h3>💬 Pedidos esperando orçamento <span class="pill warn">${pedidos.length}</span></h3>
    ${pedidos.map(p => item(typeof pedidoIcone === 'function' ? pedidoIcone(p) : '✉️', esc(p.nome) + ' · ' + esc(typeof pedidoRotulo === 'function' ? pedidoRotulo(p) : p.tipo), esc(p.resumo || ''), `<button class="mini" data-ir="/adm/orcamentos">Responder</button>`)).join('')}</section>`);
  blocos.push(`<section class="card hj"><h3>🔔 Amanhã — lembretes de véspera</h3>
    ${lembretes.length ? '' : '<p class="empty">Nenhum passeio amanhã.</p>'}
    ${lembretes.map(b => { const x = Tours.get(b.tourId) || { name: { pt: '' } }; return item('🗓', esc(b.name) + ' · ' + esc(tl(x.name)), janelaDoTour({ time: b.time, horas: b.horas }) + ' · ' + b.pax + ' pessoas',
      `<a class="mini" target="_blank" rel="noopener" href="${esc(waLink(msgLembrete(b), String(b.whats).replace(/\D/g, '')))}">Mandar lembrete</a>${typeof fichaDe === 'function' ? `<a class="mini" href="#/adm/clients/${encodeURIComponent(fichaDe(b))}">Ficha</a>` : ''}`); }).join('')}
    ${proximas.length ? `<p class="rotMini">Próximos passeios</p>${proximas.slice(0, 4).map(b => { const x = Tours.get(b.tourId) || { name: { pt: '' } }; return item('📅', dtBR(b.date) + ' · ' + esc(primeiroNome(b.name)), esc(tl(x.name)) + ' · ' + janelaDoTour({ time: b.time, horas: b.horas }),
      `<a class="mini" target="_blank" rel="noopener" href="${esc(waLink(msgLembrete(b), String(b.whats).replace(/\D/g, '')))}">Lembrete</a>`); }).join('')}` : ''}
    <p class="why">A mensagem já vem pronta: horário, ponto de encontro, saldo a pagar e o link do voucher. É só tocar e mandar.</p></section>`);
  if (roteiros.length) blocos.push(`<section class="card hj"><h3>🗺️ Roteiros em rascunho</h3>
    ${roteiros.map(r => item('🗺️', esc(r.nome) + ' · ' + diasEntre(r.ini, r.fim) + ' dias', 'ainda não publicado para o cliente', `<button class="mini" data-ir="/adm/roteiros/${r.id}">Abrir</button>`)).join('')}</section>`);
  if (aval.length) blocos.push(`<section class="card hj"><h3>⭐ Avaliações novas</h3>
    ${aval.map(a => item('★'.repeat(a.estrelas), esc(a.nome), esc(a.texto.slice(0, 90)) + (a.texto.length > 90 ? '…' : ''), `<button class="mini" data-ir="/adm/avaliacoes">Aprovar</button>`)).join('')}</section>`);
  if (tarefas.length) blocos.push(`<section class="card hj"><h3>✅ Tarefas de hoje</h3>
    ${tarefas.map(t2 => item(t2.prioridade === 'alta' ? '🔴' : '🟡', esc(t2.texto), esc(t2.nota || ''), `<button class="mini" data-feita="${t2.id}">Feito</button>`)).join('')}</section>`);
  const h1 = stage.querySelector('.pageh');
  const html = `<div class="hjGrade">${blocos.join('')}</div>`;
  if (h1) h1.insertAdjacentHTML('afterend', html); else stage.insertAdjacentHTML('afterbegin', html);
  $$('[data-ir]', stage).forEach(b => b.onclick = () => go(b.dataset.ir));
  $$('[data-feita]', stage).forEach(b => b.onclick = () => { const t2 = DB.tarefas.find(z => z.id === b.dataset.feita); if (t2) { t2.feita = true; t2.feitaEm = new Date().toISOString(); grava(); } admToday(); });
};

/* =====================================================
   ROTEIROS ("Monte seu roteiro" e passeios ocultos)
   ===================================================== */
function admRoteiros(id) {
  if (id) return editaRoteiro(id);
  const rs = [...(DB.roteiros || [])].sort((a, b) => (b.criado || '').localeCompare(a.criado || ''));
  const ST = { rascunho: ['warn', 'Rascunho — ainda não publicado'], publicado: ['ok', 'Publicado para o cliente'] };
  admShell('roteiros', `
    <div class="pagehead"><h1 class="pageh">Roteiros</h1><div class="chips"><button class="cta sm" id="rtNovo">+ Novo roteiro</button></div></div>
    <p class="why">O dia a dia de uma viagem sob medida, com os seus pontos turísticos. Monte, reordene, escreva as suas notas e publique: o cliente recebe um <b>link privado</b> com o roteiro dele. Um orçamento aceito também cria o roteiro (aba Orçamentos).</p>
    ${rs.length ? rs.map(r => { const [cls, txt] = ST[r.status] || ST.rascunho; return `<section class="card rtAdm">
      <div class="agTopo"><div><h3>${esc(r.nome)}</h3><small>${dtBR(r.ini)} a ${dtBR(r.fim)} · ${diasEntre(r.ini, r.fim)} dias · ${(+r.adultos || 0) + (+r.criancas || 0)} pessoas</small></div>
        <span class="pill ${cls}">${txt}</span></div>
      ${r.obs ? `<p class="agPg">${esc(r.obs)}</p>` : ''}
      <div class="tacts"><button class="cta sm" data-rt="${r.id}">${r.status === 'publicado' ? 'Editar' : 'Montar os dias'}</button><a class="mini" href="#/r/${esc(r.codigo)}">Ver como o cliente vê</a></div>
    </section>`; }).join('') : '<p class="empty">Nenhum roteiro ainda. Toque em “+ Novo roteiro” ou crie a partir de um orçamento aceito.</p>'}`);
  $$('[data-rt]').forEach(b => b.onclick = () => go('/adm/roteiros/' + b.dataset.rt));
  $('#rtNovo').onclick = () => {
    const nome = prompt('Nome do cliente:'); if (!nome || !nome.trim()) return;
    const r = novoRoteiro({ nome: nome.trim() });
    go('/adm/roteiros/' + r.id);
  };
}
/* um roteiro novo (do botão ou de um orçamento aceito); os dias nascem vazios */
function novoRoteiro(c) {
  const ini = c.ini || addDays(isoToday(), 30), fim = c.fim && c.fim >= ini ? c.fim : addDays(ini, 3);
  /* o código abre o roteiro sem login (função roteiro_publico): 8 letras ao acaso, não dá para adivinhar */
  const sorte = Array.from({ length: 8 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('');
  const slug = (String(c.nome || 'cliente').trim().split(' ')[0] + '-' + sorte).toLowerCase().normalize('NFD').replace(/[^a-z0-9-]/g, '');
  const r = { id: uid(), codigo: slug, nome: c.nome || 'Cliente', whats: c.whats || '', email: c.email || '', criado: new Date().toISOString(),
    ini, fim, adultos: c.adultos || 2, criancas: c.criancas || 0, idades: c.idades || '', hotel: c.hotel || '', nivel: 'mapa',
    querem: [], interesses: c.interesses || [], ritmo: c.ritmo || 'medio', obs: c.obs || '', orcamentoId: c.orcamentoId || '', status: 'rascunho', pago: null };
  r.dias = []; for (let d = ini; d <= fim; d = addDays(d, 1)) r.dias.push({ data: d, chegada: d === ini, volta: d === fim, periodos: [{ p: 'manha', titulo: '', itens: [] }, { p: 'tarde', titulo: '', itens: [] }] });
  DB.roteiros = DB.roteiros || []; DB.roteiros.push(r); grava();
  return r;
}
function editaRoteiro(id) {
  const r = (DB.roteiros || []).find(z => z.id === id);
  if (!r) return admRoteiros();
  if (!r.dias || !r.dias.length) { const n = novoRoteiro({ ...r }); r.dias = n.dias; DB.roteiros = DB.roteiros.filter(z => z.id !== n.id); grava(); }
  const opcoes = Object.entries(AREAS).map(([a, nome]) => `<optgroup label="${esc(nome)}">${todosPontos().filter(p => p.area === a).map(p => `<option value="${p.id}">${esc(p.n)}</option>`).join('')}</optgroup>`).join('');
  admShell('roteiros', `
    <div class="pagehead"><h1 class="pageh">Roteiro · ${esc(r.nome)}</h1><button class="mini" id="rtVolta">← Todos</button></div>
    <p class="why">${dtBR(r.ini)} a ${dtBR(r.fim)} · hotel: ${esc(r.hotel || '—')} · ritmo ${esc(r.ritmo)} · interesses: ${esc((r.interesses || []).join(', ') || '—')}${r.obs ? ' · “' + esc(r.obs) + '”' : ''}</p>
    ${r.dias.map((d, di) => `<section class="card rtDiaAdm"><h3>Dia ${di + 1} · ${fmtDiaCurto(d.data)}${d.chegada ? ' · chegada' : d.volta ? ' · volta' : ''}</h3>
      ${d.periodos.map((pe, pi) => `<div class="rtPeAdm">
        <label class="fld">${PERIODO_ROT[pe.p]}<input data-tit="${di}.${pi}" value="${esc(pe.titulo)}"></label>
        <ol>${pe.itens.map((pid, ii) => { const p = ponto(pid) || { n: pid }; return `<li><span>${esc(p.n)}</span>
          <button class="mini" data-mv="${di}.${pi}.${ii}.-1" aria-label="subir">↑</button><button class="mini" data-mv="${di}.${pi}.${ii}.1" aria-label="descer">↓</button><button class="mini ghost" data-rm="${di}.${pi}.${ii}" aria-label="tirar">✕</button></li>`; }).join('')}</ol>
        <div class="rtAdd"><select data-addsel="${di}.${pi}"><option value="">+ pôr um ponto…</option>${opcoes}</select></div>
        <label class="fld">Nota sua para este período<input data-nota="${di}.${pi}" value="${esc(pe.nota || '')}" placeholder="ex.: almoço na trattoria às 13h"></label>
      </div>`).join('')}
    </section>`).join('')}
    <div class="rtAcoesAdm">
      <button class="cta" id="rtPublica">${r.status === 'publicado' ? 'Salvar e manter publicado' : 'Validar e publicar para o cliente'}</button>
      <a class="mini" href="#/r/${esc(r.codigo)}">Ver como o cliente vê</a>
    </div>
    ${r.status === 'publicado' ? `<p class="why">Publicado. <a target="_blank" rel="noopener" href="${esc(waLink('Olá, ' + primeiroNome(r.nome) + '! Seu roteiro está pronto 🎉 ' + linkApp('r/' + r.codigo), String(r.whats).replace(/\D/g, '')))}">Mandar o link no WhatsApp</a></p>` : ''}`);
  const campo = (s) => s.split('.').map(Number);
  $('#rtVolta').onclick = () => go('/adm/roteiros');
  $$('[data-tit]').forEach(i => i.onchange = () => { const [di, pi] = campo(i.dataset.tit); r.dias[di].periodos[pi].titulo = i.value; grava(); });
  $$('[data-nota]').forEach(i => i.onchange = () => { const [di, pi] = campo(i.dataset.nota); r.dias[di].periodos[pi].nota = i.value; grava(); });
  $$('[data-rm]').forEach(b => b.onclick = () => { const [di, pi, ii] = campo(b.dataset.rm); r.dias[di].periodos[pi].itens.splice(ii, 1); grava(); editaRoteiro(id); });
  $$('[data-mv]').forEach(b => b.onclick = () => { const [di, pi, ii, dd] = campo(b.dataset.mv); const it = r.dias[di].periodos[pi].itens, j = ii + dd; if (j < 0 || j >= it.length) return; [it[ii], it[j]] = [it[j], it[ii]]; grava(); editaRoteiro(id); });
  $$('[data-addsel]').forEach(s => s.onchange = () => { if (!s.value) return; const [di, pi] = campo(s.dataset.addsel); r.dias[di].periodos[pi].itens.push(s.value); grava(); editaRoteiro(id); });
  $('#rtPublica').onclick = () => {
    /* o cliente não lê os pontos dela: o roteiro publicado leva o texto de cada ponto junto */
    r.pontosPub = {};
    for (const d of r.dias) for (const pe of d.periodos) for (const pid of pe.itens) { const p = ponto(pid); if (p) r.pontosPub[pid] = { n: p.n, d: p.d || '', dica: p.dica || '', ph: p.ph || '' }; }
    r.status = 'publicado'; r.publicadoEm = new Date().toISOString(); grava(); toast('Publicado ✓ — mande o link para ' + primeiroNome(r.nome)); editaRoteiro(id); };
}

/* =====================================================
   FINANCEIRO — "a minha vida financeira é uma bagunça" (1:09:41)
   ===================================================== */
function admFinanceiro() {
  const hoje = isoToday(), mes = hoje.slice(0, 7), em30 = addDays(hoje, 30);
  let recMes = 0, recCartao = 0, recPix = 0, recWise = 0;
  for (const b of DB.bookings) for (const p of b.payments) if ((p.date || '').slice(0, 7) === mes && p.date <= hoje) { recMes += p.amount; if (p.method === 'pix') recPix += p.amount; else if (p.method === 'wise') recWise += p.amount; else recCartao += p.amount; }
  const saldos = DB.bookings.filter(b => b.status === 'confirmed' && b.date >= hoje && Bookings.due(b) > 0);
  const aReceberCli = saldos.reduce((s, b) => s + Bookings.due(b), 0);
  const orcs = (DB.orcamentos || []).filter(o => o.status === 'enviado');
  const emAberto = orcs.reduce((s2, o) => s2 + (typeof Orc !== 'undefined' ? Orc.totais(o).total : 0), 0);
  const prazos = [
    ...saldos.filter(b => b.date <= em30).map(b => ({ d: b.date, cls: 'n', txt: `${primeiroNome(b.name)} paga ${eur(Bookings.due(b))} (saldo da reserva)` })),
  ].sort((a, b) => (a.d || '').localeCompare(b.d || ''));
  const ano = +hoje.slice(0, 4), porMes = Reports.byMonth(ano);
  const max = Math.max(1, ...porMes);
  admShell('financeiro', `
    <div class="pagehead"><h1 class="pageh">Financeiro</h1><div class="chips"><button class="mini" data-ir="/adm/money">Extrato para o contador →</button></div></div>
    <div class="kpis">
      <div class="kpi"><small>Recebido em ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}</small><b>${eur(recMes)}</b><i>cartão ${eur(recCartao)} · Pix ${eur(recPix)}${recWise ? ' · Wise ' + eur(recWise) : ''}</i></div>
      <div class="kpi"><small>A receber de clientes</small><b>${eur(aReceberCli)}</b><i>${saldos.length} reservas com saldo</i></div>
      <div class="kpi"><small>Orçamentos enviados, esperando resposta</small><b>${eur(emAberto)}</b><i>${orcs.length} ${orcs.length === 1 ? 'orçamento' : 'orçamentos'}</i></div>
    </div>
    <section class="card"><h3>⏰ Prazos críticos</h3>
      ${prazos.length ? prazos.map(p => `<div class="przRow ${p.cls}"><span class="mono">${dtBR(p.d)}</span><span>${esc(p.txt)}</span></div>`).join('') : '<p class="empty">Nada vencendo.</p>'}</section>
    <section class="card"><h3>Entradas por mês · ${ano}</h3>
      <div class="barras">${porMes.map((v, i) => `<div class="barra"><i style="height:${Math.round(v / max * 100)}%"></i><small>${['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</small>${v ? `<b>${Math.round(v)}</b>` : ''}</div>`).join('')}</div>
      <p class="why">O que entrou por Pix, Wise, cartão ou dinheiro, mês a mês. O extrato separa as formas de pagamento e gera o CSV do contador.</p></section>`);
  $$('[data-ir]').forEach(b => b.onclick = () => go(b.dataset.ir));
}

/* =====================================================
   PONTOS TURÍSTICOS — o banco (reunião 25:57)
   ===================================================== */
function todosPontos() { const meus = DB.pontos || []; return PONTOS.map(p => meus.find(m => m.id === p.id) || p).concat(meus.filter(m => !PONTOS.some(p => p.id === m.id))); }
function admPontos(id) {
  if (id) return editaPonto(id);
  const area = admPontos._a || 'todos';
  const todos = todosPontos();
  const lista = todos.filter(p => area === 'todos' || p.area === area);
  const nCarol = todos.filter(p => p.fonte === 'carol' || p.fonte === 'demo').length;
  admShell('pontos', `
    <div class="pagehead"><h1 class="pageh">Pontos turísticos</h1><div class="chips"><button class="cta sm" id="ptNovo">+ Novo ponto</button><label class="mini kmlBtn">Importar do My Maps (KML)<input type="file" id="kmlIn" accept=".kml,.xml" hidden></label></div></div>
    <p class="why">Os lugares que você mostra (Spaccanapoli, Ravello, a Ilha de Tavira…), com o seu texto e a sua dica. Eles montam os dias dos seus roteiros. ${todos.length ? `${todos.length} pontos, <b>${nCarol} com texto</b>.` : 'Comece com “+ Novo ponto” ou importe o seu mapa do Google My Maps.'}</p>
    <div class="chips">${['todos', ...Object.keys(AREAS)].map(a => `<button class="chip ${a === area ? 'on' : ''}" data-area="${a}">${a === 'todos' ? 'Todos' : esc(AREAS[a])}</button>`).join('')}</div>
    <div class="ptGrade">${lista.map(p => `<button class="ptCard" data-pt="${p.id}"><span class="ptFoto" style="background-image:url(${esc(p.ph)})"></span>
      <span class="ptTx"><b>${esc(p.n)}</b><small>${p.d ? '✎ com o seu texto' : '… falta o texto'} · ${esc(AREAS[p.area] || '')}</small></span></button>`).join('')}</div>`);
  $$('[data-area]').forEach(b => b.onclick = () => { admPontos._a = b.dataset.area; admPontos(); });
  $('#ptNovo').onclick = () => {
    const nome = prompt('Nome do ponto (ex.: Spaccanapoli):'); if (!nome || !nome.trim()) return;
    const id = 'pt-' + nome.trim().toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + uid().slice(0, 3);
    DB.pontos.push({ id, n: nome.trim(), area: area !== 'todos' ? area : 'outros', lat: null, lng: null, d: '', dica: '', ph: '', cr: '', fonte: 'carol' });
    grava(); go('/adm/pontos/' + id);
  };
  $$('[data-pt]').forEach(b => b.onclick = () => go('/adm/pontos/' + b.dataset.pt));
  $('#kmlIn').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const doc = new DOMParser().parseFromString(await f.text(), 'text/xml');
    let n = 0;
    doc.querySelectorAll('Placemark').forEach(pm => {
      const c = pm.querySelector('Point coordinates'); if (!c) return;
      const [lng, lat] = c.textContent.trim().split(',').map(Number);
      const nome = (pm.querySelector('name') || {}).textContent || 'Ponto';
      const desc = ((pm.querySelector('description') || {}).textContent || '').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').trim();
      const id = 'kml-' + nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      if (todosPontos().some(p => p.id === id)) return;
      DB.pontos.push({ id, n: nome.split(' - ')[0].trim(), area: area !== 'todos' ? area : 'outros', lat, lng, d: desc, dica: '', ph: '', cr: '', fonte: 'carol' }); n++;
    });
    grava(); toast(n + ' pontos importados do seu mapa'); admPontos();
  };
}
function editaPonto(id) {
  const p = todosPontos().find(z => z.id === id); if (!p) return admPontos();
  admShell('pontos', `
    <div class="pagehead"><h1 class="pageh">${esc(p.n)}</h1><button class="mini" id="ptVolta">← Todos</button></div>
    <div class="ptEd"><span class="ptFotoG" style="background-image:url(${esc(p.ph)})">${p.cr ? `<small class="sccr">${esc(p.cr)}</small>` : ''}</span>
    <section class="card">
      <label class="fld">Nome<input id="ptN" value="${esc(p.n)}"></label>
      <label class="fld">Região<select id="ptArea">${Object.entries(AREAS).map(([a, n]) => `<option value="${a}" ${p.area === a ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      <label class="fld">O que você conta aqui <small class="why">é o texto do roteiro e o que a sua voz vai ler no audioguia</small><textarea id="ptD" rows="9">${esc(p.d || '')}</textarea></label>
      <label class="fld">Dica curta<input id="ptDica" value="${esc(p.dica || '')}" placeholder="ex.: chegue antes das 10h, depois lota"></label>
      <div class="tacts"><button class="cta sm" id="ptSalva">Salvar</button><button class="mini ghost" id="ptApaga">Apagar</button></div>
    </section></div>`);
  $('#ptVolta').onclick = () => go('/adm/pontos');
  $('#ptApaga').onclick = () => { if (!confirm('Apagar o ponto ' + p.n + '?')) return; DB.pontos = (DB.pontos || []).filter(z => z.id !== id); grava(); go('/adm/pontos'); };
  $('#ptSalva').onclick = () => {
    const novo = { ...p, n: $('#ptN').value.trim(), area: $('#ptArea').value, d: $('#ptD').value.trim(), dica: $('#ptDica').value.trim(), fonte: $('#ptD').value.trim() ? 'carol' : p.fonte };
    DB.pontos = (DB.pontos || []).filter(z => z.id !== id).concat([novo]); grava(); toast('Salvo ✓'); editaPonto(id);
  };
}

/* =====================================================
   AVALIAÇÕES + o QR do fim do tour (reunião 14:20)
   ===================================================== */
function admAvaliacoes() {
  const as = [...(DB.avaliacoes || [])].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  as.forEach(a => { a.vista = true; }); grava();
  const link = linkApp('avaliar');
  admShell('avaliacoes', `
    <h1 class="pageh">Avaliações</h1>
    <section class="card qrCard"><div class="qrBox">${typeof qrSvg === 'function' ? qrSvg(link, { tamanho: 180, alt: 'QR para avaliar o tour' }) : ''}</div>
      <div><h3>O QR do fim do tour</h3><p class="why">No fim do tour, mostre este QR no seu celular: a pessoa aponta a câmera, dá as estrelas e escreve — sem baixar nada. Depois o app convida a avaliar também no Google (hoje você tem 0 avaliações públicas).</p>
        <div class="tacts"><button class="cta sm" id="qrCheio">Mostrar em tela cheia</button><button class="mini" id="qrImp">Imprimir cartão</button></div>
        <label class="fld">Seu link de avaliação no Google<input id="revG" value="${esc(DB.settings.reviewGoogle || '')}"></label></div></section>
    ${as.map(a => { const x = Tours.get(a.tourId); return `<section class="card avAdm"><div class="agTopo"><div><b>${'★'.repeat(a.estrelas)}${'☆'.repeat(5 - a.estrelas)} · ${esc(a.nome)}</b>${a.exemplo ? ' <em class="exTag">exemplo</em>' : ''}<small>${dtBR(a.data)}${x ? ' · ' + esc(tl(x.name)) : ''}${a.autorizou === false ? ' · não autorizou publicar' : ''}</small></div>
      <label class="avPub"><input type="checkbox" data-pub="${a.id}" ${a.publicar ? 'checked' : ''} ${a.autorizou === false ? 'disabled' : ''}> Mostrar no app</label></div><p>${esc(a.texto)}</p></section>`; }).join('')}`);
  $('#qrCheio').onclick = () => go('/qr-avaliacao');
  $('#qrImp').onclick = () => { go('/qr-avaliacao'); setTimeout(() => window.print(), 400); };
  $('#revG').onchange = (e) => { DB.settings.reviewGoogle = e.target.value.trim(); save(); toast('Salvo ✓'); };
  $$('[data-pub]').forEach(c => c.onchange = () => { const a = DB.avaliacoes.find(z => z.id === c.dataset.pub); a.publicar = c.checked; grava(); toast(c.checked ? 'Aparece no app ✓' : 'Escondida'); });
}
function viewQrAvaliacao() {
  const link = linkApp('avaliar');
  app.innerHTML = `<main class="qrTela rtFolha"><img src="arte/logo-escuro.png" alt="${esc(guiaNegocio())}">
    <p class="lema">Obrigada por viajar comigo!</p>
    <div class="qrGrande">${qrSvg(link, { tamanho: 280, alt: 'QR para avaliar' })}</div>
    <p class="qrTx">Aponte a câmera e conte como foi ⭐⭐⭐⭐⭐</p>
    <button class="mini noprint" id="qrSai">Fechar</button></main>`;
  $('#qrSai').onclick = () => go('/adm/avaliacoes');
}

/* =====================================================
   TAREFAS e RECADOS
   ===================================================== */
function admTarefas() {
  const aba = admTarefas._a || 'hoje', area = admTarefas._ar || 'todas';
  const hoje = isoToday(), fimSemana = addDays(hoje, 7);
  let ts = (DB.tarefas || []).filter(t2 => area === 'todas' || t2.area === area);
  const atrasada = t2 => !t2.feita && t2.data && t2.data < hoje;
  if (aba === 'hoje') ts = ts.filter(t2 => !t2.feita && (!t2.data || t2.data <= hoje));
  else if (aba === 'semana') ts = ts.filter(t2 => !t2.feita && (!t2.data || t2.data <= fimSemana));
  else if (aba === 'feitas') ts = ts.filter(t2 => t2.feita);
  ts.sort((a, b) => (a.data || '9').localeCompare(b.data || '9') || (a.prioridade === 'alta' ? -1 : 1));
  const recados = (DB.recados || []).filter(r => !r.atendido);
  admShell('tarefas', `
    <h1 class="pageh">Tarefas</h1>
    <div class="chips">${[['hoje', 'Hoje'], ['semana', 'Semana'], ['todas', 'Todas'], ['feitas', 'Feitas']].map(([v, n]) => `<button class="chip ${aba === v ? 'on' : ''}" data-aba="${v}">${n}</button>`).join('')}</div>
    <div class="chips">${[['todas', 'Tudo'], ['pro', 'Profissional'], ['pessoal', 'Pessoal']].map(([v, n]) => `<button class="chip ${area === v ? 'on' : ''}" data-ar="${v}">${n}</button>`).join('')}</div>
    <section class="card"><div class="tfNova"><input id="tfTx" placeholder="O que precisa fazer? (ou fale com o assistente: “anota: filmar 3 tours amanhã”)">
      <div class="frow"><input type="date" id="tfData" value="${hoje}"><select id="tfPri"><option value="media">média</option><option value="alta">alta</option><option value="baixa">baixa</option></select>
      <select id="tfArea"><option value="pro">profissional</option><option value="pessoal">pessoal</option></select></div><button class="cta sm" id="tfAdd">Anotar</button></div>
      ${ts.length ? `<ul class="tfLista">${ts.map(t2 => `<li class="${atrasada(t2) ? 'atrasada' : ''} ${t2.feita ? 'feita' : ''}"><label><input type="checkbox" data-tf="${t2.id}" ${t2.feita ? 'checked' : ''}>
        <span><b>${esc(t2.texto)}</b><small>${t2.data ? dtBR(t2.data) : 'sem data'} · ${t2.prioridade || 'média'} · ${t2.area === 'pessoal' ? 'pessoal' : 'profissional'}${t2.nota ? ' · ' + esc(t2.nota) : ''}${atrasada(t2) ? ' · atrasada' : ''}</small></span></label></li>`).join('')}</ul>` : '<p class="empty">Nada por aqui. ✨</p>'}
    </section>
    <section class="card"><h3>Recados ${recados.length ? `<span class="pill warn">${recados.length}</span>` : ''}</h3>
      <p class="why">O que chega pelo atendimento (WhatsApp e Instagram) e precisa de você.</p>
      ${recados.map(r => `<div class="hjItem"><span class="hjIc">${r.canal === 'insta' ? '📸' : '💬'}</span><div><b>${esc(r.nome)}</b><small>${esc(r.texto)}</small></div><button class="mini" data-rc="${r.id}">Resolvido</button></div>`).join('') || '<p class="empty">Nenhum recado.</p>'}
    </section>`);
  $$('[data-aba]').forEach(b => b.onclick = () => { admTarefas._a = b.dataset.aba; admTarefas(); });
  $$('[data-ar]').forEach(b => b.onclick = () => { admTarefas._ar = b.dataset.ar; admTarefas(); });
  $('#tfAdd').onclick = () => { const tx = $('#tfTx').value.trim(); if (!tx) return; DB.tarefas.push({ id: 'tf' + uid(), texto: tx, data: $('#tfData').value, prioridade: $('#tfPri').value, area: $('#tfArea').value, feita: false }); grava(); admTarefas(); };
  $$('[data-tf]').forEach(c => c.onchange = () => { const t2 = DB.tarefas.find(z => z.id === c.dataset.tf); t2.feita = c.checked; t2.feitaEm = c.checked ? new Date().toISOString() : ''; grava(); admTarefas(); });
  $$('[data-rc]').forEach(b => b.onclick = () => { const r = DB.recados.find(z => z.id === b.dataset.rc); r.atendido = true; grava(); admTarefas(); });
}

/* =====================================================
   GOOGLE AGENDA — um toque abre o evento já preenchido na agenda dela
   (no fuso dela, config.js guia.fuso).
   Só primeiro nome + passeio: nada de telefone ou e-mail no link.
   ===================================================== */
function linkGoogleAgenda({ titulo, data, hora, horas, local, detalhes }) {
  const d = String(data || '').replace(/-/g, '');
  let datas;
  if (hora) {
    const [h, m] = hora.split(':').map(Number), fimMin = h * 60 + m + Math.round((+horas || 4) * 60);
    const hh = (x) => String(Math.floor(x / 60) % 24).padStart(2, '0') + String(x % 60).padStart(2, '0') + '00';
    const dFim = fimMin >= 1440 ? String(addDays(data, 1)).replace(/-/g, '') : d;   /* passou da meia-noite */
    datas = `${d}T${hh(h * 60 + m)}/${dFim}T${hh(fimMin)}`;
  } else datas = `${d}/${String(addDays(data, 1)).replace(/-/g, '')}`;   /* dia inteiro */
  const q = new URLSearchParams({ action: 'TEMPLATE', text: titulo, dates: datas, ctz: (typeof GUIA_CFG !== 'undefined' && GUIA_CFG.fuso) || 'Europe/Lisbon' });
  if (local) q.set('location', local);
  if (detalhes) q.set('details', detalhes);
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}
function gcalReserva(b) {
  const x = Tours.get(b.tourId) || { name: { pt: 'Tour' }, meeting: '' };
  return linkGoogleAgenda({ titulo: `${tl(x.name)} — ${primeiroNome(b.name)} (${b.pax} pax)`, data: b.date, hora: b.time, horas: b.horas || (x.type === 'consult' ? 1 : Array.isArray(x.horas) ? x.horas[0] : 4),
    local: noIdioma(x.meeting), detalhes: `Reserva ${b.code} · ${guiaNegocio()}\n${linkApp('voucher/' + b.code)}` });
}

/* =====================================================
   RESERVAS: botão de voucher em cada reserva
   AJUSTES: as regras do negócio (sinal, tolerância, hora extra)
   ===================================================== */
const _admBookingsBase = admBookings;
admBookings = function () {
  _admBookingsBase();
  DB.bookings.forEach(b => {
    const cx = document.getElementById('ta-' + b.id);
    if (cx && !cx.querySelector('.vchLink')) cx.insertAdjacentHTML('beforeend', `<a class="mini vchLink" href="#/voucher/${esc(b.code)}">🎟 Voucher</a>`
      + (b.status === 'confirmed' ? `<a class="mini gcal" target="_blank" rel="noopener" href="${esc(gcalReserva(b))}">📅 Google Agenda</a>` : ''));
  });
};
const _admSettingsBase = admSettings;
admSettings = function () {
  _admSettingsBase();
  const stage = $('#stage'); if (!stage) return;
  const st = DB.settings;
  const h1 = stage.querySelector('.pageh'); if (!h1) return;
  h1.insertAdjacentHTML('afterend', `<section class="card" id="regrasLL"><h3>Regras do seu negócio</h3>
    <div class="frow"><label class="fld">Sinal para reservar (%)<input type="number" id="rgSinal" min="0" max="100" value="${sinalPct()}"></label>
      <label class="fld">Tolerância de atraso (min)<input type="number" id="rgTol" value="${esc(st.tolerancia || 30)}"></label>
      <label class="fld">Hora extra (€) <small class="why">0 = sob consulta</small><input type="number" id="rgHora" value="${esc(st.horaExtra || 0)}"></label></div>
    <label class="pdCheck"><input type="checkbox" id="rgDia" ${diaExclusivo() ? 'checked' : ''}> Um grupo por dia (desligue no alto verão para abrir manhã e tarde)</label>
    <p class="why">⚠️ Regras ainda provisórias: confirme o sinal e escreva as suas condições de cancelamento e remarcação.</p>
    <label class="fld">Termos e condições <small class="why">uma regra por linha — vão junto do preço, no checkout e no voucher</small><textarea id="rgTermos" rows="7">${esc(termosLista().join('\n'))}</textarea></label>
    <p class="why">📅 Google Agenda: o botão 📅 em cada reserva abre o evento já preenchido na sua agenda — é só salvar.</p>
    <button class="cta sm" id="rgSalva">Salvar regras</button></section>`);
  $('#rgSalva').onclick = () => {
    st.sinalPct = Math.max(0, Math.min(100, +$('#rgSinal').value || 30)); st.tolerancia = +$('#rgTol').value || 30; st.horaExtra = +$('#rgHora').value || 0;
    st.diaExclusivo = $('#rgDia').checked;
    st.termos = { pt: $('#rgTermos').value.split('\n').map(s => s.trim()).filter(Boolean), en: (st.termos && st.termos.en) || [] };
    save(); toast('Regras salvas ✓');
  };
};

if (typeof module !== 'undefined') module.exports = { conflitoDoDia, msgLembrete };

/* =====================================================
   PAINEL LATERAL — agrupar as 20 abas por assunto (UI/UX, 28/09)
   A lista corrida cansava. Aqui os botões são reagrupados sob títulos,
   sem reordenar o ADM_TABS nem mexer no roteador: só movo os botões no
   DOM (o onclick fica no próprio botão, então continua funcionando) e
   ponho um rótulo antes de cada grupo. Aba que eu não listar (ou futura)
   vai para "Mais", nunca some.
   ===================================================== */
const NAV_GRUPOS = [
  ['Dia a dia', ['today', 'tarefas', 'agenda']],
  ['Passeios e reservas', ['tours', 'pontos', 'bookings']],
  ['Orçamentos e viagens', ['orcamentos', 'voucher', 'roteiros']],
  ['Clientes', ['clients', 'avaliacoes', 'inbox']],
  ['Dinheiro', ['financeiro', 'money', 'reports']],
  ['Configurar', ['settings']],
];
const _admShellBase = admShell;
admShell = function (tab, inner) {
  /* a sincronia por linha (nuvem-itens.js) liga na primeira tela do painel com ela logada */
  if (typeof itLigar === 'function') itLigar(() => { if (typeof isBusyEditing === 'function' && isBusyEditing()) pendingSync = true; else route(); });
  _admShellBase(tab, inner);
  const nav = document.querySelector('.rail nav'); if (!nav || nav.dataset.agrupado) return;
  const botoes = {};
  nav.querySelectorAll('.nb[data-tab]').forEach(b => { botoes[b.dataset.tab] = b; });
  const usados = new Set();
  nav.innerHTML = '';
  const grupo = (titulo, ids) => {
    const nos = ids.map(id => botoes[id]).filter(Boolean); if (!nos.length) return;
    const h = document.createElement('p'); h.className = 'navRot'; h.textContent = titulo; nav.appendChild(h);
    nos.forEach(b => { nav.appendChild(b); usados.add(b.dataset.tab); });
  };
  NAV_GRUPOS.forEach(([t2, ids]) => grupo(t2, ids));
  const sobra = Object.values(botoes).filter(b => !usados.has(b.dataset.tab));
  if (sobra.length) { const h = document.createElement('p'); h.className = 'navRot'; h.textContent = 'Mais'; nav.appendChild(h); sobra.forEach(b => nav.appendChild(b)); }
  nav.dataset.agrupado = '1';
};
