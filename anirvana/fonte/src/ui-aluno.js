/* ============================================================
   PAINEL — ALUNOS (quando já é aluno)
   ============================================================ */
function vAluno(){
  const t = UI.tab.aluno;
  if (t === 'aulas') return vAlunoAulas();
  if (t === 'plano') return vAlunoPlano();
  if (t === 'historico') return vAlunoHist();
  return vAlunoInicio();
}
function tempoPratica(desde){
  const d = pd(desde); let m = (HOJE.getFullYear()-d.getFullYear())*12 + HOJE.getMonth()-d.getMonth(); if (HOJE.getDate() < d.getDate()) m--;
  const a = Math.floor(m/12), r = m%12;
  if (a && r) return `${a} ${a===1?'ano':'anos'} e ${r} ${r===1?'mês':'meses'}`;
  if (a) return `${a} ${a===1?'ano':'anos'}`;
  return m <= 0 ? 'começou agora' : `${m} ${m===1?'mês':'meses'}`;
}
function proximasAulas(a, n=6){
  const out = [], tids = a.mats.filter(m => m.status === 'ativo').flatMap(m => m.turmas);
  for (let i = 0; out.length < n && i < 21; i++){
    const d = addD(HOJE, i);
    TURMAS.filter(t => tids.includes(t.id) && t.dia === d.getDay()).sort((x,y)=>x.h.localeCompare(y.h)).forEach(t => {
      const [hh,mm] = t.h.split(':').map(Number);
      if (i === 0 && hh*60+mm <= HOJE.getHours()*60+HOJE.getMinutes()) return;
      const s = S.subs.find(x => x.turma === t.id && x.d === iso(d) && x.status === 'aceito');
      out.push({t, d:iso(d), sid:`${iso(d)}_${t.id}`, instr: s ? s.para : t.instr});
    });
  }
  return out.slice(0,n);
}
function vAlunoInicio(){
  const a = alunoPor(S, UI.who.aluno);
  const tabs = `<div class="chips" role="tablist">${[['pratica','Minha prática','sprout'], ['eventos','Eventos','ticket'], ['formacao','Formação','graduation-cap'], ...Object.entries(ATIV).filter(([k]) => k!=='particular').map(([k,x]) => [k, x.curto, x.icon])].map(([k,l,i]) => `<button class="chip ${UI.alunoAtv===k?'on':''}" role="tab" aria-selected="${UI.alunoAtv===k}" data-act="alunoAtv" data-v="${k}">${ic(i,'sm')}${l}</button>`).join('')}</div>`;
  if (UI.alunoAtv === 'formacao') return `<div class="pagehead"><div><h1>Namaskar, ${escapeH(a.nome.split(' ')[0])}</h1><p>Formação de instrutores no Espaço.</p></div></div>${tabs}${vFormacaoAluno(a)}`;
  if (UI.alunoAtv === 'eventos') return `<div class="pagehead"><div><h1>Namaskar, ${escapeH(a.nome.split(' ')[0])}</h1><p>Encontros abertos no Espaço.</p></div></div>${tabs}${vEventos()}`;
  if (UI.alunoAtv !== 'pratica') return `<div class="pagehead"><div><h1>Namaskar, ${escapeH(a.nome.split(' ')[0])}</h1><p>Conheça tudo o que acontece no Espaço.</p></div></div>${tabs}${vAtividadeInfo(a, UI.alunoAtv)}`;
  const pres = presencasDoAluno(S, a.id), doMes = pres.filter(p => mesDe(p.aula.d) === MES_ATUAL).length;
  const mPrin = a.mats[0];
  let previstas = 0; for (let d = pd(MES_ATUAL+'-01'); iso(d) <= HOJE_ISO; d = addD(d,1)) if (!FERIADOS.includes(iso(d))) previstas += a.mats.flatMap(m => m.turmas).filter(t => TURMA[t].dia === d.getDay()).length;
  const prox = proximaCobranca(S, mPrin), diasPg = diasEntre(HOJE, pd(prox));
  const meses = (() => { const d = pd(a.desde); return (HOJE.getFullYear()-d.getFullYear())*12 + HOJE.getMonth()-d.getMonth(); })();
  const arcos = [
    {lab:`Aulas em ${nomeMes(MES_ATUAL).toLowerCase()}`, val:`${doMes} de ${previstas}`, pct: previstas ? doMes/previstas : 0},
    {lab:'Até o próximo pagamento', val: diasPg <= 0 ? 'hoje' : `${diasPg} ${diasPg===1?'dia':'dias'} · ${dataBR(prox)}`, pct: Math.max(0, 1 - diasPg/30)},
    {lab:'Rumo ao próximo aniversário de prática', val:`${12 - (meses % 12)} ${12-(meses%12)===1?'mês':'meses'}`, pct:(meses % 12)/12},
  ];
  const lista = proximasAulas(a, 5);
  const semanas = (() => { let s = 0; for (let w = 0; w < 30; w++){ const fim = addD(HOJE, -w*7), ini_ = addD(fim, -6); if (pres.some(p => p.aula.d >= iso(ini_) && p.aula.d <= iso(fim))) s++; else if (w>0) break; } return s; })();
  return `
  <div class="pagehead anim-in"><div><h1>Namaskar, ${escapeH(a.nome.split(' ')[0])}</h1><p>${a.mats.map(m => ATIV[m.atv].nome).join(' e ')} no Espaço Anirvana</p></div></div>
  ${tabs}
  <section class="hero anim-in">
    ${(() => { const [c1, c2] = tempoPratica(a.desde).split(' e '); return solArcos(arcos, c1, (c2 ? `e ${c2} ` : '') + 'de prática'); })()}
    <div class="legend"><h2>Sua prática</h2><p class="lead">Você começou em ${dataBR(a.desde)}/${a.desde.slice(0,4)}.</p>${legendaArcos(arcos)}</div>
  </section>
  <div class="grid g4">
    <div class="stat"><span class="k">${ic('check','sm')}Aulas feitas</span><span class="v">${pres.length}</span><span class="d">desde agosto</span></div>
    <div class="stat"><span class="k">${ic('calendar','sm')}Frequência do mês</span><span class="v">${previstas?Math.round(doMes/previstas*100):0}%</span><span class="d">${doMes} de ${previstas} aulas</span></div>
    <div class="stat"><span class="k">${ic('flame','sm')}Semanas seguidas</span><span class="v">${semanas}</span><span class="d">praticando sem falhar</span></div>
  </div>
  <div class="split">
    <div class="card"><div class="card-h"><h3>Próximas aulas</h3><span class="sub">Avise se vai: ajuda a instrutora a se preparar</span></div>
      <div class="list">${lista.map(x => { const v = S.vou[x.sid]; return `<div class="li"><span class="ico-b" style="color:${ATIV[x.t.atv].hex}">${ic(ATIV[x.t.atv].icon)}</span><div class="main-c"><span class="t">${nomeTurma(x.t)} · ${x.d===HOJE_ISO?'hoje':DIAS_L[pd(x.d).getDay()].toLowerCase()+' '+dataBR(x.d)} às ${x.t.h}</span><span class="s">${PESSOA[x.instr].nome}${x.instr!==x.t.instr?' (substituindo)':''} · ${x.t.sala}</span></div><div class="row">${v===true?`<span class="pill ok">${ic('check')}Vou</span><button class="btn ghost sm" data-act="vou" data-v="${x.sid}" data-x="0">Mudar</button>`:v===false?`<span class="pill neu">Não vou</span><button class="btn ghost sm" data-act="vou" data-v="${x.sid}" data-x="1">Mudar</button>`:`<button class="btn sec sm" data-act="vou" data-v="${x.sid}" data-x="1">Vou</button><button class="btn ghost sm" data-act="vou" data-v="${x.sid}" data-x="0">Não vou</button>`}</div></div>`; }).join('')}</div></div>
    ${cardPlanoResumo(a)}
  </div>
  ${cardContato()}`;
}
function cardContato(){
  return `<div class="card"><div class="card-h"><h3>Espaço Anirvana</h3><span class="sub">${ESPACO.cidade}</span></div>
    <div class="grid g3">
      <div class="li"><span class="ico-b">${ic('phone')}</span><div class="main-c"><span class="t num">${ESPACO.tel}</span><span class="s">WhatsApp</span></div><button class="btn ghost sm" data-act="copiar" data-v="${ESPACO.tel}" aria-label="Copiar telefone">${ic('copy','sm')}</button></div>
      <div class="li"><span class="ico-b">${ic('mail')}</span><div class="main-c"><span class="t" style="overflow-wrap:anywhere">${ESPACO.email}</span><span class="s">E-mail</span></div><button class="btn ghost sm" data-act="copiar" data-v="${ESPACO.email}" aria-label="Copiar e-mail">${ic('copy','sm')}</button></div>
      <div class="li"><span class="ico-b">${ic('house')}</span><div class="main-c"><span class="t">${ESPACO.endereco}</span><span class="s">${ESPACO.cidade}</span></div><button class="btn ghost sm" data-act="copiar" data-v="${ESPACO.endereco}, ${ESPACO.cidade}">${ic('copy','sm')}</button></div>
      <a class="li tap" style="color:inherit;text-decoration:none" href="https://www.instagram.com/${ESPACO.instagram}/" target="_blank" rel="noopener"><span class="ico-b">${ic('sparkles')}</span><div class="main-c"><span class="t">@${ESPACO.instagram}</span><span class="s">Instagram</span></div>${ic('arrow-up-right','sm')}</a>
      <a class="li tap" style="color:inherit;text-decoration:none" href="https://${ESPACO.link}" target="_blank" rel="noopener"><span class="ico-b">${ic('layers')}</span><div class="main-c"><span class="t">${ESPACO.link}</span><span class="s">Todos os links</span></div>${ic('arrow-up-right','sm')}</a>
    </div></div>`;
}
function vFormacaoAluno(a){
  const st = formacaoStatus(), f = S.formandos.find(x => x.aluno === a.id);
  const minha = f ? (() => { const s = formandoSituacao(f, st); return `<div class="card pad-lg anim-in" style="border-top:4px solid var(--pri)"><div class="eyebrow">Sua formação · ${FORMACAO.turma}</div>
      <div class="grid g4" style="margin-top:12px">
        <div class="stat"><span class="k">Módulos</span><span class="v">${st.feitos} de ${FORMACAO.modulos}</span><span class="d">próximo ${st.prox ? dataBR(st.prox) : '—'}</span></div>
        <div class="stat"><span class="k">Sua frequência</span><span class="v" style="color:var(${s.st==='ok'?'--ok':s.st==='warn'?'--warn':'--bad'})">${Math.round(s.pct*100)}%</span><span class="d">${s.txt}</span></div>
        <div class="stat"><span class="k">Estágio</span><span class="v">${f.estagio}h</span><span class="d">de 60 horas</span></div>
        <div class="stat"><span class="k">Monografia</span><span class="v" style="font-size:20px">${MONO[f.mono][0]}</span><span class="d">entrega no fim do curso</span></div>
      </div></div>`; })() : '';
  return minha + `<div class="card pad-lg anim-in">
    <div class="row" style="gap:14px;margin-bottom:12px"><span class="ico-b" style="width:56px;height:56px;border-radius:18px;color:#fff;background:var(--pri)">${ic('graduation-cap','xl')}</span><div><h2 style="font-size:24px">${FORMACAO.nome}</h2><p class="muted small">${FORMACAO.modulos} módulos · ${FORMACAO.turma}</p></div></div>
    <p style="max-width:62ch">${FORMACAO.proposta}</p>
    <p class="small muted" style="max-width:62ch;margin-top:8px">${FORMACAO.formato}</p>
    <div class="grid g2" style="margin-top:16px">
      <div><div class="eyebrow" style="margin-bottom:6px">O que se estuda</div><div class="list">${FORMACAO.conteudo.map(c => `<div class="li"><span class="ico-b">${ic('sprout')}</span><div class="main-c"><span class="t">${c}</span></div></div>`).join('')}</div></div>
      <div><div class="eyebrow" style="margin-bottom:6px">Para receber o certificado</div><div class="list">${FORMACAO.requisitos.map(([k,t]) => `<div class="li"><span class="ico-b">${ic({freq:'check',estagio:'clock',mono:'notebook-pen',aval:'clipboard-check'}[k])}</span><div class="main-c"><span class="t">${t}</span></div></div>`).join('')}</div></div>
    </div>
    <div class="eyebrow" style="margin:16px 0 6px">Mentores</div>
    <div class="grid g2">${FORMACAO.mentores.map(m => `<div class="li">${av(m.nome)}<div class="main-c"><span class="t">${m.nome}</span><span class="s">${m.bio}</span></div></div>`).join('')}</div>
    ${f ? '' : `<div class="row wrap" style="margin-top:16px"><button class="btn sol" data-act="formacaoInteresse">${ic('graduation-cap')}Quero saber da próxima turma</button></div>`}
  </div>`;
}
function vEventos(){
  return EVENTOS.map(e => `<div class="card pad-lg anim-in" style="border-top:4px solid var(--sol)">
    <div class="row" style="gap:14px;margin-bottom:12px"><span class="ico-b" style="width:56px;height:56px;border-radius:18px;color:#fff;background:linear-gradient(135deg,var(--sol),var(--acafrao))">${ic(e.icon,'xl')}</span><div><h2 style="font-size:24px">${e.nome}</h2><p class="muted small">${e.idade}</p></div></div>
    <p style="max-width:62ch;font-size:16px">${e.desc}</p>
    <p class="small muted" style="max-width:62ch;margin-top:8px">${e.publico}</p>
    <div class="list" style="margin-top:14px"><div class="li"><span class="ico-b">${ic('calendar')}</span><div class="main-c"><span class="t">Próximo: ${DIAS_L[pd(e.data).getDay()].toLowerCase()}, ${dataBR(e.data)} às ${e.h}</span><span class="s">${brl(e.valor)} por pessoa${e.exemplo?' · data e valor de exemplo':''}</span></div></div></div>
    <div class="row wrap" style="margin-top:16px"><button class="btn sol" data-act="evento" data-v="${e.id}">${ic('ticket')}Quero participar</button><button class="btn ghost" data-act="copiar" data-v="Vamos no ${e.nome} do Espaço Anirvana? ${dataBR(e.data)} às ${e.h} · ${ESPACO.endereco}, ${ESPACO.cidade}">${ic('copy','sm')}Copiar convite</button></div>
  </div>`).join('') + cardContato();
}
function cardPlanoResumo(a){
  return `<div class="card"><div class="card-h"><h3>${a.mats.length>1?'Seus planos':'Seu plano'}</h3><button class="btn ghost sm" data-act="tab" data-v="plano">Ver tudo${ic('chevron-right','sm')}</button></div>
    <div class="list">${a.mats.map(m => { const st = statusPagamento(S,a,m); return `<div class="li"><span class="ico-b" style="color:${ATIV[m.atv].hex}">${ic(ATIV[m.atv].icon)}</span><div class="main-c"><span class="t">${m.plano ? `${ATIV[m.atv].curto} · ${PLANOS_YOGA[m.plano].nome}` : ATIV[m.atv].nome}</span><span class="s">${brl(valorMat(S,m))}/mês · próxima cobrança ${dataBR(proximaCobranca(S,m))}</span></div>${pillPag(st.st)}</div>`; }).join('')}</div></div>`;
}
function vAtividadeInfo(a, k){
  const x = ATIV[k], ts = TURMAS.filter(t => t.atv === k), faz = a.mats.some(m => m.atv === k);
  const instrs = EQUIPE.filter(p => p.atvs.includes(k));
  return `<div class="card pad-lg anim-in" style="border-top:4px solid ${x.hex}">
    <div class="row" style="gap:14px;margin-bottom:12px"><span class="ico-b" style="width:56px;height:56px;border-radius:18px;color:#fff;background:${x.hex}">${ic(x.icon,'xl')}</span><div><h2 style="font-size:24px">${x.nome}</h2><p class="muted small">com ${instrs.map(p=>p.nome).join(', ')}</p></div></div>
    <p style="max-width:62ch">${x.desc}</p>
    <div class="grid g2" style="margin-top:16px">
      <div><div class="eyebrow" style="margin-bottom:6px">${x.agendada ? 'Como funciona' : 'Horários'}</div>${x.agendada ? '<p class="small">Atendimento individual com hora marcada. Escolha o melhor dia e a terapeuta confirma.</p>' : `<div class="list">${ts.map(t => `<div class="li"><span class="ico-b">${ic('clock')}</span><div class="main-c"><span class="t">${DIAS_L[t.dia]} · ${t.h}</span><span class="s">${PESSOA[t.instr].nome} · ${t.sala}${t.nome?' · '+t.nome:''}</span></div></div>`).join('')}</div>`}</div>
      <div><div class="eyebrow" style="margin-bottom:6px">Valores</div>${k==='yoga' ? `<div class="list">${Object.entries(PLANOS_YOGA).map(([pk,p]) => `<div class="li"><div class="main-c"><span class="t">${p.nome}</span></div><b class="num">${brl(S.regras.planos[pk])}${pk==='avulsa'?'':'/mês'}</b></div>`).join('')}</div>` : `<p class="small">A partir de <b class="num">${brl(Math.min(...S.alunos.flatMap(al => al.mats.filter(m => m.atv===k).map(m => valorMat(S,m))), 999))}</b>${x.agendada?' por sessão':' por mês'}.</p>`}</div>
    </div>
    <div class="row wrap" style="margin-top:18px">${faz ? `<span class="pill ok">${ic('check')}Você já faz esta atividade</span>` : `<button class="btn sol" data-act="experimental" data-v="${k}">${ic('calendar-days')}Agendar aula experimental</button>`}</div>
  </div>`;
}
function vAlunoAulas(){
  const a = alunoPor(S, UI.who.aluno), lista = proximasAulas(a, 12);
  const grupos = {}; lista.forEach(x => (grupos[x.d] = grupos[x.d] || []).push(x));
  const outras = TURMAS.filter(t => a.mats.some(m => m.atv === t.atv && m.atv === 'yoga') && !a.mats.some(m => m.turmas.includes(t.id)));
  return `<div class="pagehead"><div><h1>Aulas</h1><p>Seus próximos horários. Confirme presença com um toque.</p></div></div>
  <div class="split">
    <div class="card">${Object.entries(grupos).map(([d, xs]) => `<div style="margin-bottom:8px"><div class="eyebrow" style="margin:6px 0">${d===HOJE_ISO?'Hoje':DIAS_L[pd(d).getDay()]} · ${dataBR(d)}</div>${xs.map(x => { const v = S.vou[x.sid]; return `<div class="li"><span class="ico-b" style="color:${ATIV[x.t.atv].hex}">${ic(ATIV[x.t.atv].icon)}</span><div class="main-c"><span class="t">${x.t.h} · ${nomeTurma(x.t)}</span><span class="s">${PESSOA[x.instr].nome} · ${x.t.sala}</span></div>${v===true?`<span class="pill ok">${ic('check')}Vou</span>`:`<button class="btn sec sm" data-act="vou" data-v="${x.sid}" data-x="1">Vou</button>`}</div>`; }).join('')}</div>`).join('')}</div>
    ${outras.length ? `<div class="card"><div class="card-h"><div><h3>Outros horários de yoga</h3><span class="sub">Faltou na sua turma? Faça reposição em outra.</span></div></div><div class="list">${outras.map(t => `<div class="li"><span class="ico-b">${ic('sun')}</span><div class="main-c"><span class="t">${DIAS_L[t.dia]} · ${t.h}${t.nome?' · '+t.nome:''}</span><span class="s">${PESSOA[t.instr].nome} · ${t.sala}</span></div><button class="btn ghost sm" data-act="reposicao" data-v="${t.id}">Repor aqui</button></div>`).join('')}</div></div>` : ''}
  </div>`;
}
function vAlunoPlano(){
  const a = alunoPor(S, UI.who.aluno);
  const pags = S.pagamentos.filter(p => p.a === a.id).sort((x,y) => x.d < y.d ? 1 : -1);
  return `<div class="pagehead"><div><h1>Plano e pagamento</h1><p>Seu plano, a próxima cobrança e como você paga.</p></div></div>
  <div class="grid g2">${a.mats.map(m => { const st = statusPagamento(S,a,m), prox = proximaCobranca(S,m);
    return `<div class="card pad-lg" style="position:relative;overflow:hidden">
      <div style="position:absolute;inset:0 0 auto 0;height:5px;background:linear-gradient(90deg,var(--sol),var(--acafrao),var(--folha))"></div>
      <div class="row" style="justify-content:space-between;align-items:flex-start;margin-top:4px"><div><div class="eyebrow">${ATIV[m.atv].nome}</div><h2 style="font-size:24px;margin-top:4px">${m.plano ? PLANOS_YOGA[m.plano].nome : 'Mensal'}${m.instr?` com ${PESSOA[m.instr].nome}`:''}</h2></div>${pillPag(st.st)}</div>
      <div style="font-family:var(--f-display);font-size:38px;font-weight:750;letter-spacing:-.03em;margin:10px 0 2px" class="num">${brl(valorMat(S,m))}<span class="small muted" style="font-family:var(--f-body);font-weight:500;letter-spacing:0"> /mês</span></div>
      <div class="list" style="margin:8px 0 14px">
        <div class="li"><span class="ico-b">${ic('calendar')}</span><div class="main-c"><span class="t">${m.status==='pausado'?'Plano pausado':`Próxima cobrança: ${dataBR(prox)}`}</span><span class="s">${st.st==='atrasado'?`<b style="color:var(--bad)">A de ${nomeMes(MES_ATUAL).toLowerCase()} venceu em ${dataBR(st.venc)}</b>`:st.st==='pago'?`${nomeMes(MES_ATUAL)} pago em ${dataBR(st.pg.d)}`:`vence todo dia ${m.venc}`}</span></div></div>
        <div class="li"><span class="ico-b">${ic(m.metodo==='cartao'?'credit-card':'qr-code')}</span><div class="main-c"><span class="t">${m.metodo==='cartao'?`Cartão final ${m.cartaoFim}`:'Pix'}</span><span class="s">${m.metodo==='cartao'?'Cobrança automática todo mês':'Você recebe o Pix no dia do vencimento'}</span></div></div>
        <div class="li"><span class="ico-b">${ic('clock')}</span><div class="main-c"><span class="t">${m.turmas.map(t => `${DIAS[TURMA[t].dia]} ${TURMA[t].h}`).join(' · ')}</span><span class="s">seus horários</span></div></div>
      </div>
      <div class="row wrap">${st.st!=='pago' && m.status!=='pausado' ? `<button class="btn sol" data-act="pagar" data-v="${m.id}">${ic('wallet')}Pagar ${brl(valorMat(S,m))}</button>` : `<button class="btn sec" data-act="pagar" data-v="${m.id}">${ic('wallet')}Adiantar pagamento</button>`}<button class="btn ghost" data-act="maisFin" data-v="${m.id}">Mais opções${ic('chevron-right','sm')}</button></div>
    </div>`; }).join('')}</div>
  <div class="card"><div class="card-h"><h3>Pagamentos</h3></div><div class="list">${pags.map(p => { const m = a.mats.find(x => x.id === p.mat); return `<div class="li"><span class="ico-b" style="background:var(--ok-bg);color:var(--ok)">${ic('check')}</span><div class="main-c"><span class="t">${nomeMes(p.mes)} · ${ATIV[m.atv].curto}</span><span class="s">${dataBR(p.d)} · ${p.metodo==='cartao'?'cartão':'Pix'}</span></div><b class="num">${brl(p.valor)}</b></div>`; }).join('')}</div></div>`;
}
function vAlunoHist(){
  const a = alunoPor(S, UI.who.aluno), pres = presencasDoAluno(S, a.id), set = new Set(pres.map(p => p.aula.d));
  const inicio = addD(HOJE, -(12*7) - ((HOJE.getDay()+6)%7));
  let cal = '<span></span>';
  for (let w = 0; w < 13; w++){ const d = addD(inicio, w*7); cal += `<span style="text-align:center">${d.getDate()===1||w===0||d.getDate()<=7?MESES_C[d.getMonth()]:''}</span>`; }
  [1,2,3,4,5,6,0].forEach(dw => {
    cal += `<span>${DIAS[dw]}</span>`;
    for (let w = 0; w < 13; w++){ const d = addD(inicio, w*7 + ((dw+6)%7)); const di = iso(d); cal += `<i class="${set.has(di)?'on':''} ${di>HOJE_ISO?'fut':''} ${di===HOJE_ISO?'today':''}" title="${dataBR(di)}${set.has(di)?' · praticou':''}"></i>`; }
  });
  return `<div class="pagehead"><div><h1>Histórico</h1><p>Cada quadradinho verde é um dia em que você praticou.</p></div></div>
  <div class="card pad-lg"><div class="card-h"><h3>Últimas 13 semanas</h3><span class="sub">${pres.length} aulas</span></div><div class="cal">${cal}</div></div>
  <div class="card"><div class="card-h"><h3>Aulas feitas</h3></div><div class="list">${pres.slice(0,20).map(p => { const t = TURMA[p.aula.turma]; return `<div class="li"><span class="ico-b" style="color:${ATIV[t.atv].hex}">${ic(ATIV[t.atv].icon)}</span><div class="main-c"><span class="t">${nomeTurma(t)} · ${DIAS[pd(p.aula.d).getDay()]} ${dataBR(p.aula.d)}</span><span class="s">${PESSOA[p.aula.instr].nome} · ${t.h}</span></div></div>`; }).join('')}</div></div>`;
}

