/* ============================================================
   PORTA, RENDER E AÇÕES
   ============================================================ */
UI.livres = {};

function vPorta(){
  const instrs = ['kamala','anajulia','sara','bruno','brunos','marina','aurelice'];
  const alunosDemo = [['a01','Luana · yoga e meditação'],['a04','Camila · yoga e aquarela'],['a12','Débora · mensalidade atrasada'],['a30','Alice · musicalização']];
  return `<div class="door">
    <div class="raios" aria-hidden="true"></div>
    <div class="door-in">
      <div class="door-head anim-in"><img src="${LOGO_MARK}" alt="Espaço Anirvana"><div class="namaskar">Namaskar!<small>Saúdo o Deus que há em você, com toda a força da minha mente e o amor do meu coração.</small></div>
        <span class="eyebrow">Espaço holístico · ${ESPACO.cidade}</span>
        <h1>A escola inteira<br><em>num lugar só</em></h1>
        <p>Alunos, horários, chamada, mensalidades, repasses, lojinha e balanço. Cada pessoa entra e vê só o que é dela.</p></div>
      <div class="doors">
        <div class="dcard anim-in" style="animation-delay:60ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,var(--sol),var(--acafrao))">${ic('layout-dashboard','lg')}</span><div><h3>Administração</h3><p>Dessa e Vitor</p></div></div>
          <p>Balanço do mês e do ano, mensalidades, repasse de cada instrutora, lojinha e fornecedores.</p>
          <div class="who">${ADMINS.map(a => `<button class="btn pri sm" data-act="entrar" data-v="admin" data-who="${a.id}">Entrar como ${a.nome}</button>`).join('')}</div></div>
        <div class="dcard anim-in" style="animation-delay:120ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,#B9488E,var(--sol))">${ic('hand-heart','lg')}</span><div><h3>Instrutores</h3><p>Professores e terapeutas</p></div></div>
          <p>Chamada com um toque, alunos sumindo em amarelo e vermelho, troca de aula e quanto vai receber no mês.</p>
          <div class="who">${instrs.map(id => `<button class="chip" data-act="entrar" data-v="instrutor" data-who="${id}">${PESSOA[id].nome}</button>`).join('')}</div></div>
        <div class="dcard anim-in" style="animation-delay:180ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,var(--folha),#3E8E6E)">${ic('sprout','lg')}</span><div><h3>Alunos</h3><p>Quem já pratica no Espaço</p></div></div>
          <p>Próximas aulas, frequência, tempo de prática, plano, Pix ou cartão recorrente, pausar ou mudar o plano.</p>
          <div class="who">${alunosDemo.map(([id,l]) => `<button class="chip" data-act="entrar" data-v="aluno" data-who="${id}">${l}</button>`).join('')}</div></div>
      </div>
      <p class="citacao">“Que o sol faça chover felicidade! Que nossos animais domésticos sejam abençoados!”<b>Caryacarya I · Shrii Shrii Anandamurti</b></p>
      ${faixaProto('Protótipo navegável. Mensalidades de jan–mar e vendas da lojinha de mar–jul vêm das planilhas reais; nomes de alunos, horários e lançamentos são exemplo. Hoje, na demonstração, é quinta, 29 de outubro de 2026.')}
    </div>
  </div>`;
}

function render(){
  const root = $('#root');
  const y = scrollY;
  if (!UI.role){ root.innerHTML = vPorta(); depois(); return; }
  const v = UI.role === 'admin' ? vAdmin() : UI.role === 'instrutor' ? vInstrutor() : vAluno();
  root.innerHTML = casca(v);
  depois();
  return y;
}
function depois(){
  animarArcos(); ligarGraficos();
  if (UI.role === 'admin' && UI.tab.admin === 'lojinha' && UI.lojaVis === 'vender') ligarLoja();
}
function ir(role, tab, {topo=true}={}){
  if (role) UI.role = role;
  if (tab) UI.tab[UI.role] = tab;
  const h = UI.role ? `${UI.role}-${UI.tab[UI.role]}` : '';
  if (location.hash.slice(1) !== h) history.replaceState(null, '', h ? '#'+h : location.pathname);
  render(); if (topo) scrollTo({top:0});
}
function lerHash(){
  const [r, t] = location.hash.slice(1).split('-');
  if (NAV[r]){ UI.role = r; if (t && NAV[r].some(n => n[0] === t)) UI.tab[r] = t; }
}
const num = s => parseFloat(String(s).replace(/\./g,'').replace(',','.')) || 0;
function reRender(){ const y = scrollY; render(); scrollTo({top:y}); }

