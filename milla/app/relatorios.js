/* =====================================================
   GESTÃO (16/11/2026) — a camada de quem gere a imobiliária.

   Pedidos dele: "CRM simples e sofisticado com camadas efetivas… gráficos mensais
   mostrando o que está aumentando… relatórios com gráficos… nada supérfluo" e, no mesmo
   dia, "atualize o menu Gestão… bem robusto, moderno, gráficos motion 3d, cheio de
   análises… inclusive de rendimento dos corretores para pontuá-los no futuro".

   As camadas do app:
     todo mundo da equipe   Início (o que é para agora), WhatsApp, Leads, Imóveis
     quem gere (dono)       + Equipe (avisos e acessos) e Gestão (este arquivo)
   O Início fala de HOJE; a Gestão fala do PERÍODO e da tendência.

   De onde vem: só dos leads que a Milla anota (pedidos), os mesmos da tela Leads (LD.lista,
   os 500 mais recentes). Nada novo no banco. O que cada lead já traz:
     criadoEm, status (+ statusEm desde 16/11), temperatura, origem, imovelRef, produto;
     equipe = { avisados[], passouDe[] (perdeu a vez no rodízio), esgotou, em,
                resposta: { acao: confirmado|outro|assumido, por, em } }   (aviso-equipe.js do cofre)

   A PONTUAÇÃO da equipe (0 a 100) junta quatro partes, cada uma de 0 a 100:
     Resposta  30  dos avisos que eram DA VEZ dela, quantos ela respondeu (no "todos de uma vez"
                   só um responde: não responder lá não conta contra ninguém)
     Rapidez   20  metade das respostas em até 3 min = 100; em 1 h ou mais = 0
     Conversão 35  fechados contra o que a MÉDIA da equipe fecharia nos mesmos produtos
                   (igual à média = 60; 1,67 vez a média ou mais = 100). Assim quem atende
                   venda não perde de quem atende temporada, que fecha mais por natureza.
                   Com menos de 3 leads decididos vale 60, a média: 1 de 1 não diz nada.
     Cuidado   15  dos leads dela em aberto, quantos andaram nos últimos 7 dias
   Rapidez sem tempo registrado sai da conta (o peso se divide entre as outras). Só ganha nota quem
   respondeu a pelo menos 5 avisos no período: com menos, a nota mentiria.

   Gráficos à mão (HTML e SVG, sem biblioteca). Cores dos produtos em ordem fixa, validadas no
   fundo escuro (validate_palette da skill dataviz). O texto nunca usa a cor da série; cada
   gráfico tem legenda ou rótulo, e os números exatos ficam a um toque (dica ou tabela).
   Movimento: cada bloco se monta quando aparece na tela, uma vez só; quem pediu menos
   movimento no aparelho vê tudo pronto.
   ===================================================== */
'use strict';