/* ---------- folhas de pagamento ---------- */
function folhaPagar(matId, modo='pix'){
  const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === matId), v = valorMat(S,m);
  const codigo = `00020126580014BR.GOV.BCB.PIX0136espacoanirvana-${matId}-${MES_ATUAL}5204000053039865406${v.toFixed(2)}5802BR5915ESPACO ANIRVANA6009PONTAL PR`;
  abrirFolha(`${folhaCab(`Pagar ${brl(v)}`, `${nomePlano(m)} · ${nomeMes(MES_ATUAL)}`)}
  <div class="stack">
    <div class="seg" style="width:100%">${[['pix','Pix'],['cartao','Cartão']].map(([k,l]) => `<button style="flex:1" class="${modo===k?'on':''}" data-act="pagarModo" data-v="${matId}" data-x="${k}">${l}</button>`).join('')}</div>
    ${modo === 'pix' ? `<div class="qr">${qrSVG(matId.length*991)}</div><p class="tiny muted" style="text-align:center">QR de exemplo — no app de verdade vem do banco</p>
      <div class="field"><label>Pix copia e cola</label><div class="row"><input class="inp num" readonly value="${codigo}" id="pixCod" style="font-size:13px"><button class="btn sec" data-act="copiar" data-v="${codigo}">${ic('copy','sm')}Copiar</button></div></div>
      <div class="sheet-foot"><button class="btn pri" data-act="confirmarPag" data-v="${matId}" data-x="pix">${ic('check')}Já paguei</button></div>`
    : `<div class="field"><label for="cNum">Número do cartão</label><input class="inp num" id="cNum" inputmode="numeric" placeholder="0000 0000 0000 0000"></div>
      <div class="grid g2"><div class="field"><label for="cVal">Validade</label><input class="inp num" id="cVal" placeholder="MM/AA"></div><div class="field"><label for="cCvv">CVV</label><input class="inp num" id="cCvv" placeholder="123"></div></div>
      <label class="row small" style="gap:10px;cursor:pointer"><input type="checkbox" id="cRec" checked style="width:20px;height:20px;accent-color:var(--pri)"> Cobrar automaticamente todo mês neste cartão</label>
      <div class="sheet-foot"><button class="btn pri" data-act="confirmarPag" data-v="${matId}" data-x="cartao">${ic('credit-card')}Pagar ${brl(v)}</button></div>`}
  </div>`);
}
function folhaMaisFin(matId, vis='menu'){
  const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === matId);
  let corpo = '';
  if (vis === 'menu') corpo = `<div class="list">${[['metodo','Trocar forma de pagamento','credit-card',m.metodo==='cartao'?`Hoje: cartão final ${m.cartaoFim}`:'Hoje: Pix'],['pausar',m.status==='pausado'?'Retomar plano':'Pausar plano','pause',m.status==='pausado'?'Seu plano está pausado':'Viagem, saúde, férias: pause até 60 dias'],['alterar','Alterar plano','repeat',m.plano?`Hoje: ${PLANOS_YOGA[m.plano].nome}`:'Fale com a recepção']].map(([k,t,i,s]) => `<button class="li tap" style="width:100%;text-align:left" data-act="maisFin" data-v="${matId}" data-x="${k}"><span class="ico-b">${ic(i)}</span><div class="main-c"><span class="t">${t}</span><span class="s">${s}</span></div>${ic('chevron-right','sm')}</button>`).join('')}</div>`;
  if (vis === 'metodo') corpo = `<div class="optgrid" style="grid-template-columns:1fr 1fr">${[['cartao','Cartão automático','credit-card'],['pix','Pix todo mês','qr-code']].map(([k,l,i]) => `<button class="opt ${m.metodo===k?'on':''}" data-act="opt" data-grp="fMet" data-v="${k}">${ic(i)}${l}</button>`).join('')}</div><input type="hidden" id="fMet" value="${m.metodo}"><div class="sheet-foot"><button class="btn sec" data-act="maisFin" data-v="${matId}" data-x="menu">Voltar</button><button class="btn pri" data-act="salvarMetodo" data-v="${matId}">Salvar</button></div>`;
  if (vis === 'pausar') corpo = m.status === 'pausado' ? `<p>Ao retomar, a próxima cobrança volta no dia ${m.venc}.</p><div class="sheet-foot"><button class="btn sec" data-act="maisFin" data-v="${matId}" data-x="menu">Voltar</button><button class="btn pri" data-act="retomar" data-v="${matId}">Retomar plano</button></div>`
    : `<div class="optgrid">${[['15','15 dias'],['30','30 dias'],['60','60 dias']].map(([k,l],i) => `<button class="opt ${i===1?'on':''}" data-act="opt" data-grp="fPausa" data-v="${k}">${l}</button>`).join('')}</div><input type="hidden" id="fPausa" value="30"><div class="field"><label for="fMotP">Motivo (opcional)</label><input class="inp" id="fMotP" placeholder="Ex.: viagem"></div><p class="small muted">Durante a pausa não há cobrança. A instrutora fica sabendo e sua vaga fica guardada.</p><div class="sheet-foot"><button class="btn sec" data-act="maisFin" data-v="${matId}" data-x="menu">Voltar</button><button class="btn pri" data-act="pausar" data-v="${matId}">Pausar plano</button></div>`;
  if (vis === 'alterar') corpo = m.plano ? `<div class="list">${['1x','2x','3x','4x'].map(k => { const dif = S.regras.planos[k] - S.regras.planos[m.plano]; return `<button class="li tap opt ${m.plano===k?'on':''}" style="width:100%;margin-bottom:8px" data-act="opt" data-grp="fPlano" data-v="${k}"><div class="main-c"><span class="t">${PLANOS_YOGA[k].nome}</span><span class="s">${m.plano===k?'seu plano atual':dif>0?`+${brl(dif)} por mês`:`${brl(dif)} por mês`}</span></div><b class="num">${brl(S.regras.planos[k])}</b></button>`; }).join('')}</div><input type="hidden" id="fPlano" value="${m.plano}"><p class="small muted">A mudança vale a partir da próxima cobrança. Os novos horários você combina com a recepção.</p><div class="sheet-foot"><button class="btn sec" data-act="maisFin" data-v="${matId}" data-x="menu">Voltar</button><button class="btn pri" data-act="alterarPlano" data-v="${matId}">Confirmar</button></div>`
    : `<p>Para mudar este plano, fale com a recepção do Espaço.</p>`;
  abrirFolha(`${folhaCab({menu:'Mais opções', metodo:'Forma de pagamento', pausar:m.status==='pausado'?'Retomar plano':'Pausar plano', alterar:'Alterar plano'}[vis], nomePlano(m))}<div class="stack">${corpo}</div>`);
}
