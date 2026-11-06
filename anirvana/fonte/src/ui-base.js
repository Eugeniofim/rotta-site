/* ============================================================
   BASE DA INTERFACE — estado, casca, folhas, avisos, sol de arcos
   ============================================================ */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const ic = (n, cls='') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS['circle-alert']}</svg>`;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

function carregar(){
  try{ const t = localStorage.getItem(CHAVE); if (t){ const s = JSON.parse(t); if (s && s.v === VERSAO) return s; } }catch(e){}
  return semear();
}
function salvar(){ try{ localStorage.setItem(CHAVE, JSON.stringify(S)); }catch(e){} }
/* cópia do que veio de fábrica, para "Recomeçar a demonstração" */
const BASE = {equipe:EQUIPE.map(p => ({...p})), forn:FORNECEDORES.map(f => ({...f})), turmas:TURMAS.map(t => t.instr), turmasLista:TURMAS.map(t => ({...t})), ativ:JSON.parse(JSON.stringify(ATIV)), forms:Object.fromEntries(Object.entries(FORMULARIOS).map(([k, F]) => [k, F.atvs.slice()]))};
function restaurarBases(){ Object.keys(ATIV).forEach(k => delete ATIV[k]); Object.assign(ATIV, JSON.parse(JSON.stringify(BASE.ativ))); TURMAS.splice(0, TURMAS.length, ...BASE.turmasLista.map(t => ({...t}))); Object.keys(TURMA).forEach(k => delete TURMA[k]); TURMAS.forEach(t => { TURMA[t.id] = t; }); Object.entries(BASE.forms).forEach(([k, a]) => { FORMULARIOS[k].atvs = a.slice(); }); EQUIPE.splice(0, EQUIPE.length, ...BASE.equipe.map(p => ({...p}))); FORNECEDORES.splice(0, FORNECEDORES.length, ...BASE.forn.map(f => ({...f}))); TURMAS.forEach((t, i) => { t.instr = BASE.turmas[i]; }); }
let S = carregar();
/* fornecedores moram no estado (a Dessa cadastra e edita); as regras leem FORNECEDORES e FORN */
function ligarFornecedores(){
  if (!S.fornecedores) S.fornecedores = BASE.forn.map(f => ({...f, ativo:true}));
  FORNECEDORES.splice(0, FORNECEDORES.length, ...S.fornecedores);
  Object.keys(FORN).forEach(k => delete FORN[k]); S.fornecedores.forEach(f => { FORN[f.id] = f; });
}
ligarFornecedores();
/* equipe também mora no estado: a administração cadastra e exclui. EQUIPE = quem está na equipe; PESSOA = todos (o histórico continua com nome) */
function ligarEquipe(){
  if (!S.equipe) S.equipe = BASE.equipe.map(p => ({...p, ativo:true}));
  EQUIPE.splice(0, EQUIPE.length, ...S.equipe.filter(p => p.ativo !== false));
  Object.keys(PESSOA).forEach(k => delete PESSOA[k]); S.equipe.forEach(p => { PESSOA[p.id] = p; });
  const fab = Object.fromEntries(BASE.turmasLista.map(t => [t.id, t.instr]));
  Object.values(TURMA).forEach(t => { t.instr = (S.turmaInstr || {})[t.id] || fab[t.id] || t.instr; });
}
/* atividades e horários: as de fábrica + as que a administração cadastra (e as que tira) */
function ligarAtividades(){
  S.atividades = S.atividades || {}; S.turmasNovas = S.turmasNovas || []; S.turmasFora = S.turmasFora || [];
  Object.keys(ATIV).forEach(k => delete ATIV[k]); Object.assign(ATIV, JSON.parse(JSON.stringify(BASE.ativ)));
  Object.entries(S.atividades).forEach(([k, a]) => { if (a === null) delete ATIV[k]; else ATIV[k] = {...(ATIV[k] || {}), ...a}; });
  Object.entries(BASE.forms).forEach(([k, a]) => { FORMULARIOS[k].atvs = a.filter(x => ATIV[x]); });
  Object.entries(ATIV).forEach(([k, a]) => { if (a.form && !FORMULARIOS[a.form].atvs.includes(k)){ Object.values(FORMULARIOS).forEach(F => { F.atvs = F.atvs.filter(x => x !== k); }); FORMULARIOS[a.form].atvs.push(k); } if (S.regras.pct[k] === undefined) S.regras.pct[k] = a.repasse ?? .7; });
  const todas = [...BASE.turmasLista.map(t => ({...t})), ...S.turmasNovas.map(t => ({...t}))];
  Object.keys(TURMA).forEach(k => delete TURMA[k]); todas.forEach(t => { TURMA[t.id] = t; });
  TURMAS.splice(0, TURMAS.length, ...todas.filter(t => !S.turmasFora.includes(t.id) && ATIV[t.atv]));
}
ligarAtividades();
ligarEquipe();

const UI = {
  role:null, who:{admin:'dessa', instrutor:'kamala', aluno:'a01'},
  tab:{admin:'inicio', instrutor:'hoje', aluno:'inicio'},
  balVis:'mes', balMes:MES_ATUAL, mensVis:'alunos', mensSt:'todos', mensAtv:'todas', fechMes:MES_ATUAL,
  lojaVis:'vender', lojaForn:null, lojaCat:null, vendasMes:MES_ATUAL, cart:{},
  escolaVis:'alunos', busca:'', escAtv:'todas', instrFiltro:'todos', meuMes:MES_ATUAL, alunoAtv:'pratica',
};

const NAV = {
  admin:[['inicio','Início','house'],['balanco','Balanço','chart-column'],['mensalidades','Mensalidades','wallet'],['lojinha','Lojinha','store'],['escola','Escola','users'],['atividades','Atividades','graduation-cap'],['divulgar','Divulgar','megaphone']],
  instrutor:[['hoje','Hoje','sun'],['agenda','Agenda','calendar-days'],['alunos','Alunos','users'],['mes','Meu mês','wallet']],
  aluno:[['inicio','Início','house'],['aulas','Aulas','calendar-days'],['plano','Plano','credit-card'],['historico','Histórico','chart-column']],
};
const CURTO = {mensalidades:'Mensal.', atividades:'Cursos'};   /* rótulo da barra de baixo, que tem pouco espaço */
const ROLE_NOME = {admin:'Administração', instrutor:'Instrutores', aluno:'Alunos'};
function quemNome(){
  if (UI.role === 'admin') return ADMINS.find(a => a.id === UI.who.admin).nome;
  if (UI.role === 'instrutor') return PESSOA[UI.who.instrutor].nome;
  return alunoPor(S, UI.who.aluno).nome;
}
function saudacao(){ return 'Namaskar'; }   /* a saudação do site: "Saúdo o Deus que há em você" */
const av = (nome, cls='') => `<span class="av ${cls}" style="--c:${corDe(nome)}">${escapeH(ini(nome))}</span>`;

/* pedidos de troca que esta pessoa pode aceitar */
function pedidosPara(pid){
  const p = PESSOA[pid];
  return S.subs.filter(s => s.status === 'aberto' && s.de !== pid && p.atvs.includes(TURMA[s.turma].atv)
    && (!s.pedidoPara || s.pedidoPara === pid) && !(s.recusas || []).includes(pid));
}
/* matrículas que o instrutor pode ver: turma da atividade dele, ou particular que o escolheu */
function matsVisiveis(a, pid){
  const p = PESSOA[pid];
  return a.mats.filter(m => m.instr ? m.instr === pid : p.atvs.includes(m.atv) && ATIV[m.atv].vis === 'todos');
}

/* ---------- casca ---------- */
function casca(conteudo){
  const nav = NAV[UI.role], cur = UI.tab[UI.role];
  const badge = id => {
    if (UI.role === 'admin' && id === 'inicio'){ const n = alertasAdmin(S).length; return n ? n : ''; }
    if (UI.role === 'instrutor' && id === 'hoje'){ const n = Object.values(S.aulas).filter(a => !a.feita && a.instr === UI.who.instrutor).length + pedidosPara(UI.who.instrutor).length; return n || ''; }
    return '';
  };
  const marca = `<img src="${LOGO_MARK}" alt=""><div><b>Espaço Anirvana</b><small>${ROLE_NOME[UI.role]}</small></div>`;
  const nAvisos = caixaDe().length;
  return `<div class="app ${UI.role === 'admin' ? 'eh-admin' : ''}">
    <aside class="rail" aria-label="Menu">
      <button class="brand" data-act="logo" aria-label="Voltar para a tela inicial">${marca}</button>
      ${nav.map(([id,lab,ico]) => `<button class="navi ${cur===id?'on':''}" data-act="tab" data-v="${id}">${ic(ico)}<span>${lab}</span>${badge(id)?`<span class="cnt">${badge(id)}</span>`:''}</button>`).join('')}
      <div class="sec">Ver como</div>
      ${['admin','instrutor','aluno'].map(r => `<button class="navi ${UI.role===r?'on':''}" data-act="role" data-v="${r}">${ic({admin:'layout-dashboard',instrutor:'hand-heart',aluno:'sprout'}[r])}<span>${ROLE_NOME[r]}</span></button>`).join('')}
      <div class="foot">${ESPACO.endereco}<br>${ESPACO.cidade}<br><br>Protótipo · ${VERSAO}<br>Hoje é ${dataLonga(HOJE_ISO)}</div>
    </aside>
    <main class="main">
      <div class="topbar">
        <button class="brand" data-act="logo" aria-label="Voltar para a tela inicial">${marca}</button>
        <div class="grow"></div>
        ${UI.role === 'admin' ? (() => { const n = (S.inscricoes || []).filter(i => i.estado === 'nova').length; return `<button class="insc-btn ${cur === 'inscricoes' ? 'on' : ''}" data-act="tab" data-v="inscricoes" aria-label="Inscrições${n ? ': ' + n + ' novas' : ''}">${ic('user-plus')}<span>Inscrições</span>${n ? `<b>${n}</b>` : ''}</button>`; })() : ''}
        <button class="iconbtn sino" data-act="sino" aria-label="Avisos${nAvisos ? ': ' + nAvisos : ''}">${ic('bell')}${nAvisos ? `<span class="dot">${nAvisos}</span>` : ''}</button>
        <button class="rolebtn" data-act="trocar" aria-label="Trocar de painel">${av(quemNome())}<span>${escapeH(quemNome().split(' ')[0])}</span>${ic('chevron-right','sm')}</button>
      </div>
      <div class="wrap">${conteudo}</div>
    </main>
    <nav class="bnav n${nav.length}" aria-label="Navegação">
      ${nav.map(([id,lab,ico]) => `<button class="${cur===id?'on':''}" data-act="tab" data-v="${id}" aria-label="${lab}">${ic(ico,'lg')}<span>${CURTO[id] || lab}</span>${badge(id)?`<span class="dot">${badge(id)}</span>`:''}</button>`).join('')}
    </nav>
  </div>`;
}
const faixaProto = txt => `<div class="proto">${ic('triangle-alert','sm')}<span>${txt}</span></div>`;

/* ---------- folha (sheet) ---------- */
let SHEET_ON_CLOSE = null;
function abrirFolha(html, {wide=false, onClose=null}={}){
  const sh = $('#sheet');
  sh.className = 'sheet' + (wide ? ' wide' : '');
  sh.innerHTML = `<div class="grab"></div>${html}`;
  SHEET_ON_CLOSE = onClose;
  requestAnimationFrame(() => { $('#scrim').classList.add('on'); sh.classList.add('on'); });
  sh.setAttribute('role','dialog'); sh.setAttribute('aria-modal','true');
  setTimeout(() => { const f = sh.querySelector('input:not([type=hidden]),button.btn.pri'); if (f && matchMedia('(min-width:760px)').matches) f.focus(); }, 320);
  pintarIcones(sh);
}
function fecharFolha(){
  $('#scrim').classList.remove('on'); $('#sheet').classList.remove('on');
  const cb = SHEET_ON_CLOSE; SHEET_ON_CLOSE = null; if (cb) cb();
}
const folhaCab = (titulo, sub='') => `<div class="sheet-h"><div style="flex:1;min-width:0"><h2>${titulo}</h2>${sub?`<p>${sub}</p>`:''}</div><button class="iconbtn" data-act="fechar" aria-label="Fechar">${ic('x')}</button></div>`;
function pintarIcones(){ /* ícones já vêm como SVG inline */ }

/* ---------- aviso ---------- */
let _toastT;
function avisar(txt, icone='check'){
  const t = $('#toast'); t.innerHTML = `${ic(icone)}<span>${escapeH(txt)}</span>`;   /* texto sempre escapado: nomes vêm de quem digita */ t.classList.add('on');
  clearTimeout(_toastT); _toastT = setTimeout(() => t.classList.remove('on'), 2800);
}

/* ---------- SOL DE ARCOS (assinatura, tirado da logo) ---------- */
function solArcos(arcos, centro, sub){
  const cx = 140, cy = 152, raios = [128,104,80], sw = 15;
  const cores = ['var(--sol)','var(--acafrao)','var(--folha)'];
  const path = r => `M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`;
  const sementes = [[-14,-58],[0,-62],[14,-58],[-7,-48],[7,-48],[0,-38]].map(([x,y]) => `<circle class="seed" cx="${cx+x}" cy="${cy+y}" r="3.6"/>`).join('');
  return `<div class="solar" role="img" aria-label="${escapeH(arcos.map(a => a.lab + ': ' + Math.round(a.pct*100) + '%').join('; '))}">
    <div class="raios" aria-hidden="true"></div>
    <svg viewBox="0 0 280 170">
      ${arcos.map((a,i) => { const L = Math.PI*raios[i]; return `<path class="trk" d="${path(raios[i])}" stroke-width="${sw}"/><path class="arc" d="${path(raios[i])}" stroke="${cores[i]}" stroke-width="${sw}" stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${(RM ? L*(1-Math.max(0,Math.min(1,a.pct))) : L).toFixed(1)}" data-len="${L.toFixed(1)}" data-pct="${Math.max(0,Math.min(1,a.pct))}" style="transition-delay:${i*140}ms"/>`; }).join('')}
      ${sementes}
    </svg>
    <div class="center"><b class="${String(centro).replace(/<[^>]+>/g,'').length > 6 ? 'long' : ''}">${centro}</b><span>${sub}</span></div>
  </div>`;
}
function legendaArcos(arcos){
  const cores = ['var(--sol)','var(--acafrao)','var(--folha)'];
  return arcos.map((a,i) => `<div class="lg-row"><i style="background:${cores[i]}"></i><span class="lab">${a.lab}</span><span class="val">${a.val}</span><div class="bar"><span style="width:${RM?Math.round(a.pct*100):0}%;background:${cores[i]}" data-w="${Math.round(Math.max(0,Math.min(1,a.pct))*100)}"></span></div></div>`).join('');
}
function animarArcos(){
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('.solar .arc').forEach(p => { p.style.strokeDashoffset = (p.dataset.len * (1 - p.dataset.pct)).toFixed(1); });
    $$('.lg-row .bar span, .hbar .track span').forEach(s => { if (s.dataset.w) s.style.width = s.dataset.w + '%'; });
  }));
}

/* ---------- gráfico do ano: entradas x saídas ---------- */
function graficoAno(dados, {alto=230, saldos=true}={}){
  const W = 720, H = alto, padL = 46, padB = 26, padT = 10, w = W - padL - 8;
  const max = Math.max(1000, ...dados.map(d => Math.max(d.entradas, d.saidas)));
  const passo = max > 12000 ? 4000 : max > 6000 ? 2000 : 1000;
  const topo = Math.ceil(max / passo) * passo;
  const y = v => padT + (H - padT - padB) * (1 - v / topo);
  const bw = w / 12, bar = Math.min(18, bw/2 - 4);
  let g = '';
  for (let v = 0; v <= topo; v += passo) g += `<line class="gl" x1="${padL}" x2="${W-8}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${padL-8}" y="${y(v)+4}" text-anchor="end">${v ? (v/1000).toLocaleString('pt-BR') + ' mil' : '0'}</text>`;
  const rb = (x, yy, ww, hh) => { if (hh < 1) return ''; const r = Math.min(4, ww/2, hh); return `M${x},${yy+hh} L${x},${yy+r} Q${x},${yy} ${x+r},${yy} L${x+ww-r},${yy} Q${x+ww},${yy} ${x+ww},${yy+r} L${x+ww},${yy+hh} Z`; };
  dados.forEach((d,i) => {
    const x0 = padL + i*bw, cxm = x0 + bw/2;
    g += `<rect class="hit" data-i="${i}" x="${x0+1}" y="${padT}" width="${bw-2}" height="${H-padT-padB}" rx="8"/>`;
    if (d.futuro){ g += `<rect class="future" x="${cxm - bar - 1}" y="${y(0)-3}" width="${bar*2+2}" height="3" rx="1.5"/>`; }
    else {
      g += `<path class="bin" d="${rb(cxm - bar - 1, y(d.entradas), bar, y(0) - y(d.entradas))}"/>`;
      g += `<path class="bout" d="${rb(cxm + 1, y(d.saidas), bar, y(0) - y(d.saidas))}"/>`;
    }
    g += `<text class="ax" x="${cxm}" y="${H-8}" text-anchor="middle" ${d.atual?'style="font-weight:800;fill:var(--ink)"':''}>${MESES_C[i]}</text>`;
  });
  return `<div class="chart" data-chart='${escapeH(JSON.stringify(dados.map(d => ({m:d.mes, e:d.entradas, s:d.saidas, f:d.futuro}))))}'>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Entradas e saídas do Espaço por mês em 2026">${g}</svg>
    ${saldos ? `<div class="saldos" style="margin-left:${(padL/W*100).toFixed(2)}%;margin-right:${(8/W*100).toFixed(2)}%">${dados.map(d => d.futuro ? '<span>—</span>' : `<span class="${d.entradas-d.saidas>=0?'pos':'neg'}">${d.entradas-d.saidas>=0?'+':'−'}${(Math.abs(d.entradas-d.saidas)/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})}k</span>`).join('')}</div>` : ''}
    <div class="tip" role="status"></div>
  </div>`;
}
function ligarGraficos(){
  $$('.chart[data-chart]').forEach(ch => {
    const dados = JSON.parse(ch.dataset.chart), tip = ch.querySelector('.tip');
    const mostrar = (i, el) => {
      const d = dados[i]; $$('.hit', ch).forEach(h => h.classList.toggle('on', h === el));
      if (d.f){ tip.innerHTML = `<b>${nomeMes(d.m)}</b><div>Ainda não chegou</div>`; }
      else tip.innerHTML = `<b>${nomeMes(d.m)}</b><div class="r"><span>Entradas do Espaço</span><span>${brl(d.e)}</span></div><div class="r"><span>Saídas</span><span>${brl(d.s)}</span></div><div class="r" style="border-top:1px solid rgba(255,255,255,.2);margin-top:4px;padding-top:4px"><b>Saldo</b><b>${brl(d.e-d.s)}</b></div>`;
      const r = el.getBoundingClientRect(), cr = ch.getBoundingClientRect();
      let left = r.left - cr.left + r.width/2 - 95; left = Math.max(0, Math.min(cr.width - 190, left));
      tip.style.left = left + 'px'; tip.style.top = '-8px'; tip.classList.add('on');
    };
    $$('.hit', ch).forEach(h => {
      h.addEventListener('mouseenter', () => mostrar(+h.dataset.i, h));
      h.addEventListener('click', () => mostrar(+h.dataset.i, h));
    });
    ch.addEventListener('mouseleave', () => { tip.classList.remove('on'); $$('.hit', ch).forEach(h => h.classList.remove('on')); });
  });
}
function dadosAno(){
  return MESES.map((_,i) => {
    const mes = `2026-${pad(i+1)}`;
    if (mes > MES_ATUAL) return {mes, entradas:0, saidas:0, futuro:true};
    const b = balancoMes(S, mes);
    return {mes, entradas:b.entradas, saidas:b.saidasTot, atual: mes === MES_ATUAL};
  });
}
const hbarras = (itens, cor='var(--chart-out)') => { const mx = Math.max(1, ...itens.map(i => i.v)); return `<div class="hbar">${itens.map(i => `<span>${i.lab}</span><b class="num">${brl(i.v)}</b><div class="track"><span style="width:${RM?Math.round(i.v/mx*100):0}%;background:${cor}" data-w="${Math.round(i.v/mx*100)}"></span></div>`).join('')}</div>`; };

/* pontinhos de frequência das últimas N semanas */
function pontosSemanas(aid, n=8){
  const pres = new Set(presencasDoAluno(S, aid).map(p => p.aula.d));
  let out = '';
  for (let w = n-1; w >= 0; w--){
    const fim = addD(HOJE, -w*7), ini_ = addD(fim, -6);
    let veio = false; for (let d = ini_; d <= fim; d = addD(d,1)) if (pres.has(iso(d))) { veio = true; break; }
    out += `<i class="${veio?'on':''}" title="semana de ${dataBR(iso(ini_))}"></i>`;
  }
  return `<span class="dots" aria-label="presença nas últimas ${n} semanas">${out}</span>`;
}
const pillPag = st => ({
  pago:`<span class="pill ok">${ic('check')}Pago</span>`,
  analise:`<span class="pill pri">${ic('clock')}Em análise</span>`,
  avencer:`<span class="pill warn">${ic('clock')}A vencer</span>`,
  atrasado:`<span class="pill bad">${ic('circle-alert')}Atrasado</span>`,
  pausado:`<span class="pill neu">${ic('pause')}Pausado</span>`,
  cancelado:`<span class="pill neu">${ic('x')}Cancelado</span>`,
}[st]);
const pillFreq = f => `<span class="row" style="gap:6px"><i class="fdot ${f.st}"></i><span class="small ${f.st==='ok'?'muted':''}" style="${f.st==='bad'?'color:var(--bad)':f.st==='warn'?'color:var(--warn)':''};font-weight:${f.st==='ok'?500:700}">${f.txt}</span></span>`;
const nomePlano = m => m.plano ? `${ATIV[m.atv].curto} ${m.plano}` : ATIV[m.atv].curto;
const qrSVG = (seed) => {
  const R = rng(seed), n = 25; let r = '';
  const finder = (x,y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#1F1B45"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3" fill="#1F1B45"/>`;
  for (let y=0;y<n;y++) for (let x=0;x<n;x++){ const inF = (x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9); if (!inF && R() < .48) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="#1F1B45"/>`; }
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/>${r}${finder(0,0)}${finder(n-7,0)}${finder(0,n-7)}</svg>`;
};
