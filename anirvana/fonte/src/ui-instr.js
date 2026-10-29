/* ============================================================
   PAINEL — INSTRUTORES E PROFESSORES
   ============================================================ */
function vInstrutor(){
  const t = UI.tab.instrutor;
  if (t === 'agenda') return `<div class="pagehead"><div><h1>Agenda</h1><p>A grade do Espaço com as suas aulas em destaque.</p></div></div>${vGrade(UI.who.instrutor)}${vMinhasSubs()}`;
  if (t === 'alunos') return vInstrAlunos();
  if (t === 'mes') return vMeuMes();
  return vInstrHoje();
}
function aulasDeHoje(pid){
  return TURMAS.filter(t => t.dia === HOJE.getDay() && t.instr === pid).sort((a,b) => a.h.localeCompare(b.h)).map(t => ({t, au:S.aulas[`${HOJE_ISO}_${t.id}`]}));
}
function estimativaMes(pid, mes=MES_ATUAL){
  const r = repassesEquipe(S, mes).find(x => x.id === pid);
  return r ? r.total : 0;
}
function vInstrHoje(){
  const pid = UI.who.instrutor, p = PESSOA[pid];
  const minhasT = turmasDoInstr(pid).map(t => t.id);
  const doMes = Object.values(S.aulas).filter(a => mesDe(a.d) === MES_ATUAL && a.instr === pid);
  let previstas = doMes.length;
  for (let d = addD(HOJE,1); iso(d) <= fimDoMes(MES_ATUAL); d = addD(d,1)) previstas += TURMAS.filter(t => t.dia === d.getDay() && t.instr === pid).length;
  previstas += TURMAS.filter(t => t.dia === HOJE.getDay() && t.instr === pid && !S.aulas[`${HOJE_ISO}_${t.id}`]).length;
  const feitas = doMes.filter(a => a.feita).length;
  let ocup = 0, cap = 0;
  doMes.filter(a => a.feita).forEach(a => { const n = matriculadosNaTurma(S, a.turma).length || 1; cap += n; ocup += Math.min(n, S.presencas.filter(x => x.s === a.id && x.a).length); });
  const vis = alunosVisiveis(S, pid), fs = vis.map(a => ({a, f:freqStatus(S,a)}));
  const emDia = fs.filter(x => x.f.st === 'ok').length;
  const arcos = [
    {lab:'Aulas dadas em outubro', val:`${feitas} de ${previstas}`, pct: previstas ? feitas/previstas : 0},
    {lab:'Presença média nas suas aulas', val:`${cap?Math.round(ocup/cap*100):0}%`, pct: cap ? ocup/cap : 0},
    {lab:'Seus alunos em dia com a frequência', val:`${emDia} de ${vis.length}`, pct: vis.length ? emDia/vis.length : 0},
  ];
  const hoje = aulasDeHoje(pid);
  const pedidos = pedidosPara(pid);
  const atencao = fs.filter(x => x.f.st !== 'ok').sort((a,b) => (b.f.dias||99) - (a.f.dias||99));
  const prox = (() => { for (let i=1;i<8;i++){ const d = addD(HOJE,i); const ts = TURMAS.filter(t => t.dia === d.getDay() && t.instr === pid).sort((a,b)=>a.h.localeCompare(b.h)); if (ts.length) return {d, t:ts[0]}; } })();
  return `
  <div class="pagehead anim-in"><div><h1>${saudacao()}, ${p.nome}</h1><p>${dataLonga(HOJE_ISO).replace(/^./, c => c.toUpperCase())} · ${p.atvs.map(a => ATIV[a].curto).join(', ')}</p></div></div>
  <section class="hero anim-in">
    ${solArcos(arcos, brl0(estimativaMes(pid)), 'seu mês até agora')}
    <div class="legend"><h2>Seu outubro</h2><p class="lead">Estimativa do seu repasse, somando todas as suas atividades. O valor final sai no fechamento.</p>${legendaArcos(arcos)}</div>
  </section>
  <div class="split">
    <div class="card"><div class="card-h"><h3>Suas aulas de hoje</h3><span class="sub">${DIAS_L[HOJE.getDay()]}, ${dataBR(HOJE_ISO)}</span></div>
      <div class="list">${hoje.length ? hoje.map(({t,au}) => {
        const n = au && au.feita ? S.presencas.filter(x => x.s === au.id).length : 0;
        const estado = !au ? `<span class="pill neu">${ic('clock')}às ${t.h}</span>` : au.feita ? `<span class="pill ok">${ic('check')}${au.vazia?'Aula vazia':n+' presentes'}</span>` : `<button class="btn sol sm" data-act="chamada" data-v="${HOJE_ISO}_${t.id}">${ic('list-checks','sm')}Fazer chamada</button>`;
        return `<div class="li"><span class="ico-b" style="color:${ATIV[t.atv].hex}">${ic(ATIV[t.atv].icon)}</span><div class="main-c"><span class="t">${nomeTurma(t)} · ${t.h}</span><span class="s">${t.sala} · ${t.aluno ? alunoPor(S,t.aluno).nome : matriculadosNaTurma(S,t.id).length+' matriculados'}${au && !au.feita ? ' · <b style="color:var(--sol-ink)">chamada pendente</b>' : ''}</span></div><div class="end">${estado}</div></div>`; }).join('')
        : `<p class="muted">Hoje você não tem aulas.${prox ? ` A próxima é ${nomeTurma(prox.t)} ${DIAS_L[prox.d.getDay()].toLowerCase()} às ${prox.t.h}.` : ''}</p>`}</div>
    </div>
    <div class="card"><div class="card-h"><h3>Pedidos de troca</h3><span class="sub">${pedidos.length ? 'Alguém precisa de você' : 'Nenhum aberto'}</span></div>
      ${pedidos.map(s => `<div class="alert warn" style="margin-bottom:10px"><span class="ib">${ic('repeat')}</span><div style="flex:1;min-width:0"><div class="t">${PESSOA[s.de].nome} pede troca: ${nomeTurma(TURMA[s.turma])} ${DIAS_L[pd(s.d).getDay()].toLowerCase()} ${dataBR(s.d)} às ${TURMA[s.turma].h}</div><div class="s">"${escapeH(s.motivo)}"</div><div class="row wrap" style="margin-top:10px"><button class="btn pri sm" data-act="aceitarSub" data-v="${s.id}">${ic('check','sm')}Eu cubro</button><button class="btn sec sm" data-act="recusarSub" data-v="${s.id}">Não posso</button></div></div></div>`).join('') || `<p class="muted small">Quando outra instrutora pedir troca numa atividade que você dá, o pedido aparece aqui. Para pedir uma troca, toque numa aula sua na Agenda.</p>`}
      <button class="btn sec sm" data-act="tab" data-v="agenda">${ic('repeat','sm')}Pedir troca de uma aula minha</button>
    </div>
  </div>
  <div class="card"><div class="card-h"><div><h3>Alunos que pedem atenção</h3><span class="sub">Amarelo: mais de uma semana sem vir · Vermelho: mais de uma semana e meia</span></div><button class="btn ghost sm" data-act="tab" data-v="alunos">Ver todos${ic('chevron-right','sm')}</button></div>
    <div class="list">${atencao.map(({a,f}) => `<div class="li tap" data-act="verAlunoI" data-v="${a.id}" role="button" tabindex="0">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">${matsVisiveis(a, pid).map(nomePlano).join(' + ')}</span></div><div class="end">${pillFreq(f)}${pontosSemanas(a.id,6)}</div></div>`).join('') || '<p class="muted">Todos vindo direitinho.</p>'}</div>
  </div>`;
}
function vInstrAlunos(){
  const pid = UI.who.instrutor, vis = alunosVisiveis(S, pid).map(a => ({a, f:freqStatus(S,a)}));
  const cnt = k => vis.filter(x => k === 'todos' || x.f.st === k).length;
  const lista = vis.filter(x => UI.instrFiltro === 'todos' || x.f.st === UI.instrFiltro).sort((x,y) => ({bad:0,warn:1,ok:2}[x.f.st] - {bad:0,warn:1,ok:2}[y.f.st]) || x.a.nome.localeCompare(y.a.nome));
  return `<div class="pagehead"><div><h1>Alunos</h1><p>Quem você vê aqui: alunos das turmas de ${PESSOA[pid].atvs.filter(a=>ATIV[a].vis==='todos').map(a=>ATIV[a].curto).join(', ') || '—'} e os particulares que escolheram você.</p></div></div>
  <div class="card">
    <div class="chips" style="margin-bottom:8px">${[['todos','Todos'],['ok','Em dia'],['warn','Atenção'],['bad','Faltando']].map(([k,l]) => `<button class="chip ${UI.instrFiltro===k?'on':''}" data-act="instrFiltro" data-v="${k}">${k!=='todos'?`<i class="fdot ${k}"></i>`:''}${l} <span class="n">${cnt(k)}</span></button>`).join('')}</div>
    <div class="list">${lista.map(({a,f}) => `<div class="li tap" data-act="verAlunoI" data-v="${a.id}" role="button" tabindex="0">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">${matsVisiveis(a, pid).map(m => `${nomePlano(m)} · ${m.turmas.map(t => `${DIAS[TURMA[t].dia]} ${TURMA[t].h}`).join(', ')}`).join(' + ')}</span></div><div class="end">${pillFreq(f)}${pontosSemanas(a.id)}</div></div>`).join('')}</div>
  </div>`;
}
function vMinhasSubs(){
  const pid = UI.who.instrutor, minhas = S.subs.filter(s => s.de === pid || s.para === pid);
  if (!minhas.length) return '';
  return `<div class="card"><div class="card-h"><h3>Suas trocas</h3></div><div class="list">${minhas.slice().reverse().map(s => `<div class="li"><span class="ico-b">${ic('repeat')}</span><div class="main-c"><span class="t">${nomeTurma(TURMA[s.turma])} · ${DIAS[pd(s.d).getDay()]} ${dataBR(s.d)} ${TURMA[s.turma].h}</span><span class="s">${s.de===pid ? (s.para ? `${PESSOA[s.para].nome} vai cobrir` : 'Esperando alguém aceitar') : `Você cobre ${PESSOA[s.de].nome}`}</span></div>${s.status==='aberto'?'<span class="pill warn">Aguardando</span>':`<span class="pill ok">${ic('check')}Combinado</span>`}</div>`).join('')}</div></div>`;
}
function vMeuMes(){
  const pid = UI.who.instrutor, mes = UI.meuMes, fy = fechamentoYoga(S, mes), r = repassesEquipe(S, mes).find(x => x.id === pid);
  const ly = fy.linhas.find(l => l.id === pid);
  const pago = r && r.pago;
  const hist = [...Object.keys(FECH_PLANILHA), '2026-08','2026-09','2026-10'].map(m => ({m, v:(repassesEquipe(S,m).find(x => x.id === pid)||{total:0}).total}));
  const mx = Math.max(1, ...hist.map(h => h.v));
  return `<div class="pagehead"><div><h1>Meu mês</h1><p>Seu repasse, aula por aula. Sem mistério e sem planilha.</p></div></div>
  ${chipsFech(mes, 'meuMes')}
  <div class="split">
    <div class="card pad-lg">
      <div class="eyebrow">${nomeMes(mes)} · ${mes===MES_ATUAL ? 'estimativa até hoje' : fy.fonte==='planilha' ? 'valores da planilha' : 'fechado'}</div>
      <div style="font-family:var(--f-display);font-size:44px;font-weight:750;letter-spacing:-.03em;line-height:1.1;margin:6px 0 4px" class="num">${brl(r ? r.total : 0)}</div>
      <div class="row wrap" style="margin-bottom:14px">${pago ? `<span class="pill ok">${ic('check')}Pago em ${dataBR(pago.d)}</span>` : fy.fonte==='planilha' ? '<span class="pill neu">Fechado na planilha</span>' : `<span class="pill warn">${ic('clock')}A receber no dia 5</span>`}</div>
      ${ly && ly.aulas ? `<div class="eyebrow" style="margin-bottom:4px">Yoga em turma · ${ly.aulas} aulas dadas</div>
      <div class="list">
        ${['2x','1x','3x','4x','avulsa'].filter(k => ly.c[k]).map(k => `<div class="li"><div class="main-c"><span class="t">${ly.c[k]} presenças de alunos ${k==='avulsa'?'avulsos':k}</span><span class="s">cada uma vale ${brl(fy.taxas[k])}</span></div><b class="num">${brl(ly.c[k]*fy.taxas[k])}</b></div>`).join('')}
        ${ly.c.vazia ? `<div class="li"><div class="main-c"><span class="t">${ly.c.vazia} ${ly.c.vazia===1?'aula vazia':'aulas vazias'}</span><span class="s">ninguém veio · vale ${brl(fy.aulaVazia)}</span></div><b class="num">${brl(ly.c.vazia*fy.aulaVazia)}</b></div>` : ''}
        <div class="li"><div class="main-c"><span class="t">Ajuste do mês</span><span class="s">${fy.excedente>=0?'sobra':'falta'} de ${brl(Math.abs(fy.excedente))} ÷ ${fy.totalAulas} aulas = ${brl(fy.porAula)} por aula × ${ly.aulas}</span></div><b class="num" style="color:${ly.ajuste<0?'var(--bad)':'var(--ok)'}">${brl(ly.ajuste)}</b></div>
      </div>` : ''}
      ${r ? `<div class="eyebrow" style="margin:14px 0 4px">Total por atividade</div><div class="list">${r.itens.map(i => `<div class="li"><div class="main-c"><span class="t">${i.lab}</span></div><b class="num">${brl(i.v)}</b></div>`).join('')}</div>` : '<p class="muted">Sem repasse neste mês.</p>'}
    </div>
    <div class="grid" style="align-content:start">
      <div class="card"><div class="card-h"><h3>Como o valor é calculado</h3></div>
        <ol class="small" style="margin:0;padding-left:18px;display:grid;gap:8px;color:var(--ink-2)">
          <li>Cada aluno presente vale ${Math.round(fy.pctYoga*100)}% do plano dele dividido pelas aulas do mês. Aluno 2x: ${brl(fy.taxas['2x'])} por presença.</li>
          <li>Se ninguém vem, a aula vale ${brl(fy.aulaVazia)}.</li>
          <li>No fim do mês, o app compara com ${Math.round(fy.pctYoga*100)}% das mensalidades de yoga. A sobra (ou a falta) é dividida igualmente por aula dada.</li>
          <li>Particulares, gestantes, meditação e outras atividades entram com a sua porcentagem.</li>
        </ol></div>
      <div class="card"><div class="card-h"><h3>Seus meses</h3></div>
        <div class="hbar">${hist.map(h => `<span>${nomeMes(h.m)}${FECH_PLANILHA[h.m]?' <span class="tag real">planilha</span>':''}</span><b class="num">${brl(h.v)}</b><div class="track"><span style="width:${RM?Math.max(0,h.v/mx*100):0}%;background:var(--chart-in)" data-w="${Math.max(0,Math.round(h.v/mx*100))}"></span></div>`).join('')}</div></div>
    </div>
  </div>`;
}

/* ---------- chamada ---------- */
let CHAMADA = null;
function folhaChamada(sid){
  const [d, tid] = sid.split('_'), t = TURMA[tid];
  const au = S.aulas[sid] || {id:sid, d, turma:tid, instr:t.instr, feita:false};
  const mats = t.aluno ? [alunoPor(S, t.aluno)] : matriculadosNaTurma(S, tid);
  const ja = S.presencas.filter(p => p.s === sid);
  CHAMADA = {sid, presentes:new Set(ja.filter(p => p.a).map(p => p.a)), extras:ja.filter(p => p.a && !mats.find(m => m.id === p.a)).map(p => p.a), visit:ja.filter(p => !p.a).length};
  desenharChamada();
}
function desenharChamada(){
  const {sid} = CHAMADA, [d, tid] = sid.split('_'), t = TURMA[tid];
  const mats = t.aluno ? [alunoPor(S, t.aluno)] : matriculadosNaTurma(S, tid);
  const extras = CHAMADA.extras.map(id => alunoPor(S,id));
  const lista = [...mats, ...extras];
  const n = CHAMADA.presentes.size + CHAMADA.visit;
  const outros = alunosVisiveis(S, UI.who.instrutor).filter(a => !lista.includes(a) && a.mats.some(m => m.atv === t.atv));
  const plano = a => { const m = a.mats.find(x => x.atv === t.atv); return m ? (m.plano ? `plano ${m.plano}` : ATIV[m.atv].curto) : ''; };
  abrirFolha(`${folhaCab(`Chamada · ${nomeTurma(t)}`, `${DIAS_L[pd(d).getDay()]}, ${dataBR(d)} às ${t.h} · ${t.sala}. Toque em quem veio.`)}
  <div class="stack">
    <div class="rollgrid">${lista.map(a => `<button class="roll ${CHAMADA.presentes.has(a.id)?'on':''}" data-act="marcar" data-v="${a.id}" aria-pressed="${CHAMADA.presentes.has(a.id)}">${av(a.nome)}<span class="col" style="gap:0"><span class="nm">${escapeH(a.nome.split(' ').slice(0,2).join(' '))}</span><span class="pl">${plano(a)}</span></span><span class="ck">${ic('check')}</span></button>`).join('')}</div>
    ${outros.length ? `<details><summary class="small strong" style="cursor:pointer;color:var(--pri)">Veio alguém de outra turma? (${outros.length})</summary><div class="chips" style="flex-wrap:wrap;margin-top:10px">${outros.map(a => `<button class="chip" data-act="addExtra" data-v="${a.id}">${ic('plus','sm')}${escapeH(a.nome)}</button>`).join('')}</div></details>` : ''}
    ${t.atv === 'yoga' ? `<div class="row" style="justify-content:space-between;padding:10px 12px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)"><div><b class="small">Visitantes / aula avulsa</b><div class="tiny muted">cada um vale ${brl(taxasYoga(S.regras.planos, S.regras.pct.yoga).avulsa)}</div></div><div class="row"><button class="iconbtn" data-act="visit" data-v="-1" aria-label="Menos um visitante">${ic('minus')}</button><b class="num" style="min-width:20px;text-align:center">${CHAMADA.visit}</b><button class="iconbtn" data-act="visit" data-v="1" aria-label="Mais um visitante">${ic('plus')}</button></div></div>` : ''}
    <div class="sheet-foot">${n === 0 ? `<button class="btn sec" data-act="salvarChamada" data-v="vazia">Ninguém veio · aula vazia</button>` : `<button class="btn sec" data-act="fechar">Cancelar</button>`}<button class="btn pri" data-act="salvarChamada" ${n===0?'disabled':''}>${ic('check')}Salvar chamada${n?` (${n})`:''}</button></div>
  </div>`, {wide:true});
}
function folhaMinhaTurma(tid){
  const t = TURMA[tid], prox = [];
  for (let i = 0; prox.length < 4 && i < 40; i++){ const d = addD(HOJE, i); if (d.getDay() === t.dia) prox.push(iso(d)); }
  const passadas = Object.values(S.aulas).filter(a => a.turma === tid).sort((a,b) => a.d < b.d ? 1 : -1).slice(0,3);
  abrirFolha(`${folhaCab(`${nomeTurma(t)} · ${DIAS_L[t.dia]} ${t.h}`, `${t.sala} · ${t.aluno ? alunoPor(S,t.aluno).nome : matriculadosNaTurma(S,tid).length + ' matriculados'}`)}
  <div class="stack">
    <div><div class="eyebrow" style="margin-bottom:6px">Próximas aulas</div><div class="list">${prox.map(d => { const s = S.subs.find(x => x.turma === tid && x.d === d); return `<div class="li"><div class="main-c"><span class="t">${DIAS_L[pd(d).getDay()]}, ${dataBR(d)}</span><span class="s">${s ? (s.status==='aberto' ? 'Troca pedida · aguardando' : `${PESSOA[s.para].nome} vai cobrir`) : 'Com você'}</span></div>${s ? '' : `<button class="btn sec sm" data-act="pedirSub" data-v="${tid}" data-d="${d}">${ic('repeat','sm')}Pedir troca</button>`}</div>`; }).join('')}</div></div>
    <div><div class="eyebrow" style="margin-bottom:6px">Últimas chamadas</div><div class="list">${passadas.map(a => `<div class="li"><div class="main-c"><span class="t">${dataBR(a.d)}</span><span class="s">${a.feita ? (a.vazia ? 'Aula vazia' : S.presencas.filter(p => p.s === a.id).length + ' presentes') : 'Chamada pendente'}${a.sub ? ` · dada por ${PESSOA[a.instr].nome}` : ''}</span></div><button class="btn ${a.feita?'sec':'sol'} sm" data-act="chamada" data-v="${a.id}">${a.feita?'Corrigir':'Fazer chamada'}</button></div>`).join('') || '<p class="muted small">Nenhuma ainda.</p>'}</div></div>
  </div>`);
}
function folhaPedirSub(tid, d){
  const t = TURMA[tid], quem = EQUIPE.filter(p => p.id !== UI.who.instrutor && p.atvs.includes(t.atv));
  abrirFolha(`${folhaCab('Pedir troca de aula', `${nomeTurma(t)} · ${DIAS_L[pd(d).getDay()]}, ${dataBR(d)} às ${t.h}`)}
  <form class="stack" id="fSub" data-t="${tid}" data-d="${d}">
    <div class="field"><label>Para quem</label><div class="optgrid"><button type="button" class="opt on" data-act="opt" data-grp="sPara" data-v="">${ic('users')}Qualquer pessoa de ${ATIV[t.atv].curto}</button>${quem.map(p => `<button type="button" class="opt" data-act="opt" data-grp="sPara" data-v="${p.id}">${av(p.nome)}${p.nome}</button>`).join('')}</div><input type="hidden" id="sPara" value=""></div>
    <div class="field"><label for="sMot">Motivo (aparece para quem vai cobrir)</label><textarea class="inp" id="sMot" placeholder="Ex.: consulta médica"></textarea></div>
    <p class="small muted">Quem aceitar recebe por esta aula. A administração acompanha tudo.</p>
    <div class="sheet-foot"><button type="button" class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" type="submit">${ic('repeat')}Enviar pedido</button></div>
  </form>`);
}
