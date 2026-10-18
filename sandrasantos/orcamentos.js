/* =====================================================
   ORÇAMENTOS — Sandra Santos · Sikania Tour (17/10/2026)

   Menu próprio no painel. Tudo que pede valor cai aqui:
   - os PEDIDOS da vitrine (pedidos.js): transfer, viagem sob medida e
     passeio com valor a combinar → "Montar orçamento" já preenche cliente,
     datas, pessoas e os serviços;
   - orçamento avulso (o cliente pediu pelo WhatsApp ou pelo Instagram).

   O orçamento tem serviços (data, hora, título, texto, valor ou "a
   combinar", opcional), condições (nascem dos termos dela) e validade.
   Sai de três jeitos: PDF (Imprimir → Salvar como PDF), WhatsApp (resumo +
   link) e LINK que abre no celular do cliente (#/orc/…): o orçamento viaja
   DENTRO do link, então funciona mesmo sem banco.
   Aceito → vira RESERVA (aparece em Reservas, no Hoje e no voucher) e, se
   for viagem sob medida, também um ROTEIRO para ela montar os dias.

   Base: o Orc da Mari (app-mari/orcamento-mari.js) e o "1 dado, 1 lugar"
   da Ingrid. Valor é sempre o que ELA disser: o app não inventa preço.
   O assistente monta e muda pelo chat (carol-ia.js).
   ===================================================== */
'use strict';

const ORC_STATUS = {
  rascunho: ['warn', 'Rascunho'], enviado: ['n', 'Enviado'], aceito: ['ok', 'Aceito'], recusado: ['bad', 'Recusado'],
};
const orcNum = (v) => v === null || v === undefined || v === '' || isNaN(+v) ? null : +v;
const orcData = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '';

