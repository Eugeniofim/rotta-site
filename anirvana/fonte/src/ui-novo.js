/* ============================================================
   INSCRIÇÃO (no lugar do Google Forms), FICHA, PONTOS E AVISOS
   ============================================================ */

function cardPontos(a){
  const P = pontosAluno(S, a.id);
  const vez = REGRAS_PONTOS.filter(r => r.vez);
  return `<div class="card pontos"><div class="card-h"><div><h3>Seus pontos</h3><span class="sub">Cada prática vale ponto. Troque por presentes do Espaço.</span></div><span class="pill pri">${ic('flower-2')}${P.nivel}</span></div>
    <div class="row" style="align-items:flex-end;gap:14px;margin-bottom:8px"><div class="num" style="font-family:var(--f-display);font-size:46px;font-weight:800;letter-spacing:-.03em;line-height:1">${P.saldo}</div><div class="small muted" style="padding-bottom:6px">pontos para trocar</div></div>
    ${P.prox ? `<div class="hbar"><span class="small">Faltam <b>${P.prox.falta}</b> para ${P.prox.nome}</span><span></span><div class="track"><span style="width:${RM?Math.round(P.prox.pct*100):0}%;background:linear-gradient(90deg,var(--sol),var(--acafrao),var(--folha))" data-w="${Math.round(P.prox.pct*100)}"></span></div></div>` : '<p class="small">Você chegou ao nível mais alto: Lótus.</p>'}
    <div class="eyebrow" style="margin:8px 0 6px">Ganhe mais</div>
    <div class="list">${vez.map(r => `<div class="li"><span class="ico-b" style="${P.acoes[r.id]?'background:var(--ok-bg);color:var(--ok)':''}">${ic(P.acoes[r.id]?'check':r.icon)}</span><div class="main-c"><span class="t">${r.nome}</span><span class="s">+${r.pts} pontos${P.acoes[r.id]?' · feito':''}</span></div>${P.acoes[r.id] ? '' : r.id === 'instalar' ? `<button class="btn sol sm" data-act="instalarApp">Instalar</button>` : r.id === 'notif' ? `<button class="btn sec sm" data-act="ativarAvisos">Ativar</button>` : r.id === 'ficha' ? `<button class="btn sec sm" data-act="verMinhaFicha">Completar</button>` : `<button class="btn sec sm" data-act="indicar">Indicar</button>`}</div>`).join('')}
      <div class="li"><span class="ico-b">${ic('check')}</span><div class="main-c"><span class="t">Toda aula, pagamento em dia e presença confirmada</span><span class="s">+${PTS.aula} por aula · +${PTS.emdia} por mês em dia · +${PTS.vou} por "Vou"</span></div></div></div>
    <div class="row wrap" style="margin-top:12px"><button class="btn pri" data-act="trocarPontos">${ic('gift')}Trocar pontos</button><button class="btn ghost" data-act="extratoPontos">Ver extrato</button></div>
  </div>`;
}
function folhaInstalar(){
  const podeAgora = !!window.__pedidoInstalar;
  abrirFolha(`${folhaCab('Instale o app', 'Fica na tela do celular, abre num toque e avisa das suas aulas. Vale +50 pontos.')}
  <div class="stack">
    ${podeAgora ? `<button class="btn sol block" data-act="instalarAgora">${ic('house')}Instalar agora</button>` : ''}
    <div class="grid g2">
      <div class="card flat"><div class="eyebrow" style="margin-bottom:8px">iPhone</div><ol class="small" style="margin:0;padding-left:18px;display:grid;gap:6px"><li>Abra rottaguide.com/anirvana no <b>Safari</b></li><li>Toque em <b>Compartilhar</b> (o quadrado com a seta)</li><li>Escolha <b>Adicionar à Tela de Início</b></li></ol></div>
      <div class="card flat"><div class="eyebrow" style="margin-bottom:8px">Android</div><ol class="small" style="margin:0;padding-left:18px;display:grid;gap:6px"><li>Abra rottaguide.com/anirvana no <b>Chrome</b></li><li>Toque nos <b>três pontinhos</b></li><li>Escolha <b>Instalar app</b></li></ol></div>
    </div>
    <p class="small muted">No app de verdade os pontos entram sozinhos na primeira vez que você abrir pelo ícone.</p>
    <div class="sheet-foot"><button class="btn sec" data-act="fechar">Depois</button><button class="btn pri" data-act="instalouDemo">Já instalei (demonstração)</button></div>
  </div>`);
}
function folhaTrocar(a){
  const P = pontosAluno(S, a.id), minhas = (S.trocas || []).filter(t => t.a === a.id);
  abrirFolha(`${folhaCab('Trocar pontos', `Você tem ${P.saldo} pontos`)}
  <div class="stack"><div class="list">${PREMIOS.map(p => `<div class="li"><span class="ico-b" style="color:var(--sol-ink)">${ic(p.icon)}</span><div class="main-c"><span class="t">${p.nome}</span><span class="s">${p.custo} pontos</span></div>${P.saldo >= p.custo ? `<button class="btn sol sm" data-act="pedirPremio" data-v="${p.id}">Trocar</button>` : `<span class="tiny muted">faltam ${p.custo - P.saldo}</span>`}</div>`).join('')}</div>
  ${minhas.length ? `<div><div class="eyebrow" style="margin-bottom:6px">Suas trocas</div><div class="list">${minhas.map(t => `<div class="li"><div class="main-c"><span class="t">${PREMIOS.find(p => p.id === t.premio).nome}</span><span class="s">${dataBR(t.d)}</span></div>${t.estado === 'entregue' ? `<span class="pill ok">${ic('check')}Entregue</span>` : '<span class="pill warn">Retire no Espaço</span>'}</div>`).join('')}</div></div>` : ''}</div>`);
}

