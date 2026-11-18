/* =====================================================
   CUSTOS DE IA no ADM da Milla (16/11/2026)
   Pedido dele: "tem como mensurar o gasto mensal de créditos de IA por cliente? pra saber quem
   gasta mais… deixar tudo bem fácil de gerir".

   De onde vem: o cofre conta, por cliente e por mês, o que cada robô respondeu e quanto custou
   (cofre_kv 'uso-robo') e o que o assistente do app gastou ('gasto-ia'). A função
   public.estudio_custos_ia (sql/CUSTOS-estudio.sql) entrega isso só para a conta do estúdio.
   O cliente do robô é o nome da sala (a Ponta d'a Areia é 'pontadaareia' nos dois lugares).

   Fora da conta: voz (ElevenLabs), Meta (1.000 conversas grátis por número) e o Supabase.
   ===================================================== */
'use strict';

const CU = { dados: null, carregou: false, buscando: false, erro: '', semFuncao: false, mes: '' };
const CU_CAMBIO = 5.4;   /* reais por dólar, aproximado: a Anthropic cobra em dólar */
const CU_DEMO = { slug: 'millademo', nome: 'Demonstração ao vivo', demo: true };
const cuMesAtual = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const cuMeses = () => { const L = [], d = new Date(); d.setDate(1); for (let i = 0; i < 6; i++) { L.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); d.setMonth(d.getMonth() - 1); } return L; };
const cuNomeMes = m => { const [y, mo] = m.split('-').map(Number); return AS_MES_LONGO[mo - 1] + (y !== new Date().getFullYear() ? ' de ' + y : ''); };
const cuR = usd => 'R$ ' + (usd * CU_CAMBIO).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cuUS = usd => 'US$ ' + usd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function cuCarregar(forcar) {
  if (!EH_ESTUDIO() || CU.buscando || (CU.carregou && !forcar)) return;
  CU.buscando = true;
  try {
    await authEnsure();
    const r = await supaFetch('rpc/estudio_custos_ia', { method: 'POST', body: JSON.stringify({ meses: 6 }) });
    if (r.status === 404) { CU.semFuncao = true; CU.dados = null; }
    else if (r.ok) { CU.dados = await r.json(); CU.semFuncao = false; CU.erro = ''; }
    else CU.erro = 'Não consegui ler os custos agora.';
  } catch (e) { CU.erro = 'Sem conexão: não consegui ler os custos.'; }
  finally { CU.buscando = false; CU.carregou = true; }
}

/* quanto um cliente gastou num mês: robô + assistente */
function cuDoMes(slug, mes) {
  const r = (((CU.dados && CU.dados.robo) || []).find(x => x.cliente === slug && x.mes === mes) || {}).dados || {};
  const a = (((CU.dados && CU.dados.assistente) || []).find(x => x.cliente === slug && x.mes === mes) || {}).dados || {};
  const usdR = Number(r.usd) || 0, usdA = Number(a.usd) || 0, resp = Number(r.respostas_ia) || 0;
  return { usd: usdR + usdA, usdR, usdA, resp, msgs: Object.values(r.canal || {}).reduce((t, n) => t + (Number(n) || 0), 0), porResp: resp ? usdR / resp : 0 };
}
/* as imobiliárias que têm app ligado (a sala é o nome do robô) e a demonstração ao vivo */
function cuQuem() {
  const L = ADM.fichas.filter(f => f.sala && f.status !== 'encerrado').map(f => ({ slug: f.sala, nome: admNome(f), mensal: f.status === 'pausado' ? 0 : Number(f.valor) || 0 }));
  if (!L.some(x => x.slug === CU_DEMO.slug)) L.push({ ...CU_DEMO, mensal: 0 });
  return L;
}
/* projeção do mês corrente: o ritmo até hoje esticado para o mês inteiro */
function cuFracao(mes) {
  if (mes !== cuMesAtual()) return 1;
  const h = new Date(), dias = new Date(h.getFullYear(), h.getMonth() + 1, 0).getDate();
  return Math.max(1, h.getDate()) / dias;
}