const Orc = {
  all() { if (!Array.isArray(DB.orcamentos)) DB.orcamentos = []; return DB.orcamentos; },
  get(id) { return this.all().find(o => o.id === id) || null; },
  proxNum() { const n = this.all().reduce((m, o) => Math.max(m, +(String(o.num || '').match(/(\d+)$/) || [0, 0])[1]), 0) + 1; return 'ORC-' + String(n).padStart(4, '0'); },
  condicoesPadrao() { return (typeof termosLista === 'function' ? termosLista() : []).join('\n'); },
  novo(c) {
    const o = Object.assign({ id: 'orc' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), num: this.proxNum(), criado: new Date().toISOString(), status: 'rascunho',
      tipo: 'avulso', pedidoId: '', cliente: { nome: '', whats: '', email: '' }, titulo: '', destino: '', ini: '', fim: '', adultos: 2, criancas: 0,
      itens: [], condicoes: this.condicoesPadrao(), validade: addDays(isoToday(), 15), obs: '' }, c || {});
    o.cliente = Object.assign({ nome: '', whats: '', email: '' }, o.cliente || {});
    o.itens = (o.itens || []).map(Orc.item);
    this.all().push(o); this.grava(); return o;
  },
  /* id vazio (vindo de duplicar) ganha um novo: com id repetido, tirar um serviço tirava todos */
  item(x) {
    const o = Object.assign({ data: '', hora: '', titulo: '', texto: '', valor: null, opcional: false, tourId: '' }, x || {});
    o.valor = orcNum(o.valor);
    if (!o.id) o.id = 'it' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
    return o;
  },
  atualiza(id, c) { const o = this.get(id); if (!o) return null; Object.assign(o, c); o.mudado = new Date().toISOString(); this.grava(); return o; },
  remove(id) { DB.orcamentos = this.all().filter(o => o.id !== id); this.grava(); },
  duplica(id) {
    const o = this.get(id); if (!o) return null;
    const c = JSON.parse(JSON.stringify(o)); delete c.id; delete c.num; delete c.criado; delete c.reservaId; delete c.roteiroId; delete c.aceitoEm; delete c.enviadoEm;
    c.status = 'rascunho'; c.pedidoId = ''; c.itens = c.itens.map(({ id, ...r }) => r); return this.novo(c);
  },
  grava() { localStorage.setItem(DB_KEY, JSON.stringify(DB)); if (typeof itAgendar === 'function') itAgendar(); },
  /* as contas — SEMPRE daqui (o assistente repete, nunca soma) */
  totais(o) {
    const base = (o.itens || []).filter(i => !i.opcional), opc = (o.itens || []).filter(i => i.opcional);
    const soma = (l) => l.reduce((s, i) => s + (orcNum(i.valor) || 0), 0);
    return { total: soma(base), opcionais: soma(opc), totalComOpcionais: soma(base) + soma(opc),
      aCombinar: (o.itens || []).filter(i => orcNum(i.valor) === null).map(i => i.titulo || 'serviço'), qtd: base.length, qtdOpc: opc.length };
  },
  pessoas(o) { const a = +o.adultos || 0, c = +o.criancas || 0; return a + c; },

  /* o orçamento que nasce de um pedido da vitrine */
  doPedido(p) {
    const ja = p.orcamentoId && this.get(p.orcamentoId); if (ja) return ja;
    const base = { tipo: p.tipo === 'roteiro' ? 'sobmedida' : p.tipo, pedidoId: p.id, cliente: { nome: p.nome || '', whats: p.whats || '', email: p.email || '' },
      adultos: p.adultos || 1, criancas: p.criancas || 0, obs: [p.idades ? 'Idades: ' + p.idades : '', p.obs || ''].filter(Boolean).join('\n') };
    let o;
    if (p.tipo === 'transfer') {
      const trf = (typeof rtNome === 'function' && typeof TRF_TIPOS !== 'undefined') ? rtNome(TRF_TIPOS, p.tipoTrf) : 'Transfer';
      const detalhe = [p.voo ? 'voo/trem ' + p.voo : '', `${p.malas} ${p.malas === 1 ? 'mala grande' : 'malas grandes'} e ${p.malasMao} de mão`].filter(Boolean).join(' · ');
      const itens = [{ data: p.data, hora: p.hora, titulo: `Transfer · ${p.de} → ${p.para}`, texto: trf + (detalhe ? ' · ' + detalhe : ''), tourId: 'transfer' }];
      if (p.volta) itens.push({ data: p.voltaData, hora: p.voltaHora, titulo: `Transfer · ${p.para} → ${p.de}`, texto: 'Volta' + (p.voltaVoo ? ' · voo/trem ' + p.voltaVoo : ''), tourId: 'transfer' });
      o = this.novo({ ...base, titulo: 'Transfer', destino: [p.de, p.para].filter(Boolean).join(' → '), ini: p.data || '', fim: p.volta ? (p.voltaData || '') : (p.data || ''), itens });
    } else if (p.tipo === 'passeio') {
      const x = Tours.get(p.tourId) || null;
      o = this.novo({ ...base, titulo: p.tourNome || (x ? tl(x.name) : 'Passeio'), destino: x ? regiaoLabel(x.region) : '', ini: p.data || '', fim: p.data || '',
        itens: [{ data: p.data, titulo: p.tourNome || (x ? tl(x.name) : 'Passeio'), texto: x && x.duration ? x.duration : '', tourId: p.tourId }] });
    } else {
      const dest = (p.destinos || []).map(v => typeof SM_DESTINOS !== 'undefined' ? rtNome(SM_DESTINOS, v) : v);
      const temas = (p.temas || []).map(v => typeof RT_TEMAS !== 'undefined' ? rtNome(RT_TEMAS, v) : v);
      const itens = [{ data: p.ini, titulo: 'Viagem sob medida' + (dest.length ? ' · ' + dest.join(', ') : ''),
        texto: [temas.length ? 'Interesses: ' + temas.join(', ') : '', p.ritmo && typeof RT_RITMO !== 'undefined' ? 'Ritmo ' + rtNome(RT_RITMO, p.ritmo).toLowerCase() : ''].filter(Boolean).join(' · '), tourId: 'sob-medida' }];
      for (const n of p.passeios || []) { const x = Tours.all().find(t2 => tl(t2.name) === n); itens.push({ titulo: n, texto: x && x.duration ? x.duration : '', tourId: x ? x.id : '' }); }
      for (const v of p.precisa || []) itens.push({ titulo: typeof RT_PRECISA !== 'undefined' ? rtNome(RT_PRECISA, v) : v, texto: '', opcional: true });
      o = this.novo({ ...base, tipo: 'sobmedida', titulo: 'Sua viagem sob medida', destino: dest.join(', '), ini: p.ini || '', fim: p.fim || '', itens });
    }
    if (typeof Pedidos !== 'undefined') Pedidos.ligaOrcamento(p.id, o.id);
    return o;
  },

  /* o texto que vai no WhatsApp (o link leva o orçamento inteiro) */
  mensagem(o) {
    const t2 = this.totais(o), nome = String(o.cliente.nome || '').trim().split(' ')[0];
    const L = [`Olá${nome ? ', ' + nome : ''}! Aqui é a ${guiaNome()}, da ${guiaNegocio()} 😊`, '', `Segue o seu orçamento (${o.num}): *${o.titulo || 'orçamento'}*`];
    if (o.ini) L.push('🗓 ' + [orcData(o.ini), o.fim && o.fim !== o.ini ? orcData(o.fim) : ''].filter(Boolean).join(' → '));
    if (this.pessoas(o)) L.push('👥 ' + this.pessoas(o) + (this.pessoas(o) === 1 ? ' pessoa' : ' pessoas'));
    L.push('');
    for (const i of o.itens.filter(i => !i.opcional)) L.push(`• ${i.titulo}${i.data ? ' (' + orcData(i.data) + ')' : ''}: ${orcNum(i.valor) === null ? 'a combinar' : eur(i.valor)}`);
    const opc = o.itens.filter(i => i.opcional);
    if (opc.length) { L.push('', 'Opcionais:'); for (const i of opc) L.push(`• ${i.titulo}: ${orcNum(i.valor) === null ? 'a combinar' : eur(i.valor)}`); }
    L.push('', `*Total: ${eur(t2.total)}*` + (t2.aCombinar.length ? ' (+ itens a combinar)' : ''));
    if (o.validade) L.push('Válido até ' + orcData(o.validade) + '.');
    L.push('', 'O orçamento completo, com as condições: ' + this.link(o));
    return L.join('\n');
  },
  /* o orçamento viaja DENTRO do link: abre no celular do cliente sem banco.
     Só o primeiro nome do cliente vai junto (nada de telefone ou e-mail). */
  payload(o) {
    return { n: o.num, t: o.titulo, d: o.destino, i: o.ini, f: o.fim, a: +o.adultos || 0, c: +o.criancas || 0, v: o.validade, k: o.condicoes,
      cl: String(o.cliente.nome || '').trim().split(' ')[0], it: o.itens.map(i => [i.data || '', i.hora || '', i.titulo || '', i.texto || '', orcNum(i.valor), i.opcional ? 1 : 0]) };
  },
  link(o) {
    const json = JSON.stringify(this.payload(o));
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return location.origin + location.pathname + '#/orc/' + b64;
  },
  deLink(b64) {
    try {
      const s = atob(String(b64).replace(/-/g, '+').replace(/_/g, '/'));
      const p = JSON.parse(decodeURIComponent(escape(s)));
      return { num: p.n, titulo: p.t, destino: p.d, ini: p.i, fim: p.f, adultos: p.a, criancas: p.c, validade: p.v, condicoes: p.k, cliente: { nome: p.cl || '' },
        itens: (p.it || []).map(([data, hora, titulo, texto, valor, opcional]) => ({ data, hora, titulo, texto, valor, opcional: !!opcional })) };
    } catch (e) { return null; }
  },

  /* ACEITO → reserva (1 dado, 1 lugar: a reserva guarda o orçamento de onde veio) e,
     se for viagem sob medida, um roteiro para ela montar os dias */
  aceita(id, recebido = 0, metodo = 'pix') {
    const o = this.get(id); if (!o) return { erro: 'orçamento não encontrado' };
    if (o.status === 'aceito' && o.reservaId) return { ok: true, reserva: (Bookings.get(o.reservaId) || {}).code, ja: true };
    const tt = this.totais(o);
    const datas = o.itens.map(i => i.data).filter(Boolean).sort();
    const tourId = o.tipo === 'transfer' ? 'transfer' : ((o.itens.find(i => i.tourId && i.tourId !== 'transfer') || {}).tourId || 'sob-medida');
    const hora = (o.itens.find(i => i.data === datas[0]) || {}).hora || '';
    const b = Bookings.criarManual({ tourId, date: datas[0] || o.ini || isoToday(), time: hora, name: o.cliente.nome || 'Cliente',
      whats: o.cliente.whats || '', email: o.cliente.email || '', pax: Math.max(1, this.pessoas(o)), total: tt.total, recebido: +recebido || 0, metodo });
    b.orcamentoId = o.id; b.origin = 'orcamento'; b.obs = `${o.num} · ${o.titulo}`;
    o.status = 'aceito'; o.aceitoEm = new Date().toISOString(); o.reservaId = b.id;
    if (o.tipo === 'sobmedida' && typeof novoRoteiro === 'function' && !o.roteiroId) {
      const r = novoRoteiro({ nome: o.cliente.nome, whats: o.cliente.whats, email: o.cliente.email, ini: o.ini, fim: o.fim, adultos: o.adultos, criancas: o.criancas, obs: o.titulo, orcamentoId: o.id });
      o.roteiroId = r.id;
    }
    this.grava();
    if (typeof cloudUpdateBooking === 'function') cloudUpdateBooking(b);
    return { ok: true, reserva: b.code, roteiro: o.roteiroId || '' };
  },
};