/* ---------- ações ---------- */
const ACT = {
  entrar:(d) => { fecharFolha(); UI.who[d.v] = d.who; if (d.v === 'aluno') UI.alunoAtv = 'pratica'; ir(d.v, NAV[d.v][0][0]); },
  tab:(d) => { fecharFolha(); ir(null, d.v); },
  role:(d) => ir(d.v),
  trocar:() => abrirFolha(`${folhaCab('Ver o app como…', 'No app de verdade cada pessoa entra com o próprio login e vê só o painel dela.')}
    <div class="stack">${[['admin','Administração',ADMINS.map(a=>[a.id,a.nome])],['instrutor','Instrutores',EQUIPE.filter(p=>p.id!=='stefy').map(p=>[p.id,p.nome])],['aluno','Alunos',[['a01','Luana'],['a04','Camila'],['a12','Débora'],['a30','Alice'],['a09','Gabriel']]]].map(([r,l,ps]) => `<div><div class="eyebrow" style="margin-bottom:8px">${l}</div><div class="chips" style="flex-wrap:wrap">${ps.map(([id,n]) => `<button class="chip ${UI.role===r&&UI.who[r]===id?'on':''}" data-act="entrar" data-v="${r}" data-who="${id}">${n}</button>`).join('')}</div></div>`).join('')}
    <button class="btn sec" data-act="sair">${ic('log-out')}Voltar para a entrada</button>
    <button class="btn ghost" data-act="reset">${ic('rotate-ccw')}Recomeçar a demonstração</button></div>`),
  sair:() => { fecharFolha(); UI.role = null; history.replaceState(null,'',location.pathname); render(); scrollTo({top:0}); },
  reset:() => { S = semear(); salvar(); UI.cart = {}; fecharFolha(); render(); avisar('Demonstração recomeçada'); },
  fechar:() => fecharFolha(),
  ir:(d) => { const [r,t] = d.v.split('-'); if (t === 'alunos'){ UI.escolaVis = 'alunos'; ir(null,'escola'); return; } if (t === 'mais'){ UI.escolaVis = 'subs'; ir(null,'escola'); return; } if (d.sub) UI.lojaVis = d.sub; if (t === 'mensalidades'){ UI.mensVis = 'alunos'; UI.mensSt = 'atrasado'; } ir(null, t); },
  copiar:(d) => { const ok = () => avisar('Copiado'); try{ navigator.clipboard.writeText(d.v).then(ok, () => avisar(d.v,'copy')); }catch(e){ avisar(d.v,'copy'); } },
  opt:(d, el) => {
    $$(`.opt[data-grp="${d.grp}"]`).forEach(o => o.classList.toggle('on', o === el));
    const h = $('#'+d.grp); if (h) h.value = d.v;
    if (d.grp === 'lCat'){ const dica = CAT_SAIDA[d.v]?.dica; const el2 = $('#lDica'); if (el2) el2.textContent = dica || ''; }
    if (d.grp === 'vForma'){ const f = $('#vClienteF'); if (f) f.hidden = !['fiado','descontado'].includes(d.v); }
    if (d.grp === 'nAtv'){ $('#nPlanoF').hidden = d.v !== 'yoga'; $('#nTurmas').innerHTML = TURMAS.filter(t => t.atv === d.v && !t.aluno).map(t => `<button type="button" class="opt" data-act="optMulti" data-grp="nTur" data-v="${t.id}">${DIAS[t.dia]} ${t.h}<br><span class="tiny muted">${PESSOA[t.instr].nome}</span></button>`).join('') || '<p class="small muted">Com hora marcada: a terapeuta combina o horário.</p>'; $('#nTur').value = ''; }
  },
  optMulti:(d, el) => { el.classList.toggle('on'); $('#'+d.grp).value = $$(`.opt.on[data-grp="${d.grp}"]`).map(o => o.dataset.v).join(','); },

  /* admin */
  lancar:() => folhaLancar('saida'),
  lancTipo:(d) => folhaLancar(d.v),
  pagarConta:(d) => { const c = CONTAS_FIXAS.find(x => x.id === d.v); S.lanc.push({id:'l'+(S.seq++), tipo:'saida', d:HOJE_ISO, valor:c.valor, desc:c.nome, cat:c.cat, conta:c.id}); salvar(); reRender(); avisar(`${c.nome} paga · ${brl(c.valor)} lançado em ${c.cat}`); },
  balVis:(d) => { UI.balVis = d.v; reRender(); },
  balMes:(d) => { UI.balMes = d.v; reRender(); },
  mensVis:(d) => { UI.mensVis = d.v; reRender(); },
  mensSt:(d) => { UI.mensSt = d.v; reRender(); },
  mensAtv:(d) => { UI.mensAtv = d.v; reRender(); },
  fechMes:(d) => { UI.fechMes = d.v; reRender(); },
  receber:(d) => folhaReceber(d.v),
  piso:() => { S.regras.piso = !S.regras.piso; salvar(); reRender(); avisar(S.regras.piso ? 'Piso ligado: ninguém recebe menos que o valor da aula vazia por aula dada' : 'Piso desligado: vale a regra da planilha'); },
  pagarEquipe:(d) => { S.repEquipe.push({id:'re'+(S.seq++), p:d.v, mes:d.mes, d:HOJE_ISO}); salvar(); reRender(); avisar(`Repasse de ${PESSOA[d.v].nome} marcado como pago`); },
  escolaVis:(d) => { UI.escolaVis = d.v; reRender(); },
  escAtv:(d) => { UI.escAtv = d.v; reRender(); },
  verAluno:(d) => folhaAluno(d.v, 'admin'),
  verAlunoI:(d) => folhaAluno(d.v, 'instrutor'),
  verTurma:(d) => { const t = TURMA[d.v]; const al = t.aluno ? [alunoPor(S,t.aluno)] : matriculadosNaTurma(S, d.v); abrirFolha(`${folhaCab(`${nomeTurma(t)} · ${DIAS_L[t.dia]} ${t.h}`, `${PESSOA[t.instr].nome} · ${t.sala}`)}<div class="list">${al.map(a => `<div class="li tap" data-act="verAluno" data-v="${a.id}">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">${a.mats.filter(m=>m.turmas.includes(d.v)).map(nomePlano).join('')}</span></div>${pillFreq(freqStatus(S,a))}</div>`).join('')}</div>`); },
  novoAluno:() => folhaNovoAluno(),

  /* lojinha */
  lojaVis:(d) => { UI.lojaVis = d.v; reRender(); },
  lojaForn:(d) => { UI.lojaForn = d.v || null; UI.lojaCat = null; reRender(); },
  lojaCat:(d) => { UI.lojaCat = d.v || null; reRender(); },
  vendasMes:(d) => { UI.vendasMes = d.v; reRender(); },
  addCart:(d, el) => {
    UI.cart[d.v] = (UI.cart[d.v]||0) + 1;
    let q = el.querySelector('.q'); if (!q){ q = document.createElement('span'); q.className = 'q'; el.prepend(q); } q.textContent = UI.cart[d.v];
    const bar = $('#cartbar'); const nb = document.createElement('div'); nb.innerHTML = barraCarrinho(); bar.replaceWith(nb.firstElementChild);
    voar(el);
  },
  itemLivre:() => folhaItemLivre(),
  checkout:() => folhaCheckout(),
  qtd:(d) => { UI.cart[d.v] = Math.max(0, (UI.cart[d.v]||0) + +d.x); if (!itensCarrinho().length){ fecharFolha(); reRender(); return; } folhaCheckout(); },
  registrarVenda:() => {
    const forma = $('#vForma').value, cliente = ($('#vCliente')?.value || '').trim();
    if (['fiado','descontado'].includes(forma) && !cliente){ $('#vCliente').focus(); avisar('Diga quem levou, para cobrar depois','circle-alert'); return; }
    const it = itensCarrinho(), total = r2(it.reduce((s,i) => s + i.total, 0));
    it.forEach(i => S.vendas.push({id:'v'+(S.seq++), d:HOJE_ISO, desc:`${i.q} ${i.nome.toLowerCase()}`, valor:i.total, forma, forn:i.forn, evento:'', fonte:'app', itens:[{p:i.id, q:i.q}]}));
    if (forma === 'fiado') S.fiado.push({id:'fi'+(S.seq++), cliente, desc:it.map(i => `${i.q} ${i.nome.toLowerCase()}`).join(', '), valor:total, d:HOJE_ISO, pago:false});
    salvar();
    const venda = {d:HOJE_ISO, total, forma, cliente, itens:it.map(i => ({nome:i.nome, q:i.q, total:i.total, forn:i.forn}))};
    UI.cart = {};
    const cb = $('#cartbar'); if (cb){ const nb = document.createElement('div'); nb.innerHTML = barraCarrinho(); cb.replaceWith(nb.firstElementChild); }
    $$('.prod .q').forEach(q => q.remove());
    SHEET_ON_CLOSE = null;
    folhaRecibo(venda);
    SHEET_ON_CLOSE = () => reRender();
  },
  pagarForn:(d) => { const f = saldoFornecedores(S).find(x => x.id === d.v); S.repLoja.push({id:'rl'+(S.seq++), forn:f.id, valor:f.saldo, d:HOJE_ISO}); salvar(); reRender(); avisar(`${brl(f.saldo)} pagos a ${f.curto} · lançado no balanço como repasse`); },
  recebiFiado:(d) => { const f = S.fiado.find(x => x.id === d.v); f.pago = true; f.pagoEm = HOJE_ISO; salvar(); reRender(); avisar(`Recebido de ${f.cliente.split(' ')[0]}: ${brl(f.valor)}`); },

  /* instrutor */
  instrFiltro:(d) => { UI.instrFiltro = d.v; reRender(); },
  meuMes:(d) => { UI.meuMes = d.v; reRender(); },
  chamada:(d) => folhaChamada(d.v),
  marcar:(d, el) => { const s = CHAMADA.presentes; s.has(d.v) ? s.delete(d.v) : s.add(d.v); const y = $('#sheet').scrollTop; desenharChamada(); $('#sheet').scrollTop = y; },
  addExtra:(d) => { CHAMADA.extras.push(d.v); CHAMADA.presentes.add(d.v); desenharChamada(); },
  visit:(d) => { CHAMADA.visit = Math.max(0, CHAMADA.visit + +d.v); const y = $('#sheet').scrollTop; desenharChamada(); $('#sheet').scrollTop = y; },
  salvarChamada:(d) => {
    const {sid} = CHAMADA, [dia, tid] = sid.split('_'), t = TURMA[tid];
    S.presencas = S.presencas.filter(p => p.s !== sid);
    CHAMADA.presentes.forEach(aid => { const a = alunoPor(S,aid); const m = a.mats.find(x => x.atv === t.atv) || a.mats[0]; S.presencas.push({s:sid, a:aid, t: m.plano || 'mensal'}); });
    for (let i=0;i<CHAMADA.visit;i++) S.presencas.push({s:sid, a:null, nome:'Visitante', t:'avulsa'});
    const au = S.aulas[sid] || (S.aulas[sid] = {id:sid, d:dia, turma:tid, instr:UI.who.instrutor, sub:false});
    au.feita = true; au.vazia = d.v === 'vazia' || (CHAMADA.presentes.size + CHAMADA.visit === 0);
    const n = CHAMADA.presentes.size + CHAMADA.visit;
    salvar(); fecharFolha(); reRender();
    avisar(au.vazia ? `Aula vazia registrada · vale ${brl(S.regras.aulaVazia)}` : `Chamada salva: ${n} ${n===1?'presente':'presentes'}`);
  },
  minhaTurma:(d) => folhaMinhaTurma(d.v),
  pedirSub:(d) => folhaPedirSub(d.v, d.d),
  aceitarSub:(d) => { const s = S.subs.find(x => x.id === d.v); s.status = 'aceito'; s.para = UI.who.instrutor; salvar(); reRender(); avisar(`Combinado: você cobre ${PESSOA[s.de].nome} em ${dataBR(s.d)}. Ela e a administração já sabem.`); },
  recusarSub:(d) => { const s = S.subs.find(x => x.id === d.v); (s.recusas = s.recusas || []).push(UI.who.instrutor); salvar(); avisar('Ok, o pedido segue aberto para as outras'); },

  /* aluno */
  alunoAtv:(d) => { UI.alunoAtv = d.v; reRender(); },
  vou:(d) => { S.vou[d.v] = d.x === '1'; salvar(); reRender(); const [, tid] = d.v.split('_'); avisar(d.x === '1' ? `Presença confirmada · ${PESSOA[TURMA[tid].instr].nome} já sabe` : 'Tudo bem, avisamos a instrutora', d.x === '1' ? 'check' : 'bell'); },
  experimental:(d) => abrirFolha(`${folhaCab(`Aula experimental de ${ATIV[d.v].curto}`, 'Escolha um horário. A gente confirma pelo WhatsApp.')}<div class="stack">${ATIV[d.v].agendada ? `<div class="field"><label for="expD">Dia preferido</label><input class="inp" type="date" id="expD" value="${iso(addD(HOJE,2))}"></div>` : `<div class="optgrid">${TURMAS.filter(t=>t.atv===d.v).map((t,i) => `<button class="opt ${i===0?'on':''}" data-act="opt" data-grp="expT" data-v="${t.id}">${DIAS_L[t.dia]} ${t.h}</button>`).join('')}</div>`}<div class="sheet-foot"><button class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" data-act="expOk" data-v="${d.v}">Quero experimentar</button></div></div>`),
  estagio:(d) => { const f = S.formandos.find(x => x.id === d.v); f.estagio = Math.min(60, f.estagio + 4); salvar(); reRender(); avisar(`${f.nome.split(' ')[0]}: ${f.estagio}h de estágio`); },
  formacaoInteresse:() => avisar('Pedido enviado. A equipe avisa quando abrir a próxima turma.', 'graduation-cap'),
  evento:(d) => { const e = EVENTOS.find(x => x.id === d.v); avisar(`Lugar reservado no ${e.nome} de ${dataBR(e.data)}. A gente confirma pelo WhatsApp.`, 'ticket'); },
  expOk:(d) => { fecharFolha(); avisar(`Pedido enviado. A equipe de ${ATIV[d.v].curto} vai confirmar.`); },
  reposicao:(d) => { const t = TURMA[d.v]; avisar(`Reposição marcada: ${DIAS_L[t.dia].toLowerCase()} ${t.h} com ${PESSOA[t.instr].nome}`); },
  pagar:(d) => folhaPagar(d.v, 'pix'),
  pagarModo:(d) => folhaPagar(d.v, d.x),
  confirmarPag:(d) => {
    const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), st = statusPagamento(S,a,m);
    const mes = st.st === 'pago' ? (() => { const x = pd(proximaCobranca(S,m)); return `${x.getFullYear()}-${pad(x.getMonth()+1)}`; })() : MES_ATUAL;
    S.pagamentos.push({id:'pg'+(S.seq++), a:a.id, mat:m.id, mes, valor:valorMat(S,m), d:HOJE_ISO, metodo:d.x});
    if (d.x === 'cartao' && $('#cRec')?.checked){ m.metodo = 'cartao'; m.cartaoFim = ($('#cNum').value.replace(/\D/g,'').slice(-4)) || m.cartaoFim || '4242'; }
    salvar(); fecharFolha(); reRender(); avisar(`Pagamento de ${brl(valorMat(S,m))} confirmado. Obrigado!`);
  },
  maisFin:(d) => folhaMaisFin(d.v, d.x || 'menu'),
  salvarMetodo:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); m.metodo = $('#fMet').value; if (m.metodo === 'cartao' && !m.cartaoFim) m.cartaoFim = '4242'; salvar(); fecharFolha(); reRender(); avisar(m.metodo === 'cartao' ? 'Pronto: cobrança automática no cartão' : 'Pronto: você vai receber o Pix todo mês'); },
  pausar:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), dias = +$('#fPausa').value; m.status = 'pausado'; m.pausaAte = iso(addD(HOJE, dias)); salvar(); fecharFolha(); reRender(); avisar(`Plano pausado até ${dataBR(m.pausaAte)}. Sem cobrança nesse período.`, 'pause'); },
  retomar:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); m.status = 'ativo'; delete m.pausaAte; salvar(); fecharFolha(); reRender(); avisar('Plano retomado. Bom te ver de volta!'); },
  alterarPlano:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), novo = $('#fPlano').value; if (novo === m.plano){ fecharFolha(); return; } m.plano = novo; salvar(); fecharFolha(); reRender(); avisar(`Plano alterado para ${PLANOS_YOGA[novo].nome} · ${brl(S.regras.planos[novo])} a partir da próxima cobrança`); },
};

