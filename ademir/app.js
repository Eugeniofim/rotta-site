/* Protótipo do painel do Ademir (Simonetta Viagens).
   Quatro telas: Cotação (cola a tela do Amadeus), Proposta (o que o cliente recebe),
   Voucher (hotel) e Passaportes. Tudo roda no navegador, sem servidor. */
(function () {
  'use strict';
  const { CIAS, AEROPORTOS, AERONAVES, AGENCIA: AG, HOTEIS, FOTOS_DESTINO } = DADOS;
  const CHAVE = 'ademir_proto_v1';
  const HOJE = new Date();

  /* ---------- utilidades ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const usd = (v) => 'USD ' + Math.round(v).toLocaleString('pt-BR');
  /* valor do pacote na moeda que ele escolheu: R$ 4.499,00 · € 4.230 · USD 4.230 */
  const dinheiro = (v, m) => m === 'BRL' ? 'R$ ' + (+v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (m === 'EUR' ? '€ ' : 'USD ') + (+v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const brl = (v) => 'R$ ' + (+v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_L = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dt = (iso) => new Date(iso + 'T12:00:00');
  const diaCurto = (iso) => { const d = dt(iso); return DIAS[d.getDay()] + ', ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
  const diaNum = (iso) => { const [a, m, d] = iso.split('-'); return d + '/' + m + '/' + a; };
  const diaMes = (iso) => { const [, m, d] = iso.split('-'); return d + '/' + m; };
  const isoHoje = () => HOJE.getFullYear() + '-' + String(HOJE.getMonth() + 1).padStart(2, '0') + '-' + String(HOJE.getDate()).padStart(2, '0');
  const horas = (min) => Math.floor(min / 60) + 'h' + String(min % 60).padStart(2, '0');
  const cidade = (c) => (AEROPORTOS[c] || [c])[0];
  const aeroporto = (c) => AEROPORTOS[c] ? AEROPORTOS[c][0] + ' · ' + AEROPORTOS[c][1] : c;
  const nomeCia = (c) => CIAS[c] || c;
  const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
  const titulo = (s) => String(s || '').toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das|E)\b/g, m => m.toLowerCase());

  function aviso(txt) {
    const el = $('#aviso');
    el.textContent = txt; el.classList.add('on');
    clearTimeout(aviso.t); aviso.t = setTimeout(() => el.classList.remove('on'), 3200);
  }
  async function copia(txt, ok) {
    try { await navigator.clipboard.writeText(txt); aviso(ok || 'Copiado'); }
    catch (e) {
      const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select();
      document.execCommand('copy'); t.remove(); aviso(ok || 'Copiado');
    }
  }
  const ICO = {
    aviao: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0v5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" fill="currentColor"/></svg>',
    ok: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alerta: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v8M10 15.5v.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    nao: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    ponto: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3" fill="currentColor"/></svg>',
  };

  /* ---------- estado ---------- */
  /* pacote de grupo (Inhotim, Albânia...): preço por quarto, o que inclui, hotéis, roteiro e passeios opcionais */
  const pacVazio = () => ({ titulo: '', minimo: '', moeda: 'EUR',
    precos: [{ valor: '', rotulo: 'Quarto individual' }, { valor: '', rotulo: 'Quarto duplo por pessoa' }],
    inclui: '', hoteis: [], dias: [], opcionais: [], obs: '' });
  const novaCot = () => ({ id: uid(), destino: '', cliente: '', clienteId: '', pax: 2, criada: isoHoje(), opcoes: [], capa: '', tipo: 'aereo', pac: pacVazio() });
  const novoVou = () => ({ id: uid(), cliente: '', hotel: '', endereco: '', fone: '', estrelas: 0, cidade: '', foto: '', checkin: '', checkout: '', horaIn: '15:00', horaOut: '12:00',
    regime: 'com café da manhã', quartos: [{ tipo: 'SINGLE', hospedes: [''], obs: '' }], info: '', ativo: 0, criado: isoHoje() });
  const vazio = () => ({
    cot: novaCot(), clientes: [], propostas: [], vouchers: [],
    texto: '',
    vou: novoVou(),
    pass: [],
  });
  let E = vazio();
  try { const g = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (g && g.cot && g.vou) E = Object.assign(vazio(), g); } catch (e) { /* começa vazio */ }
  /* o que foi guardado antes do histórico existir ganha os campos novos */
  E.cot = Object.assign(novaCot(), E.cot, { pac: Object.assign(pacVazio(), E.cot.pac || {}) });
  for (const p of E.propostas) if (!p.cot) p.cot = E.cot;   /* a aberta é guardada uma vez só, em E.cot */
  E.vou = Object.assign(novoVou(), E.vou);
  for (const x of E.vouchers) if (!x.vou) x.vou = E.vou;

  /* ---------- clientes e histórico: toda cotação com nome de cliente entra sozinha ---------- */
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const temConteudo = (c) => c.opcoes.length > 0 || (c.tipo === 'pacote' && !!(c.pac.titulo || c.pac.precos.some(x => +x.valor) || c.pac.hoteis.length || c.pac.dias.length));
  function tituloCot(c) {
    if (c.tipo === 'pacote') return c.pac.titulo || 'Pacote ' + (c.destino || '');
    const cias = [...new Set(c.opcoes.map(o => nomeCia(o.cia)))];
    return 'Aéreo ' + (c.destino || '') + (cias.length ? ' · ' + cias.join(', ') : '');
  }
  function resumoCot(c) {
    if (c.tipo === 'pacote') { const v = c.pac.precos.map(x => +x.valor).filter(Boolean); return v.length ? 'a partir de ' + dinheiro(Math.min(...v), c.pac.moeda) : ''; }
    const v = c.opcoes.flatMap(o => o.tarifas.map(precoFinal)); return v.length ? 'a partir de ' + usd(Math.min(...v)) + ' por pessoa' : '';
  }
  function arquiva() {
    const c = E.cot, nome = (c.cliente || '').trim();
    if (!nome || !temConteudo(c)) return;
    let cli = E.clientes.find(x => x.id === c.clienteId);
    const igual = E.clientes.find(x => norm(x.nome) === norm(nome));
    if (!cli || norm(cli.nome) !== norm(nome)) {
      /* o nome mudou (ou ainda está sendo digitado): vai para quem já tem esse nome, ou o cadastro acompanha o nome novo */
      const so = cli && !E.propostas.some(p => p.clienteId === cli.id && p.id !== c.id);
      if (igual) { if (so) E.clientes = E.clientes.filter(x => x.id !== cli.id); cli = igual; }
      else if (so) cli.nome = nome;
      else { cli = { id: uid(), nome, fone: '', email: '', obs: '', criado: isoHoje() }; E.clientes.push(cli); }
    }
    c.clienteId = cli.id;
    let p = E.propostas.find(x => x.id === c.id);
    if (!p) { p = { id: c.id, criada: c.criada }; E.propostas.push(p); }
    Object.assign(p, { clienteId: cli.id, cot: c, tipo: c.tipo, titulo: tituloCot(c), resumo: resumoCot(c), atualizada: new Date().toISOString() });
  }
  /* voucher com hotel e pelo menos um hóspede entra sozinho no histórico; dá para abrir e mudar depois */
  const temVoucher = (v) => !!(v.hotel || '').trim() && v.quartos.some(q => q.hospedes.some(h => (h || '').trim()));
  function arquivaVoucher() {
    const v = E.vou;
    if (!temVoucher(v)) return;
    let x = E.vouchers.find(y => y.id === v.id);
    if (!x) { x = { id: v.id, criado: v.criado || isoHoje() }; E.vouchers.push(x); }
    const nomes = v.quartos.flatMap(q => q.hospedes.slice(0, camas(q.tipo))).map(h => (h || '').trim()).filter(Boolean);
    Object.assign(x, { vou: v, hotel: v.hotel, cliente: (v.cliente || '').trim(), hospedes: nomes, checkin: v.checkin, checkout: v.checkout,
      quartos: v.quartos.length, atualizado: new Date().toISOString() });
  }
  const salva = () => {
    arquiva(); arquivaVoucher();
    /* o que está aberto mora em E.cot / E.vou; no histórico não é gravado de novo (as fotos ocupariam o dobro) */
    const copia = Object.assign({}, E, { propostas: E.propostas.map(p => p.cot === E.cot ? Object.assign({}, p, { cot: null }) : p),
      vouchers: E.vouchers.map(x => x.vou === E.vou ? Object.assign({}, x, { vou: null }) : x) });
    try { localStorage.setItem(CHAVE, JSON.stringify(copia)); }
    catch (e) { if (!salva.avisou) { salva.avisou = true; setTimeout(() => aviso('O navegador ficou sem espaço (fotos demais). O que você mudou agora vale até fechar a página.'), 0); } }
  };
  function abreCot(c, para) { E.cot = c; R = null; E.texto = ''; salva(); const h = para || '#/proposta'; if (location.hash === h) rota(); else location.hash = h; }

  /* rascunho da leitura atual (o que foi colado e ainda não entrou na proposta) */
  let R = null;

  /* ---------- regras de negócio da cotação ---------- */
  const chaveVoos = (segs) => segs.map(s => s.cia + s.voo + s.data).join('|');
  const precoFinal = (t) => t.baseUSD + (+t.taxaUSD || 0) + (+t.feeUSD || 0);
  const pctBr = (n) => String(n).replace('.', ',') + '%';

  /* A CNT é a consolidadora por onde ele emite. Dela vêm duas coisas:
     o parcelamento de cada companhia (página pública, retrato em cnt-regras.js) e
     o fee/incentivo (área com senha, retrato em privado/cnt-condicoes.js, que pode não existir). */
  const TEM_CNT = typeof CNT !== 'undefined';
  const REGRAS = typeof CNT_REGRAS !== 'undefined' ? CNT_REGRAS : null;
  /* tabela de fee: a que ele colou na tela CNT vale mais que o retrato que veio com o protótipo */
  const CHAVE_FEE = 'ademir_cnt_fee_v1';
  const FEE_ARQUIVO = typeof CNT_CONDICOES !== 'undefined' ? CNT_CONDICOES : null;
  let FEE = { atual: null, anterior: null };
  try { const g = JSON.parse(localStorage.getItem(CHAVE_FEE) || 'null'); if (g && g.atual && g.atual.cias) FEE = { atual: g.atual, anterior: g.anterior || null }; } catch (e) { /* segue com o retrato */ }
  const conds = () => FEE.atual || FEE_ARQUIVO;
  function salvaFee() {
    try { localStorage.setItem(CHAVE_FEE, JSON.stringify(FEE)); return true; }
    catch (e) { aviso('Não consegui guardar a tabela neste navegador. Ela vale até você fechar a página.'); return false; }
  }
  const FUSO_BR = /^America\/(Sao_Paulo|Bahia|Recife|Fortaleza|Belem|Manaus|Cuiaba|Campo_Grande|Maceio|Porto_Velho|Boa_Vista|Rio_Branco|Araguaina|Santarem|Noronha)$/;
  const soBrasil = (segs) => segs.length > 0 && segs.every(s => [s.origem, s.destino].every(c => AEROPORTOS[c] && FUSO_BR.test(AEROPORTOS[c][2])));
  function cntDa(l) {
    const p = TEM_CNT && REGRAS && l.cia ? CNT.sugere(REGRAS, l.cia, { canal: 'GDS', internacional: !soBrasil(l.segmentos) }) : null;
    const C = conds(), cond = TEM_CNT && C && C.cias[l.cia] ? C.cias[l.cia].linhas : null;
    return { p, cond, feeUnico: cond ? CNT.feeUnico(cond) : null };
  }

  function rascunhoDe(texto, extra) {
    const l = Amadeus.ler(texto, { hoje: HOJE });
    if (!l.segmentos.length && !l.tarifa.total) return { l, vazio: true };
    const pre = AG.porCia[l.cia] || AG.padrao;
    const cnt = cntDa(l), temRegra = !!(cnt.p && cnt.p.regra);
    const exec = /Executiva|Primeira/.test(l.cabine);
    const canc = l.regras.cancelamento || (l.tarifa.naoReembolsavel === true ? { tipo: 'proibido' } : l.tarifa.naoReembolsavel === false ? { tipo: 'livre' } : null);
    const assentoBRL = extra && extra.assentoBRL != null ? extra.assentoBRL : null;
    return {
      l, cnt, baseUSD: Amadeus.totalUSD(l.tarifa), taxaUSD: pre.taxaUSD, cabine: l.cabine,
      /* fee: entra sozinho quando toda linha da companhia tem o mesmo valor; senão ele marca a linha */
      feeUSD: cnt.feeUnico != null ? cnt.feeUnico : (extra && +extra.feeUSD) || 0, condIdx: -1,   /* sem a tabela de fee, o exemplo traz o dele */
      pecas: l.tarifa.semBagagem ? 0 : (l.tarifa.pecas || 1), kg: l.tarifa.quilos || (exec ? 32 : 23),
      rotulo: Amadeus.rotuloFamilia(l.tarifa.familia),
      /* parcelas: o que a CNT escreve. "Sem juros" só sai marcado se a CNT disser; sem a CNT, fica o costume dele */
      parcelas: temRegra && cnt.p.parcelas > 1 ? cnt.p.parcelas : 0, semJuros: temRegra ? cnt.p.semJuros === true : true,
      alteracao: l.regras.alteracao, cancelamento: canc,
      assento: assentoBRL == null ? 'nao' : assentoBRL > 0 ? 'pago' : 'gratis', assentoBRL: assentoBRL || 0,
    };
  }

  function condicoes(t) {
    const c = [];
    if (t.parcelas > 1) c.push({ k: 'ponto', txt: 'Tarifa pode ser parcelada em até ' + t.parcelas + ' vezes' + (t.semJuros === false ? '' : ' sem juros') + ', taxas à vista' });
    if (AG.cartaoPct) c.push({ k: 'ponto', txt: 'Pagamento com cartão: acréscimo de ' + String(AG.cartaoPct).replace('.', ',') + '%' });
    const a = t.alteracao;
    if (a && a.tipo === 'multa') c.push({ k: 'alerta', txt: a.moeda + ' ' + Math.round(a.valor) + ' de multa em caso de alteração + eventual diferença tarifária' });
    else if (a && a.tipo === 'livre') c.push({ k: 'ok', txt: 'Tarifa isenta de multa em caso de alteração, exceto diferença tarifária' });
    else if (a && a.tipo === 'proibido') c.push({ k: 'nao', txt: 'Tarifa não permite alteração' });
    const r = t.cancelamento;
    if (r && r.tipo === 'proibido') c.push({ k: 'nao', txt: 'Tarifa não reembolsável' });
    else if (r && r.tipo === 'livre') c.push({ k: 'ok', txt: 'Tarifa reembolsável' });
    else if (r && r.tipo === 'multa') c.push({ k: 'alerta', txt: 'Reembolso com multa de ' + r.moeda + ' ' + Math.round(r.valor) });
    if (t.assento === 'gratis') c.push({ k: 'ok', txt: 'Marcação de assentos gratuita' });
    else if (t.assento === 'pago' && t.assentoUSD) c.push({ k: 'alerta', txt: 'Marcação de assentos não gratuita: ' + usd(t.assentoUSD) + ' por assento' });
    return c;
  }
  const fraseMalas = (t) => t.pecas > 0 ? plural(t.pecas, 'bagagem', 'bagagens') + ' de ' + t.kg + ' kg' : 'sem bagagem despachada';
  const fraseMalasPessoa = (t) => t.pecas > 0 ? fraseMalas(t) + ' por pessoa' : 'Sem bagagem despachada';

  function tarifaDoRascunho() {
    const t = R.l.tarifa;
    return {
      id: uid(), familia: t.familia, rotulo: R.rotulo || 'Tarifa', baseUSD: R.baseUSD, taxaUSD: +R.taxaUSD || 0, feeUSD: +R.feeUSD || 0, cabine: R.cabine,
      pecas: R.pecas === '' || R.pecas == null || isNaN(+R.pecas) ? 1 : Math.max(0, +R.pecas), kg: +R.kg || 23, parcelas: +R.parcelas || 0, semJuros: !!R.semJuros, alteracao: R.alteracao, cancelamento: R.cancelamento,
      assento: R.assento, assentoUSD: R.assento === 'pago' ? Amadeus.paraUSD(+R.assentoBRL || 0, t.bsr) : 0, emitirAte: t.emitirAte,
    };
  }
  function opcaoIgual() { return R && !R.vazio ? E.cot.opcoes.find(o => o.chave === chaveVoos(R.l.segmentos)) : null; }

  function adicionaVoosPacote() {
    if (!R || R.vazio || !R.l.segmentos.length) return false;
    if (!opcaoIgual()) E.cot.opcoes.push({ id: uid(), cia: R.l.cia, chave: chaveVoos(R.l.segmentos), segmentos: R.l.segmentos, tarifas: [] });
    if (!E.cot.destino) { const tr = Amadeus.trechos(R.l.segmentos, AEROPORTOS); E.cot.destino = cidade(tr[0].segmentos[tr[0].segmentos.length - 1].destino); }
    salva(); return true;
  }
  function adicionaRascunho() {
    if (!R || R.vazio || !R.l.segmentos.length || !R.baseUSD) return false;
    const nova = tarifaDoRascunho();
    let o = opcaoIgual();
    if (o) {
      const i = o.tarifas.findIndex(x => x.familia && x.familia === nova.familia);
      if (i >= 0) o.tarifas[i] = nova; else o.tarifas.push(nova);
      o.tarifas.sort((a, b) => precoFinal(a) - precoFinal(b));
    } else {
      o = { id: uid(), cia: R.l.cia, chave: chaveVoos(R.l.segmentos), segmentos: R.l.segmentos, tarifas: [nova] };
      E.cot.opcoes.push(o);
    }
    if (!E.cot.destino) { const tr = Amadeus.trechos(R.l.segmentos, AEROPORTOS); E.cot.destino = cidade(tr[0].segmentos[tr[0].segmentos.length - 1].destino); }
    if (R.l.pax) E.cot.pax = R.l.pax;
    salva();
    return true;
  }

  function montaExemploInteiro() {
    /* a data é a do vídeo dele, para a cotação e os prazos das tarifas contarem a mesma história */
    E.cot = Object.assign(novaCot(), { cliente: 'Rafael Monteiro', criada: '2026-11-09' });
    for (const t of EXEMPLOS.telas) { R = rascunhoDe(t.texto, t); adicionaRascunho(); }
    R = null; E.texto = ''; salva();
  }

  /* ---------- blocos de voo (usados no painel e na proposta) ---------- */
  function resumoTrecho(tr) {
    const a = tr.segmentos[0], z = tr.segmentos[tr.segmentos.length - 1];
    const voo = tr.segmentos.reduce((s, x) => s + Amadeus.duracaoMin(x, AEROPORTOS), 0), total = voo + tr.esperas.reduce((s, x) => s + x, 0);
    const n = tr.segmentos.length - 1;
    return { a, z, total, paradas: n, onde: tr.segmentos.slice(0, -1).map(s => cidade(s.destino)).join(' e ') };
  }
  function pernasHtml(tr) {
    return tr.segmentos.map((s, i) => {
      const dur = Amadeus.duracaoMin(s, AEROPORTOS), mais = s.dataChegada !== s.data;
      return `<div class="perna">
        <div class="ponta"><b class="iata">${esc(s.origem)}</b><span class="hora">${esc(s.sai)}</span><span class="onde">${esc(aeroporto(s.origem))}</span></div>
        <div class="linha-voo"><span class="dur">${dur ? horas(dur) : ''}</span><span class="traco"><i>${ICO.aviao}</i></span><span class="num">${esc(nomeCia(s.cia))} ${esc(s.voo)}${AERONAVES[s.aeronave] ? ' · ' + esc(AERONAVES[s.aeronave]) : ''}</span></div>
        <div class="ponta fim"><b class="iata">${esc(s.destino)}</b><span class="hora">${esc(s.chega)}${mais ? '<sup title="chega no dia seguinte">+1</sup>' : ''}</span><span class="onde">${esc(aeroporto(s.destino))}</span></div>
      </div>` + (i < tr.esperas.length ? `<div class="conexao">Conexão em ${esc(cidade(s.destino))} · espera de ${horas(tr.esperas[i])}</div>` : '');
    }).join('');
  }
  function trechoHtml(tr, rotulo) {
    const r = resumoTrecho(tr), pernas = pernasHtml(tr);
    return `<section class="trecho">
      <header><span class="rot">${esc(rotulo)}</span><span class="quando">${esc(diaCurto(r.a.data))}</span>
        <span class="tipo ${r.paradas ? '' : 'direto'}">${r.paradas ? plural(r.paradas, 'conexão', 'conexões') + ' em ' + esc(r.onde) : 'Voo direto'}${r.total ? ' · ' + horas(r.total) + (r.paradas ? ' no total' : '') : ''}</span></header>
      ${pernas}</section>`;
  }
  const rotulosTrechos = (trs) => trs.map((x, i) => trs.length === 2 ? (i ? 'Volta' : 'Ida') : 'Trecho ' + (i + 1));

  /* =====================================================================
     TELA 1 — COTAÇÃO
     ===================================================================== */
  function telaCotacao() {
    const ex = EXEMPLOS.telas.map(t => `<button class="chip" data-ex="${t.id}">${esc(t.nome)}</button>`).join('');
    const pacote = E.cot.tipo === 'pacote';
    $('#palco').innerHTML = `
    <div class="tipo-cot" role="radiogroup" aria-label="Tipo de cotação">
      <button class="tipo${pacote ? '' : ' on'}" data-tipo-cot="aereo" role="radio" aria-checked="${!pacote}"><b>Só aéreo</b><span>Voos e tarifas para o cliente escolher</span></button>
      <button class="tipo${pacote ? ' on' : ''}" data-tipo-cot="pacote" role="radio" aria-checked="${pacote}"><b>Pacote ou grupo</b><span>Valor por quarto, hotéis, roteiro e passeios</span></button>
      <button class="btn fantasma" id="nova-cot">Nova cotação</button>
    </div>
    ${pacote ? '<section class="pac" id="pac"></section>' : ''}
    <div class="cot">
      <section class="col-term">
        <h1>${pacote ? 'Aéreo proposto: cole a tela do Amadeus' : 'Cole aqui a tela do Amadeus'}</h1>
        <p class="sub">${pacote ? 'Basta o <kbd>RT</kbd>: os voos entram no pacote sem preço separado.' : 'Pode colar tudo de uma vez: <kbd>RT</kbd>, <kbd>TQT</kbd>, <kbd>FXB</kbd> e <kbd>FQN1*PE</kbd>. Eu separo os voos, o preço e as regras.'}</p>
        <div class="terminal">
          <div class="term-barra"><span>SAOXX0000 · Página de comando</span><button class="term-limpa" id="limpa">Limpar</button></div>
          <textarea id="tela" spellcheck="false" autocomplete="off" aria-label="Tela do Amadeus" placeholder="&gt; rt&#10;&gt; tqt&#10;&gt; fqn1*pe&#10;&#10;Selecione tudo no terminal (Ctrl+A), copie e cole aqui.">${esc(E.texto)}</textarea>
        </div>
        <div class="exemplos"><span>Sem o Amadeus aberto? Use uma tela do vídeo:</span>${ex}</div>
      </section>
      <section class="col-lido" id="lido" aria-live="polite"></section>
    </div>
    <section class="montagem" id="montagem"></section>`;

    $$('[data-tipo-cot]').forEach(b => b.onclick = () => { E.cot.tipo = b.dataset.tipoCot; salva(); telaCotacao(); });
    $('#nova-cot').onclick = () => { const tipo = E.cot.tipo; E.cot = novaCot(); E.cot.tipo = tipo; R = null; E.texto = ''; salva(); telaCotacao(); aviso('Cotação nova em branco. A anterior está guardada em Clientes.'); };
    if (pacote) pintaPacote();
    const tela = $('#tela');
    let t;
    tela.addEventListener('input', () => { E.texto = tela.value; clearTimeout(t); t = setTimeout(() => { R = rascunhoDe(tela.value); pintaLido(); salva(); }, 180); });
    $('#limpa').onclick = () => { tela.value = ''; E.texto = ''; R = null; pintaLido(); salva(); tela.focus(); };
    $$('[data-ex]').forEach(b => b.onclick = () => {
      const x = EXEMPLOS.telas.find(v => v.id === b.dataset.ex);
      tela.value = x.texto; E.texto = x.texto; R = rascunhoDe(x.texto, x); pintaLido(); salva();
      tela.scrollTop = 0;
    });
    if (E.texto && !R) R = rascunhoDe(E.texto);
    pintaLido(); pintaMontagem();
  }

  function pintaLido() {
    const el = $('#lido'); if (!el) return;
    if (!R || R.vazio) {
      el.innerHTML = `<div class="vazio"><h2>O que eu li</h2>
        <p>${R && R.vazio ? 'Não achei voo nem preço nesse texto. Confira se copiou a tela do <kbd>RT</kbd> e do <kbd>TQT</kbd>.' : 'Cole a tela ao lado e a cotação aparece aqui, pronta: voos traduzidos, preço em dólar com a sua taxa, e as regras da tarifa em português.'}</p>
        <ol class="troca"><li><s>Converter no EasyPNR</s></li><li><s>Exportar para o Word, passar pelo Excel</s></li><li><s>Ajustar a tabela à mão</s></li><li><s>Digitar o FQC para achar o dólar</s></li><li><s>Ler a regra em inglês e escrever em português</s></li></ol>
      </div>`;
      return;
    }
    const l = R.l, t = l.tarifa, trs = Amadeus.trechos(l.segmentos, AEROPORTOS), rots = rotulosTrechos(trs);
    if (E.cot.tipo === 'pacote') {
      const ja = opcaoIgual();
      el.innerHTML = `<div class="lido-topo"><h2>O que eu li</h2><span class="cia-tag">${esc(nomeCia(l.cia))}</span></div>
        <div class="voos">${trs.map((x, i) => trechoHtml(x, rots[i])).join('')}</div>
        ${l.segmentos.length ? `<button class="btn primario" id="add-voos"${ja ? ' disabled' : ''}>${ja ? 'Estes voos já estão no pacote' : 'Usar estes voos no pacote'}</button>` : '<p class="alerta">Não achei os voos. Cole a tela do RT.</p>'}`;
      const b = $('#add-voos');
      if (b && !ja) b.onclick = () => { if (adicionaVoosPacote()) { aviso('Voos no pacote'); R = null; E.texto = ''; $('#tela').value = ''; salva(); pintaLido(); pintaMontagem(); } };
      return;
    }
    const igual = opcaoIgual();
    const avisos = l.avisos.map(a => `<p class="alerta">${esc(a)}</p>`).join('');
    const up = t.upsell && t.bsr ? `<li>Subir de ${esc(t.upsell.de)} para ${esc(t.upsell.para)} custa ${brl(t.upsell.valor)} (${usd(Amadeus.paraUSD(t.upsell.valor, t.bsr))}) por pessoa.</li>` : '';
    const prazo = t.emitirAte ? `<li>O Amadeus segura este preço até <b>${diaMes(t.emitirAte.data)} às ${t.emitirAte.hora}</b>.</li>` : '';
    el.innerHTML = `
      <div class="lido-topo"><h2>O que eu li</h2><span class="cia-tag">${esc(nomeCia(l.cia))}${t.familia ? ' · ' + esc(t.familia) : ''}</span></div>
      ${avisos}
      <div class="voos">${trs.map((x, i) => trechoHtml(x, rots[i])).join('')}</div>
      ${t.total ? `
      <div class="conta" aria-label="Conta do preço">
        <div><span>Tarifa</span><b>${t.base ? esc(t.moeda) + ' ' + t.base.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : brl(t.equiv)}</b></div>
        <div><span>Taxas</span><b>${brl(t.taxasTotal)}</b></div>
        <div><span>Total no Amadeus, por pessoa</span><b>${t.totalMoeda === 'BRL' ? brl(t.total) : esc(t.totalMoeda) + ' ' + t.total}</b></div>
        <div><span>Câmbio do Amadeus (BSR)</span><b>${t.bsr ? String(t.bsr).replace('.', ',') : '—'}</b></div>
        <div class="soma"><span>Em dólar, como o FQC arredonda</span><b>${R.baseUSD ? usd(R.baseUSD) : '—'}</b></div>
        <label class="fee"><span>Fee da CNT por pessoa<em id="fee-dica"></em></span><span class="campo-usd">USD <input id="f-fee" type="number" inputmode="numeric" min="0" step="5" value="${esc(R.feeUSD)}"></span></label>
        <label class="taxa"><span>Sua taxa por pessoa</span><span class="campo-usd">USD <input id="f-taxa" type="number" inputmode="numeric" min="0" step="10" value="${esc(R.taxaUSD)}"></span></label>
        <div class="final"><span>Preço para o cliente</span><b id="final"></b></div>
      </div>
      <div class="ajustes">
        <label>Nome da tarifa<input id="f-rotulo" value="${esc(R.rotulo)}"></label>
        <label>Cabine<select id="f-cabine">${['Cabine Econômica', 'Premium Economy', 'Cabine Executiva', 'Primeira classe'].map(c => `<option${c === R.cabine ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
        <label>Malas<span class="dupla"><input id="f-pecas" type="number" min="0" max="4" value="${R.pecas}"> de <input id="f-kg" type="number" min="10" max="40" value="${R.kg}"> kg</span></label>
        <div class="campo"><label for="f-parcelas">Parcelas</label><span class="dupla"><input id="f-parcelas" type="number" min="0" max="12" value="${R.parcelas}">
          <label class="marca" for="f-semjuros"><input id="f-semjuros" type="checkbox"${R.semJuros ? ' checked' : ''}> sem juros</label></span></div>
        <label class="largo">Marcação de assento<span class="dupla">
          <select id="f-assento"><option value="nao"${R.assento === 'nao' ? ' selected' : ''}>Não citar</option><option value="gratis"${R.assento === 'gratis' ? ' selected' : ''}>Gratuita</option><option value="pago"${R.assento === 'pago' ? ' selected' : ''}>Paga</option></select>
          <span id="assento-valor"${R.assento === 'pago' ? '' : ' hidden'}>R$ <input id="f-assentobrl" type="number" min="0" step="0.01" value="${R.assentoBRL || ''}" placeholder="valor no mapa"> <em id="assento-usd"></em></span></span></label>
      </div>
      ${cntHtml()}
      <div class="previa"><h3>Como vai sair na proposta</h3><div id="previa"></div></div>
      ${prazo || up ? `<ul class="so-voce"><li class="tit">Só para você</li>${prazo}${up}</ul>` : ''}
      <button class="btn primario" id="add">${igual ? 'Adicionar como outra tarifa da ' + esc(nomeOpcao(igual)) : 'Adicionar à proposta como nova opção'}</button>` : ''}`;

    const liga = (id, campo, numero) => { const c = $('#' + id); if (c) c.oninput = () => { R[campo] = numero ? +c.value : c.value; pintaPrevia(); }; };
    liga('f-taxa', 'taxaUSD', true); liga('f-rotulo', 'rotulo'); liga('f-cabine', 'cabine'); liga('f-pecas', 'pecas', true);
    liga('f-kg', 'kg', true); liga('f-parcelas', 'parcelas', true); liga('f-assentobrl', 'assentoBRL', true); liga('f-fee', 'feeUSD', true);
    const sj = $('#f-semjuros');
    if (sj) sj.onchange = () => { R.semJuros = sj.checked; pintaPrevia(); };
    $$('[name=cnt-cond]').forEach(r => r.onchange = () => {
      R.condIdx = +r.value; R.feeUSD = R.cnt.cond[R.condIdx].fee;
      const f = $('#f-fee'); if (f) f.value = R.feeUSD;
      pintaLinhaCnt(); pintaPrevia();
    });
    pintaLinhaCnt();
    const fa = $('#f-assento');
    if (fa) fa.onchange = () => { R.assento = fa.value; $('#assento-valor').hidden = fa.value !== 'pago'; pintaPrevia(); };
    const add = $('#add');
    if (add) add.onclick = () => {
      if (R.cnt && R.cnt.cond && R.cnt.feeUnico == null && R.condIdx < 0) {   /* sem a linha marcada o fee sairia 0 sem ele perceber */
        aviso('Antes, marque a linha da tabela da CNT que vale para esta cotação.');
        const b = $('.cnt-linhas'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (adicionaRascunho()) { aviso('Entrou na proposta'); R = null; E.texto = ''; $('#tela').value = ''; salva(); pintaLido(); pintaMontagem(); $('#montagem').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    };
    pintaPrevia();
  }

  /* bloco "CNT · companhia" da cotação: de onde saíram as parcelas e o fee */
  function cntHtml() {
    const c = R.cnt; if (!c || (!c.p && !c.cond)) return '';
    const p = c.p, nome = nomeCia(R.l.cia);
    let parc = '', cond = '', tudo = '';
    if (p && p.regra) {
      const fiz = p.parcelas > 1 ? `Preenchi <b>${p.parcelas} parcelas${p.semJuros ? ' sem juros' : ''}</b>.`
        : p.parcelas === 0 ? 'Pelo texto, esta companhia <b>não parcela</b>.' : 'A CNT <b>não informa</b> o parcelamento desta companhia. Preencha à mão se souber.';
      const juros = !(p.parcelas > 1) ? '' : p.semJuros == null ? ' A CNT não diz se tem juros, então deixei “sem juros” desmarcado.' : p.semJuros === false ? ' Pela tabela de códigos, este parcelamento <b>tem juros</b>.' : '';
      const r = p.regra;
      parc = `<div class="cnt-item"><h4>Parcelamento</h4>
        ${p.texto && p.texto !== '-' ? `<blockquote>${esc(p.texto)}</blockquote>` : ''}
        <p>${fiz}${juros}${p.codigos.length ? ` Código para a emissão: <b class="cod">${esc(p.codigos.join(' · '))}</b>.` : ''}</p>
        ${p.duvida ? `<p class="alerta">${esc(p.duvida)}</p>` : ''}
        ${p.cartao ? `<p class="cnt-nota">Acréscimo de cartão na CNT: ${esc(p.cartao)}. Na proposta sai o seu número (${pctBr(AG.cartaoPct)}).</p>` : ''}</div>`;
      tudo = `<details class="cnt-tudo"><summary>Todas as regras de pagamento da ${esc(nome)}</summary>
        <dl>${r.linhas.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b).replace(/\n/g, '<br>')}</dd>`).join('')}</dl>
        ${r.planos.length ? `<p class="cnt-aviso"><b>Códigos:</b> ${r.planos.map(x => esc(x.codigo) + ' até ' + x.max + 'x' + (x.juros === false ? ' sem juros' : x.juros === true ? ' com juros' : '')).join(' · ')}</p>` : ''}
        ${r.notasPlano.concat(r.avisos).map(a => `<p class="cnt-aviso">${esc(a).replace(/\n/g, '<br>')}</p>`).join('')}
        <p class="cnt-aviso"><a href="${esc(p.fonte)}" target="_blank" rel="noopener">Abrir a página da CNT</a></p></details>`;
    } else if (p) parc = `<div class="cnt-item"><h4>Parcelamento</h4><p>A CNT não lista a ${esc(nome)} na página de parcelamento. Preencha as parcelas à mão.</p></div>`;
    if (c.cond) {
      const unico = c.feeUnico != null;
      const lista = c.cond.map((x, i) => {
        const ganho = [x.incentivo ? 'incentivo ' + pctBr(x.incentivo) : '', x.comissao ? 'comissão ' + pctBr(x.comissao) : ''].filter(Boolean).join(' · ');
        const miolo = `<span class="desc">${esc(x.descricao)}</span><span class="nums"><b>fee ${x.fee}</b>${ganho ? `<i>${ganho}</i>` : ''}</span>`;
        return unico ? `<li class="cnt-linha">${miolo}</li>` : `<label class="cnt-linha"><input type="radio" name="cnt-cond" value="${i}"${R.condIdx === i ? ' checked' : ''}>${miolo}</label>`;
      }).join('');
      cond = `<div class="cnt-item"><h4>Fee e incentivo</h4>` + (unico
        ? `<p>${c.feeUnico > 0 ? `Toda linha da ${esc(nome)} tem fee de <b>USD ${c.feeUnico}</b> por bilhete. Já somei ao preço.` : `A ${esc(nome)} não tem fee em nenhuma linha.`}</p>
           <details><summary>Ver ${c.cond.length === 1 ? 'a linha' : 'as ' + c.cond.length + ' linhas'} da tabela</summary><ul class="cnt-linhas">${lista}</ul></details>`
        : `<p>Na ${esc(nome)} o fee muda com a rota e a classe. Marque a linha que vale para esta cotação e eu somo.</p>
           <div class="cnt-linhas" role="radiogroup" aria-label="Linha da tabela da CNT">${lista}</div><p class="cnt-ganho" id="cnt-ganho" aria-live="polite"></p>`) + `</div>`;
    }
    const lido = [p && p.regra && p.lidoEm ? 'parcelamento lido em ' + diaNum(p.lidoEm) : '', c.cond && conds().lidoEm ? 'fee lido em ' + diaNum(conds().lidoEm) : ''].filter(Boolean).join(' · ');
    return `<section class="cnt" aria-label="Regras da CNT para ${esc(nome)}"><header><h3>CNT · ${esc(nome)}</h3><span>${lido} · <a href="#/cnt">atualizar</a></span></header>${parc}${cond}${tudo}</section>`;
  }
  /* o que muda quando ele marca (ou ainda não marcou) a linha da tabela de fee */
  function pintaLinhaCnt() {
    const c = R && R.cnt, dica = $('#fee-dica'), ganho = $('#cnt-ganho');
    if (!c) return;
    const falta = c.cond && c.feeUnico == null && R.condIdx < 0;
    if (dica) dica.textContent = falta ? 'marque a linha da CNT abaixo' : '';
    if (!ganho) return;
    if (R.condIdx < 0) { ganho.textContent = ''; return; }
    const x = c.cond[R.condIdx];
    ganho.textContent = (x.fee ? 'Somei USD ' + x.fee + ' de fee ao preço.' : 'Nesta linha não há fee.')
      + (x.incentivo ? ' A CNT paga a você ' + pctBr(x.incentivo) + ' de incentivo sobre a tarifa.' : '')
      + (x.comissao ? ' Comissão de ' + pctBr(x.comissao) + '.' : '');
  }

  function pintaPrevia() {
    const p = $('#previa'); if (!p || !R || R.vazio) return;
    const t = tarifaDoRascunho(), pax = R.l.pax || E.cot.pax || 1;
    const f = $('#final'); if (f) f.innerHTML = usd(precoFinal(t)) + ' <small>por pessoa · ' + usd(precoFinal(t) * pax) + ' para ' + pax + '</small>';
    const au = $('#assento-usd'); if (au) au.textContent = t.assentoUSD ? '= ' + usd(t.assentoUSD) : '';
    p.innerHTML = `<p class="preco-frase"><b>${usd(precoFinal(t))}</b> total por pessoa · ${esc(t.cabine)} · ${esc(fraseMalas(t))}</p>
      <ul class="cond">${condicoes(t).map(c => `<li class="${c.k}"><i>${ICO[c.k]}</i>${esc(c.txt)}</li>`).join('')}<li class="ponto"><i>${ICO.ponto}</i>${esc(AG.aviso)}</li></ul>`;
  }

  const nomeOpcao = (o) => 'Opção ' + (E.cot.opcoes.indexOf(o) + 1) + ' · ' + nomeCia(o.cia);

  /* o pacote: cada campo grava sozinho; listas (valores, hotéis, dias, passeios) têm + e Tirar */
  const MOEDAS = [['EUR', 'Euro (€)'], ['BRL', 'Real (R$)'], ['USD', 'Dólar (USD)']];
  function pegaCaminho(o, cam) { return cam.split('.').reduce((x, k) => x == null ? x : x[k], o); }
  function poeCaminho(o, cam, v) { const k = cam.split('.'), u = k.pop(); k.reduce((x, y) => x[y], o)[u] = v; }
  function campo(cam, rot, extra) {
    extra = extra || {};
    const v = pegaCaminho(E.cot.pac, cam);
    const at = `data-pac="${cam}" ${extra.ph ? `placeholder="${esc(extra.ph)}"` : ''}`;
    const ctl = extra.area ? `<textarea ${at} rows="${extra.area}">${esc(v || '')}</textarea>`
      : `<input ${at} value="${esc(v == null ? '' : v)}"${extra.num ? ' type="number" inputmode="decimal" min="0" step="any"' : ''}>`;
    return `<label${extra.largo ? ' class="largo"' : ''}>${rot}${extra.dica ? `<em class="dica">${extra.dica}</em>` : ''}${ctl}</label>`;
  }
  function pintaPacote() {
    const el = $('#pac'); if (!el) return;
    const p = E.cot.pac;
    const fotosHotel = (h, i) => `<div class="pac-fotos">${(h.fotos || []).map((f, k) => `<span class="pac-foto" style="background-image:url('${esc(f)}')"><button class="tira" data-tira-foto="${i}.${k}" aria-label="Tirar a foto ${k + 1}">×</button></span>`).join('')}
      ${(h.fotos || []).length < 3 ? `<label class="btn fantasma pac-addfoto">+ foto<input type="file" accept="image/*" data-foto-hotel="${i}" hidden></label>` : ''}</div>`;
    el.innerHTML = `
      <div class="pac-cab"><h1>Pacote ou grupo</h1><button class="btn fantasma" id="pac-ex">Preencher com o exemplo</button></div>
      <div class="pac-grade">
        <section class="cartao"><h2>O pacote</h2>
          <div class="grade2">
            ${campo('titulo', 'Título da proposta', { ph: 'Albânia 2027 – Nome do grupo', largo: true })}
            <label>Destino<input id="pac-destino" value="${esc(E.cot.destino)}" placeholder="Tirana"></label>
            <label>Cliente ou grupo<input id="pac-cliente" value="${esc(E.cot.cliente)}" placeholder="Nome da empresa ou do grupo"></label>
            ${campo('minimo', 'Mínimo de pessoas', { num: true, ph: '15' })}
            <label>Moeda<select data-pac="moeda">${MOEDAS.map(([k, n]) => `<option value="${k}"${p.moeda === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
          </div></section>
        <section class="cartao"><h2>Valores</h2>
          ${p.precos.map((x, i) => `<div class="pac-linha">${campo('precos.' + i + '.valor', 'Valor', { num: true })}${campo('precos.' + i + '.rotulo', 'Para quem', { ph: 'Quarto duplo por pessoa' })}<button class="tira" data-tira-pac="precos.${i}">Tirar</button></div>`).join('')}
          <button class="chip mais" data-mais-pac="precos">+ outro valor</button></section>
        <section class="cartao largo"><h2>O pacote inclui</h2>
          ${campo('inclui', 'Um item por linha', { area: 7, largo: true, ph: 'Aéreo – ITA Airways (sugerido)\n03 noites no Hotel X com café da manhã\nTransporte em todos os deslocamentos\nAcompanhante / Assistência local - Simonetta Viagens\nSeguro-viagem - Cobertura €60.000' })}</section>
        <section class="cartao largo"><h2>Hotéis</h2>
          ${p.hoteis.map((h, i) => `<div class="pac-item"><div class="pac-item-cab"><b>Hotel ${i + 1}</b><button class="tira" data-tira-pac="hoteis.${i}">Tirar</button></div>
            <div class="grade3">
              ${campo('hoteis.' + i + '.nome', 'Nome', { ph: 'Hilton Garden Inn' })}${campo('hoteis.' + i + '.cidade', 'Cidade', { ph: 'Tirana' })}${campo('hoteis.' + i + '.noites', 'Noites', { num: true })}
              ${campo('hoteis.' + i + '.regime', 'Regime', { ph: 'café da manhã' })}${campo('hoteis.' + i + '.endereco', 'Endereço')}${campo('hoteis.' + i + '.site', 'Site', { ph: 'hilton.com' })}
            </div>
            ${campo('hoteis.' + i + '.descricao', 'Descrição', { area: 3, largo: true })}${campo('hoteis.' + i + '.obs', 'Observação', { ph: 'Este hotel não possui beach club.' })}
            ${fotosHotel(h, i)}</div>`).join('')}
          <button class="chip mais" data-mais-pac="hoteis">+ hotel</button></section>
        <section class="cartao largo"><h2>Roteiro dia a dia</h2>
          ${p.dias.map((d, i) => `<div class="pac-item"><div class="pac-item-cab"><b>Dia ${i + 1}</b><button class="tira" data-tira-pac="dias.${i}">Tirar</button></div>
            ${campo('dias.' + i + '.titulo', 'Título do dia', { ph: 'Chegada em Tirana & jantar de boas-vindas', largo: true })}
            ${campo('dias.' + i + '.texto', 'O que acontece, uma linha por atividade', { area: 4, largo: true, ph: 'Recepção no aeroporto e traslado ao hotel\nAlmoço livre\nJantar de boas-vindas (incluído)' })}</div>`).join('')}
          <button class="chip mais" data-mais-pac="dias">+ dia</button></section>
        <section class="cartao largo"><h2>Passeios opcionais</h2>
          ${p.opcionais.map((o, i) => `<div class="pac-item"><div class="pac-item-cab"><b>Passeio ${i + 1}</b><button class="tira" data-tira-pac="opcionais.${i}">Tirar</button></div>
            <div class="grade3">${campo('opcionais.' + i + '.nome', 'Nome', { ph: 'Kruja & o Bazar Otomano' })}${campo('opcionais.' + i + '.preco', 'Preço por pessoa', { num: true })}${campo('opcionais.' + i + '.tipo', 'Duração', { ph: 'Meio dia' })}</div>
            ${campo('opcionais.' + i + '.minimo', 'Condição', { ph: 'mínimo 60 pessoas' })}
            ${campo('opcionais.' + i + '.descricao', 'Descrição', { area: 2, largo: true })}
            ${campo('opcionais.' + i + '.programa', 'Programação, uma linha por horário', { area: 4, largo: true, dica: 'ex.: 08:30 - 09:15 Traslado em ônibus' })}</div>`).join('')}
          <button class="chip mais" data-mais-pac="opcionais">+ passeio</button></section>
        <section class="cartao largo"><h2>Observações finais</h2>
          ${campo('obs', 'Aparece no fim da proposta', { area: 3, largo: true, ph: 'Valores sujeitos à alteração sem aviso prévio.' })}</section>
      </div>`;
    $$('[data-pac]', el).forEach(c => c.addEventListener(c.tagName === 'SELECT' ? 'change' : 'input', () => {
      poeCaminho(E.cot.pac, c.dataset.pac, c.type === 'number' ? (c.value === '' ? '' : +c.value) : c.value); salva(); pintaMontagem();
    }));
    $('#pac-destino').oninput = (e) => { E.cot.destino = e.target.value; salva(); };
    $('#pac-cliente').oninput = (e) => { E.cot.cliente = e.target.value; salva(); pintaMontagem(); };
    const NOVO = { precos: () => ({ valor: '', rotulo: '' }), hoteis: () => ({ nome: '', cidade: '', noites: '', regime: '', endereco: '', site: '', descricao: '', obs: '', fotos: [] }),
      dias: () => ({ titulo: '', texto: '' }), opcionais: () => ({ nome: '', preco: '', tipo: '', minimo: '', descricao: '', programa: '' }) };
    $$('[data-mais-pac]', el).forEach(b => b.onclick = () => { p[b.dataset.maisPac].push(NOVO[b.dataset.maisPac]()); salva(); pintaPacote(); });
    $$('[data-tira-pac]', el).forEach(b => b.onclick = () => { const [k, i] = b.dataset.tiraPac.split('.'); p[k].splice(+i, 1); salva(); pintaPacote(); pintaMontagem(); });
    $$('[data-foto-hotel]', el).forEach(c => c.onchange = () => { const f = c.files[0], h = p.hoteis[+c.dataset.fotoHotel]; if (f) reduzFoto(f, (url) => { (h.fotos = h.fotos || []).push(url); salva(); pintaPacote(); }, 1100); });
    $$('[data-tira-foto]', el).forEach(b => b.onclick = () => { const [i, k] = b.dataset.tiraFoto.split('.').map(Number); p.hoteis[i].fotos.splice(k, 1); salva(); pintaPacote(); });
    $$('[data-pac$=".nome"]', el).forEach(c => { if (!/^hoteis\./.test(c.dataset.pac)) return; c.addEventListener('change', async () => {
      const i = +c.dataset.pac.split('.')[1], h = p.hoteis[i], q = [h.nome, h.cidade].filter(Boolean).join(' ');
      if (h.endereco || q.length < 4) return;   /* só completa o que está vazio */
      try {
        const l = await buscaHotelOnline(q); if (!l.length) return aviso('Não achei esse hotel na base aberta. Preencha à mão.');
        const x = l[0]; h.cidade = h.cidade || x.cidade; h.endereco = x.endereco; h.site = h.site || x.site; salva(); pintaPacote();
        aviso('Achei ' + x.nome + ': endereço' + (x.site ? ' e site' : '') + ' preenchidos. Confira.');
      } catch (e) { aviso('A busca do hotel não respondeu agora.'); }
    }); });
    $('#pac-ex').onclick = () => { exemploPacote(); telaCotacao(); aviso('Pacote de exemplo montado (grupo inventado)'); };
  }

  function exemploPacote() {
    /* grupo inventado; os voos são os do exemplo de Paris do vídeo */
    E.cot = Object.assign(novaCot(), { tipo: 'pacote', destino: 'Paris', cliente: 'Grupo de exemplo', pax: 20, criada: '2026-11-09' });
    E.cot.pac = { titulo: 'Paris 2027 – Grupo de exemplo', minimo: 20, moeda: 'EUR',
      precos: [{ valor: 4280, rotulo: 'Quarto individual' }, { valor: 3690, rotulo: 'Quarto duplo por pessoa' }],
      inclui: 'Aéreo – Air France (sugerido)\n05 noites no Hôtel de Crillon com café da manhã\nTransporte em todos os deslocamentos\nJantar de boas-vindas e de despedida\nCity tour em Paris com guia em português\nAcompanhante / Assistência local - Simonetta Viagens\nSeguro-viagem - Cobertura €60.000',
      hoteis: [{ nome: 'Hôtel de Crillon, A Rosewood Hotel', cidade: 'Paris', noites: 5, regime: 'café da manhã', endereco: '10 Place de la Concorde, 75008 Paris', site: 'rosewoodhotels.com',
        descricao: 'Palácio do século XVIII na Place de la Concorde, a poucos passos do Louvre e dos Champs-Élysées. Base ideal para um grupo que quer viver Paris a pé.', obs: '', fotos: [] }],
      dias: [
        { titulo: 'Chegada a Paris & jantar de boas-vindas', texto: 'Recepção no aeroporto Charles de Gaulle e traslado privativo ao hotel\nCheck-in e tarde livre\nJantar de boas-vindas (incluído, bebidas não incluídas)' },
        { titulo: 'City tour & tarde livre', texto: 'City tour com guia em português: Champs-Élysées, Arco do Triunfo, Torre Eiffel e Île de la Cité\nAlmoço livre\nTarde livre para compras' },
        { titulo: 'Passeios opcionais', texto: 'Dia livre ou um dos passeios opcionais abaixo' },
        { titulo: 'Montmartre a pé', texto: 'Manhã livre\nTarde em Montmartre com guia: Sacré-Cœur e Place du Tertre' },
        { titulo: 'Dia livre & jantar de despedida', texto: 'Dia livre\nJantar de despedida (incluído, bebidas não incluídas)' },
        { titulo: 'Traslado & regresso', texto: 'Check-out e dia livre\nTraslado ao aeroporto de acordo com o horário do voo' }],
      opcionais: [
        { nome: 'Palácio de Versalhes', preco: 85, tipo: 'Meio dia', minimo: '', descricao: 'Palácio e jardins de Versalhes com guia em português.',
          programa: '08:30 - 09:15 Traslado privativo em ônibus (Paris ➔ Versalhes)\n09:15 - 11:45 Visita guiada ao palácio e aos jardins\n12:00 - 12:45 Retorno a Paris para almoço livre' },
        { nome: 'Cruzeiro no Sena com jantar', preco: 145, tipo: 'Noite', minimo: 'mínimo 20 pessoas', descricao: 'Jantar a bordo com vista dos monumentos iluminados.',
          programa: '19:30 Embarque no Port de la Bourdonnais\n20:00 - 22:30 Jantar de 3 tempos navegando pelo Sena\n22:45 Retorno ao hotel' }],
      obs: 'Valores para mínimo de 20 pessoas e sujeitos à alteração sem aviso prévio.' };
    R = rascunhoDe(EXEMPLOS.telas[0].texto); adicionaVoosPacote(); R = null; E.texto = ''; salva();
  }

  function pintaMontagem() {
    const el = $('#montagem'); if (!el) return;
    const c = E.cot;
    const ops = c.opcoes.map(o => `<li><div><b>${esc(nomeOpcao(o))}</b><span>${o.tarifas.length ? o.tarifas.map(t => esc(t.rotulo) + ' ' + usd(precoFinal(t))).join(' · ') : esc(Amadeus.trechos(o.segmentos, AEROPORTOS).map(tr => cidade(tr.segmentos[0].origem) + ' → ' + cidade(tr.segmentos[tr.segmentos.length - 1].destino)).join(' · '))}</span></div>
      <button class="tira" data-tira="${o.id}" aria-label="Tirar ${esc(nomeOpcao(o))} da proposta">Tirar</button></li>`).join('');
    el.innerHTML = `
      <div class="mont-cab"><h2>Proposta em montagem</h2>
        <button class="btn fantasma" id="tudo">${E.cot.tipo === 'pacote' ? 'Montar o pacote de exemplo' : 'Montar a cotação inteira do vídeo'}</button></div>
      <div class="mont-campos">
        <label>Destino<input id="m-destino" value="${esc(c.destino)}" placeholder="Paris"></label>
        <label>Cliente<input id="m-cliente" value="${esc(c.cliente)}" placeholder="Nome de quem pediu"></label>
        <label>Passageiros<input id="m-pax" type="number" min="1" max="20" value="${c.pax}"></label>
      </div>
      ${ops ? `<ul class="mont-ops">${ops}</ul>` : `<p class="mont-vazia">${E.cot.tipo === 'pacote' ? 'Nenhum voo ainda. Cole a tela do Amadeus e toque em “Usar estes voos no pacote”.' : 'Nenhuma opção ainda. Cole uma tela do Amadeus acima e toque em “Adicionar à proposta”.'}</p>`}
      ${c.cliente ? `<p class="nota">Fica guardada em <a href="#/clientes">Clientes</a>, na ficha de ${esc(c.cliente)}.</p>` : '<p class="nota">Ponha o nome do cliente e a cotação fica guardada sozinha em Clientes.</p>'}
      <a class="btn primario ${temConteudo(c) ? '' : 'apagado'}" href="#/proposta">Abrir a proposta</a>`;
    $('#m-destino').oninput = (e) => { c.destino = e.target.value; salva(); };
    $('#m-cliente').oninput = (e) => { c.cliente = e.target.value; salva(); };
    $('#m-pax').oninput = (e) => { c.pax = Math.max(1, +e.target.value || 1); salva(); };
    $('#tudo').onclick = () => { if (E.cot.tipo === 'pacote') { exemploPacote(); aviso('Pacote de exemplo montado (grupo inventado)'); } else { montaExemploInteiro(); aviso('2 opções e 4 tarifas montadas'); } telaCotacao(); };
    $$('[data-tira]').forEach(b => b.onclick = () => { c.opcoes = c.opcoes.filter(o => o.id !== b.dataset.tira); salva(); pintaMontagem(); pintaLido(); });
  }

  /* =====================================================================
     TELA 2 — PROPOSTA (o que o cliente recebe)
     ===================================================================== */
  function prazoMaisCurto() {
    const l = E.cot.opcoes.flatMap(o => o.tarifas.map(t => t.emitirAte)).filter(Boolean).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    return l[0] || null;
  }
  function periodo() {
    const idas = new Set(), voltas = new Set();
    let origem = '';
    for (const o of E.cot.opcoes) {
      const trs = Amadeus.trechos(o.segmentos, AEROPORTOS);
      idas.add(trs[0].segmentos[0].data); origem = origem || cidade(trs[0].segmentos[0].origem);
      if (trs.length > 1) voltas.add(trs[trs.length - 1].segmentos[0].data);
    }
    const lista = (s) => [...s].sort().map(d => dt(d).getDate()).join(' ou ') + ' de ' + MESES_L[dt([...s].sort()[0]).getMonth()];
    return { origem, ida: idas.size ? lista(idas) : '', volta: voltas.size ? lista(voltas) : '', ano: idas.size ? dt([...idas][0]).getFullYear() : '' };
  }
  function arcoSvg(de, para) {
    return `<svg class="arco" viewBox="0 0 800 210" aria-hidden="true">
      <path d="M70 170 Q400 -60 730 170" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>
      <circle cx="70" cy="170" r="6" fill="currentColor"/><circle cx="730" cy="170" r="6" fill="none" stroke="currentColor" stroke-width="3"/>
      <g transform="translate(400 55) rotate(90) scale(1.5)"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0v5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" fill="currentColor" transform="translate(-12 -12)"/></g>
      <text x="70" y="204" text-anchor="middle">${esc(de)}</text><text x="730" y="204" text-anchor="middle">${esc(para)}</text></svg>`;
  }

  /* ----- A PROPOSTA como documento, no padrão da casa: capa de folha inteira com fotos do destino,
     um cartão por trecho e por tarifa, quadro do investimento, como reservar e contato. ----- */
  const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const ICO_RELOGIO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
  const ICO_ZAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z"/></svg>';
  const tipoVoo = (r) => r.paradas ? plural(r.paradas, 'conexão', 'conexões') + ' em ' + r.onde : 'voo direto';

  function ppCapa(c, de, para, per, cabines) {
    const destino = c.destino || cidade(para);
    const fotos = c.capa ? [c.capa] : (FOTOS_DESTINO[destino] || []).slice(0, 3), tres = fotos.length >= 3;
    const fundo = fotos.length
      ? `<div class="pp-fotos${tres ? '' : ' pp-uma'}" aria-hidden="true">${(tres ? fotos : fotos.slice(0, 1)).map((f, k) => `<div class="pp-f pp-f${k + 1}" style="background-image:url('${esc(f)}')"></div>`).join('')}${tres ? '<i class="pp-corte pp-c1"></i><i class="pp-corte pp-c2"></i>' : ''}</div>`
      : `<div class="pp-graf" aria-hidden="true">${arcoSvg(de, para)}</div>`;
    const quando = per.ida ? 'Ida em ' + per.ida + (per.volta ? ' · volta em ' + per.volta : '') + ' de ' + per.ano : '';
    return `<section class="pp-capa">
      ${fundo}
      <div class="pp-logo"><img src="arte/logo-simonetta.png" alt="${esc(AG.nome)}"></div>
      <div class="pp-capatxt">
        <p class="pp-capak">${esc(AG.nome)} <i>|</i> ${esc(destino)}</p>
        <h1>Proposta<br>de viagem</h1>
        <p>${esc([c.cliente, plural(c.pax, 'passageiro', 'passageiros')].filter(Boolean).join(' | '))}</p>
        ${quando ? `<p>${esc(quando)}</p>` : ''}
        <p>${esc(per.origem)} → ${esc(destino)} · ${esc(cabines.join(' / '))}</p>
      </div>
    </section>`;
  }

  function ppVoo(tr, rotulo) {
    const r = resumoTrecho(tr), dias = Math.round((dt(r.z.dataChegada) - dt(r.a.data)) / 864e5);
    const tag = [rotulo, SEMANA[dt(r.a.data).getDay()], diaMes(r.a.data), r.a.sai + ' – ' + r.z.chega + (dias > 0 ? ' (+' + dias + ')' : ''), r.total ? horas(r.total) : '', tipoVoo(r)].filter(Boolean).join(' | ');
    return `<section class="pp-card pp-voo"><div class="pp-tag">${esc(tag)}</div>
      <h3 class="pp-tit">${esc(cidade(r.a.origem))} → ${esc(cidade(r.z.destino))}</h3>
      ${pernasHtml(tr)}</section>`;
  }

  function ppTarifa(o, t, base, pax, varias) {
    const p = precoFinal(t), dif = p - base, selo = !varias ? '' : dif > 0 ? '+ ' + usd(dif) + ' por pessoa' : 'menor preço';
    return `<section class="pp-card pp-tar">
      <div class="pp-tag${varias && dif <= 0 ? ' pp-tag-v' : ''}">Tarifa ${esc(t.rotulo)}${selo ? ' | ' + esc(selo) : ''}</div>
      <h3 class="pp-tit">${esc(nomeCia(o.cia))} ${esc(t.rotulo)} <span class="pp-preco">${usd(p)}</span></h3>
      <p class="pp-sub">por pessoa · ${usd(p * pax)} para ${plural(pax, 'passageiro', 'passageiros')} · ${esc(t.cabine)}</p>
      <ul class="cond"><li class="${t.pecas > 0 ? 'ok' : 'alerta'}"><i>${t.pecas > 0 ? ICO.ok : ICO.alerta}</i>${esc(fraseMalasPessoa(t))}</li>${condicoes(t).map(x => `<li class="${x.k}"><i>${ICO[x.k]}</i>${esc(x.txt)}</li>`).join('')}</ul>
      <button class="btn escolher" data-quero="${o.id}|${t.id}">Quero esta</button>
    </section>`;
  }

  const linhas = (s) => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  /* "08:30 - 09:15 Traslado em ônibus" -> ['08:30 - 09:15', 'Traslado em ônibus'] */
  const horaETexto = (l) => { const m = /^(\d{1,2}[:h]\d{2}(?:\s*[-–]\s*\d{1,2}[:h]\d{2})?)\s+(.*)$/.exec(l); return m ? [m[1].replace(/\s*[-–]\s*/, ' – '), m[2]] : ['', l]; };

  function pacoteDoc() {
    const c = E.cot, p = c.pac, per = periodo(), m = p.moeda;
    const precos = p.precos.filter(x => +x.valor);
    const fotos = c.capa ? [c.capa] : (FOTOS_DESTINO[c.destino] || p.hoteis.flatMap(h => h.fotos || [])).slice(0, 3), tres = fotos.length >= 3;
    const fundo = fotos.length
      ? `<div class="pp-fotos${tres ? '' : ' pp-uma'}" aria-hidden="true">${(tres ? fotos : fotos.slice(0, 1)).map((f, k) => `<div class="pp-f pp-f${k + 1}" style="background-image:url('${esc(f)}')"></div>`).join('')}${tres ? '<i class="pp-corte pp-c1"></i><i class="pp-corte pp-c2"></i>' : ''}</div>`
      : '<div class="pp-graf" aria-hidden="true"></div>';
    const noites = p.hoteis.reduce((s, h) => s + (+h.noites || 0), 0);
    const quando = per.ida ? per.ida + (per.volta ? ' a ' + per.volta : '') + ' de ' + per.ano : '';
    const capa = `<section class="pp-capa">${fundo}
      <div class="pp-logo"><img src="arte/logo-simonetta.png" alt="${esc(AG.nome)}"></div>
      <div class="pp-capatxt">
        <p class="pp-capak">${esc(AG.nome)}${c.destino ? ' <i>|</i> ' + esc(c.destino) : ''}</p>
        <h1>${esc(p.titulo || 'Proposta de viagem')}</h1>
        ${c.cliente || p.minimo ? `<p>${esc([c.cliente, p.minimo ? 'mínimo de ' + p.minimo + ' pessoas' : ''].filter(Boolean).join(' | '))}</p>` : ''}
        ${quando || noites ? `<p>${esc([quando, noites ? plural(noites, 'noite', 'noites') : ''].filter(Boolean).join(' · '))}</p>` : ''}
        ${p.hoteis.length ? `<p>${esc(p.hoteis.map(h => h.nome).filter(Boolean).join(' · '))}</p>` : ''}
      </div></section>`;
    const valores = precos.length ? `<section class="pp-inv pp-inv-pac"><p class="pp-inv-t">Valores</p>
      <div class="pp-invg">${precos.map(x => `<div><small>${esc(x.rotulo || 'Por pessoa')}</small><b>${esc(dinheiro(x.valor, m))}</b></div>`).join('')}</div>
      <div class="pp-ind">${p.minimo ? 'Valores para mínimo de ' + esc(p.minimo) + ' pessoas e sujeitos' : 'Valores sujeitos'} à alteração sem aviso prévio</div></section>` : '';
    /* cada seção: o título vai junto do primeiro cartão (no papel não fica título sozinho no pé da folha) */
    const sec = (kick, titulo, cartoes) => cartoes.length ? `<section class="pp-sec"><div class="pp-bloco"><p class="pp-kick">${kick}</p><h2 class="pp-h2">${titulo}</h2>${cartoes[0]}</div>${cartoes.slice(1).join('')}</section>` : '';
    const inclui = sec('O pacote', 'O que está incluído', linhas(p.inclui).length
      ? [`<div class="pp-card"><ul class="cond pp-inclui">${linhas(p.inclui).map(l => `<li class="ok"><i>${ICO.ok}</i>${esc(l)}</li>`).join('')}</ul></div>`] : []);
    const hoteis = sec('Hospedagem', p.hoteis.length > 1 ? 'Os hotéis' : 'O hotel', p.hoteis.map(h => `<section class="pp-card pp-hotel">
        <div class="pp-tag">${esc([h.cidade, h.noites ? plural(+h.noites, 'noite', 'noites') : '', h.regime].filter(Boolean).join(' | ') || 'Hotel')}</div>
        <h3 class="pp-tit">${esc(h.nome || 'Hotel')}</h3>
        ${(h.fotos || []).length ? `<div class="pp-fotos3 n${Math.min(h.fotos.length, 3)}">${h.fotos.slice(0, 3).map(f => `<div class="pp-foto" style="background-image:url('${esc(f)}')"></div>`).join('')}</div>` : ''}
        ${h.descricao ? `<p>${esc(h.descricao).replace(/\n/g, '<br>')}</p>` : ''}
        ${h.endereco || h.site ? `<p class="pp-onde">${h.endereco ? `<span>${ICO_PIN}${esc(h.endereco)}</span>` : ''}${h.site ? `<span>${esc(h.site)}</span>` : ''}</p>` : ''}
        ${h.obs ? `<div class="pp-obs">${ICO_ZAP}<p><b>Obs.:</b> ${esc(h.obs)}</p></div>` : ''}
      </section>`));
    const roteiro = sec('Roteiro', 'Dia a dia', p.dias.map((d, i) => `<section class="pp-card pp-dia-c"><div class="pp-tag">Dia ${i + 1}</div>
        <h3 class="pp-tit">${esc(d.titulo || '')}</h3>
        <ul class="pp-ativ">${linhas(d.texto).map(l => `<li>${esc(l)}</li>`).join('')}</ul></section>`));
    const opc = sec('Para escolher', 'Passeios opcionais', p.opcionais.map(o => `<section class="pp-card pp-opc">
        <div class="pp-tag">${esc([o.tipo, o.minimo].filter(Boolean).join(' | ') || 'Opcional')}</div>
        <h3 class="pp-tit">${esc(o.nome || 'Passeio')}${+o.preco ? ` <span class="pp-preco">${esc(dinheiro(o.preco, m))}</span>` : ''}</h3>
        ${+o.preco ? '<p class="pp-sub">por pessoa</p>' : ''}
        ${o.descricao ? `<p>${esc(o.descricao)}</p>` : ''}
        ${linhas(o.programa).length ? `<table class="pp-prog"><tbody>${linhas(o.programa).map(l => { const [h, x] = horaETexto(l); return `<tr><th>${esc(h)}</th><td>${esc(x)}</td></tr>`; }).join('')}</tbody></table>` : ''}
      </section>`));
    const voos = sec('Aéreo proposto', 'Os voos' + (c.opcoes.length === 1 ? ' <span>| ' + esc(nomeCia(c.opcoes[0].cia)) + '</span>' : ''),
      c.opcoes.flatMap((o, i) => { const trs = Amadeus.trechos(o.segmentos, AEROPORTOS), rots = rotulosTrechos(trs);
        return trs.map((x, k) => (c.opcoes.length > 1 && k === 0 ? `<p class="pp-kick">Opção ${i + 1} · ${esc(nomeCia(o.cia))}</p>` : '') + ppVoo(x, rots[k])); }));
    return `<article class="pp pp-pacote">
      ${capa}
      ${valores}
      ${inclui}
      ${hoteis}
      ${roteiro}
      ${opc}
      ${voos}
      <section class="pp-box"><h3>Como reservar</h3>
        <p>Responda confirmando o interesse e o número de participantes. Para emitir as passagens, preciso da foto do passaporte de cada um.</p>
        ${p.obs ? `<p class="pp-forte">${esc(p.obs).replace(/\n/g, '<br>')}</p>` : `<p class="pp-forte">${esc(AG.aviso)}.</p>`}
        <p>Proposta feita em ${diaNum(c.criada)} por ${esc(AG.consultor)}.</p></section>
      <footer class="pp-pe">${[AG.razao, AG.cidade, ...AG.fones, AG.email].map(x => `<span>${esc(x)}</span>`).join('<i aria-hidden="true">|</i>')}</footer>
    </article>`;
  }

  function propostaDoc() {
    if (E.cot.tipo === 'pacote') return pacoteDoc();
    /* só entram as opções com tarifa (voos de pacote sem preço ficam fora do aéreo) */
    const c = Object.assign({}, E.cot, { opcoes: E.cot.opcoes.filter(o => o.tarifas.length) }), per = periodo(), prazo = prazoMaisCurto(), n = c.opcoes.length;
    const cabines = [...new Set(c.opcoes.flatMap(o => o.tarifas.map(t => t.cabine)))];
    const primeiro = Amadeus.trechos(c.opcoes[0].segmentos, AEROPORTOS)[0].segmentos;
    const de = primeiro[0].origem, para = primeiro[primeiro.length - 1].destino;

    const resumo = n > 1 ? `<section class="pp-sec"><p class="pp-kick">Em resumo</p><h2 class="pp-h2">${n} opções para a sua viagem</h2>
      <div class="pp-res n${Math.min(n, 3)}">${c.opcoes.map((o, i) => {
        const r = resumoTrecho(Amadeus.trechos(o.segmentos, AEROPORTOS)[0]);
        return `<button class="pp-card pp-resumo" data-vai="op-${o.id}"><span class="pp-tag">Opção ${i + 1}</span><b>${esc(nomeCia(o.cia))}</b>
          <span>${esc(tipoVoo(r).replace(/^./, x => x.toUpperCase()))}${r.total ? ' · ' + horas(r.total) + ' na ida' : ''}</span>
          <span class="pp-apartir">a partir de <b>${usd(Math.min(...o.tarifas.map(precoFinal)))}</b> por pessoa</span></button>`;
      }).join('')}</div></section>` : '';

    const opcoes = c.opcoes.map((o, i) => {
      const trs = Amadeus.trechos(o.segmentos, AEROPORTOS), rots = rotulosTrechos(trs), r = resumoTrecho(trs[0]);
      const base = Math.min(...o.tarifas.map(precoFinal)), pz = o.tarifas.map(t => t.emitirAte).filter(Boolean)[0];
      return `<section class="pp-sec pp-op" id="op-${o.id}">
        <div class="pp-bloco"><p class="pp-kick">Opção ${i + 1}${n > 1 ? ' de ' + n : ''}</p>
          <h2 class="pp-h2">${esc(nomeCia(o.cia))} <span>| ${esc(tipoVoo(r))}</span></h2>
          ${ppVoo(trs[0], rots[0])}</div>
        ${trs.slice(1).map((x, k) => ppVoo(x, rots[k + 1])).join('')}
        ${pz ? `<div class="pp-obs">${ICO_RELOGIO}<p>Preço garantido para emissão até <b>${diaMes(pz.data)} às ${pz.hora}</b>.</p></div>` : ''}
        <div class="pp-tars n${Math.min(o.tarifas.length, 2)}">${o.tarifas.map(t => ppTarifa(o, t, base, c.pax, o.tarifas.length > 1)).join('')}</div>
      </section>`;
    }).join('');

    const caixas = c.opcoes.flatMap((o, i) => o.tarifas.map(t => `<div><small>${n > 1 ? 'Opção ' + (i + 1) + ' · ' : ''}${esc(nomeCia(o.cia))} · ${esc(t.rotulo)}</small><b>${usd(precoFinal(t))}</b><span>${usd(precoFinal(t) * c.pax)} para ${plural(c.pax, 'passageiro', 'passageiros')}</span></div>`)).join('');
    const fecho = `<section class="pp-inv"><p class="pp-inv-t">Investimento por pessoa</p><div class="pp-invg">${caixas}</div>
        <div class="pp-ind">Valores em dólares americanos (USD), com as taxas incluídas</div></section>
      <section class="pp-box"><h3>Como reservar</h3>
        <p>Responda dizendo qual opção prefere. Para emitir, preciso da foto do passaporte de cada passageiro.</p>
        ${prazo ? `<p class="pp-forte">Preços garantidos para emissão até ${diaMes(prazo.data)} às ${prazo.hora}.</p>` : ''}
        <p class="pp-forte">${esc(AG.aviso)}.</p>
        <p>Cotação feita em ${diaNum(c.criada)} por ${esc(AG.consultor)}.</p></section>
      <footer class="pp-pe">${[AG.razao, AG.cidade, ...AG.fones, AG.email].map(x => `<span>${esc(x)}</span>`).join('<i aria-hidden="true">|</i>')}</footer>`;
    /* Na tela o investimento fecha o documento. No papel, com mais de uma opção, ele sobe para a folha do
       resumo (uma folha de visão geral) e cada opção ocupa a sua folha, sem buraco no meio. */
    return `<article class="pp">
      ${ppCapa(c, de, para, per, cabines)}
      ${resumo}
      ${n > 1 ? `<div class="so-papel">${fecho}</div>` : ''}
      ${opcoes}
      <div${n > 1 ? ' class="so-tela"' : ''}>${fecho}</div>
    </article>`;
  }

  const nomePdf = () => E.cot.tipo === 'pacote' && E.cot.pac.titulo ? E.cot.pac.titulo : 'Proposta ' + (E.cot.destino || '') + (E.cot.cliente ? ' - ' + E.cot.cliente : '');
  const temProposta = () => E.cot.tipo === 'pacote' ? temConteudo(E.cot) : E.cot.opcoes.some(o => o.tarifas.length);
  function ligaDoc() {
    const c = E.cot;
    $$('[data-vai]').forEach(b => b.onclick = () => document.getElementById(b.dataset.vai).scrollIntoView({ behavior: 'smooth', block: 'start' }));
    $$('[data-quero]').forEach(b => b.onclick = () => {
      const [oid, tid] = b.dataset.quero.split('|'), o = c.opcoes.find(x => x.id === oid), t = o.tarifas.find(x => x.id === tid);
      aviso('No app de verdade este botão abre o WhatsApp da agência com: “Quero a ' + nomeOpcao(o) + ', tarifa ' + t.rotulo + ' (' + usd(precoFinal(t)) + ' por pessoa)”.');
    });
  }

  /* a proposta dentro do painel: com os botões de quem monta */
  function telaProposta() {
    const c = E.cot;
    if (!temProposta()) {
      $('#palco').innerHTML = `<div class="vazio central"><h1>A proposta ainda está vazia</h1>
        <p>Ela se monta sozinha com o que você cola na Cotação. Para ver uma pronta agora, use a cotação do vídeo (São Paulo–Paris, executiva, Air France e Air Europa).</p>
        <button class="btn primario" id="tudo2">Montar a cotação do vídeo</button> <a class="btn fantasma" href="#/cotacao">Ir para a Cotação</a></div>`;
      $('#tudo2').onclick = () => { montaExemploInteiro(); telaProposta(); };
      return;
    }
    $('#palco').innerHTML = `
    <div class="barra-doc nao-imprime">
      <a class="btn fantasma" href="#/cotacao">Voltar à cotação</a>
      <span class="esp"></span>
      <label class="btn fantasma">Foto da capa<input type="file" id="capa" accept="image/*" hidden></label>
      ${c.capa ? '<button class="btn fantasma" id="semcapa">Tirar a foto</button>' : ''}
      <button class="btn fantasma" id="zap">Copiar resumo para o WhatsApp</button>
      <a class="btn fantasma" href="#/cliente">Ver como o cliente vê</a>
      <button class="btn primario" id="pdf">Baixar PDF</button>
    </div>
    ${propostaDoc()}`;
    $('#pdf').onclick = () => imprime(nomePdf());
    $('#zap').onclick = () => copia(resumoZap(), 'Resumo copiado. É só colar na conversa do cliente.');
    $('#capa').onchange = (e) => { const f = e.target.files[0]; if (f) reduzFoto(f, (url) => { c.capa = url; salva(); telaProposta(); }); };
    const sc = $('#semcapa'); if (sc) sc.onclick = () => { c.capa = ''; salva(); telaProposta(); };
    ligaDoc();
  }

  /* a mesma proposta do jeito que o cliente abre: só o documento, o PDF e o botão de falar com a agência */
  function telaCliente() {
    if (!temProposta()) { location.hash = '#/proposta'; return; }
    $('#palco').innerHTML = `
    <div class="pp-pg">
      <header class="pp-topo nao-imprime"><img src="arte/logo-simonetta.png" alt="${esc(AG.nome)}">
        <a class="pp-volta" href="#/proposta">Voltar ao painel</a><button class="btn primario pp-mini" id="pdf">Baixar PDF</button></header>
      ${propostaDoc()}
      <div class="pp-cta nao-imprime"><button class="pp-zap" id="cta-zap">${ICO_ZAP}Falar com a ${esc(AG.nome)}</button></div>
    </div>`;
    $('#pdf').onclick = () => imprime(nomePdf());
    $('#cta-zap').onclick = () => aviso('No app de verdade este botão abre o WhatsApp da agência já com o nome desta proposta.');
    ligaDoc();
  }

  function resumoZap() {
    if (E.cot.tipo === 'pacote') {
      const p = E.cot.pac, l = ['*' + (p.titulo || 'Pacote ' + E.cot.destino) + '* · ' + AG.nome];
      if (p.minimo) l.push('Mínimo de ' + p.minimo + ' pessoas');
      l.push(''); p.precos.filter(x => +x.valor).forEach(x => l.push('• ' + dinheiro(x.valor, p.moeda) + ' ' + (x.rotulo || '')));
      if (linhas(p.inclui).length) { l.push('', '*Inclui:*'); linhas(p.inclui).forEach(x => l.push('• ' + x)); }
      l.push('', 'Hotéis, roteiro dia a dia e passeios opcionais estão no PDF em anexo.');
      return l.join('\n');
    }
    const c = E.cot, per = periodo(), prazo = prazoMaisCurto();
    const l = ['*Cotação ' + (c.destino || '') + '* · ' + AG.nome, per.origem + ' e ' + c.destino + ' · ida em ' + per.ida + (per.volta ? ' · volta em ' + per.volta : '') + ' · ' + plural(c.pax, 'passageiro', 'passageiros'), ''];
    c.opcoes.forEach((o, i) => {
      const r = resumoTrecho(Amadeus.trechos(o.segmentos, AEROPORTOS)[0]);
      l.push('*Opção ' + (i + 1) + ' · ' + nomeCia(o.cia) + '* (' + (r.paradas ? plural(r.paradas, 'conexão', 'conexões') + ' em ' + r.onde : 'voo direto') + ')');
      for (const t of o.tarifas) l.push('• ' + t.rotulo + ': ' + usd(precoFinal(t)) + ' por pessoa, ' + fraseMalas(t));
      l.push('');
    });
    if (prazo) l.push('Preços garantidos para emissão até ' + diaMes(prazo.data) + ' às ' + prazo.hora + '.');
    l.push('Os detalhes de cada tarifa estão no PDF em anexo.');
    return l.join('\n');
  }

  function reduzFoto(arq, pronto, max) {
    const img = new Image(), url = URL.createObjectURL(arq);
    img.onload = () => {
      const k = Math.min(1, (max || 1500) / img.width), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url); pronto(cv.toDataURL('image/jpeg', 0.8));
    };
    img.src = url;
  }
  /* o nome do PDF sai do título da página: é o que o navegador sugere em "Salvar como PDF" */
  function imprime(nome) {
    const antes = document.title;
    document.title = nome.replace(/[\\/:*?"<>|]/g, ' ').trim();
    const volta = () => { document.title = antes; window.removeEventListener('afterprint', volta); };
    window.addEventListener('afterprint', volta);
    window.print();
  }

  /* =====================================================================
     TELA 3 — VOUCHER DE HOTEL
     ===================================================================== */
  const TIPOS = ['SINGLE', 'DOUBLE', 'TWIN BED', 'TRIPLE'];
  const REGIMES = ['com café da manhã', 'meia pensão', 'pensão completa', 'all inclusive', 'sem refeições'];
  const noites = (v) => v.checkin && v.checkout ? Math.max(0, Math.round((dt(v.checkout) - dt(v.checkin)) / 86400000)) : 0;
  const camas = (tipo) => tipo === 'SINGLE' ? 1 : tipo === 'TRIPLE' ? 3 : 2;

  function nomeArquivoVoucher(q) {
    const hs = q.hospedes.map(h => h.trim()).filter(Boolean);
    const quem = hs.length === 1 ? titulo(hs[0]) : hs.map(h => titulo(h.split(' ')[0])).join(' e ');
    return ('Voucher ' + E.vou.hotel + (quem ? ' - ' + quem : '')).trim();
  }
  function buscaHotel(q) {
    const n = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const palavras = n.split(/\s+/).filter(p => p.length > 2);
    let melhor = null, pts = 0;
    for (const h of HOTEIS) { const p = palavras.filter(w => h.chaves.some(k => k.startsWith(w) || w.startsWith(k))).length; if (p > pts) { pts = p; melhor = h; } }
    return melhor;
  }

  /* Busca o hotel de verdade no OpenStreetMap (base aberta, sem chave): endereço, telefone, categoria e site.
     Telefone e estrelas nem sempre estão lá: o que faltar fica em branco, com aviso, e nunca é inventado.
     No app de verdade a busca pode ser no Google, que tem telefone de quase todo hotel. */
  const CACHE_HOTEL = {};
  async function buscaHotelOnline(q) {
    q = String(q || '').trim();
    if (q.length < 4) return [];
    if (CACHE_HOTEL[q]) return CACHE_HOTEL[q];
    const u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=6&accept-language=pt-BR&q=' + encodeURIComponent(q);
    const r = await fetch(u, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('busca ' + r.status);
    const l = (await r.json()).filter(x => x.category === 'tourism' && /hotel|guest_house|apartment|hostel|motel|resort/.test(x.type) || /hotel|resort|inn|pousada/i.test(x.name || ''));
    const res = l.map(x => {
      const a = x.address || {}, e = x.extratags || {};
      const cidade = a.city || a.town || a.village || a.municipality || a.county || '';
      const rua = [a.road || a.pedestrian || '', a.house_number || ''].filter(Boolean).join(', ');
      const endereco = [rua, [a.postcode, cidade].filter(Boolean).join(' '), a.country].filter(Boolean).join(', ');
      const site = (e.website || e['contact:website'] || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      return { nome: x.name || q, endereco, cidade, pais: a.country || '', fone: e.phone || e['contact:phone'] || '', estrelas: parseInt(e.stars, 10) || 0, site };
    });
    CACHE_HOTEL[q] = res;
    return res;
  }
  /* o que faltou, dito em uma frase */
  const faltouHotel = (h) => { const f = [!h.fone && 'telefone', !h.estrelas && 'categoria'].filter(Boolean); return f.length ? 'Não achei ' + f.join(' nem ') + ' deste hotel na base aberta: preencha à mão' + (h.site ? ' (o site é ' + h.site + ')' : '') + '.' : ''; };

  function exemploVoucher() {
    /* o mesmo roteiro da proposta de exemplo: chega a Paris em 19/11 e volta em 24/11 */
    const h = HOTEIS.find(x => x.cidade === 'Paris') || HOTEIS[0];
    E.vou = Object.assign(novoVou(), { cliente: 'Rafael Monteiro', hotel: h.nome, endereco: h.endereco, fone: h.fone, estrelas: h.estrelas, cidade: h.cidade, checkin: '2026-11-19', checkout: '2026-11-24',
      quartos: [{ tipo: 'SINGLE', hospedes: ['Marina Monteiro Lima'], obs: '' }, { tipo: 'TWIN BED', hospedes: ['Rafael Augusto Monteiro', 'Helena Duarte Prado'], obs: '' }] });
    salva();
  }

  const ICO_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>';
  const ICO_FONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 3.5h3l1.4 4-2 1.6a12 12 0 0 0 5.9 5.9l1.6-2 4 1.4v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/></svg>';
  const ICO_LUA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.5 8.5 0 0 1 9.4 4 8.5 8.5 0 1 0 20 14.6Z" fill="currentColor"/></svg>';
  const ICO_PESSOA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';

  /* o voucher, uma folha por quarto, no mesmo padrão da proposta: topo com foto, cartões e quadro da agência */
  function voucherHtml(q, n, total) {
    const v = E.vou, nt = noites(v), hs = q.hospedes.slice(0, camas(q.tipo));
    const foto = v.foto || (FOTOS_DESTINO[v.cidade] || [])[0] || '';
    const dia = (iso) => iso ? { curto: dt(iso).getDate() + ' ' + MESES[dt(iso).getMonth()], sem: SEMANA[dt(iso).getDay()] } : { curto: '—', sem: '' };
    const a = dia(v.checkin), z = dia(v.checkout), est = +v.estrelas || 0;
    const tagEstadia = ['Estadia', v.checkin && v.checkout ? diaNum(v.checkin) + ' a ' + diaNum(v.checkout) : '', nt ? plural(nt, 'noite', 'noites') : '', v.regime].filter(Boolean).join(' | ');
    const tagQuarto = ['Room' + (total > 1 ? ' ' + (n + 1) + ' de ' + total : ''), q.tipo, est ? est + ' estrelas' : ''].filter(Boolean).join(' | ');
    return `<article class="pp vc">
      <section class="vc-topo">
        ${foto ? `<div class="vc-foto" style="background-image:url('${esc(foto)}')" aria-hidden="true"></div>` : ''}
        <div class="pp-logo"><img src="arte/logo-simonetta.png" alt="${esc(AG.nome)}"></div>
        <div class="vc-txt"><p class="pp-capak">${esc(AG.nome)}${v.cidade ? ' <i>|</i> ' + esc(v.cidade) : ''}</p><h1>Voucher de<br>hospedagem</h1></div>
      </section>
      <section class="pp-sec">
        <p class="pp-kick">Hotel</p>
        <h2 class="pp-h2">${esc(v.hotel || 'Nome do hotel')}${est ? ` <span class="vc-estrelas" role="img" aria-label="${est} estrelas">${'★'.repeat(est)}</span>` : ''}</h2>
        <div class="pp-card vc-linhas">
          <p><i>${ICO_PIN}</i><span><small>Endereço</small>${esc(v.endereco || '—')}</span></p>
          <p><i>${ICO_FONE}</i><span><small>Telefone</small>${esc(v.fone || '—')}</span></p>
        </div>
        <section class="pp-card pp-voo vc-estadia"><div class="pp-tag">${esc(tagEstadia)}</div>
          <div class="perna">
            <div class="ponta"><span class="hora">${esc(a.curto)}</span><b class="iata">Check-in</b><span class="onde">${esc([a.sem, v.horaIn ? 'a partir das ' + v.horaIn : ''].filter(Boolean).join(' · '))}</span></div>
            <div class="linha-voo"><span class="dur">${nt ? plural(nt, 'noite', 'noites') : ''}</span><span class="traco"><i>${ICO_LUA}</i></span><span class="num">${esc(v.regime)}</span></div>
            <div class="ponta fim"><span class="hora">${esc(z.curto)}</span><b class="iata">Check-out</b><span class="onde">${esc([z.sem, v.horaOut ? 'até as ' + v.horaOut : ''].filter(Boolean).join(' · '))}</span></div>
          </div></section>
        <section class="pp-card"><div class="pp-tag">${esc(tagQuarto)}</div>
          <h3 class="pp-tit">${hs.length > 1 ? 'Hóspedes' : 'Hóspede'}</h3>
          <ul class="vc-hosp">${hs.map(h => `<li><i>${ICO_PESSOA}</i><b>${esc((h || '').toUpperCase() || '—')}</b></li>`).join('')}</ul>
          ${q.obs ? `<div class="pp-obs">${ICO_ZAP}<p><b>Observação:</b> ${esc(q.obs)}</p></div>` : ''}
        </section>
        ${v.info ? `<section class="pp-card"><h3 class="pp-tit">Informações adicionais</h3><p>${esc(v.info).replace(/\n/g, '<br>')}</p></section>` : ''}
      </section>
      <section class="pp-inv vc-ag"><p class="pp-inv-t">Reserva feita por</p><b>${esc(AG.razao)}</b>
        <span>${AG.fones.map(esc).join(' · ')} · ${esc(AG.email)}</span><span>${esc(AG.cidade)}</span></section>
    </article>`;
  }

  const periodoVoucher = (x) => x.checkin ? diaNum(x.checkin) + (x.checkout ? ' a ' + diaNum(x.checkout) : '') : '';
  function itemVoucher(x) {
    return `<li class="cli-prop${x.vou === E.vou ? ' aberto' : ''}">
      <div><span class="cia-tag">Voucher${x.quartos > 1 ? ' · ' + x.quartos + ' quartos' : ''}</span>${x.vou === E.vou ? '<span class="cli-aberta">aberto agora</span>' : ''}
        <b>${esc(x.hotel || 'Hotel')}</b><span>${esc([x.hospedes.join(', '), periodoVoucher(x), x.cliente ? 'cliente: ' + x.cliente : ''].filter(Boolean).join(' · '))}</span>
        <span>mudado em ${esc(dataHora(x.atualizado))}</span></div>
      <div class="cli-acoes"><button class="btn primario" data-vabre="${x.id}">Abrir e editar</button><button class="btn fantasma" data-vdup="${x.id}">Duplicar</button><button class="tira" data-vapaga="${x.id}">Apagar</button></div></li>`;
  }
  function ligaVouchers(el, depois) {
    $$('[data-vabre]', el).forEach(b => b.onclick = () => { E.vou = E.vouchers.find(x => x.id === b.dataset.vabre).vou; E.vou.ativo = 0; salva(); if (location.hash === '#/voucher') telaVoucher(); else location.hash = '#/voucher'; window.scrollTo(0, 0); });
    $$('[data-vdup]', el).forEach(b => b.onclick = () => {
      const o = E.vouchers.find(x => x.id === b.dataset.vdup).vou;
      E.vou = Object.assign(JSON.parse(JSON.stringify(o)), { id: uid(), criado: isoHoje(), ativo: 0 }); salva();
      if (location.hash === '#/voucher') telaVoucher(); else location.hash = '#/voucher'; window.scrollTo(0, 0); aviso('Cópia aberta. O original continua guardado.');
    });
    $$('[data-vapaga]', el).forEach(b => b.onclick = () => {
      const o = E.vouchers.find(x => x.id === b.dataset.vapaga);
      if (!confirm('Apagar o voucher do ' + (o.hotel || 'hotel') + '? Não dá para desfazer.')) return;
      E.vouchers = E.vouchers.filter(x => x !== o);
      if (o.vou === E.vou) E.vou = novoVou();
      salva(); depois();
    });
  }
  function pintaHistVoucher() {
    const el = $('#v-lista'); if (!el) return;
    const b = norm(($('#v-busca-hist') || {}).value);
    const l = E.vouchers.filter(x => !b || norm([x.hotel, x.cliente, ...x.hospedes].join(' ')).includes(b)).sort((a, c) => (c.atualizado || '').localeCompare(a.atualizado || ''));
    el.innerHTML = l.map(itemVoucher).join('') || `<li class="nota">${b ? 'Nenhum voucher com isso.' : 'Nenhum voucher salvo ainda.'}</li>`;
    ligaVouchers(el, () => telaVoucher());
  }

  function telaVoucher() {
    const v = E.vou;
    const q = v.quartos[v.ativo] || v.quartos[0];
    const lidos = E.pass.map(p => p.nomeCompleto);
    $('#palco').innerHTML = `
    <div class="vou">
      <section class="vou-form nao-imprime">
        <div class="mont-cab"><h1>Voucher de hotel</h1><span class="dupla"><button class="btn primario" id="v-novo">Novo voucher</button><button class="btn fantasma" id="v-ex">Exemplo</button></span></div>
        <p class="nota">${E.vouchers.some(x => x.vou === v) ? 'Você está mudando um voucher salvo. Cada mudança fica guardada sozinha.' : 'Fica guardado sozinho quando tiver hotel e hóspede.'} <button class="link" id="v-ir-hist">Ver os vouchers salvos (${E.vouchers.length})</button></p>
        <label>Cliente (quem comprou)<input id="v-cliente" value="${esc(v.cliente || '')}" list="v-clientes" placeholder="Nome do cliente, para achar depois"></label>
        <datalist id="v-clientes">${E.clientes.map(c => `<option value="${esc(c.nome)}">`).join('')}</datalist>
        <label class="busca">Qual é o hotel?<span class="dupla"><input id="v-hotel" value="${esc(v.hotel)}" placeholder="Ex.: savoy marrakech"><button class="btn" id="v-busca">Buscar dados</button></span></label>
        <p class="nota" id="v-nota">Digite o nome e a cidade do hotel e aperte Enter: endereço, telefone e categoria se preenchem sozinhos.</p>
        <ul class="hot-achados" id="v-achados" hidden></ul>
        <div class="grade2">
          <label class="largo">Endereço<input id="v-endereco" value="${esc(v.endereco)}"></label>
          <label>Telefone<input id="v-fone" value="${esc(v.fone)}"></label>
          <label>Categoria<select id="v-estrelas">${[0, 3, 4, 5].map(n => `<option value="${n}"${n === +v.estrelas ? ' selected' : ''}>${n ? n + ' estrelas' : 'Sem categoria'}</option>`).join('')}</select></label>
          <label>Check-in<input id="v-checkin" type="date" value="${esc(v.checkin)}"></label>
          <label>Check-out<input id="v-checkout" type="date" value="${esc(v.checkout)}"></label>
        </div>
        <fieldset><legend>Regime</legend><div class="chips">${REGIMES.map(r => `<button class="chip${r === v.regime ? ' on' : ''}" data-regime="${r}">${r}</button>`).join('')}</div></fieldset>
        <fieldset><legend>Quartos</legend>
          <div class="chips">${v.quartos.map((x, i) => `<button class="chip${i === v.ativo ? ' on' : ''}" data-quarto="${i}">Quarto ${i + 1}</button>`).join('')}<button class="chip mais" id="v-mais">+ outro quarto</button>${v.quartos.length > 1 ? '<button class="chip tira" id="v-menos">Tirar este</button>' : ''}</div>
          <div class="chips">${TIPOS.map(t => `<button class="chip${t === q.tipo ? ' on' : ''}" data-tipo="${t}">${t}</button>`).join('')}</div>
          ${Array.from({ length: camas(q.tipo) }, (_, i) => `<label>Hóspede ${i + 1}, como está no passaporte<input data-hosp="${i}" value="${esc(q.hospedes[i] || '')}" list="lidos" placeholder="Nome completo"></label>`).join('')}
          <datalist id="lidos">${lidos.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
          ${lidos.length ? '' : '<p class="nota">Dica: leia os passaportes na aba Passaportes e os nomes aparecem aqui para escolher, sem digitar.</p>'}
          <label>Observação deste quarto<input id="v-obs" value="${esc(q.obs)}"></label>
        </fieldset>
        <label>Informações adicionais<textarea id="v-info" rows="2">${esc(v.info)}</textarea></label>
        <div class="acoes"><label class="btn fantasma">Foto do topo<input type="file" id="v-foto" accept="image/*" hidden></label>
          ${v.foto ? '<button class="btn fantasma" id="v-semfoto">Tirar a foto</button>' : ''}</div>
        <div class="acoes"><button class="btn primario" id="v-pdf">Baixar PDF deste quarto</button>
          <button class="btn fantasma" id="v-nome">Copiar o nome do arquivo</button></div>
      </section>
      <section class="vou-doc"><p class="arquivo nao-imprime">${esc(nomeArquivoVoucher(q))}.pdf</p><div id="v-folha">${voucherHtml(q, v.ativo, v.quartos.length)}</div></section>
    </div>
    <section class="cartao vou-hist nao-imprime" id="v-hist">
      <div class="cartao-topo"><h2>Vouchers salvos</h2><input id="v-busca-hist" type="search" placeholder="Procurar hotel, hóspede ou cliente" aria-label="Procurar voucher"></div>
      <ul class="cli-props" id="v-lista"></ul>
    </section>`;
    pintaHistVoucher();
    $('#v-busca-hist').oninput = pintaHistVoucher;
    $('#v-ir-hist').onclick = () => $('#v-hist').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#v-novo').onclick = () => { E.vou = novoVou(); salva(); telaVoucher(); window.scrollTo(0, 0); aviso('Voucher novo em branco. O anterior está guardado em “Vouchers salvos”.'); };
    $('#v-cliente').oninput = (e) => { v.cliente = e.target.value; salva(); };
    $('#v-cliente').onchange = (e) => {   /* ao sair do campo: o cliente entra no cadastro, se ainda não estiver */
      const n = e.target.value.trim(); if (!n) return;
      if (!E.clientes.some(c => norm(c.nome) === norm(n))) { E.clientes.push({ id: uid(), nome: n, fone: '', email: '', obs: '', criado: isoHoje() }); salva(); }
    };

    const repinta = () => { salva(); $('#v-folha').innerHTML = voucherHtml(q, v.ativo, v.quartos.length); $('.arquivo').textContent = nomeArquivoVoucher(q) + '.pdf'; pintaHistVoucher(); };
    const campo = (id, k) => { $('#' + id).oninput = (e) => { v[k] = e.target.value; repinta(); }; };
    $('#v-hotel').oninput = (e) => { v.hotel = e.target.value; v.cidade = ''; repinta(); };   /* outro hotel: a cidade (e a foto dela) deixa de valer */
    campo('v-endereco', 'endereco'); campo('v-fone', 'fone'); campo('v-estrelas', 'estrelas');
    campo('v-checkin', 'checkin'); campo('v-checkout', 'checkout'); campo('v-info', 'info');
    $('#v-obs').oninput = (e) => { q.obs = e.target.value; repinta(); };
    $$('[data-hosp]').forEach(c => c.oninput = () => { q.hospedes[+c.dataset.hosp] = c.value; repinta(); });
    $$('[data-regime]').forEach(b => b.onclick = () => { v.regime = b.dataset.regime; salva(); telaVoucher(); });
    $$('[data-tipo]').forEach(b => b.onclick = () => { q.tipo = b.dataset.tipo; salva(); telaVoucher(); });
    $$('[data-quarto]').forEach(b => b.onclick = () => { v.ativo = +b.dataset.quarto; salva(); telaVoucher(); });
    $('#v-mais').onclick = () => { v.quartos.push({ tipo: 'TWIN BED', hospedes: ['', ''], obs: '' }); v.ativo = v.quartos.length - 1; salva(); telaVoucher(); };
    const menos = $('#v-menos'); if (menos) menos.onclick = () => { v.quartos.splice(v.ativo, 1); v.ativo = 0; salva(); telaVoucher(); };
    const nota = (txt, alerta) => { const n = $('#v-nota'); n.textContent = txt; n.classList.toggle('alerta', !!alerta); };
    const usa = (h) => {
      Object.assign(v, { hotel: h.nome, endereco: h.endereco, fone: h.fone || '', estrelas: h.estrelas || 0, cidade: h.cidade || '', buscado: h.nome }); salva(); telaVoucher();
      const f = faltouHotel(h); nota(f || 'Endereço, telefone e categoria preenchidos. Confira antes de mandar.', !!f);
    };
    let ultimo = '';
    const busca = async () => {
      const q = v.hotel.trim(); if (q.length < 4 || q === ultimo) return; ultimo = q;
      const local = buscaHotel(q);
      nota('Procurando “' + q + '”…');
      try {
        const l = await buscaHotelOnline(q);
        if (!l.length && !local && v.buscado && v.buscado !== v.hotel) {   /* o endereço que está ali é do hotel anterior: não pode ficar */
          Object.assign(v, { endereco: '', fone: '', estrelas: 0, cidade: '', buscado: '' }); salva(); telaVoucher();
        }
        if (!l.length) { if (local) return usa(local); return nota('Não achei esse hotel. Tente com o nome e a cidade (ex.: “Hilton Garden Inn Tirana”), ou preencha à mão.', true); }
        if (l.length === 1 || norm(l[0].nome) === norm(q)) return usa(l[0]);
        const ul = $('#v-achados'); ul.hidden = false; nota('Achei mais de um. Qual é?');
        ul.innerHTML = l.map((h, i) => `<li><button data-achado="${i}"><b>${esc(h.nome)}</b><span>${esc(h.endereco)}</span></button></li>`).join('');
        $$('[data-achado]', ul).forEach(b => b.onclick = () => usa(l[+b.dataset.achado]));
      } catch (e) {
        if (local) return usa(local);
        nota('A busca não respondeu agora. Tente de novo em instantes, ou preencha à mão.', true); ultimo = '';
      }
    };
    $('#v-busca').onclick = () => { ultimo = ''; busca(); };
    $('#v-hotel').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ultimo = ''; busca(); } });
    $('#v-hotel').addEventListener('change', busca);   /* ao sair do campo, já busca */
    $('#v-ex').onclick = () => { exemploVoucher(); telaVoucher(); };
    $('#v-foto').onchange = (e) => { const f = e.target.files[0]; if (f) reduzFoto(f, (url) => { v.foto = url; salva(); telaVoucher(); }); };
    const sf = $('#v-semfoto'); if (sf) sf.onclick = () => { v.foto = ''; salva(); telaVoucher(); };
    $('#v-pdf').onclick = () => imprime(nomeArquivoVoucher(q));
    $('#v-nome').onclick = () => copia(nomeArquivoVoucher(q), 'Nome do arquivo copiado');
  }

  /* =====================================================================
     TELA 4 — PASSAPORTES
     ===================================================================== */
  function voltaDaViagem() {
    const d = E.cot.opcoes.flatMap(o => o.segmentos.map(s => s.dataChegada)).sort();
    return d.length ? d[d.length - 1] : (E.vou.checkout || '');
  }
  function telaPassaportes() {
    const volta = voltaDaViagem();
    const cartoes = E.pass.map((p, i) => {
      const al = Passaporte.alertaValidade(p, volta), cmd = Passaporte.comandos(p, i + 1);
      return `<article class="pass">
        <header><h3>${esc(p.nomeCompleto)}</h3><span class="confere ${p.confere ? 'sim' : 'nao'}">${p.confere ? 'Dígitos conferem' : 'Leitura duvidosa: confira com a foto'}</span></header>
        <dl><dt>Sobrenome</dt><dd>${esc(p.sobrenome)}</dd><dt>Nome</dt><dd>${esc(p.nome)}</dd><dt>Passaporte</dt><dd>${esc(p.numero)} · ${esc(p.emissor)}</dd>
          <dt>Nascimento</dt><dd>${diaNum(p.nascimento)}</dd><dt>Validade</dt><dd>${diaNum(p.validade)}</dd></dl>
        ${al ? `<p class="alerta">${esc(al)}</p>` : volta ? `<p class="certo">Vale mais de 6 meses depois da volta (${diaNum(volta)}).</p>` : ''}
        <div class="cmd"><span>Para colar no Amadeus</span><pre>${cmd.map(esc).join('\n')}</pre>
          <button class="btn fantasma" data-cmd="${i}">Copiar comandos</button><button class="btn fantasma" data-tirap="${i}">Apagar</button></div>
      </article>`;
    }).join('');
    $('#palco').innerHTML = `
    <div class="pas">
      <section class="pas-entrada">
        <h1>Passaportes</h1>
        <p class="sub">No app de verdade você solta aqui a foto que o cliente mandou no WhatsApp e eu leio sozinho. Neste protótipo, cole as duas linhas do rodapé do passaporte (as que têm <kbd>&lt;&lt;&lt;</kbd>).</p>
        <textarea id="mrz" class="mono" rows="3" spellcheck="false" placeholder="P&lt;BRASOBRENOME&lt;&lt;NOME&lt;&lt;&lt;&lt;&lt;&lt;&lt;&#10;AB123456&lt;0BRA8001011F3001017&lt;&lt;&lt;&lt;"></textarea>
        <div class="acoes"><button class="btn primario" id="p-ler">Ler passaporte</button>
          ${EXEMPLOS.PASSAPORTES.map((x, i) => `<button class="chip" data-pex="${i}">Exemplo ${i + 1}</button>`).join('')}</div>
        <p class="nota">Os exemplos são passaportes inventados. Os dados reais ficam só no banco da agência, nunca em link público.</p>
      </section>
      <section class="pas-lista">${cartoes || '<div class="vazio"><h2>Nenhum passaporte lido</h2><p>O nome sai exatamente como está no documento, e vai sozinho para o voucher e para os comandos do Amadeus. Sem redigitar.</p></div>'}</section>
    </div>`;
    const le = (txt) => {
      const p = Passaporte.ler(txt, { hoje: HOJE });
      if (!p) return aviso('Não achei as duas linhas do passaporte nesse texto.');
      if (E.pass.some(x => x.numero === p.numero)) return aviso('Esse passaporte já está na lista.');
      E.pass.push(p); salva(); telaPassaportes(); aviso(p.nomeCompleto + ' lido');
    };
    $('#p-ler').onclick = () => le($('#mrz').value);
    $$('[data-pex]').forEach(b => b.onclick = () => { const m = Passaporte.monta(EXEMPLOS.PASSAPORTES[+b.dataset.pex]); $('#mrz').value = m; le(m); });
    $$('[data-cmd]').forEach(b => b.onclick = () => copia(Passaporte.comandos(E.pass[+b.dataset.cmd], +b.dataset.cmd + 1).join('\n'), 'Comandos copiados'));
    $$('[data-tirap]').forEach(b => b.onclick = () => { E.pass.splice(+b.dataset.tirap, 1); salva(); telaPassaportes(); });
  }

  /* ---------- rotas ---------- */
  /* =====================================================================
     TELA 5 — CNT (as duas tabelas da consolidadora)
     ===================================================================== */
  let COLADO = null;   /* o que foi colado e lido, antes de ele confirmar a troca */
  const LIMITE_LISTA = 40;

  function feeResumo(linhas) {
    if (!linhas || !linhas.length) return '';
    const v = [...new Set(linhas.map(l => l.fee))].sort((a, b) => a - b);
    return v.length === 1 ? (v[0] ? 'fee ' + v[0] : 'sem fee') : 'fee ' + (v.length === 2 ? v.join(' ou ') : v[0] + ' a ' + v[v.length - 1]);
  }
  function parcResumo(p) {
    if (!p || !p.regra) return '';
    return p.parcelas > 1 ? p.parcelas + 'x' + (p.semJuros ? ' sem juros' : '') : p.parcelas === 0 ? 'não parcela' : 'parcelamento não informado';
  }
  const numsLinha = (x) => 'fee ' + x.fee + (x.incentivo ? ', incentivo ' + pctBr(x.incentivo) : '') + (x.comissao ? ', comissão ' + pctBr(x.comissao) : '');

  function telaCnt() {
    const nR = REGRAS ? Object.keys(REGRAS.cias).length : 0;
    const velho = REGRAS && REGRAS.lidoEm ? (dt(isoHoje()) - dt(REGRAS.lidoEm)) / 864e5 > 30 : false;
    $('#palco').innerHTML = `
    <div class="cnt-tela">
      <h1>Tabelas da CNT</h1>
      <p class="sub">É daqui que a cotação tira o fee e o parcelamento de cada companhia. Quando a CNT mudar a tabela de fee, cole a nova aqui.</p>
      <section class="cartao">
        <div class="cartao-topo"><h2>Fee, incentivo e comissão</h2><span class="cia-tag">área com senha</span></div>
        <div id="fee-status"></div>
        <ol class="passos">
          <li>Abra <a href="https://condicoes.cntour.com.br/dashboard/tabela" target="_blank" rel="noopener">condicoes.cntour.com.br</a>, entre com a sua senha e clique em <b>Ver Tabela</b>.</li>
          <li>Selecione a página inteira (<kbd>Ctrl</kbd> + <kbd>A</kbd>) e copie (<kbd>Ctrl</kbd> + <kbd>C</kbd>).</li>
          <li>Cole aqui embaixo (<kbd>Ctrl</kbd> + <kbd>V</kbd>). Eu separo as companhias e mostro o que mudou antes de trocar.</li>
        </ol>
        <textarea id="cola-fee" rows="5" spellcheck="false" autocomplete="off" aria-label="Página Ver Tabela copiada do site da CNT" placeholder="Cole aqui a página Ver Tabela da CNT"></textarea>
        <div id="fee-lido" class="fee-lido" aria-live="polite"></div>
      </section>
      <section class="cartao">
        <div class="cartao-topo"><h2>Parcelamento</h2><span class="cia-tag">página aberta</span></div>
        ${REGRAS ? `<p>Em uso: página de <b>${diaNum(REGRAS.lidoEm)}</b>, com ${nR} companhias.</p>
          ${velho ? '<p class="alerta">Este retrato tem mais de 30 dias. Confira na página da CNT antes de prometer parcelamento.</p>' : ''}
          <p class="nota">Esta página não tem senha. No app de verdade eu leio ela sozinho todo dia e aviso quando uma companhia mudar. Neste protótipo ela é um retrato. <a href="${esc(REGRAS.fonte)}" target="_blank" rel="noopener">Abrir a página da CNT</a></p>`
          : '<p class="alerta">O retrato do parcelamento não veio junto com este protótipo.</p>'}
      </section>
      <section class="cartao">
        <div class="cartao-topo"><h2>O que está valendo</h2><input id="busca-cia" type="search" placeholder="Procurar companhia" aria-label="Procurar companhia"></div>
        <div id="valendo" class="valendo"></div>
      </section>
    </div>`;
    const ta = $('#cola-fee');
    let t;
    ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { COLADO = ta.value.trim() ? leColado(ta.value) : null; pintaColado(); }, 150); });
    $('#busca-cia').oninput = pintaValendo;
    COLADO = null;
    pintaFeeStatus(); pintaValendo();
  }

  function leColado(texto) {
    const lido = CNT.lerCondicoes(texto), n = CNT.contaCondicoes(lido);
    return { lido, n, dif: CNT.comparaCondicoes(conds(), lido) };
  }

  function pintaFeeStatus() {
    const el = $('#fee-status'); if (!el) return;
    const C = conds(), n = CNT.contaCondicoes(C);
    el.innerHTML = C
      ? `<p>Em uso: tabela de <b>${diaNum(C.lidoEm)}</b>, com ${n.cias} companhias e ${n.linhas} linhas ${FEE.atual && !FEE.atual.retrato ? '(colada por você)' : '(retrato que veio com o protótipo)'}.
          ${FEE.anterior ? '<button class="tira" id="volta-fee">Voltar à tabela anterior</button>' : ''}</p>`
      : '<p class="alerta">Ainda não há tabela de fee. Cole a primeira seguindo os passos abaixo.</p>';
    const v = $('#volta-fee');
    if (v) v.onclick = () => { FEE = { atual: FEE.anterior, anterior: FEE.atual }; salvaFee(); R = null; aviso('Voltei à tabela anterior'); pintaFeeStatus(); pintaValendo(); pintaColado(); };
  }

  function pintaColado() {
    const el = $('#fee-lido'); if (!el) return;
    if (!COLADO) { el.innerHTML = ''; return; }
    if (COLADO.lido && $('#cola-fee').value.trim()) COLADO = leColado($('#cola-fee').value);   /* a tabela em uso pode ter mudado */
    const { lido, n, dif } = COLADO, tem = !!conds();
    if (!n.cias) {
      el.innerHTML = '<p class="alerta">Não achei a tabela nesse texto. Confira se copiou a página <b>Ver Tabela</b>: cada linha termina com três números, como 0% 3% 0.</p>';
      return;
    }
    const partes = [`<p>Li <b>${plural(n.cias, 'companhia', 'companhias')}</b> e <b>${plural(n.linhas, 'linha', 'linhas')}</b>.</p>`];
    if (lido.semCodigo.length) partes.push(`<p class="alerta">Não reconheci ${lido.semCodigo.length === 1 ? 'esta companhia' : 'estas companhias'}: ${esc(lido.semCodigo.join(', '))}. Ficou de fora da leitura; me avise para eu cadastrar.</p>`);
    let pode = true, rotulo = tem ? 'Usar esta tabela' : 'Guardar esta tabela';
    if (tem && dif.igual) { partes.push('<p class="certo">É igual à tabela em uso. Não precisa trocar.</p>'); pode = false; }
    else if (tem) {
      if (dif.sairam.length) {
        partes.push(`<p class="alerta">${dif.sairam.length === 1 ? 'Esta companhia está' : 'Estas ' + dif.sairam.length + ' companhias estão'} na tabela em uso e não ${dif.sairam.length === 1 ? 'veio' : 'vieram'} no texto colado: ${esc(dif.sairam.map(x => x.nome).join(', '))}. Se você copiou só um pedaço da página, copie tudo de novo.</p>`);
        rotulo = 'Usar mesmo assim';
      }
      if (dif.novas.length) partes.push(`<p><b>Companhias novas:</b> ${esc(dif.novas.map(x => x.nome + ' (' + plural(x.linhas, 'linha', 'linhas') + ')').join(', '))}.</p>`);
      const itens = dif.mudaram.flatMap(m => m.itens.map(i => ({ nome: m.nome, i })));
      if (itens.length) {
        const li = itens.slice(0, LIMITE_LISTA).map(({ nome, i }) => {
          const oque = i.tipo === 'mudou' ? `<span class="de">${esc(numsLinha(i.de))}</span> → <b>${esc(numsLinha(i.linha))}</b>` : i.tipo === 'nova' ? `linha nova, <b>${esc(numsLinha(i.linha))}</b>` : 'linha saiu';
          return `<li class="${i.tipo}"><b>${esc(nome)}</b><span class="desc">${esc(i.linha.descricao)}</span><span class="oque">${oque}</span></li>`;
        }).join('');
        partes.push(`<p><b>${plural(itens.length, 'linha mudou', 'linhas mudaram')}</b> em ${plural(dif.mudaram.length, 'companhia', 'companhias')}:</p><ul class="mudancas">${li}</ul>` + (itens.length > LIMITE_LISTA ? `<p class="nota">E mais ${itens.length - LIMITE_LISTA}.</p>` : ''));
      }
    }
    partes.push(`<div class="acoes">${pode ? `<button class="btn primario" id="usa-fee">${rotulo}</button>` : ''}<button class="btn fantasma" id="larga-fee">${pode ? 'Descartar' : 'Limpar'}</button></div>`);
    el.innerHTML = partes.join('');
    const limpa = () => { COLADO = null; $('#cola-fee').value = ''; pintaColado(); };
    $('#larga-fee').onclick = limpa;
    const usa = $('#usa-fee');
    if (usa) usa.onclick = () => {
      /* a anterior fica guardada para ele poder voltar; se era o retrato do protótipo, leva a marca */
      FEE = { atual: { lidoEm: isoHoje(), cias: lido.cias }, anterior: FEE.atual || (FEE_ARQUIVO ? Object.assign({ retrato: true }, FEE_ARQUIVO) : null) };
      salvaFee(); R = null;   /* a cotação aberta relê o fee na próxima vez que for pintada */
      aviso('Tabela de fee trocada. As próximas cotações já usam a nova.');
      limpa(); pintaFeeStatus(); pintaValendo();
    };
  }

  function pintaValendo() {
    const el = $('#valendo'); if (!el) return;
    const C = conds(), busca = ($('#busca-cia').value || '').trim().toLowerCase();
    const cods = [...new Set([...(REGRAS ? Object.keys(REGRAS.cias) : []), ...(C ? Object.keys(C.cias) : [])])];
    const linhas = cods.map(k => {
      const p = TEM_CNT && REGRAS ? CNT.sugere(REGRAS, k, { canal: 'GDS' }) : null, cond = C && C.cias[k] ? C.cias[k].linhas : null;
      const nome = CIAS[k] || (p && p.regra && p.regra.nome) || (C && C.cias[k] && C.cias[k].nome) || k;
      return { k, nome, p, cond };
    }).filter(x => !busca || (x.nome + ' ' + x.k).toLowerCase().includes(busca)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (!linhas.length) { el.innerHTML = `<p class="nota">${busca ? 'Nenhuma companhia com esse nome nas tabelas da CNT.' : 'Nenhuma tabela carregada.'}</p>`; return; }
    el.innerHTML = linhas.map(x => `<details class="val">
      <summary><b>${esc(x.nome)}</b><span class="cod">${esc(x.k)}</span><span>${esc(parcResumo(x.p) || 'sem regra de parcelamento')}${x.p && x.p.codigos.length ? ' · ' + esc(x.p.codigos[0]) : ''}</span><span>${esc(feeResumo(x.cond) || 'fora da tabela de fee')}</span></summary>
      ${x.p && x.p.texto && x.p.texto !== '-' ? `<p class="cnt-aviso"><b>Parcelamento:</b> ${esc(x.p.texto)}</p>` : ''}
      ${x.p && x.p.duvida ? `<p class="alerta">${esc(x.p.duvida)}</p>` : ''}
      ${x.cond ? `<ul class="cnt-linhas">${x.cond.map(l => `<li class="cnt-linha"><span class="desc">${esc(l.descricao)}</span><span class="nums"><b>fee ${l.fee}</b>${l.incentivo ? `<i>incentivo ${pctBr(l.incentivo)}</i>` : ''}${l.comissao ? `<i>comissão ${pctBr(l.comissao)}</i>` : ''}</span></li>`).join('')}</ul>` : ''}
    </details>`).join('');
  }

  /* =====================================================================
     TELA — CLIENTES: o cadastro que se faz sozinho e o histórico das propostas
     ===================================================================== */
  let CLI = '';   /* o cliente aberto na tela */
  const dataHora = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
  function propostasDe(id) { return E.propostas.filter(p => p.clienteId === id).sort((a, b) => (b.atualizada || '').localeCompare(a.atualizada || '')); }
  function telaClientes() {
    if (CLI && !E.clientes.some(x => x.id === CLI)) CLI = '';
    $('#palco').innerHTML = `
    <div class="cli">
      <section class="cli-lista">
        <div class="mont-cab"><h1>Clientes</h1><button class="btn primario" id="cli-nova">Nova cotação</button></div>
        <p class="sub">Toda cotação com o nome do cliente entra aqui sozinha, com o histórico das propostas e dos vouchers.</p>
        <div class="seguranca"><b>Cópia de segurança</b><span>Tudo fica só neste computador. Baixe a cópia toda semana: se o navegador for limpo, é com ela que você recupera.</span>
          <span class="dupla"><button class="btn fantasma" id="cop-baixa">Baixar a cópia</button><label class="btn fantasma">Restaurar<input type="file" id="cop-volta" accept=".json,application/json" hidden></label></span></div>
        <input id="cli-busca" type="search" placeholder="Procurar cliente" aria-label="Procurar cliente">
        <ul id="cli-nomes" class="cli-nomes"></ul>
      </section>
      <section class="cli-ficha" id="cli-ficha"></section>
    </div>`;
    $('#cli-busca').oninput = pintaNomes;
    $('#cop-baixa').onclick = () => {
      salva();
      const dado = Object.assign({}, E, { propostas: E.propostas.map(p => p.cot === E.cot ? Object.assign({}, p, { cot: null }) : p), vouchers: E.vouchers.map(x => x.vou === E.vou ? Object.assign({}, x, { vou: null }) : x) });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'simonetta-painel', versao: 1, salvoEm: new Date().toISOString(), dado })], { type: 'application/json' }));
      a.download = 'Simonetta - copia de seguranca ' + isoHoje() + '.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); localStorage.setItem(CHAVE + '_copia', isoHoje());
      aviso('Cópia baixada. Guarde o arquivo numa pasta segura.');
    };
    $('#cop-volta').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(txt => {
        const j = JSON.parse(txt);
        if (!j || j.app !== 'simonetta-painel' || !j.dado || !j.dado.cot) throw new Error('arquivo errado');
        if (!confirm('Restaurar a cópia de ' + new Date(j.salvoEm).toLocaleDateString('pt-BR') + '? O que está agora neste computador será trocado por ela.')) return;
        localStorage.setItem(CHAVE, JSON.stringify(j.dado)); location.reload();
      }).catch(() => aviso('Esse arquivo não é uma cópia de segurança deste painel.'));
    };
    $('#cli-nova').onclick = () => { E.cot = novaCot(); R = null; E.texto = ''; salva(); location.hash = '#/cotacao'; };
    pintaNomes(); pintaFicha();
  }
  function pintaNomes() {
    const el = $('#cli-nomes'); if (!el) return;
    const b = norm($('#cli-busca').value);
    const l = E.clientes.map(c => ({ c, ps: propostasDe(c.id) })).filter(x => !b || norm(x.c.nome).includes(b))
      .sort((a, b) => ((b.ps[0] || {}).atualizada || '').localeCompare((a.ps[0] || {}).atualizada || ''));
    el.innerHTML = l.length ? l.map(({ c, ps }) => `<li><button class="cli-nome${c.id === CLI ? ' on' : ''}" data-cli="${c.id}"><b>${esc(c.nome)}</b>
        <span>${[ps.length ? plural(ps.length, 'proposta', 'propostas') : '', (n => n ? plural(n, 'voucher', 'vouchers') : '')(E.vouchers.filter(x => norm(x.cliente) === norm(c.nome)).length)].filter(Boolean).join(' · ') || 'sem nada ainda'}${ps[0] ? ' · última em ' + esc(new Date(ps[0].atualizada).toLocaleDateString('pt-BR')) : ''}</span></button></li>`).join('')
      : `<li class="nota">${b ? 'Nenhum cliente com esse nome.' : 'Ainda não há clientes. Faça uma cotação com o nome do cliente e ele aparece aqui.'}</li>`;
    $$('[data-cli]', el).forEach(x => x.onclick = () => { CLI = x.dataset.cli; pintaNomes(); pintaFicha(); if (innerWidth < 940) $('#cli-ficha').scrollIntoView({ behavior: 'smooth' }); });
  }
  function pintaFicha() {
    const el = $('#cli-ficha'); if (!el) return;
    const c = E.clientes.find(x => x.id === CLI);
    if (!c) { el.innerHTML = '<div class="vazio"><h2>Escolha um cliente</h2><p>Aqui aparecem os dados dele e todas as propostas, da mais nova para a mais antiga. Dá para abrir, duplicar para outra data ou apagar.</p></div>'; return; }
    const ps = propostasDe(c.id);
    el.innerHTML = `
      <div class="mont-cab"><h2>${esc(c.nome)}</h2><button class="btn fantasma" id="cli-cot">Nova cotação para ${esc(c.nome.split(' ')[0])}</button></div>
      <div class="grade2">
        <label>Nome<input data-cli-campo="nome" value="${esc(c.nome)}"></label>
        <label>WhatsApp<input data-cli-campo="fone" value="${esc(c.fone)}" inputmode="tel" placeholder="(11) 99999-9999"></label>
        <label>E-mail<input data-cli-campo="email" value="${esc(c.email)}" type="email"></label>
        <label>Cliente desde<input value="${esc(diaNum(c.criado))}" disabled></label>
        <label class="largo">Observações<textarea data-cli-campo="obs" rows="2" placeholder="Prefere janela, viaja com a esposa, cartão Amex...">${esc(c.obs)}</textarea></label>
      </div>
      ${(() => { const vs = E.vouchers.filter(x => norm(x.cliente) === norm(c.nome)).sort((a, b) => (b.atualizado || '').localeCompare(a.atualizado || ''));
        return vs.length ? `<h3 class="cli-sub">Vouchers</h3><ul class="cli-props" id="cli-vouchers">${vs.map(itemVoucher).join('')}</ul>` : ''; })()}
      <h3 class="cli-sub">Propostas</h3>
      <ul class="cli-props">${ps.map(p => `<li class="cli-prop">
          <div><span class="cia-tag">${p.tipo === 'pacote' ? 'Pacote' : 'Aéreo'}</span>${p.cot === E.cot ? '<span class="cli-aberta">aberta agora</span>' : ''}
            <b>${esc(p.titulo || 'Proposta')}</b><span>${esc([p.resumo, 'mudada em ' + dataHora(p.atualizada)].filter(Boolean).join(' · '))}</span></div>
          <div class="cli-acoes"><button class="btn primario" data-abre="${p.id}">Abrir</button><button class="btn fantasma" data-dup="${p.id}">Duplicar</button><button class="tira" data-apaga="${p.id}">Apagar</button></div>
        </li>`).join('') || '<li class="nota">Nenhuma proposta ainda.</li>'}</ul>`;
    $$('[data-cli-campo]', el).forEach(x => x.oninput = () => {
      const k = x.dataset.cliCampo; c[k] = x.value;
      if (k === 'nome') { const antes = norm(x.dataset.antes || c.nome); for (const p of E.propostas) if (p.clienteId === c.id && p.cot) p.cot.cliente = x.value;
        for (const y of E.vouchers) if (norm(y.cliente) === antes && y.vou) { y.vou.cliente = x.value; y.cliente = x.value; } x.dataset.antes = x.value; }
      salva(); if (k === 'nome') pintaNomes();
    });
    const cv = $('#cli-vouchers'); if (cv) ligaVouchers(cv, () => { pintaNomes(); pintaFicha(); });
    $('#cli-cot').onclick = () => { E.cot = Object.assign(novaCot(), { cliente: c.nome, clienteId: c.id }); R = null; E.texto = ''; salva(); location.hash = '#/cotacao'; };
    $$('[data-abre]', el).forEach(b => b.onclick = () => abreCot(E.propostas.find(p => p.id === b.dataset.abre).cot, '#/proposta'));
    $$('[data-dup]', el).forEach(b => b.onclick = () => {
      const o = E.propostas.find(p => p.id === b.dataset.dup);
      const nova = Object.assign(JSON.parse(JSON.stringify(o.cot)), { id: uid(), criada: isoHoje() });
      abreCot(nova, '#/cotacao'); aviso('Cópia aberta na Cotação. A original continua guardada.');
    });
    $$('[data-apaga]', el).forEach(b => b.onclick = () => {
      const o = E.propostas.find(p => p.id === b.dataset.apaga);
      if (!confirm('Apagar a proposta "' + (o.titulo || '') + '"? Não dá para desfazer.')) return;
      E.propostas = E.propostas.filter(p => p !== o);
      if (o.cot === E.cot) E.cot = novaCot();
      salva(); pintaNomes(); pintaFicha();
    });
  }

  const TELAS = { cotacao: telaCotacao, proposta: telaProposta, voucher: telaVoucher, passaportes: telaPassaportes, cnt: telaCnt, cliente: telaCliente, clientes: telaClientes };
  function rota() {
    const aba = (location.hash.replace(/^#\/?/, '').split('/')[0]) || 'cotacao';
    const tela = TELAS[aba] ? aba : 'cotacao';
    $$('.abas a').forEach(a => a.setAttribute('aria-current', a.dataset.aba === tela ? 'page' : 'false'));
    document.body.dataset.tela = tela;
    TELAS[tela]();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', rota);
  /* index.html?exemplo#/cliente abre já com a cotação e o voucher de exemplo: é o link para mandar a quem
     vai ver pela primeira vez. Só monta o exemplo se ainda não houver cotação (não apaga o que a pessoa já fez),
     e tira o "?exemplo" do endereço para que recarregar a página não refaça nada. */
  if (/[?&]exemplo\b/.test(location.search)) {
    if (!temConteudo(E.cot)) { if (/exemplo=pacote/.test(location.search)) exemploPacote(); else montaExemploInteiro(); exemploVoucher(); }
    if (/quarto=2/.test(location.search) && E.vou.quartos.length > 1) { E.vou.ativo = 1; salva(); }
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* abrindo do arquivo: segue com o endereço como está */ }
  }
  rota();
})();