/* =====================================================
   O DOCUMENTO (o mesmo no painel, no PDF e no link do cliente)
   ===================================================== */
function orcDocHtml(o) {
  const tt = Orc.totais(o);
  const linha = (i) => `<tr class="${i.opcional ? 'opc' : ''}"><td>${orcData(i.data) || '—'}${i.hora ? `<small>${esc(i.hora)}</small>` : ''}</td>
    <td><b>${esc(i.titulo || '')}</b>${i.texto ? `<small>${esc(i.texto)}</small>` : ''}</td>
    <td class="v">${orcNum(i.valor) === null ? '<i>a combinar</i>' : eur(i.valor)}</td></tr>`;
  const base = o.itens.filter(i => !i.opcional), opc = o.itens.filter(i => i.opcional);
  const pessoas = (+o.adultos || 0) + (+o.criancas || 0);
  return `<article class="orcDoc" id="orcFolha">
    <header class="orcFaixa"><img src="arte/logo-escuro.png" alt="${esc(guiaNegocio())}">
      <div><b>ORÇAMENTO</b><small>${esc(o.num || '')}</small></div></header>
    <div class="orcCorpo">
      ${o.cliente && o.cliente.nome ? `<p class="orcPara">Para <b>${esc(o.cliente.nome)}</b></p>` : ''}
      <h1>${esc(o.titulo || 'Orçamento')}</h1>
      <dl class="orcDados">
        ${o.destino ? `<div><dt>Destino</dt><dd>${esc(o.destino)}</dd></div>` : ''}
        ${o.ini ? `<div><dt>Quando</dt><dd>${orcData(o.ini)}${o.fim && o.fim !== o.ini ? ' a ' + orcData(o.fim) : ''}</dd></div>` : ''}
        ${pessoas ? `<div><dt>Pessoas</dt><dd>${o.adultos} ${+o.adultos === 1 ? 'adulto' : 'adultos'}${+o.criancas ? ` e ${o.criancas} ${+o.criancas === 1 ? 'criança' : 'crianças'}` : ''}</dd></div>` : ''}
        ${o.validade ? `<div><dt>Válido até</dt><dd>${orcData(o.validade)}</dd></div>` : ''}
      </dl>
      <table class="orcTab"><thead><tr><th>Data</th><th>Serviço</th><th class="v">Valor</th></tr></thead>
        <tbody>${base.map(linha).join('') || '<tr><td colspan="3"><i>Nenhum serviço ainda.</i></td></tr>'}</tbody></table>
      ${opc.length ? `<p class="orcRot">Opcionais</p><table class="orcTab opcs"><tbody>${opc.map(linha).join('')}</tbody></table>` : ''}
      <p class="orcTotal"><span>Total</span><b>${eur(tt.total)}</b></p>
      ${tt.aCombinar.length ? `<p class="orcNota">Itens com valor a combinar não entram no total.</p>` : ''}
      ${tt.opcionais ? `<p class="orcNota">Com os opcionais: <b>${eur(tt.totalComOpcionais)}</b></p>` : ''}
      ${o.condicoes ? `<div class="orcCond"><b>Condições</b><ul>${String(o.condicoes).split('\n').map(l => l.trim()).filter(Boolean).map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
      <p class="orcAss">${esc(guiaNome())} · ${esc(guiaNegocio())}<small>${esc(DB.settings.badge || '')} · ${esc(DB.settings.whats || '')}</small></p>
    </div>
  </article>`;
}
/* o cliente abre o link (#/orc/…) */
function viewOrcCliente(b64) {
  const o = Orc.deLink(b64);
  if (!o) { app.innerHTML = `${topoCarol()}<main class="wrap narrow"><p class="empty">Orçamento não encontrado. Peça o link de novo para a ${esc(guiaNome())}.</p></main>`; ligaVoltar('/'); return; }
  app.innerHTML = `${topoCarol()}
  <main class="wrap orcWrap">
    <div class="vchAcoes noprint">
      <a class="cta sm" target="_blank" rel="noopener" href="${esc(waLink(`Olá, ${guiaNome()}! Vi o orçamento ${o.num} (${o.titulo}) e quero confirmar.`))}">${typeof ICONE_WA_BTN !== 'undefined' ? ICONE_WA_BTN : ''} Quero confirmar</a>
      <a class="mini" target="_blank" rel="noopener" href="${esc(waLink(`Olá, ${guiaNome()}! Tenho uma dúvida sobre o orçamento ${o.num}.`))}">Tirar uma dúvida</a>
      <button class="mini" id="orcPdf">Salvar em PDF</button>
    </div>
    ${orcDocHtml(o)}
  </main>`;
  ligaVoltar('/');
  $('#orcPdf').onclick = () => window.print();
}
const _rotaExtraOrc = rotaExtra;
rotaExtra = function (p) {
  if (p[0] === 'orc') { viewOrcCliente(p.slice(1).join('/')); return true; }
  return _rotaExtraOrc(p);
};

/* =====================================================
   A ABA "Orçamentos" no painel
   ===================================================== */
Object.assign(STR, { admOrcamentos: { pt: 'Orçamentos', en: 'Quotes' } });
(function abaOrcamentos() {
  if (ADM_TABS.some(([x]) => x === 'orcamentos')) return;
  const i = ADM_TABS.findIndex(([x]) => x === 'bookings');
  ADM_TABS.splice(i < 0 ? ADM_TABS.length : i + 1, 0, ['orcamentos', 'admOrcamentos']);
})();
const _viewAdmOrc = viewAdm;
viewAdm = function (tab, arg) {
  if (tab === 'orcamentos') return arg ? admOrcEdita(arg) : admOrcamentos();
  if (tab === 'orcdoc') return admOrcDoc(arg);
  return _viewAdmOrc(tab, arg);
};

function admOrcamentos() {
  const filtro = admOrcamentos._f || 'abertos';
  const peds = (typeof Pedidos !== 'undefined' ? Pedidos.all() : []).filter(p => !p.orcamentoId && !p.arquivado);
  const quando = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
  let os = [...Orc.all()].sort((a, b) => (b.mudado || b.criado || '').localeCompare(a.mudado || a.criado || ''));
  if (filtro === 'abertos') os = os.filter(o => o.status === 'rascunho' || o.status === 'enviado');
  else if (filtro !== 'todos') os = os.filter(o => o.status === filtro);
  const conta = (st) => Orc.all().filter(o => st === 'abertos' ? (o.status === 'rascunho' || o.status === 'enviado') : st === 'todos' || o.status === st).length;
  admShell('orcamentos', `
    <div class="pagehead"><h1 class="pageh">Orçamentos</h1><div class="chips"><button class="cta sm" id="orcNovo">+ Novo orçamento</button></div></div>
    <p class="why">Os pedidos de transfer, de viagem sob medida e de valor de passeio chegam aqui. Monte o orçamento, mande pelo WhatsApp (com o link) ou em PDF, e quando o cliente aceitar ele vira reserva.</p>

    <section class="card orcPedidos"><h3>Pedidos que chegaram ${peds.length ? `<span class="pill warn">${peds.length}</span>` : ''}</h3>
      ${peds.length ? peds.map(p => `<div class="pedido orcPed">
        <div class="pdtop"><b>${pedidoIcone(p)} ${esc(pedidoRotulo(p))} · ${esc(p.nome)}</b><span class="pill warn">Novo</span></div>
        <small>${esc(p.resumo || '')} · chegou ${esc(quando(p.criado))}</small>
        <details><summary>Ver o pedido completo</summary><pre class="pdmsg">${esc(p.ficha || '')}</pre></details>
        <div class="tacts"><button class="cta sm" data-monta="${esc(p.id)}">Montar orçamento</button>
          ${String(p.whats || '').replace(/\D/g, '').length >= 8 ? `<a class="mini" target="_blank" rel="noopener" href="${esc(waLink(`Olá, ${String(p.nome || '').split(' ')[0]}! Aqui é a ${guiaNome()}, da ${guiaNegocio()}. Recebi o seu pedido e já te mando o orçamento.`, String(p.whats).replace(/\D/g, '')))}">Responder no WhatsApp</a>` : ''}
          <button class="mini ghost" data-arq="${esc(p.id)}">Arquivar</button></div>
      </div>`).join('') : `<p class="why">Quando um cliente pedir transfer, viagem sob medida ou o valor de um passeio pela vitrine, o pedido aparece aqui${typeof temNuvem === 'function' && temNuvem() ? ' — e chega no seu celular' : ''}.</p>`}
    </section>

    <div class="chips">${[['abertos', 'Em aberto'], ['aceito', 'Aceitos'], ['recusado', 'Recusados'], ['todos', 'Todos']].map(([v, n]) =>
      `<button class="chip ${filtro === v ? 'on' : ''}" data-of="${v}">${n} <small>${conta(v)}</small></button>`).join('')}</div>
    ${os.length ? os.map(o => { const [cls, txt] = ORC_STATUS[o.status] || ORC_STATUS.rascunho; const tt = Orc.totais(o); return `<section class="card orcCard">
      <div class="agTopo"><div><h3>${esc(o.num)} · ${esc(o.cliente.nome || 'sem nome')}</h3>
        <small>${esc(o.titulo || '')}${o.ini ? ' · ' + orcData(o.ini) : ''}${Orc.pessoas(o) ? ' · ' + Orc.pessoas(o) + ' pessoas' : ''}</small></div>
        <span class="pill ${cls}">${txt}</span></div>
      <p class="orcVal"><b>${eur(tt.total)}</b>${tt.aCombinar.length ? ` <small>+ ${tt.aCombinar.length} a combinar</small>` : ''}</p>
      <div class="tacts"><button class="cta sm" data-orc="${o.id}">Abrir</button><button class="mini" data-doc="${o.id}">Ver o documento</button></div>
    </section>`; }).join('') : `<p class="empty">${filtro === 'abertos' ? 'Nenhum orçamento em aberto.' : 'Nada aqui.'}</p>`}`);
  $('#orcNovo').onclick = () => { const o = Orc.novo({ titulo: '' }); go('/adm/orcamentos/' + o.id); };
  $$('[data-monta]').forEach(b => b.onclick = () => { const p = (DB.pedidos || []).find(z => z.id === b.dataset.monta); if (!p) return; const o = Orc.doPedido(p); go('/adm/orcamentos/' + o.id); });
  $$('[data-arq]').forEach(b => b.onclick = () => { const p = (DB.pedidos || []).find(z => z.id === b.dataset.arq); if (!p) return; p.arquivado = true; Pedidos.marca(p.id, true); admOrcamentos(); });
  $$('[data-of]').forEach(b => b.onclick = () => { admOrcamentos._f = b.dataset.of; admOrcamentos(); });
  $$('[data-orc]').forEach(b => b.onclick = () => go('/adm/orcamentos/' + b.dataset.orc));
  $$('[data-doc]').forEach(b => b.onclick = () => go('/adm/orcdoc/' + b.dataset.doc));
}

function admOrcEdita(id) {
  const o = Orc.get(id);
  if (!o) return admOrcamentos();
  const [cls, txt] = ORC_STATUS[o.status] || ORC_STATUS.rascunho;
  const tt = Orc.totais(o);
  const ped = o.pedidoId ? (DB.pedidos || []).find(p => p.id === o.pedidoId) : null;
  const passeios = Tours.all().filter(x => !x.servico);
  const num = String(o.cliente.whats || '').replace(/\D/g, '');
  const itemHtml = (i, k) => `<div class="orcItem ${i.opcional ? 'opc' : ''}" data-it="${i.id}">
    <div class="frow"><label class="fld">Data<input type="date" data-f="data" value="${esc(i.data || '')}"></label>
      <label class="fld">Hora<input type="time" data-f="hora" value="${esc(i.hora || '')}"></label>
      <label class="fld">Valor (€) <small class="why">vazio = a combinar</small><input type="number" min="0" step="1" data-f="valor" value="${orcNum(i.valor) === null ? '' : i.valor}" placeholder="a combinar"></label></div>
    <label class="fld">Serviço<input data-f="titulo" value="${esc(i.titulo || '')}" placeholder="ex.: Costa Amalfitana de carro e barco"></label>
    <label class="fld">Detalhe <small class="why">o que inclui, duração, observação</small><input data-f="texto" value="${esc(i.texto || '')}"></label>
    <div class="tacts"><label class="pdCheck"><input type="checkbox" data-f="opcional" ${i.opcional ? 'checked' : ''}> Opcional (não entra no total)</label>
      <button class="mini" data-sobe="${k}" ${k ? '' : 'disabled'} aria-label="subir">↑</button><button class="mini ghost" data-tira="${i.id}">Tirar</button></div>
  </div>`;
  admShell('orcamentos', `
    <div class="pagehead"><h1 class="pageh">${esc(o.num)}</h1><div class="chips"><span class="pill ${cls}">${txt}</span><button class="mini" id="orcVolta">← Orçamentos</button></div></div>
    ${ped ? `<details class="card"><summary><b>${pedidoIcone(ped)} O pedido de ${esc(ped.nome)}</b> <small>${esc(ped.resumo || '')}</small></summary><pre class="pdmsg">${esc(ped.ficha || '')}</pre></details>` : ''}
    <section class="card"><h3>Cliente</h3>
      <div class="frow"><label class="fld">Nome<input id="oNome" value="${esc(o.cliente.nome)}"></label>
        <label class="fld">WhatsApp<input id="oWhats" type="tel" value="${esc(o.cliente.whats)}" placeholder="+55 …"></label>
        <label class="fld">E-mail<input id="oEmail" type="email" value="${esc(o.cliente.email)}"></label></div>
    </section>
    <section class="card"><h3>A viagem</h3>
      <label class="fld">Título<input id="oTit" value="${esc(o.titulo)}" placeholder="ex.: Nápoles e Costa Amalfitana em 5 dias"></label>
      <div class="frow"><label class="fld">Destino<input id="oDest" value="${esc(o.destino)}" placeholder="ex.: Nápoles e Amalfi"></label>
        <label class="fld">De<input type="date" id="oIni" value="${esc(o.ini)}"></label><label class="fld">Até<input type="date" id="oFim" value="${esc(o.fim)}"></label></div>
      <div class="frow"><label class="fld">Adultos<input type="number" min="0" id="oAd" value="${esc(o.adultos)}"></label><label class="fld">Crianças<input type="number" min="0" id="oCr" value="${esc(o.criancas)}"></label>
        <label class="fld">Válido até<input type="date" id="oVal" value="${esc(o.validade || '')}"></label></div>
    </section>
    <section class="card"><h3>Serviços</h3>
      <div id="orcItens">${o.itens.map(itemHtml).join('') || '<p class="why">Nenhum serviço ainda.</p>'}</div>
      <div class="tacts"><button class="mini" id="orcItem">+ Serviço</button>
        <select id="orcPasseio" class="mini"><option value="">+ Um dos seus passeios…</option>${passeios.map(x => `<option value="${x.id}">${esc(tl(x.name))}</option>`).join('')}</select></div>
      <p class="orcTot">Total: <b>${eur(tt.total)}</b>${tt.aCombinar.length ? ` <small>· ${tt.aCombinar.length} ${tt.aCombinar.length === 1 ? 'item a combinar' : 'itens a combinar'}</small>` : ''}${tt.opcionais ? ` <small>· com opcionais ${eur(tt.totalComOpcionais)}</small>` : ''}</p>
    </section>
    <section class="card"><h3>Condições</h3>
      <label class="fld"><small class="why">uma por linha · nascem dos seus termos (Ajustes)</small><textarea id="oCond" rows="5">${esc(o.condicoes || '')}</textarea></label>
      <label class="fld">Anotação sua <small class="why">não vai para o cliente</small><textarea id="oObs" rows="2">${esc(o.obs || '')}</textarea></label>
    </section>
    <section class="card orcAcoes"><h3>Mandar e fechar</h3>
      <div class="tacts">
        <button class="cta sm" id="orcDocBt">Ver o documento / PDF</button>
        ${num.length >= 8 ? `<a class="cta sm" id="orcWa" target="_blank" rel="noopener" href="${esc(waLink(Orc.mensagem(o), num))}">${typeof ICONE_WA_BTN !== 'undefined' ? ICONE_WA_BTN : ''} Mandar no WhatsApp</a>` : '<span class="why">Ponha o WhatsApp do cliente para mandar por lá.</span>'}
        <button class="mini" id="orcLink">Copiar o link</button>
      </div>
      <div class="tacts">
        ${o.status !== 'enviado' && o.status !== 'aceito' ? '<button class="mini" id="orcEnviado">Marcar como enviado</button>' : ''}
        ${o.status !== 'aceito' ? '<button class="mini" id="orcAceito">✓ Aceito: virar reserva</button>' : ''}
        ${o.status !== 'recusado' && o.status !== 'aceito' ? '<button class="mini ghost" id="orcRecusado">Recusado</button>' : ''}
        <button class="mini ghost" id="orcDup">Duplicar</button><button class="mini ghost" id="orcApaga">Apagar</button>
      </div>
      ${o.status === 'aceito' ? `<p class="why">Aceito em ${orcData((o.aceitoEm || '').slice(0, 10))}. ${o.reservaId && Bookings.get(o.reservaId) ? `Reserva <a href="#/adm/bookings">${esc(Bookings.get(o.reservaId).code)}</a> · <a href="#/voucher/${esc(Bookings.get(o.reservaId).code)}">voucher</a>` : ''}${o.roteiroId ? ` · <a href="#/adm/roteiros/${esc(o.roteiroId)}">montar o roteiro</a>` : ''}</p>` : ''}
    </section>`);
  const guarda = () => {
    o.cliente = { nome: $('#oNome').value.trim(), whats: $('#oWhats').value.trim(), email: $('#oEmail').value.trim() };
    Object.assign(o, { titulo: $('#oTit').value.trim(), destino: $('#oDest').value.trim(), ini: $('#oIni').value, fim: $('#oFim').value,
      adultos: Math.max(0, +$('#oAd').value || 0), criancas: Math.max(0, +$('#oCr').value || 0), validade: $('#oVal').value, condicoes: $('#oCond').value, obs: $('#oObs').value });
    $$('#orcItens [data-it]').forEach(el => {
      const it = o.itens.find(z => z.id === el.dataset.it); if (!it) return;
      el.querySelectorAll('[data-f]').forEach(f => { const k = f.dataset.f; it[k] = k === 'opcional' ? f.checked : k === 'valor' ? orcNum(f.value) : f.value; });
    });
    o.mudado = new Date().toISOString(); Orc.grava();
  };
  /* salva sozinho a cada mudança; redesenha só o que muda o total */
  $$('#stage input, #stage textarea').forEach(el => el.addEventListener('change', () => { guarda(); if (/valor|opcional/.test(el.dataset.f || '') || el.id === 'oWhats' || el.id === 'oNome') admOrcEdita(id); }));
  $('#orcVolta').onclick = () => { guarda(); go('/adm/orcamentos'); };
  $('#orcItem').onclick = () => { guarda(); o.itens.push(Orc.item({ data: o.ini || '' })); Orc.grava(); admOrcEdita(id); };
  $('#orcPasseio').onchange = (e) => { const x = Tours.get(e.target.value); if (!x) return; guarda();
    o.itens.push(Orc.item({ data: o.ini || '', titulo: tl(x.name), texto: x.duration || '', tourId: x.id, valor: x.price > 0 ? x.price : null })); Orc.grava(); admOrcEdita(id); };
  $$('[data-tira]').forEach(b => b.onclick = () => { guarda(); o.itens = o.itens.filter(z => z.id !== b.dataset.tira); Orc.grava(); admOrcEdita(id); });
  $$('[data-sobe]').forEach(b => b.onclick = () => { guarda(); const k = +b.dataset.sobe; [o.itens[k - 1], o.itens[k]] = [o.itens[k], o.itens[k - 1]]; Orc.grava(); admOrcEdita(id); });
  $('#orcDocBt').onclick = () => { guarda(); go('/adm/orcdoc/' + id); };
  $('#orcLink').onclick = () => { guarda(); const l = Orc.link(o); (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(() => toast('Link copiado ✓'), () => prompt('Copie o link:', l)); };
  if ($('#orcWa')) $('#orcWa').addEventListener('click', () => { guarda(); if (o.status === 'rascunho') { o.status = 'enviado'; o.enviadoEm = new Date().toISOString(); Orc.grava(); setTimeout(() => admOrcEdita(id), 300); } });
  if ($('#orcEnviado')) $('#orcEnviado').onclick = () => { guarda(); o.status = 'enviado'; o.enviadoEm = new Date().toISOString(); Orc.grava(); toast('Marcado como enviado'); admOrcEdita(id); };
  if ($('#orcRecusado')) $('#orcRecusado').onclick = () => { guarda(); o.status = 'recusado'; Orc.grava(); admOrcEdita(id); };
  if ($('#orcAceito')) $('#orcAceito').onclick = () => {
    guarda();
    if (!o.cliente.nome) return toast('Falta o nome do cliente');
    const t2 = Orc.totais(o);
    const rec = prompt(`Virar reserva de ${eur(t2.total)} para ${o.cliente.nome}.\nQuanto você já recebeu? (0 se ainda nada)`, '0');
    if (rec === null) return;
    const r = Orc.aceita(id, +String(rec).replace(',', '.') || 0, 'pix');
    if (r.erro) return toast(r.erro);
    toast('Reserva ' + r.reserva + ' criada ✓' + (r.roteiro ? ' · roteiro aberto' : ''));
    admOrcEdita(id);
  };
  $('#orcDup').onclick = () => { guarda(); const c = Orc.duplica(id); go('/adm/orcamentos/' + c.id); };
  $('#orcApaga').onclick = () => { if (!confirm('Apagar o ' + o.num + '? Não dá para desfazer.')) return; Orc.remove(id); go('/adm/orcamentos'); };
}

function admOrcDoc(id) {
  const o = Orc.get(id);
  if (!o) return admOrcamentos();
  const num = String(o.cliente.whats || '').replace(/\D/g, '');
  admShell('orcamentos', `
    <div class="vchAcoes noprint">
      <button class="mini" id="odVolta">← Editar</button>
      <button class="cta sm" id="odPdf">Salvar em PDF / imprimir</button>
      ${num.length >= 8 ? `<a class="mini" target="_blank" rel="noopener" href="${esc(waLink(Orc.mensagem(o), num))}">Mandar no WhatsApp</a>` : ''}
      <a class="mini" href="${esc(Orc.link(o))}" target="_blank" rel="noopener">Ver como o cliente vê ↗</a>
    </div>
    ${orcDocHtml(o)}`);
  $('#odVolta').onclick = () => go('/adm/orcamentos/' + id);
  $('#odPdf').onclick = () => window.print();
}

if (typeof module !== 'undefined') module.exports = { Orc, orcDocHtml };
