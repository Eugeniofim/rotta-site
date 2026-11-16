/* =====================================================
   GESTÃO · RELATÓRIOS (16/11/2026) — a camada de quem gere a imobiliária.

   Pedido dele: "CRM simples e sofisticado com camadas efetivas… gráficos mensais
   mostrando o que está aumentando… relatórios com gráficos… nada supérfluo".

   As camadas do app:
     todo mundo da equipe   Início (o que é para agora), WhatsApp, Leads, Imóveis
     quem gere (dono)       Gestão = Relatórios (este arquivo) + Equipe e acessos
   O Início fala de HOJE; os Relatórios falam do MÊS e da tendência. Não repetem números.

   De onde vem: só dos leads que a Milla anota (pedidos), os mesmos da tela Leads (LD.lista,
   os 500 mais recentes). Nada novo no banco: o produto do lead sai do rodízio da equipe,
   do imóvel (transação) ou do texto; "fechado" é o status Fechado; o mês do fechamento é
   o statusEm (gravado quando alguém muda o status, desde 16/11/2026) ou, sem ele, o mês
   em que o lead chegou.

   Gráficos à mão (HTML, sem biblioteca). Cores dos produtos em ordem fixa, validadas no
   fundo escuro do app (validate_palette da skill dataviz: todas passam). O texto nunca
   usa a cor da série; cada gráfico tem legenda, rótulo no topo e a tabela dos números.
   ===================================================== */
'use strict';

/* ordem fixa = cor fixa: um produto nunca troca de cor */
const RL_PRODUTOS = [['venda', 'Venda'], ['aluguel', 'Locação'], ['temporada', 'Temporada'], ['captacao', 'Captação']];
const RL_MESES = 6;
const RL_MES_NOME = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const RL_MES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const RL_DIA = 86400000;

/* ---------- de que produto é o lead ---------- */
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
const rlData = iso => { const d = iso ? new Date(iso) : null; return d && !isNaN(d) ? d : null; };
const rlFechado = p => p.status === 'atendido';
const rlDecidido = p => p.status === 'atendido' || p.status === 'perdido';
/* quando o lead foi decidido: o statusEm; sem ele (antes de 16/11), o dia em que chegou */
const rlDecididoEm = p => rlData(p.statusEm) || rlData(p.criadoEm);
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
const rlEntre = (d, a, b) => d && d >= a && d < b;

