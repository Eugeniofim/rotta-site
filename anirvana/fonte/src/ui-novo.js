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

/* ============================================================
   EVENTOS — a Dessa cria, divulga (push, WhatsApp, e-mail e arte
   para o Instagram) e acompanha as inscrições num lugar só
   ============================================================ */
const ALVOS = {
  todos:  {nome:'Todos os alunos', f:() => true},
  yoga:   {nome:'Yoga e meditação', f:a => a.mats.some(m => ['yoga','particular','gestantes','meditacao'].includes(m.atv))},
  artes:  {nome:'Aquarela e música', f:a => a.mats.some(m => ['aquarela','musicalizacao','violao'].includes(m.atv))},
  eventos:{nome:'Quem já veio em eventos', f:a => (S.eventos || []).some(e => e.inscritos.some(i => i.a === a.id))},
  sumidos:{nome:'Quem anda sumido', f:a => freqStatus(S, a).st !== 'ok'},
};
const ICONES_EV = [['coffee','Café'],['sun','Sol'],['music','Música'],['flower-2','Flor'],['moon','Lua'],['leaf','Natureza'],['heart','Coração'],['sparkles','Festa']];
UI.div = {vis:'escrever', alvo:'todos', canais:['push','whatsapp']};
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
  return `<div class="pagehead"><div><h1>Divulgar</h1><p>Avisos para todos, eventos, avisos automáticos e pontos. Tudo que chega no celular de alunos e professoras sai daqui.</p></div>
    <div class="row wrap"><div class="seg">${[['escrever','Escrever aviso'],['eventos','Eventos'],['avisos','Avisos automáticos'],['pontos','Pontos']].map(([k,l]) => `<button class="${vis===k?'on':''}" data-act="divVis" data-v="${k}">${l}</button>`).join('')}</div>${vis==='eventos'?`<button class="btn sol" data-act="novoEvento">${ic('calendar-plus')}Novo evento</button>`:''}</div></div>
  ${vis === 'escrever' ? vEscreverAviso() : vis === 'avisos' ? vAvisos(false) : vis === 'pontos' ? vPontosAdmin() : vEventosAdmin()}`;
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
      <div class="row wrap" style="margin-top:12px"><button class="btn ${e.divulgado?'sec':'sol'}" data-act="divulgarEvento" data-v="${e.id}">${ic('megaphone')}${e.divulgado ? 'Divulgar de novo' : 'Divulgar'}</button><button class="btn sec" data-act="arteEvento" data-v="${e.id}">${ic('image')}Arte para o Instagram</button><button class="btn ghost" data-act="inscritosEvento" data-v="${e.id}">${ic('users','sm')}Inscritos</button><button class="btn ghost" data-act="copiar" data-v="https://${linkEvento(e)}">${ic('copy','sm')}Link</button><button class="btn ghost" data-act="editarEvento" data-v="${e.id}">${ic('pencil','sm')}Editar</button></div>
    </div>`; }).join('') || '<p class="muted">Nenhum evento ainda.</p>'}`;
}
function folhaEvento(id){
  const e = id ? S.eventos.find(x => x.id === id) : null, v = (k, pad_) => escapeH(e ? e[k] : pad_);
  abrirFolha(`${folhaCab(e ? `Editar ${escapeH(e.nome)}` : 'Novo evento', e ? 'Quem já se inscreveu continua inscrito.' : 'Depois de salvar, você escolhe para quem divulgar.')}
  <form class="stack" id="fEvento" data-id="${id || ''}">
    <div class="field"><label for="eNome">Nome do evento</label><input class="inp" id="eNome" required placeholder="Ex.: Roda de mantras na lua cheia" value="${v('nome', '')}"></div>
    <div class="grid g2"><div class="field"><label for="eData">Dia</label><input class="inp" type="date" id="eData" value="${v('data', iso(addD(HOJE, 16)))}" min="${HOJE_ISO}"></div><div class="field"><label for="eHora">Hora</label><input class="inp" type="time" id="eHora" value="${v('h', '18:30')}"></div></div>
    <div class="grid g2"><div class="field"><label for="eValor">Valor por pessoa</label><input class="inp num" id="eValor" inputmode="decimal" value="${e ? String(e.valor.toFixed(2)).replace('.', ',') : '50,00'}"></div><div class="field"><label for="eVagas">Vagas</label><input class="inp num" id="eVagas" inputmode="numeric" value="${v('vagas', 20)}"></div></div>
    <div class="field"><label for="eDesc">Conte como vai ser</label><textarea class="inp" id="eDesc" placeholder="Uma ou duas frases. É o texto que vai na divulgação.">${e ? escapeH(e.desc || '') : 'Mantras, respiração e meditação guiada sob a lua cheia, com chá quentinho no final.'}</textarea></div>
    <div class="field"><label>Símbolo</label><div class="optgrid">${ICONES_EV.map(([k,l],i) => `<button type="button" class="opt ${(e ? e.icon === k : i===4)?'on':''}" data-act="opt" data-grp="eIcon" data-v="${k}">${ic(k)}<span>${l}</span></button>`).join('')}</div><input type="hidden" id="eIcon" value="${e ? e.icon || 'sparkles' : 'moon'}"></div>
    <div class="sheet-foot">${e ? `<button type="button" class="btn ghost" data-act="excluirEvento" data-v="${id}">${ic('x','sm')}Excluir</button>` : `<button type="button" class="btn sec" data-act="fechar">Cancelar</button>`}<button class="btn pri" type="submit">${ic('check')}${e ? 'Salvar' : 'Salvar e divulgar'}</button></div>
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
      <div class="li"><span class="ico-b">${ic('calendar')}</span><div class="main-c"><span class="t">Próximo: ${dataBR(prox)} às 03:00</span><span class="s">Sai sozinho e vai para três lugares: a pasta <b>Backups Anirvana</b> no Google Drive de vocês, o e-mail ${ESPACO.email} e o cofre do app (Supabase, São Paulo). Ao fechar um mês, sai outro.</span></div></div>
      <div class="li"><span class="ico-b">${ic('layers')}</span><div class="main-c"><span class="t">O que vai no arquivo</span><span class="s">Controle financeiro (uma aba por mês e o ANO), Mensalidades com o fechamento da yoga, Lojinha com fiado e fornecedores, alunos e fichas, presenças, equipe, eventos e pontos</span></div></div>
      ${bk.slice(0, 3).map(b => `<div class="li"><span class="ico-b" style="background:var(--ok-bg);color:var(--ok)">${ic('check')}</span><div class="main-c"><span class="t">Backup de ${nomeMes(b.mes).toLowerCase()}</span><span class="s">${dataBR(b.d)} às ${b.h} · ${b.por === 'automático' ? `automático, enviado para ${ESPACO.email}` : `baixado por ${escapeH(b.por)}`}</span></div></div>`).join('')}
    </div>
    <div class="row wrap" style="margin-top:12px"><button class="btn pri" data-act="baixarBackup">${ic('download')}Baixar backup agora (.xlsx)</button><button class="btn sec" data-act="backupDrive">${ic('share-2')}Salvar no Google Drive</button></div>
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
  {id:'Inglês', nome:'Inglês', icon:'languages', tipo:'in', dica:'lançado à mão: a parte do Espaço'},
  {id:'Massagem terapêutica', nome:'Massagem terapêutica', icon:'hand-heart', tipo:'in', dica:'lançado à mão: a parte do Espaço'},
  {id:'Terapias integrais', nome:'Terapias integrais', icon:'sprout', tipo:'in', dica:'lançado à mão: a parte do Espaço'},
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

/* ============================================================
   CÓDIGO DE ACESSO PESSOAL DE CADA INSTRUTOR
   a administração gera e troca; o instrutor digita uma vez por aparelho
   ============================================================ */
const LEMBRAR = CHAVE + '_aparelho';
const lerLembrar = () => { try{ return JSON.parse(localStorage.getItem(LEMBRAR) || '{}'); }catch(e){ return {}; } };
const gravarLembrar = o => { try{ localStorage.setItem(LEMBRAR, JSON.stringify(o)); }catch(e){} };
UI.codigoOk = {}; UI.tentativas = {};
function instrutorLiberado(pid){ if (PESSOA[pid]?.ativo === false) return false; const c = (S.codigos || {})[pid]; if (!c) return false; return UI.codigoOk[pid] === c.v || lerLembrar()[pid] === c.v; }
function folhaCodigo(pid){
  const p = PESSOA[pid], T = UI.tentativas[pid] || {n:0, ate:0}, bloq = T.ate > Date.now();
  abrirFolha(`${folhaCab(`Olá, ${escapeH(p.nome)}`, 'Digite o seu código de acesso pessoal')}
  <div class="stack" style="justify-items:center;text-align:center">
    <span class="ico-b" style="width:64px;height:64px;border-radius:20px;background:color-mix(in srgb,${p.cor} 16%,var(--surface));color:${p.cor}">${ic('lock','xl')}</span>
    <input class="inp codigo" id="codigoIn" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="Código de 6 números" ${bloq ? 'disabled' : ''}>
    <p class="small ${T.n ? '' : 'muted'}" id="codigoMsg" style="${T.n ? 'color:var(--bad);font-weight:600' : ''}">${bloq ? 'Muitas tentativas. Espere 15 minutos ou peça um código novo para a Dessa ou o Vitor.' : T.n ? `Código não confere. Restam ${5 - T.n} tentativas.` : 'São 6 números. Quem tem é só você.'}</p>
    <label class="row small" style="gap:10px;cursor:pointer"><input type="checkbox" id="codigoLembrar" checked style="width:20px;height:20px;accent-color:var(--pri)"> Lembrar neste celular</label>
    <button class="btn pri block" data-act="conferirCodigo" data-v="${pid}" ${bloq ? 'disabled' : ''}>${ic('check')}Entrar</button>
    <p class="tiny muted">Esqueceu? A administração gera um código novo em Escola → Equipe.<br>${S.codigos[pid] ? `<b>Demonstração:</b> o código de ${escapeH(p.nome)} é ${S.codigos[pid].c}.` : "<b>Ainda não tem código: peça para a administração.</b>"}</p>
  </div>`);
  setTimeout(() => $('#codigoIn')?.focus(), 350);
}
function conferirCodigo(pid){
  const T = UI.tentativas[pid] = UI.tentativas[pid] || {n:0, ate:0};
  if (T.ate > Date.now()) return false;
  const dig = ($('#codigoIn')?.value || '').replace(/\D/g, '');
  if (dig === S.codigos[pid].c){
    T.n = 0; UI.codigoOk[pid] = S.codigos[pid].v;
    const L = lerLembrar(); if ($('#codigoLembrar')?.checked) L[pid] = S.codigos[pid].v; else delete L[pid]; gravarLembrar(L);
    return true;
  }
  T.n++; if (T.n >= 5){ T.ate = Date.now() + 15 * 60e3; T.n = 0; }
  folhaCodigo(pid); return false;
}
function novoCodigo(pid){
  let c; do { c = String(100000 + Math.floor(Math.random() * 900000)); } while (/^(\d)\1+$/.test(c) || '0123456789'.includes(c) || '9876543210'.includes(c));
  const ant = S.codigos[pid] || {v:0};
  S.codigos[pid] = {c, v:ant.v + 1, em:HOJE_ISO}; delete UI.codigoOk[pid];
  const L = lerLembrar(); delete L[pid]; gravarLembrar(L);   /* o código antigo para de valer em todo aparelho */
  salvar();
  return c;
}
function folhaCodigoNovo(pid){
  const p = PESSOA[pid], c = S.codigos[pid].c;
  const msg = `Oi, ${p.nome}! Seu código de acesso ao app do Espaço Anirvana é ${c}. Ele é pessoal: não passe para ninguém. Abra rottaguide.com/anirvana, toque no seu nome e digite o código.`;
  abrirFolha(`${folhaCab(`Código de ${escapeH(p.nome)}`, 'Mande só para ela. O código antigo já não vale mais.')}
  <div class="stack" style="justify-items:center;text-align:center">
    <div class="codigo-grande num">${c.slice(0,3)} ${c.slice(3)}</div>
    <div class="sheet-foot" style="width:100%"><button class="btn sec" data-act="copiar" data-v="${c}">${ic('copy','sm')}Copiar código</button><button class="btn sol" data-act="copiar" data-v="${escapeH(msg)}">${ic('send','sm')}Copiar mensagem para o WhatsApp</button></div>
    <p class="tiny muted">No app de verdade o banco guarda só uma versão embaralhada do código (hash): nem a administração consegue ver de novo depois de fechar esta tela. Para trocar, é só gerar outro.</p>
  </div>`);
}

/* ============================================================
   EQUIPE: cadastrar e excluir instrutores
   ============================================================ */
function folhaInstrutor(id){
  const p = id ? PESSOA[id] : {nome:'', nomeCompleto:'', atvs:[], tel:'', pix:'', bio:''};
  abrirFolha(`${folhaCab(id ? `Editar ${escapeH(p.nome)}` : 'Cadastrar instrutor', id ? 'Mudou atividade, telefone ou Pix? Atualize aqui.' : 'Ao salvar, o app cria o código de acesso pessoal dela.')}
  <form class="stack" id="fEquipe" data-id="${id || ''}">
    <div class="grid g2"><div class="field"><label for="eqNome">Nome (como aparece no app)</label><input class="inp" id="eqNome" required maxlength="30" value="${escapeH(p.nome)}" placeholder="Ex.: Giorgia"></div>
      <div class="field"><label for="eqCompleto">Nome completo</label><input class="inp" id="eqCompleto" maxlength="80" value="${escapeH(p.nomeCompleto || '')}"></div></div>
    <div class="field"><label>O que ela dá no Espaço</label><div class="optgrid">${Object.entries(ATIV).map(([k,a]) => `<button type="button" class="opt ${p.atvs.includes(k)?'on':''}" data-act="optMulti" data-grp="eqAtvs" data-v="${k}">${ic(a.icon)}<span>${a.curto}</span></button>`).join('')}</div><input type="hidden" id="eqAtvs" value="${p.atvs.join(',')}"><span class="help">Ela só vê os alunos dessas atividades (e os particulares que a escolherem).</span></div>
    <div class="grid g2"><div class="field"><label for="eqTel">WhatsApp</label><input class="inp" id="eqTel" inputmode="tel" value="${escapeH(p.tel || '')}" placeholder="(41) 9 0000-0000"></div>
      <div class="field"><label for="eqPix">Chave Pix (para o repasse)</label><input class="inp" id="eqPix" value="${escapeH(p.pix || '')}"></div></div>
    <div class="field"><label for="eqBio">Sobre ela (aparece para os alunos)</label><textarea class="inp" id="eqBio" maxlength="300" placeholder="Formação, estilo de aula...">${escapeH(p.bio || '')}</textarea></div>
    <div class="sheet-foot">${id ? `<button type="button" class="btn ghost" data-act="excluirInstrutor" data-v="${id}">${ic('x','sm')}Excluir da equipe</button>` : `<button type="button" class="btn sec" data-act="fechar">Cancelar</button>`}<button class="btn pri" type="submit">${ic('check')}${id ? 'Salvar' : 'Cadastrar e gerar código'}</button></div>
  </form>`);
}
function folhaExcluirInstrutor(pid){
  const p = PESSOA[pid], ts = TURMAS.filter(t => t.instr === pid), parts = S.alunos.filter(a => a.mats.some(m => m.instr === pid && m.status !== 'cancelado'));
  const atvs = [...new Set([...ts.map(t => t.atv), ...parts.flatMap(a => a.mats.filter(m => m.instr === pid).map(m => m.atv))])];
  const quem = EQUIPE.filter(x => x.id !== pid && atvs.every(a => x.atvs.includes(a)));
  const precisa = ts.length || parts.length;
  abrirFolha(`${folhaCab(`Excluir ${escapeH(p.nome)} da equipe`, 'Ela para de entrar no app na hora. As aulas que deu e os repasses ficam no histórico.')}
  <div class="stack">
    ${precisa ? `<div class="alert warn"><span class="ib">${ic('triangle-alert')}</span><div><div class="t">${p.nome} tem ${ts.length ? `${ts.length} ${ts.length === 1 ? 'turma' : 'turmas'}` : ''}${ts.length && parts.length ? ' e ' : ''}${parts.length ? `${parts.length} ${parts.length === 1 ? 'aluno particular' : 'alunos particulares'}` : ''}</div><div class="s">${ts.map(t => `${nomeTurma(t)} ${DIAS[t.dia]} ${t.h}`).join(' · ')}${parts.length ? (ts.length ? ' · ' : '') + parts.map(a => a.nome.split(' ')[0]).join(', ') : ''}</div></div></div>
      <div class="field"><label>Quem assume</label>${quem.length ? `<div class="optgrid">${quem.map((x, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-act="opt" data-grp="exRep" data-v="${x.id}">${escapeH(x.nome)}</button>`).join('')}</div><input type="hidden" id="exRep" value="${quem[0].id}">` : `<p class="small muted">Ninguém da equipe dá ${atvs.map(a => ATIV[a].curto.toLowerCase()).join(' e ')}. Cadastre quem vai assumir antes, ou as turmas ficam sem instrutor até vocês escolherem.</p><input type="hidden" id="exRep" value="">`}</div>` : '<p class="small muted">Ela não tem turma nem aluno particular agora.</p>'}
    <div class="sheet-foot"><button class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" data-act="confirmarExclusao" data-v="${pid}" style="background:var(--bad)">${ic('x')}Excluir ${escapeH(p.nome)}</button></div>
  </div>`);
}
function excluirInstrutor(pid, rep){
  const p = PESSOA[pid];
  S.turmaInstr = S.turmaInstr || {};
  TURMAS.filter(t => t.instr === pid).forEach(t => { if (rep) S.turmaInstr[t.id] = rep; });
  if (rep) S.alunos.forEach(a => a.mats.forEach(m => { if (m.instr === pid) m.instr = rep; }));
  p.ativo = false; p.saiu = HOJE_ISO;
  if (S.codigos) delete S.codigos[pid];
  const L = lerLembrar(); delete L[pid]; gravarLembrar(L); delete UI.codigoOk[pid];
  ligarEquipe(); salvar(); fecharFolha(); reRender();
  avisar(`${p.nome} saiu da equipe${rep ? `. ${PESSOA[rep].nome} assume as turmas dela` : ''}.`, 'check');
}

/* ============================================================
   ESCOLA → ATIVIDADES: cadastrar atividade nova e os horários
   ============================================================ */
const ICONES_ATV = ['sun','flower-2','person-standing','heart','leaf','wind','sparkles','footprints','activity','palette','music','guitar','baby','user','book-open','coffee'];
const CORES_ATV = ['#EE7A2F','#B9488E','#D46A8C','#6A55C9','#2F7FB8','#C08A12','#7A5C2E','#3E8E6E','#1F8A9E','#A2563A'];
function vAtividadesAdmin(){
  const nAl = k => S.alunos.filter(a => a.mats.some(m => m.atv === k && m.status !== 'cancelado')).length;
  return `<div class="row wrap" style="justify-content:space-between;align-items:center"><p class="small muted" style="max-width:62ch">As atividades que aparecem na inscrição, na grade e nas mensalidades. Inglês, massagem terapêutica e terapias integrais não são atividade regular: entram à mão no balanço.</p><button class="btn sol" data-act="novaAtividade">${ic('plus')}Nova atividade</button></div>
  <div class="grid g2">${Object.entries(ATIV).map(([k, a]) => { const ts = TURMAS.filter(t => t.atv === k && !t.aluno), prof = EQUIPE.filter(p => p.atvs.includes(k));
    return `<div class="card" style="border-top:4px solid ${a.hex}"><div class="card-h"><div class="row" style="gap:12px;min-width:0"><span class="ico-b" style="color:${a.hex}">${ic(a.icon)}</span><div style="min-width:0"><h3>${escapeH(a.nome)}</h3><span class="sub">${FORMULARIOS[formDe(k)].crianca ? 'ficha de criança' : 'ficha do yoga'} · equipe ${Math.round((S.regras.pct[k] ?? .7) * 100)}% · ${a.vis === 'escolhido' ? 'só a professora escolhida vê' : 'todas da atividade veem'}</span></div></div><button class="iconbtn" data-act="editarAtividade" data-v="${k}" aria-label="Editar ${escapeH(a.nome)}">${ic('pencil','sm')}</button></div>
      <p class="small muted">${escapeH(a.desc || '')}</p>
      <div class="row wrap small" style="gap:8px;margin:8px 0"><span class="pill neu">${ic('users')}${nAl(k)} alunos</span><span class="pill neu">${ic('wallet')}${k === 'yoga' ? 'planos de 1x a 4x' : a.valor ? brl(a.valor) + '/mês' : 'valor a definir'}</span><span class="pill neu">${ic('hand-heart')}${prof.map(p => p.nome).join(', ') || 'sem professora'}</span></div>
      ${a.vis !== 'escolhido' ? `<div class="eyebrow" style="margin:6px 0">Horários</div><div class="row wrap" style="gap:6px">${ts.map(t => `<span class="chip" style="height:34px">${DIAS[t.dia]} ${t.h} · ${escapeH(PESSOA[t.instr]?.nome || '—')}<button class="x-mini" data-act="tirarHorario" data-v="${t.id}" aria-label="Tirar o horário ${DIAS[t.dia]} ${t.h}">${ic('x','sm')}</button></span>`).join('') || '<span class="small muted">Nenhum horário ainda.</span>'}<button class="btn ghost sm" data-act="novoHorario" data-v="${k}">${ic('plus','sm')}Horário</button></div>` : '<p class="small muted">Aula particular: o horário é combinado com a professora.</p>'}
    </div>`; }).join('')}</div>`;
}
function folhaAtividade(id){
  const a = id ? ATIV[id] : {nome:'', curto:'', desc:'', icon:'sparkles', hex:CORES_ATV[Object.keys(ATIV).length % CORES_ATV.length], vis:'todos', form:'yoga', valor:''};
  const form = id ? formDe(id) : 'yoga', pct = Math.round(((id ? S.regras.pct[id] : .7) ?? .7) * 100);
  abrirFolha(`${folhaCab(id ? `Editar ${escapeH(a.nome)}` : 'Nova atividade', 'Aparece na inscrição, na grade, na chamada e nas mensalidades.')}
  <form class="stack" id="fAtividade" data-id="${id || ''}">
    <div class="grid g2"><div class="field"><label for="atNome">Nome</label><input class="inp" id="atNome" required maxlength="40" value="${escapeH(a.nome)}" placeholder="Ex.: Dança circular"></div>
      <div class="field"><label for="atCurto">Nome curto</label><input class="inp" id="atCurto" maxlength="16" value="${escapeH(a.curto || '')}" placeholder="Aparece nos botões"></div></div>
    <div class="field"><label for="atDesc">Como é</label><textarea class="inp" id="atDesc" maxlength="240" placeholder="Uma frase para quem vai se inscrever">${escapeH(a.desc || '')}</textarea></div>
    <div class="field"><label>Ficha de inscrição</label><div class="optgrid">${[['yoga','Ficha do yoga','adultos: saúde, coluna, pressão...'],['criancas','Ficha de criança','dados da criança e do responsável']].map(([k, l, d]) => `<button type="button" class="opt ${form === k ? 'on' : ''}" data-act="opt" data-grp="atForm" data-v="${k}"><span>${l}<br><span class="tiny muted">${d}</span></span></button>`).join('')}</div><input type="hidden" id="atForm" value="${form}"></div>
    <div class="field"><label>Quem vê os alunos</label><div class="optgrid">${[['todos','Todas as professoras da atividade'],['escolhido','Só a professora que o aluno escolher']].map(([k, l]) => `<button type="button" class="opt ${a.vis === k ? 'on' : ''}" data-act="opt" data-grp="atVis" data-v="${k}"><span>${l}</span></button>`).join('')}</div><input type="hidden" id="atVis" value="${a.vis}"></div>
    <div class="grid g2"><div class="field"><label for="atPct">% que fica com a professora</label><input class="inp num" id="atPct" inputmode="numeric" value="${pct}"></div>
      ${id === 'yoga' ? '<div class="field"><label>Valor</label><p class="small muted">Os planos do yoga ficam em Mensalidades → Regras.</p></div>' : `<div class="field"><label for="atValor">Mensalidade</label><input class="inp money num" id="atValor" inputmode="decimal" value="${a.valor ? String(a.valor.toFixed(2)).replace('.', ',') : ''}" placeholder="0,00"></div>`}</div>
    <div class="field"><label>Símbolo</label><div class="optgrid icones">${ICONES_ATV.map(k => `<button type="button" class="opt ${a.icon === k ? 'on' : ''}" data-act="opt" data-grp="atIcon" data-v="${k}" aria-label="${k}">${ic(k)}</button>`).join('')}</div><input type="hidden" id="atIcon" value="${a.icon}"></div>
    <div class="field"><label>Cor</label><div class="row wrap" style="gap:8px">${CORES_ATV.map(c => `<button type="button" class="opt cor ${a.hex === c ? 'on' : ''}" style="--c:${c}" data-act="opt" data-grp="atCor" data-v="${c}" aria-label="cor ${c}"></button>`).join('')}</div><input type="hidden" id="atCor" value="${a.hex}"></div>
    <div class="sheet-foot">${id ? `<button type="button" class="btn ghost" data-act="excluirAtividade" data-v="${id}">${ic('x','sm')}Tirar atividade</button>` : `<button type="button" class="btn sec" data-act="fechar">Cancelar</button>`}<button class="btn pri" type="submit">${ic('check')}Salvar</button></div>
  </form>`);
}
function folhaHorario(atv){
  const quem = EQUIPE.filter(p => p.atvs.includes(atv)), todos = quem.length ? quem : EQUIPE;
  abrirFolha(`${folhaCab(`Horário de ${escapeH(ATIV[atv].curto)}`, 'Entra na grade, na chamada da professora e na inscrição.')}
  <form class="stack" id="fHorario" data-atv="${atv}">
    <div class="field"><label>Dia</label><div class="optgrid">${[1,2,3,4,5,6,0].map(d => `<button type="button" class="opt ${d === 1 ? 'on' : ''}" data-act="opt" data-grp="hrDia" data-v="${d}"><span>${DIAS_L[d]}</span></button>`).join('')}</div><input type="hidden" id="hrDia" value="1"></div>
    <div class="grid g2"><div class="field"><label for="hrHora">Hora</label><input class="inp" type="time" id="hrHora" value="18:30"></div><div class="field"><label for="hrSala">Sala</label><input class="inp" id="hrSala" value="Sala Sol" maxlength="30"></div></div>
    <div class="field"><label>Quem dá</label><div class="optgrid">${todos.map((p, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-act="opt" data-grp="hrInstr" data-v="${p.id}"><span>${escapeH(p.nome)}</span></button>`).join('')}</div><input type="hidden" id="hrInstr" value="${todos[0]?.id || ''}">${quem.length ? '' : `<span class="help">Ninguém da equipe dá ${escapeH(ATIV[atv].curto.toLowerCase())} ainda: quem você escolher passa a dar.</span>`}</div>
    <div class="sheet-foot"><button type="button" class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" type="submit">${ic('check')}Pôr na grade</button></div>
  </form>`);
}
/* ---------- eventos: editar e excluir ---------- */
function folhaExcluirEvento(id){
  const e = S.eventos.find(x => x.id === id), n = e.inscritos.length;
  abrirFolha(`${folhaCab(`Excluir ${escapeH(e.nome)}?`, `${dataBR(e.data)} às ${e.h}`)}
  <div class="stack">${n ? `<div class="alert warn"><span class="ib">${ic('triangle-alert')}</span><div><div class="t">${n} ${n === 1 ? 'pessoa inscrita' : 'pessoas inscritas'}</div><div class="s">Elas recebem o aviso de que o evento foi cancelado. Quem já pagou: combine a devolução pelo WhatsApp.</div></div></div>` : '<p class="small muted">Ninguém se inscreveu ainda.</p>'}
    <div class="sheet-foot"><button class="btn sec" data-act="fechar">Voltar</button><button class="btn pri" style="background:var(--bad)" data-act="confirmarExcluirEvento" data-v="${id}">${ic('x')}Excluir evento</button></div></div>`);
}

/* ============================================================
   DIVULGAR → ESCREVER AVISO: uma mensagem livre para todos ou um grupo
   ============================================================ */
UI.av = {alvo:'todos', canais:['push','whatsapp'], quando:'agora', texto:'', titulo:''};
const MODELOS_AVISO = [
  ['Aula cancelada', 'A aula de hoje foi cancelada. Pedimos desculpas! Quem quiser repor, é só responder aqui que a gente encaixa um horário.'],
  ['Feriado', 'No feriado o Espaço fica fechado. As aulas voltam no dia seguinte, no horário de sempre. Bom descanso!'],
  ['Mudança de horário', 'A partir da próxima semana a turma muda de horário. Confira a grade nova no app.'],
  ['Chuva forte', 'Por causa da chuva forte, a aula de hoje vai ser on-line. O link chega aqui no app 10 minutos antes.'],
];
function alvosAviso(){
  const out = [['todos', 'Todos os alunos'], ...Object.entries(ATIV).filter(([k]) => S.alunos.some(a => a.mats.some(m => m.atv === k && m.status !== 'cancelado'))).map(([k, a]) => ['atv:' + k, 'Alunos de ' + a.curto.toLowerCase()]), ['sumidos', 'Quem anda sumido'], ['equipe', 'Professoras e equipe']];
  return out;
}
function destinatarios(alvo){
  if (alvo === 'equipe') return {equipe:EQUIPE.slice(), alunos:[]};
  const al = S.alunos.filter(a => a.mats.some(m => m.status !== 'cancelado'));
  if (alvo === 'todos') return {equipe:[], alunos:al};
  if (alvo === 'sumidos') return {equipe:[], alunos:al.filter(a => freqStatus(S, a).st !== 'ok')};
  if (alvo.startsWith('atv:')){ const k = alvo.slice(4); return {equipe:[], alunos:al.filter(a => a.mats.some(m => m.atv === k && m.status !== 'cancelado'))}; }
  return {equipe:[], alunos:al};
}
function alcanceAviso(alvo, canais){
  const D = destinatarios(alvo);
  const c = {
    push: [...D.alunos.filter(a => ((S.pontosAcoes || {})[a.id] || {}).notif), ...D.equipe],
    whatsapp: [...D.alunos.filter(a => ((S.consent || {})[a.id] || {}).whatsapp), ...D.equipe],
    email: [...D.alunos.filter(a => a.email), ...D.equipe.filter(p => p.email)],
  };
  const unicos = new Set(canais.flatMap(k => c[k].map(x => x.id)));
  return {D, c, unicos, total:D.alunos.length + D.equipe.length};
}
function vEscreverAviso(){
  const A = UI.av, R = alcanceAviso(A.alvo, A.canais), hist = (S.avisosLivres || []).slice(0, 6);
  return `<div class="split">
    <div class="card pad-lg escrever"><div class="card-h"><div><h3>${ic('megaphone','sm')} Escrever aviso</h3><span class="sub">Chega no celular na hora, pelo canal que cada pessoa aceitou</span></div></div>
      <div class="field"><label>Para quem</label><div class="optgrid">${alvosAviso().map(([k, l]) => `<button type="button" class="opt ${A.alvo === k ? 'on' : ''}" data-act="avAlvo" data-v="${k}"><span>${escapeH(l)}<br><span class="tiny muted">${alcanceAviso(k, A.canais).total} pessoas</span></span></button>`).join('')}</div></div>
      <div class="field"><label>Por onde</label><div class="row wrap" style="gap:8px">${Object.entries(CANAIS).map(([k, c]) => `<button type="button" class="chip ${A.canais.includes(k) ? 'on' : ''}" data-act="avCanal" data-v="${k}">${ic(c.icon,'sm')}${c.nome} <span class="n">${R.c[k].length}</span></button>`).join('')}</div></div>
      <div class="field"><label for="avTitulo">Título (aparece em negrito no celular)</label><input class="inp" id="avTitulo" maxlength="60" value="${escapeH(A.titulo)}" placeholder="Ex.: Aula cancelada hoje" data-act-in="avTexto"></div>
      <div class="field"><label for="avTexto">Mensagem</label><textarea class="inp" id="avTexto" rows="4" maxlength="500" placeholder="Escreva aqui o aviso..." data-act-in="avTexto">${escapeH(A.texto)}</textarea>
        <div class="row wrap" style="gap:6px;margin-top:6px"><span class="tiny muted">Modelos:</span>${MODELOS_AVISO.map(([t], i) => `<button type="button" class="chip" style="height:30px;font-size:12px" data-act="avModelo" data-v="${i}">${t}</button>`).join('')}<span class="sp"></span><span class="tiny muted" id="avConta">${A.texto.length}/500</span></div></div>
      <div class="field"><label>Quando</label><div class="row wrap" style="gap:8px"><button type="button" class="chip ${A.quando === 'agora' ? 'on' : ''}" data-act="avQuando" data-v="agora">${ic('send','sm')}Agora</button><button type="button" class="chip ${A.quando !== 'agora' ? 'on' : ''}" data-act="avQuando" data-v="depois">${ic('clock','sm')}Agendar</button>${A.quando !== 'agora' ? `<input class="inp" type="datetime-local" id="avData" style="max-width:240px" value="${A.quando === 'depois' ? iso(addD(HOJE, 1)) + 'T08:00' : A.quando}" min="${HOJE_ISO}T00:00">` : ''}</div></div>
      <div><div class="eyebrow" style="margin-bottom:6px">Como chega no celular</div><div class="push-mock"><img src="${LOGO_MARK}" alt=""><div><b id="avPrevT">${escapeH(A.titulo || 'Espaço Anirvana')}</b><span id="avPrev">${escapeH(A.texto || 'Sua mensagem aparece aqui.')}</span></div><small>agora</small></div></div>
      <div class="row wrap" style="margin-top:14px;justify-content:flex-end"><button class="btn sol" data-act="avEnviar" ${R.unicos.size ? '' : 'disabled'}>${ic(A.quando === 'agora' ? 'send' : 'clock')}${A.quando === 'agora' ? `Enviar para ${R.unicos.size} ${R.unicos.size === 1 ? 'pessoa' : 'pessoas'}` : `Agendar para ${R.unicos.size} ${R.unicos.size === 1 ? 'pessoa' : 'pessoas'}`}</button></div>
      <p class="tiny muted" style="margin-top:8px">WhatsApp e e-mail só para quem aceitou. Push só para quem instalou o app e ligou os avisos. Ninguém recebe duas vezes.</p>
    </div>
    <div class="card"><div class="card-h"><h3>Avisos enviados</h3></div>
      <div class="list">${hist.map(h => `<div class="li" style="align-items:flex-start"><span class="ico-b" style="${h.agendado ? '' : 'background:var(--ok-bg);color:var(--ok)'}">${ic(h.agendado ? 'clock' : 'check')}</span><div class="main-c"><span class="t">${escapeH(h.titulo || h.texto.slice(0, 40))}</span><span class="s">${escapeH(h.texto.slice(0, 120))}${h.texto.length > 120 ? '…' : ''}</span><span class="s">${h.agendado ? `agendado para ${dataBR(h.quando.slice(0, 10))} ${h.quando.slice(11, 16)}` : `${dataBR(h.d)} ${h.h}`} · ${escapeH(h.para)} · ${h.alcance} pessoas · ${h.canais.map(c => CANAIS[c].nome.toLowerCase()).join(', ')}</span></div></div>`).join('') || '<p class="small muted">Os avisos que vocês mandarem aparecem aqui.</p>'}</div></div>
  </div>`;
}
function enviarAvisoLivre(){
  const A = UI.av, R = alcanceAviso(A.alvo, A.canais), texto = ($('#avTexto')?.value || '').trim(), titulo = ($('#avTitulo')?.value || '').trim();
  if (!texto){ $('#avTexto')?.focus(); avisar('Escreva a mensagem', 'circle-alert'); return; }
  const agendar = A.quando !== 'agora', quando = agendar ? ($('#avData')?.value || '') : '';
  if (agendar && (!quando || quando < `${HOJE_ISO}T${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`)){ avisar('Escolha um dia e hora daqui para frente', 'circle-alert'); return; }
  const para = alvosAviso().find(([k]) => k === A.alvo)?.[1] || 'Todos';
  (S.avisosLivres = S.avisosLivres || []).unshift({id:'al' + (S.seq++), d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, titulo, texto, alvo:A.alvo, para, canais:A.canais.slice(), alcance:R.unicos.size, agendado:agendar, quando});
  if (!agendar){
    A.canais.forEach(c => (S.enviados = S.enviados || []).push({para:`${R.c[c].length} · ${para}`, canal:c, regra:'livre', quando:'hoje ' + `${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`}));
    S.caixa = S.caixa || {};
    R.D.alunos.forEach(a => (S.caixa['a:' + a.id] = S.caixa['a:' + a.id] || []).unshift({t:titulo || 'Aviso do Espaço', s:texto.slice(0, 140), icon:'megaphone'}));
    R.D.equipe.forEach(p => (S.caixa['i:' + p.id] = S.caixa['i:' + p.id] || []).unshift({t:titulo || 'Aviso do Espaço', s:texto.slice(0, 140), icon:'megaphone'}));
  }
  A.texto = ''; A.titulo = ''; A.quando = 'agora';
  salvar(); reRender();
  if (!agendar) mostrarPush(titulo || 'Espaço Anirvana', texto);
  setTimeout(() => avisar(agendar ? `Aviso agendado para ${dataBR(quando.slice(0, 10))} às ${quando.slice(11, 16)}` : `Aviso enviado para ${R.unicos.size} pessoas`, agendar ? 'clock' : 'send'), agendar ? 0 : 1100);
}

/* backup no Google Drive com um toque: no celular abre o "Compartilhar" (escolha Drive); no computador baixa e abre o Drive */
async function backupNoDrive(){
  const bytes = montarBackup(S, {quem:quemNome()}), nome = nomeBackup(), tipo = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const arq = new File([bytes], nome, {type:tipo});
  (S.backups = S.backups || []).push({mes:MES_ATUAL, d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, por:quemNome()}); salvar();
  try{
    if (navigator.canShare && navigator.canShare({files:[arq]})){ await navigator.share({files:[arq], title:nome, text:'Backup do app do Espaço Anirvana'}); avisar('Escolha "Drive" e a pasta Backups Anirvana', 'share-2'); return; }
  }catch(e){ if (e && e.name === 'AbortError') return; }
  baixarArquivo(bytes, nome, tipo);
  abrirFolha(`${folhaCab('Salvar no Google Drive', 'O arquivo já foi baixado')}
  <div class="stack"><ol class="small" style="margin:0;padding-left:18px;display:grid;gap:6px"><li>Abra o Google Drive do Espaço (botão abaixo).</li><li>Entre na pasta <b>Backups Anirvana</b>.</li><li>Arraste o arquivo <b>${nome}</b> para dentro dela (ou toque em <b>Novo → Upload de arquivo</b>).</li></ol>
    <p class="tiny muted">Com o app ligado de verdade, isso acontece sozinho todo dia 1º: o servidor põe o arquivo direto nessa pasta.</p>
    <a class="btn sol" href="https://drive.google.com/drive/my-drive" target="_blank" rel="noopener">${ic('share-2')}Abrir o Google Drive</a></div>`);
}