/* ---------- avisos automáticos ---------- */
const CANAIS = {push:{nome:'Push no celular', icon:'bell'}, whatsapp:{nome:'WhatsApp', icon:'phone'}, email:{nome:'E-mail', icon:'mail'}};
const REGRAS_AVISO = [
  {id:'lembrete', nome:'Lembrete de aula', quando:'2 horas antes de cada aula', canais:['push'], modelo:'Namaskar, {nome}! Sua aula de {atividade} começa às {hora}. Até já.'},
  {id:'vence', nome:'Mensalidade vai vencer', quando:'3 dias antes do vencimento, às 9h', canais:['whatsapp','email'], modelo:'Oi, {nome}! Sua mensalidade de {atividade} ({valor}) vence dia {vencimento}. Pix e cartão no app: rottaguide.com/anirvana'},
  {id:'atraso', nome:'Mensalidade em atraso', quando:'1 dia depois do vencimento, às 9h', canais:['whatsapp'], modelo:'Oi, {nome}, tudo bem? A mensalidade de {mes} ainda está em aberto. Se já pagou, pode desconsiderar.'},
  {id:'recibo', nome:'Pagamento confirmado', quando:'na hora em que o pagamento cai', canais:['email','push'], modelo:'Recebemos seu pagamento de {valor}. Obrigado, {nome}!'},
  {id:'saudade', nome:'Sentimos sua falta', quando:'8 dias sem vir às aulas', canais:['whatsapp'], modelo:'Oi, {nome}! Sentimos sua falta na {atividade}. Quer ajuda para encaixar um horário esta semana?'},
  {id:'troca', nome:'Troca de professor', quando:'quando uma troca de aula é aceita', canais:['push'], modelo:'A aula de {atividade} de {data} será com {professor}.'},
  {id:'evento', nome:'Lembrete de evento', quando:'na véspera, às 18h, para quem se inscreveu', canais:['push','whatsapp'], modelo:'Amanhã tem {evento} às {horaEv}, {nome}! Te esperamos no Espaço.'},
  {id:'nivel', nome:'Subiu de nível nos pontos', quando:'quando o aluno muda de nível', canais:['push'], modelo:'Parabéns, {nome}! Você chegou ao nível {nivel}.'},
  {id:'aniver', nome:'Aniversário', quando:'no dia, às 8h', canais:['whatsapp'], modelo:'Feliz aniversário, {nome}! Que o sol faça chover felicidade no seu novo ciclo.'},
  {id:'inscricao', nome:'Nova inscrição (para a administração)', quando:'na hora em que alguém se inscreve', canais:['push','email'], modelo:'Nova inscrição: {nome} quer {atividade}.'},
];
function regraAviso(id){ const r = REGRAS_AVISO.find(x => x.id === id), c = (S.avisos || {})[id] || {}; return {...r, ativo: c.ativo !== false, canais: c.canais || r.canais}; }
function preencher(modelo, a){
  const m = a && a.mats[0], t = m && m.turmas[0] && TURMA[m.turmas[0]];
  return modelo.replace(/\{(\w+)\}/g, (_, k) => ({nome: a ? a.nome.split(' ')[0] : 'Luana', atividade: m ? ATIV[m.atv].curto.toLowerCase() : 'yoga', hora: t ? t.h : '18:30', valor: m ? brl(valorMat(S,m)) : 'R$ 160,00',
    vencimento: m ? dataBR(proximaCobranca(S,m)) : '03/11', mes: nomeMes(MES_ATUAL).toLowerCase(), data: dataBR(iso(addD(HOJE,5))), professor:'Ana Julia', nivel:'Folha', evento:(S.eventos||[])[0]?.nome || 'Yoga & Café', horaEv:(S.eventos||[])[0]?.h || '08:00'}[k] ?? k));
}
function proximosEnvios(){
  const out = [], agoraMin = HOJE.getHours()*60 + HOJE.getMinutes();
  TURMAS.filter(t => t.dia === HOJE.getDay()).forEach(t => { const [h,m] = t.h.split(':').map(Number); if (h*60+m - 120 > agoraMin){ const n = matriculadosNaTurma(S, t.id).length; if (n) out.push({quando:`hoje ${pad(h-2)}:${pad(m)}`, regra:'lembrete', txt:`${nomeTurma(t)} ${t.h} · ${n} ${n===1?'aluno':'alunos'}`}); } });
  const alvo = addD(HOJE, 3);
  const vencem = S.alunos.filter(a => a.mats.some(m => m.status === 'ativo' && Math.min(m.venc,28) === alvo.getDate()));
  if (vencem.length) out.push({quando:'amanhã 09:00', regra:'vence', txt:vencem.map(a => a.nome.split(' ')[0]).join(', ')});
  const sumidos = S.alunos.map(a => ({a, f:freqStatus(S,a)})).filter(x => x.f.dias === 8);
  if (sumidos.length) out.push({quando:'amanhã 10:00', regra:'saudade', txt:sumidos.map(x => x.a.nome.split(' ')[0]).join(', ')});
  (S.eventos || []).filter(e => e.data > HOJE_ISO && e.inscritos.length).forEach(e => out.push({quando:`${dataBR(iso(addD(pd(e.data), -1)))} 18:00`, regra:'evento', txt:`${e.nome} · ${e.inscritos.length} inscritos`}));
  return out.filter(e => regraAviso(e.regra).ativo);
}
function vAvisos(cab = true){
  const comPush = Object.values(S.pontosAcoes || {}).filter(x => x.notif).length;
  const comWhats = S.alunos.filter(a => (((S.consent || {})[a.id] || {whatsapp:true}).whatsapp)).length;
  const comEmail = S.alunos.filter(a => a.email).length;
  const prox = proximosEnvios();
  return `${cab ? '<div class="pagehead"><div><h1>Avisos automáticos</h1><p>O app avisa sozinho, pelo canal que cada pessoa aceitou. Vocês só ligam e desligam.</p></div></div>' : '<p class="small muted" style="margin-top:-6px">O app avisa sozinho, pelo canal que cada pessoa aceitou. Vocês só ligam e desligam.</p>'}
  <div class="grid g3">${[['push', comPush, 'alunos com o app e os avisos ligados'],['whatsapp', comWhats, 'alunos aceitaram receber'],['email', comEmail, 'alunos com e-mail']].map(([k,n,s]) => `<div class="stat"><span class="k">${ic(CANAIS[k].icon,'sm')}${CANAIS[k].nome}</span><span class="v">${n}</span><span class="d">${s}</span></div>`).join('')}</div>
  <div class="split">
    <div class="card"><div class="card-h"><div><h3>O que o app avisa</h3><span class="sub">Toque em um canal para ligar ou desligar</span></div></div>
      <div class="list">${REGRAS_AVISO.map(r0 => { const r = regraAviso(r0.id); return `<div class="li" style="align-items:flex-start;${r.ativo?'':'opacity:.55'}"><span class="ico-b">${ic(r.ativo?'bell':'pause')}</span><div class="main-c"><span class="t">${r.nome}</span><span class="s">${r.quando}</span>
        <div class="row wrap" style="gap:6px;margin-top:6px">${Object.keys(CANAIS).map(c => `<button class="chip ${r.canais.includes(c)?'on':''}" style="height:30px;font-size:12px" data-act="canalAviso" data-v="${r.id}" data-x="${c}">${ic(CANAIS[c].icon,'sm')}${CANAIS[c].nome}</button>`).join('')}</div></div>
        <div class="end"><button class="btn ghost sm" data-act="previaAviso" data-v="${r.id}">Ver</button><button class="chip ${r.ativo?'on':''}" style="height:30px" data-act="ligaAviso" data-v="${r.id}">${r.ativo?'Ligado':'Desligado'}</button></div></div>`; }).join('')}</div></div>
    <div class="grid" style="align-content:start">
      <div class="card"><div class="card-h"><h3>Próximos envios</h3></div><div class="list">${prox.map(e => `<div class="li"><span class="ico-b">${ic('clock')}</span><div class="main-c"><span class="t">${regraAviso(e.regra).nome}</span><span class="s">${e.quando} · ${escapeH(e.txt)}</span></div></div>`).join('') || '<p class="muted small">Nada agendado para as próximas horas.</p>'}</div></div>
      <div class="card"><div class="card-h"><h3>Enviados</h3></div><div class="list">${(S.enviados || []).slice(-6).reverse().map(e => `<div class="li"><span class="ico-b" style="background:var(--ok-bg);color:var(--ok)">${ic(CANAIS[e.canal].icon)}</span><div class="main-c"><span class="t">${escapeH(e.para)}</span><span class="s">${e.quando} · ${regraAviso(e.regra).nome}</span></div></div>`).join('')}</div></div>
      <div class="alert pri"><span class="ib">${ic('check')}</span><div><div class="t">Dentro da LGPD</div><div class="s">WhatsApp e e-mail só para quem aceitou em "Seus dados". Toda mensagem tem como parar de receber. Push só chega para quem instalou o app e ligou os avisos.</div></div></div>
    </div>
  </div>`;
}
function folhaPreviaAviso(id){
  const r = regraAviso(id), a = alunoPor(S, 'a01'), txt = preencher(r.modelo, a);
  abrirFolha(`${folhaCab(r.nome, r.quando)}
  <div class="stack">
    ${r.canais.includes('push') ? `<div><div class="eyebrow" style="margin-bottom:6px">Push no celular</div><div class="push-mock"><img src="${LOGO_MARK}" alt=""><div><b>Espaço Anirvana</b><span>${escapeH(txt)}</span></div><small>agora</small></div></div>` : ''}
    ${r.canais.includes('whatsapp') ? `<div><div class="eyebrow" style="margin-bottom:6px">WhatsApp</div><div class="zap-mock"><span>${escapeH(txt)}</span><small>10:50 ✓✓</small></div><p class="tiny muted" style="margin-top:6px">No WhatsApp oficial (Meta) cada modelo é aprovado uma vez antes de ser usado.</p></div>` : ''}
    ${r.canais.includes('email') ? `<div><div class="eyebrow" style="margin-bottom:6px">E-mail</div><div class="card flat"><b>${escapeH(r.nome)} · Espaço Anirvana</b><p class="small" style="margin-top:6px">${escapeH(txt)}</p><p class="tiny muted" style="margin-top:8px">Não quer mais receber? Toque aqui para sair.</p></div></div>` : ''}
    <div class="sheet-foot"><button class="btn sec" data-act="fechar">Fechar</button><button class="btn pri" data-act="testeAviso" data-v="${id}">${ic('bell')}Enviar teste para mim</button></div>
  </div>`);
}
function mostrarPush(titulo, texto){
  let p = $('#pushBanner');
  if (!p){ p = document.createElement('div'); p.id = 'pushBanner'; p.className = 'push-banner'; document.body.appendChild(p); }
  p.innerHTML = `<img src="${LOGO_MARK}" alt=""><div><b>${escapeH(titulo)}</b><span>${escapeH(texto)}</span></div><small>agora</small>`;
  p.classList.remove('on'); void p.offsetWidth; p.classList.add('on');
  clearTimeout(p._t); p._t = setTimeout(() => p.classList.remove('on'), 4800);
}
/* caixa de avisos de cada pessoa (sino no topo) */
function caixaDe(){
  const k = UI.role === 'admin' ? 'admin' : UI.role === 'instrutor' ? 'i:' + UI.who.instrutor : 'a:' + UI.who.aluno;
  const fixos = [];
  if (UI.role === 'admin'){ (S.avisosPag || []).filter(x => x.estado === 'aguardando').forEach(x => fixos.push({t:`${alunoPor(S, x.a).nome} avisou que pagou`, s:`${brl(x.valor)} · ${x.metodo === 'cartao' ? 'cartão' : 'Pix'} em ${dataBR(x.d)} · confira e dê baixa`, icon:'badge-check', go:'confirmar'}));
    (S.inscricoes || []).filter(i => i.estado === 'nova').forEach(i => fixos.push({t:`Nova inscrição: ${i.dados.nome}`, s:`${ATIV[i.dados.atv].curto} · ${dataBR(i.d)}`, icon:'user-plus', go:'inscricoes'})); }
  if (UI.role === 'instrutor') pedidosPara(UI.who.instrutor).forEach(s => fixos.push({t:`${PESSOA[s.de].nome} pediu troca`, s:`${nomeTurma(TURMA[s.turma])} · ${dataBR(s.d)}`, icon:'repeat', go:'hoje'}));
  if (UI.role === 'aluno'){ const a = alunoPor(S, UI.who.aluno), px = proximasAulas(a, 1)[0]; if (px) fixos.push({t:'Lembrete de aula', s:`${nomeTurma(px.t)} ${px.d === HOJE_ISO ? 'hoje' : dataBR(px.d)} às ${px.t.h}`, icon:'bell'}); fixos.push({t:`Você tem ${pontosAluno(S, a.id).saldo} pontos`, s:'Veja o que dá para trocar', icon:'gift'}); }
  return [...fixos, ...((S.caixa || {})[k] || [])];
}
function folhaCaixa(){
  const itens = caixaDe();
  abrirFolha(`${folhaCab('Avisos', 'O que chegou para você')}
  <div class="stack"><div class="list">${itens.map(i => `<div class="li ${i.go?'tap':''}" ${i.go?`data-act="irAviso" data-v="${i.go}" role="button" tabindex="0"`:''}><span class="ico-b">${ic(i.icon||'bell')}</span><div class="main-c"><span class="t">${escapeH(i.t)}</span><span class="s">${escapeH(i.s||'')}</span></div>${i.go?ic('chevron-right','sm'):''}</div>`).join('') || '<p class="muted">Nenhum aviso.</p>'}</div>
  ${UI.role === 'admin' ? `<button class="btn sec" data-act="tab" data-v="avisos">${ic('settings','sm')}Configurar avisos automáticos</button>` : ''}</div>`);
}

