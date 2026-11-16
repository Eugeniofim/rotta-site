/* Leitor das regras da CNT, a consolidadora por onde a Simonetta emite.
   Duas fontes, as duas viram dado:
   1. Página pública "Regras das cias" (cntour.com.br/financiamentos): o parcelamento de cada
      companhia. A página traz um bloco JSON dentro de <script class="cgrid-data">.
   2. Área com senha, tela "Ver Tabela" (condicoes.cntour.com.br): comissão, incentivo e fee
      por companhia. Entra o texto copiado da tela; aqui não existe login.
   Não chama rede: só lê o que recebeu. Quando o texto da CNT deixa dúvida, devolve a dúvida
   em vez de escolher calado. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CNT = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const semAcento = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const chave = (s) => semAcento(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const limpa = (s) => String(s == null ? '' : s).replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
  const numero = (s) => parseFloat(String(s).replace(',', '.'));

  /* o nome como a CNT escreve (nas duas áreas) → código da companhia */
  const IATA = {
    'aeromexico': 'AM', 'aerolineas argentinas': 'AR', 'air canada': 'AC', 'air china': 'CA', 'air europa': 'UX',
    'air france': 'AF', 'air new zealand': 'NZ', 'american airlines': 'AA', 'american': 'AA',
    'ana all nippon airways': 'NH', 'all nippon airways': 'NH', 'all nipon': 'NH', 'ana': 'NH',
    'apg airlines': 'GP', 'arajet': 'DM', 'air transat': 'TS', 'avianca': 'AV', 'avianca internacional': 'AV',
    'azul': 'AD', 'boliviana de aviacion boa': 'OB', 'boa': 'OB', 'british airways': 'BA',
    'cabo verde airlines': 'VR', 'cathay pacific': 'CX', 'condor': 'DE', 'copa airlines': 'CM',
    'delta air lines': 'DL', 'delta airlines': 'DL', 'el al': 'LY', 'el al israel airline': 'LY',
    'emirates': 'EK', 'emirates airlines': 'EK', 'ethiopian airlines': 'ET', 'gol': 'G3', 'gol linhas aereas': 'G3',
    'hahn air': 'HR', 'hahn air lines': 'HR', 'iberia': 'IB', 'ita airways': 'AZ', 'japan airlines': 'JL',
    'jetsmart': 'JA', 'jettsmart': 'JA', 'klm': 'KL', 'korean air': 'KE', 'latam airlines': 'LA', 'latam': 'LA',
    'lufthansa': 'LH', 'qantas': 'QF', 'qantas airways': 'QF', 'qatar airways': 'QR', 'royal air maroc': 'AT',
    'singapore airlines': 'SQ', 'sky airline': 'H2', 'sky airline s a': 'H2', 'south african airways': 'SA',
    'south african': 'SA', 'swiss': 'LX', 'taag': 'DT', 'tap air portugal': 'TP', 'tap': 'TP',
    'turkish airlines': 'TK', 'united airlines': 'UA', 'xiamen airlines': 'MF',
  };
  const iataDe = (nome) => IATA[chave(nome)] || null;

  /* ---------- 1. página pública: parcelamento ---------- */

  /* tabela "Otato" (os códigos de parcelamento que vão na emissão) */
  function lerPlanos(linhas) {
    const planos = [], notas = [];
    if (!linhas.length) return { planos, notas };
    const cab = linhas[0].map(chave);
    const col = (rx) => cab.findIndex(c => rx.test(c));
    const iCod = col(/codigo|plano|otato/), iMax = col(/maxima|numero de parcelas/), iMin = col(/minima/), iJur = col(/aplicacao de juros/);
    let juros = null, restrito = false;
    for (const r of linhas.slice(1)) {
      const max = iMax >= 0 ? parseInt(r[iMax], 10) : NaN;
      if (r.length < 2 || iCod < 0 || !r[iCod] || !(max > 0)) { const t = r.filter(Boolean).join(' · '); if (t) notas.push(t); continue; }
      /* célula que falta = a de cima vale para esta linha também (rowspan); célula vazia = não informado */
      if (iJur >= 0 && r[iJur] !== undefined) {
        const j = chave(r[iJur]);
        juros = /^nao/.test(j) ? false : /^sim/.test(j) ? true : null;
        restrito = /^(nao|sim) \S/.test(j);
      } else if (iJur < 0) { juros = null; restrito = false; }
      const min = iMin >= 0 ? parseInt(r[iMin], 10) : NaN;
      planos.push({ codigo: r[iCod], min: min > 0 ? min : null, max, juros, restrito });
    }
    return { planos, notas };
  }

  function lerCard(c) {
    const linhas = [], planos = [], notasPlano = [], avisos = [];
    const anda = (blocos, dentro) => {
      for (const b of blocos || []) {
        if (b.type === 'table' && b.structure) {
          const ls = [];
          for (const s of b.structure.sections || []) for (const r of s.rows || []) ls.push((r.cells || []).map(x => limpa(x.text)));
          if (dentro) { const p = lerPlanos(ls); planos.push(...p.planos); notasPlano.push(...p.notas); }
          else for (const r of ls) {
            if (r.length >= 2 && r[0]) linhas.push([r[0], r.slice(1).filter(Boolean).join(' · ')]);
            else if (r[0]) avisos.push(r[0]);
          }
        } else if (b.type === 'text' && limpa(b.text)) avisos.push(limpa(b.text));
        if (b.blocks) anda(b.blocks, true);
      }
    };
    anda(c.blocks, false);
    return { nome: limpa(c.name), linhas, planos, notasPlano, avisos };
  }

  function lerPagina(html) {
    const fora = { cias: {}, semCodigo: [] };
    let bruto = (/<script[^>]*class="[^"]*cgrid-data[^"]*"[^>]*>([\s\S]*?)<\/script>/i.exec(html) || [])[1];
    if (!bruto) {
      const rx = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
      let m;
      while ((m = rx.exec(html))) if (m[1].includes('"cards"')) { bruto = m[1]; break; }
    }
    if (!bruto) return Object.assign(fora, { erro: 'Não achei o bloco de dados na página da CNT. Ela pode ter mudado de formato.' });
    let d;
    try { d = JSON.parse(bruto); } catch (e) { return Object.assign(fora, { erro: 'O bloco de dados da página da CNT não abriu como dado.' }); }
    for (const c of d.cards || []) {
      if (c.active === false) continue;
      const iata = iataDe(c.name);
      if (!iata) { fora.semCodigo.push(limpa(c.name)); continue; }
      fora.cias[iata] = lerCard(c);
    }
    return fora;
  }

  /* número de parcelas escrito num pedaço de texto: "4x", "Em até 10x", "4 vezes", "3x, 5x ou 9x" */
  const parcelasEm = (t) => [...String(t).matchAll(/(\d{1,2})\s*(?:x\b|vezes)/gi)].map(m => +m[1]).filter(n => n > 0 && n <= 24);
  const soComJuros = (t) => /com juros/i.test(t) && !/sem juros/i.test(t);
  const soAVista = (t) => /(?:^|\s)[àa] vista/i.test(t) && !parcelasEm(t).length;

  /* O que a CNT diz do parcelamento de uma companhia, para quem emite por um canal (GDS = Amadeus).
     parcelas: número (0 = não parcela) ou null (a CNT não informa).
     semJuros: true, false ou null (a CNT não diz). */
  function parcelamento(regra, opc) {
    opc = opc || {};
    const canal = String(opc.canal || 'GDS').toUpperCase(), outro = canal === 'GDS' ? 'NDC' : 'GDS';
    const r = { parcelas: null, semJuros: null, texto: '', codigos: [], duvida: '', cartao: '' };
    if (!regra) return r;
    const linhas = regra.linhas || [], planos = (regra.planos || []).filter(p => !p.restrito);

    /* acréscimo de cartão que a CNT declara (Air France e KLM trazem isso em "Cartões Aceitos") */
    for (const [rot, val] of linhas) {
      if (!/cart/.test(chave(rot))) continue;
      const l = val.split('\n').find(x => /\d\s*%/.test(x));
      if (l) { r.cartao = l.replace(/^valor adicional:\s*/i, '').trim(); break; }
    }

    /* qual linha fala do parcelamento: a do canal, se existir; senão as que começam com "Parcelamento" */
    let escolhida = linhas.find(l => chave(l[0]) === canal.toLowerCase());
    if (!escolhida) {
      const cand = linhas.filter(l => /^parcelamento\b/.test(chave(l[0])));
      const porRota = cand.filter(l => /nacional/.test(chave(l[0])));
      if (porRota.length > 1) {
        const inter = opc.internacional !== false;
        escolhida = porRota.find(l => /internacional/.test(chave(l[0])) === inter) || porRota[0];
        r.duvida = 'A CNT separa voo nacional de internacional nesta companhia. Usei a regra de voo ' + (inter ? 'internacional' : 'nacional') + '.';
      } else escolhida = cand.find(l => parcelasEm(l[1]).length) || cand[0];
    }

    if (escolhida) {
      const rotulo = chave(escolhida[0]) === 'parcelamento' ? '' : escolhida[0] + ': ';
      r.texto = rotulo + escolhida[1].replace(/\n/g, ' / ');
      let pedacos = escolhida[1].split(/\n|\s\|\s|;\s/).map(s => s.trim()).filter(Boolean);
      const rxC = new RegExp('\\b' + canal + '\\b', 'i'), rxO = new RegExp('\\b' + outro + '\\b', 'i');
      pedacos = pedacos.filter(p => !(rxO.test(p) && !rxC.test(p)));
      /* uma frase longa pode ter mais de uma regra: "4 vezes sem juros (...). De 5 a 12 vezes com juros" */
      pedacos = pedacos.flatMap(p => p.split(/\.\s+/)).map(s => s.trim()).filter(Boolean);
      const validos = pedacos.filter(p => parcelasEm(p).length && !soComJuros(p));
      if (validos.length) {
        r.parcelas = Math.max(...parcelasEm(validos[0]));
        if (/sem juros|s\/ ?juros/i.test(validos[0])) r.semJuros = true;
        if (validos.length > 1 && !r.duvida) r.duvida = 'A CNT traz mais de uma regra para esta companhia (muda com a rota ou com o cartão). Usei a primeira; confira no texto.';
      } else if ((pedacos.length && /^n[aã]o(?:\s|$)/i.test(pedacos[0])) || soAVista(pedacos.join(' '))) {
        r.parcelas = 0;
      }
    }

    if (r.parcelas == null && !escolhida) {
      const aVista = (regra.avisos || []).find(soAVista);
      if (aVista) { r.parcelas = 0; r.texto = aVista.replace(/\n/g, ' / '); }
    }

    /* sem texto de parcelamento, vale a tabela de códigos */
    if (r.parcelas == null && planos.length) {
      const sem = planos.filter(p => p.juros === false), base = sem.length ? sem : planos;
      r.parcelas = Math.max(...base.map(p => p.max));
      if (sem.length) r.semJuros = true;
      r.texto = r.texto || 'Tabela de códigos: até ' + r.parcelas + ' parcelas';
      r.duvida = 'A CNT não escreve o parcelamento desta companhia em texto. O número veio da tabela de códigos.';
    }

    if (r.parcelas > 1) {
      const cabe = (p) => p.max === r.parcelas || (p.min != null && p.min <= r.parcelas && p.max >= r.parcelas);
      const exatos = planos.filter(p => p.max === r.parcelas), servem = exatos.length ? exatos : planos.filter(cabe);
      r.codigos = [...new Set(servem.map(p => p.codigo))];
      if (r.semJuros == null && servem.length) {
        if (servem.some(p => p.juros === false)) r.semJuros = true;
        else if (servem.every(p => p.juros === true)) r.semJuros = false;
      }
    }
    return r;
  }

  /* tudo que a cotação precisa saber de uma companhia, num lugar só */
  function sugere(regras, iata, opc) {
    const regra = regras && regras.cias ? regras.cias[iata] || null : null;
    return Object.assign(parcelamento(regra, opc), { regra, lidoEm: regras ? regras.lidoEm : '', fonte: regras ? regras.fonte : '' });
  }

  /* ---------- 2. área com senha: comissão, incentivo e fee ---------- */

  /* Texto copiado da tela "Ver Tabela". Cada linha de condição termina com
     comissão %, incentivo % e o fee em dólar; a comissão pode vir vazia. */
  function lerCondicoes(texto) {
    const cias = {}, semCodigo = [];
    /* Quem copia a página inteira traz junto o menu ("Dashboard", "Sair"...). Uma linha solta só
       conta como companhia desconhecida se logo depois vier uma linha de condição. */
    let atual = null, solto = '';
    const abre = (nome) => {
      const iata = iataDe(nome);
      if (iata) { atual = cias[iata] = cias[iata] || { nome, linhas: [] }; solto = ''; }
      else { atual = null; solto = nome; }
    };
    const pct = (s) => { const n = numero(String(s).replace('%', '')); return isNaN(n) ? null : n; };
    for (const crua of String(texto || '').split(/\r?\n/)) {
      const linha = crua.replace(/ /g, ' ').trim();
      if (!linha || /^tabela de condi/i.test(linha) || /^companhia a[eé]rea\b/i.test(linha)) continue;
      let c = linha.split('\t').map(s => s.trim());
      if (c.length < 4) {
        const m = /^(.*\S)\s+(\d+(?:[.,]\d+)?|null)?\s*%\s+(\d+(?:[.,]\d+)?)\s*%\s+(\d+(?:[.,]\d+)?)$/.exec(linha);
        if (!m) { abre(linha); continue; }
        c = [m[1], m[2] || '', m[3], m[4]];
      } else if (c.length >= 5) { abre(c[0]); c = c.slice(1); }
      const fee = numero(c[3]);
      if (isNaN(fee) || !c[0]) continue;
      if (!atual) { if (solto && !semCodigo.includes(solto)) semCodigo.push(solto); continue; }
      atual.linhas.push({ descricao: c[0].replace(/\s+/g, ' '), comissao: pct(c[1]), incentivo: pct(c[2]) || 0, fee });
    }
    for (const k of Object.keys(cias)) if (!cias[k].linhas.length) delete cias[k];
    return { cias, semCodigo };
  }

  /* O que muda entre a tabela em uso e a que acabou de ser colada, companhia por companhia. */
  function comparaCondicoes(antes, depois) {
    const a = (antes && antes.cias) || {}, d = (depois && depois.cias) || {};
    const ch = (l) => l.descricao.replace(/\s+/g, ' ').trim().toUpperCase();
    const novas = [], sairam = [], mudaram = [];
    for (const k of Object.keys(a)) if (!d[k]) sairam.push({ iata: k, nome: a[k].nome });
    for (const k of Object.keys(d)) {
      if (!a[k]) { novas.push({ iata: k, nome: d[k].nome, linhas: d[k].linhas.length }); continue; }
      const ma = new Map(a[k].linhas.map(l => [ch(l), l])), md = new Map(d[k].linhas.map(l => [ch(l), l]));
      const itens = [];
      for (const [c, l] of md) {
        const o = ma.get(c);
        if (!o) itens.push({ tipo: 'nova', linha: l });
        else if (o.fee !== l.fee || o.incentivo !== l.incentivo || (o.comissao || 0) !== (l.comissao || 0)) itens.push({ tipo: 'mudou', de: o, linha: l });
      }
      for (const [c, l] of ma) if (!md.has(c)) itens.push({ tipo: 'saiu', linha: l });
      if (itens.length) mudaram.push({ iata: k, nome: d[k].nome, itens });
    }
    return { novas, sairam, mudaram, igual: !novas.length && !sairam.length && !mudaram.length };
  }
  const contaCondicoes = (c) => ({ cias: c && c.cias ? Object.keys(c.cias).length : 0, linhas: c && c.cias ? Object.values(c.cias).reduce((s, x) => s + x.linhas.length, 0) : 0 });

  /* quando toda linha da companhia tem o mesmo fee, não há o que escolher */
  function feeUnico(linhas) {
    if (!linhas || !linhas.length) return null;
    return linhas.every(l => l.fee === linhas[0].fee) ? linhas[0].fee : null;
  }

  return { lerPagina, lerCard, lerPlanos, parcelamento, sugere, lerCondicoes, comparaCondicoes, contaCondicoes, feeUnico, iataDe, parcelasEm };
});