/* cliques */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  e.preventDefault(); fn({...el.dataset}, el);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#sheet').classList.contains('on')) fecharFolha();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')){ e.preventDefault(); e.target.click(); }
});
$('#scrim').addEventListener('click', fecharFolha);

/* campos de regra e busca */
let _buscaT;
document.addEventListener('input', e => {
  const el = e.target, k = el.dataset.actIn; if (!k) return;
  if (k === 'busca'){ UI.busca = el.value; clearTimeout(_buscaT); _buscaT = setTimeout(() => { const pos = el.selectionStart; reRender(); const b = $('#busca'); if (b){ b.focus(); b.setSelectionRange(pos,pos); } }, 220); }
});
document.addEventListener('change', e => {
  const el = e.target, k = el.dataset.actIn; if (!k) return;
  if (k === 'preco'){ const v = num(el.value); if (v > 0){ S.regras.planos[el.dataset.v] = v; salvar(); reRender(); avisar(`${PLANOS_YOGA[el.dataset.v].nome}: ${brl(v)} · presença agora vale ${brl(taxasYoga(S.regras.planos)[el.dataset.v])}`); } }
  if (k === 'pct'){ const v = num(el.value); if (v >= 0 && v <= 100){ S.regras.pct[el.dataset.v] = v/100; salvar(); reRender(); avisar(`${ATIV[el.dataset.v].curto}: equipe ${v}% · Espaço ${100-v}%`); } }
  if (k === 'vazia'){ const v = num(el.value); if (v >= 0){ S.regras[el.dataset.v] = v; salvar(); reRender(); avisar(`Aula vazia: ${brl(v)}`); } }
});

