/* Leitor da tela do Amadeus (modo críptico).
   Entra o texto que o agente copiou do terminal (RT, TQT, FXB/FXP, FQN*PE, tudo junto
   ou um pedaço só). Sai o itinerário, a tarifa e as regras já em forma de dado.
   Não chama rede nem API: só lê o que foi colado. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Amadeus = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const MESES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const MES_RX = '(?:' + MESES.join('|') + ')';
  const num = (s) => parseFloat(String(s).replace(/\s/g, ''));
  const cent = (v) => Math.round(v * 100) / 100;

  function limpa(texto) {
    return String(texto || '').replace(/\r/g, '').replace(/[\t ]/g, ' ').toUpperCase();
  }

  /* "11NOV26" -> {d, m, a} */
  function dataCheia(s) {
    const m = String(s || '').match(new RegExp('^(\\d{2})(' + MES_RX + ')(\\d{2})$'));
    return m ? { d: +m[1], m: MESES.indexOf(m[2]), a: 2000 + +m[3] } : null;
  }

  /* "18NOV" não traz ano: usa o ano de referência e pula para o seguinte se já passou. */
  function dataCurta(s, ref) {
    const m = String(s || '').match(new RegExp('^(\\d{2})(' + MES_RX + ')$'));
    if (!m) return null;
    const d = +m[1], mes = MESES.indexOf(m[2]);
    let a = ref.getFullYear();
    const cand = new Date(a, mes, d);
    if (cand.getTime() < ref.getTime() - 3 * 86400000) a += 1;
    return iso(a, mes, d);
  }
  const iso = (a, m, d) => a + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  const hm = (s) => s.slice(0, 2) + ':' + s.slice(2);

  /* ---------- itinerário (RT) ---------- */
  const SEG_RX = new RegExp(
    '^\\s*(?:(\\d{1,2})\\s+)?([A-Z0-9]{2})\\s?(\\d{1,4})\\s+([A-Z])\\s+(\\d{2}' + MES_RX + ')\\s+(\\d)\\s?\\*?\\s*' +
    '([A-Z]{3})([A-Z]{3})\\s+([A-Z]{2})(\\d{1,2})\\s+(\\d{4})\\s+(\\d{4})' +
    '(?:\\s+(\\d{2}' + MES_RX + '))?(?:\\s+E)?(?:\\s+\\d)?(?:\\s+([A-Z0-9]{3})\\b)?');

  function lerSegmentos(T, ref) {
    const l = [];
    for (const linha of T.split('\n')) {
      const m = linha.match(SEG_RX);
      if (!m) continue;
      const data = dataCurta(m[5], ref);
      let chegada = m[13] ? dataCurta(m[13], ref) : data;
      if (chegada < data) chegada = (+chegada.slice(0, 4) + 1) + chegada.slice(4);   /* virada de ano */
      const seg = {
        cia: m[2], voo: String(+m[3]), classe: m[4], data, origem: m[7], destino: m[8],
        status: m[9], lugares: +m[10], sai: hm(m[11]), chega: hm(m[12]), dataChegada: chegada, aeronave: m[14] || '',
      };
      /* o mesmo trecho aparece repetido quando ele cola o RT duas vezes */
      if (!l.some(x => x.cia === seg.cia && x.voo === seg.voo && x.data === seg.data && x.origem === seg.origem)) l.push(seg);
    }
    return l.sort((a, b) => (a.data + a.sai).localeCompare(b.data + b.sai));
  }

  function lerPax(T, segs) {
    const nomes = new Set();
    const rx = /(?:^|\s)(\d)\.([A-Z]+\/[A-Z]+)/g;
    let m;
    while ((m = rx.exec(T))) nomes.add(m[1]);
    if (nomes.size) return nomes.size;
    const fx = T.match(/^\s*TOTALS\s+(\d+)\s/m);
    if (fx) return +fx[1];
    return segs.length ? segs[0].lugares : 0;
  }

  /* ---------- tarifa (TQT / FXB / FXP / FQC) ---------- */
  function lerTarifa(T) {
    const t = { moeda: '', base: 0, equivMoeda: '', equiv: 0, taxas: [], taxasTotal: 0, totalMoeda: '', total: 0,
      bsr: 0, pecas: 0, quilos: 0, fareBasis: [], familia: '', emitirAte: null, naoReembolsavel: null, upsell: null };

    let m = T.match(/\bFARE\s+(?:[A-Z]\s+)?([A-Z]{3})\s+(\d+(?:\.\d+)?)/);
    if (m) { t.moeda = m[1]; t.base = num(m[2]); }
    m = T.match(/\bEQUIV\s+([A-Z]{3})\s+(\d+(?:\.\d+)?)/);
    if (m) { t.equivMoeda = m[1]; t.equiv = num(m[2]); }

    const vistos = new Set();
    const rxTx = /TX\d{3}\s+[A-Z]\s+([A-Z]{3})\s+(\d+(?:\s?\.\s?\d+)?)\s?-\s?([A-Z0-9]{2})/g;
    while ((m = rxTx.exec(T))) {
      const k = m[2] + m[3];
      if (vistos.has(k)) continue;
      vistos.add(k);
      t.taxas.push({ moeda: m[1], valor: num(m[2]), cod: m[3] });
    }
    t.taxasTotal = cent(t.taxas.reduce((s, x) => s + x.valor, 0));

    m = T.match(/^\s*TOTAL\s+([A-Z]{3})\s+(\d+(?:\.\d+)?)(?:\s+BSR\s+(\d+(?:\.\d+)?))?/m);
    if (m) { t.totalMoeda = m[1]; t.total = num(m[2]); if (m[3]) t.bsr = num(m[3]); }

    /* FXB/FXP/FXL: uma linha por passageiro (tarifa, taxas, total) */
    const fx = T.match(/^\s*\d{2}\s+.+?\s+[A-Z]{3}\s+\d\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})/m);
    if (fx) {
      const moedaFx = (T.match(/FARE<([A-Z]{3})>/) || [])[1] || 'BRL';
      if (!t.total) { t.totalMoeda = moedaFx; t.total = num(fx[3]); }
      if (!t.taxasTotal) t.taxasTotal = num(fx[2]);
      if (!t.equiv && !t.base) { t.equivMoeda = moedaFx; t.equiv = num(fx[1]); }
    }

    /* câmbio: BSR do TST, ou o que o FQC respondeu ("1 BRL = 0.18177522 USD") */
    if (!t.bsr) {
      m = T.match(/BSR USED 1 ([A-Z]{3}) = (\d+\.\d+) ([A-Z]{3})/);
      if (m && m[3] === 'USD') t.bsr = cent(10000 / num(m[2])) / 10000;
    }

    m = T.match(/\b(\d)PC\b/);
    if (m) { t.pecas = +m[1]; t.semBagagem = t.pecas === 0; }   /* 0PC existe: tarifa sem mala despachada */
    else if ((m = T.match(/\b(\d{2})K\b/))) t.quilos = +m[1];
    else if ((m = T.match(new RegExp('\\d{2}' + MES_RX + '\\s+(\\d)P\\b')))) t.pecas = +m[1];   /* coluna BG do FQQ: "01JAN 2P" */

    const rxFb = /\bOK\s+([A-Z0-9]{5,10})\b/g;
    while ((m = rxFb.exec(T))) if (!t.fareBasis.includes(m[1])) t.fareBasis.push(m[1]);

    m = T.match(/FARE FAMIL(?:Y|IES)\s*:\s*(?:FC\d+:[\d-]+:\s*)?([A-Z0-9]+)/);
    if (m) t.familia = m[1];

    m = T.match(new RegExp('LAST TKT DTE\\s*(\\d{2}' + MES_RX + '\\d{2})(?:\\s*/\\s*(\\d{2}):(\\d{2}))?'));
    if (m) { const d = dataCheia(m[1]); t.emitirAte = { data: iso(d.a, d.m, d.d), hora: m[2] ? m[2] + ':' + m[3] : '23:59' }; }
    else if ((m = T.match(new RegExp('\\bLD\\s+(\\d{2}' + MES_RX + '\\d{2})\\s+(\\d{4})')))) {
      const d = dataCheia(m[1]); t.emitirAte = { data: iso(d.a, d.m, d.d), hora: hm(m[2]) };
    }

    if (/TICKETS? (?:ARE|IS) NON[- ]REFUNDABLE AFTER DEPARTURE/.test(T)) t.naoReembolsavel = false;
    else if (/TICKETS? (?:ARE|IS) NON[- ]REFUNDABLE/.test(T) || /\bNONREF\b/.test(T)) t.naoReembolsavel = true;

    m = T.match(/TO UPSELL\s+([A-Z0-9]+)-([A-Z0-9]+)\s+FOR\s+(\d+(?:\s?\.\s?\d+)?)\s*([A-Z]{3})/);
    if (m) t.upsell = { de: m[1], para: m[2], valor: num(m[3]), moeda: m[4] };

    return t;
  }

  /* total por pessoa em dólar, do jeito que o FQC arredonda (inteiro mais próximo) */
  function totalUSD(t) {
    if (!t || !t.total) return 0;
    /* o BSR converte para a moeda da TARIFA: se ela não é dólar, dividir daria euro com rótulo de dólar */
    if (t.moeda && t.moeda !== 'USD' && t.totalMoeda !== 'USD') return 0;
    if (t.totalMoeda === 'USD') return Math.round(t.total);
    return t.bsr ? Math.round(t.total / t.bsr) : 0;
  }
  const paraUSD = (valor, bsr) => (bsr ? Math.round(valor / bsr) : 0);

  /* ---------- regras da tarifa (FQN*PE) ---------- */
  function lerRegras(T) {
    const r = { alteracao: null, cancelamento: null };
    let secao = '', quando = '';
    for (const bruta of T.split('\n')) {
      const l = bruta.trim();
      if (/^CHANGES\b\s*$/.test(l)) { secao = 'alteracao'; quando = ''; continue; }
      if (/^CANCELLATIONS\b\s*$/.test(l)) { secao = 'cancelamento'; quando = ''; continue; }
      if (/^(BEFORE DEPARTURE|ANY TIME)\b/.test(l)) { quando = 'antes'; continue; }
      if (/^AFTER DEPARTURE\b/.test(l)) { quando = 'depois'; continue; }
      if (!secao || quando !== 'antes' || r[secao]) continue;
      let m;
      if (/^CHARGE\b/.test(l)) {
        /* "CHARGE EUR 175.00/USD 200.00 FOR REISSUE": fica com o valor em dólar quando existe */
        const pares = [...l.matchAll(/([A-Z]{3}) (\d+(?:\.\d+)?)/g)];
        const p = pares.find(x => x[1] === 'USD') || pares[0];
        if (p) r[secao] = { tipo: 'multa', moeda: p[1], valor: num(p[2]) };
      }
      else if (/NOT PERMITTED|NON-REFUNDABLE/.test(l)) r[secao] = { tipo: 'proibido' };
      else if (/PERMITTED/.test(l)) r[secao] = { tipo: 'livre' };
    }
    return r;
  }

  /* ---------- cabine ---------- */
  function cabine(familia, classe, texto) {
    const f = String(familia || '');
    if (/FIRST|PREMIERE|^LA ?PREM/.test(f)) return 'Primeira classe';
    if (/BIZ|BUS|BSN|EXEC|CLUB/.test(f)) return 'Cabine Executiva';   /* a palavra BUSINESS solta no texto (upsell, regra) não decide a cabine */
    if (/PREM/.test(f)) return 'Premium Economy';
    if (f) return 'Cabine Econômica';
    if ('FAP'.includes(classe)) return 'Primeira classe';
    if ('JCDIZR'.includes(classe)) return 'Cabine Executiva';
    if ('W'.includes(classe)) return 'Premium Economy';
    return 'Cabine Econômica';
  }

  /* nome curto da tarifa para o cliente: BIZLIGHT -> Light, BUSFLEX -> Flex */
  function rotuloFamilia(f) {
    const s = String(f || '');
    if (/LIGHT|LITE|BASIC/.test(s)) return 'Light';
    if (/FLEX/.test(s)) return 'Flex';
    if (/STAND|STD|CLASSIC/.test(s)) return 'Standard';
    return s ? s.charAt(0) + s.slice(1).toLowerCase() : 'Tarifa';
  }

  /* ---------- tudo junto ---------- */
  function ler(texto, opts) {
    const ref = (opts && opts.hoje) || new Date();
    const T = limpa(texto);
    const segmentos = lerSegmentos(T, ref);
    const tarifa = lerTarifa(T);
    const regras = lerRegras(T);
    const pax = lerPax(T, segmentos);
    const avisos = [];
    if (!segmentos.length) avisos.push('Não achei os voos. Cole também a tela do RT.');
    if (!tarifa.total) avisos.push('Não achei o preço. Cole também a tela do TQT ou do FXB.');
    else if (tarifa.totalMoeda !== 'USD' && !tarifa.bsr) avisos.push('Achei o preço em ' + tarifa.totalMoeda + ' mas não o câmbio. Cole o TQT (tem o BSR) ou informe o câmbio.');
    if (!regras.alteracao && tarifa.naoReembolsavel == null) avisos.push('Não achei as regras. Cole o FQN1*PE para eu escrever multa e reembolso.');
    if (tarifa.moeda && tarifa.moeda !== 'USD' && tarifa.totalMoeda !== 'USD') avisos.push('A tarifa está em ' + tarifa.moeda + ', não em dólar. Não converti: ache o valor em dólar com o FQC e confira antes de adicionar.');
    const totais = [...new Set([...T.matchAll(/^\s*TOTAL\s+[A-Z]{3}\s+(\d+(?:\.\d+)?)/gm)].map(x => x[1]))];
    if (totais.length > 1) avisos.push('Achei mais de um preço nesta tela (' + totais.join(' e ') + '). Usei o primeiro. Cole só a tarifação da tarifa que você quer.');
    const tipos = [...new Set([...T.matchAll(/^\s*\d{2}\s+.+?\s+(ADT|CHD|CNN|INF|YTH|SRC|STU)\s+\d\s+\d+\.\d{2}/gm)].map(x => x[1]))];
    if (tipos.length > 1) avisos.push('Esta tarifação tem ' + tipos.join(' e ') + ' com preços diferentes. Por enquanto só leio o primeiro: faça a conta da criança ou do bebê à mão.');
    if (tarifa.total && !tarifa.pecas && !tarifa.quilos && !tarifa.semBagagem) avisos.push('Não achei a franquia de bagagem (vem no TQT ou no FQQ). Confira o número de malas antes de adicionar.');
    const cia = segmentos.length ? segmentos[0].cia : '';
    const cab = cabine(tarifa.familia, segmentos.length ? segmentos[0].classe : '', T);
    return { segmentos, tarifa, regras, pax, cia, cabine: cab, avisos };
  }

  /* ---------- trechos, duração e conexões ---------- */
  function fusoMin(tz, a, m, d, h, mi) {
    const utc = Date.UTC(a, m, d, h, mi);
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const p = {};
    for (const x of f.formatToParts(new Date(utc))) p[x.type] = x.value;
    return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - utc) / 60000;
  }
  function instante(dataIso, hora, tz) {
    const [a, m, d] = dataIso.split('-').map(Number), [h, mi] = hora.split(':').map(Number);
    const local = Date.UTC(a, m - 1, d, h, mi);
    return tz ? local - fusoMin(tz, a, m - 1, d, h, mi) * 60000 : local;
  }
  function duracaoMin(seg, aeroportos) {
    const o = aeroportos[seg.origem], c = aeroportos[seg.destino];
    if (!o || !c) return 0;
    return Math.round((instante(seg.dataChegada, seg.chega, c[2]) - instante(seg.data, seg.sai, o[2])) / 60000);
  }
  /* separa ida e volta: trecho novo quando a espera passa de 24 h ou a cidade não bate */
  function trechos(segs, aeroportos) {
    const l = [];
    for (const s of segs) {
      const ult = l.length ? l[l.length - 1] : null, ant = ult ? ult.segmentos[ult.segmentos.length - 1] : null;
      let espera = -1;
      if (ant && ant.destino === s.origem) {
        const tz = (aeroportos[s.origem] || [])[2];
        espera = Math.round((instante(s.data, s.sai, tz) - instante(ant.dataChegada, ant.chega, tz)) / 60000);
      }
      if (ant && espera >= 0 && espera <= 24 * 60) { ult.segmentos.push(s); ult.esperas.push(espera); }
      else l.push({ segmentos: [s], esperas: [] });
    }
    return l;
  }

  return { ler, lerSegmentos, lerTarifa, lerRegras, totalUSD, paraUSD, cabine, rotuloFamilia, trechos, duracaoMin, limpa };
});