/* ordem fixa = cor fixa: um produto nunca troca de cor */
const RL_PRODUTOS = [['venda', 'Venda'], ['aluguel', 'Locação'], ['temporada', 'Temporada'], ['captacao', 'Captação']];
const RL_MESES = 6;
const RL_MES_NOME = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const RL_MES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const RL_DIA = 86400000;
const RL_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const RL_SEMANA_LONGA = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const RL_PERIODOS = [['mes', 'Este mês'], ['30', '30 dias'], ['90', '90 dias'], ['180', '6 meses']];
const RL_ORIGENS = [['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['site', 'Site'], ['anuncio', 'Anúncio'], ['outro', 'Outros']];
const RL_MIN_NOTA = 5;
const RL_PESOS = { Resposta: 30, Rapidez: 20, 'Conversão': 35, Cuidado: 15 };
const RL = {
  per: (() => { try { const v = localStorage.getItem('milla_rl_per'); return RL_PERIODOS.some(p => p[0] === v) ? v : 'mes'; } catch (_) { return 'mes'; } })(),
  visto: new Set(), ultimo: null,
};

/* ---------- de que produto, de onde e em que pé está o lead ---------- */
function rlProduto(p) {
  const txt = [p.rotulo, p.extra && (p.extra.Pedido || p.extra.pedido), p.mensagem].filter(Boolean).join(' ').toLowerCase();
  if (/anunciar|captar|captação|quer vender|vender (o|a|um|uma|meu|minha)|avaliar (o|a|meu|minha)|colocar (pra|para) (alugar|vender)/.test(txt)) return 'captacao';
  const ep = p.equipe && p.equipe.produto;
  const im = p.imovelRef && typeof porRef === 'function' ? porRef(p.imovelRef) : null;
  if (im && ['venda', 'aluguel', 'temporada'].includes(im.transacao)) return im.transacao;
  if (['venda', 'aluguel', 'temporada'].includes(ep)) return ep;
  if (/temporada|diária|diarias|réveillon|reveillon|natal|carnaval|feriado|reserva/.test(txt)) return 'temporada';
  if (/alug|locação|locacao|anual/.test(txt)) return 'aluguel';
  if (/compr|venda|financ|proposta/.test(txt)) return 'venda';
  return 'outro';
}
function rlOrigem(p) {
  if (p.anuncio || p.tipo === 'anuncio') return 'anuncio';
  const o = String(p.origem || '').toLowerCase();
  if (/instagram/.test(o)) return 'instagram';
  if (/whats|waqr/.test(o)) return 'whatsapp';
  if (/site|form/.test(o)) return 'site';
  return 'outro';
}
const rlData = iso => { const d = iso ? new Date(iso) : null; return d && !isNaN(d) ? d : null; };
const rlFechado = p => p.status === 'atendido';
const rlDecidido = p => p.status === 'atendido' || p.status === 'perdido';
/* a equipe pegou: alguém tocou no aviso, ou o status já saiu de Novo */
const rlPegou = p => !!(p.equipe && p.equipe.resposta && p.equipe.resposta.por) || (!!p.status && p.status !== 'novo');
const rlNegociou = p => ['visita marcada', 'proposta', 'atendido'].includes(p.status);
/* quando o lead foi decidido: o statusEm; sem ele (antes de 16/11), o dia em que chegou */
const rlDecididoEm = p => rlData(p.statusEm) || rlData(p.criadoEm);
/* fora do expediente: antes das 8 h ou depois das 18 h, sábado depois do meio-dia, domingo */
function rlForaExp(d) {
  const dia = d.getDay(), h = d.getHours() + d.getMinutes() / 60;
  if (dia === 0) return true;
  if (dia === 6) return !(h >= 8 && h < 12);
  return !(h >= 8 && h < 18);
}
/* quanto a equipe levou para responder ao aviso, em minutos */
function rlRespMin(p) {
  const e = p.equipe, r = e && e.resposta;
  const a = rlData(e && e.em) || rlData(p.criadoEm), b = rlData(r && r.em);
  if (!a || !b) return null;
  const m = (b - a) / 60000;
  return m >= 0 && m < 7 * 24 * 60 ? m : null;
}
function rlMediana(l) {
  if (!l.length) return null;
  const o = l.slice().sort((a, b) => a - b), k = Math.floor(o.length / 2);
  return o.length % 2 ? o[k] : (o[k - 1] + o[k]) / 2;
}
function rlMinutos(m) {
  if (m == null) return '–';
  if (m < 1) return 'menos de 1 min';
  if (m < 60) return Math.round(m) + ' min';
  const h = Math.floor(m / 60), r = Math.round(m % 60);
  return h + ' h' + (r ? ' ' + r : '');
}
const rlNum = v => Number(v || 0).toLocaleString('pt-BR');
const rlPct = v => v == null ? '–' : Math.round(v) + '%';
const rlCl = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- os períodos ---------- */
function rlMesesLista() {
  const agora = new Date(), l = [];
  for (let i = RL_MESES - 1; i >= 0; i--) {
    const ini = new Date(agora.getFullYear(), agora.getMonth() - i, 1), fim = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 1);
    l.push({ ini, fim, nome: RL_MES_NOME[ini.getMonth()], longo: RL_MES_LONGO[ini.getMonth()], atual: i === 0 });
  }
  return l;
}
/* o mês até hoje contra o mesmo pedaço do mês passado (dia 1 até o mesmo dia e hora) */
function rlPeriodos() {
  const agora = new Date(), ini = new Date(agora.getFullYear(), agora.getMonth(), 1), iniAnt = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimAnt = new Date(Math.min(iniAnt.getTime() + (agora - ini), ini.getTime()));
  return { agora, ini, iniAnt, fimAnt, dia: agora.getDate(), mes: RL_MES_LONGO[agora.getMonth()], mesAnt: RL_MES_LONGO[iniAnt.getMonth()], mesAntCurto: RL_MES_NOME[iniAnt.getMonth()] };
}
/* a janela escolhida no filtro e a de antes, do mesmo tamanho, para comparar */
function rlJanela(per) {
  const P = rlPeriodos();
  if (per === 'mes') return { a: P.ini, b: P.agora, a0: P.iniAnt, b0: P.fimAnt, nome: 'de 1 a ' + P.dia + ' de ' + P.mes, antes: '1–' + P.dia + ' de ' + P.mesAntCurto, dias: Math.max(1, (P.agora - P.ini) / RL_DIA), mes: true };
  const n = +per, b = P.agora, a = new Date(b - n * RL_DIA), a0 = new Date(b - 2 * n * RL_DIA);
  const nome = n === 180 ? '6 meses' : n + ' dias';
  return { a, b, a0, b0: a, nome: 'nos últimos ' + nome, antes: 'os ' + nome + ' antes', dias: n, mes: false };
}
const rlEntre = (d, a, b) => d && d >= a && d < b;

/* ---------- as contas ---------- */
function rlContas(per) {
  const todos = (LD.lista || []).map(p => Object.assign({ _prod: rlProduto(p), _em: rlData(p.criadoEm), _orig: rlOrigem(p) }, p)).filter(p => p._em);
  const meses = rlMesesLista(), P = rlPeriodos(), J = rlJanela(per), agoraMs = P.agora.getTime();
  const prods = RL_PRODUTOS.map(x => x[0]).concat(todos.some(p => p._prod === 'outro') ? ['outro'] : []);
  const porMes = (filtro, data) => meses.map(m => {
    const c = { total: 0 }; prods.forEach(k => { c[k] = 0; });
    todos.forEach(p => { const d = data(p); if (filtro(p) && rlEntre(d, m.ini, m.fim)) { c[p._prod]++; c.total++; } });
    return c;
  });
  const chegaram = porMes(() => true, p => p._em);
  const fechados = porMes(rlFechado, rlDecididoEm);
  /* o que está subindo: o mês até hoje contra o mesmo pedaço do mês passado, por produto */
  const conta = (filtro, data, a, b) => todos.filter(p => filtro(p) && rlEntre(data(p), a, b)).length;
  const subida = prods.filter(k => k !== 'outro').map(k => {
    const agora = conta(p => p._prod === k, p => p._em, P.ini, P.agora), antes = conta(p => p._prod === k, p => p._em, P.iniAnt, P.fimAnt);
    return { k, agora, antes, dif: agora - antes, pct: antes ? Math.round((agora - antes) / antes * 100) : null };
  }).filter(x => x.agora || x.antes).sort((a, b) => (b.pct == null ? 1e9 : b.pct) - (a.pct == null ? 1e9 : a.pct) || b.dif - a.dif);

  /* a janela do filtro e a de antes */
  const jan = todos.filter(p => rlEntre(p._em, J.a, J.b)), ant = todos.filter(p => rlEntre(p._em, J.a0, J.b0));
  const decJ = todos.filter(p => rlDecidido(p) && rlEntre(rlDecididoEm(p), J.a, J.b)), decA = todos.filter(p => rlDecidido(p) && rlEntre(rlDecididoEm(p), J.a0, J.b0));
  const fechJ = decJ.filter(rlFechado).length, fechA = decA.filter(rlFechado).length;
  const taxa = decJ.length ? fechJ / decJ.length * 100 : null, taxaA = decA.length ? fechA / decA.length * 100 : null;
  const resp = rlMediana(jan.map(rlRespMin).filter(v => v != null)), respA = rlMediana(ant.map(rlRespMin).filter(v => v != null));
  const fora = jan.filter(p => rlForaExp(p._em)).length;
  const foraPct = jan.length ? fora / jan.length * 100 : null, foraA = ant.length ? ant.filter(p => rlForaExp(p._em)).length / ant.length * 100 : null;
  /* no ritmo de agora, quantos leads o mês fecha (só depois de uns dias, senão é chute) */
  let prev = null, prevAnt = null;
  if (J.mes) {
    const fim = new Date(P.ini.getFullYear(), P.ini.getMonth() + 1, 1), frac = (P.agora - P.ini) / (fim - P.ini);
    if (frac >= 0.12) prev = Math.round(jan.length / frac);
    prevAnt = todos.filter(p => rlEntre(p._em, P.iniAnt, P.ini)).length;
  }
  /* o funil do período */
  const funil = [
    ['Chegaram', 'todos os leads que a Milla anotou', jan.length],
    ['A equipe pegou', 'alguém tocou no aviso ou mudou o status', jan.filter(rlPegou).length],
    ['Visita ou proposta', 'chegaram a visita marcada, proposta ou fechado', jan.filter(rlNegociou).length],
    ['Fechados', 'destes, já marcados como Fechado', jan.filter(rlFechado).length],
  ];
  /* o que precisa de alguém agora (vale o hoje, não o filtro) */
  const abertos = todos.filter(p => LEAD_ABERTO(p.status));
  const ultimoMov = p => (rlData(p.statusEm) || p._em).getTime();
  const atencao = {
    parados: abertos.filter(p => agoraMs - ultimoMov(p) > 7 * RL_DIA).length,
    novosVelhos: abertos.filter(p => p.status === 'novo' && agoraMs - p._em.getTime() > RL_DIA).length,
    quentes: abertos.filter(p => p.temperatura === 'quente').length,
    semDono: abertos.filter(p => p.equipe && p.equipe.esgotou).length,
  };

  /* a equipe, pessoa por pessoa, no período */
  const taxaProd = {};
  prods.forEach(k => { const d = jan.filter(p => p._prod === k && rlDecidido(p)); taxaProd[k] = d.length ? d.filter(rlFechado).length / d.length : null; });
  const pessoas = new Map();
  const pessoa = n => {
    n = String(n || '').trim(); if (!n) return null;
    let x = pessoas.get(n);
    if (!x) { x = { nome: n, avisos: 0, respondeu: 0, perdeu: 0, tempos: [], acoes: { confirmado: 0, outro: 0, assumido: 0 }, fechados: 0, decididos: 0, esperado: 0, abertos: 0, parados: 0, prods: {} }; pessoas.set(n, x); }
    return x;
  };
  jan.forEach(p => {
    const e = p.equipe || {};
    (e.avisados || []).forEach(n => { const x = pessoa(n); if (x) x.avisos++; });
    (e.passouDe || []).forEach(n => { const x = pessoa(n); if (x) x.perdeu++; });
    const r = e.resposta, x = r && pessoa(r.por);
    if (!x) return;
    x.respondeu++;
    const t = rlRespMin(p); if (t != null) x.tempos.push(t);
    if (x.acoes[r.acao] != null) x.acoes[r.acao]++;
    x.prods[p._prod] = (x.prods[p._prod] || 0) + 1;
    if (rlDecidido(p)) { x.decididos++; if (rlFechado(p)) x.fechados++; if (taxaProd[p._prod] != null) x.esperado += taxaProd[p._prod]; }
    else if (LEAD_ABERTO(p.status)) { x.abertos++; if (agoraMs - ultimoMov(p) > 7 * RL_DIA) x.parados++; }
  });
  const equipe = [...pessoas.values()].map(x => Object.assign(x, rlNota(x)))
    .sort((a, b) => (b.nota == null ? -1 : b.nota) - (a.nota == null ? -1 : a.nota) || b.respondeu - a.respondeu || b.avisos - a.avisos);
  const respostas = equipe.reduce((s, x) => s + x.respondeu, 0);

  /* quando chegam: dia da semana × faixa de 3 horas. Com pouco lead no filtro, os 6 meses */
  const d180 = new Date(agoraMs - 180 * RL_DIA);
  const heatSeis = jan.length < 25;
  const baseHeat = heatSeis ? todos.filter(p => rlEntre(p._em, d180, P.agora)) : jan;
  const heat = Array.from({ length: 7 }, () => Array(8).fill(0));
  baseHeat.forEach(p => { heat[(p._em.getDay() + 6) % 7][Math.floor(p._em.getHours() / 3)]++; });

  const somar = (l, chave) => { const m = new Map(); l.forEach(p => { const c = chave(p); if (c) m.set(c, (m.get(c) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const origem = somar(jan, p => p._orig);
  const temp = [['quente', 'Quentes'], ['morno', 'Mornos'], ['frio', 'Frios']].map(([k, n]) => [k, n, abertos.filter(p => p.temperatura === k).length]);
  const semTemp = abertos.filter(p => !['quente', 'morno', 'frio'].includes(p.temperatura)).length;
  const imoveis = somar(jan, p => p.imovelRef || '').slice(0, 5);
  const balnearios = somar(jan, p => { const im = p.imovelRef && typeof porRef === 'function' ? porRef(p.imovelRef) : null; return (im && im.bairro) || (p.extra && (p.extra['Balneário'] || p.extra.Bairro || p.extra.bairro)) || ''; }).slice(0, 6);
  const semData = todos.some(p => rlFechado(p) && !p.statusEm);
  return { todos, meses, P, J, prods, chegaram, fechados, subida, jan, ant, fechJ, fechA, taxa, taxaA, decJ: decJ.length, resp, respA, fora, foraPct, foraA, prev, prevAnt,
    funil, atencao, abertos: abertos.length, equipe, respostas, heat, heatSeis, heatTotal: baseHeat.length, origem, temp, semTemp, imoveis, balnearios, semData };
}

/* a nota de uma pessoa: as quatro partes e a média pesada (ver o topo do arquivo) */
function rlNota(x) {
  const comp = [];
  const turnos = x.respondeu + x.perdeu;
  if (turnos) comp.push(['Resposta', x.respondeu / turnos * 100, `respondeu ${x.respondeu} de ${turnos} ${turnos === 1 ? 'aviso' : 'avisos'} que eram da vez dela`]);
  const t = rlMediana(x.tempos);
  if (t != null) comp.push(['Rapidez', rlCl((60 - t) / 57 * 100, 0, 100), 'metade das respostas em ' + rlMinutos(t)]);
  if (x.decididos >= 3 && x.esperado > 0.05) comp.push(['Conversão', rlCl(x.fechados / x.esperado * 60, 0, 100), `fechou ${x.fechados} de ${x.decididos}; a média da equipe nos mesmos produtos fecharia ${x.esperado.toFixed(1).replace('.', ',')}`]);
  else comp.push(['Conversão', 60, `${x.decididos ? 'só ' + x.decididos + (x.decididos === 1 ? ' lead decidido' : ' leads decididos') : 'nenhum lead decidido'} ainda: conta como a média da equipe`]);
  comp.push(['Cuidado', x.abertos ? (1 - x.parados / x.abertos) * 100 : 100, x.abertos ? (x.parados ? `${x.parados} de ${x.abertos} em aberto parados há mais de 7 dias` : `os ${x.abertos} em aberto andaram nos últimos 7 dias`) : 'nenhum lead parado']);
  const peso = comp.reduce((s, c) => s + RL_PESOS[c[0]], 0);
  const nota = x.respondeu >= RL_MIN_NOTA && peso ? Math.round(comp.reduce((s, c) => s + RL_PESOS[c[0]] * c[1], 0) / peso) : null;
  return { nota, comp, tempo: t };
}

/* ---------- peças de desenho ---------- */
const RL_NOME = k => k === 'outro' ? 'Outros' : (RL_PRODUTOS.find(x => x[0] === k) || [, k])[1];
/* o eixo: linhas a cada passo redondo (1, 2 ou 5 vezes uma potência de 10), 2 ou 3 passos até o topo */
function rlEixo(m) {
  const alvo = Math.max(1, m / 3), p = Math.pow(10, Math.floor(Math.log10(alvo)));
  const passo = [1, 2, 5, 10].map(f => f * p).find(v => v >= alvo);
  const n = m <= passo * 2 ? 2 : 3;
  return { teto: passo * n, linhas: Array.from({ length: n + 1 }, (_, i) => passo * (n - i)) };
}
/* a comparação com o período de antes: seta, quanto e se é bom (verde) ou ruim (vermelho) */
function rlVar(agora, antes, J, op) {
  op = op || {};
  const neutro = t => `<span class="rl-var">${esc(t)}</span>`;
  if (agora == null) return neutro(op.vazio || 'sem dado no período');
  if (antes == null) return neutro('sem dado em ' + J.antes + ' para comparar');
  let dif, txt;
  if (op.pp) {
    dif = Math.round(agora - antes);
    if (!dif) return `<span class="rl-var"><i aria-hidden="true">=</i> igual a ${esc(J.antes)} (${rlPct(antes)})</span>`;
    txt = (dif > 0 ? '+' : '−') + Math.abs(dif) + (Math.abs(dif) === 1 ? ' ponto' : ' pontos') + ' sobre ' + J.antes + ' (' + rlPct(antes) + ')';
  } else if (op.tempo) {
    dif = agora - antes;
    if (Math.abs(dif) < 1) return `<span class="rl-var"><i aria-hidden="true">=</i> igual a ${esc(J.antes)}</span>`;
    txt = (dif < 0 ? 'mais rápido que ' : 'mais devagar que ') + J.antes + ' (' + rlMinutos(antes) + ')';
  } else {
    if (!antes && !agora) return neutro('igual a ' + J.antes);
    if (!antes) return `<span class="rl-var sobe"><i aria-hidden="true">▲</i> nenhum em ${esc(J.antes)}</span>`;
    dif = Math.round((agora - antes) / antes * 100);
    if (!dif) return `<span class="rl-var"><i aria-hidden="true">=</i> igual a ${esc(J.antes)} (${rlNum(antes)})</span>`;
    txt = (dif > 0 ? '+' : '−') + Math.abs(dif) + '% sobre ' + J.antes + ' (' + rlNum(antes) + ')';
  }
  const bom = op.tempo ? dif < 0 : dif > 0;
  return `<span class="rl-var ${bom ? 'sobe' : 'desce'}"><i aria-hidden="true">${dif > 0 ? '▲' : '▼'}</i> ${esc(txt)}</span>`;
}
/* o número que conta de 0 até ele quando aparece (data-conta); o texto já nasce certo */
const rlConta = (v, suf) => `<b class="num" data-conta="${Math.round(v)}" data-suf="${esc(suf || '')}">${rlNum(Math.round(v))}${esc(suf || '')}</b>`;
/* um bloco que se monta quando aparece */
const rlSec = (id, titulo, sub, corpo, extra) => `<section class="bloco rl-anima" id="rl-${id}" aria-labelledby="rl-t-${id}">
  <div class="bloco-cab"><div><h2 id="rl-t-${id}">${esc(titulo)}</h2>${sub ? `<div class="sm rl-sub">${esc(sub)}</div>` : ''}</div>${extra || ''}</div>${corpo}</section>`;

/* colunas empilhadas por mês: legenda acima, total no topo, dica ao passar o dedo, tabela embaixo */
function rlColunas(id, titulo, sub, meses, contas, prods, P) {
  const { teto, linhas } = rlEixo(Math.max(1, ...contas.map(c => c.total)));
  const usados = prods.filter(k => contas.some(c => c[k]));
  const col = (m, c, i) => {
    const rot = m.nome + (m.atual ? '*' : '');
    const dica = [m.longo + (m.atual ? ' (até hoje)' : ''), rlNum(c.total) + ' ' + (id === 'fechados' ? (c.total === 1 ? 'fechado' : 'fechados') : (c.total === 1 ? 'lead' : 'leads'))].concat(usados.filter(k => c[k]).map(k => RL_NOME(k) + ': ' + rlNum(c[k]))).join('|');
    const alt = c.total / teto * 100;
    return `<div class="rl-col" tabindex="0" data-tip="${esc(dica)}" aria-label="${esc(dica.split('|').join(', '))}">
      <div class="rl-area"><div class="rl-pilha" style="height:${alt.toFixed(2)}%;--d:${(i * 0.08).toFixed(2)}s">${c.total ? `<span class="rl-tot num">${rlNum(c.total)}</span>` : ''}${usados.filter(k => c[k]).map(k => `<i class="s-${k}" style="flex-grow:${c[k]}"></i>`).join('')}</div></div>
      <span class="rl-mes">${esc(rot)}</span></div>`;
  };
  const tabela = `<details class="rl-tab"><summary>Ver os números em tabela</summary><div class="rl-tab-rolo"><table><thead><tr><th scope="col">Mês</th>${usados.map(k => `<th scope="col">${esc(RL_NOME(k))}</th>`).join('')}<th scope="col">Total</th></tr></thead><tbody>${meses.map((m, i) => `<tr><th scope="row">${esc(m.longo)}${m.atual ? ' (até hoje)' : ''}</th>${usados.map(k => `<td class="num">${rlNum(contas[i][k])}</td>`).join('')}<td class="num b">${rlNum(contas[i].total)}</td></tr>`).join('')}</tbody></table></div></details>`;
  return rlSec(id, titulo, sub, `<div class="rl-corpo">
      ${usados.length > 1 ? `<ul class="rl-legenda" aria-label="Legenda">${usados.map(k => `<li><i class="s-${k}" aria-hidden="true"></i>${esc(RL_NOME(k))}</li>`).join('')}</ul>` : ''}
      <div class="rl-plot">
        <div class="rl-grade" aria-hidden="true">${linhas.map(v => `<span style="bottom:${(v / teto * 100).toFixed(2)}%"><b class="num">${rlNum(v)}</b></span>`).join('')}</div>
        <div class="rl-cols">${meses.map((m, i) => col(m, contas[i], i)).join('')}</div>
      </div>
      <div class="sm rl-nota">* ${esc(P.mes)} até hoje (dia ${P.dia}).${id === 'fechados' ? ' Conta no mês em que o lead virou Fechado.' : ''}</div>
      ${tabela}
    </div>`);
}
/* barras deitadas de uma série só (o título diz o que é): valor na ponta */
function rlBarras(itens) {
  const max = Math.max(1, ...itens.map(x => x.v));
  return `<ul class="rl-barras">${itens.map((x, i) => `<li>
      ${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy">` : ''}
      <span class="rl-b-tx"><b>${esc(x.rot)}</b>${x.sub ? `<span class="sm">${esc(x.sub)}</span>` : ''}</span>
      <span class="rl-b-trilho"><i class="${esc(x.cls || '')}" style="width:${(x.v / max * 100).toFixed(1)}%;--d:${(i * 0.07).toFixed(2)}s"></i><span class="num">${rlNum(x.v)}</span></span></li>`).join('')}</ul>`;
}
/* o anel da nota (SVG): a volta enche até a nota */
function rlAnel(nota, tam) {
  tam = tam || 64;
  const r = tam / 2 - 6, c = 2 * Math.PI * r, cls = nota == null ? '' : nota >= 75 ? 'bom' : nota >= 50 ? 'medio' : 'baixo';
  const alvo = nota == null ? c : c * (1 - nota / 100);
  return `<span class="rl-anel ${cls}" style="width:${tam}px;height:${tam}px">
    <svg viewBox="0 0 ${tam} ${tam}" aria-hidden="true"><circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" class="rl-anel-fundo"/><circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" class="rl-anel-cor" style="stroke-dasharray:${c.toFixed(1)};--c:${c.toFixed(1)};--alvo:${alvo.toFixed(1)}" transform="rotate(-90 ${tam / 2} ${tam / 2})"/></svg>
    <b class="num">${nota == null ? '–' : nota}</b></span>`;
}
/* um degrau do pódio, desenhado em SVG com frente, topo e lado (o 3D) */
function rlDegrau(lugar, alt) {
  const W = 132, D = 16, w = W - D;
  const cor = { 1: ['#FFD27A', '#FFB52E', '#B97E10'], 2: ['#E3E9F0', '#AEB9C6', '#738194'], 3: ['#F0B48A', '#C9773F', '#8A4C22'] }[lugar];
  const g = 'rl-g' + lugar;
  return `<svg class="rl-degrau" viewBox="0 0 ${W} ${alt + D}" width="${W}" height="${alt + D}" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor[1]}"/><stop offset="1" stop-color="${cor[2]}"/></linearGradient></defs>
    <polygon points="0,${D} ${w},${D} ${W},0 ${D},0" fill="${cor[0]}"/>
    <polygon points="${w},${D} ${W},0 ${W},${alt} ${w},${alt + D}" fill="${cor[2]}" opacity=".85"/>
    <rect x="0" y="${D}" width="${w}" height="${alt}" fill="url(#${g})"/>
    <rect x="0" y="${D}" width="${w}" height="3" fill="#fff" opacity=".28"/>
    <text x="${w / 2}" y="${D + Math.min(alt - 14, 46)}" text-anchor="middle" class="rl-degrau-n">${lugar}º</text>
  </svg>`;
}

/* ---------- a tela ---------- */
function vRelatorios() {
  const filtro = `<div class="chips rl-filtro" role="group" aria-label="Período">${RL_PERIODOS.map(([v, t]) => `<button type="button" class="chip ${RL.per === v ? 'on' : ''}" data-act="rl-per" data-v="${v}" aria-pressed="${RL.per === v}">${esc(t)}</button>`).join('')}</div>`;
  const topo = `${faixaCel()}<div class="topo rl-topo"><div><h1>Gestão <small>· como a ${esc(MARCA)} está indo</small></h1>${REAL() ? '' : '<div class="sm" style="margin-top:4px">Demonstração: seis meses de leads de exemplo.</div>'}</div>${filtro}</div>`;
  if (!LD.carregou) return `${topo}<div class="sm">Carregando os números…</div>`;
  if (LD.erro) return `${topo}<div class="wz-aviso sm">${esc(LD.erro)}</div>`;
  const R = rlContas(RL.per), P = R.P, J = R.J;
  RL.ultimo = R;
  if (!R.todos.length) return `${topo}<div class="box vazio"><b>A Gestão aparece com os primeiros leads.</b><span class="sm">Cada visita, reserva ou proposta que a Milla anota entra aqui: os números do período, o funil, a equipe, os meses, quando os leads chegam e os imóveis mais pedidos.</span></div>`;

  /* 1. os seis números */
  const tiles = [
    ['Leads', rlConta(R.jan.length), rlVar(R.jan.length, R.ant.length, J)],
    ['Fechados', rlConta(R.fechJ), rlVar(R.fechJ, R.fechA, J)],
    ['Taxa de fechamento', R.taxa == null ? '<b class="num">–</b>' : rlConta(R.taxa, '%'), R.taxa == null ? '<span class="rl-var">nenhum lead decidido no período</span>' : rlVar(R.taxa, R.taxaA, J, { pp: true })],
    ['A equipe responde em', `<b class="num rl-txt">${esc(rlMinutos(R.resp))}</b>`, R.resp == null ? '<span class="rl-var">ninguém tocou num aviso no período</span>' : rlVar(R.resp, R.respA, J, { tempo: true })],
    ['Fora do expediente', R.foraPct == null ? '<b class="num">–</b>' : rlConta(R.foraPct, '%'), R.foraPct == null ? '<span class="rl-var">sem leads no período</span>' : `<span class="rl-var">${rlNum(R.fora)} ${R.fora === 1 ? 'lead chegou' : 'leads chegaram'} à noite, cedo ou no fim de semana, e a Milla respondeu na hora</span>`],
    J.mes
      ? ['Previsão do mês', R.prev == null ? '<b class="num">–</b>' : rlConta(R.prev), R.prev == null ? '<span class="rl-var">sai depois dos primeiros dias do mês</span>' : `<span class="rl-var ${R.prev >= R.prevAnt ? 'sobe' : 'desce'}"><i aria-hidden="true">${R.prev >= R.prevAnt ? '▲' : '▼'}</i> leads no ritmo de agora; ${esc(P.mesAnt)} teve ${rlNum(R.prevAnt)}</span>`]
      : ['Leads por dia', `<b class="num rl-txt">${(R.jan.length / J.dias).toFixed(1).replace('.', ',')}</b>`, `<span class="rl-var">média ${esc(J.nome)}</span>`],
  ];
  const kpis = `<section class="kpis rl-kpis rl-anima" id="rl-kpis" aria-label="O período em números">${tiles.map(([t, v, s], i) => `<div class="kpi rl-kpi rl-tilt" style="--d:${(i * 0.06).toFixed(2)}s"><span class="kpi-rot">${esc(t)}</span>${v}${s}</div>`).join('')}</section>`;

  /* 2. o funil e o que precisa de alguém */
  const f0 = Math.max(1, R.funil[0][2]);
  const funil = rlSec('funil', 'O caminho do lead', 'Dos leads que chegaram ' + J.nome + ', quantos avançaram',
    `<ol class="rl-funil">${R.funil.map(([rot, sub, v], i) => {
      const passo = i ? (R.funil[i - 1][2] ? Math.round(v / R.funil[i - 1][2] * 100) + '% do passo anterior' : '') : '';
      return `<li style="--w:${Math.max(v ? 4 : 0, v / f0 * 100).toFixed(1)}%;--d:${(i * 0.14).toFixed(2)}s;--tom:${1 - i * 0.16}">
        <span class="rl-f-rot"><b>${esc(rot)}</b><span class="sm">${esc(sub)}</span></span>
        <span class="rl-f-barra"><i></i></span>
        <span class="rl-f-num">${rlConta(v)}<span class="sm">${i ? esc(passo) : '100%'}</span></span></li>`;
    }).join('')}</ol>`);
  const A = R.atencao;
  const at = [
    ['parados', A.parados, 'em aberto sem andar há mais de 7 dias', 'Mude o status em Leads quando avançar: os números ficam certos.'],
    ['novos', A.novosVelhos, 'ainda em Novo há mais de 24 h', 'Alguém precisa pegar.'],
    ['quentes', A.quentes, 'quentes em aberto', 'Os mais perto de fechar.'],
  ].concat(A.semDono ? [['ninguem', A.semDono, 'avisos que ninguém respondeu', 'O rodízio deu a volta sem resposta.']] : []);
  const atencao = rlSec('atencao', 'Precisa de alguém', 'Agora, nos ' + rlNum(R.abertos) + ' leads em aberto',
    `<ul class="rl-at">${at.map(([k, v, t, s]) => `<li class="rl-at-${k} ${v ? '' : 'zero'}"><a href="#/leads"><b class="num">${rlNum(v)}</b><span><span class="rl-at-t">${esc(t)}</span><span class="sm">${esc(v ? s : 'Nada aqui.')}</span></span></a></li>`).join('')}</ul>`,
    '<a class="sm rl-cab-link" href="#/leads">Leads</a>');

  /* 3. a equipe */
  const comNota = R.equipe.filter(x => x.nota != null);
  let equipeHtml;
  if (!R.equipe.length || !R.respostas) {
    equipeHtml = `<div class="rl-corpo"><div class="vazio rl-eq-vazio"><b>A pontuação começa quando a equipe responder aos avisos da Milla.</b><span class="sm">Cada pedido chega para a pessoa da vez no WhatsApp, com os botões Confirmar, Outro horário e Eu assumo. O toque mostra quem pegou e em quanto tempo; o status em Leads mostra quem fechou.${R.equipe.length ? ' Já foram avisados ' + esc(R.equipe.map(x => x.nome + ' (' + x.avisos + ')').join(', ')) + '.' : ''}</span></div></div>`;
  } else {
    const top = comNota.slice(0, 3);
    const ordem = top.length === 3 ? [top[1], top[0], top[2]] : top;
    const lugarDe = x => top.indexOf(x) + 1;
    const ALT = { 1: 118, 2: 86, 3: 62 };
    const podio = top.length ? `<div class="rl-podio" aria-label="Os primeiros da pontuação">${ordem.map(x => { const l = lugarDe(x); return `<div class="rl-deg" style="--d:${({ 1: .5, 2: .3, 3: .15 })[l]}s">
        <div class="rl-deg-quem">${av(x.nome)}<b>${esc(x.nome)}</b><span class="num rl-deg-nota">${x.nota}<small> pontos</small></span></div>
        ${rlDegrau(l, ALT[l])}</div>`; }).join('')}</div>` : '';
    const card = (x, i) => {
      const lugar = x.nota != null ? comNota.indexOf(x) + 1 : 0;
      const prods = Object.entries(x.prods).sort((a, b) => b[1] - a[1]).map(([k]) => RL_NOME(k)).slice(0, 3).join(' · ');
      const num = [
        ['Avisos', rlNum(x.avisos)], ['Respondeu', rlNum(x.respondeu)], ['Tempo', rlMinutos(x.tempo)],
        ['Perdeu a vez', rlNum(x.perdeu)], ['Fechados', rlNum(x.fechados)], ['Conversão', x.decididos ? Math.round(x.fechados / x.decididos * 100) + '%' : '–'],
      ];
      return `<li class="rl-pc ${lugar && lugar <= 3 ? 'top' + lugar : ''}" style="--d:${(i * 0.08).toFixed(2)}s">
        <div class="rl-pc-cab">${lugar ? `<span class="rl-lugar num">${lugar}º</span>` : ''}${av(x.nome)}<span class="rl-pc-nome"><b>${esc(x.nome)}</b><span class="sm">${esc(prods || 'sem produto ainda')}</span></span>${rlAnel(x.nota)}</div>
        <dl class="rl-pc-num">${num.map(([t, v]) => `<div><dt>${esc(t)}</dt><dd class="num">${esc(v)}</dd></div>`).join('')}</dl>
        ${x.nota == null ? `<div class="sm rl-pc-pouco">Nota a partir de ${RL_MIN_NOTA} respostas no período (tem ${x.respondeu}).</div>` : `<ul class="rl-comp" aria-label="De onde vem a nota">${x.comp.map(([n, v, d], k) => `<li title="${esc(d)}"><span class="rl-comp-n">${esc(n)}<small>peso ${RL_PESOS[n]}</small></span><span class="rl-comp-t"><i style="width:${v.toFixed(0)}%;--d:${(0.3 + k * 0.08).toFixed(2)}s"></i></span><span class="num">${Math.round(v)}</span></li>`).join('')}</ul>`}
      </li>`;
    };
    const tabela = `<details class="rl-tab rl-eq-tab"><summary>Ver a equipe em tabela</summary><div class="rl-tab-rolo"><table class="rl-eq"><thead><tr><th scope="col">Pessoa</th><th scope="col">Pontos</th><th scope="col">Avisos</th><th scope="col">Respondeu</th><th scope="col">Perdeu a vez</th><th scope="col">Tempo</th><th scope="col">Fechados</th><th scope="col">Decididos</th><th scope="col">Em aberto</th><th scope="col">Parados</th></tr></thead><tbody>${R.equipe.map(x => `<tr><th scope="row">${esc(x.nome)}</th><td class="num b">${x.nota == null ? '–' : x.nota}</td><td class="num">${rlNum(x.avisos)}</td><td class="num">${rlNum(x.respondeu)}</td><td class="num">${rlNum(x.perdeu)}</td><td class="num">${esc(rlMinutos(x.tempo))}</td><td class="num">${rlNum(x.fechados)}</td><td class="num">${rlNum(x.decididos)}</td><td class="num">${rlNum(x.abertos)}</td><td class="num">${rlNum(x.parados)}</td></tr>`).join('')}</tbody></table></div></details>`;
    const como = `<details class="rl-tab rl-como"><summary>Como a pontuação é feita</summary><div class="sm rl-como-tx">
      <p>De 0 a 100, juntando quatro partes com pesos:</p>
      <ul><li><b>Resposta (30):</b> dos avisos que eram da vez da pessoa, quantos ela respondeu. No "todos de uma vez" só um responde, então lá ninguém perde ponto.</li>
      <li><b>Rapidez (20):</b> metade das respostas em até 3 minutos vale 100; em 1 hora ou mais, 0.</li>
      <li><b>Conversão (35):</b> os fechados contra o que a média da equipe fecharia nos mesmos produtos. Igual à média vale 60. Assim quem atende venda não perde para quem atende temporada. Com menos de 3 leads decididos, vale a média.</li>
      <li><b>Cuidado (15):</b> dos leads em aberto da pessoa, quantos andaram nos últimos 7 dias.</li></ul>
      <p>Só ganha nota quem respondeu a ${RL_MIN_NOTA} avisos ou mais no período. Mude o período lá em cima para comparar meses.</p></div></details>`;
    equipeHtml = `<div class="rl-corpo rl-eq-corpo">${podio}<ol class="rl-pcs">${R.equipe.map(card).join('')}</ol>${tabela}${como}</div>`;
  }
  const equipe = rlSec('equipe', 'Desempenho da equipe', 'Quem pegou os leads ' + J.nome + ', em quanto tempo e quanto fechou', equipeHtml,
    R.respostas ? '<button type="button" class="btn btn-line btn-p rl-csv" data-act="rl-csv">Baixar planilha</button>' : '');

  /* 4. os meses */
  const meses = `<div class="rl-grade2">
      ${rlColunas('leads', 'Leads por mês', 'Tudo o que a Milla anotou: visitas, reservas, propostas e quem quer anunciar', R.meses, R.chegaram, R.prods, P)}
      ${rlColunas('fechados', 'Negócios fechados por mês', 'Leads que a equipe marcou como Fechado', R.meses, R.fechados, R.prods, P)}
    </div>`;
  const sobe = R.subida.map(x => {
    const s = x.pct == null ? 'sobe' : x.pct > 0 ? 'sobe' : x.pct < 0 ? 'desce' : '';
    const seta = s === 'sobe' ? '▲' : s === 'desce' ? '▼' : '=';
    const quanto = x.pct == null ? 'novo: nenhum no mesmo período de ' + P.mesAnt : (x.pct > 0 ? '+' : x.pct < 0 ? '−' : '') + Math.abs(x.pct) + '% sobre o mesmo período de ' + P.mesAnt + ' (' + rlNum(x.antes) + ')';
    return `<li><i class="s-${x.k}" aria-hidden="true"></i><span><b>${esc(RL_NOME(x.k))}</b> · ${rlNum(x.agora)} ${x.agora === 1 ? 'lead' : 'leads'} de 1 a ${P.dia} de ${esc(P.mes)}</span><span class="rl-var ${s}"><i aria-hidden="true">${seta}</i> ${esc(quanto)}</span></li>`;
  }).join('');
  const subindo = sobe ? rlSec('sobe', 'O que está subindo', `Leads de 1 a ${P.dia} de ${P.mes}, por produto, contra o mesmo pedaço de ${P.mesAnt}`, `<ul class="rl-sobe">${sobe}</ul>`) : '';

  /* 5. quando chegam, de onde vêm e a temperatura */
  const hmax = Math.max(1, ...R.heat.flat());
  const exp = (lin, col) => (lin < 5 && col >= 3 && col <= 5) || (lin === 5 && col === 3);
  const heat = rlSec('quando', 'Quando os leads chegam', (R.heatSeis ? 'Últimos 6 meses (poucos leads no período escolhido)' : 'Leads ' + J.nome) + ', por dia e horário. O contorno marca o horário comercial.',
    `<div class="rl-corpo"><div class="rl-heat" role="img" aria-label="${esc('Mapa de quando os leads chegam: o horário com mais leads é ' + (() => { let m = [0, 0]; R.heat.forEach((l, i) => l.forEach((v, j) => { if (v > R.heat[m[0]][m[1]]) m = [i, j]; })); return RL_SEMANA_LONGA[m[0]] + ' das ' + m[1] * 3 + ' às ' + (m[1] * 3 + 3) + ' h'; })())}">
      <span></span>${Array.from({ length: 8 }, (_, j) => `<span class="rl-h-hora num">${j * 3}h</span>`).join('')}
      ${R.heat.map((l, i) => `<span class="rl-h-dia">${RL_SEMANA[i]}</span>${l.map((v, j) => `<span class="rl-cel ${exp(i, j) ? 'exp' : ''} ${v / hmax > .55 ? 'forte' : ''}" tabindex="0" style="--a:${(v / hmax).toFixed(3)};--d:${((i + j) * 0.025).toFixed(3)}s" data-tip="${esc(RL_SEMANA_LONGA[i] + ', ' + j * 3 + 'h–' + (j * 3 + 3) + 'h|' + v + (v === 1 ? ' lead' : ' leads'))}">${v || ''}</span>`).join('')}`).join('')}
    </div>
    <div class="rl-h-leg sm"><span>menos</span><i aria-hidden="true"></i><span>mais</span><span class="rl-h-exp">horário comercial</span></div>
    <div class="sm rl-nota">${R.foraPct == null ? '' : `${rlPct(R.foraPct)} dos leads ${esc(J.nome)} chegaram fora do expediente. Sem a Milla, eles esperariam até a manhã seguinte.`}</div></div>`);
  const orig = R.origem.map(([k, v]) => ({ rot: (RL_ORIGENS.find(o => o[0] === k) || [, k])[1], v, cls: 'rl-unica' }));
  const origem = rlSec('origem', 'De onde vêm', 'Leads ' + J.nome + ', pelo canal em que chegaram', orig.length ? rlBarras(orig) : '<div class="vazio"><span class="sm">Sem leads no período.</span></div>');
  const tmp = R.temp.map(([k, n, v]) => ({ rot: n, v, cls: 'rl-t-' + k })).concat(R.semTemp ? [{ rot: 'Sem temperatura', v: R.semTemp, cls: 'rl-unica' }] : []);
  const temperatura = rlSec('temp', 'Temperatura', 'Os ' + rlNum(R.abertos) + ' leads em aberto agora', R.abertos ? rlBarras(tmp) : '<div class="vazio"><span class="sm">Nenhum lead em aberto.</span></div>');

  /* 6. imóveis e balneários */
  const imv = R.imoveis.map(([ref, v]) => { const im = typeof porRef === 'function' ? porRef(ref) : null; return { rot: 'Ref. ' + ref, sub: im ? tituloCurto(im) + ' · ' + precoIm(im) : '', v, img: im ? capa(im) : '', cls: 'rl-unica' }; });
  const bal = R.balnearios.map(([b, v]) => ({ rot: b, v, cls: 'rl-unica' }));

  return `${topo}
    ${kpis}
    <div class="rl-grade2 rl-g-funil">${funil}${atencao}</div>
    ${equipe}
    ${meses}
    ${subindo}
    <div class="rl-grade2">${heat}<div class="rl-pilha2">${origem}${temperatura}</div></div>
    <div class="rl-grade2">
      ${rlSec('imv', 'Imóveis mais pedidos', 'Leads ' + J.nome, imv.length ? rlBarras(imv) : '<div class="vazio"><span class="sm">Nenhum lead com imóvel no período.</span></div>', '<a class="sm rl-cab-link" href="#/imoveis">Imóveis</a>')}
      ${rlSec('bal', 'Balneários mais procurados', 'Leads ' + J.nome + ', pelo balneário do imóvel', bal.length ? rlBarras(bal) : '<div class="vazio"><span class="sm">Ainda sem balneário nos leads do período.</span></div>')}
    </div>
    <div class="sm rl-pe">Os números saem dos leads que a Milla anota${LD.lista.length >= 500 ? ' (os 500 mais recentes)' : ''}. ${R.semData ? 'Os fechados de antes de 16/11/2026 contam no mês em que o lead chegou. ' : ''}Para um lead contar como venda, locação ou temporada, vale o imóvel dele; sem imóvel, o que o cliente pediu. Fechado e perdido vêm do status que a equipe marca em Leads.</div>`;
}

/* ---------- o movimento: cada bloco se monta quando aparece, uma vez só ---------- */
const RL_CALMO = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } };
function rlContaAnima(raiz) {
  if (RL_CALMO()) return;
  raiz.querySelectorAll('[data-conta]').forEach(el => {
    const alvo = +el.dataset.conta, suf = el.dataset.suf || '', t0 = performance.now(), dur = 1100;
    if (!alvo) return;
    const passo = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = rlNum(Math.round(alvo * e)) + suf;
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });
}
function rlAnima() {
  const blocos = [...document.querySelectorAll('.rl-anima')];
  const chave = el => RL.per + ':' + el.id;
  const mostra = (el, anima) => {
    if (!anima) el.classList.add('ja');
    el.classList.add('vis');
    if (anima) rlContaAnima(el);
    RL.visto.add(chave(el));
  };
  if (RL_CALMO() || !('IntersectionObserver' in window)) { blocos.forEach(el => mostra(el, false)); return; }
  if (rlAnima.obs) rlAnima.obs.disconnect();
  rlAnima.obs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    rlAnima.obs.unobserve(e.target);
    /* duas voltas de quadro: o estado de antes precisa ser desenhado para a transição acontecer */
    requestAnimationFrame(() => requestAnimationFrame(() => mostra(e.target, true)));
  }), { threshold: 0.18 });
  blocos.forEach(el => { if (RL.visto.has(chave(el))) mostra(el, false); else rlAnima.obs.observe(el); });
}

/* o cartão inclina um pouco na direção do mouse (só com mouse, e sem "menos movimento") */
document.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || RL_CALMO()) return;
  const el = e.target.closest && e.target.closest('.rl-tilt');
  if (rlAnima.tilt && rlAnima.tilt !== el) { rlAnima.tilt.style.transform = ''; rlAnima.tilt = null; }
  if (!el) return;
  const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  el.style.transform = `perspective(700px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateY(-3px)`;
  rlAnima.tilt = el;
}, { passive: true });

