/* ============================================================
   MOTOR — gera a demonstração e faz todas as contas
   (as mesmas regras da planilha, agora automáticas)
   ============================================================ */
const VERSAO = 'proto-1.1';
const CHAVE = 'anirvana_proto_v1';

/* ---------- utilidades ---------- */
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d||1); };
const addD = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const diasEntre = (a,b) => Math.round((pd(iso(b)) - pd(iso(a))) / 864e5);
const mesDe = s => s.slice(0,7);
const HOJE_ISO = iso(HOJE);
const r2 = v => Math.round(v*100)/100;
const brl = v => (v < -0.004 ? '−' : '') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const brl0 = v => (v < -0.004 ? '−' : '') + 'R$ ' + Math.abs(Math.round(v)).toLocaleString('pt-BR');
const dataBR = s => { const d = pd(s); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}`; };
const dataLonga = s => { const d = pd(s); return `${DIAS_L[d.getDay()].toLowerCase()}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`; };
const nomeMes = m => MESES[+m.slice(5,7)-1];
const mesCurto = m => MESES_C[+m.slice(5,7)-1];
const fimDoMes = m => { const d = pd(m+'-01'); return iso(new Date(d.getFullYear(), d.getMonth()+1, 0)); };
const escapeH = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ini = nome => nome.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
const corDe = nome => { let h = 0; for (const c of nome) h = (h*31 + c.charCodeAt(0)) >>> 0; const cs = ['#E5672A','#B9488E','#3E8E6E','#2F7FB8','#6A55C9','#C08A12','#1F8A9E','#A2563A','#5B8C2A','#8E5BB0']; return cs[h % cs.length]; };

const TURMA = Object.fromEntries(TURMAS.map(t => [t.id, t]));
const FORN = Object.fromEntries(FORNECEDORES.map(f => [f.id, f]));
const PROD = Object.fromEntries(PRODUTOS.map(([id,nome,preco,forn,cat,icon]) => [id, {id,nome,preco,forn,cat,icon}]));
const PESSOA = Object.fromEntries(EQUIPE.map(p => [p.id, p]));
const FERIADOS = ['2026-09-07','2026-10-12'];
const nomeTurma = t => t.nome || ATIV[t.atv].curto;

/* ============================================================
   SEMENTE — monta a demonstração (sempre igual pra todo mundo)
   ============================================================ */
function semear(){
  const R = rng(20261029);
  const S = {v:VERSAO, regras:{...REGRAS_PADRAO, planos:Object.fromEntries(Object.entries(PLANOS_YOGA).map(([k,p])=>[k,p.preco])), pct:Object.fromEntries(Object.entries(ATIV).map(([k,a])=>[k,a.repasse]))},
    alunos:[], aulas:{}, presencas:[], pagamentos:[], sessoes:[], vendas:[], repLoja:[], fiado:[], lanc:[], repEquipe:[], subs:[], vou:{}, seq:1000};

  /* alunos */
  ALUNOS_BASE.forEach(([id,nome,desde,mats,obs]) => {
    S.alunos.push({id, nome, desde, obs:obs||'', status:'ativo', tel:'(41) 9'+String(8000+Math.floor(R()*1999))+'-'+String(1000+Math.floor(R()*8999)),
      mats: mats.map(([atv,plano,turmas,venc,metodo,instr],i) => ({id:`${id}-${i}`, atv, plano: typeof plano === 'string' ? plano : null, valor: typeof plano === 'number' ? plano : null, turmas, venc, metodo, cartaoFim: metodo==='cartao' ? String(1000+Math.floor(R()*8999)) : null, instr: instr||null, status:'ativo'}))});
  });

  /* aulas e presenças de 01/ago até hoje */
  const subsHist = {'2026-10-14_qua1830':'sara', '2026-09-24_qui1900':'kamala', '2026-08-29_sab0900':'stefy'};
  const vazias = ['2026-10-08_qui0800','2026-09-03_qui0800','2026-08-22_sab1030'];
  const agoraMin = HOJE.getHours()*60 + HOJE.getMinutes();
  for (let d = pd('2026-08-01'); d <= HOJE; d = addD(d,1)){
    const di = iso(d);
    if (FERIADOS.includes(di)) continue;
    TURMAS.filter(t => t.dia === d.getDay()).forEach(t => {
      const [hh,mm] = t.h.split(':').map(Number);
      if (di === HOJE_ISO && hh*60+mm > agoraMin) return;          /* ainda não aconteceu */
      const sid = `${di}_${t.id}`;
      const pendente = di === HOJE_ISO;                              /* chamada de hoje ainda não feita */
      const instr = subsHist[sid] || t.instr;
      S.aulas[sid] = {id:sid, d:di, turma:t.id, instr, feita:!pendente, vazia:false, sub:!!subsHist[sid]};
      if (pendente) return;
      let n = 0;
      if (!vazias.includes(sid)){
        S.alunos.forEach(a => a.mats.forEach(m => {
          if (!m.turmas.includes(t.id) || di < a.desde) return;
          const ult = ULTIMA_VINDA[a.id];
          if (ult && di > ult) return;
          const recente = diasEntre(d, HOJE) <= 9 && !ult;               /* quem não está sumido veio nos últimos dias */
          const p = recente ? .97 : t.atv === 'particular' ? .95 : t.atv === 'ingles' ? .86 : m.plano === '1x' ? .86 : .78;
          if ((ult && di === ult) || R() < p){ S.presencas.push({s:sid, a:a.id, t: m.plano || 'mensal'}); n++; }
        }));
        if (t.atv === 'yoga' && R() < .2){ S.presencas.push({s:sid, a:null, nome:'Visitante', t:'avulsa'}); n++; }
      }
      if (n === 0) S.aulas[sid].vazia = true;
    });
  }

  /* mensalidades pagas (ago–out) */
  ['2026-08','2026-09','2026-10'].forEach(mes => {
    S.alunos.forEach(a => a.mats.forEach(m => {
      if (a.desde > fimDoMes(mes)) return;
      const venc = `${mes}-${pad(Math.min(m.venc,28))}`;
      if (mes === MES_ATUAL && (venc > HOJE_ISO || SEM_PAGAR_OUT.includes(a.id))) return;
      let dia = m.metodo === 'cartao' ? venc : iso(addD(pd(venc), Math.floor(R()*4) - 1));
      if (a.desde.slice(0,7) === mes && a.desde > dia) dia = a.desde;
      if (dia > HOJE_ISO) dia = HOJE_ISO;
      S.pagamentos.push({id:'pg'+(S.seq++), a:a.id, mat:m.id, mes, valor:valorMat(S,m), d:dia, metodo:m.metodo==='cartao'?'cartao':'pix'});
    }));
  });

  /* atendimentos com hora marcada (massagem e terapias) */
  const clientes = ['Rosana','Marcelo','Tereza','Jorge','Silvia','Paulo','Cristina','Luana Ferraz','Ivone','Márcia','Eduardo','Lúcia'];
  ['2026-08','2026-09','2026-10'].forEach((mes,k) => {
    const nM = [7,9,6][k], nT = [2,1,2][k];
    for (let i=0;i<nM;i++) S.sessoes.push({id:'se'+(S.seq++), atv:'massagem', instr:'aurelice', d:`${mes}-${pad(2+Math.floor(i*26/nM))}`, cliente:clientes[Math.floor(R()*clientes.length)], valor:250});
    for (let i=0;i<nT;i++) S.sessoes.push({id:'se'+(S.seq++), atv:'terapias', instr:'kamala', d:`${mes}-${pad(6+i*11)}`, cliente:clientes[Math.floor(R()*clientes.length)], valor:i%2?260:220});
  });
  S.sessoes = S.sessoes.filter(s => s.d <= HOJE_ISO);

  /* vendas reais da planilha (mar–jul) */
  const porMes = {};
  VENDAS_PLANILHA.forEach(v => (porMes[v[0]] = porMes[v[0]] || []).push(v));
  Object.entries(porMes).forEach(([mm, lista]) => {
    let normais = lista.filter(v => !v[5]), k = 0;
    lista.forEach(([m,desc,valor,forma,forn,evento]) => {
      const dia = evento ? 20 : 1 + Math.floor((k++) * 28 / normais.length);
      S.vendas.push({id:'v'+(S.seq++), d:`2026-${mm}-${pad(dia)}`, desc, valor, forma, forn, evento:evento||'', fonte:'planilha'});
    });
  });
  /* vendas de exemplo (ago–out) */
  const formas = ['pix','pix','pix','debito','credito','dinheiro','credito2x'];
  ['2026-08','2026-09','2026-10'].forEach((mes,k) => {
    const n = [13,11,14][k];
    for (let i=0;i<n;i++){
      const p = PRODUTOS[Math.floor(R()*PRODUTOS.length)];
      const q = R() < .2 ? 2 : 1;
      const dia = 1 + Math.floor(i * (k===2 ? 28 : 29) / n);
      S.vendas.push({id:'v'+(S.seq++), d:`${mes}-${pad(dia)}`, desc:`${q} ${p[1].toLowerCase()}`, valor:r2(p[2]*q), forma:formas[Math.floor(R()*formas.length)], forn:p[3], evento:'', fonte:'exemplo', itens:[{p:p[0], q}]});
    }
  });
  S.vendas = S.vendas.filter(v => v.d <= HOJE_ISO);

  /* repasses já feitos aos fornecedores: até julho tudo pago; agosto pago em 05/09; setembro só parte */
  const devido = (forn, ate) => S.vendas.filter(v => v.forn === forn && v.d <= ate).reduce((s,v) => s + partesVenda(v).forn, 0);
  FORNECEDORES.filter(f => f.pct > 0).forEach(f => {
    const ateJul = devido(f.id,'2026-07-31'), ateAgo = devido(f.id,'2026-08-31') - ateJul;
    if (ateJul > 0) S.repLoja.push({id:'rl'+(S.seq++), forn:f.id, valor:r2(ateJul), d:'2026-08-05'});
    if (ateAgo > 0) S.repLoja.push({id:'rl'+(S.seq++), forn:f.id, valor:r2(ateAgo), d:'2026-09-05'});
    if (['stefy','dada','valefadas'].includes(f.id)){
      const ateSet = devido(f.id,'2026-09-30') - ateJul - ateAgo;
      if (ateSet > 0) S.repLoja.push({id:'rl'+(S.seq++), forn:f.id, valor:r2(ateSet), d:'2026-10-05'});
    }
  });

  /* fiado: soma R$ 312,70, o mesmo "A RECEBER!" da planilha */
  S.fiado = [
    {id:'fi1', cliente:'Bianca Rocha',   desc:'Vestido — 2ª parcela', valor:62.40, d:'2026-09-12', pago:false},
    {id:'fi2', cliente:'Débora Martins', desc:'Bolsa indiana — 2ª parcela', valor:69.50, d:'2026-10-03', pago:false},
    {id:'fi3', cliente:'Juliana Alves',  desc:'Óleo essencial alecrim', valor:48.90, d:'2026-10-10', pago:false},
    {id:'fi4', cliente:'Kamala',         desc:'OE lavandin + cedro + verbena (descontar no repasse)', valor:131.90, d:'2026-10-21', pago:false},
  ];

  /* controle financeiro: lançamentos manuais jan–out (valores de exemplo) */
  const airbnb = [3200,2600,900,1100,700,900,2100,800,1300,1500];
  for (let mi = 1; mi <= 10; mi++){
    const mes = `2026-${pad(mi)}`;
    const L = (tipo, dia, valor, desc, cat, extra={}) => { const d = `${mes}-${pad(Math.min(dia,28))}`; if (d <= HOJE_ISO) S.lanc.push({id:'l'+(S.seq++), tipo, d, valor:r2(valor), desc, cat, ...extra}); };
    CONTAS_FIXAS.forEach(c => {
      if (mi === 10 && ['cf-son','cf-tx','cf-mei','cf-can'].includes(c.id)) return;      /* pendentes em outubro */
      const v = c.varia ? 250 + Math.round(R()*90) + .4 : c.valor;
      L('saida', c.dia, v, c.nome, c.cat, {conta:c.id});
    });
    if (mi % 2 === 1) L('saida', 18, 88 + Math.round(R()*20), 'Água', 'Despesa Fixa');
    for (let i=0;i<2+Math.floor(R()*3);i++) L('saida', 3+i*7, 40+Math.round(R()*180), ['Café da manhã hóspedes','Roupa de cama','Lavanderia','Amenities'][i%4], 'Airbnb');
    L('saida', 9+Math.floor(R()*15), 30+Math.round(R()*150), ['Lâmpadas','Papelaria','Conserto torneira','Tinta parede'][mi%4], 'Manutenção');
    L('saida', 6+Math.floor(R()*15), 60+Math.round(R()*140), 'Insumos cantina', 'Cantina');
    if (R() < .45) L('saida', 14, 120+Math.round(R()*480), ['Ventilador','Almofadas de meditação','Tapetes de yoga','Chaleira elétrica'][mi%4], 'Utensílios/eletro/melhorias');
    if (mi === 6) L('saida', 18, 1840, 'Festival — estrutura e materiais', 'Eventos');
    if ([4,8,10].includes(mi)) L('saida', 22, 140, 'Yoga & café — insumos', 'Eventos');
    /* entradas manuais */
    const nb = 1 + Math.floor(R()*3); for (let i=0;i<nb;i++) L('entrada', 2+i*9, airbnb[mi-1]/nb, 'Hospedagem Airbnb', 'Airbnb');
    L('entrada', 10, 300+Math.round(R()*6)*50, 'Coworking — mensalistas', 'Coworking');
    L('entrada', 25, 120+Math.round(R()*230), 'Cantina', 'Cantina');
    if (mi === 6) L('entrada', 20, 4200, 'Festival — ingressos', 'Eventos');
    if ([4,8,10].includes(mi)) L('entrada', 22, 380, 'Yoga & café', 'Eventos');
    if (mi === 7) L('entrada', 4, 400, '50% aluguel do espaço 04/07', 'Extra');
  }

  /* repasses da equipe já pagos (meses fechados) */
  ['2026-08','2026-09'].forEach(mes => EQUIPE.forEach(p => S.repEquipe.push({id:'re'+(S.seq++), p:p.id, mes, d:`${mes.slice(0,5)}${pad(+mes.slice(5)+1)}-05`})));

  /* formação de instrutores: presença por dia de módulo, estágio e monografia */
  S.formandos = FORMACAO.formandos.map(([nome, aluno, dias, estagio, mono], i) => ({id:'fo'+i, nome, aluno, dias, estagio, mono}));

  /* pedido de substituição aberto (Sara pede; Kamala e Ana Julia veem) */
  S.subs.push({id:'sb1', turma:'ter1900', d:'2026-11-03', de:'sara', para:null, motivo:'Consulta médica no fim da tarde', status:'aberto', criado:'2026-10-27'});
  return S;
}

/* ---------- valores e partes ---------- */
function valorMat(S, m){ return m.plano ? S.regras.planos[m.plano] : m.valor; }
function partesVenda(v){
  const f = FORN[v.forn] || {pct:0};
  const forn = r2(v.valor * f.pct);
  return {forn, ea: r2(v.valor - forn)};
}
function taxasYoga(planos, pct = .7){
  const t = {};
  Object.entries(PLANOS_YOGA).forEach(([k,p]) => { t[k] = p.sem ? pct * planos[k] / (p.sem*4) : pct * planos[k]; });
  return t;
}

/* ---------- consultas ---------- */
const alunoPor = (S,id) => S.alunos.find(a => a.id === id);
function presencasDoAluno(S, aid){ return S.presencas.filter(p => p.a === aid).map(p => ({...p, aula:S.aulas[p.s]})).filter(p => p.aula).sort((a,b) => a.aula.d < b.aula.d ? 1 : -1); }
function ultimaVinda(S, aid){ const p = presencasDoAluno(S, aid)[0]; return p ? p.aula.d : null; }
function freqStatus(S, a){
  const turma = a.mats.some(m => m.turmas.some(t => ATIV[TURMA[t].atv].turma));
  if (!turma) return {st:'ok', dias:null, txt:'Hora marcada'};
  const u = ultimaVinda(S, a.id);
  if (!u) return {st:'bad', dias:null, txt:'Ainda não veio'};
  const dias = diasEntre(pd(u), HOJE);
  if (dias > 10.5) return {st:'bad', dias, txt:`Faltando há ${dias} dias`};
  if (dias > 7)    return {st:'warn', dias, txt:`Sem vir há ${dias} dias`};
  return {st:'ok', dias, txt: dias === 0 ? 'Veio hoje' : dias === 1 ? 'Veio ontem' : `Veio há ${dias} dias`};
}
function statusPagamento(S, a, m, mes = MES_ATUAL){
  const pg = S.pagamentos.find(p => p.mat === m.id && p.mes === mes);
  const venc = `${mes}-${pad(Math.min(m.venc,28))}`;
  if (pg) return {st:'pago', pg, venc, txt:`Pago em ${dataBR(pg.d)}`};
  if (m.status === 'cancelado') return {st:'cancelado', venc, txt:`Cancelado em ${dataBR(m.fim || HOJE_ISO)}`};
  if (m.status === 'pausado') return {st:'pausado', venc, txt:'Plano pausado'};
  if (a && a.desde > venc){ const d0 = pd(venc); const prox = iso(new Date(d0.getFullYear(), d0.getMonth()+1, Math.min(m.venc,28))); return {st:'avencer', venc:prox, dias:diasEntre(HOJE, pd(prox)), txt:`Primeira cobrança ${dataBR(prox)}`}; }
  const d = diasEntre(pd(venc), HOJE);
  if (d > 0) return {st:'atrasado', venc, dias:d, txt:`Venceu ${dataBR(venc)} · ${d} ${d===1?'dia':'dias'}`};
  return {st:'avencer', venc, dias:-d, txt: d === 0 ? 'Vence hoje' : `Vence ${dataBR(venc)}`};
}
function proximaCobranca(S, m){
  const st = statusPagamento(S, S.alunos.find(a => a.mats.includes(m)), m);
  if (st.st !== 'pago') return st.venc;
  /* o primeiro mês ainda sem pagamento (quem adiantou não paga duas vezes o mesmo mês) */
  let d = pd(st.venc);
  for (let i = 0; i < 24; i++){ d = new Date(d.getFullYear(), d.getMonth()+1, Math.min(m.venc,28)); const mes = `${d.getFullYear()}-${pad(d.getMonth()+1)}`; if (!S.pagamentos.some(p => p.mat === m.id && p.mes === mes)) break; }
  return iso(d);
}
function alunosVisiveis(S, instrId){
  const p = PESSOA[instrId];
  return S.alunos.filter(a => a.mats.some(m => (m.instr ? m.instr === instrId : p.atvs.includes(m.atv) && ATIV[m.atv].vis === 'todos')));
}
function turmasDoInstr(instrId){ return TURMAS.filter(t => t.instr === instrId); }
function matriculadosNaTurma(S, tid){ return S.alunos.filter(a => a.mats.some(m => m.turmas.includes(tid) && m.status === 'ativo')); }

/* ---------- receitas por atividade no mês ---------- */
function receitaMes(S, mes){
  const pct = S.regras.pct, linhas = [];
  const add = (atv, bruto, fonte, instrs) => { if (bruto > 0 || fonte === 'planilha') linhas.push({atv, bruto:r2(bruto), pct:pct[atv] ?? .7, instr:r2(bruto*(pct[atv] ?? .7)), ea:r2(bruto*(1-(pct[atv] ?? .7))), fonte, instrs}); };
  const F = FECH_PLANILHA[mes];
  if (F){
    const P = ATIV; /* na planilha os % eram fixos: 70/30 e inglês 65/35 */
    const lin = (atv, bruto) => linhas.push({atv, bruto, pct:P[atv].repasse, instr:r2(bruto*P[atv].repasse), ea:r2(bruto*(1-P[atv].repasse)), fonte:'planilha'});
    lin('yoga', F.yogaBruto);
    lin('particular', (F.extras.kamala.particular||0) + (F.extras.anajulia.particular||0));
    lin('gestantes', F.extras.kamala.gestantes||0);
    lin('meditacao', F.extras.kamala.meditacao||0);
    Object.entries(F.outras).forEach(([k,v]) => lin(k, v));
  } else if (MENSAL_EXEMPLO[mes]){
    Object.entries(MENSAL_EXEMPLO[mes]).forEach(([k,v]) => add(k, v, 'exemplo'));
  } else {
    const soma = {};
    S.pagamentos.filter(p => p.mes === mes).forEach(p => { const a = alunoPor(S,p.a); const m = a && a.mats.find(x => x.id === p.mat); if (m) soma[m.atv] = (soma[m.atv]||0) + p.valor; });
    S.sessoes.filter(s => mesDe(s.d) === mes).forEach(s => soma[s.atv] = (soma[s.atv]||0) + s.valor);
    Object.keys(ATIV).forEach(k => soma[k] && add(k, soma[k], 'app'));
  }
  const tot = linhas.reduce((t,l) => ({bruto:t.bruto+l.bruto, ea:t.ea+l.ea, instr:t.instr+l.instr}), {bruto:0, ea:0, instr:0});
  return {linhas, ...tot, fonte: F ? 'planilha' : MENSAL_EXEMPLO[mes] ? 'exemplo' : 'app'};
}
function lojaMes(S, mes){
  const vs = S.vendas.filter(v => mesDe(v.d) === mes);
  const r = vs.reduce((t,v) => { const p = partesVenda(v); return {bruto:t.bruto+v.valor, forn:t.forn+p.forn, ea:t.ea+p.ea}; }, {bruto:0, forn:0, ea:0});
  return {...r, n:vs.length, vendas:vs};
}
function balancoMes(S, mes){
  const rec = receitaMes(S, mes), loja = lojaMes(S, mes);
  const lan = S.lanc.filter(l => mesDe(l.d) === mes);
  const manualIn = lan.filter(l => l.tipo === 'entrada'), saidas = lan.filter(l => l.tipo === 'saida');
  const eIn = manualIn.reduce((s,l) => s + l.valor, 0), eOut = saidas.reduce((s,l) => s + l.valor, 0);
  const entradas = rec.ea + loja.ea + eIn;
  return {mes, rec, loja, manualIn, saidas, entradas:r2(entradas), saidasTot:r2(eOut), saldo:r2(entradas - eOut), repassar:r2(rec.instr + loja.forn)};
}

/* ---------- FECHAMENTO DA YOGA (a regra da aba "ALUNOS / INSTRUTORAS") ----------
   1) cada presença vale 70% do plano ÷ aulas do mês; aula vazia vale R$ 10
   2) o "excedente" = 70% das mensalidades − soma do passo 1
   3) o excedente é dividido igualmente por aula dada e somado a cada instrutora
   4) somam-se 70% das particulares, gestantes e meditação */
function fechamentoYoga(S, mes){
  const F = FECH_PLANILHA[mes];
  let bruto, aulaVazia, instrs = {}, extras = {}, fonte, taxas;
  const P = F ? Object.fromEntries(Object.entries(ATIV).map(([k,a]) => [k, a.repasse])) : S.regras.pct;   /* % da equipe */
  if (F){
    fonte = 'planilha'; bruto = F.yogaBruto; aulaVazia = F.aulaVazia;
    taxas = taxasYoga(Object.fromEntries(Object.entries(PLANOS_YOGA).map(([k,p]) => [k,p.preco])));
    Object.entries(F.instr).forEach(([id,v]) => instrs[id] = {aulas:v.aulas, c:{...v.c}});
    Object.entries(F.extras).forEach(([id,v]) => extras[id] = {...v});
  } else {
    fonte = 'app'; aulaVazia = S.regras.aulaVazia; taxas = taxasYoga(S.regras.planos, P.yoga);
    bruto = 0;
    S.pagamentos.filter(p => p.mes === mes).forEach(p => { const a = alunoPor(S,p.a); const m = a && a.mats.find(x => x.id === p.mat); if (m && m.atv === 'yoga') bruto += p.valor; });
    Object.values(S.aulas).filter(au => mesDe(au.d) === mes && au.feita && TURMA[au.turma].atv === 'yoga').forEach(au => {
      const I = instrs[au.instr] = instrs[au.instr] || {aulas:0, c:{vazia:0,'4x':0,'3x':0,'2x':0,'1x':0,avulsa:0}};
      I.aulas++;
      if (au.vazia){ I.c.vazia++; return; }
      S.presencas.filter(p => p.s === au.id).forEach(p => { if (I.c[p.t] !== undefined) I.c[p.t]++; });
    });
    S.pagamentos.filter(p => p.mes === mes).forEach(p => {
      const a = alunoPor(S,p.a); const m = a && a.mats.find(x => x.id === p.mat); if (!m) return;
      if (!['particular','gestantes','meditacao'].includes(m.atv)) return;
      const who = responsavelMat(m); if (!who) return;            /* sem instrutor definido: fica fora até a administração escolher */
      (extras[who] = extras[who] || {})[m.atv] = (extras[who][m.atv] || 0) + p.valor;
    });
  }
  const pool = r2(bruto * P.yoga);
  const linhas = Object.entries(instrs).map(([id,I]) => {
    const aReceber = I.c.vazia*aulaVazia + ['4x','3x','2x','1x','avulsa'].reduce((s,k) => s + I.c[k]*taxas[k], 0);
    return {id, nome:PESSOA[id].nome, aulas:I.aulas, c:I.c, aReceber};
  });
  const somaAR = linhas.reduce((s,l) => s + l.aReceber, 0);
  const totalAulas = linhas.reduce((s,l) => s + l.aulas, 0);
  const excedente = pool - somaAR;
  const porAula = totalAulas ? excedente / totalAulas : 0;
  linhas.forEach(l => {
    l.ajuste = porAula * l.aulas;
    l.yoga = l.aReceber + l.ajuste;
    l.piso = l.aulas * aulaVazia;
    l.yogaFinal = S.regras.piso ? Math.max(l.yoga, l.piso) : l.yoga;
    const ex = extras[l.id] || {};
    l.extras = {particular:(ex.particular||0)*P.particular, gestantes:(ex.gestantes||0)*P.gestantes, meditacao:(ex.meditacao||0)*P.meditacao};
    l.total = l.yogaFinal + l.extras.particular + l.extras.gestantes + l.extras.meditacao;
    if (F && F.conferido) l.conferido = F.conferido[l.id];
  });
  Object.entries(extras).forEach(([id,ex]) => { if (PESSOA[id] && !linhas.find(l => l.id === id)){ const e = {particular:(ex.particular||0)*P.particular, gestantes:(ex.gestantes||0)*P.gestantes, meditacao:(ex.meditacao||0)*P.meditacao}; linhas.push({id, nome:PESSOA[id].nome, aulas:0, c:{vazia:0,'4x':0,'3x':0,'2x':0,'1x':0,avulsa:0}, aReceber:0, ajuste:0, yoga:0, yogaFinal:0, piso:0, extras:e, total:e.particular+e.gestantes+e.meditacao}); }});
  linhas.sort((a,b) => b.total - a.total);
  return {mes, fonte, bruto, pool, pctYoga:P.yoga, aulaVazia, obsVazia: F && F.obsVazia, taxas, linhas, somaAR, totalAulas, excedente, porAula};
}
/* quem dá a aula desta matrícula: o escolhido, o da turma ou o único da atividade */
function responsavelMat(m){
  if (m.instr) return m.instr;
  const t = (m.turmas || []).map(id => TURMA[id]).find(Boolean);
  if (t) return t.instr;
  const quem = EQUIPE.filter(p => p.atvs.includes(m.atv));
  return quem.length === 1 ? quem[0].id : null;
}

/* ---------- repasses da equipe no mês (yoga + demais atividades) ---------- */
function repassesEquipe(S, mes){
  const fy = fechamentoYoga(S, mes), rec = receitaMes(S, mes);
  const out = {};
  const add = (id, lab, v) => { if (Math.abs(v) < .005 || !PESSOA[id]) return; (out[id] = out[id] || {id, nome:PESSOA[id].nome, itens:[], total:0}).itens.push({lab, v}); out[id].total += v; };
  fy.linhas.forEach(l => { add(l.id, 'Yoga (turmas)', l.yogaFinal); add(l.id, 'Particular', l.extras.particular); add(l.id, 'Gestantes', l.extras.gestantes); add(l.id, 'Meditação', l.extras.meditacao); });
  const dono = {aquarela:'bruno', musicalizacao:'brunos', violao:'brunos', ingles:'marina', massagem:'aurelice', terapias:'kamala'};
  rec.linhas.filter(l => dono[l.atv]).forEach(l => add(dono[l.atv], ATIV[l.atv].curto, l.instr));
  (S.descontos || []).filter(d => d.mes === mes && out[d.p]).forEach(d => add(d.p, `Lojinha: ${d.desc}`, -d.valor));
  return Object.values(out).map(o => ({...o, pago: S.repEquipe.find(r => r.p === o.id && r.mes === mes)})).sort((a,b) => b.total - a.total);
}

/* ---------- lojinha: quanto devo a cada fornecedor ---------- */
function saldoFornecedores(S){
  return FORNECEDORES.filter(f => f.pct > 0).map(f => {
    const devido = S.vendas.filter(v => v.forn === f.id).reduce((s,v) => s + partesVenda(v).forn, 0);
    const pago = S.repLoja.filter(r => r.forn === f.id).reduce((s,r) => s + r.valor, 0);
    const vendasAbertas = S.vendas.filter(v => v.forn === f.id && v.d > (S.repLoja.filter(r => r.forn === f.id).map(r => r.d).sort().pop() || '0')).length;
    return {...f, devido:r2(devido), pago:r2(pago), saldo:r2(devido - pago), vendasAbertas};
  }).sort((a,b) => b.saldo - a.saldo);
}

/* ---------- alertas do painel ---------- */
function alertasAdmin(S){
  const A = [];
  const atrasados = [], semPagar = [];
  S.alunos.forEach(a => a.mats.forEach(m => {
    const st = statusPagamento(S, a, m);
    if (st.st === 'atrasado'){
      atrasados.push({a, m, st});
      const veio = presencasDoAluno(S, a.id).some(p => mesDe(p.aula.d) === MES_ATUAL);
      if (veio) semPagar.push(a);
    }
  }));
  if (atrasados.length) A.push({cls:'bad', icon:'circle-alert', t:`${atrasados.length} mensalidades atrasadas`, s:`${brl(atrasados.reduce((s,x) => s + valorMat(S,x.m), 0))} em aberto · ${atrasados.slice(0,3).map(x => x.a.nome.split(' ')[0]).join(', ')}${atrasados.length>3?'…':''}`, go:'admin-mensalidades'});
  if (semPagar.length) A.push({cls:'warn', icon:'user-round-check', t:`${semPagar.length} vieram às aulas sem mensalidade paga`, s:`O app cruzou a chamada com os pagamentos: ${[...new Set(semPagar.map(a => a.nome.split(' ')[0]))].join(', ')}`, go:'admin-mensalidades'});
  const sumidos = S.alunos.map(a => ({a, f:freqStatus(S,a)})).filter(x => x.f.st !== 'ok');
  if (sumidos.length) A.push({cls:'warn', icon:'clock', t:`${sumidos.length} alunos sumindo`, s:sumidos.map(x => `${x.a.nome.split(' ')[0]} (${x.f.dias ?? '—'}d)`).join(' · '), go:'admin-alunos'});
  const forn = saldoFornecedores(S).filter(f => f.saldo > .01);
  if (forn.length) A.push({cls:'pri', icon:'store', t:`${brl(forn.reduce((s,f) => s+f.saldo,0))} a pagar a ${forn.length} fornecedores`, s:forn.slice(0,4).map(f => f.curto).join(', ') + (forn.length>4?'…':''), go:'admin-lojinha', sub:'fornecedores'});
  const fiado = S.fiado.filter(f => !f.pago);
  if (fiado.length) A.push({cls:'pri', icon:'receipt', t:`${brl(fiado.reduce((s,f) => s+f.valor,0))} a receber da lojinha`, s:`${fiado.length} compras fiadas ou parceladas`, go:'admin-lojinha', sub:'receber'});
  const subs = S.subs.filter(s => s.status === 'aberto');
  if (subs.length) A.push({cls:'warn', icon:'repeat', t:`${subs.length} pedido de substituição sem resposta`, s:subs.map(s => `${PESSOA[s.de].nome} · ${nomeTurma(TURMA[s.turma])} ${DIAS[pd(s.d).getDay()]} ${dataBR(s.d)}`).join(' · '), go:'admin-mais'});
  const pend = Object.values(S.aulas).filter(a => !a.feita);
  if (pend.length) A.push({cls:'pri', icon:'list-checks', t:`${pend.length} chamadas de hoje por fazer`, s:pend.map(a => `${nomeTurma(TURMA[a.turma])} ${TURMA[a.turma].h} · ${PESSOA[a.instr].nome}`).join(' · '), go:'admin-mais'});
  return A;
}
/* ---------- formação ---------- */
function formacaoStatus(){
  const feitos = FORMACAO.datas.filter(d => d <= HOJE_ISO).length, diasDados = feitos * 2;
  const prox = FORMACAO.datas.find(d => d > HOJE_ISO);
  return {feitos, diasDados, prox};
}
function formandoSituacao(f, st){
  const pct = st.diasDados ? f.dias / st.diasDados : 1;
  const faltasPermitidas = Math.floor(FORMACAO.modulos * 2 * .2), faltas = st.diasDados - f.dias;
  const sobra = faltasPermitidas - faltas;
  const estado = sobra < 0 ? 'bad' : sobra <= 2 ? 'warn' : 'ok';
  return {pct, faltas, sobra, st:estado, ok: sobra >= 0, txt: sobra < 0 ? 'passou do limite de faltas: precisa repor' : sobra === 0 ? 'não pode mais faltar' : `pode faltar mais ${sobra} ${sobra===1?'dia':'dias'} no curso`};
}
function contasDoMes(S, mes){
  return CONTAS_FIXAS.map(c => ({...c, pago: S.lanc.find(l => l.conta === c.id && mesDe(l.d) === mes)}));
}
