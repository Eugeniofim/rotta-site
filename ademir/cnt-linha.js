/* Qual linha da tabela de fee da CNT vale para uma cotação.
   A CNT escreve cada linha do seu jeito ("PAR/AMS", "DE/PARA EUROPA", "DESTINO ROMA",
   "EXCETO AS CLASSES P/ J/ W", "TARIFA DISCOUNT", "100% ONLINE"...). Aqui cada linha é
   conferida contra a viagem: rota, classe, cabine, família da tarifa e se os voos são todos
   da mesma companhia. Só devolve uma sugestão quando sobra UMA linha mais específica;
   na dúvida devolve null. Nunca marca nada: quem decide é o agente. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CNT_LINHA = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const N = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

  /* regiões como a CNT escreve → países (ISO) */
  const REGIOES = [
    ['AFRICA DO SUL', 'ZA'],
    ['AMERICA DO NORTE', 'US CA MX'],
    ['AMERICA DO SUL', 'AR CL UY PY BO PE CO EC VE GY SR'],
    ['AMERICA CENTRAL', 'CR PA GT HN SV NI BZ'],
    ['ORIENTE MEDIO', 'AE SA QA KW BH OM IL JO LB TR EG IR IQ'],
    ['CARIBE', 'CU DO JM AW BS BB CW PR TT HT KY TC LC AG VC GD DM KN SX MF BQ VI VG MQ GP'],
    ['OCEANIA', 'AU NZ FJ PF NC'],
    ['EUROPA', 'AL AD AT BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT MC ME NL MK NO PL PT RO SM RS SK SI ES SE CH GB UA VA XK BY MD TR'],
    ['ASIA', 'CN JP KR IN TH VN SG MY ID PH HK TW KH LK NP MV MO MN LA MM BD PK'],
    ['AFRICA', 'ZA EG MA KE TZ NG ET GH SN CI CM AO MZ TN DZ MU SC CV RW UG NA BW ZW'],
    ['CANADA', 'CA'], ['MEXICO', 'MX'], ['ESTADOS UNIDOS', 'US'], ['EUA', 'US'],
    /* países por extenso, como aparecem nas exceções e destinos */
    ...'TURQUIA TR,ARGENTINA AR,CHILE CL,COLOMBIA CO,EQUADOR EC,PERU PE,URUGUAI UY,PARAGUAI PY,BOLIVIA BO,PANAMA PA,CUBA CU,JAPAO JP,CHINA CN,COREIA KR,INDIA IN,TAILANDIA TH,ISRAEL IL,EGITO EG,MARROCOS MA,EMIRADOS AE,CATAR QA,QATAR QA,PORTUGAL PT,ESPANHA ES,FRANCA FR,ITALIA IT,ALEMANHA DE,INGLATERRA GB,REINO UNIDO GB,HOLANDA NL,SUICA CH,GRECIA GR,AUSTRALIA AU,JAMAICA JM,ARUBA AW'
      .split(',').map(x => { const i = x.lastIndexOf(' '); return [x.slice(0, i), x.slice(i + 1)]; }),
  ].map(([n, p]) => [n, p.split(' ')]).sort((a, b) => b[0].length - a[0].length);

  /* códigos de cidade com mais de um aeroporto */
  const METRO = { PAR: 'CDG ORY BVA', LON: 'LHR LGW STN LCY LTN SEN', MIL: 'MXP LIN BGY', ROM: 'FCO CIA', NYC: 'JFK EWR LGA',
    WAS: 'IAD DCA BWI', CHI: 'ORD MDW', TYO: 'NRT HND', OSA: 'KIX ITM', SEL: 'ICN GMP', BJS: 'PEK PKX', SHA: 'PVG SHA',
    MOW: 'SVO DME VKO', STO: 'ARN BMA', BUE: 'EZE AEP', SAO: 'GRU CGH VCP', RIO: 'GIG SDU', YTO: 'YYZ YTZ', YMQ: 'YUL', BER: 'BER', IST: 'IST SAW' };
  const metroDe = (cod) => Object.keys(METRO).filter(m => METRO[m].split(' ').includes(cod));

  const PALAVRAS = new Set('DE DO DA DOS DAS OS AS OU COM PARA E A O EM NA NO BR ON OFF AND CIA CIAS SO GDS NDC BR1 IB NH LA G3 AD JJ'.split(' '));

  /* o lugar bate com o destino? (código de aeroporto, de cidade, país, região ou nome da cidade) */
  function bateLugar(txt, v) {
    const t = ' ' + txt.replace(/[^A-Z0-9%]+/g, ' ') + ' ';
    let resto = t, temLugar = false, bate = false;
    for (const [nome, paises] of REGIOES) {
      if (resto.includes(' ' + nome + ' ')) { temLugar = true; if (paises.includes(v.pais)) bate = true; resto = resto.split(' ' + nome + ' ').join(' '); }
    }
    const cidade = N(v.cidade).replace(/[^A-Z0-9]+/g, ' ').trim();
    if (cidade.length >= 4 && resto.includes(' ' + cidade + ' ')) { temLugar = true; bate = true; resto = resto.split(' ' + cidade + ' ').join(' '); }
    const codigos = (resto.match(/\b[A-Z]{2,3}\b/g) || []).filter(c => !PALAVRAS.has(c));
    if (codigos.length) temLugar = true;
    const meus = [v.dest, v.pais].concat(metroDe(v.dest));
    if (codigos.some(c => meus.includes(c))) bate = true;
    return { temLugar, bate };
  }

  /* "EXCETO AS CLASSES P/ J/ W/ Y e G" ou "CLASSES F/Z/A" ou "CLASSE G" */
  function classesDa(txt) {
    const m = txt.match(/(EXCETO\s+(?:AS\s+)?)?CLASSES?\s+((?:[A-Z](?![A-Z0-9])[\s\/,]*(?:E\s+(?=[A-Z](?![A-Z0-9])))?)+)/);
    if (!m) return null;
    const letras = m[2].replace(/\bE\s+(?=[A-Z]\b)/g, ' ').match(/\b[A-Z]\b/g) || [];
    return letras.length ? { exceto: !!m[1], letras, trecho: m[0] } : null;
  }

  function avalia(desc, v) {
    let t = N(desc);
    const r = { ok: true, nivel: 0, porque: [] };
    const nao = (pq) => ({ ok: false, porque: [pq] });

    /* rotas especiais */
    const ehInterno = /TRECHO INTERNO|DESTINOS NACIONAIS|\bNACIONA/.test(t), ehInversa = /ROTA INVERSA/.test(t);
    if (ehInterno || ehInversa) {
      if ((ehInterno && v.interno) || (ehInversa && !v.origemBR && !v.interno)) return { ok: true, nivel: 4, porque: [v.interno ? 'trecho dentro do Brasil' : 'saída de fora do Brasil'] };
      return nao('não é trecho interno nem rota inversa');
    }
    if (v.interno) return nao('a viagem é dentro do Brasil');

    /* voos de outra companhia no meio */
    const offline = /OFF-?\s?LINE|CODE?\s?SHARE|COD\s?SHARE/.test(t);
    if (offline && !/100%\s*ON-?\s?LINE/.test(t)) {
      if (v.online) return nao('os voos são todos da mesma companhia');
      r.nivel = 3; r.porque.push('tem voo de outra companhia');
    }
    if (/100%\s*ON-?\s?LINE/.test(t) && !v.online) return nao('tem voo de outra companhia no meio');

    /* família da tarifa */
    const exTarifa = t.match(/EXCETO\s+TARIFA\s+([A-Z]+)/);
    if (exTarifa) { if (N(v.familia).includes(exTarifa[1])) return nao('a tarifa é ' + exTarifa[1]); t = t.replace(exTarifa[0], ' '); }
    const tarifa = t.match(/\bTARIFA\s+(DISCOUNT|BASIC|LIGHT|PROMO\w*)|\bBASIC ECONOMY\b/);
    if (tarifa) {
      const k = tarifa[1] || 'BASIC';
      if (!N(v.familia).includes(k)) return nao('a tarifa não é ' + k);
      r.nivel += 3; r.porque.push('tarifa ' + k);
    }
    if (/TARIFA PRIVADA|EXTENSAO DE BASE|ADDON|ADD-ON|BASES? TARIFARIA|BASE (ECONOMY|PREMIUM|POLARIS)|PUBLICADA|PROMO|RESERVAS FEITAS|SABRE|GALILEO/.test(t)) return { ok: false, duvida: true, porque: ['depende de tarifa, base ou sistema que o app não vê'] };
    /* ele emite pelo Amadeus (GDS) */
    if (/\bNDC\b/.test(t) && !/\bGDS\b/.test(t)) return nao('só para emissão NDC');
    /* prazo entre a emissão (hoje) e o embarque */
    const ate = t.match(/(?:DENTRO DE|EM ATE|ATE)\s+(\d+)\s+DIAS/), apos = t.match(/(?:APOS|SUPERIOR A|ACIMA DE|MAIS DE)\s+(\d+)\s+DIAS/);
    if (ate || apos) {
      if (v.dias == null) return { ok: false, duvida: true, porque: ['depende do prazo até o embarque'] };
      if (ate && v.dias > +ate[1]) return nao('o embarque é daqui a ' + v.dias + ' dias');
      if (apos && v.dias <= +apos[1]) return nao('o embarque é daqui a ' + v.dias + ' dias');
      r.nivel += 0.5; r.porque.push('embarque daqui a ' + v.dias + ' dias');
    }
    /* "ORIGEM BSB, CNF, GIG, GRU": a saída tem que estar na lista */
    const origens = t.match(/ORIGEM\s+((?:[A-Z]{1,3}\s*,\s*)+[A-Z]{1,3})\b/);
    if (origens) { if (v.orig && !origens[1].split(/\s*,\s*/).includes(v.orig)) return nao('a saída não está na lista'); t = t.replace(origens[0], 'ORIGEM BRASIL'); }

    /* origem */
    if (/ORIGEM BRASIL|SAIDA BR|ORIGEM BR\b/.test(t) && !/ORIGEM OU DESTINO/.test(t) && !v.origemBR) return nao('a saída não é do Brasil');

    /* classes de reserva */
    const cl = classesDa(t);
    if (cl) {
      const dentro = v.classes.filter(c => cl.letras.includes(c));
      if (cl.exceto && dentro.length) return nao('classe ' + dentro.join('/') + ' está fora');
      if (!cl.exceto && dentro.length !== v.classes.length) return nao('classe ' + v.classes.join('/') + ' não está na lista');
      r.nivel += 0.5; r.porque.push('classe ' + v.classes.join('/'));
      t = t.replace(cl.trecho, ' ');
    } else {
      /* cabine por extenso */
      const ec = /ECONOMIC/.test(t), ex = /EXECUTIV|PRIMEIRA/.test(t);
      if (ec !== ex) {
        const souEx = /Executiva|Primeira/.test(v.cabine || '');
        if (souEx !== ex) return nao('a cabine é outra');
        r.nivel += 0.5; r.porque.push(souEx ? 'cabine executiva' : 'cabine econômica');
      }
    }

    /* exceções de lugar: "(EXCETO PARIS/ AMSTERDÃ E ORIENTE MÉDIO)", "EXCETO ROMA", "EXCETO CUN" */
    const exc = t.match(/EXCETO\s+([^)\-]*)/g) || [];
    for (const e of exc) {
      const lugar = e.replace(/^EXCETO\s+/, '');
      if (bateLugar(lugar, v).bate) return nao('o destino está nas exceções');
      t = t.replace(e, ' ');
    }

    /* lugar */
    if (/DEMAIS DESTINOS/.test(t)) { r.nivel += 0; r.porque.push('demais destinos'); return r; }
    t = t.replace(/\([^)]*\)/g, ' ');
    const sem = t.replace(/ORIGEM( OU DESTINO)? (BRASIL|BR)\b|SAIDA BR|100%\s*ON-?\s?LINE|TODOS OS DESTINOS|DESTINOS?|DE\/PARA|PARA\b|\(|\)/g, ' ');
    const lg = bateLugar(sem, v);
    /* cidade escrita por extenso que não é a nossa ("DESTINO ROMA", "DE/PARA HAVANA") também é lugar */
    if (!lg.temLugar && /\b(?:DESTINO|PARA|DE\/PARA)\s+(?!TODOS|DEMAIS|NACIONA)[A-Z]{4,}/.test(t)) lg.temLugar = true;
    if (lg.temLugar) {
      if (!lg.bate) return nao('o destino é outro');
      r.nivel += 3; r.porque.push('destino ' + v.cidade);
    } else r.nivel += 1;
    return r;
  }

  /* linhas: [{descricao, fee}] · viagem: {dest, pais, cidade, origemBR, interno, online, classes[], cabine, familia} */
  function sugere(linhas, viagem) {
    if (!linhas || !linhas.length || !viagem || !viagem.dest) return null;
    const av = linhas.map(l => avalia(l.descricao, viagem));
    const boas = av.map((a, i) => ({ a, i })).filter(x => x.a.ok);
    const duvidas = av.filter(a => a.duvida).length;
    if (!boas.length) return null;
    const max = Math.max(...boas.map(x => x.a.nivel));
    const topo = boas.filter(x => x.a.nivel === max);
    if (topo.length !== 1) return null;
    return { idx: topo[0].i, porque: topo[0].a.porque, duvidas };
  }

  return { sugere, avalia, classesDa };
});
