/* ============================================================
   PONTOS DOS ALUNOS — regra pura (roda no app e no servidor)
   ============================================================ */
const REGRAS_PONTOS = [
  {id:'instalar', nome:'Instalar o app na tela de início', pts:50, vez:true, icon:'house'},
  {id:'notif',    nome:'Ativar os avisos do app', pts:20, vez:true, icon:'bell'},
  {id:'ficha',    nome:'Completar a ficha', pts:30, vez:true, icon:'clipboard-check'},
  {id:'aula',     nome:'Cada aula feita', pts:10, icon:'check'},
  {id:'vou',      nome:'Confirmar presença e ir', pts:5, icon:'calendar-days'},
  {id:'emdia',    nome:'Pagar até o vencimento', pts:20, icon:'wallet'},
  {id:'indicar',  nome:'Indicar alguém que se matricula', pts:100, icon:'user-plus'},
];
const PREMIOS = [
  {id:'pr1', nome:'10% em uma compra da lojinha', custo:300, icon:'store'},
  {id:'pr2', nome:'Uma aula avulsa de presente', custo:500, icon:'ticket'},
  {id:'pr3', nome:'Chá artesanal AzuLuaAr', custo:800, icon:'coffee'},
  {id:'pr4', nome:'Camiseta Anirvana', custo:1200, icon:'shirt'},
];
const NIVEIS = [['Semente',0],['Broto',150],['Folha',400],['Botão',800],['Lótus',1500]];
const PTS = Object.fromEntries(REGRAS_PONTOS.map(r => [r.id, r.pts]));

function pontosAluno(S, aid){
  const a = alunoPor(S, aid), itens = [];
  const pres = presencasDoAluno(S, aid);
  if (pres.length) itens.push({lab:`${pres.length} aulas feitas`, pts:pres.length * PTS.aula});
  const foi = new Set(pres.map(p => p.s));
  const vou = Object.entries(S.vou || {}).filter(([sid, v]) => v && foi.has(sid) && sid.includes('_')).length;
  if (vou) itens.push({lab:`${vou} presenças confirmadas antes`, pts:vou * PTS.vou});
  const emdia = S.pagamentos.filter(p => { if (p.a !== aid) return false; const m = a.mats.find(x => x.id === p.mat); return m && p.d <= `${p.mes}-${pad(Math.min(m.venc,28))}`; }).length;
  if (emdia) itens.push({lab:`${emdia} mensalidades pagas em dia`, pts:emdia * PTS.emdia});
  const acoes = {...((S.pontosAcoes || {})[aid] || {})};
  if (a.ficha && a.ficha.completa) acoes.ficha = acoes.ficha || a.desde;
  ['instalar','notif','ficha','indicar'].forEach(k => { if (acoes[k]) itens.push({lab:REGRAS_PONTOS.find(r => r.id === k).nome, pts:PTS[k], d:acoes[k]}); });
  const total = itens.reduce((s,i) => s + i.pts, 0);
  const gasto = (S.trocas || []).filter(t => t.a === aid && t.estado !== 'recusada').reduce((s,t) => s + t.custo, 0);
  let n = 0; NIVEIS.forEach(([, min], i) => { if (total >= min) n = i; });
  const prox = NIVEIS[n+1];
  return {itens, total, saldo:total - gasto, nivel:NIVEIS[n][0], prox:prox ? {nome:prox[0], falta:prox[1] - total, pct:(total - NIVEIS[n][1]) / (prox[1] - NIVEIS[n][1])} : null, acoes};
}