/* ---------- cliques: o período e a planilha ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act^="rl-"]'); if (!el) return;
  if (el.dataset.act === 'rl-per') {
    RL.per = el.dataset.v; try { localStorage.setItem('milla_rl_per', RL.per); } catch (_) {}
    render(); return;
  }
  if (el.dataset.act === 'rl-csv' && RL.ultimo) {
    const R = RL.ultimo, J = R.J;
    const cab = ['Pessoa', 'Pontos', 'Avisos', 'Respondeu', 'Perdeu a vez', 'Tempo (min, metade das respostas)', 'Fechados', 'Decididos', 'Em aberto', 'Parados 7+ dias', 'Resposta', 'Rapidez', 'Conversão', 'Cuidado'];
    const parte = (x, n) => { const c = x.comp.find(c => c[0] === n); return c ? Math.round(c[1]) : ''; };
    const linhas = R.equipe.map(x => [x.nome, x.nota == null ? '' : x.nota, x.avisos, x.respondeu, x.perdeu, x.tempo == null ? '' : Math.round(x.tempo), x.fechados, x.decididos, x.abertos, x.parados, parte(x, 'Resposta'), parte(x, 'Rapidez'), parte(x, 'Conversão'), parte(x, 'Cuidado')]);
    const csv = '﻿' + [['Equipe ' + MARCA + ' · ' + J.nome], cab, ...linhas].map(l => l.map(v => /[;"\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'equipe-' + String(MARCA).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
});

/* ---------- a dica ao passar o dedo (o mesmo no teclado) ---------- */
function rlDica(el) {
  let t = $('rl-dica');
  if (!t) { t = document.createElement('div'); t.id = 'rl-dica'; t.className = 'rl-dica'; t.setAttribute('aria-hidden', 'true'); document.body.appendChild(t); }
  if (!el) { t.classList.remove('on'); return; }
  const [cab, valor, ...resto] = String(el.dataset.tip || '').split('|');
  t.textContent = '';
  const v = document.createElement('b'); v.textContent = valor || ''; t.appendChild(v);
  const c = document.createElement('span'); c.className = 'rl-dica-cab'; c.textContent = cab || ''; t.appendChild(c);
  resto.forEach(r => {
    const [nome, n] = r.split(': '), k = (RL_PRODUTOS.find(x => x[1] === nome) || ['outro'])[0];
    const l = document.createElement('span'); l.className = 'rl-dica-l';
    const i = document.createElement('i'); i.className = 's-' + k; l.appendChild(i);
    const nn = document.createElement('b'); nn.textContent = n || ''; l.appendChild(nn);
    l.appendChild(document.createTextNode(' ' + (nome || ''))); t.appendChild(l);
  });
  /* em cima da barra; sem lugar em cima, ao lado dela */
  const alvo = el.querySelector('.rl-pilha') || el, r = alvo.getBoundingClientRect(), w = t.offsetWidth || 170, h = t.offsetHeight || 90;
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - (el.classList.contains('rl-cel') ? 10 : 26);
  if (y < 8) { y = Math.max(8, r.top); x = r.right + 12; if (x + w > window.innerWidth - 8) x = r.left - w - 12; }
  t.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x)) + 'px';
  t.style.top = Math.min(window.innerHeight - h - 8, y) + 'px';
  t.classList.add('on');
}
const RL_DICA_ALVO = '.rl-col, .rl-cel';
document.addEventListener('pointerover', e => { const el = e.target.closest && e.target.closest(RL_DICA_ALVO); rlDica(el || null); });
document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest(RL_DICA_ALVO); rlDica(el || null); });
document.addEventListener('focusout', () => rlDica(null));
window.addEventListener('scroll', () => rlDica(null), { passive: true });