/* ---------- as contas ---------- */
function rlContas() {
  const leads = (LD.lista || []).map(p => Object.assign({ _prod: rlProduto(p), _em: rlData(p.criadoEm) }, p)).filter(p => p._em);
  const meses = rlMesesLista(), P = rlPeriodos();
  const prods = RL_PRODUTOS.map(x => x[0]).concat(leads.some(p => p._prod === 'outro') ? ['outro'] : []);
  const porMes = (filtro, data) => meses.map(m => {
    const c = { total: 0 }; prods.forEach(k => { c[k] = 0; });
    leads.forEach(p => { const d = data(p); if (filtro(p) && rlEntre(d, m.ini, m.fim)) { c[p._prod]++; c.total++; } });
    return c;
  });
  const chegaram = porMes(() => true, p => p._em);
  const fechados = porMes(rlFechado, rlDecididoEm);
  /* o que está subindo: o mês até hoje contra o mesmo pedaço do mês passado, por produto */
  const conta = (filtro, data, a, b) => leads.filter(p => filtro(p) && rlEntre(data(p), a, b)).length;
  const subida = prods.filter(k => k !== 'outro').map(k => {
    const agora = conta(p => p._prod === k, p => p._em, P.ini, P.agora), antes = conta(p => p._prod === k, p => p._em, P.iniAnt, P.fimAnt);
    return { k, agora, antes, dif: agora - antes, pct: antes ? Math.round((agora - antes) / antes * 100) : null };
  }).filter(x => x.agora || x.antes).sort((a, b) => (b.pct == null ? 1e9 : b.pct) - (a.pct == null ? 1e9 : a.pct) || b.dif - a.dif);
  const leadsMes = conta(() => true, p => p._em, P.ini, P.agora), leadsAnt = conta(() => true, p => p._em, P.iniAnt, P.fimAnt);
  const fechMes = conta(rlFechado, rlDecididoEm, P.ini, P.agora), fechAnt = conta(rlFechado, rlDecididoEm, P.iniAnt, P.fimAnt);
  /* taxa de fechamento: dos leads decididos nos últimos 90 dias, quantos fecharam */
  const d90 = new Date(P.agora - 90 * RL_DIA), d30 = new Date(P.agora - 30 * RL_DIA), d60 = new Date(P.agora - 60 * RL_DIA);
  const decididos = leads.filter(p => rlDecidido(p) && rlEntre(rlDecididoEm(p), d90, P.agora));
  const taxa = decididos.length ? Math.round(decididos.filter(rlFechado).length / decididos.length * 100) : null;
  const resp30 = rlMediana(leads.filter(p => rlEntre(p._em, d30, P.agora)).map(rlRespMin).filter(v => v != null));
  const resp60 = rlMediana(leads.filter(p => rlEntre(p._em, d60, d30)).map(rlRespMin).filter(v => v != null));
  /* os mais procurados nos últimos 30 dias */
  const recentes = leads.filter(p => rlEntre(p._em, d30, P.agora));
  const somar = (l, chave) => { const m = new Map(); l.forEach(p => { const c = chave(p); if (c) m.set(c, (m.get(c) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const imoveis = somar(recentes, p => p.imovelRef || '').slice(0, 5);
  const balnearios = somar(recentes, p => { const im = p.imovelRef && typeof porRef === 'function' ? porRef(p.imovelRef) : null; return (im && im.bairro) || (p.extra && (p.extra['Balneário'] || p.extra.Bairro || p.extra.bairro)) || ''; }).slice(0, 6);
  /* a equipe nos últimos 90 dias: quem respondeu ao aviso, em quanto tempo, e quantos fecharam */
  const eq = new Map();
  leads.filter(p => rlEntre(p._em, d90, P.agora)).forEach(p => {
    const por = p.equipe && p.equipe.resposta && p.equipe.resposta.por; if (!por) return;
    const x = eq.get(por) || { nome: por, leads: 0, tempos: [], fechados: 0, decididos: 0 };
    x.leads++; const t = rlRespMin(p); if (t != null) x.tempos.push(t);
    if (rlDecidido(p)) { x.decididos++; if (rlFechado(p)) x.fechados++; }
    eq.set(por, x);
  });
  const equipe = [...eq.values()].sort((a, b) => b.leads - a.leads);
  const semData = leads.some(p => rlFechado(p) && !p.statusEm);
  return { leads, meses, P, prods, chegaram, fechados, subida, leadsMes, leadsAnt, fechMes, fechAnt, taxa, decididos: decididos.length, resp30, resp60, imoveis, balnearios, equipe, semData, recentes: recentes.length };
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
function rlVariacao(agora, antes, P) {
  if (!antes && !agora) return `<span class="rl-var">igual ao mesmo período de ${esc(P.mesAnt)}</span>`;
  if (!antes) return `<span class="rl-var sobe"><i aria-hidden="true">▲</i> não teve nenhum de 1 a ${P.dia} de ${esc(P.mesAnt)}</span>`;
  const pct = Math.round((agora - antes) / antes * 100);
  if (pct === 0) return `<span class="rl-var"><i aria-hidden="true">=</i> igual a 1–${P.dia} de ${esc(P.mesAntCurto)} (${rlNum(antes)})</span>`;
  return `<span class="rl-var ${pct > 0 ? 'sobe' : 'desce'}"><i aria-hidden="true">${pct > 0 ? '▲' : '▼'}</i> ${pct > 0 ? '+' : '−'}${Math.abs(pct)}% sobre 1–${P.dia} de ${esc(P.mesAntCurto)} (${rlNum(antes)})</span>`;
}
/* colunas empilhadas por mês: legenda acima, total no topo, dica ao passar o dedo, tabela embaixo */
function rlColunas(id, titulo, sub, meses, contas, prods, P) {
  const { teto, linhas } = rlEixo(Math.max(1, ...contas.map(c => c.total)));
  const usados = prods.filter(k => contas.some(c => c[k]));
  const col = (m, c) => {
    const rot = m.nome + (m.atual ? '*' : '');
    const dica = [m.longo + (m.atual ? ' (até hoje)' : ''), rlNum(c.total) + ' ' + (id === 'fechados' ? (c.total === 1 ? 'fechado' : 'fechados') : (c.total === 1 ? 'lead' : 'leads'))].concat(usados.filter(k => c[k]).map(k => RL_NOME(k) + ': ' + rlNum(c[k]))).join('|');
    const alt = c.total / teto * 100;
    return `<div class="rl-col" tabindex="0" data-tip="${esc(dica)}" aria-label="${esc(dica.split('|').join(', '))}">
      <div class="rl-area"><div class="rl-pilha" style="height:${alt.toFixed(2)}%">${c.total ? `<span class="rl-tot num">${rlNum(c.total)}</span>` : ''}${usados.filter(k => c[k]).map(k => `<i class="s-${k}" style="flex-grow:${c[k]}"></i>`).join('')}</div></div>
      <span class="rl-mes">${esc(rot)}</span></div>`;
  };
  const tabela = `<details class="rl-tab"><summary>Ver os números em tabela</summary><div class="rl-tab-rolo"><table><thead><tr><th scope="col">Mês</th>${usados.map(k => `<th scope="col">${esc(RL_NOME(k))}</th>`).join('')}<th scope="col">Total</th></tr></thead><tbody>${meses.map((m, i) => `<tr><th scope="row">${esc(m.longo)}${m.atual ? ' (até hoje)' : ''}</th>${usados.map(k => `<td class="num">${rlNum(contas[i][k])}</td>`).join('')}<td class="num b">${rlNum(contas[i].total)}</td></tr>`).join('')}</tbody></table></div></details>`;
  return `<section class="bloco rl-bloco" aria-labelledby="rl-t-${id}">
    <div class="bloco-cab"><div><h2 id="rl-t-${id}">${esc(titulo)}</h2><div class="sm rl-sub">${esc(sub)}</div></div></div>
    <div class="rl-corpo">
      ${usados.length > 1 ? `<ul class="rl-legenda" aria-label="Legenda">${usados.map(k => `<li><i class="s-${k}" aria-hidden="true"></i>${esc(RL_NOME(k))}</li>`).join('')}</ul>` : ''}
      <div class="rl-plot">
        <div class="rl-grade" aria-hidden="true">${linhas.map(v => `<span style="bottom:${(v / teto * 100).toFixed(2)}%"><b class="num">${rlNum(v)}</b></span>`).join('')}</div>
        <div class="rl-cols">${meses.map((m, i) => col(m, contas[i])).join('')}</div>
      </div>
      <div class="sm rl-nota">* ${esc(P.mes)} até hoje (dia ${P.dia}).${id === 'fechados' ? ' Conta no mês em que o lead virou Fechado.' : ''}</div>
      ${tabela}
    </div></section>`;
}
/* barras deitadas de uma série só (o título diz o que é): valor na ponta */
function rlBarras(itens) {
  const max = Math.max(1, ...itens.map(x => x.v));
  return `<ul class="rl-barras">${itens.map(x => `<li>
      ${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy">` : ''}
      <span class="rl-b-tx"><b>${esc(x.rot)}</b>${x.sub ? `<span class="sm">${esc(x.sub)}</span>` : ''}</span>
      <span class="rl-b-trilho"><i style="width:${(x.v / max * 100).toFixed(1)}%"></i><span class="num">${rlNum(x.v)}</span></span></li>`).join('')}</ul>`;
}

/* ---------- a tela ---------- */
function vGestaoAbas(on) {
  return `<nav class="rl-abas" aria-label="Gestão"><a href="#/gestao" class="${on === 'gestao' ? 'on' : ''}" ${on === 'gestao' ? 'aria-current="page"' : ''}>Relatórios</a><a href="#/equipe" class="${on === 'equipe' ? 'on' : ''}" ${on === 'equipe' ? 'aria-current="page"' : ''}>Equipe e acessos</a></nav>`;
}
function vRelatorios() {
  const topo = `${faixaCel()}<div class="topo"><div><h1>Gestão <small>· como a ${esc(MARCA)} está indo</small></h1>${REAL() ? '' : '<div class="sm" style="margin-top:4px">Demonstração: seis meses de leads de exemplo.</div>'}</div></div>${vGestaoAbas('gestao')}`;
  if (!LD.carregou) return `${topo}<div class="sm">Carregando os números…</div>`;
  if (LD.erro) return `${topo}<div class="wz-aviso sm">${esc(LD.erro)}</div>`;
  const R = rlContas(), P = R.P;
  if (!R.leads.length) return `${topo}<div class="box vazio"><b>Os relatórios aparecem com os primeiros leads.</b><span class="sm">Cada visita, reserva ou proposta que a Milla anota entra aqui: leads por mês, o que está subindo, os imóveis mais pedidos e a equipe.</span></div>`;
  const tiles = [
    ['Leads em ' + P.mes, rlNum(R.leadsMes), rlVariacao(R.leadsMes, R.leadsAnt, P)],
    ['Fechados em ' + P.mes, rlNum(R.fechMes), rlVariacao(R.fechMes, R.fechAnt, P)],
    ['Taxa de fechamento', R.taxa == null ? '–' : R.taxa + '%', `<span class="rl-var">dos ${rlNum(R.decididos)} leads decididos nos últimos 90 dias</span>`],
    ['A equipe responde em', rlMinutos(R.resp30), R.resp30 == null ? '<span class="rl-var">sem resposta registrada em 30 dias</span>' : (R.resp60 == null ? '<span class="rl-var">metade dos avisos, últimos 30 dias</span>' : `<span class="rl-var ${R.resp30 < R.resp60 ? 'sobe' : R.resp30 > R.resp60 ? 'desce' : ''}"><i aria-hidden="true">${R.resp30 < R.resp60 ? '▲' : R.resp30 > R.resp60 ? '▼' : '='}</i> ${R.resp30 < R.resp60 ? 'mais rápido que' : R.resp30 > R.resp60 ? 'mais devagar que' : 'igual a'} os 30 dias antes (${esc(rlMinutos(R.resp60))})</span>`)],
  ];
  const sobe = R.subida.map(x => {
    const s = x.pct == null ? 'sobe' : x.pct > 0 ? 'sobe' : x.pct < 0 ? 'desce' : '';
    const seta = s === 'sobe' ? '▲' : s === 'desce' ? '▼' : '=';
    const quanto = x.pct == null ? 'novo: nenhum no mesmo período de ' + P.mesAnt : (x.pct > 0 ? '+' : x.pct < 0 ? '−' : '') + Math.abs(x.pct) + '% sobre o mesmo período de ' + P.mesAnt + ' (' + rlNum(x.antes) + ')';
    return `<li><i class="s-${x.k}" aria-hidden="true"></i><span><b>${esc(RL_NOME(x.k))}</b> · ${rlNum(x.agora)} ${x.agora === 1 ? 'lead' : 'leads'} de 1 a ${P.dia} de ${esc(P.mes)}</span><span class="rl-var ${s}"><i aria-hidden="true">${seta}</i> ${esc(quanto)}</span></li>`;
  }).join('');
  const imv = R.imoveis.map(([ref, v]) => { const im = typeof porRef === 'function' ? porRef(ref) : null; return { rot: 'Ref. ' + ref, sub: im ? tituloCurto(im) + ' · ' + precoIm(im) : '', v, img: im ? capa(im) : '' }; });
  const bal = R.balnearios.map(([b, v]) => ({ rot: b, v }));
  const eqLinhas = R.equipe.map(x => `<tr><th scope="row"><span class="rl-pessoa">${av(x.nome)}${esc(x.nome)}</span></th><td class="num">${rlNum(x.leads)}</td><td class="num">${esc(rlMinutos(rlMediana(x.tempos)))}</td><td class="num">${rlNum(x.fechados)}</td><td class="num">${x.decididos ? Math.round(x.fechados / x.decididos * 100) + '%' : '–'}</td></tr>`).join('');
  return `${topo}
    <section class="kpis rl-kpis" aria-label="O mês até hoje">${tiles.map(([t, v, s]) => `<div class="kpi rl-kpi"><span class="kpi-rot">${esc(t)}</span><b class="num">${esc(v)}</b>${s}</div>`).join('')}</section>
    ${sobe ? `<section class="bloco" aria-labelledby="rl-t-sobe"><div class="bloco-cab"><div><h2 id="rl-t-sobe">O que está subindo</h2><div class="sm rl-sub">Leads de 1 a ${P.dia} de ${esc(P.mes)}, por produto, contra o mesmo pedaço de ${esc(P.mesAnt)}</div></div></div><ul class="rl-sobe">${sobe}</ul></section>` : ''}
    <div class="rl-grade2">
      ${rlColunas('leads', 'Leads por mês', 'Tudo o que a Milla anotou: visitas, reservas, propostas e quem quer anunciar', R.meses, R.chegaram, R.prods, P)}
      ${rlColunas('fechados', 'Negócios fechados por mês', 'Leads que a equipe marcou como Fechado', R.meses, R.fechados, R.prods, P)}
    </div>
    <div class="rl-grade2">
      <section class="bloco" aria-labelledby="rl-t-imv"><div class="bloco-cab"><div><h2 id="rl-t-imv">Imóveis mais pedidos</h2><div class="sm rl-sub">Leads nos últimos 30 dias</div></div><a class="sm rl-cab-link" href="#/imoveis">Imóveis</a></div>${imv.length ? rlBarras(imv) : '<div class="vazio"><span class="sm">Nenhum lead com imóvel nos últimos 30 dias.</span></div>'}</section>
      <section class="bloco" aria-labelledby="rl-t-bal"><div class="bloco-cab"><div><h2 id="rl-t-bal">Balneários mais procurados</h2><div class="sm rl-sub">Leads nos últimos 30 dias, pelo balneário do imóvel</div></div></div>${bal.length ? rlBarras(bal) : '<div class="vazio"><span class="sm">Ainda sem balneário nos leads dos últimos 30 dias.</span></div>'}</section>
    </div>
    ${eqLinhas ? `<section class="bloco" aria-labelledby="rl-t-eq"><div class="bloco-cab"><div><h2 id="rl-t-eq">Quem atendeu</h2><div class="sm rl-sub">Últimos 90 dias: quem tocou no aviso da Milla, em quanto tempo (metade das vezes) e quantos fechou</div></div><a class="sm rl-cab-link" href="#/equipe">Equipe e acessos</a></div>
      <div class="rl-tab-rolo"><table class="rl-eq"><thead><tr><th scope="col">Pessoa</th><th scope="col">Leads</th><th scope="col">Resposta</th><th scope="col">Fechados</th><th scope="col">Taxa</th></tr></thead><tbody>${eqLinhas}</tbody></table></div></section>` : ''}
    <div class="sm rl-pe">Os números saem dos leads que a Milla anota${LD.lista.length >= 500 ? ' (os 500 mais recentes)' : ''}. ${R.semData ? 'Os fechados de antes de 16/11/2026 contam no mês em que o lead chegou. ' : ''}Para um lead contar como venda, locação ou temporada, vale o imóvel dele; sem imóvel, o que o cliente pediu.</div>`;
}

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
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - 26;
  if (y < 8) { y = Math.max(8, r.top); x = r.right + 12; if (x + w > window.innerWidth - 8) x = r.left - w - 12; }
  t.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x)) + 'px';
  t.style.top = Math.min(window.innerHeight - h - 8, y) + 'px';
  t.classList.add('on');
}
document.addEventListener('pointerover', e => { const el = e.target.closest && e.target.closest('.rl-col'); rlDica(el || null); });
document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('.rl-col'); rlDica(el || null); });
document.addEventListener('focusout', () => rlDica(null));
window.addEventListener('scroll', () => rlDica(null), { passive: true });
