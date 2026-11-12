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
  const vazio = () => ({
    cot: { destino: '', cliente: '', pax: 2, criada: isoHoje(), opcoes: [], capa: '' },
    texto: '',
    vou: { hotel: '', endereco: '', fone: '', estrelas: 0, checkin: '', checkout: '', horaIn: '15:00', horaOut: '12:00',
      regime: 'com café da manhã', quartos: [{ tipo: 'SINGLE', hospedes: [''], obs: '' }], info: '', ativo: 0 },
    pass: [],
  });
  let E = vazio();
  try { const g = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if (g && g.cot && g.vou) E = Object.assign(vazio(), g); } catch (e) { /* começa vazio */ }
  const salva = () => { try { localStorage.setItem(CHAVE, JSON.stringify(E)); } catch (e) { /* sem espaço: segue só na memória */ } };

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
    E.cot = { destino: '', cliente: 'Rafael Monteiro', pax: 2, criada: '2026-11-09', opcoes: [], capa: E.cot.capa || '' };
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
    $('#palco').innerHTML = `
    <div class="cot">
      <section class="col-term">
        <h1>Cole aqui a tela do Amadeus</h1>
        <p class="sub">Pode colar tudo de uma vez: <kbd>RT</kbd>, <kbd>TQT</kbd>, <kbd>FXB</kbd> e <kbd>FQN1*PE</kbd>. Eu separo os voos, o preço e as regras.</p>
        <div class="terminal">
          <div class="term-barra"><span>SAOXX0000 · Página de comando</span><button class="term-limpa" id="limpa">Limpar</button></div>
          <textarea id="tela" spellcheck="false" autocomplete="off" aria-label="Tela do Amadeus" placeholder="&gt; rt&#10;&gt; tqt&#10;&gt; fqn1*pe&#10;&#10;Selecione tudo no terminal (Ctrl+A), copie e cole aqui.">${esc(E.texto)}</textarea>
        </div>
        <div class="exemplos"><span>Sem o Amadeus aberto? Use uma tela do vídeo:</span>${ex}</div>
      </section>
      <section class="col-lido" id="lido" aria-live="polite"></section>
    </div>
    <section class="montagem" id="montagem"></section>`;

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

  function pintaMontagem() {
    const el = $('#montagem'); if (!el) return;
    const c = E.cot;
    const ops = c.opcoes.map(o => `<li><div><b>${esc(nomeOpcao(o))}</b><span>${o.tarifas.map(t => esc(t.rotulo) + ' ' + usd(precoFinal(t))).join(' · ')}</span></div>
      <button class="tira" data-tira="${o.id}" aria-label="Tirar ${esc(nomeOpcao(o))} da proposta">Tirar</button></li>`).join('');
    el.innerHTML = `
      <div class="mont-cab"><h2>Proposta em montagem</h2>
        <button class="btn fantasma" id="tudo">Montar a cotação inteira do vídeo</button></div>
      <div class="mont-campos">
        <label>Destino<input id="m-destino" value="${esc(c.destino)}" placeholder="Paris"></label>
        <label>Cliente<input id="m-cliente" value="${esc(c.cliente)}" placeholder="Nome de quem pediu"></label>
        <label>Passageiros<input id="m-pax" type="number" min="1" max="20" value="${c.pax}"></label>
      </div>
      ${ops ? `<ul class="mont-ops">${ops}</ul>` : `<p class="mont-vazia">Nenhuma opção ainda. Cole uma tela do Amadeus acima e toque em “Adicionar à proposta”.</p>`}
      <a class="btn primario ${ops ? '' : 'apagado'}" href="#/proposta">Abrir a proposta</a>`;
    $('#m-destino').oninput = (e) => { c.destino = e.target.value; salva(); };
    $('#m-cliente').oninput = (e) => { c.cliente = e.target.value; salva(); };
    $('#m-pax').oninput = (e) => { c.pax = Math.max(1, +e.target.value || 1); salva(); };
    $('#tudo').onclick = () => { montaExemploInteiro(); aviso('2 opções e 4 tarifas montadas'); telaCotacao(); };
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

  function propostaDoc() {
    const c = E.cot, per = periodo(), prazo = prazoMaisCurto(), n = c.opcoes.length;
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

  const nomePdf = () => 'Proposta ' + (E.cot.destino || '') + (E.cot.cliente ? ' - ' + E.cot.cliente : '');
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
    if (!c.opcoes.length) {
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
    if (!E.cot.opcoes.length) { location.hash = '#/proposta'; return; }
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

  function reduzFoto(arq, pronto) {
    const img = new Image(), url = URL.createObjectURL(arq);
    img.onload = () => {
      const k = Math.min(1, 1500 / img.width), cv = document.createElement('canvas');
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

  function exemploVoucher() {
    const h = HOTEIS[0];
    E.vou = { hotel: h.nome, endereco: h.endereco, fone: h.fone, estrelas: h.estrelas, checkin: '2026-11-10', checkout: '2026-11-16', horaIn: '15:00', horaOut: '12:00',
      regime: 'com café da manhã', quartos: [{ tipo: 'SINGLE', hospedes: ['Marina Monteiro Lima'], obs: '' }, { tipo: 'TWIN BED', hospedes: ['Rafael Augusto Monteiro', 'Helena Duarte Prado'], obs: '' }], info: '', ativo: 0 };
    salva();
  }

  function voucherHtml(q, n, total) {
    const v = E.vou, nt = noites(v);
    const hs = q.hospedes.slice(0, camas(q.tipo));
    return `<article class="folha voucher">
      <header class="v-topo"><img src="arte/logo-simonetta.png" alt="Simonetta Viagens">
        <address><b>${esc(AG.razao)}</b><span>${esc(AG.cidade)}</span>${AG.fones.map(f => `<span>Tel.: ${esc(f)}</span>`).join('')}<span>${esc(AG.email)}</span></address></header>
      <h1 class="v-faixa centro">${esc(v.hotel || 'Nome do hotel')}</h1>
      <h2 class="v-faixa">Hotel</h2>
      <div class="v-caixa">
        <p class="v-nome">${esc(v.hotel || '—')}</p>
        <dl class="v-grade"><dt>Endereço:</dt><dd class="largo">${esc(v.endereco || '—')}</dd><dt>Telefone:</dt><dd>${esc(v.fone || '—')}</dd></dl>
        <dl class="v-grade"><dt>Data Check-in:</dt><dd>${v.checkin ? diaNum(v.checkin) : '—'} <span>${esc(v.horaIn)}h</span></dd><dt>Data Check-out:</dt><dd>${v.checkout ? diaNum(v.checkout) : '—'} <span>${esc(v.horaOut)}h</span></dd></dl>
        <dl class="v-grade"><dt>Regime:</dt><dd>${esc(v.regime)}</dd><dt>Nº de noites:</dt><dd>${nt || '—'}</dd></dl>
      </div>
      <h2 class="v-faixa">Room${total > 1 ? ' ' + (n + 1) : ''}</h2>
      <div class="v-caixa">
        <dl class="v-grade"><dt>Tipo de quarto:</dt><dd>${esc(q.tipo)}</dd><dt>Categoria:</dt><dd>${v.estrelas ? v.estrelas + '*' : '—'}</dd></dl>
        <dl class="v-grade nomes">${hs.map(h => `<dt>Nome:</dt><dd>${esc((h || '').toUpperCase() || '—')}</dd>`).join('')}</dl>
        <dl class="v-grade"><dt>Observação:</dt><dd class="largo">${esc(q.obs)}</dd></dl>
      </div>
      <h2 class="v-faixa">Informações adicionais</h2>
      <div class="v-caixa alta">${esc(v.info)}</div>
    </article>`;
  }

  function telaVoucher() {
    const v = E.vou;
    const q = v.quartos[v.ativo] || v.quartos[0];
    const lidos = E.pass.map(p => p.nomeCompleto);
    $('#palco').innerHTML = `
    <div class="vou">
      <section class="vou-form nao-imprime">
        <div class="mont-cab"><h1>Voucher de hotel</h1><button class="btn fantasma" id="v-ex">Preencher com o exemplo</button></div>
        <label class="busca">Qual é o hotel?<span class="dupla"><input id="v-hotel" value="${esc(v.hotel)}" placeholder="Ex.: savoy marrakech"><button class="btn" id="v-busca">Buscar dados</button></span></label>
        <p class="nota" id="v-nota">Endereço, telefone e categoria vêm da busca. Neste protótipo eu conheço três hotéis (Savoy Marrakech, Sofitel Lisboa, Crillon Paris); no app de verdade a busca é no Google.</p>
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
        <div class="acoes"><button class="btn primario" id="v-pdf">Baixar PDF deste quarto</button>
          <button class="btn fantasma" id="v-nome">Copiar o nome do arquivo</button></div>
      </section>
      <section class="vou-doc"><p class="arquivo nao-imprime">${esc(nomeArquivoVoucher(q))}.pdf</p><div id="v-folha">${voucherHtml(q, v.ativo, v.quartos.length)}</div></section>
    </div>`;

    const repinta = () => { salva(); $('#v-folha').innerHTML = voucherHtml(q, v.ativo, v.quartos.length); $('.arquivo').textContent = nomeArquivoVoucher(q) + '.pdf'; };
    const campo = (id, k) => { $('#' + id).oninput = (e) => { v[k] = e.target.value; repinta(); }; };
    campo('v-hotel', 'hotel'); campo('v-endereco', 'endereco'); campo('v-fone', 'fone'); campo('v-estrelas', 'estrelas');
    campo('v-checkin', 'checkin'); campo('v-checkout', 'checkout'); campo('v-info', 'info');
    $('#v-obs').oninput = (e) => { q.obs = e.target.value; repinta(); };
    $$('[data-hosp]').forEach(c => c.oninput = () => { q.hospedes[+c.dataset.hosp] = c.value; repinta(); });
    $$('[data-regime]').forEach(b => b.onclick = () => { v.regime = b.dataset.regime; salva(); telaVoucher(); });
    $$('[data-tipo]').forEach(b => b.onclick = () => { q.tipo = b.dataset.tipo; salva(); telaVoucher(); });
    $$('[data-quarto]').forEach(b => b.onclick = () => { v.ativo = +b.dataset.quarto; salva(); telaVoucher(); });
    $('#v-mais').onclick = () => { v.quartos.push({ tipo: 'TWIN BED', hospedes: ['', ''], obs: '' }); v.ativo = v.quartos.length - 1; salva(); telaVoucher(); };
    const menos = $('#v-menos'); if (menos) menos.onclick = () => { v.quartos.splice(v.ativo, 1); v.ativo = 0; salva(); telaVoucher(); };
    $('#v-busca').onclick = () => {
      const h = buscaHotel(v.hotel);
      if (!h) { $('#v-nota').textContent = 'Não conheço esse hotel aqui no protótipo. Preencha à mão, ou tente “savoy marrakech”.'; $('#v-nota').classList.add('alerta'); return; }
      Object.assign(v, { hotel: h.nome, endereco: h.endereco, fone: h.fone, estrelas: h.estrelas }); salva(); telaVoucher(); aviso('Endereço, telefone e categoria preenchidos');
    };
    $('#v-ex').onclick = () => { exemploVoucher(); telaVoucher(); };
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

  const TELAS = { cotacao: telaCotacao, proposta: telaProposta, voucher: telaVoucher, passaportes: telaPassaportes, cnt: telaCnt, cliente: telaCliente };
  function rota() {
    const aba = (location.hash.replace(/^#\/?/, '').split('/')[0]) || 'cotacao';
    const tela = TELAS[aba] ? aba : 'cotacao';
    $$('.abas a').forEach(a => a.setAttribute('aria-current', a.dataset.aba === tela ? 'page' : 'false'));
    document.body.dataset.tela = tela;
    TELAS[tela]();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', rota);
  /* index.html?exemplo#/proposta abre já com a cotação e o voucher de exemplo (para mostrar e para conferir o PDF) */
  if (/[?&]exemplo\b/.test(location.search)) { montaExemploInteiro(); exemploVoucher(); if (/quarto=2/.test(location.search)) E.vou.ativo = 1; }
  rota();
})();