/* ---------- INSCRIÇÃO ---------- */
const OBJETIVOS = ['Flexibilidade','Dor nas costas','Ansiedade e estresse','Gestação','Condicionamento','Respiração','Espiritualidade','Dormir melhor'];
const COMO = ['Instagram','Indicação','Google','Passei na frente','Evento do Espaço','Outro'];
UI.insc = {passo:1, d:{}};
const idade = nasc => { if (!nasc) return null; const n = pd(nasc); let i = HOJE.getFullYear() - n.getFullYear(); if (HOJE.getMonth() < n.getMonth() || (HOJE.getMonth() === n.getMonth() && HOJE.getDate() < n.getDate())) i--; return i; };
function inscSalvar(){
  const d = UI.insc.d, v = id => { const el = $('#' + id); return el ? el.value.trim() : undefined; }, ck = id => { const el = $('#' + id); return el ? el.checked : undefined; };
  [['nome','iNome'],['nasc','iNasc'],['tel','iTel'],['email','iEmail'],['resp','iResp'],['respTel','iRespTel'],['atv','iAtv'],['plano','iPlano'],['turmas','iTur'],['instr','iInstr'],
   ['exp','iExp'],['obj','iObj'],['temSaude','iTemSaude'],['saude','iSaude'],['emerg','iEmerg'],['emergTel','iEmergTel'],['como','iComo'],['indicou','iIndicou']].forEach(([k,id]) => { const x = v(id); if (x !== undefined) d[k] = x; });
  [['experimental','iExpm'],['saudeOk','iSaudeOk'],['termos','iTermos'],['priv','iPriv'],['imagem','iImagem'],['whats','iWhats']].forEach(([k,id]) => { const x = ck(id); if (x !== undefined) d[k] = x; });
}
function inscValida(p){
  const d = UI.insc.d, falta = [];
  if (p === 1){ if (!d.nome) falta.push('seu nome'); if (!d.nasc) falta.push('a data de nascimento'); if (!d.tel) falta.push('o WhatsApp'); if (idade(d.nasc) !== null && idade(d.nasc) < 18 && !d.resp) falta.push('o nome do responsável'); }
  if (p === 2){ if (!d.atv) falta.push('a atividade'); else if (ATIV[d.atv].vis === 'escolhido' && !d.instr) falta.push('com quem'); }
  if (p === 3){ if (d.temSaude === 'sim' && !d.saude) falta.push('o que precisamos saber da sua saúde'); if (!d.emerg || !d.emergTel) falta.push('um contato de emergência'); }
  if (p === 4){ if (!d.termos) falta.push('aceitar os termos'); if (!d.priv) falta.push('aceitar a política de privacidade'); }
  return falta;
}
function folhaInscricao(){
  const {passo, d} = UI.insc, menor = idade(d.nasc) !== null && idade(d.nasc) < 18;
  const titulos = ['Você','Atividade','Sua ficha','Combinados'];
  const opts = (grp, lista, sel, multi) => `<div class="optgrid">${lista.map(([k,l,i]) => `<button type="button" class="opt ${(multi ? (sel||'').split(',').includes(k) : sel === k)?'on':''}" data-act="${multi?'optMulti':'opt'}" data-grp="${grp}" data-v="${k}">${i?ic(i):''}<span>${l}</span></button>`).join('')}</div><input type="hidden" id="${grp}" value="${escapeH(sel||'')}">`;
  let corpo = '';
  if (passo === 1) corpo = `
    <div class="field"><label for="iNome">Nome completo</label><input class="inp" id="iNome" value="${escapeH(d.nome||'')}" autocomplete="name"></div>
    <div class="grid g2"><div class="field"><label for="iNasc">Nascimento</label><input class="inp" type="date" id="iNasc" value="${escapeH(d.nasc||'')}" data-act-in="inscNasc"></div>
    <div class="field"><label for="iTel">WhatsApp</label><input class="inp" id="iTel" inputmode="tel" placeholder="(41) 9 0000-0000" value="${escapeH(d.tel||'')}" autocomplete="tel"></div></div>
    <div class="field"><label for="iEmail">E-mail (opcional)</label><input class="inp" id="iEmail" type="email" value="${escapeH(d.email||'')}" autocomplete="email"></div>
    <div class="grid g2" id="iRespF" ${menor?'':'hidden'}><div class="field"><label for="iResp">Nome do responsável</label><input class="inp" id="iResp" value="${escapeH(d.resp||'')}"></div><div class="field"><label for="iRespTel">WhatsApp do responsável</label><input class="inp" id="iRespTel" inputmode="tel" value="${escapeH(d.respTel||'')}"></div><p class="small muted" style="grid-column:1/-1">Menor de idade: a inscrição fica no nome do responsável (LGPD).</p></div>`;
  if (passo === 2){
    const a = d.atv && ATIV[d.atv];
    const turmas = a ? TURMAS.filter(t => t.atv === d.atv && !t.aluno) : [];
    corpo = `<div class="field"><label>Qual atividade?</label>${opts('iAtv', Object.entries(ATIV).map(([k,x]) => [k, x.curto, x.icon]), d.atv)}</div>
    ${d.atv === 'yoga' ? `<div class="field"><label>Plano</label>${opts('iPlano', ['1x','2x','3x','4x'].map(k => [k, `${PLANOS_YOGA[k].nome} · ${brl(S.regras.planos[k])}`]), d.plano || '2x')}</div>` : ''}
    ${a && a.vis === 'escolhido' ? `<div class="field"><label>Com quem?</label>${opts('iInstr', EQUIPE.filter(p => p.atvs.includes(d.atv)).map(p => [p.id, p.nome]), d.instr)}</div>` : ''}
    ${turmas.length ? `<div class="field"><label>Horários que você prefere</label>${opts('iTur', turmas.map(t => [t.id, `${DIAS_L[t.dia]} ${t.h} · ${PESSOA[t.instr].nome}`]), d.turmas, true)}</div>` : ''}
    ${a ? `<label class="row small" style="gap:10px;cursor:pointer"><input type="checkbox" id="iExpm" ${d.experimental?'checked':''} style="width:20px;height:20px;accent-color:var(--pri)"> Quero fazer uma aula experimental antes</label>` : ''}`;
  }
  if (passo === 3) corpo = `
    <div class="field"><label>Você já praticou?</label>${opts('iExp', [['nunca','Nunca pratiquei'],['ja','Já pratiquei'],['pratico','Pratico hoje']], d.exp)}</div>
    <div class="field"><label>O que você busca? (pode escolher vários)</label>${opts('iObj', OBJETIVOS.map(o => [o, o]), d.obj, true)}</div>
    <div class="field"><label>Tem alguma lesão, condição de saúde ou está gestante?</label>${opts('iTemSaude', [['nao','Não'],['sim','Sim']], d.temSaude || 'nao')}</div>
    <div class="field" id="iSaudeF" ${d.temSaude === 'sim' ? '' : 'hidden'}><label for="iSaude">Conte para a gente</label><textarea class="inp" id="iSaude" placeholder="Ex.: hérnia na lombar, gestante de 20 semanas">${escapeH(d.saude||'')}</textarea>
      <label class="row small" style="gap:10px;cursor:pointer;margin-top:6px;align-items:flex-start"><input type="checkbox" id="iSaudeOk" ${d.saudeOk!==false?'checked':''} style="width:20px;height:20px;flex:none;accent-color:var(--pri)"> Autorizo as instrutoras da minha atividade a verem essas informações, para cuidar da minha segurança na prática.</label></div>
    <div class="grid g2"><div class="field"><label for="iEmerg">Contato de emergência</label><input class="inp" id="iEmerg" placeholder="Nome" value="${escapeH(d.emerg||'')}"></div><div class="field"><label for="iEmergTel">Telefone</label><input class="inp" id="iEmergTel" inputmode="tel" value="${escapeH(d.emergTel||'')}"></div></div>
    <div class="field"><label>Como conheceu o Espaço?</label>${opts('iComo', COMO.map(c => [c, c]), d.como)}</div>
    <div class="field" id="iIndicouF" ${d.como === 'Indicação' ? '' : 'hidden'}><label for="iIndicou">Quem indicou? (a pessoa ganha pontos)</label><input class="inp" id="iIndicou" value="${escapeH(d.indicou||'')}"></div>`;
  if (passo === 4) corpo = `
    <div class="card flat"><div class="eyebrow" style="margin-bottom:6px">Sua inscrição</div><p><b>${escapeH(d.nome)}</b>${d.resp?` · responsável ${escapeH(d.resp)}`:''}</p><p class="small muted">${d.atv ? ATIV[d.atv].nome : ''}${d.plano && d.atv === 'yoga' ? ' · ' + PLANOS_YOGA[d.plano].nome : ''}${d.turmas ? ' · ' + d.turmas.split(',').filter(Boolean).map(t => `${DIAS[TURMA[t].dia]} ${TURMA[t].h}`).join(', ') : ''}${d.experimental ? ' · com aula experimental' : ''}</p></div>
    ${[['iTermos','termos','Li e aceito os termos de uso do Espaço', true],['iPriv','priv','Li e aceito a política de privacidade (como o Espaço cuida dos meus dados)', true],['iWhats','whats','Quero receber avisos de aula e pagamento pelo WhatsApp', false],['iImagem','imagem','Autorizo fotos minhas nas redes do Espaço (posso tirar depois)', false]].map(([id,k,t,obr]) => `<label class="row" style="gap:12px;cursor:pointer;align-items:flex-start;font-size:14.5px"><input type="checkbox" id="${id}" ${d[k] || (k==='whats' && d[k]===undefined) ? 'checked' : ''} style="width:22px;height:22px;flex:none;accent-color:var(--pri)"> <span>${t}${obr?' <span class="tiny muted">(obrigatório)</span>':''}</span></label>`).join('')}
    <p class="small muted">Depois de enviar, a equipe confirma seu horário pelo WhatsApp. A primeira cobrança só acontece quando a matrícula for confirmada.</p>`;
  if (UI.insc.minha){
    abrirFolha(`${folhaCab('Sua ficha', 'Ajuda a instrutora a cuidar de você na prática. Vale +30 pontos.')}
    <div class="stack" id="inscCorpo">${corpo}<div class="sheet-foot"><button class="btn sec" data-act="fechar">Depois</button><button class="btn pri" data-act="salvarMinhaFicha">${ic('check')}Salvar ficha</button></div></div>`, {wide:true});
    return;
  }
  abrirFolha(`${folhaCab('Inscrição no Espaço Anirvana', `Passo ${passo} de 4 · ${titulos[passo-1]}`)}
  <div class="passos-insc">${titulos.map((t,i) => `<span class="${i+1<passo?'feito':i+1===passo?'agora':''}"></span>`).join('')}</div>
  <div class="stack" id="inscCorpo">${corpo}
    <div class="sheet-foot">${passo > 1 ? `<button class="btn sec" data-act="inscPasso" data-v="-1">Voltar</button>` : `<button class="btn sec" data-act="fechar">Cancelar</button>`}${passo < 4 ? `<button class="btn pri" data-act="inscPasso" data-v="1">Continuar${ic('arrow-right','sm')}</button>` : `<button class="btn sol" data-act="inscEnviar">${ic('check')}Enviar inscrição</button>`}</div>
  </div>`, {wide:true});
}
function fichaDe(a){ return a.ficha || {}; }
function blocoFicha(a, modo){
  const f = fichaDe(a), i = idade(a.nasc);
  const verSaude = modo === 'admin' || f.saudeOk;
  const linhas = [
    ['Idade', i !== null ? `${i} anos` : '—'],
    ['E-mail', a.email || '—'],
    ...(a.resp ? [['Responsável', `${a.resp}${a.respTel ? ' · ' + a.respTel : ''}`]] : []),
    ['Experiência', {nunca:'Nunca praticou', ja:'Já praticou', pratico:'Pratica hoje'}[f.exp] || '—'],
    ['Busca', (f.obj || '').split(',').filter(Boolean).join(', ') || '—'],
    ['Emergência', f.emerg ? `${f.emerg} · ${f.emergTel || ''}` : '—'],
    ['Conheceu por', f.como ? f.como + (f.indicou ? ` (${f.indicou})` : '') : '—'],
  ];
  const saude = f.temSaude === 'sim' ? (verSaude ? `<div class="alert warn"><span class="ib">${ic('heart-pulse')}</span><div><div class="t">Saúde · cuidado na prática</div><div class="s">${escapeH(f.saude)}${modo === 'admin' && !f.saudeOk ? '<br><b>Não autorizou mostrar para as instrutoras.</b>' : ''}</div></div></div>` : `<p class="small muted">${ic('pause','sm')} Tem informação de saúde, mas a pessoa não autorizou mostrar para a equipe. Fale com a administração.</p>`) : `<p class="small muted">Sem restrição de saúde informada.</p>`;
  const cs = (S.consent || {})[a.id] || {whatsapp: f.whats !== false, imagem: !!f.imagem};
  return `<div><div class="eyebrow" style="margin-bottom:6px">Ficha de inscrição</div>${saude}<div class="list" style="margin-top:6px">${linhas.map(([k,v]) => `<div class="li" style="padding:8px 4px"><span class="small muted" style="width:110px;flex:none">${k}</span><span class="small" style="flex:1;min-width:0">${escapeH(v)}</span></div>`).join('')}</div>
    <div class="row wrap small" style="margin-top:8px;gap:8px"><span class="pill ${cs.whatsapp?'ok':'neu'}">${ic(cs.whatsapp?'check':'x')}WhatsApp</span><span class="pill ${cs.imagem?'ok':'neu'}">${ic(cs.imagem?'check':'x')}Uso de imagem</span><span class="pill ${f.termos!==false?'ok':'neu'}">${ic('check')}Termos aceitos</span></div></div>`;
}
function cardInscricoes(){
  const novas = (S.inscricoes || []).filter(i => i.estado === 'nova');
  return `<div class="card" style="border-top:4px solid var(--sol)"><div class="card-h"><div><h3>Novas inscrições</h3><span class="sub">${novas.length ? `${novas.length} esperando confirmação` : 'Nenhuma esperando'}</span></div>
    <div class="row wrap"><button class="btn sec sm" data-act="linkInscricao">${ic('copy','sm')}Link da inscrição</button><label class="btn ghost sm" style="cursor:pointer">${ic('layers','sm')}Importar do Google Forms<input type="file" accept=".csv,text/csv" id="csvForms" hidden></label></div></div>
    <div class="list">${novas.map(i => `<div class="li">${av(i.dados.nome)}<div class="main-c"><span class="t">${escapeH(i.dados.nome)}${i.origem==='forms'?' <span class="tag">Google Forms</span>':''}</span><span class="s">${ATIV[i.dados.atv]?.nome || i.dados.atv}${i.dados.plano && i.dados.atv==='yoga' ? ' · ' + i.dados.plano : ''} · ${dataBR(i.d)}${i.dados.como ? ' · via ' + escapeH(i.dados.como) : ''}${i.dados.experimental ? ' · quer aula experimental' : ''}</span></div><div class="end"><button class="btn ghost sm" data-act="verInscricao" data-v="${i.id}">Ver ficha</button><button class="btn pri sm" data-act="confirmarInscricao" data-v="${i.id}">Confirmar</button></div></div>`).join('') || '<p class="small muted">Quando alguém se inscrever pelo link, aparece aqui com a ficha completa.</p>'}</div></div>`;
}
/* Google Forms → planilha → CSV: lê cabeçalhos pelo sentido (nome, whatsapp, e-mail, nascimento, atividade...) */
function lerCSV(txt){
  const linhas = [], sep = (txt.split('\n')[0].match(/;/g)||[]).length > (txt.split('\n')[0].match(/,/g)||[]).length ? ';' : ',';
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < txt.length; i++){
    const c = txt[i];
    if (aspas){ if (c === '"' && txt[i+1] === '"'){ campo += '"'; i++; } else if (c === '"') aspas = false; else campo += c; }
    else if (c === '"') aspas = true;
    else if (c === sep){ linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r'){ if (c === '\r' && txt[i+1] === '\n') i++; linha.push(campo); campo = ''; if (linha.some(x => x.trim())) linhas.push(linha); linha = []; }
    else campo += c;
  }
  linha.push(campo); if (linha.some(x => x.trim())) linhas.push(linha);
  return linhas;
}
function importarForms(txt){
  const L = lerCSV(txt); if (L.length < 2) return 0;
  const cab = L[0].map(h => h.toLowerCase());
  const col = (...ps) => cab.findIndex(h => ps.some(p => h.includes(p)));
  const c = {nome:col('nome'), tel:col('whats','telefone','celular'), email:col('mail'), nasc:col('nasc'), atv:col('atividade','modalidade','aula'), como:col('conheceu','soube'), saude:col('saúde','saude','lesão','lesao','restri')};
  const achaAtv = s => { s = (s||'').toLowerCase(); const k = Object.keys(ATIV).find(k => s.includes(ATIV[k].curto.toLowerCase()) || s.includes(k)); return k || 'yoga'; };
  const dataISO = s => { const m = (s||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? `${m[3]}-${pad(m[2])}-${pad(m[1])}` : ''; };
  let n = 0;
  L.slice(1).forEach(r => {
    const nome = (r[c.nome] || '').trim(); if (!nome) return;
    const saude = c.saude >= 0 ? (r[c.saude] || '').trim() : '';
    (S.inscricoes = S.inscricoes || []).push({id:'in'+(S.seq++), d:HOJE_ISO, estado:'nova', origem:'forms', dados:{nome, tel:(r[c.tel]||'').trim(), email:(r[c.email]||'').trim(), nasc:dataISO(r[c.nasc]), atv:achaAtv(r[c.atv]), plano:'2x', como:(r[c.como]||'').trim(),
      temSaude: saude && !/^n(ão|ao)?$/i.test(saude) ? 'sim' : 'nao', saude, saudeOk:false, termos:false, priv:false}});
    n++;
  });
  return n;
}
function confirmarInscricao(id){
  const i = S.inscricoes.find(x => x.id === id), d = i.dados;
  const aid = 'a' + (S.seq++);
  const plano = d.atv === 'yoga' ? (d.plano || '2x') : null;
  S.alunos.push({id:aid, nome:d.nome, desde:HOJE_ISO, obs: d.resp ? `Responsável: ${d.resp}` : '', status:'ativo', tel:d.tel || '', email:d.email || '', nasc:d.nasc || '', resp:d.resp || '', respTel:d.respTel || '',
    ficha:{exp:d.exp, obj:d.obj, temSaude:d.temSaude, saude:d.saude, saudeOk:d.saudeOk !== false && d.temSaude === 'sim', emerg:d.emerg, emergTel:d.emergTel, como:d.como, indicou:d.indicou, whats:d.whats !== false, imagem:!!d.imagem, termos:!!d.termos, completa: !!(d.exp && d.emerg)},
    mats:[{id:aid+'-0', atv:d.atv, plano, valor: plano ? null : (S.alunos.flatMap(a => a.mats).find(m => m.atv === d.atv)?.valor || 150), turmas:(d.turmas||'').split(',').filter(Boolean), venc:Math.min(28, HOJE.getDate()), metodo:'pix', cartaoFim:null, instr:d.instr || null, status:'ativo', inicio:HOJE_ISO}]});
  (S.consent = S.consent || {})[aid] = {whatsapp: d.whats !== false, imagem: !!d.imagem, whatsappEm: HOJE_ISO, imagemEm: HOJE_ISO};
  i.estado = 'confirmada'; i.aluno = aid;
  /* quem indicou ganha os pontos */
  if (d.indicou){ const q = d.indicou.trim().toLowerCase(), quem = S.alunos.find(x => x.id !== aid && (x.nome.toLowerCase() === q || x.nome.split(' ')[0].toLowerCase() === q.split(' ')[0] && q.split(' ').length === 1 || x.nome.toLowerCase().startsWith(q))); if (quem) ganhar('indicar', quem.id); }
  /* a equipe da atividade recebe o aviso com a ficha */
  S.caixa = S.caixa || {};
  EQUIPE.filter(p => d.instr ? p.id === d.instr : p.atvs.includes(d.atv)).forEach(p => (S.caixa['i:' + p.id] = S.caixa['i:' + p.id] || []).unshift({t:`Aluno novo: ${d.nome}`, s:`${ATIV[d.atv].curto} · a ficha já está no app`, icon:'user-plus', go:'alunos'}));
  (S.enviados = S.enviados || []).push({para:d.nome, canal:'whatsapp', regra:'inscricao', quando:`hoje ${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`});
  return {aid, quem: EQUIPE.filter(p => d.instr ? p.id === d.instr : p.atvs.includes(d.atv)).map(p => p.nome)};
}

/* ============================================================
   EVENTOS — a Dessa cria, divulga (push, WhatsApp, e-mail e arte
   para o Instagram) e acompanha as inscrições num lugar só
   ============================================================ */
const ALVOS = {
  todos:  {nome:'Todos os alunos', f:() => true},
  yoga:   {nome:'Yoga e meditação', f:a => a.mats.some(m => ['yoga','particular','gestantes','meditacao'].includes(m.atv))},
  artes:  {nome:'Aquarela, música e inglês', f:a => a.mats.some(m => ['aquarela','musicalizacao','violao','ingles'].includes(m.atv))},
  eventos:{nome:'Quem já veio em eventos', f:a => (S.eventos || []).some(e => e.inscritos.some(i => i.a === a.id))},
  sumidos:{nome:'Quem anda sumido', f:a => freqStatus(S, a).st !== 'ok'},
};
const ICONES_EV = [['coffee','Café'],['sun','Sol'],['music','Música'],['flower-2','Flor'],['moon','Lua'],['leaf','Natureza'],['heart','Coração'],['sparkles','Festa']];
UI.div = {vis:'eventos', alvo:'todos', canais:['push','whatsapp']};
const alcance = (alvo, canais) => {
  const al = S.alunos.filter(a => a.mats.some(m => m.status !== 'cancelado') && ALVOS[alvo].f(a));
  const c = {
    push: al.filter(a => ((S.pontosAcoes || {})[a.id] || {}).notif),
    whatsapp: al.filter(a => ((S.consent || {})[a.id] || {}).whatsapp),
    email: al.filter(a => a.email),
  };
  const unicos = new Set(canais.flatMap(k => c[k].map(a => a.id)));
  return {al, c, unicos};
};
const linkEvento = e => `rottaguide.com/anirvana#evento-${e.id}`;
const textoEvento = e => `${e.nome} no Espaço Anirvana! ${DIAS_L[pd(e.data).getDay()]}, ${dataBR(e.data)} às ${e.h}. ${brl(e.valor)} por pessoa, ${e.vagas - e.inscritos.length - (e.externos||0)} vagas. Garanta a sua no app: ${linkEvento(e)}`;
const legendaInsta = e => `✨ ${e.nome} no Espaço Anirvana\n\n📅 ${DIAS_L[pd(e.data).getDay()]}, ${dataBR(e.data)} às ${e.h}\n📍 ${ESPACO.endereco} · Pontal do Sul\n💛 ${brl(e.valor)} por pessoa\n\n${e.desc}\n\nVagas limitadas. Inscrição pelo link na bio.\n\n#espacoanirvana #pontaldosul #yoga #litoralparanaense`;

function vDivulgar(){
  const vis = UI.div.vis;
  return `<div class="pagehead"><div><h1>Divulgar</h1><p>Eventos, avisos automáticos e pontos dos alunos. Tudo que chega no celular de quem pratica sai daqui.</p></div>
    <div class="row wrap"><div class="seg">${[['eventos','Eventos'],['avisos','Avisos automáticos'],['pontos','Pontos']].map(([k,l]) => `<button class="${vis===k?'on':''}" data-act="divVis" data-v="${k}">${l}</button>`).join('')}</div>${vis==='eventos'?`<button class="btn sol" data-act="novoEvento">${ic('calendar-plus')}Novo evento</button>`:''}</div></div>
  ${vis === 'avisos' ? vAvisos(false) : vis === 'pontos' ? vPontosAdmin() : vEventosAdmin()}`;
}
function vEventosAdmin(){
  const evs = (S.eventos || []).slice().sort((a,b) => a.data < b.data ? -1 : 1);
  const passos = [['calendar-plus','Crie','Nome, dia, valor e vagas'],['megaphone','Divulgue','Push, WhatsApp e e-mail para quem aceitou'],['image','Poste','A arte do Instagram sai pronta'],['bell','Lembre','Na véspera o app avisa os inscritos']];
  return `<div class="card flat"><div class="como-ev">${passos.map(([i,t,s],n) => `<div><span class="ico-b">${ic(i)}</span><b>${n+1}. ${t}</b><span class="small muted">${s}</span></div>`).join('')}</div></div>
  ${evs.map(e => { const pago = e.inscritos.filter(i => i.pago).length, tot = e.inscritos.length + (e.externos||0), pct = Math.min(1, tot / e.vagas), passou = e.data < HOJE_ISO;
    return `<div class="card pad-lg ev-card" style="--c:var(--sol)">
      <div class="row wrap" style="gap:14px;align-items:flex-start">
        <span class="ico-b ev-ico">${ic(e.icon || 'sparkles','xl')}</span>
        <div style="flex:1;min-width:0"><div class="eyebrow">${passou ? 'Já aconteceu' : DIAS_L[pd(e.data).getDay()] + ', ' + dataBR(e.data) + ' às ' + e.h}</div><h2 style="font-size:24px;margin-top:2px">${escapeH(e.nome)}</h2><p class="small muted" style="margin-top:4px;max-width:60ch">${escapeH(e.desc)}</p></div>
        <div class="stat" style="min-width:170px"><span class="k">${ic('ticket','sm')}Inscritos</span><span class="v">${tot} <small style="font-size:15px;color:var(--muted)">de ${e.vagas}</small></span><span class="d">${brl(e.valor * (pago + (e.externos||0)))} recebidos</span></div>
      </div>
      <div class="hbar" style="margin-top:12px"><span class="small">${e.vagas - tot > 0 ? `${e.vagas - tot} vagas livres` : 'Lotado'}</span><span class="small muted">${Math.round(pct*100)}%</span><div class="track"><span style="width:${RM?Math.round(pct*100):0}%;background:linear-gradient(90deg,var(--sol),var(--acafrao))" data-w="${Math.round(pct*100)}"></span></div></div>
      <p class="small muted" style="margin-top:4px">${e.divulgado ? `${ic('check','sm')} Divulgado em ${dataBR(e.divulgado)} por ${(e.canais||[]).map(c => CANAIS[c].nome.toLowerCase()).join(' e ')} para ${ALVOS[e.alvo||'todos'].nome.toLowerCase()}` : `${ic('circle-alert','sm')} Ainda não divulgado`}</p>
      <div class="row wrap" style="margin-top:12px"><button class="btn ${e.divulgado?'sec':'sol'}" data-act="divulgarEvento" data-v="${e.id}">${ic('megaphone')}${e.divulgado ? 'Divulgar de novo' : 'Divulgar'}</button><button class="btn sec" data-act="arteEvento" data-v="${e.id}">${ic('image')}Arte para o Instagram</button><button class="btn ghost" data-act="inscritosEvento" data-v="${e.id}">${ic('users','sm')}Inscritos</button><button class="btn ghost" data-act="copiar" data-v="https://${linkEvento(e)}">${ic('copy','sm')}Link</button></div>
    </div>`; }).join('') || '<p class="muted">Nenhum evento ainda.</p>'}`;
}
function folhaEvento(){
  abrirFolha(`${folhaCab('Novo evento', 'Depois de salvar, você escolhe para quem divulgar.')}
  <form class="stack" id="fEvento">
    <div class="field"><label for="eNome">Nome do evento</label><input class="inp" id="eNome" required placeholder="Ex.: Roda de mantras na lua cheia"></div>
    <div class="grid g2"><div class="field"><label for="eData">Dia</label><input class="inp" type="date" id="eData" value="${iso(addD(HOJE, 16))}" min="${HOJE_ISO}"></div><div class="field"><label for="eHora">Hora</label><input class="inp" type="time" id="eHora" value="18:30"></div></div>
    <div class="grid g2"><div class="field"><label for="eValor">Valor por pessoa</label><input class="inp num" id="eValor" inputmode="decimal" value="50,00"></div><div class="field"><label for="eVagas">Vagas</label><input class="inp num" id="eVagas" inputmode="numeric" value="20"></div></div>
    <div class="field"><label for="eDesc">Conte como vai ser</label><textarea class="inp" id="eDesc" placeholder="Uma ou duas frases. É o texto que vai na divulgação.">Mantras, respiração e meditação guiada sob a lua cheia, com chá quentinho no final.</textarea></div>
    <div class="field"><label>Símbolo</label><div class="optgrid">${ICONES_EV.map(([k,l],i) => `<button type="button" class="opt ${i===4?'on':''}" data-act="opt" data-grp="eIcon" data-v="${k}">${ic(k)}<span>${l}</span></button>`).join('')}</div><input type="hidden" id="eIcon" value="moon"></div>
    <div class="sheet-foot"><button type="button" class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" type="submit">${ic('check')}Salvar e divulgar</button></div>
  </form>`);
}
function folhaDivulgar(id){
  const e = S.eventos.find(x => x.id === id), {alvo, canais} = UI.div, A = alcance(alvo, canais);
  const msg = UI.div.msg ?? textoEvento(e);
  abrirFolha(`${folhaCab(`Divulgar ${escapeH(e.nome)}`, 'Só recebe quem aceitou aquele canal. Ninguém recebe duas vezes.')}
  <div class="stack">
    <div class="field"><label>Para quem</label><div class="optgrid">${Object.entries(ALVOS).map(([k,x]) => `<button type="button" class="opt ${alvo===k?'on':''}" data-act="divAlvo" data-v="${k}" data-ev="${id}"><span>${x.nome}<br><span class="tiny muted">${alcance(k, canais).al.length} alunos</span></span></button>`).join('')}</div></div>
    <div class="field"><label>Por onde</label><div class="row wrap" style="gap:8px">${Object.entries(CANAIS).map(([k,c]) => `<button type="button" class="chip ${canais.includes(k)?'on':''}" data-act="divCanal" data-v="${k}" data-ev="${id}">${ic(c.icon,'sm')}${c.nome} <span class="n">${A.c[k].length}</span></button>`).join('')}</div>
      <span class="help">Push: quem instalou o app e ligou os avisos · WhatsApp: quem aceitou · E-mail: quem cadastrou</span></div>
    <div class="field"><label for="dMsg">Mensagem</label><textarea class="inp" id="dMsg" rows="4" data-act-in="divMsg">${escapeH(msg)}</textarea></div>
    <div><div class="eyebrow" style="margin-bottom:6px">Como chega no celular</div><div class="push-mock"><img src="${LOGO_MARK}" alt=""><div><b>${escapeH(e.nome)} · Espaço Anirvana</b><span id="dPrev">${escapeH(msg)}</span></div><small>agora</small></div></div>
    <label class="row small" style="gap:10px;cursor:pointer"><input type="checkbox" id="dLembrete" checked style="width:20px;height:20px;accent-color:var(--pri)"> Lembrar quem se inscrever na véspera, às 18h</label>
    <div class="sheet-foot"><button class="btn sec" data-act="arteEvento" data-v="${id}">${ic('image')}Arte para o Instagram</button><button class="btn sol" data-act="enviarDivulgacao" data-v="${id}" ${A.unicos.size ? '' : 'disabled'}>${ic('send')}Enviar para ${A.unicos.size} ${A.unicos.size===1?'pessoa':'pessoas'}</button></div>
  </div>`, {wide:true});
}
function folhaInscritosEv(id){
  const e = S.eventos.find(x => x.id === id);
  abrirFolha(`${folhaCab(`Inscritos · ${escapeH(e.nome)}`, `${dataBR(e.data)} às ${e.h} · ${e.inscritos.length + (e.externos||0)} de ${e.vagas} vagas`)}
  <div class="stack"><div class="list">${e.inscritos.map(i => { const a = alunoPor(S, i.a); return `<div class="li">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">inscrição em ${dataBR(i.d)}</span></div>${i.pago ? `<span class="pill ok">${ic('check')}Pago</span>` : `${i.aviso ? `<span class="pill pri">${ic('clock')}Avisou que pagou</span>` : ''}<button class="btn ${i.aviso ? 'pri' : 'sec'} sm" data-act="evPago" data-v="${id}" data-x="${i.a}">${i.aviso ? 'Dar baixa' : 'Recebi'}</button>`}</div>`; }).join('')}
    ${e.externos ? `<div class="li"><span class="ico-b">${ic('user-plus')}</span><div class="main-c"><span class="t">${e.externos} ${e.externos===1?'pessoa':'pessoas'} de fora</span><span class="s">vieram pelo link do Instagram, pagas no Pix</span></div><span class="pill ok">${ic('check')}Pago</span></div>` : ''}</div>
  <div class="alert pri"><span class="ib">${ic('bell')}</span><div><div class="t">Lembrete agendado</div><div class="s">${dataBR(iso(addD(pd(e.data), -1)))} às 18:00, para todos os inscritos, por push e WhatsApp.</div></div></div></div>`);
}
/* arte para o Instagram, desenhada no próprio celular (story 1080×1920 ou post 1080×1350) */
function folhaArte(id){
  const e = S.eventos.find(x => x.id === id), fmt = UI.div.fmt || 'story';
  abrirFolha(`${folhaCab('Arte para o Instagram', 'Pronta com as cores e a logo do Espaço. Baixe e poste.')}
  <div class="stack">
    <div class="seg" style="align-self:start">${[['story','Story'],['post','Post']].map(([k,l]) => `<button class="${fmt===k?'on':''}" data-act="arteFmt" data-v="${k}" data-ev="${id}">${l}</button>`).join('')}</div>
    <div class="arte-prev ${fmt}"><canvas id="arteCv" width="1080" height="${fmt==='story'?1920:1350}" aria-label="Arte do evento ${escapeH(e.nome)}"></canvas></div>
    <div class="field"><label>Legenda</label><div class="card flat small" style="white-space:pre-line;line-height:1.5">${escapeH(legendaInsta(e))}</div></div>
    <div class="sheet-foot"><button class="btn sec" data-act="copiar" data-v="${escapeH(legendaInsta(e))}">${ic('copy','sm')}Copiar legenda</button><button class="btn sol" data-act="baixarArte" data-v="${id}">${ic('download')}Baixar imagem</button></div>
  </div>`, {wide:true});
  desenharArte(e, fmt);
}
async function desenharArte(e, fmt){
  const cv = $('#arteCv'); if (!cv) return;
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, st = fmt === 'story';
  try{ await Promise.all(['800 90px Montserrat','400 90px Anton','600 40px Figtree','700 40px Figtree'].map(f => document.fonts.load(f))); }catch(_){}
  g.fillStyle = '#F5E3B8'; g.fillRect(0,0,W,H);
  const cx = W/2, cy = st ? 560 : 430;
  g.save(); g.translate(cx, cy); g.fillStyle = 'rgba(255,185,135,.8)';
  for (let a = 0; a < 360; a += 16){ g.beginPath(); g.moveTo(0,0); g.arc(0,0,2600,(a+3)*Math.PI/180,(a+10)*Math.PI/180); g.closePath(); g.fill(); }
  g.restore();
  [[300,'#F47B2D'],[240,'#FFC526'],[180,'#9EC83C']].forEach(([r,c]) => { g.beginPath(); g.arc(cx, cy + 40, r, Math.PI, 0); g.lineWidth = 34; g.strokeStyle = c; g.lineCap = 'round'; g.stroke(); });
  const logo = new Image(); logo.src = LOGO_MARK; await new Promise(r => { logo.onload = r; logo.onerror = r; });
  if (logo.width){ const lw = 230, lh = lw * logo.height / logo.width; g.drawImage(logo, cx - lw/2, cy - lh + 10, lw, lh); }
  const card = {x:70, y: st ? 930 : 690, w:W-140, h: st ? 860 : 600};
  g.fillStyle = '#FFF9EC'; rr(g, card.x, card.y, card.w, card.h, 48); g.fill();
  g.textAlign = 'center'; g.fillStyle = '#0E7266'; g.font = `400 ${st?84:68}px Anton, sans-serif`; g.fillText('Namaskar!', cx, card.y + (st?120:96));
  g.fillStyle = '#2C2B2B'; g.font = `800 ${st?92:76}px Montserrat, sans-serif`;
  let y = linhas(g, e.nome, cx, card.y + (st?240:190), card.w - 100, st?100:84, 2);
  g.fillStyle = '#4A443C'; g.font = `500 ${st?40:34}px Figtree, sans-serif`;
  y = linhas(g, e.desc, cx, y + (st?30:16), card.w - 140, st?54:46, st?3:2);
  const dia = `${DIAS_L[pd(e.data).getDay()]}, ${dataBR(e.data)} · ${e.h}`;
  g.font = `700 ${st?44:38}px Figtree, sans-serif`; const pw = g.measureText(dia).width + 90, ph = st?92:80, py = y + (st?40:24);
  g.fillStyle = '#0E7266'; rr(g, cx - pw/2, py, pw, ph, ph/2); g.fill();
  g.fillStyle = '#fff'; g.fillText(dia, cx, py + ph/2 + (st?15:13));
  g.fillStyle = '#F47B2D'; g.font = `800 ${st?54:46}px Montserrat, sans-serif`; g.fillText(`${brl(e.valor)} por pessoa`, cx, py + ph + (st?90:72));
  g.fillStyle = '#2C2B2B'; g.font = `600 ${st?38:32}px Figtree, sans-serif`;
  g.fillText(`${ESPACO.endereco} · Pontal do Sul`, cx, H - (st?120:70));
  g.fillStyle = '#4A443C'; g.font = `500 ${st?32:28}px Figtree, sans-serif`; g.fillText(st ? 'Inscrição pelo link · @' + ESPACO.instagram : '@' + ESPACO.instagram, cx, H - (st?70:30));
}
function rr(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function linhas(g, txt, x, y, max, lh, maxL){
  const pal = String(txt).split(/\s+/), out = []; let l = '';
  pal.forEach(p => { const t = l ? l + ' ' + p : p; if (g.measureText(t).width > max && l){ out.push(l); l = p; } else l = t; });
  if (l) out.push(l);
  const fim = out.slice(0, maxL); if (out.length > maxL) fim[maxL-1] = fim[maxL-1].replace(/\s*\S+$/, '') + '…';
  fim.forEach((t, i) => g.fillText(t, x, y + i*lh));
  return y + (fim.length - 1) * lh + lh * .4;
}
/* lado do aluno: eventos abertos e reserva com Pix */
function folhaReservaEv(id){
  const e = S.eventos.find(x => x.id === id);
  abrirFolha(`${folhaCab(`Sua vaga no ${escapeH(e.nome)}`, `${DIAS_L[pd(e.data).getDay()]}, ${dataBR(e.data)} às ${e.h}`)}
  <div class="stack"><div class="qr">${qrSVG(id.length*313)}</div><p class="tiny muted" style="text-align:center">QR de exemplo · no app de verdade vem do banco</p>
    <p class="tiny muted">${ic('check','sm')} A administração confere o Pix e confirma a sua vaga.</p><div class="sheet-foot"><button class="btn sec" data-act="reservaEv" data-v="${id}" data-x="0">Pago no dia</button><button class="btn sol" data-act="reservaEv" data-v="${id}" data-x="1">${ic('send')}Paguei ${brl(e.valor)}, avisar o Espaço</button></div></div>`);
}

/* pontos — visão da administração */
function vPontosAdmin(){
  const ranking = S.alunos.map(a => ({a, P:pontosAluno(S, a.id)})).sort((x,y) => y.P.total - x.P.total);
  const inst = S.alunos.filter(a => ((S.pontosAcoes||{})[a.id]||{}).instalar).length, notif = S.alunos.filter(a => ((S.pontosAcoes||{})[a.id]||{}).notif).length;
  const pend = (S.trocas || []).filter(t => t.estado === 'pendente');
  return `<div class="grid g3">
    <div class="stat"><span class="k">${ic('smartphone','sm')}Instalaram o app</span><span class="v">${inst} <small style="font-size:15px;color:var(--muted)">de ${S.alunos.length}</small></span><span class="d">${Math.round(inst/S.alunos.length*100)}% dos alunos</span></div>
    <div class="stat"><span class="k">${ic('bell','sm')}Avisos ligados</span><span class="v">${notif}</span><span class="d">recebem push de aula e evento</span></div>
    <div class="stat"><span class="k" style="${pend.length?'color:var(--sol-ink)':''}">${ic('gift','sm')}Presentes para entregar</span><span class="v">${pend.length}</span><span class="d">trocas de pontos</span></div></div>
  <div class="split">
    <div class="card"><div class="card-h"><div><h3>Quem mais pratica</h3><span class="sub">Pontos de prática, pagamento em dia e app instalado</span></div></div>
      <div class="list">${ranking.slice(0,10).map(({a,P},i) => `<div class="li tap" data-act="verAluno" data-v="${a.id}" role="button" tabindex="0"><span class="rank">${i+1}</span>${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">${P.nivel}${P.acoes.instalar ? '' : ' · ainda sem o app'}</span></div><b class="num">${P.total}</b></div>`).join('')}</div></div>
    <div class="grid" style="align-content:start">
      ${pend.length ? `<div class="card" style="border-top:4px solid var(--sol)"><div class="card-h"><h3>Entregar no Espaço</h3></div><div class="list">${pend.map(t => `<div class="li">${av(alunoPor(S,t.a).nome)}<div class="main-c"><span class="t">${escapeH(alunoPor(S,t.a).nome)}</span><span class="s">${PREMIOS.find(p => p.id === t.premio).nome} · pediu em ${dataBR(t.d)}</span></div><button class="btn pri sm" data-act="entregarTroca" data-v="${t.id}">Entreguei</button></div>`).join('')}</div></div>` : ''}
      <div class="card"><div class="card-h"><div><h3>Cartaz para a parede</h3><span class="sub">Aponte a câmera, instale e ganhe 50 pontos</span></div></div><div class="row" style="gap:16px;align-items:center"><div class="qr" style="width:120px;flex:none">${qrSVG(777)}</div><div class="small"><b>rottaguide.com/anirvana</b><br>Instale o app do Espaço e ganhe seus primeiros pontos.</div></div></div>
      <div class="card"><div class="card-h"><h3>Como ganha ponto</h3></div><div class="list">${REGRAS_PONTOS.map(r => `<div class="li"><span class="ico-b">${ic(r.icon)}</span><div class="main-c"><span class="t">${r.nome}</span></div><b class="num">+${r.pts}</b></div>`).join('')}</div></div>
      <div class="card"><div class="card-h"><h3>Presentes</h3></div><div class="list">${PREMIOS.map(p => `<div class="li"><span class="ico-b" style="color:var(--sol-ink)">${ic(p.icon)}</span><div class="main-c"><span class="t">${p.nome}</span></div><b class="num">${p.custo}</b></div>`).join('')}</div><p class="tiny muted" style="margin-top:8px">Níveis: ${NIVEIS.map(([n,m]) => `${n} ${m}`).join(' · ')}</p></div>
    </div>
  </div>`;
}

function ganhar(k, aid = UI.who.aluno){ const P = (S.pontosAcoes = S.pontosAcoes || {}); P[aid] = P[aid] || {}; if (!P[aid][k]){ P[aid][k] = HOJE_ISO; salvar(); } }

/* backup mensal em Excel — regra do app */
function cardBackup(){
  const bk = (S.backups || []).slice().reverse(), prox = iso(new Date(HOJE.getFullYear(), HOJE.getMonth() + 1, 1));
  return `<div class="card" style="border-top:4px solid var(--pri)"><div class="card-h"><div><h3>Backup mensal em Excel</h3><span class="sub">Regra do app: todo dia 1º sai uma cópia de tudo, no formato das planilhas de vocês</span></div><span class="pill ok">${ic('check')}Ligado</span></div>
    <div class="list">
      <div class="li"><span class="ico-b">${ic('calendar')}</span><div class="main-c"><span class="t">Próximo: ${dataBR(prox)} às 03:00</span><span class="s">Vai para ${ESPACO.email} e fica guardado na pasta de backups. Ao fechar um mês, sai outro.</span></div></div>
      <div class="li"><span class="ico-b">${ic('layers')}</span><div class="main-c"><span class="t">O que vai no arquivo</span><span class="s">Controle financeiro (uma aba por mês e o ANO), Mensalidades com o fechamento da yoga, Lojinha com fiado e fornecedores, alunos e fichas, presenças, equipe, eventos e pontos</span></div></div>
      ${bk.slice(0, 3).map(b => `<div class="li"><span class="ico-b" style="background:var(--ok-bg);color:var(--ok)">${ic('check')}</span><div class="main-c"><span class="t">Backup de ${nomeMes(b.mes).toLowerCase()}</span><span class="s">${dataBR(b.d)} às ${b.h} · ${b.por === 'automático' ? `automático, enviado para ${ESPACO.email}` : `baixado por ${escapeH(b.por)}`}</span></div></div>`).join('')}
    </div>
    <div class="row wrap" style="margin-top:12px"><button class="btn pri" data-act="baixarBackup">${ic('download')}Baixar backup agora (.xlsx)</button></div>
    <p class="tiny muted" style="margin-top:8px">Abre no Excel, no Google Planilhas e no Numbers. Tem dados de saúde dos alunos: guarde com cuidado e não mande por WhatsApp.</p>
  </div>`;
}
function baixarArquivo(bytes, nome, tipo){
  const b = new Blob([bytes], {type:tipo}), a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ============================================================
   BALANÇO POR CATEGORIA — um gráfico para cada coisa:
   mensalidades, lojinha, Airbnb, eventos, cantina, coworking,
   despesa fixa, social mídia, limpeza, manutenção, melhorias, extra
   ============================================================ */
const GRUPOS_CAT = [
  {id:'mensalidades', nome:'Mensalidades', icon:'wallet', tipo:'in', dica:'parte do Espaço, já sem a parte da equipe'},
  {id:'lojinha', nome:'Lojinha', icon:'store', tipo:'in', dica:'parte do Espaço, já sem a parte dos fornecedores'},
  {id:'Airbnb', nome:'Airbnb', icon:'bed', tipo:'ambos', dica:'hospedagem que entra × café, roupa de cama e lavanderia'},
  {id:'Eventos', nome:'Eventos', icon:'ticket', tipo:'ambos', dica:'ingressos × estrutura e materiais'},
  {id:'Cantina', nome:'Cantina', icon:'coffee', tipo:'ambos', dica:'vendas × insumos'},
  {id:'Coworking', nome:'Coworking', icon:'grid-2x2', tipo:'in', dica:'mensalistas'},
  {id:'Despesa Fixa', nome:'Despesas fixas', icon:'landmark', tipo:'out', dica:'luz, internet, Nilson, Sara, MEI, taxas'},
  {id:'Social Mídia e Publicidade', nome:'Social mídia e publicidade', icon:'trending-up', tipo:'out', dica:'Valéria, Instagram, Google, Canva'},
  {id:'Limpeza', nome:'Limpeza', icon:'sparkle', tipo:'out', dica:'material e diarista'},
  {id:'Manutenção', nome:'Manutenção', icon:'settings', tipo:'out', dica:'lâmpadas, papelaria, consertos'},
  {id:'Utensílios/eletro/melhorias', nome:'Melhorias e utensílios', icon:'package', tipo:'out', dica:'tudo o que é novo'},
  {id:'Extra', nome:'Extra', icon:'circle-alert', tipo:'ambos', dica:'o que não se encaixa nas outras'},
];
UI.catFoco = 'lojinha';
function seriesCategorias(){
  const meses = mesesDoBackup(MES_ATUAL), BS = meses.map(m => balancoMes(S, m));
  const soma = (ls, cat) => r2(ls.filter(l => l.cat === cat).reduce((s, l) => s + l.valor, 0));
  const out = {};
  GRUPOS_CAT.forEach(g => {
    out[g.id] = BS.map(b => {
      if (g.id === 'mensalidades') return {mes:b.mes, e:b.rec.ea, s:0, bruto:b.rec.bruto, equipe:b.rec.instr};
      if (g.id === 'lojinha') return {mes:b.mes, e:b.loja.ea, s:0, bruto:b.loja.bruto, forn:b.loja.forn, n:b.loja.n};
      return {mes:b.mes, e:soma(b.manualIn, g.id), s:soma(b.saidas, g.id)};
    });
  });
  return {meses, BS, out};
}
const valorCat = (g, x) => g.tipo === 'in' ? x.e : g.tipo === 'out' ? x.s : x.e - x.s;
function graficoCat(g, serie, {alto = 96, W = 300, sel = UI.balMes, eixo = false} = {}){
  const padL = eixo ? 46 : 4, padB = 18, padT = 6, w = W - padL - 4, H = alto;
  const max = Math.max(1, ...serie.map(x => Math.max(g.tipo !== 'out' ? x.e : 0, g.tipo !== 'in' ? x.s : 0)));
  const passo = max > 12000 ? 4000 : max > 6000 ? 2000 : max > 3000 ? 1000 : max > 1200 ? 500 : max > 400 ? 200 : 100, topo = Math.ceil(max / passo) * passo;
  const y = v => padT + (H - padT - padB) * (1 - v / topo);
  const n = 12, bw = w / n, dois = g.tipo === 'ambos', bar = Math.max(3, Math.min(eixo ? 18 : 12, (dois ? bw / 2 : bw) - (eixo ? 6 : 4)));
  const rb = (x, yy, ww, hh) => { if (hh < .5) return ''; const r = Math.min(4, ww / 2, hh); return `M${x},${yy+hh} L${x},${yy+r} Q${x},${yy} ${x+r},${yy} L${x+ww-r},${yy} Q${x+ww},${yy} ${x+ww},${yy+r} L${x+ww},${yy+hh} Z`; };
  let s = '';
  if (eixo) for (let v = 0; v <= topo; v += passo) s += `<line class="gl" x1="${padL}" x2="${W-4}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${padL-8}" y="${y(v)+4}" text-anchor="end">${v >= 1000 ? (v/1000).toLocaleString('pt-BR') + ' mil' : v}</text>`;
  else s += `<line class="gl" x1="${padL}" x2="${W-4}" y1="${y(0)}" y2="${y(0)}"/>`;
  for (let i = 0; i < n; i++){
    const x = serie[i], x0 = padL + i * bw, cx = x0 + bw / 2, on = x && x.mes === sel ? ' sel' : '';
    s += `<rect class="hit" data-i="${i}" x="${x0+.5}" y="${padT}" width="${bw-1}" height="${H-padT-padB}" rx="6"/>`;
    if (!x){ s += `<rect class="future" x="${cx-bar/2}" y="${y(0)-2}" width="${bar}" height="2" rx="1"/>`; }
    else if (dois){ s += `<path class="bin${on}" d="${rb(cx - bar - 1, y(x.e), bar, y(0) - y(x.e))}"/><path class="bout${on}" d="${rb(cx + 1, y(x.s), bar, y(0) - y(x.s))}"/>`; }
    else { const v = g.tipo === 'in' ? x.e : x.s; s += `<path class="${g.tipo === 'in' ? 'bin' : 'bout'}${on}" d="${rb(cx - bar/2, y(v), bar, y(0) - y(v))}"/>`; }
    s += `<text class="ax" x="${cx}" y="${H-4}" text-anchor="middle" style="font-size:${eixo ? 11 : 9}px${x && x.mes === sel ? ';font-weight:800;fill:var(--ink)' : ''}">${eixo ? MESES_C[i] : MESES_C[i][0].toUpperCase()}</text>`;
  }
  return `<div class="chart chart-cat ${eixo ? '' : 'mini'}" data-cat="${escapeH(g.id)}" data-serie='${escapeH(JSON.stringify(serie))}'><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeH(g.nome)} mês a mês em 2026">${s}</svg><div class="tip" role="status"></div></div>`;
}
function ligarCategorias(){
  $$('.chart-cat').forEach(ch => {
    const serie = JSON.parse(ch.dataset.serie), g = GRUPOS_CAT.find(x => x.id === ch.dataset.cat), tip = ch.querySelector('.tip');
    const mostrar = (i, el) => {
      const x = serie[i]; $$('.hit', ch).forEach(h => h.classList.toggle('on', h === el));
      if (!x){ tip.innerHTML = `<b>${MESES[i]}</b><div>Ainda não chegou</div>`; }
      else tip.innerHTML = `<b>${nomeMes(x.mes)}</b>` + (g.tipo !== 'out' ? `<div class="r"><span>Entrou</span><span>${brl(x.e)}</span></div>` : '') + (g.tipo !== 'in' ? `<div class="r"><span>Saiu</span><span>${brl(x.s)}</span></div>` : '')
        + (g.tipo === 'ambos' ? `<div class="r" style="border-top:1px solid rgba(255,255,255,.2);margin-top:4px;padding-top:4px"><b>Resultado</b><b>${brl(x.e - x.s)}</b></div>` : '')
        + (g.id === 'lojinha' ? `<div class="r"><span>Vendido</span><span>${brl(x.bruto)}</span></div><div class="r"><span>Fornecedores</span><span>${brl(x.forn)}</span></div>` : '')
        + (g.id === 'mensalidades' ? `<div class="r"><span>Recebido</span><span>${brl(x.bruto)}</span></div><div class="r"><span>Equipe</span><span>${brl(x.equipe)}</span></div>` : '');
      const r = el.getBoundingClientRect(), cr = ch.getBoundingClientRect();
      let left = r.left - cr.left + r.width / 2 - 95; left = Math.max(-6, Math.min(cr.width - 184, left));
      tip.style.left = left + 'px'; tip.style.top = ch.classList.contains('mini') ? '-60px' : '-8px'; tip.classList.add('on');
    };
    $$('.hit', ch).forEach(h => { h.addEventListener('mouseenter', () => mostrar(+h.dataset.i, h)); h.addEventListener('click', e => { e.stopPropagation(); mostrar(+h.dataset.i, h); }); });
    ch.addEventListener('mouseleave', () => { tip.classList.remove('on'); $$('.hit', ch).forEach(h => h.classList.remove('on')); });
  });
}
function vBalancoCategorias(){
  const {meses, BS, out} = seriesCategorias(), sel = UI.balMes, iSel = meses.indexOf(sel), mesAnt = meses[iSel - 1];
  const chipsMes = MESES.map((m, i) => { const k = `2026-${pad(i+1)}`; return `<button class="chip ${sel===k?'on':''}" data-act="balMes" data-v="${k}" ${k>MES_ATUAL?'disabled style="opacity:.4"':''}>${MESES_C[i]}</button>`; }).join('');
  const resumo = g => { const se = out[g.id], x = se[iSel], ant = se[iSel - 1], v = valorCat(g, x), tot = se.reduce((t, y) => t + valorCat(g, y), 0), dif = ant ? v - valorCat(g, ant) : null;
    return {v, tot, media:tot / se.length, dif}; };
  const difTxt = (g, dif) => dif === null || Math.abs(dif) < .5 ? '' : `${dif > 0 ? '▲' : '▼'} ${brl(Math.abs(dif))} ${g.tipo === 'out' ? (dif > 0 ? 'a mais de gasto' : 'a menos de gasto') : dif > 0 ? 'a mais' : 'a menos'} que ${MESES_C[+mesAnt.slice(5) - 1]}`;
  const foco = GRUPOS_CAT.find(g => g.id === UI.catFoco) || GRUPOS_CAT[0], F = resumo(foco), b = BS[iSel];
  /* o que compõe a categoria em foco no mês escolhido */
  let detalhe = '';
  if (foco.id === 'mensalidades') detalhe = hbarras(b.rec.linhas.filter(l => l.ea > 0).sort((x, y) => y.ea - x.ea).map(l => ({lab:ATIV[l.atv].nome, v:l.ea})), 'var(--chart-in)');
  else if (foco.id === 'lojinha'){ const pf = {}; b.loja.vendas.forEach(v => { const p = partesVenda(v); const f = FORN[v.forn]; const k = f ? (f.id === 'ea' ? 'Anirvana (próprio)' : f.curto || f.nome) : v.forn; pf[k] = (pf[k] || 0) + p.ea; }); detalhe = hbarras(Object.entries(pf).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([lab, v]) => ({lab, v})), 'var(--chart-in)'); }
  else { const ls = [...b.manualIn.filter(l => l.cat === foco.id).map(l => ({...l, t:'e'})), ...b.saidas.filter(l => l.cat === foco.id).map(l => ({...l, t:'s'}))].sort((x, y) => x.d < y.d ? -1 : 1);
    detalhe = `<div class="list">${ls.map(l => `<div class="li"><span class="ico-b" style="${l.t === 'e' ? 'background:var(--ok-bg);color:var(--ok)' : ''}">${ic(l.t === 'e' ? 'trending-up' : 'trending-down')}</span><div class="main-c"><span class="t">${escapeH(l.desc)}</span><span class="s">${dataBR(l.d)} · ${l.t === 'e' ? 'entrou' : 'saiu'}</span></div><b class="num">${l.t === 'e' ? '' : '−'}${brl(l.valor)}</b></div>`).join('') || '<p class="small muted">Nada lançado nesta categoria no mês.</p>'}</div>`; }
  const totE = foco.tipo === 'ambos' ? out[foco.id].reduce((t, y) => t + y.e, 0) : 0, totS = foco.tipo === 'ambos' ? out[foco.id].reduce((t, y) => t + y.s, 0) : 0;
  return `<div class="chips">${chipsMes}</div>
  <div class="card pad-lg"><div class="card-h"><div><h3>${ic(foco.icon, 'sm')} ${foco.nome}</h3><span class="sub">${foco.dica} · toque num mês para ver os números</span></div>
    ${foco.tipo === 'ambos' ? `<div class="ckey"><span><i style="background:var(--chart-in)"></i>Entrou</span><span><i style="background:var(--chart-out)"></i>Saiu</span></div>` : ''}</div>
    <div class="grid g4 foco-stats" style="margin-bottom:12px">
      <div class="stat"><span class="k">${nomeMes(sel)}</span><span class="v" style="${foco.tipo === 'ambos' ? `color:${F.v >= 0 ? 'var(--ok)' : 'var(--bad)'}` : ''}">${brl0(F.v)}</span><span class="d">${difTxt(foco, F.dif) || (foco.tipo === 'ambos' ? 'resultado do mês' : '&nbsp;')}</span></div>
      <div class="stat"><span class="k">No ano</span><span class="v">${brl0(F.tot)}</span><span class="d">${foco.tipo === 'ambos' ? `entrou ${brl0(totE)} · saiu ${brl0(totS)}` : `jan a ${mesCurto(MES_ATUAL)}`}</span></div>
      <div class="stat"><span class="k">Média por mês</span><span class="v">${brl0(F.media)}</span><span class="d">${meses.length} meses</span></div>
      <div class="stat"><span class="k">Peso no mês</span><span class="v">${(() => { const base = foco.tipo === 'out' ? b.saidasTot : b.entradas; const v = foco.tipo === 'ambos' ? out[foco.id][iSel].e : F.v; return base ? Math.round(Math.abs(v) / base * 100) + '%' : '—'; })()}</span><span class="d">${foco.tipo === 'out' ? 'das saídas do mês' : 'das entradas do mês'}</span></div>
    </div>
    ${(() => { const cel = matchMedia('(max-width:759px)').matches; return graficoCat(foco, out[foco.id], cel ? {alto:210, W:380, eixo:true} : {alto:240, W:720, eixo:true}); })()}
    <div class="eyebrow" style="margin:14px 0 6px">${foco.id === 'lojinha' ? `Parte do Espaço por fornecedor em ${nomeMes(sel).toLowerCase()}` : foco.id === 'mensalidades' ? `Parte do Espaço por atividade em ${nomeMes(sel).toLowerCase()}` : `Lançamentos de ${nomeMes(sel).toLowerCase()}`}</div>${detalhe}
  </div>
  <div class="cats">${GRUPOS_CAT.map(g => { const R = resumo(g); return `<button class="card cat-card ${g.id === foco.id ? 'on' : ''}" data-act="catFoco" data-v="${escapeH(g.id)}" aria-pressed="${g.id === foco.id}">
      <div class="cat-h"><span class="ico-b" style="${g.tipo === 'in' ? 'color:var(--chart-in)' : g.tipo === 'out' ? 'color:var(--chart-out)' : ''}">${ic(g.icon)}</span><div style="min-width:0;flex:1"><b>${g.nome}</b><span>${g.tipo === 'in' ? 'entrada' : g.tipo === 'out' ? 'saída' : 'entra e sai'}</span></div></div>
      <div class="cat-v"><b class="num" style="${g.tipo === 'ambos' ? `color:${R.v >= 0 ? 'var(--ok)' : 'var(--bad)'}` : ''}">${brl0(R.v)}</b><span>${mesCurto(sel)} · ano ${brl0(R.tot)}</span></div>
      ${graficoCat(g, out[g.id])}
      <span class="cat-d">${difTxt(g, R.dif) || '&nbsp;'}</span>
    </button>`; }).join('')}</div>
  <p class="small muted">Verde-azulado é o que entrou; laranja é o que saiu. Mensalidades e lojinha mostram só a parte que fica com o Espaço. Airbnb, eventos, cantina e extra mostram as duas coisas e o resultado.</p>`;
}