/* formulários */
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'fLanc'){
    const valor = num($('#lValor').value), desc = $('#lDesc').value.trim(), tipo = $('#lTipo').value, cat = $('#lCat').value, d = $('#lData').value || HOJE_ISO;
    if (!valor){ $('#lValor').focus(); avisar('Digite o valor','circle-alert'); return; }
    if (!desc){ $('#lDesc').focus(); avisar('Diga o que foi','circle-alert'); return; }
    S.lanc.push({id:'l'+(S.seq++), tipo, d, valor, desc, cat}); salvar(); fecharFolha(); UI.balMes = mesDe(d); reRender();
    avisar(`${tipo==='saida'?'Saída':'Entrada'} lançada: ${brl(valor)} · ${cat}`);
  }
  if (f.id === 'fReceber'){
    const m = S.alunos.flatMap(a => a.mats.map(x => ({a,x}))).find(o => o.x.id === f.dataset.mat);
    const valor = num($('#rValor').value) || valorMat(S, m.x);
    S.pagamentos.push({id:'pg'+(S.seq++), a:m.a.id, mat:m.x.id, mes:MES_ATUAL, valor, d:$('#rData').value || HOJE_ISO, metodo:$('#rMet').value});
    salvar(); fecharFolha(); reRender(); avisar(`Pagamento registrado: ${m.a.nome.split(' ')[0]} · ${brl(valor)}`);
  }
  if (f.id === 'fNovo'){
    const nome = $('#nNome').value.trim(); if (!nome) return;
    const atv = $('#nAtv').value, plano = atv === 'yoga' ? $('#nPlano').value : null, turmas = $('#nTur').value.split(',').filter(Boolean);
    const id = 'a' + (S.seq++);
    S.alunos.push({id, nome, desde:HOJE_ISO, obs:'', status:'ativo', tel:$('#nTel').value || '(41) 9 0000-0000', mats:[{id:id+'-0', atv, plano, valor: plano ? null : 150, turmas, venc: Math.min(28, +$('#nVenc').value || HOJE.getDate()), metodo:$('#nMet').value, cartaoFim: $('#nMet').value==='cartao' ? '4242' : null, instr:null, status:'ativo'}]});
    salvar(); fecharFolha(); reRender();
    const quem = EQUIPE.filter(p => p.atvs.includes(atv)).map(p => p.nome);
    avisar(`${nome.split(' ')[0]} cadastrado. Já aparece para ${quem.join(', ')}.`, 'user-plus');
  }
  if (f.id === 'fSub'){
    const para = $('#sPara').value || null;
    S.subs.push({id:'sb'+(S.seq++), turma:f.dataset.t, d:f.dataset.d, de:UI.who.instrutor, para:null, pedidoPara:para, motivo:$('#sMot').value.trim() || 'Sem motivo informado', status:'aberto', criado:HOJE_ISO});
    salvar(); fecharFolha(); reRender();
    const t = TURMA[f.dataset.t];
    avisar(para ? `Pedido enviado para ${PESSOA[para].nome}` : `Pedido enviado para todas de ${ATIV[t.atv].curto}`, 'repeat');
  }
  if (f.id === 'fLivre'){
    const nome = $('#ilNome').value.trim(), valor = num($('#ilValor').value), forn = $('#ilForn').value;
    if (!nome || !valor) return;
    const id = 'x' + (S.seq++);
    UI.livres[id] = {id, nome, preco:valor, forn, cat:'casa', icon:'tag'};
    UI.cart[id] = 1; fecharFolha(); reRender(); avisar(`${nome} na venda`);
  }
});

window.addEventListener('hashchange', () => { lerHash(); render(); });
lerHash();
render();