function vCustos() {
  const topo = `${faixaCel()}<div class="topo"><div><span class="olho">ADM · só a sua conta vê</span><h1>Custos de IA</h1>
      <p class="sm adm-sub">Quanto cada imobiliária gasta de IA por mês, na conta da Anthropic do estúdio. Câmbio usado: R$ ${CU_CAMBIO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por dólar.</p></div></div>`;
  if (!CU.carregou || (CU.buscando && !CU.dados)) return topo + '<div class="sm vazio">Carregando os custos…</div>';
  if (CU.semFuncao) return topo + `<div class="box"><b>Falta ligar a leitura dos custos.</b><div class="sm">É uma função do banco, só de leitura, que só a sua conta usa (sql/CUSTOS-estudio.sql). Depois do seu OK, eu rodo e os números aparecem aqui.</div></div>`;
  if (CU.erro) return topo + `<div class="box"><b>${esc(CU.erro)}</b><button type="button" class="btn btn-line btn-p" data-act="cu-recarregar">Tentar de novo</button></div>`;
  const meses = cuMeses(), mes = meses.includes(CU.mes) ? CU.mes : meses[0], atual = mes === cuMesAtual(), fr = cuFracao(mes);
  const quem = cuQuem().map(q => ({ ...q, m: cuDoMes(q.slug, mes) }));
  const imob = quem.filter(q => !q.demo);
  const tot = imob.reduce((t, q) => t + q.m.usd, 0), resp = imob.reduce((t, q) => t + q.m.resp, 0), usdResp = imob.reduce((t, q) => t + q.m.usdR, 0);
  const tudo = [...((CU.dados && CU.dados.robo) || []), ...((CU.dados && CU.dados.assistente) || [])].filter(x => x.mes === mes).reduce((t, x) => t + (Number(x.dados && x.dados.usd) || 0), 0);
  const filtro = `<div class="chips" role="group" aria-label="Mês">${meses.map(m => `<button type="button" class="chip ${m === mes ? 'on' : ''}" data-act="cu-mes" data-v="${m}" aria-pressed="${m === mes}">${esc(cuNomeMes(m))}${m === cuMesAtual() ? ' (até hoje)' : ''}</button>`).join('')}</div>`;
  const kpis = [
    ['IA das imobiliárias', cuR(tot), cuUS(tot) + (atual ? ' até hoje' : ' no mês')],
    [atual ? 'Projeção do mês' : 'Por imobiliária', atual ? cuR(tot / fr) : cuR(imob.length ? tot / imob.length : 0), atual ? 'no ritmo de hoje' : 'média'],
    ['Respostas da IA', resp.toLocaleString('pt-BR'), resp ? cuR(usdResp / resp) + ' por resposta' : 'nenhuma ainda'],
    ['Toda a conta do estúdio', cuR(tudo), 'todos os clientes, não só a Milla'],
  ];
  /* quem gasta mais: barras de uma cor só, do maior para o menor, com o valor escrito */
  const ord = quem.slice().sort((a, b) => b.m.usd - a.m.usd), max = Math.max(...ord.map(q => q.m.usd), 0.0001);
  const barras = ord.map(q => {
    const pct = q.mensal ? (q.m.usd * CU_CAMBIO) / (atual ? fr : 1) / q.mensal * 100 : 0;
    const dica = `${q.nome}: ${cuR(q.m.usd)} (${cuUS(q.m.usd)}) · ${q.m.resp} respostas · ${q.m.msgs} mensagens${q.mensal ? ' · ' + Math.round(pct) + '% da mensalidade' + (atual ? ' (projeção)' : '') : ''}`;
    return `<div class="cu-barra" title="${esc(dica)}"><span class="cu-nome">${esc(q.nome)}${q.demo ? ' <small>sem mensalidade</small>' : ''}</span>
      <span class="cu-trilho"><i style="width:${Math.max(q.m.usd > 0 ? 1.5 : 0, q.m.usd / max * 100).toFixed(1)}%"></i></span>
      <span class="cu-val num"><b>${cuR(q.m.usd)}</b><small>${q.mensal ? Math.round(pct) + '% da mensalidade' : q.m.usd ? cuUS(q.m.usd) : 'sem uso'}</small></span></div>`;
  }).join('');
  const linha = q => {
    const proj = q.m.usd / fr, sobra = q.mensal - proj * CU_CAMBIO;
    return `<tr><th scope="row">${esc(q.nome)}</th><td class="num">${q.mensal ? 'R$ ' + q.mensal.toLocaleString('pt-BR') : '—'}</td><td class="num">${cuR(q.m.usd)}</td>${atual ? `<td class="num">${cuR(proj)}</td>` : ''}
      <td class="num">${q.m.resp.toLocaleString('pt-BR')}</td><td class="num">${q.m.resp ? cuR(q.m.porResp) : '—'}</td><td class="num">${q.m.msgs.toLocaleString('pt-BR')}</td>
      <td class="num">${q.m.usdA ? cuR(q.m.usdA) : '—'}</td><td class="num ${q.mensal ? (sobra >= 0 ? 'cu-pos' : 'cu-neg') : ''}">${q.mensal ? 'R$ ' + Math.round(sobra).toLocaleString('pt-BR') : '—'}</td></tr>`;
  };
  const hist = quem.map(q => `<tr><th scope="row">${esc(q.nome)}</th>${meses.slice().reverse().map(m => { const u = cuDoMes(q.slug, m).usd; return `<td class="num ${m === mes ? 'cu-sel' : ''}">${u ? cuR(u) : '—'}</td>`; }).join('')}</tr>`).join('');
  return `${topo}${filtro}
    <section class="kpis adm-kpis" aria-label="Resumo">${kpis.map(([t, v, s]) => `<div class="kpi"><span class="kpi-rot">${esc(t)}</span><b class="num">${esc(v)}</b><span class="sm">${esc(s)}</span></div>`).join('')}</section>
    <section class="bloco" aria-labelledby="cu-t1"><div class="bloco-cab"><h2 id="cu-t1">Quem gasta mais em ${esc(cuNomeMes(mes))}</h2><span class="sm">robô + assistente do app</span></div>
      <div class="cu-barras">${ord.length ? barras : '<div class="sm vazio">Nenhuma imobiliária com app ligado ainda. Ligue em Clientes › Ficha › App da imobiliária.</div>'}</div></section>
    <section class="bloco" aria-labelledby="cu-t2"><div class="bloco-cab"><h2 id="cu-t2">Cada imobiliária em ${esc(cuNomeMes(mes))}</h2><span class="sm">sobra = mensalidade − IA${atual ? ' projetada' : ''}</span></div>
      <div class="cu-tab"><table><thead><tr><th scope="col">Imobiliária</th><th scope="col">Mensalidade</th><th scope="col">IA${atual ? ' até hoje' : ''}</th>${atual ? '<th scope="col">Projeção</th>' : ''}<th scope="col">Respostas</th><th scope="col">Por resposta</th><th scope="col">Mensagens</th><th scope="col">Assistente</th><th scope="col">Sobra</th></tr></thead>
      <tbody>${quem.map(linha).join('')}</tbody></table></div></section>
    <section class="bloco" aria-labelledby="cu-t3"><div class="bloco-cab"><h2 id="cu-t3">Mês a mês</h2><span class="sm">IA de cada imobiliária</span></div>
      <div class="cu-tab"><table><thead><tr><th scope="col">Imobiliária</th>${meses.slice().reverse().map(m => `<th scope="col" class="num">${esc(AS_MES[Number(m.slice(5)) - 1])}</th>`).join('')}</tr></thead><tbody>${hist}</tbody></table></div></section>
    <p class="sm cu-nota">O robô mede só a IA. Fica fora desta conta: a voz (ElevenLabs), a Meta (as primeiras 1.000 conversas por número no mês são grátis) e o Supabase.</p>`;
}

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el || !el.dataset.act.startsWith('cu-')) return;
  if (el.dataset.act === 'cu-mes') { CU.mes = el.dataset.v; render(); return; }
  if (el.dataset.act === 'cu-recarregar') { await cuCarregar(true); render(); }
});
