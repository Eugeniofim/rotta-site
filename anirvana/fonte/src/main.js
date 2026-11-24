/* ============================================================
   PORTA, RENDER E AÇÕES
   ============================================================ */
UI.livres = {};

function vPorta(){
  if (VALENDO) return vPortaValendo();
  return `<div class="door">
    <div class="raios" aria-hidden="true"></div>
    <div class="door-in">
      <div class="door-head anim-in"><img src="${LOGO_MARK}" alt="Espaço Anirvana"><div class="namaskar">Namaskar!<small>Saúdo o Deus que há em você, com toda a força da minha mente e o amor do meu coração.</small></div>
        <span class="eyebrow">Espaço holístico · ${ESPACO.cidade}</span>
        <h1>A escola inteira<br><em>num lugar só</em></h1>
        <p>Inscrição, aulas, chamada, mensalidades, repasses, lojinha, eventos e balanço. Cada pessoa entra e vê só o que é dela.</p></div>
      <div class="doors">
        <div class="dcard dcard-aluno anim-in" style="animation-delay:60ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,var(--folha),#3E8E6E)">${ic('sprout','lg')}</span><div><h3>Alunos</h3><p>Quem pratica ou quer começar</p></div></div>
          <p>Inscrição em poucos minutos, próximas aulas, frequência, eventos e o pagamento por Pix ou cartão.</p>
          <button class="btn sol block" data-act="inscricao">${ic('user-plus')}Quero me inscrever</button>
          <form class="login" data-login="aluno"><label class="eyebrow" for="loginCel">Já sou aluno · entrar com o celular</label>
            <div class="row"><input class="inp num" id="loginCel" type="tel" inputmode="tel" autocomplete="tel" placeholder="(41) 9 0000-0000" data-act-in="celMask"><button class="btn pri" type="submit">Entrar</button></div>
            <span class="tiny muted">Na primeira vez chega um código pelo WhatsApp. Depois este celular fica conectado. Sem senha para lembrar.</span></form></div>
        <div class="dcard anim-in" style="animation-delay:120ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,#B9488E,var(--sol))">${ic('hand-heart','lg')}</span><div><h3>Instrutores</h3><p>Professores e terapeutas</p></div></div>
          <p>Chamada com um toque, ficha de cada aluno, quem anda sumido, troca de aula e quanto vai receber no mês.</p>
          <form class="login" data-login="instrutor"><label class="eyebrow" for="loginPin">Seu PIN de 6 números</label>
            <div class="row"><input class="inp num pin" id="loginPin" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="PIN de 6 números"><button class="btn pri" type="submit">Entrar</button></div>
            <span class="tiny muted" id="pinMsg">O PIN é só seu. Esqueceu? A administração gera outro na hora.</span></form></div>
        <div class="dcard anim-in" style="animation-delay:180ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,var(--sol),var(--acafrao))">${ic('layout-dashboard','lg')}</span><div><h3>Administração</h3><p>Quem cuida do Espaço</p></div></div>
          <p>Balanço, mensalidades, repasses, lojinha, inscrições novas, eventos e avisos automáticos.</p>
          <button class="btn sec block gbtn" data-act="adminGoogle"><span class="g" aria-hidden="true">G</span>Entrar com Google</button>
          <span class="tiny muted">Depois, o PIN do painel. Só as duas contas da administração entram.</span></div>
      </div>
      <details class="dicas-proto"><summary>${ic('info','sm')}Para testar o protótipo</summary>
        <div class="grid g3" style="margin-top:10px">
          <div><b class="small">Alunos · toque para preencher</b><div class="chips" style="flex-wrap:wrap;margin-top:6px">${['a01','a04','a12','a30','a34'].map(id => { const a = alunoPor(S, id); return a ? `<button class="chip" data-act="celDemo" data-v="${escapeH(a.tel)}">${escapeH(a.nome.split(' ')[0])}</button>` : ''; }).join('')}</div><span class="tiny muted">O código aparece na tela (no app de verdade chega pelo WhatsApp).</span></div>
          <div><b class="small">Instrutores · PIN</b><div class="tiny muted" style="margin-top:6px;line-height:1.7">${EQUIPE.filter(p => p.ativo !== false && S.codigos && S.codigos[p.id]).map(p => `${escapeH(p.nome)}: <b class="num">${S.codigos[p.id].c}</b>`).join(' · ')}</div></div>
          <div><b class="small">Administração</b><div class="tiny muted" style="margin-top:6px;line-height:1.7">Google é simulado. PIN do painel: ${ADMINS.map(a => `${a.nome} <b class="num">${(S.pinAdmin || {})[a.id] || '—'}</b>`).join(' · ')}</div></div>
        </div></details>
      <p class="citacao">“Que o sol faça chover felicidade! Que nossos animais domésticos sejam abençoados!”<b>Caryacarya I · Shrii Shrii Anandamurti</b></p>
      ${faixaProto('Protótipo navegável. Mensalidades de jan–mar e vendas da lojinha de mar–jul vêm das planilhas reais; nomes de alunos, horários e lançamentos são exemplo. Hoje, na demonstração, é quinta, 29 de outubro de 2026.')}
    </div>
  </div>`;
}
/* ---------- a porta do app de verdade: cada um entra uma vez por aparelho ---------- */
function vPortaValendo(){
  return `<div class="door">
    <div class="raios" aria-hidden="true"></div>
    <div class="door-in">
      <div class="door-head anim-in"><img src="${LOGO_MARK}" alt="Espaço Anirvana"><div class="namaskar">Namaskar!<small>Saúdo o Deus que há em você, com toda a força da minha mente e o amor do meu coração.</small></div>
        <span class="eyebrow">Espaço holístico · ${ESPACO.cidade}</span>
        <h1>A escola inteira<br><em>num lugar só</em></h1>
        <p>Inscrição, aulas, chamada, mensalidades e avisos. Cada pessoa entra uma vez neste aparelho e vê só o que é dela.</p></div>
      <div class="doors">
        <div class="dcard dcard-aluno anim-in" style="animation-delay:60ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,var(--folha),#3E8E6E)">${ic('sprout','lg')}</span><div><h3>Alunos</h3><p>Quem pratica ou quer começar</p></div></div>
          <p>Inscrição em poucos minutos, próximas aulas, frequência, eventos e o pagamento por Pix ou cartão.</p>
          <button class="btn sol block" data-act="inscricao">${ic('user-plus')}Quero me inscrever</button>
          <form class="login" data-login="aluno"><label class="eyebrow" for="loginCel">Já sou aluno · entrar com o celular</label>
            <div class="row"><input class="inp num" id="loginCel" type="tel" inputmode="tel" autocomplete="tel" placeholder="(41) 9 0000-0000" data-act-in="celMask"><button class="btn pri" type="submit">Entrar</button></div>
            <span class="tiny muted">Depois do celular, a data de nascimento da ficha. Este aparelho fica conectado.</span></form></div>
        <div class="dcard anim-in" style="animation-delay:120ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,#B9488E,var(--sol))">${ic('hand-heart','lg')}</span><div><h3>Instrutores</h3><p>Professores e terapeutas</p></div></div>
          <p>Chamada com um toque, ficha de cada aluno, quem anda sumido, troca de aula e quanto vai receber no mês.</p>
          <form class="login" data-login="instrutor"><label class="eyebrow" for="loginPin">Seu PIN de 6 números</label>
            <div class="row"><input class="inp num pin" id="loginPin" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="PIN de 6 números"><button class="btn pri" type="submit">Entrar</button></div>
            <span class="tiny muted" id="pinMsg">O PIN é só seu. Esqueceu? A administração gera outro na hora.</span></form></div>
        <div class="dcard anim-in" style="animation-delay:180ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,var(--sol),var(--acafrao))">${ic('layout-dashboard','lg')}</span><div><h3>Administração</h3><p>Quem cuida do Espaço</p></div></div>
          <p>Balanço, mensalidades, repasses, lojinha, inscrições novas, eventos e avisos automáticos.</p>
          <form class="login" data-login="adminCodigo"><label class="eyebrow" for="loginAdm">Seu código de acesso</label>
            <div class="row"><input class="inp num" id="loginAdm" autocapitalize="characters" autocomplete="one-time-code" spellcheck="false" maxlength="14" placeholder="XXXXX-XXXXX" aria-label="Código de acesso da administração"><button class="btn pri" type="submit">Entrar</button></div>
            <span class="tiny muted" id="admMsg">Cada pessoa da administração tem o seu. Só precisa digitar uma vez neste aparelho.</span></form></div>
      </div>
      <p class="citacao">“Que o sol faça chover felicidade! Que nossos animais domésticos sejam abençoados!”<b>Caryacarya I · Shrii Shrii Anandamurti</b></p>
    </div>
  </div>`;
}
const msgPorta = (id, txt, ruim) => { const m = $('#' + id); if (m){ m.textContent = txt; m.style.color = ruim ? 'var(--bad)' : ''; m.style.fontWeight = ruim ? '600' : ''; } };
function entrarPainelNuvem(role, who){ fecharFolha(); UI.pilha = []; UI.who[role] = who; UI.tab[role] = NAV[role][0][0]; ir(role, NAV[role][0][0]); sincronizarAoAbrir(); }
async function loginAdmCodigo(){
  const cod = ($('#loginAdm')?.value || '').trim();
  if (cod.replace(/[^A-Za-z0-9]/g, '').length < 10){ $('#loginAdm')?.focus(); msgPorta('admMsg', 'O código tem 10 letras e números.', true); return; }
  msgPorta('admMsg', 'Conferindo…');
  const r = await entrarNaNuvem('adm', cod);
  if (r.erro){ msgPorta('admMsg', r.erro, true); return; }
  entrarPainelNuvem('admin', r.quem); avisar(`Namaskar, ${String(r.nome || '').split(' ')[0]}!`, 'check');
}
async function loginInstrutorNuvem(){
  const dig = soDig($('#loginPin')?.value);
  if (dig.length !== 6){ $('#loginPin')?.focus(); msgPorta('pinMsg', 'O PIN tem 6 números.', true); return; }
  msgPorta('pinMsg', 'Conferindo…');
  const r = await entrarNaNuvem('instrutor', dig);
  if (r.erro){ msgPorta('pinMsg', r.erro, true); const i = $('#loginPin'); if (i){ i.value = ''; i.focus(); } return; }
  UI.codigoOk[r.quem] = r.v; entrarPainelNuvem('instrutor', r.quem); avisar(`Namaskar, ${r.nome}!`, 'check');
}
function loginAlunoNuvem(){
  const dig = soDig($('#loginCel')?.value);
  if (dig.length < 10){ $('#loginCel')?.focus(); avisar('Digite o celular com DDD', 'circle-alert'); return; }
  UI.otp = {dig}; folhaNasc();
}
function folhaNasc(msg){
  const o = UI.otp;
  abrirFolha(`${folhaCab('Confirme quem é você', `Celular ${mascCel(o.dig)}`)}
  <form class="stack login" data-login="nasc" style="justify-items:center;text-align:center">
    <span class="ico-b" style="width:64px;height:64px;border-radius:20px;background:var(--ok-bg);color:var(--ok)">${ic('cake','xl')}</span>
    <label class="small strong" for="nascIn">Data de nascimento de quem pratica</label>
    <input class="inp" id="nascIn" type="date" max="${HOJE_ISO}" required style="max-width:240px">
    <p class="small ${msg ? '' : 'muted'}" style="${msg ? 'color:var(--bad);font-weight:600' : ''}">${msg ? escapeH(msg) : 'A mesma da ficha de inscrição. Para criança, a data da criança.'}</p>
    <button class="btn pri block" type="submit">${ic('check')}Entrar</button>
    <a class="btn ghost sm" href="https://wa.me/${ESPACO.whats}?text=${encodeURIComponent('Oi! Sou aluno e não consegui entrar no app com o celular ' + mascCel(o.dig) + '.')}" target="_blank" rel="noopener">${ic('phone','sm')}Não consigo entrar</a>
  </form>`);
  setTimeout(() => $('#nascIn')?.focus(), 350);
}
async function conferirNasc(){
  const n = $('#nascIn')?.value; if (!n){ avisar('Escolha a data de nascimento', 'circle-alert'); return; }
  const r = await entrarNaNuvem('aluno', UI.otp.dig, n);
  if (r.erro) return folhaNasc(r.erro);
  UI.otp = null;
  const lista = r.alunos || [];
  if (lista.length > 1){ abrirFolha(`${folhaCab('Quem vai entrar?', 'Este celular está na ficha de mais de uma pessoa')}<div class="list">${lista.map(a => `<button class="li tap" style="width:100%;text-align:left" data-act="entrarAluno" data-who="${escapeH(a.id)}">${av(a.nome || '?')}<div class="main-c"><span class="t">${escapeH(a.nome || '')}</span></div>${ic('chevron-right','sm')}</button>`).join('')}</div>`); return; }
  entrarPainelNuvem('aluno', r.quem); avisar(`Namaskar, ${String((lista[0] || {}).nome || '').split(' ')[0]}!`, 'check');
}
/* no app valendo, cada aparelho só abre o painel de quem entrou nele (a administração pode "ver como") */
function travaPapel(){
  if (!nuvemLigada()){ UI.role = null; return; }
  const meu = papelPainel(SESSAO.papel);
  if (!UI.role){ UI.role = meu; UI.who[meu] = SESSAO.quem; if (!NAV[meu].some(n => n[0] === UI.tab[meu])) UI.tab[meu] = NAV[meu][0][0]; }
  if (meu === 'admin') return;
  UI.role = meu;
  if (meu === 'instrutor') UI.who.instrutor = SESSAO.quem;
  if (meu === 'aluno' && !(SESSAO.alunos || []).some(a => a.id === UI.who.aluno)) UI.who.aluno = SESSAO.quem;
}
function vBuscando(){
  const fora = NUVEM.estado === 'fora', semFicha = EM_DIA;
  return `<div class="door"><div class="raios" aria-hidden="true"></div><div class="door-in buscando"><div class="stack" style="justify-items:center;text-align:center;max-width:440px;margin:0 auto">
    <img src="${LOGO_MARK}" alt="" style="width:76px;height:auto">
    <h2 style="font-size:26px">${semFicha ? 'Não achamos seu cadastro' : fora ? 'Sem conexão' : 'Buscando seus dados…'}</h2>
    <p class="muted">${semFicha ? 'Fale com o Espaço para conferir sua ficha.' : fora ? 'Na primeira vez neste aparelho o app precisa de internet para trazer tudo. Depois funciona até sem.' : 'Só na primeira vez neste aparelho. Leva alguns segundos.'}</p>
    ${fora || semFicha ? `<div class="row wrap" style="justify-content:center"><button class="btn pri" data-act="tentarDeNovo">${ic('refresh-cw','sm')}Tentar de novo</button><button class="btn ghost" data-act="sairAparelho">${ic('log-out','sm')}Sair</button></div>` : '<span class="girando" aria-hidden="true"></span>'}
  </div></div></div>`;
}
function folhaConta(){
  const adm = papelPainel(SESSAO.papel) === 'admin', papel = {dono:'Dono', adm:'Administração', instrutor:'Instrutor', aluno:'Aluno'}[SESSAO.papel] || '';
  const meus = SESSAO.alunos || [];
  abrirFolha(`${folhaCab(escapeH(SESSAO.nome || quemNome()), papel + ' · conectado neste aparelho')}
  <div class="stack">
    ${adm ? `<div><div class="eyebrow" style="margin-bottom:8px">Ver o app como instrutor</div><div class="chips" style="flex-wrap:wrap">${EQUIPE.filter(p => p.ativo !== false).map(p => `<button class="chip ${UI.role === 'instrutor' && UI.who.instrutor === p.id ? 'on' : ''}" data-act="entrar" data-v="instrutor" data-who="${p.id}">${escapeH(p.nome)}</button>`).join('')}</div></div>
    ${S.alunos.length ? `<div><div class="eyebrow" style="margin-bottom:8px">Ver o app como aluno</div><div class="chips" style="flex-wrap:wrap">${S.alunos.filter(a => a.status !== 'inativo').slice(0, 40).map(a => `<button class="chip ${UI.role === 'aluno' && UI.who.aluno === a.id ? 'on' : ''}" data-act="entrar" data-v="aluno" data-who="${a.id}">${escapeH(a.nome.split(' ')[0])}</button>`).join('')}</div></div>` : ''}
    ${UI.role !== 'admin' ? `<button class="btn sec" data-act="sair">${ic('layout-dashboard','sm')}Voltar para a administração</button>` : ''}` : ''}
    ${SESSAO.papel === 'aluno' && meus.length > 1 ? `<div><div class="eyebrow" style="margin-bottom:8px">Trocar de ficha</div><div class="chips" style="flex-wrap:wrap">${meus.map(a => `<button class="chip ${UI.who.aluno === a.id ? 'on' : ''}" data-act="entrarAluno" data-who="${escapeH(a.id)}">${escapeH(String(a.nome || '').split(' ')[0])}</button>`).join('')}</div></div>` : ''}
    <button class="btn sec" data-act="nuvemInfo">${ic('cloud','sm')}Seus dados na nuvem</button>
    <button class="btn ghost" data-act="sairAparelho">${ic('log-out','sm')}Sair deste aparelho</button>
  </div>`);
}
/* ---------- entrar: aluno pelo celular, instrutor pelo PIN, administração pelo Google + PIN ---------- */
const soDig = s => String(s || '').replace(/\D/g, '');
const mascCel = s => { const d = soDig(s).slice(0, 11); return d.length <= 2 ? d : d.length <= 7 ? `(${d.slice(0,2)}) ${d.slice(2)}` : `(${d.slice(0,2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`; };
function alunosDoCel(dig){ return S.alunos.filter(a => a.status !== 'inativo' && [a.tel, a.respTel].some(t => t && soDig(t).slice(-11) === dig.slice(-11))); }
function loginAluno(){
  if (VALENDO) return loginAlunoNuvem();
  const dig = soDig($('#loginCel')?.value);
  if (dig.length < 10){ $('#loginCel')?.focus(); avisar('Digite o celular com DDD', 'circle-alert'); return; }
  const quem = alunosDoCel(dig);
  if (!quem.length){ abrirFolha(`${folhaCab('Não achamos esse celular', mascCel(dig))}<div class="stack"><p>Se você é novo por aqui, faça a inscrição: leva poucos minutos. Se já é aluno, pode ser que o Espaço tenha outro número seu.</p>
    <div class="sheet-foot"><a class="btn sec" href="https://wa.me/${ESPACO.whats}?text=${encodeURIComponent('Oi! Sou aluno e não consegui entrar no app com o celular ' + mascCel(dig) + '.')}" target="_blank" rel="noopener">${ic('phone','sm')}Falar com o Espaço</a><button class="btn sol" data-act="inscricao">${ic('user-plus')}Quero me inscrever</button></div></div>`); return; }
  if (lerLembrar()['cel:' + dig]) return escolherAluno(quem);
  UI.otp = {dig, c:String(100000 + Math.floor(Math.random() * 900000)), n:0};
  folhaOtp();
}
function folhaOtp(msg){
  const o = UI.otp;
  abrirFolha(`${folhaCab('Código pelo WhatsApp', `Mandamos 6 números para ${mascCel(o.dig)}`)}
  <form class="stack login" data-login="otp" style="justify-items:center;text-align:center">
    <span class="ico-b" style="width:64px;height:64px;border-radius:20px;background:var(--ok-bg);color:var(--ok)">${ic('message-circle','xl')}</span>
    <input class="inp codigo" id="otpIn" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="Código de 6 números">
    <p class="small ${msg ? '' : 'muted'}" style="${msg ? 'color:var(--bad);font-weight:600' : ''}">${msg || 'O código vale por 10 minutos.'}</p>
    <label class="row small" style="gap:10px;cursor:pointer"><input type="checkbox" id="otpLembrar" checked style="width:20px;height:20px;accent-color:var(--pri)"> Manter este celular conectado</label>
    <button class="btn pri block" type="submit">${ic('check')}Entrar</button>
    <p class="tiny muted"><b>Demonstração:</b> o código é ${o.c.slice(0,3)} ${o.c.slice(3)}.</p>
  </form>`);
  setTimeout(() => $('#otpIn')?.focus(), 350);
}
function conferirOtp(){
  const o = UI.otp, dig = soDig($('#otpIn')?.value);
  if (!o) return;
  if (dig !== o.c){ o.n++; if (o.n >= 5){ UI.otp = null; fecharFolha(); avisar('Muitas tentativas. Peça um código novo.', 'circle-alert'); return; } folhaOtp(`Código não confere. Restam ${5 - o.n} tentativas.`); return; }
  if ($('#otpLembrar')?.checked){ const L = lerLembrar(); L['cel:' + o.dig] = HOJE_ISO; gravarLembrar(L); }
  UI.otp = null; escolherAluno(alunosDoCel(o.dig));
}
function escolherAluno(quem){
  if (quem.length === 1){ fecharFolha(); ACT.entrar({v:'aluno', who:quem[0].id}); avisar(`Namaskar, ${quem[0].nome.split(' ')[0]}!`, 'check'); return; }
  abrirFolha(`${folhaCab('Quem vai entrar?', 'Este celular está na ficha de mais de uma pessoa')}<div class="list">${quem.map(a => `<button class="li tap" style="width:100%;text-align:left" data-act="entrar" data-v="aluno" data-who="${a.id}">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">${a.mats.map(m => ATIV[m.atv]?.curto || '').join(' + ')}</span></div>${ic('chevron-right','sm')}</button>`).join('')}</div>`);
}
UI.tentPin = {n:0, ate:0};
function loginInstrutor(){
  if (VALENDO) return loginInstrutorNuvem();
  const T = UI.tentPin, msg = $('#pinMsg'), dig = soDig($('#loginPin')?.value);
  if (T.ate > Date.now()){ if (msg){ msg.textContent = 'Muitas tentativas. Espere 15 minutos ou peça um PIN novo para a administração.'; msg.style.color = 'var(--bad)'; } return; }
  if (dig.length !== 6){ $('#loginPin')?.focus(); avisar('O PIN tem 6 números', 'circle-alert'); return; }
  const p = EQUIPE.find(x => x.ativo !== false && S.codigos && S.codigos[x.id] && S.codigos[x.id].c === dig);
  if (!p){ T.n++; if (T.n >= 5){ T.ate = Date.now() + 15 * 60e3; T.n = 0; } if (msg){ msg.textContent = T.ate > Date.now() ? 'Muitas tentativas. Espere 15 minutos ou peça um PIN novo para a administração.' : `PIN não confere. Restam ${5 - T.n} tentativas.`; msg.style.color = 'var(--bad)'; msg.style.fontWeight = '600'; } $('#loginPin').value = ''; $('#loginPin').focus(); return; }
  T.n = 0; UI.codigoOk[p.id] = S.codigos[p.id].v; const L = lerLembrar(); L[p.id] = S.codigos[p.id].v; gravarLembrar(L);
  ACT.entrar({v:'instrutor', who:p.id}); avisar(`Namaskar, ${p.nome}!`, 'check');
}
function folhaGoogle(){
  abrirFolha(`${folhaCab('Entrar com Google', 'Demonstração: no app de verdade abre a tela do Google')}
  <div class="stack"><p class="small muted">Escolha a conta. Só as contas cadastradas da administração passam daqui; qualquer outra volta para a entrada.</p>
    <div class="list">${ADMINS.map(a => `<button class="li tap" style="width:100%;text-align:left" data-act="adminConta" data-v="${a.id}">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">conta Google da administração</span></div>${ic('chevron-right','sm')}</button>`).join('')}</div></div>`);
}
UI.tentAdm = {n:0, ate:0};
function folhaPinAdmin(id, msg){
  const a = ADMINS.find(x => x.id === id), bloq = UI.tentAdm.ate > Date.now();
  abrirFolha(`${folhaCab(`Olá, ${escapeH(a.nome)}`, 'Digite o PIN do painel')}
  <form class="stack login" data-login="admin" data-id="${id}" style="justify-items:center;text-align:center">
    <span class="ico-b" style="width:64px;height:64px;border-radius:20px;background:color-mix(in srgb,var(--sol) 16%,var(--surface));color:var(--sol-ink)">${ic('lock','xl')}</span>
    <input class="inp codigo" id="pinAdm" inputmode="numeric" maxlength="6" placeholder="••••" aria-label="PIN do painel" ${bloq ? 'disabled' : ''}>
    <p class="small ${msg ? '' : 'muted'}" style="${msg ? 'color:var(--bad);font-weight:600' : ''}">${bloq ? 'Muitas tentativas. Espere 15 minutos.' : msg || 'De 4 a 6 números. Protege o painel se alguém pegar o celular.'}</p>
    <button class="btn pri block" type="submit" ${bloq ? 'disabled' : ''}>${ic('check')}Abrir o painel</button>
    <button class="btn ghost sm" type="button" data-act="trocarConta">Usar outra conta Google</button>
  </form>`);
  setTimeout(() => $('#pinAdm')?.focus(), 350);
}
function conferirPinAdmin(id){
  const T = UI.tentAdm; if (T.ate > Date.now()) return;
  const dig = soDig($('#pinAdm')?.value);
  if (dig && dig === (S.pinAdmin || {})[id]){ T.n = 0; const L = lerLembrar(); L.google = id; gravarLembrar(L); fecharFolha(); ACT.entrar({v:'admin', who:id}); avisar(`Namaskar, ${ADMINS.find(a => a.id === id).nome}!`, 'check'); return; }
  T.n++; if (T.n >= 5){ T.ate = Date.now() + 15 * 60e3; T.n = 0; }
  folhaPinAdmin(id, `PIN não confere. Restam ${5 - T.n} tentativas.`);
}

/* barras que rolam de lado (submenus, chips, cartões): guardar e devolver a rolagem ao redesenhar */
const ROLA_LADO = '.chips, .seg, .cats, .week, .atv-cards, .rollgrid, .tblwrap, [data-hscroll]';
const chaveTela = () => `${UI.role}|${UI.role ? UI.tab[UI.role] : ''}`;
function guardarLados(){ return {k:chaveTela(), xs:[...document.querySelectorAll('#root ' + ROLA_LADO.split(', ').join(', #root '))].map(el => el.scrollLeft)}; }
function devolverLados(g){
  const els = [...document.querySelectorAll('#root ' + ROLA_LADO.split(', ').join(', #root '))];
  if (g && g.k === chaveTela()) els.forEach((el, i) => { if (g.xs[i]) el.scrollLeft = g.xs[i]; });
  /* o item escolhido sempre à vista */
  els.forEach(el => { const on = el.querySelector(':scope > .on, :scope > [aria-selected="true"]'); if (on && el.scrollWidth > el.clientWidth + 4){ const l = on.offsetLeft - el.offsetLeft, r = l + on.offsetWidth; if (l < el.scrollLeft || r > el.scrollLeft + el.clientWidth) el.scrollLeft = Math.max(0, l - 24); } });
}
let _desenhando = false, _deNovo = false;
function render(){
  /* se um campo perde o foco no meio de um redesenho (digitou e tocou noutro menu), redesenha depois, uma vez só */
  if (_desenhando){ _deNovo = true; return; }
  _desenhando = true;
  const root = $('#root');
  const y = scrollY, lados = guardarLados();
  let _r;
  try { _r = render2(root, y); devolverLados(lados); }
  finally { _desenhando = false; }
  if (_deNovo){ _deNovo = false; setTimeout(() => { const yy = scrollY; render(); scrollTo({top:yy}); }, 0); }
  return _r;
}
function render2(root, y){
  if (VALENDO){
    travaPapel();
    if (UI.role && (!EM_DIA || (UI.role === 'aluno' && !alunoPor(S, UI.who.aluno)) || (UI.role === 'instrutor' && !PESSOA[UI.who.instrutor]))){ root.innerHTML = vBuscando(); depois(); return y; }
  }
  /* painel do instrutor só com o código pessoal (vale também para link direto e "Ver como") */
  if (UI.role === 'instrutor' && PESSOA[UI.who.instrutor]?.ativo === false){ UI.role = null; history.replaceState(null, '', location.pathname); }
  if (UI.role === 'instrutor' && !instrutorLiberado(UI.who.instrutor)){ const pid = UI.who.instrutor; UI.role = null; history.replaceState(null, '', location.pathname); root.innerHTML = vPorta(); depois(); setTimeout(() => folhaCodigo(pid), 60); return; }
  if (!UI.role){ root.innerHTML = vPorta(); depois(); return; }
  const v = UI.role === 'admin' ? vAdmin() : UI.role === 'instrutor' ? vInstrutor() : vAluno();
  root.innerHTML = casca(v);
  depois();
  return y;
}
function depois(){
  animarArcos(); ligarGraficos(); ligarCategorias();
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
  const h = location.hash.slice(1);
  if (h === 'inscricao'){ UI.abrirInscricao = true; return; }
  if (h.startsWith('evento-')){ UI.role = 'aluno'; UI.tab.aluno = 'inicio'; UI.alunoAtv = 'eventos'; return; }
  const [r, t] = h.split('-');
  if (NAV[r]){ UI.role = r; if (t && NAV[r].some(n => n[0] === t)) UI.tab[r] = t; }
}
const num = s => {
  s = String(s ?? '').replace(/[R$\s]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');          /* 1.500,00 → 1500.00 */
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');      /* 1.500 → 1500 */
  return parseFloat(s);                                                      /* 49.90 → 49.9 */
};
function reRender(){ const y = scrollY; render(); scrollTo({top:y}); }

/* ---------- ações ---------- */
const ACT = {
  entrar:(d) => { if (d.v === 'instrutor' && !instrutorLiberado(d.who)){ folhaCodigo(d.who); return; } fecharFolha(); UI.who[d.v] = d.who; if (d.v === 'aluno'){ UI.alunoAtv = 'pratica'; if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) ganhar('instalar', d.who); } ir(d.v, NAV[d.v][0][0]); },
  tab:(d) => { fecharFolha(); ir(null, d.v); },
  semLinkCartao:() => avisar('No protótipo o link ainda não está ligado. A administração põe o link em Mensalidades → Regras.', 'info'),
  feriadoNovo:() => folhaFeriadoNovo(),
  feriadoToggle:(d) => { const X = S.feriados = S.feriados || {extra:[], comAula:[]}; X.comAula = X.comAula || []; const i = X.comAula.indexOf(d.v); if (i >= 0) X.comAula.splice(i, 1); else X.comAula.push(d.v); salvar(); reRender(); avisar(i >= 0 ? `${dataBR(d.v)}: sem aula. Os alunos recebem o aviso.` : `${dataBR(d.v)}: vai ter aula normal`, 'calendar'); },
  feriadoDel:(d) => { S.feriados.extra = (S.feriados.extra || []).filter(x => x.d !== d.v); salvar(); reRender(); avisar(`${dataBR(d.v)} voltou a ter aula`, 'calendar'); },
  driveConectar:() => folhaDriveConectar(),
  driveOk:() => { const conta = ($('#drConta')?.value || ESPACO.email).trim(); S.config = S.config || {}; S.config.drive = {conta, pasta:'Backups Anirvana', em:HOJE_ISO, ultimo:null}; salvar(); fecharFolha(); reRender(); avisar(`Google Drive conectado: ${conta}. O backup do mês cai sozinho na pasta Backups Anirvana.`, 'cloud'); },
  driveEnviar:() => { try{ const bytes = montarBackup(S, {quem:quemNome()}); S.config.drive.ultimo = HOJE_ISO; (S.backups = S.backups || []).push({mes:MES_ATUAL, d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, por:quemNome(), drive:true}); salvar(); reRender(); avisar(`${nomeBackup()} (${Math.round(bytes.length / 1024)} KB) enviado para a pasta ${S.config.drive.pasta}. No protótipo o arquivo não sai daqui.`, 'cloud'); }catch(e){ avisar('Não deu para gerar o backup agora: ' + e.message, 'circle-alert'); } },
  driveSair:() => { S.config.drive = null; salvar(); reRender(); avisar('Google Drive desconectado. O backup continua indo para o e-mail e o cofre.', 'cloud-off'); },
  editarAviso:(d) => folhaEditarAviso(d.v),
  avisoPadrao:(d) => { const c = (S.avisos = S.avisos || {})[d.v] = S.avisos[d.v] || {}; delete c.q; delete c.modelo; salvar(); fecharFolha(); reRender(); avisar('Aviso de volta ao padrão'); },
  terapia:(d) => folhaTerapia(d.v),
  terapiaDel:(d) => { S.terapias = (S.terapias || []).filter(t => t.id !== d.v); salvar(); fecharFolha(); reRender(); avisar('Terapia tirada da aba do aluno'); },
  pontosLigar:() => { S.config.pontos = true; salvar(); reRender(); avisar('Pontos ligados: os alunos já veem os pontos e os presentes', 'gift'); },
  verPinAdm:(d) => { UI.verPinAdm = UI.verPinAdm === d.v ? null : d.v; reRender(); },
  trocarPinAdm:(d) => folhaTrocarPinAdm(d.v),
  editarLanc:(d) => folhaLancar('saida', d.v),
  lancDel:(d) => { const L = S.lanc.find(l => l.id === d.v); if ((S.fechados || {})[mesDe(L.d)]){ avisar(`${nomeMes(mesDe(L.d))} já foi fechado: não dá para apagar`, 'circle-alert'); return; } S.lanc = S.lanc.filter(l => l.id !== d.v); salvar(); fecharFolha(); reRender(); avisar(`Lançamento apagado: ${L.desc} · ${brl(L.valor)}`); },
  editarCats:() => folhaCategorias(),
  catRen:(d) => folhaCatRen(d.v),
  catTirar:(d) => { const C = S.cats; if (!C.fora.includes(d.v)) C.fora.push(d.v); ligarCats(); salvar(); folhaCategorias(); reRender(); avisar(`${d.v} saiu das listas. Os lançamentos antigos continuam no balanço.`); },
  catVoltar:() => { S.cats.fora = []; ligarCats(); salvar(); folhaCategorias(); reRender(); avisar('Categorias tiradas voltaram'); },
  pacote:(d) => folhaPacote(d.v),
  pacoteDel:(d) => { S.pacotes = (S.pacotes || []).filter(p => p.id !== d.v); salvar(); fecharFolha(); reRender(); avisar('Pacote tirado. Quem já pagou continua coberto.'); },
  ajusteMat:(d) => folhaAjuste(d.v),
  ajusteTirar:(d) => { const m = S.alunos.flatMap(a => a.mats).find(x => x.id === d.v); delete m.ajuste; salvar(); fecharFolha(); reRender(); avisar(`Voltou ao valor do plano: ${brl(valorMat(S, m))}`); },
  avulsaReceber:(d) => { const [sid, ...nm] = d.v.split('|'), nome = nm.join('|'), pr = S.presencas.find(p => p.s === sid && !p.a && p.nome === nome); if (!pr) return; pr.pago = d.x || 'pix'; S.pagamentos.push({id:'pg' + novoId(), avulsa:true, nome, s:sid, mes:mesDe(sid.slice(0, 10)), valor:S.regras.planos.avulsa, d:HOJE_ISO, metodo:pr.pago}); salvar(); reRender(); avisar(`Aula avulsa de ${nome.split(' ')[0]} recebida: ${brl(S.regras.planos.avulsa)}`); },
  celDemo:(d) => { const el = $('#loginCel'); if (el){ el.value = d.v; el.focus(); } },
  adminGoogle:() => { const g = lerLembrar().google; if (g && ADMINS.some(a => a.id === g)) folhaPinAdmin(g); else folhaGoogle(); },
  adminConta:(d) => folhaPinAdmin(d.v),
  trocarConta:() => { const L = lerLembrar(); delete L.google; gravarLembrar(L); folhaGoogle(); },
  role:(d) => {
    if (VALENDO && d.v === 'aluno' && !alunoPor(S, UI.who.aluno)){ if (!S.alunos.length){ avisar('Ainda não tem alunos cadastrados', 'info'); return; } UI.who.aluno = S.alunos[0].id; }
    if (VALENDO && d.v === 'instrutor' && !PESSOA[UI.who.instrutor]) UI.who.instrutor = (EQUIPE[0] || {}).id;
    if (VALENDO && d.v === 'admin' && nuvemLigada()) UI.who.admin = SESSAO.quem;
    ir(d.v); },
  nuvemInfo:() => folhaNuvem(),
  nuvemAgora:async () => { fecharFolha(); try { await enviarFila(); await puxar(); avisar(Object.keys(FILA).length ? 'Ainda subindo…' : 'Tudo em dia com a nuvem', 'cloud'); } catch(e){ avisar('Sem conexão agora. Os dados sobem quando a internet voltar.', 'cloud-off'); } },
  sairAparelho:async () => { fecharFolha(); await sairDaNuvem(); UI.pilha = []; UI.role = null; history.replaceState(null, '', location.pathname); render(); scrollTo({top:0}); avisar('Você saiu deste aparelho', 'log-out'); },
  tentarDeNovo:() => { estadoNuvem('buscando'); render(); if (EM_DIA) puxar().then(reRender).catch(reRender); else sincronizarAoAbrir().then(reRender); },
  entrarAluno:(d) => { if (VALENDO && nuvemLigada()) entrarPainelNuvem('aluno', d.who); else ACT.entrar({v:'aluno', who:d.who}); },
  editarTurma:(d) => folhaTurma(d.v || null),
  contaFixa:(d) => folhaContaFixa(d.v || null),
  editarAluno:(d) => folhaEditarAluno(d.v),
  editarMat:(d) => folhaMat(d.v, d.x || null),
  matNova:(d) => folhaMat(d.v, null, d.x),
  editarPag:(d) => folhaPag(d.v),
  pagDel:(d) => { const p = S.pagamentos.find(x => x.id === d.v); if (!p) return; if ((S.fechados || {})[p.mes]){ avisar('Mês fechado: peça para reabrir antes de apagar', 'circle-alert'); return; } S.pagamentos = S.pagamentos.filter(x => x.id !== d.v); salvar(); reRender(); if (p.a) folhaAluno(p.a); else fecharFolha(); avisar(`Pagamento de ${brl(p.valor)} apagado`, 'trash-2'); },
  contaDel:(d) => { if (!S.contas) S.contas = CONTAS_FIXAS.map(c => ({id:c.id, nome:c.nome, cat:c.cat, valor:c.valor, dia:c.dia})); S.contas = S.contas.filter(c => c.id !== d.v); salvar(); fecharFolha(); reRender(); avisar('Conta tirada da lista (os pagamentos antigos ficam no balanço)', 'receipt'); },
  turmaTirar:(d) => { const t = TURMA[d.v]; if (!t) return; abrirFolha(`${folhaCab('Tirar da grade?', `${escapeH(nomeTurma(t))} · ${DIAS_L[t.dia]} ${t.h}`)}<div class="stack"><p>As aulas que já aconteceram e a chamada continuam no histórico. Os alunos dessa turma ficam sem esse horário: confira as matrículas depois.</p><div class="sheet-foot"><button class="btn sec" data-act="editarTurma" data-v="${t.id}">Voltar</button><button class="btn bad" data-act="turmaTirarSim" data-v="${t.id}">${ic('trash-2','sm')}Tirar da grade</button></div></div>`); },
  turmaTirarSim:(d) => { S.turmasFora = [...new Set([...(S.turmasFora || []), d.v])]; ligarAtividades(); ligarEquipe(); salvar(); fecharFolha(); reRender(); avisar('Horário fora da grade', 'calendar-x'); },
  trocar:() => VALENDO && nuvemLigada() ? folhaConta() : abrirFolha(`${folhaCab('Ver o app como…', 'No app de verdade cada pessoa entra com o próprio login e vê só o painel dela.')}
    <div class="stack"><p class="tiny muted" style="margin-top:-4px">Atalho da demonstração: pula o login.</p>${[['admin','Administração',ADMINS.map(a=>[a.id,a.nome])],['instrutor','Instrutores',EQUIPE.filter(p=>p.id!=='stefy').map(p=>[p.id,p.nome])],['aluno','Alunos',[['a01','Luana'],['a04','Camila'],['a12','Débora'],['a30','Alice'],['a09','Gabriel']]]].map(([r,l,ps]) => `<div><div class="eyebrow" style="margin-bottom:8px">${l}</div><div class="chips" style="flex-wrap:wrap">${ps.map(([id,n]) => `<button class="chip ${UI.role===r&&UI.who[r]===id?'on':''}" data-act="entrar" data-v="${r}" data-who="${id}">${n}</button>`).join('')}</div></div>`).join('')}
    <button class="btn sec" data-act="sair">${ic('log-out')}Voltar para a entrada</button>
    <button class="btn ghost" data-act="reset">${ic('rotate-ccw')}Recomeçar a demonstração</button></div>`),
  sair:() => { fecharFolha(); UI.pilha = []; if (VALENDO && nuvemLigada()){ const r = papelPainel(SESSAO.papel); UI.who[r] = SESSAO.quem; ir(r, NAV[r][0][0]); return; } UI.role = null; history.replaceState(null,'',location.pathname); render(); scrollTo({top:0}); },
  reset:() => { restaurarBases(); S = semear(); ligarFornecedores(); ligarAtividades(); ligarEquipe(); salvar(); UI.cart = {}; fecharFolha(); render(); avisar('Demonstração recomeçada'); },
  fechar:() => fecharFolha(),
  ir:(d) => { const [r,t] = d.v.split('-'); if (t === 'confirmar'){ UI.mensVis = 'alunos'; UI.mensSt = 'analise'; UI.mensAtv = 'todas'; ir(null,'mensalidades'); return; } if (t === 'alunos'){ UI.escolaVis = 'alunos'; ir(null,'escola'); return; } if (t === 'mais'){ UI.escolaVis = 'subs'; ir(null,'escola'); return; } if (d.sub) UI.lojaVis = d.sub; if (t === 'mensalidades'){ UI.mensVis = 'alunos'; UI.mensSt = 'atrasado'; } ir(null, t); },
  copiar:(d) => { const ok = () => avisar('Copiado'); try{ navigator.clipboard.writeText(d.v).then(ok, () => avisar(d.v,'copy')); }catch(e){ avisar(d.v,'copy'); } },
  opt:(d, el) => {
    $$(`.opt[data-grp="${d.grp}"]`).forEach(o => o.classList.toggle('on', o === el));
    const h = $('#'+d.grp); if (h){ h.value = d.v; if (d.grp === 'f_menor') h.dataset.mexeu = '1'; }
    if (d.grp === 'lCat'){ const dica = CAT_SAIDA[d.v]?.dica || CAT_ENTRADA[d.v]?.dica; const el2 = $('#lDica'); if (el2) el2.textContent = dica || ''; }
    if (d.grp === 'vForma'){ const f = $('#vClienteF'); if (f) f.hidden = !['fiado','descontado'].includes(d.v); }
    if (d.grp === 'iAtv'){ inscSalvar(); UI.insc.d.atv = d.v; UI.insc.d.instr = ''; UI.insc.d.turmas = ''; const y = $('#sheet').scrollTop; folhaInscricao(); $('#sheet').scrollTop = y; return; }
    if (d.grp === 'rPac'){ const v = +el.dataset.valor; $('#rValor').value = v.toFixed(2).replace('.', ','); $('#rMeses').value = el.dataset.meses; }
    if (d.grp === 'fnModelo'){ const f = $('#fnPctF'); if (f) f.hidden = d.v !== 'consig'; }
    if (d.grp === 'nAtv'){ $('#nPlanoF').hidden = d.v !== 'yoga'; const fi = $('#nInstrF'); if (fi){ const q = EQUIPE.filter(p => p.atvs.includes(d.v)); fi.hidden = ATIV[d.v].vis !== 'escolhido'; fi.querySelector('.optgrid').innerHTML = q.map(p => `<button type="button" class="opt" data-act="opt" data-grp="nInstr" data-v="${p.id}">${p.nome}</button>`).join(''); $('#nInstr').value = ''; } $('#nTurmas').innerHTML = TURMAS.filter(t => t.atv === d.v && !t.aluno).map(t => `<button type="button" class="opt" data-act="optMulti" data-grp="nTur" data-v="${t.id}">${DIAS[t.dia]} ${t.h}<br><span class="tiny muted">${PESSOA[t.instr].nome}</span></button>`).join('') || '<p class="small muted">Com hora marcada: a terapeuta combina o horário.</p>'; $('#nTur').value = ''; }
  },
  optMulti:(d, el) => { el.classList.toggle('on'); $('#'+d.grp).value = $$(`.opt.on[data-grp="${d.grp}"]`).map(o => o.dataset.v).join(','); },

  /* admin */
  lancar:() => folhaLancar('saida'),
  lancTipo:(d) => folhaLancar(d.v),
  pagarConta:(d) => { const c = contasLista().find(x => x.id === d.v); if (!c) return; if (VALENDO || !(c.valor > 0)){ const ult = S.lanc.filter(l => l.conta === c.id).sort((a, b) => a.d < b.d ? 1 : -1)[0]; folhaLancar('saida'); const f = $('#fLanc'); if (f) f.dataset.conta = c.id; $('#lDesc').value = c.nome; const v = ult ? ult.valor : c.valor; if (v > 0) $('#lValor').value = v.toFixed(2).replace('.', ','); const o = [...$$('.opt[data-grp="lCat"]')].find(x => x.dataset.v === c.cat); if (o) o.click(); setTimeout(() => $('#lValor')?.focus(), 300); return; } S.lanc.push({id:'l'+novoId(), tipo:'saida', d:HOJE_ISO, valor:c.valor, desc:c.nome, cat:c.cat, conta:c.id}); salvar(); reRender(); avisar(`${c.nome} paga · ${brl(c.valor)} lançado em ${c.cat}`); },
  balVis:(d) => { UI.balVis = d.v; reRender(); },
  balMes:(d) => { UI.balMes = d.v; reRender(); },
  catFoco:(d) => { UI.catFoco = d.v; const y = scrollY; render(); const c = $('.card.pad-lg'); if (c && matchMedia('(max-width:759px)').matches) c.scrollIntoView({behavior: RM ? 'auto' : 'smooth', block:'start'}); else scrollTo({top:y}); },
  mensVis:(d) => { UI.mensVis = d.v; reRender(); },
  mensSt:(d) => { UI.mensSt = d.v; reRender(); },
  mensAtv:(d) => { UI.mensAtv = d.v; reRender(); },
  fechMes:(d) => { UI.fechMes = d.v; reRender(); },
  receber:(d) => folhaReceber(d.v),
  piso:() => { S.regras.piso = !S.regras.piso; salvar(); reRender(); avisar(S.regras.piso ? 'Piso ligado: ninguém recebe menos que o valor da aula vazia por aula dada' : 'Piso desligado: vale a regra da planilha'); },
  fecharMes:(d) => { (S.fechados = S.fechados || {})[d.v] = HOJE_ISO; (S.backups = S.backups || []).push({mes:d.v, d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, por:'automático'}); salvar(); reRender(); avisar(`${nomeMes(d.v)} fechado. O backup em Excel saiu para ${ESPACO.email}.`, 'check'); },
  backupDrive:() => { backupNoDrive().then(() => reRender()); },
  baixarBackup:() => { try{ const bytes = montarBackup(S, {quem:quemNome()}); baixarArquivo(bytes, nomeBackup(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); (S.backups = S.backups || []).push({mes:MES_ATUAL, d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, por:quemNome()}); salvar(); reRender(); avisar(`Backup baixado: ${nomeBackup()} (${Math.round(bytes.length / 1024)} KB)`, 'download'); }catch(e){ avisar('Não deu para gerar o backup agora: ' + e.message, 'circle-alert'); } },
  darBaixa:(d) => { const x = S.avisosPag.find(v => v.id === d.v), a = alunoPor(S, x.a); if (!S.pagamentos.some(p => p.mat === x.mat && p.mes === x.mes)) S.pagamentos.push({id:'pg'+novoId(), a:x.a, mat:x.mat, mes:x.mes, valor:x.valor, d:x.d, metodo:x.metodo, baixaPor:quemNome(), baixaEm:HOJE_ISO}); x.estado = 'confirmado'; x.por = quemNome(); x.em = HOJE_ISO;
    S.caixa = S.caixa || {}; (S.caixa['a:' + x.a] = S.caixa['a:' + x.a] || []).unshift({t:`Pagamento de ${nomeMes(x.mes).toLowerCase()} confirmado`, s:`${brl(x.valor)} · obrigado!`, icon:'check'});
    salvar(); reRender(); avisar(`Baixa dada: ${a.nome.split(' ')[0]} · ${brl(x.valor)} em ${nomeMes(x.mes).toLowerCase()}`, 'check'); },
  recusarAviso:(d) => { const x = S.avisosPag.find(v => v.id === d.v), a = alunoPor(S, x.a); x.estado = 'recusado'; x.por = quemNome(); x.em = HOJE_ISO;
    S.caixa = S.caixa || {}; (S.caixa['a:' + x.a] = S.caixa['a:' + x.a] || []).unshift({t:'Não achamos seu pagamento', s:`O ${x.metodo === 'cartao' ? 'cartão' : 'Pix'} de ${dataBR(x.d)} não apareceu na conta. Fale com o Espaço pelo WhatsApp.`, icon:'circle-alert'});
    salvar(); reRender(); avisar(`${a.nome.split(' ')[0]} vai receber o aviso de que o pagamento não apareceu`, 'bell'); },
  pagarEquipe:(d) => { S.repEquipe.push({id:'re'+novoId(), p:d.v, mes:d.mes, d:HOJE_ISO}); salvar(); reRender(); avisar(`Repasse de ${PESSOA[d.v].nome} marcado como pago`); },
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
  novoProduto:(d) => folhaProduto(null, d.forn || UI.lojaForn),
  editarProduto:(d) => folhaProduto(d.v),
  removerProduto:(d) => { const p = prodPor(d.v); S.produtos = S.produtos.filter(x => x.id !== d.v); delete UI.cart[d.v]; salvar(); fecharFolha(); reRender(); avisar(`${p.nome} saiu da lojinha. As vendas antigas continuam no histórico.`, 'check'); },
  checkout:() => folhaCheckout(),
  qtd:(d) => { UI.cart[d.v] = Math.max(0, (UI.cart[d.v]||0) + +d.x); if (!itensCarrinho().length){ fecharFolha(); reRender(); return; } folhaCheckout(); },
  registrarVenda:() => {
    const forma = $('#vForma').value, cliente = ($('#vCliente')?.value || '').trim();
    if (['fiado','descontado'].includes(forma) && !cliente){ $('#vCliente').focus(); avisar('Diga quem levou, para cobrar depois','circle-alert'); return; }
    const it = itensCarrinho(), total = r2(it.reduce((s,i) => s + i.total, 0));
    it.forEach(i => S.vendas.push({id:'v'+novoId(), d:HOJE_ISO, desc:`${i.q} ${i.nome.toLowerCase()}`, valor:i.total, forma, forn:i.forn, pct:FORN[i.forn].pct, evento:'', fonte:'app', itens:[{p:i.id, q:i.q}]}));
    const descItens = it.map(i => `${i.q} ${i.nome.toLowerCase()}`).join(', ');
    const daEquipe = forma === 'descontado' && EQUIPE.find(p => p.nome.toLowerCase() === cliente.toLowerCase() || p.nome.split(' ')[0].toLowerCase() === cliente.split(' ')[0].toLowerCase());
    if (daEquipe) (S.descontos = S.descontos || []).push({id:'de'+novoId(), p:daEquipe.id, mes:MES_ATUAL, valor:total, desc:descItens, d:HOJE_ISO});
    else if (forma === 'fiado' || forma === 'descontado') S.fiado.push({id:'fi'+novoId(), cliente, desc:descItens + (forma === 'descontado' ? ' (descontar)' : ''), valor:total, d:HOJE_ISO, pago:false});
    salvar();
    const venda = {d:HOJE_ISO, total, forma, cliente, itens:it.map(i => ({nome:i.nome, q:i.q, total:i.total, forn:i.forn}))};
    UI.cart = {};
    const cb = $('#cartbar'); if (cb){ const nb = document.createElement('div'); nb.innerHTML = barraCarrinho(); cb.replaceWith(nb.firstElementChild); }
    $$('.prod .q').forEach(q => q.remove());
    SHEET_ON_CLOSE = null;
    folhaRecibo(venda);
    SHEET_ON_CLOSE = () => reRender();
  },
  novoForn:() => folhaFornecedor(null),
  editarForn:(d) => folhaFornecedor(d.v),
  desativarForn:(d) => { const f = FORN[d.v], temVenda = S.vendas.some(v => v.forn === f.id); if (temVenda) f.ativo = false; else { S.fornecedores = S.fornecedores.filter(x => x.id !== f.id); S.produtos = (S.produtos || []).filter(p => p.forn !== f.id); } ligarFornecedores(); salvar(); fecharFolha(); reRender(); avisar(temVenda ? `${f.curto} saiu da lojinha. As vendas e o saldo dele continuam no histórico.` : `${f.curto} apagado`, 'check'); },
  reativarForn:(d) => { FORN[d.v].ativo = true; salvar(); reRender(); avisar(`${FORN[d.v].curto} de volta na lojinha`); },
  pagarForn:(d) => { const f = saldoFornecedores(S).find(x => x.id === d.v); S.repLoja.push({id:'rl'+novoId(), forn:f.id, valor:f.saldo, d:HOJE_ISO}); salvar(); reRender(); avisar(`${brl(f.saldo)} pagos a ${f.curto} · lançado no balanço como repasse`); },
  recebiFiado:(d) => { const f = S.fiado.find(x => x.id === d.v); f.pago = true; f.pagoEm = HOJE_ISO; salvar(); reRender(); avisar(`Recebido de ${f.cliente.split(' ')[0]}: ${brl(f.valor)}`); },

  /* instrutor */
  instrFiltro:(d) => { UI.instrFiltro = d.v; reRender(); },
  meuMes:(d) => { UI.meuMes = d.v; reRender(); },
  chamada:(d) => folhaChamada(d.v),
  marcar:(d, el) => { const s = CHAMADA.presentes; s.has(d.v) ? s.delete(d.v) : s.add(d.v); const y = $('#sheet').scrollTop; desenharChamada(); $('#sheet').scrollTop = y; },
  addExtra:(d) => { CHAMADA.extras.push(d.v); CHAMADA.presentes.add(d.v); desenharChamada(); },
  visitAdd:() => { const nome = ($('#visNome')?.value || '').trim(), t = $('#visTipo')?.value || 'avulsa', tel = ($('#visTel')?.value || '').trim(), pago = t === 'avulsa' ? ($('#visPago')?.value || 'pix') : null; if (!nome){ $('#visNome')?.focus(); avisar('Escreva o nome de quem veio', 'circle-alert'); return; } CHAMADA.visitantes.push({nome, t, ...(tel ? {tel} : {}), ...(pago ? {pago} : {})}); const y = $('#sheet').scrollTop; desenharChamada(); $('#sheet').scrollTop = y; },
  visitDel:(d) => { CHAMADA.visitantes.splice(+d.v, 1); const y = $('#sheet').scrollTop; desenharChamada(); $('#sheet').scrollTop = y; },
  salvarChamada:(d) => {
    const {sid} = CHAMADA, [dia, tid] = sid.split('_'), t = TURMA[tid];
    if ((S.fechados || {})[mesDe(dia)]){ avisar(`${nomeMes(mesDe(dia))} já foi fechado. Peça para a administração reabrir.`, 'circle-alert'); return; }
    S.presencas = S.presencas.filter(p => p.s !== sid);
    CHAMADA.presentes.forEach(aid => { const a = alunoPor(S,aid); const m = a.mats.find(x => x.atv === t.atv) || a.mats[0]; S.presencas.push({s:sid, a:aid, t: m.plano || 'mensal'}); });
    if (d.v === 'vazia'){ CHAMADA.presentes.clear(); CHAMADA.visitantes = []; S.presencas = S.presencas.filter(p => p.s !== sid); }
    CHAMADA.visitantes.forEach(v => S.presencas.push({s:sid, a:null, nome:v.nome || 'Visitante', t:v.t || 'avulsa', ...(v.tel ? {tel:v.tel} : {}), ...(v.pago ? {pago:v.pago} : {})}));
    /* aula avulsa paga na hora vira pagamento (entra no caixa e no fechamento da yoga) */
    S.pagamentos = S.pagamentos.filter(p => !(p.avulsa && p.s === sid));
    CHAMADA.visitantes.filter(v => v.t === 'avulsa' && v.pago && v.pago !== 'depois').forEach(v => S.pagamentos.push({id:'pg' + novoId(), avulsa:true, nome:v.nome, s:sid, mes:mesDe(dia), valor:S.regras.planos.avulsa, d:dia, metodo:v.pago}));
    const au = S.aulas[sid] || (S.aulas[sid] = {id:sid, d:dia, turma:tid, instr:UI.who.instrutor, sub:false});
    const n = CHAMADA.presentes.size + CHAMADA.visitantes.length;
    au.feita = true; au.vazia = d.v === 'vazia' || n === 0;
    salvar(); fecharFolha(); reRender();
    avisar(au.vazia ? `Aula vazia registrada · vale ${brl(S.regras.aulaVazia)}` : `Chamada salva: ${n} ${n===1?'presente':'presentes'}`);
  },
  minhaTurma:(d) => folhaMinhaTurma(d.v),
  pedirSub:(d) => folhaPedirSub(d.v, d.d),
  aceitarSub:(d) => { const s = S.subs.find(x => x.id === d.v); s.status = 'aceito'; s.para = UI.who.instrutor; salvar(); reRender(); avisar(`Combinado: você cobre ${PESSOA[s.de].nome} em ${dataBR(s.d)}. Ela e a administração já sabem.`); },
  recusarSub:(d) => { const s = S.subs.find(x => x.id === d.v); (s.recusas = s.recusas || []).push(UI.who.instrutor); salvar(); reRender(); avisar('Ok, o pedido segue aberto para as outras'); },


  /* logo e avisos */
  logo:() => { if (VALENDO && nuvemLigada()){ const r = papelPainel(SESSAO.papel); UI.who[r] = r === 'aluno' && UI.role === 'aluno' ? UI.who.aluno : SESSAO.quem; ir(r, NAV[r][0][0]); return; } ACT.sair(); },
  voltar:() => { if (history.state && history.state.anv) history.back(); else voltarTela(); },
  conferirCodigo:(d) => { if (conferirCodigo(d.v)){ fecharFolha(); avisar(`Bem-vinda, ${PESSOA[d.v].nome}`, 'check'); ACT.entrar({v:'instrutor', who:d.v}); } },
  novaAtividade:() => folhaAtividade(null),
  editarAtividade:(d) => folhaAtividade(d.v),
  excluirAtividade:(d) => { const k = d.v, n = S.alunos.filter(a => a.mats.some(m => m.atv === k && m.status !== 'cancelado')).length;
    if (n){ avisar(`${ATIV[k].curto} tem ${n} ${n === 1 ? 'aluno' : 'alunos'}. Cancele as matrículas antes de tirar a atividade.`, 'circle-alert'); return; }
    S.atividades[k] = null; S.turmasFora = [...new Set([...S.turmasFora, ...TURMAS.filter(t => t.atv === k).map(t => t.id)])]; ligarAtividades(); ligarEquipe(); salvar(); fecharFolha(); reRender(); avisar('Atividade tirada. O histórico continua no balanço.', 'check'); },
  novoHorario:(d) => folhaHorario(d.v),
  tirarHorario:(d) => { const t = TURMA[d.v], n = matriculadosNaTurma(S, d.v).length; S.turmasFora = [...new Set([...S.turmasFora, d.v])]; S.alunos.forEach(a => a.mats.forEach(m => { m.turmas = m.turmas.filter(x => x !== d.v); })); ligarAtividades(); ligarEquipe(); salvar(); reRender(); avisar(`${DIAS_L[t.dia]} ${t.h} saiu da grade${n ? `. ${n} ${n === 1 ? 'aluno precisa' : 'alunos precisam'} de outro horário` : ''}.`, 'check'); },
  editarEvento:(d) => folhaEvento(d.v),
  excluirEvento:(d) => folhaExcluirEvento(d.v),
  confirmarExcluirEvento:(d) => { const e = S.eventos.find(x => x.id === d.v); S.caixa = S.caixa || {}; e.inscritos.forEach(i => (S.caixa['a:' + i.a] = S.caixa['a:' + i.a] || []).unshift({t:`${e.nome} foi cancelado`, s:`Era ${dataBR(e.data)} às ${e.h}. A equipe fala com você pelo WhatsApp.`, icon:'circle-alert'})); S.eventos = S.eventos.filter(x => x.id !== d.v); salvar(); fecharFolha(); reRender(); avisar(`${e.nome} excluído${e.inscritos.length ? ` · ${e.inscritos.length} inscritos avisados` : ''}`, 'check'); },
  novoInstrutor:() => folhaInstrutor(null),
  editarInstrutor:(d) => folhaInstrutor(d.v),
  excluirInstrutor:(d) => folhaExcluirInstrutor(d.v),
  confirmarExclusao:(d) => excluirInstrutor(d.v, $('#exRep')?.value || null),
  verCodigo:(d) => { UI.verCod = UI.verCod === d.v ? null : d.v; reRender(); },
  novoCodigo:(d) => { novoCodigo(d.v); reRender(); folhaCodigoNovo(d.v); },
  sino:() => folhaCaixa(),
  irAviso:(d) => { fecharFolha(); if (d.v === 'confirmar'){ ACT.ir({v:'admin-confirmar'}); return; } if (UI.role === 'aluno' && d.v === 'eventos'){ UI.alunoAtv = 'eventos'; ir(null, 'inicio'); return; } if (d.v === 'inscricoes'){ ir('admin', 'inscricoes'); return; } ir(null, d.v); },
  divVis:(d) => { UI.div.vis = d.v; reRender(); },
  avAlvo:(d) => { UI.av.texto = $('#avTexto')?.value ?? UI.av.texto; UI.av.titulo = $('#avTitulo')?.value ?? UI.av.titulo; UI.av.alvo = d.v; reRender(); },
  avCanal:(d) => { UI.av.texto = $('#avTexto')?.value ?? UI.av.texto; UI.av.titulo = $('#avTitulo')?.value ?? UI.av.titulo; const c = new Set(UI.av.canais); c.has(d.v) ? c.delete(d.v) : c.add(d.v); UI.av.canais = [...c]; reRender(); },
  avQuando:(d) => { UI.av.texto = $('#avTexto')?.value ?? UI.av.texto; UI.av.titulo = $('#avTitulo')?.value ?? UI.av.titulo; UI.av.quando = d.v; reRender(); },
  avModelo:(d) => { const [t, x] = MODELOS_AVISO[+d.v]; UI.av.titulo = t; UI.av.texto = x; reRender(); },
  avEnviar:() => enviarAvisoLivre(),
  canalAviso:(d) => { const r = regraAviso(d.v), c = (S.avisos = S.avisos || {})[d.v] = S.avisos[d.v] || {}; const set = new Set(r.canais); set.has(d.x) ? set.delete(d.x) : set.add(d.x); c.canais = [...set]; salvar(); reRender(); avisar(`${r.nome}: ${c.canais.length ? c.canais.map(k => CANAIS[k].nome).join(', ') : 'nenhum canal'}`, 'bell'); },
  ligaAviso:(d) => { const r = regraAviso(d.v), c = (S.avisos = S.avisos || {})[d.v] = S.avisos[d.v] || {}; c.ativo = !r.ativo; salvar(); reRender(); avisar(`${r.nome}: ${c.ativo ? 'ligado' : 'desligado'}`, c.ativo ? 'bell' : 'pause'); },
  previaAviso:(d) => folhaPreviaAviso(d.v),
  testeAviso:(d) => { const r = regraAviso(d.v); fecharFolha(); mostrarPush('Espaço Anirvana', preencher(r.modelo, alunoPor(S,'a01'))); (S.enviados = S.enviados || []).push({para:`${quemNome()} (teste)`, canal:r.canais[0] || 'push', regra:r.id, quando:'hoje 10:50'}); salvar(); setTimeout(reRender, 300); },

  /* inscrição (réplica dos Google Forms de cada atividade) */
  inscricao:() => { UI.insc = {passo:0, d:{}}; folhaInscricao(); },
  inscPasso:(d) => { inscSalvar(); const dir = +d.v; if (dir > 0){ const falta = inscValida(UI.insc.passo); if (falta.length){ avisar('Falta ' + falta.join(', '), 'circle-alert'); return; } } let p = Math.max(0, Math.min(3, UI.insc.passo + dir)); if (passoPula(p)) p = Math.max(0, Math.min(3, p + dir)); UI.insc.passo = p; folhaInscricao(); $('#sheet').scrollTop = 0; },
  verTermos:() => { inscSalvar(); folhaTermos(); },
  fecharTermos:() => folhaInscricao(),
  inscEnviar:() => {
    inscSalvar(); const falta = inscValida(3); if (falta.length){ avisar('Falta ' + falta.join(', '), 'circle-alert'); return; }
    const d = UI.insc.d, F = FORMULARIOS[formDe(d.atv)];
    const daAdm = VALENDO && nuvemLigada() && papelPainel(SESSAO.papel) === 'admin';
    if (VALENDO && !daAdm && !UI.inscOk){
      if (UI.enviandoInsc) return; UI.enviandoInsc = true; avisar('Enviando…', 'send');
      rpc('inscrever', {p_dados:{...d}}).then(r => { UI.enviandoInsc = false; if (r && r.erro){ avisar(r.erro, 'circle-alert'); return; } UI.inscOk = true; ACT.inscEnviar(); })
        .catch(() => { UI.enviandoInsc = false; avisar('Sem conexão. Confira a internet e toque em Enviar de novo.', 'circle-alert'); });
      return;
    }
    if (!VALENDO || daAdm){ (S.inscricoes = S.inscricoes || []).push({id:'in' + novoId(), d:HOJE_ISO, estado:'nova', origem:UI.insc.balcao ? 'balcao' : 'app', dados:{...d}}); salvar(); }
    UI.inscOk = false;
    const quem = F.crianca ? d.respNome : d.nome, prof = PROF_FORM[d.atv];
    const zap = `https://wa.me/5541998487892?text=${encodeURIComponent(`Oi! Acabei de fazer a inscrição de ${d.nome} em ${ATIV[d.atv].nome} pelo app.`)}`;
    abrirFolha(`${folhaCab('Inscrição enviada', '')}<div class="stack" style="text-align:center;justify-items:center"><span class="ico-b" style="width:72px;height:72px;border-radius:24px;background:var(--ok-bg);color:var(--ok)">${ic('check','xl')}</span><h2 style="font-size:26px">Namaskar, ${escapeH(String(quem || '').split(' ')[0])}!</h2>
      <p class="muted" style="max-width:42ch">${F.final ? escapeH(F.final.replace('{prof}', prof || '')) : `A administração do Espaço já recebeu sua inscrição e a sua ficha. A confirmação do horário chega pelo WhatsApp${d.experimental ? ', junto com a data da aula experimental' : ''}.`}</p>
      <div class="row wrap" style="justify-content:center"><a class="btn sec" href="${zap}" target="_blank" rel="noopener">${ic('phone','sm')}Falar no WhatsApp</a><button class="btn pri" data-act="fechar">Pronto</button></div></div>`);
    if (!VALENDO) setTimeout(() => mostrarPush('Nova inscrição', `${d.nome} quer ${ATIV[d.atv].curto.toLowerCase()}. A ficha já está no painel.`), 900);
    if (UI.role) setTimeout(reRender, 400);
  },
  verInscricao:(d) => { const i = S.inscricoes.find(x => x.id === d.v), x = i.dados, F = FORMULARIOS[formDe(x.atv)];
    const a = {id:'_', nome:x.nome, mats:[{atv:x.atv}], ficha:{form:F.id, respostas:x, saudeOk:x.saudeOk !== false}};
    const contato = F.crianca ? x.tel : x.tel;
    abrirFolha(`${folhaCab(escapeH(x.nome), `${escapeH(tituloForm(F, x.atv))} · inscrição de ${dataBR(i.d)}${i.origem === 'forms' ? ' · veio do Google Forms' : ' · pelo app'}`)}<div class="stack">
      <div class="list"><div class="li"><span class="ico-b" style="color:${ATIV[x.atv].hex}">${ic(ATIV[x.atv].icon)}</span><div class="main-c"><span class="t">${ATIV[x.atv].nome}${x.plano && x.atv === 'yoga' && PLANOS_YOGA[x.plano] ? ' · ' + PLANOS_YOGA[x.plano].nome : ''}${x.atv === 'particular' && PLANOS_PART[x.plano] ? ` · ${PLANOS_PART[x.plano].nome} · ${x.modo === 'online' ? 'online' : 'presencial'}` : ''}</span><span class="s">${(x.turmas || '').split(',').filter(Boolean).map(t => TURMA[t] ? `${DIAS[TURMA[t].dia]} ${TURMA[t].h}` : '').join(', ') || 'horário a combinar'}${x.experimental ? ' · quer aula experimental' : ''}</span></div></div>
      <div class="li"><span class="ico-b">${ic('phone')}</span><div class="main-c"><span class="t num">${escapeH(contato || '—')}</span><span class="s">${F.crianca ? `WhatsApp de ${escapeH(x.respNome || 'responsável')}` : 'WhatsApp'}</span></div>${contato ? `<button class="btn ghost sm" data-act="copiar" data-v="${escapeH(contato)}">${ic('copy','sm')}Copiar</button>` : ''}</div></div>
      ${blocoFicha(a, 'admin')}
      ${i.origem === 'forms' && !x.priv ? `<div class="alert warn"><span class="ib">${ic('circle-alert')}</span><div><div class="t">Falta o aceite da privacidade</div><div class="s">Quem veio do Google Forms recebe o link para aceitar a política de privacidade no primeiro acesso.</div></div></div>` : ''}
      ${x.atv === 'yoga' && i.estado === 'nova' ? `<div class="field"><label>Plano</label><div class="optgrid">${[...PLANOS_MENSAIS, 'wellhub', 'gogood'].map(k => `<button type="button" class="opt ${(x.plano || '2x') === k ? 'on' : ''}" data-act="opt" data-grp="cPlano" data-v="${k}">${PLANOS_YOGA[k].nome}<br><b class="num">${brl(S.regras.planos[k])}</b></button>`).join('')}</div><input type="hidden" id="cPlano" value="${escapeH(x.plano || '2x')}"></div>` : ''}
      ${(x.conferir || []).length && i.estado === 'nova' ? `<div class="alert warn"><span class="ib">${ic('circle-alert')}</span><div><div class="t">Conferir</div><div class="s">${x.conferir.map(escapeH).join(' · ')}</div></div></div>` : ''}
      ${x.atv === 'particular' && i.estado === 'nova' ? `<div class="field"><label>Quem vai dar a aula particular</label><div class="optgrid">${EQUIPE.filter(p => p.atvs.includes('particular')).map(p => `<button type="button" class="opt ${x.instr === p.id ? 'on' : ''}" data-act="opt" data-grp="cInstr" data-v="${p.id}">${av(p.nome)}${escapeH(p.nome)}</button>`).join('')}</div><input type="hidden" id="cInstr" value="${escapeH(x.instr || '')}"><span class="help">${x.modo === 'online' ? 'Pediu online.' : 'Pediu presencial.'} O aluno só aparece para a professora escolhida.</span></div>` : ''}
      <div class="sheet-foot"><button class="btn sec" data-act="fechar">Depois</button><button class="btn pri" data-act="confirmarInscricao" data-v="${i.id}">${ic('check')}Confirmar matrícula</button></div></div>`); },
  confirmarInscricao:(d) => { const ii = S.inscricoes.find(x => x.id === d.v); if (ii && ii.dados.atv === 'particular' && !ii.dados.instr){ const sel = $('#cInstr')?.value; if (!sel){ ACT.verInscricao(d); setTimeout(() => avisar('Escolha quem vai dar a aula particular', 'circle-alert'), 300); return; } ii.dados.instr = sel; }
    if (ii && ii.dados.atv === 'yoga' && $('#cPlano')) ii.dados.plano = $('#cPlano').value;
    const r = confirmarInscricao(d.v); salvar(); fecharFolha(); reRender(); avisar(`Matrícula confirmada. A ficha já aparece para ${r.quem.join(', ') || 'a equipe'}, e a família recebeu o WhatsApp de boas-vindas.`, 'user-plus'); },
  linkInscricao:() => ACT.copiar({v:'https://rottaguide.com/anirvana#inscricao'}),
  importarForms:() => folhaImportar(),
  fecharImport:() => { fecharFolha(); if (UI.role === 'admin') ir('admin', 'inscricoes'); },
  inscricaoBalcao:() => { UI.insc = {passo:0, d:{}, balcao:true}; folhaInscricao(); },
  salvarMinhaFicha:() => { inscSalvar(); const falta = inscValida(UI.insc.passo); if (falta.length){ avisar('Falta ' + falta.join(', '), 'circle-alert'); return; }
    const a = alunoPor(S, UI.who.aluno), d = UI.insc.d, F = FORMULARIOS[formDe(d.atv)], antes = !!(a.ficha && a.ficha.completa);
    const respostas = Object.fromEntries(Object.entries(d).filter(([k]) => !['atv','plano','turmas','instr','experimental','saudeOk'].includes(k)));
    a.ficha = {...(a.ficha || {}), form:F.id, respostas:{...((a.ficha || {}).respostas || {}), ...respostas}, saudeOk:d.saudeOk !== false, completa:true};
    const novo = !antes && !((S.pontosAcoes || {})[a.id] || {}).ficha; ganhar('ficha'); salvar(); fecharFolha(); reRender(); avisar(novo ? 'Ficha salva: +30 pontos' : 'Ficha atualizada. A professora já vê.', 'clipboard-check'); },
  verMinhaFicha:() => { const a = alunoPor(S, UI.who.aluno), f = a.ficha || {}, atv = a.mats[0].atv, F = FORMULARIOS[formDe(atv)];
    const passo = F.passos.findIndex(p => p.campos.some(c => c.saude)) + 1;
    UI.insc = {passo, d:{...(f.respostas || {}), atv, nome:a.nome, nasc:a.nasc, saudeOk:f.saudeOk !== false}, minha:true}; folhaInscricao(); },

  /* pontos */
  instalarApp:() => folhaInstalar(),
  instalarAgora:async () => { const p = window.__pedidoInstalar; if (!p) return; p.prompt(); try{ const r = await p.userChoice; if (r.outcome === 'accepted') ACT.instalouDemo(); }catch(e){} },
  instalouDemo:() => { ganhar('instalar'); fecharFolha(); reRender(); avisar('App instalado: +50 pontos', 'gift'); },
  ativarAvisos:() => { ganhar('notif'); reRender(); mostrarPush('Avisos ligados', 'Pronto! Você recebe o lembrete 2 horas antes de cada aula. +20 pontos.'); },
  indicar:() => { const a = alunoPor(S, UI.who.aluno); ACT.copiar({v:`Vem praticar comigo no Espaço Anirvana! Inscrição aqui: https://rottaguide.com/anirvana#inscricao (indicação de ${a.nome})`}); setTimeout(() => avisar('Convite copiado. Quando a pessoa se matricular, você ganha 100 pontos.', 'user-plus'), 900); },
  trocarPontos:() => folhaTrocar(alunoPor(S, UI.who.aluno)),
  pedirPremio:(d) => { const a = alunoPor(S, UI.who.aluno), pr = PREMIOS.find(p => p.id === d.v); if (pontosAluno(S, a.id).saldo < pr.custo) return; (S.trocas = S.trocas || []).push({id:'tr' + novoId(), a:a.id, premio:pr.id, custo:pr.custo, d:HOJE_ISO, estado:'pendente'}); salvar(); folhaTrocar(a); reRender(); avisar(`Troca feita: ${pr.nome}. Retire no Espaço.`, 'gift'); },
  extratoPontos:() => { const a = alunoPor(S, UI.who.aluno), P = pontosAluno(S, a.id); abrirFolha(`${folhaCab('Seus pontos', `${P.total} ganhos · ${P.saldo} para trocar · nível ${P.nivel}`)}<div class="list">${P.itens.map(i => `<div class="li"><span class="ico-b">${ic('check')}</span><div class="main-c"><span class="t">${escapeH(i.lab)}</span>${i.d ? `<span class="s">${dataBR(i.d)}</span>` : ''}</div><b class="num">+${i.pts}</b></div>`).join('')}${(S.trocas || []).filter(t => t.a === a.id).map(t => `<div class="li"><span class="ico-b">${ic('gift')}</span><div class="main-c"><span class="t">${PREMIOS.find(p => p.id === t.premio).nome}</span><span class="s">${dataBR(t.d)}</span></div><b class="num" style="color:var(--sol-ink)">−${t.custo}</b></div>`).join('')}</div>`); },
  entregarTroca:(d) => { const t = S.trocas.find(x => x.id === d.v); t.estado = 'entregue'; t.entregue = HOJE_ISO; salvar(); reRender(); avisar(`Entregue para ${alunoPor(S, t.a).nome.split(' ')[0]}`, 'gift'); },

  /* eventos */
  novoEvento:() => folhaEvento(),
  divulgarEvento:(d) => { const e = S.eventos.find(x => x.id === d.v); UI.div.alvo = e.alvo || 'todos'; UI.div.canais = (e.canais || ['push','whatsapp']).slice(); UI.div.msg = null; folhaDivulgar(d.v); },
  divAlvo:(d) => { UI.div.alvo = d.v; UI.div.msg = $('#dMsg')?.value ?? null; folhaDivulgar(d.ev); },
  divCanal:(d) => { const c = new Set(UI.div.canais); c.has(d.v) ? c.delete(d.v) : c.add(d.v); UI.div.canais = [...c]; UI.div.msg = $('#dMsg')?.value ?? null; folhaDivulgar(d.ev); },
  enviarDivulgacao:(d) => {
    const e = S.eventos.find(x => x.id === d.v), {alvo, canais} = UI.div, A = alcance(alvo, canais), msg = ($('#dMsg')?.value || textoEvento(e)).trim();
    e.divulgado = HOJE_ISO; e.alvo = alvo; e.canais = canais.slice(); e.msg = msg; e.lembrete = $('#dLembrete')?.checked !== false;
    canais.forEach(c => (S.enviados = S.enviados || []).push({para:`${A.c[c].length} alunos · ${ALVOS[alvo].nome}`, canal:c, regra:'evento', quando:'hoje 10:50'}));
    S.caixa = S.caixa || {};
    A.al.forEach(a => (S.caixa['a:' + a.id] = S.caixa['a:' + a.id] || []).unshift({t:`Novo evento: ${e.nome}`, s:`${dataBR(e.data)} às ${e.h} · toque para ver`, icon:'ticket', go:'eventos'}));
    salvar(); fecharFolha(); reRender();
    mostrarPush(`${e.nome} · Espaço Anirvana`, msg);
    setTimeout(() => avisar(`Enviado para ${A.unicos.size} pessoas: ${canais.map(c => `${A.c[c].length} por ${CANAIS[c].nome.toLowerCase()}`).join(', ')}`, 'send'), 1200);
  },
  arteEvento:(d) => folhaArte(d.v),
  arteFmt:(d) => { UI.div.fmt = d.v; folhaArte(d.ev); },
  baixarArte:(d) => { const cv = $('#arteCv'), e = S.eventos.find(x => x.id === d.v); if (!cv) return; try{ cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${e.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-')}-${UI.div.fmt || 'story'}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); avisar('Imagem baixada. É só postar no Instagram.', 'download'); }, 'image/png'); }catch(err){ avisar('Segure o dedo na imagem para salvar', 'image'); } },
  inscritosEvento:(d) => folhaInscritosEv(d.v),
  evPago:(d) => { const e = S.eventos.find(x => x.id === d.v), i = e.inscritos.find(x => x.a === d.x); i.pago = true; salvar(); folhaInscritosEv(d.v); reRender(); avisar(`Recebido de ${alunoPor(S, d.x).nome.split(' ')[0]}`); },
  queroIr:(d) => folhaReservaEv(d.v),
  reservaEv:(d) => { const e = S.eventos.find(x => x.id === d.v), aid = UI.who.aluno; let i = e.inscritos.find(x => x.a === aid); if (!i){ i = {a:aid, d:HOJE_ISO, pago:false}; e.inscritos.push(i); } if (d.x === '1') i.aviso = HOJE_ISO; salvar(); fecharFolha(); reRender(); avisar(d.x === '1' ? `Vaga reservada. A administração confirma o Pix e na véspera o app te lembra.` : `Vaga reservada. Pague no dia, na entrada.`, 'ticket'); },

  /* aluno */
  alunoAtv:(d) => { UI.alunoAtv = d.v; reRender(); },
  vou:(d) => { S.vou[d.v] = d.x === '1'; salvar(); reRender(); const [, tid] = d.v.split('_'); avisar(d.x === '1' ? `Presença confirmada · ${PESSOA[TURMA[tid].instr].nome} já sabe` : 'Tudo bem, avisamos a instrutora', d.x === '1' ? 'check' : 'bell'); },
  experimental:(d) => abrirFolha(`${folhaCab(`Aula experimental de ${ATIV[d.v].curto}`, 'Escolha um horário. A gente confirma pelo WhatsApp.')}<div class="stack">${ATIV[d.v].agendada ? `<div class="field"><label for="expD">Dia preferido</label><input class="inp" type="date" id="expD" value="${iso(addD(HOJE,2))}"></div>` : `<div class="optgrid">${TURMAS.filter(t=>t.atv===d.v).map((t,i) => `<button class="opt ${i===0?'on':''}" data-act="opt" data-grp="expT" data-v="${t.id}">${DIAS_L[t.dia]} ${t.h}</button>`).join('')}</div>`}<div class="sheet-foot"><button class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" data-act="expOk" data-v="${d.v}">Quero experimentar</button></div></div>`),
  estagio:(d) => { const f = S.formandos.find(x => x.id === d.v); f.estagio = Math.min(60, f.estagio + 4); salvar(); reRender(); avisar(`${f.nome.split(' ')[0]}: ${f.estagio}h de estágio`); },
  formacaoInteresse:() => avisar('Pedido enviado. A equipe avisa quando abrir a próxima turma.', 'graduation-cap'),
  expOk:(d) => { fecharFolha(); avisar(`Pedido enviado. A equipe de ${ATIV[d.v].curto} vai confirmar.`); },
  reposicao:(d) => { const t = TURMA[d.v]; avisar(`Reposição marcada: ${DIAS_L[t.dia].toLowerCase()} ${t.h} com ${PESSOA[t.instr].nome}`); },
  pagar:(d) => folhaPagar(d.v, 'pix'),
  pagarModo:(d) => folhaPagar(d.v, d.x),
  confirmarPag:(d) => {
    const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), st = statusPagamento(S,a,m);
    const mes = st.st === 'pago' ? (() => { const x = pd(proximaCobranca(S,m)); return `${x.getFullYear()}-${pad(x.getMonth()+1)}`; })() : MES_ATUAL;
    /* o aluno só AVISA que pagou; quem dá baixa é a administração */
    if (!(S.avisosPag || []).some(x => x.mat === m.id && x.mes === mes && x.estado === 'aguardando'))
      (S.avisosPag = S.avisosPag || []).push({id:'ap'+novoId(), a:a.id, mat:m.id, mes, valor: d.x === 'cartao' ? comCartao(S, valorMat(S,m)) : valorMat(S,m), taxa: d.x === 'cartao' ? (S.regras.taxaCartao ?? TAXA_CARTAO) : 0, d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, metodo:d.x, estado:'aguardando'});
    salvar(); reRender(); folhaComprovante(m.id, mes, d.x);
  },
  maisFin:(d) => folhaMaisFin(d.v, d.x || 'menu'),
  salvarMetodo:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); m.metodo = $('#fMet').value; if (m.metodo === 'cartao' && !m.cartaoFim) m.cartaoFim = '4242'; salvar(); fecharFolha(); reRender(); avisar({cartao:`Pronto: no vencimento chega o link do cartão (+ ${brl(S.regras.taxaCartao ?? TAXA_CARTAO)})`, pixauto:'Pronto: autorize o Pix Automático no app do seu banco', pix:'Pronto: no vencimento chega o Pix'}[m.metodo]); },
  comprovante:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); window.open(linkComprovante(a, m, d.x || MES_ATUAL, d.y || 'pix'), '_blank', 'noopener'); },
  pausar:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), dias = +$('#fPausa').value; m.status = 'pausado'; m.pausaAte = iso(addD(HOJE, dias)); salvar(); fecharFolha(); reRender(); avisar(`Plano pausado até ${dataBR(m.pausaAte)}. Sem cobrança nesse período.`, 'pause'); },
  retomar:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); m.status = 'ativo'; delete m.pausaAte; salvar(); fecharFolha(); reRender(); avisar('Plano retomado. Bom te ver de volta!'); },
  cancelarPlano:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); const dias = diasEntre(pd(m.inicio || a.desde), HOJE); m.status = 'cancelado'; m.fim = HOJE_ISO; salvar(); fecharFolha(); reRender(); avisar(dias <= 7 ? 'Plano cancelado. Como foi nos 7 primeiros dias, o valor pago volta inteiro.' : 'Plano cancelado. Nenhuma cobrança nova.', 'check'); },
  consent:(d) => { const a = alunoPor(S, UI.who.aluno); const c = (S.consent = S.consent || {})[a.id] = S.consent[a.id] || {}; c[d.v] = !c[d.v]; c[d.v + 'Em'] = HOJE_ISO; salvar(); reRender(); avisar(c[d.v] ? 'Autorização registrada com data' : 'Autorização retirada'); },
  lgpd:(d) => avisar(d.v === 'copia' ? 'Pedido registrado. A cópia chega no seu e-mail dentro do prazo da LGPD.' : 'Pedido registrado. A administração confirma com você antes de apagar.', 'check'),
  saudade:(d) => { const a = alunoPor(S, d.v), nome = a.nome.split(' ')[0]; const txt = `Oi, ${nome}! Sentimos sua falta no Espaço Anirvana 🙏 Está tudo bem? Se quiser, a gente te ajuda a encaixar um horário esta semana.`; try{ navigator.clipboard.writeText(txt).then(() => avisar('Mensagem copiada. É só colar no WhatsApp.'), () => avisar(txt)); }catch(e){ avisar(txt); } },
  alterarPlano:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), novo = $('#fPlano').value; if (novo === m.plano){ fecharFolha(); return; } m.plano = novo; salvar(); fecharFolha(); reRender(); avisar(`Plano alterado para ${PLANOS_YOGA[novo].nome} · ${brl(S.regras.planos[novo])} a partir da próxima cobrança`); },
};

/* cliques */
/* ---------- voltar para a tela anterior (setinha no topo e o "voltar" do celular) ---------- */
UI.pilha = [];
const ACTS_TELA = ['tab','ir','role','mensVis','mensSt','mensAtv','escolaVis','balVis','balMes','lojaVis','divVis','alunoAtv','meuMes','instrFiltro','catFoco'];
const fotoTela = () => JSON.stringify({role:UI.role, tab:UI.role ? UI.tab[UI.role] : null, mensVis:UI.mensVis, mensSt:UI.mensSt, mensAtv:UI.mensAtv, escolaVis:UI.escolaVis, balVis:UI.balVis, balMes:UI.balMes, lojaVis:UI.lojaVis, div:UI.div && UI.div.vis, alunoAtv:UI.alunoAtv, meuMes:UI.meuMes, instrFiltro:UI.instrFiltro, catFoco:UI.catFoco});
function voltarTela(){
  const f = UI.pilha.pop(); if (!f) return false;
  const o = JSON.parse(f);
  if (!o.role){ UI.role = null; } else { UI.role = o.role; UI.tab[o.role] = o.tab; }
  Object.assign(UI, {mensVis:o.mensVis, mensSt:o.mensSt, mensAtv:o.mensAtv, escolaVis:o.escolaVis, balVis:o.balVis, balMes:o.balMes, lojaVis:o.lojaVis, alunoAtv:o.alunoAtv, meuMes:o.meuMes, instrFiltro:o.instrFiltro, catFoco:o.catFoco});
  if (UI.div) UI.div.vis = o.div;
  const h = UI.role ? `${UI.role}-${UI.tab[UI.role]}` : '';
  history.replaceState({anv:UI.pilha.length}, '', h ? '#' + h : location.pathname);
  fecharFolha(); render(); scrollTo({top:0});
  return true;
}
window.addEventListener('popstate', () => { if ($('#sheet').classList.contains('on')){ fecharFolha(); return; } if (!voltarTela() && UI.role){ UI.role = null; render(); } });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  e.preventDefault();
  const tela = ACTS_TELA.includes(el.dataset.act) || (el.dataset.act === 'entrar') ? fotoTela() : null;
  fn({...el.dataset}, el);
  if (tela && tela !== fotoTela()){ UI.pilha.push(tela); if (UI.pilha.length > 40) UI.pilha.shift(); history.pushState({anv:UI.pilha.length}, '', location.href); render(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#sheet').classList.contains('on')) fecharFolha();
  if (e.key === 'Enter' && e.target.id === 'codigoIn'){ e.preventDefault(); $('[data-act=conferirCodigo]')?.click(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')){ e.preventDefault(); e.target.click(); }
});
$('#scrim').addEventListener('click', fecharFolha);

/* campos de regra e busca */
let _buscaT;
document.addEventListener('input', e => {
  const el = e.target, k = el.dataset.actIn; if (!k) return;
  if (k === 'inscNasc'){ const i = idade(el.value), m = i !== null && i < 18; $$('.menor-f').forEach(f => { f.hidden = !m; });
    const h = $('#f_menor'); if (h && i !== null && !h.dataset.mexeu){ h.value = m ? 'sim' : 'nao'; $$('.opt[data-grp="f_menor"]').forEach(o => o.classList.toggle('on', o.dataset.v === h.value)); } return; }
  if (k === 'celMask'){ const d = soDig(el.value); if (d.length >= 10) el.value = mascCel(d); return; }
  if (k === 'cpf'){ el.value = cpfMascara(el.value); return; }
  if (k === 'fnPct'){ const v = num(el.value), a = $('#fnPctAj'); if (a && v >= 0 && v <= 100) a.textContent = `O Espaço fica com ${Math.round(100 - v)}%.${$('#fForn')?.dataset.id ? ' Vendas antigas não mudam.' : ''}`; return; }
  if (k === 'lojaBusca'){ const q = el.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); $$('.prod[data-nome]').forEach(c => { c.hidden = !!q && !c.dataset.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q); }); return; }
  if (k === 'avTexto'){ const t = $('#avTexto'), ti = $('#avTitulo'); UI.av.texto = t.value; UI.av.titulo = ti.value; const pv = $('#avPrev'), pt = $('#avPrevT'), c = $('#avConta'); if (pv) pv.textContent = t.value || 'Sua mensagem aparece aqui.'; if (pt) pt.textContent = ti.value || 'Espaço Anirvana'; if (c) c.textContent = `${t.value.length}/500`; return; }
  if (k === 'divMsg'){ const pv = $('#dPrev'); if (pv) pv.textContent = el.value; return; }
  if (k === 'busca'){ UI.busca = el.value; clearTimeout(_buscaT); _buscaT = setTimeout(() => { const pos = el.selectionStart; reRender(); const b = $('#busca'); if (b){ b.focus(); b.setSelectionRange(pos,pos); } }, 220); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'csvForms' && e.target.files[0]){ const atv = $('#impAtv')?.value || 'yoga', arq = e.target.files[0];
    importarArquivo(arq, atv).then(rel => { salvar(); reRender(); if (!rel.n && !rel.repetidos.length){ fecharFolha(); avisar('Não achei respostas nesse arquivo', 'circle-alert'); return; } folhaRelatorioImport(rel, atv); })
      .catch(err => avisar('Não consegui ler essa planilha: ' + err.message, 'circle-alert')); return; }
  const el = e.target, k = el.dataset.actIn; if (!k) return;
  if (k === 'precoAtv'){ const v = num(el.value), atv = el.dataset.atv, pk = el.dataset.k;
    if (pk){ const R = S.regras.planosAtv = S.regras.planosAtv || {}; (R[atv] = R[atv] || {})[pk] = v > 0 ? v : null; salvar(); reRender(); avisar(v > 0 ? `${ATIV[atv].curto} ${pk}: ${brl(v)} por mês` : `${ATIV[atv].curto} ${pk}: valor a definir`); }
    else if (v > 0){ const antigo = +ATIV[atv].valor || null; S.atividades[atv] = {...(S.atividades[atv] || {}), valor:v}; let n = 0;
      S.alunos.forEach(a => a.mats.forEach(m => { if (m.atv === atv && !m.plano && !m.planoPart && !m.planoAtv && !m.ajuste && antigo && m.valor === antigo){ m.valor = v; n++; } }));
      ligarAtividades(); salvar(); reRender(); avisar(`${ATIV[atv].nome}: ${brl(v)} por mês${n ? ` · ${n} alunos com o valor antigo passaram para o novo` : ''}`); }
  }
  if (k === 'precoPart'){ const v = num(el.value); if (v > 0){ S.regras.planosPart = S.regras.planosPart || {}; S.regras.planosPart[el.dataset.v] = v; salvar(); reRender(); avisar(`Particular · ${PLANOS_PART[el.dataset.v].nome}: ${brl(v)}`); } }
  if (k === 'cfgPag'){ const c = S.config = S.config || {}; if (el.dataset.v === 'taxaCartao'){ const v = num(el.value); if (v >= 0){ S.regras.taxaCartao = v; salvar(); reRender(); avisar(`Cartão: acréscimo de ${brl(v)}`); } } else { c[el.dataset.v] = el.value.trim(); salvar(); avisar(el.dataset.v === 'chavePix' ? 'Chave Pix salva: o copia e cola já sai com ela' : 'Link do cartão salvo', 'check'); } }
  if (k === 'preco'){ const v = num(el.value); if (v > 0){ S.regras.planos[el.dataset.v] = v; salvar(); reRender(); avisar(`${PLANOS_YOGA[el.dataset.v].nome}: ${brl(v)} · presença agora vale ${brl(taxasYoga(S.regras.planos, S.regras.pct.yoga)[el.dataset.v])}`); } }
  if (k === 'pct'){ const v = num(el.value); if (v >= 0 && v <= 100){ S.regras.pct[el.dataset.v] = v/100; salvar(); reRender(); avisar(`${ATIV[el.dataset.v].curto}: equipe ${v}% · Espaço ${100-v}%`); } }
  if (k === 'vazia'){ const v = num(el.value); if (v >= 0){ S.regras[el.dataset.v] = v; salvar(); reRender(); avisar(`Aula vazia: ${brl(v)}`); } }
});

/* formulários */
document.addEventListener('submit', e => {
  const lg = e.target.dataset && e.target.dataset.login;
  if (lg){ e.preventDefault(); if (lg === 'aluno') loginAluno(); else if (lg === 'instrutor') loginInstrutor(); else if (lg === 'otp') conferirOtp(); else if (lg === 'admin') conferirPinAdmin(e.target.dataset.id); else if (lg === 'adminCodigo') loginAdmCodigo(); else if (lg === 'nasc') conferirNasc(); return; }
  e.preventDefault();
  const f = e.target;
  if (f.id === 'fLanc'){
    const valor = num($('#lValor').value), desc = $('#lDesc').value.trim(), tipo = $('#lTipo').value, cat = $('#lCat').value, d = $('#lData').value || HOJE_ISO;
    if (!valor){ $('#lValor').focus(); avisar('Digite o valor','circle-alert'); return; }
    if (!desc){ $('#lDesc').focus(); avisar('Diga o que foi','circle-alert'); return; }
    const L = f.dataset.id && S.lanc.find(l => l.id === f.dataset.id);
    if (L){ if ((S.fechados || {})[mesDe(L.d)] || (S.fechados || {})[mesDe(d)]){ avisar('Mês fechado: peça para reabrir antes de corrigir', 'circle-alert'); return; } Object.assign(L, {d, valor, desc, cat}); salvar(); fecharFolha(); UI.balMes = mesDe(d); reRender(); avisar(`Lançamento corrigido: ${brl(valor)} · ${cat}`); return; }
    S.lanc.push({id:'l'+novoId(), tipo, d, valor, desc, cat, ...(f.dataset.conta ? {conta:f.dataset.conta} : {})}); salvar(); fecharFolha(); UI.balMes = mesDe(d); reRender();
    avisar(`${tipo==='saida'?'Saída':'Entrada'} lançada: ${brl(valor)} · ${cat}`);
  }
  if (f.id === 'fReceber'){
    const m = S.alunos.flatMap(a => a.mats.map(x => ({a,x}))).find(o => o.x.id === f.dataset.mat);
    const valor = num($('#rValor').value) || valorMat(S, m.x);
    const meses = +($('#rMeses')?.value || 1), st = statusPagamento(S, m.a, m.x), mes = st.st === 'pago' ? mesDe(proximaCobranca(S, m.x)) : MES_ATUAL;
    S.pagamentos.push({id:'pg'+novoId(), a:m.a.id, mat:m.x.id, mes, valor, d:$('#rData').value || HOJE_ISO, metodo:$('#rMet').value, ...(meses > 1 ? {meses} : {})});
    salvar(); fecharFolha(); reRender(); avisar(`Pagamento registrado: ${m.a.nome.split(' ')[0]} · ${brl(valor)}${meses > 1 ? ` · pacote de ${meses} meses (até ${nomeMes(somaMes(mes, meses - 1)).toLowerCase()})` : ''}`);
  }
  if (f.id === 'fNovo'){
    const nome = $('#nNome').value.trim(); if (!nome) return;
    const atv = $('#nAtv').value, plano = atv === 'yoga' ? $('#nPlano').value : null, turmas = $('#nTur').value.split(',').filter(Boolean);
    const id = 'a' + novoId();
    const instrEsc = $('#nInstr')?.value || null;
    if (ATIV[atv].vis === 'escolhido' && !instrEsc){ avisar('Escolha com quem a pessoa vai fazer', 'circle-alert'); return; }
    S.alunos.push({id, nome, desde:HOJE_ISO, obs:'', status:'ativo', tel:$('#nTel').value || '', mats:[{id:id+'-0', atv, plano, valor: plano ? null : (ATIV[atv].valor ?? null), turmas, venc: Math.min(28, +$('#nVenc').value || HOJE.getDate()), metodo:$('#nMet').value, cartaoFim: null, instr:instrEsc, status:'ativo'}]});
    salvar(); fecharFolha(); reRender();
    const quem = EQUIPE.filter(p => p.atvs.includes(atv)).map(p => p.nome);
    avisar(`${nome.split(' ')[0]} cadastrado. Já aparece para ${quem.join(', ')}.`, 'user-plus');
  }
  if (f.id === 'fSub'){
    const para = $('#sPara').value || null;
    S.subs.push({id:'sb'+novoId(), turma:f.dataset.t, d:f.dataset.d, de:UI.who.instrutor, para:null, pedidoPara:para, motivo:$('#sMot').value.trim() || 'Sem motivo informado', status:'aberto', criado:HOJE_ISO});
    salvar(); fecharFolha(); reRender();
    const t = TURMA[f.dataset.t];
    avisar(para ? `Pedido enviado para ${PESSOA[para].nome}` : `Pedido enviado para todas de ${ATIV[t.atv].curto}`, 'repeat');
  }
  if (f.id === 'fEvento'){
    const nome = $('#eNome').value.trim(), valor = num($('#eValor').value), vagas = parseInt($('#eVagas').value, 10), data = $('#eData').value, h = $('#eHora').value || '18:30';
    if (!nome){ $('#eNome').focus(); avisar('Dê um nome para o evento', 'circle-alert'); return; }
    if (!data || data < HOJE_ISO){ $('#eData').focus(); avisar('Escolha um dia de hoje em diante', 'circle-alert'); return; }
    if (!(valor >= 0) || !(vagas > 0)){ avisar('Confira valor e vagas', 'circle-alert'); return; }
    const ed = f.dataset.id && S.eventos.find(x => x.id === f.dataset.id);
    if (ed){ if (vagas < ed.inscritos.length + (ed.externos || 0)){ avisar(`Já tem ${ed.inscritos.length + (ed.externos || 0)} inscritos: as vagas não podem ser menos que isso`, 'circle-alert'); return; } Object.assign(ed, {nome, data, h, valor, vagas, desc:$('#eDesc').value.trim(), icon:$('#eIcon').value}); salvar(); fecharFolha(); reRender(); avisar(`${nome} atualizado`, 'check'); return; }
    const id = 'ev' + novoId();
    S.eventos.push({id, nome, data, h, valor, vagas, desc:$('#eDesc').value.trim(), icon:$('#eIcon').value, alvo:'todos', canais:['push','whatsapp'], criado:HOJE_ISO, divulgado:null, inscritos:[], externos:0});
    salvar(); reRender(); UI.div.alvo = 'todos'; UI.div.canais = ['push','whatsapp']; UI.div.msg = null; folhaDivulgar(id);
    return;
  }
  if (f.id === 'fCat'){
    const nome = $('#catNome').value.trim().replace(/\s+/g, ' '), tipo = $('#catTipo').value;
    if (!nome) return; if (CAT_ENTRADA[nome] || CAT_SAIDA[nome]){ avisar('Já existe uma categoria com esse nome', 'circle-alert'); return; }
    S.cats.fora = S.cats.fora.filter(x => x !== nome); S.cats.novas.push({nome, tipo, icon:'tag'}); ligarCats(); salvar(); folhaCategorias(); reRender(); avisar(`Categoria ${nome} criada`, 'check'); return;
  }
  if (f.id === 'fCatRen'){
    const de = f.dataset.v, para = $('#crNome').value.trim().replace(/\s+/g, ' '); if (!para || para === de) { folhaCategorias(); return; }
    if (CAT_ENTRADA[para] || CAT_SAIDA[para]){ avisar('Já existe uma categoria com esse nome', 'circle-alert'); return; }
    const C = S.cats, era = C.novas.find(n => n.nome === de), tipo = era ? era.tipo : (CAT_ENTRADA[de] && CAT_SAIDA[de] ? 'ambos' : CAT_ENTRADA[de] ? 'entrada' : 'saida'), icon = (CAT_ENTRADA[de] || CAT_SAIDA[de] || {}).icon;
    if (era) era.nome = para; else { C.fora.push(de); C.novas.push({nome:para, tipo, icon}); }
    (C.renomes = C.renomes || {})[de] = para;
    let n = 0; S.lanc.forEach(l => { if (l.cat === de && !(S.fechados || {})[mesDe(l.d)]){ l.cat = para; n++; } });
    ligarCats(); salvar(); folhaCategorias(); reRender(); avisar(`${de} agora é ${para} · ${n} lançamentos mudaram`, 'check'); return;
  }
  if (f.id === 'fPacote'){
    const nome = $('#pkNome').value.trim(), valor = num($('#pkValor').value), meses = +$('#pkMeses').value;
    if (!nome || !(valor > 0)){ avisar('Dê um nome e o valor total', 'circle-alert'); return; }
    const dados = {nome, atv:$('#pkAtv').value, plano:$('#pkPlano').value, meses, valor};
    S.pacotes = S.pacotes || []; const p = S.pacotes.find(x => x.id === f.dataset.id);
    if (p) Object.assign(p, dados); else S.pacotes.push({id:'pk' + novoId(), ...dados});
    salvar(); fecharFolha(); reRender(); avisar(`Pacote ${nome}: ${meses} meses por ${brl(valor)}`, 'package'); return;
  }
  if (f.id === 'fAjuste'){
    const m = S.alunos.flatMap(a => a.mats).find(x => x.id === f.dataset.mat), tipo = $('#ajTipo').value, v = num($('#ajV').value);
    if (!(v >= 0) || (tipo === 'pct' && v > 100)){ avisar(tipo === 'pct' ? 'O desconto vai de 0 a 100%' : 'Digite o valor', 'circle-alert'); return; }
    m.ajuste = {tipo, v, motivo:$('#ajMot').value.trim(), em:HOJE_ISO, por:quemNome()};
    salvar(); fecharFolha(); reRender(); avisar(`Mensalidade ajustada: ${brl(valorMat(S, m))} por mês`, 'check'); return;
  }
  if (f.id === 'fAviso'){
    const id = f.dataset.id, r = REGRAS_AVISO.find(x => x.id === id), c = (S.avisos = S.avisos || {})[id] = S.avisos[id] || {};
    if (r.q){ const q = {}; Object.keys(r.q).forEach(k => { const el = $('#aq_' + k); if (el) q[k] = Math.max(0, Math.round(+el.value || 0)); }); c.q = q; }
    const t = $('#aq_txt').value.trim(); if (t && t !== r.modelo) c.modelo = t; else delete c.modelo;
    salvar(); fecharFolha(); reRender(); avisar(`${r.nome}: ${regraAviso(id).quando}`, 'bell'); return;
  }
  if (f.id === 'fTerapia'){
    const nome = $('#tpNome').value.trim(); if (!nome){ $('#tpNome').focus(); return; }
    const w = soDig($('#tpWhats').value), whats = w.length >= 12 ? w : w.length >= 10 ? '55' + w : ESPACO.whats;
    const dados = {nome, quem:$('#tpQuem').value.trim(), desc:$('#tpDesc').value.trim(), whats};
    S.terapias = S.terapias || [];
    const t = S.terapias.find(x => x.id === f.dataset.id); if (t) Object.assign(t, dados); else S.terapias.push({id:'tp' + novoId(), icon:'heart', ...dados});
    salvar(); fecharFolha(); reRender(); avisar(`${nome} salva. Já aparece na aba Terapias do aluno.`, 'check'); return;
  }
  if (f.id === 'fFeriado'){
    const d = $('#frD').value, nome = $('#frNome').value.trim(); if (!d || !nome){ avisar('Escolha o dia e o motivo', 'circle-alert'); return; }
    const X = S.feriados = S.feriados || {extra:[], comAula:[]}; X.extra = (X.extra || []).filter(x => x.d !== d); X.extra.push({d, nome});
    salvar(); fecharFolha(); reRender(); avisar(`${dataBR(d)}: ${nome}, sem aula`, 'calendar-x'); return;
  }
  if (f.id === 'fPinAdm'){
    const p = soDig($('#npAdm').value); if (p.length < 4 || p.length > 6 || /^(\d)\1+$/.test(p) || '0123456789'.includes(p)){ avisar('Use de 4 a 6 números, sem sequência', 'circle-alert'); return; }
    (S.pinAdmin = S.pinAdmin || {})[f.dataset.id] = p; salvar(); fecharFolha(); reRender(); avisar('PIN do painel trocado', 'lock'); return;
  }
  if (f.id === 'fAtividade'){
    const nome = $('#atNome').value.trim(), curto = ($('#atCurto').value.trim() || nome.split(' ')[0]).slice(0, 16), pct = num($('#atPct').value) / 100;
    if (!nome){ $('#atNome').focus(); avisar('Dê um nome para a atividade', 'circle-alert'); return; }
    if (!(pct >= 0 && pct <= 1)){ $('#atPct').focus(); avisar('O % vai de 0 a 100', 'circle-alert'); return; }
    const valor = $('#atValor') ? num($('#atValor').value) : undefined;
    const id = f.dataset.id || ('at' + novoId());
    const dados = {nome, curto, desc:$('#atDesc').value.trim(), icon:$('#atIcon').value, hex:$('#atCor').value, cor:$('#atCor').value, vis:$('#atVis').value, form:$('#atForm').value, repasse:pct, turma:$('#atVis').value !== 'escolhido', combinar: !!$('#atComb')?.checked, ...(valor > 0 ? {valor} : {})};
    if (!f.dataset.id && Object.values(ATIV).some(a => a.nome.toLowerCase() === nome.toLowerCase())){ avisar('Já existe uma atividade com esse nome', 'circle-alert'); return; }
    S.atividades[id] = {...(S.atividades[id] || {}), ...dados}; S.regras.pct[id] = pct;
    ligarAtividades(); ligarEquipe(); salvar(); fecharFolha(); reRender();
    avisar(f.dataset.id ? `${nome} atualizada` : `${nome} criada. Agora ponha os horários e quem dá.`, 'check');
    return;
  }
  if (f.id === 'fConta'){ gravarContaFixa(f); return; }
  if (f.id === 'fEdAluno'){ gravarEdAluno(f); return; }
  if (f.id === 'fMat'){ gravarMat(f); return; }
  if (f.id === 'fPag'){
    const p = S.pagamentos.find(x => x.id === f.dataset.id); if (!p) return;
    const valor = num($('#pgValor').value), mes = $('#pgMes').value || p.mes;
    if (!(valor > 0)){ $('#pgValor').focus(); avisar('Digite o valor', 'circle-alert'); return; }
    if ((S.fechados || {})[p.mes] || (S.fechados || {})[mes]){ avisar('Mês fechado: peça para reabrir antes de corrigir', 'circle-alert'); return; }
    Object.assign(p, {valor, d:$('#pgData').value || p.d, mes, metodo:$('#pgMet').value}); salvar(); reRender(); if (p.a) folhaAluno(p.a); else fecharFolha(); avisar(`Pagamento corrigido: ${brl(valor)}`, 'check'); return;
  }
  if (f.id === 'fTurma'){
    const id = f.dataset.id, dia = +$('#tuDia').value, h = $('#tuHora').value, sala = ($('#tuSala').value || '').trim() || SALAS[0], instr = $('#tuInstr').value, nome = ($('#tuNome').value || '').trim();
    if (!/^\d{2}:\d{2}$/.test(h)){ $('#tuHora').focus(); avisar('Escolha a hora', 'circle-alert'); return; }
    if (!instr){ avisar('Escolha quem dá a aula', 'circle-alert'); return; }
    const choque = TURMAS.find(t => t.id !== id && t.dia === dia && t.h === h && t.instr === instr);
    if (choque){ avisar(`${PESSOA[instr].nome} já tem ${nomeTurma(choque)} ${DIAS[dia]} ${h}`, 'circle-alert'); return; }
    if (id){
      const nova = (S.turmasNovas || []).find(t => t.id === id);
      if (nova) Object.assign(nova, {dia, h, sala, nome: nome || undefined, instr});
      else { S.turmaAjuste = S.turmaAjuste || {}; S.turmaAjuste[id] = {dia, h, sala, ...(nome ? {nome} : {nome:undefined})}; S.turmaInstr = S.turmaInstr || {}; S.turmaInstr[id] = instr; }
    } else {
      const atv = $('#tuAtv').value, nid = `${atv}-${['dom','seg','ter','qua','qui','sex','sab'][dia]}${h.replace(':', '')}-${novoId().slice(-4)}`;
      (S.turmasNovas = S.turmasNovas || []).push({id:nid, atv, dia, h, instr, sala, ...(nome ? {nome} : {})});
      const p = PESSOA[instr]; if (p && !p.atvs.includes(atv)) p.atvs = [...p.atvs, atv];
    }
    ligarAtividades(); ligarEquipe(); salvar(); fecharFolha(); reRender();
    avisar(`${nome || ATIV[(TURMA[id] || {}).atv || $('#tuAtv')?.value]?.curto || 'Horário'} · ${DIAS_L[dia].toLowerCase()} ${h} · ${sala}`, 'calendar-days');
    return;
  }
  if (f.id === 'fHorario'){
    const atv = f.dataset.atv, dia = +$('#hrDia').value, h = $('#hrHora').value, instr = $('#hrInstr').value, sala = $('#hrSala').value.trim() || SALAS[0];
    if (!h || !instr){ avisar('Escolha a hora e quem dá', 'circle-alert'); return; }
    if (TURMAS.some(t => t.dia === dia && t.h === h && t.instr === instr)){ avisar(`${PESSOA[instr].nome} já tem aula ${DIAS[dia]} ${h}`, 'circle-alert'); return; }
    const id = `${atv}-${['dom','seg','ter','qua','qui','sex','sab'][dia]}${h.replace(':', '')}`;
    S.turmasNovas.push({id, atv, dia, h, instr, sala}); S.turmasFora = S.turmasFora.filter(x => x !== id);
    const p = PESSOA[instr]; if (!p.atvs.includes(atv)) p.atvs = [...p.atvs, atv];
    ligarAtividades(); ligarEquipe(); salvar(); fecharFolha(); reRender(); avisar(`${ATIV[atv].curto} ${DIAS_L[dia].toLowerCase()} ${h} com ${p.nome} na grade`, 'calendar-days');
    return;
  }
  if (f.id === 'fEquipe'){
    const nome = $('#eqNome').value.trim(), completo = $('#eqCompleto').value.trim(), atvs = $('#eqAtvs').value.split(',').filter(Boolean);
    if (!nome){ $('#eqNome').focus(); avisar('Digite o nome', 'circle-alert'); return; }
    if (!atvs.length){ avisar('Escolha pelo menos uma atividade', 'circle-alert'); return; }
    const dados = {nome, nomeCompleto:completo || undefined, atvs, tel:$('#eqTel').value.trim(), pix:$('#eqPix').value.trim(), bio:$('#eqBio').value.trim() || undefined};
    const ed = f.dataset.id && PESSOA[f.dataset.id];
    if (ed){ Object.assign(ed, dados); ligarEquipe(); salvar(); fecharFolha(); reRender(); avisar(`${nome} atualizada`, 'check'); return; }
    if (S.equipe.some(p => p.ativo !== false && p.nome.toLowerCase() === nome.toLowerCase())){ avisar('Já tem alguém com esse nome na equipe', 'circle-alert'); return; }
    const CORES = ['#0E7266','#B9488E','#2F7FB8','#C08A12','#3E8E6E','#6A55C9','#E5672A','#1F8A9E','#A2563A','#5B8C2A'];
    const id = 'e' + novoId();
    S.equipe.push({id, ...dados, cor:CORES[S.equipe.length % CORES.length], ativo:true, entrou:HOJE_ISO});
    (S.codigos = S.codigos || {}); novoCodigo(id); ligarEquipe(); salvar(); reRender();
    folhaCodigoNovo(id); avisar(`${nome} entrou na equipe. Mande o código pessoal para ela.`, 'user-plus');
    return;
  }
  if (f.id === 'fForn'){
    const nome = $('#fnNome').value.trim(), curto = ($('#fnCurto').value.trim() || nome.split(/[ ·(]/)[0]).slice(0, 18), modelo = $('#fnModelo').value;
    const pct = modelo === 'proprio' ? 0 : modelo === 'integral' ? 1 : num($('#fnPct').value) / 100;
    if (!nome){ $('#fnNome').focus(); avisar('Digite o nome do fornecedor', 'circle-alert'); return; }
    if (modelo === 'consig' && !(pct > 0 && pct < 1)){ $('#fnPct').focus(); avisar('O % do fornecedor vai de 1 a 99', 'circle-alert'); return; }
    const dados = {nome, curto, modelo, pct, pix:$('#fnPix').value.trim(), tel:$('#fnTel').value.trim(), obs:$('#fnObs').value.trim()};
    const ed = f.dataset.id && FORN[f.dataset.id];
    if (ed){
      if (ed.pct !== pct) S.vendas.filter(v => v.forn === ed.id && v.pct === undefined).forEach(v => { v.pct = ed.pct; });   /* congela o % das vendas antigas */
      Object.assign(ed, dados);
    } else {
      if (S.fornecedores.some(x => x.nome.toLowerCase() === nome.toLowerCase())){ avisar('Esse fornecedor já está cadastrado', 'circle-alert'); return; }
      const CORES = ['#0E7266','#C08A12','#B9488E','#2F7FB8','#5B8C2A','#A2563A','#6A55C9','#D46A8C','#1F8A9E','#7A5C2E'];
      S.fornecedores.push({id:'f' + novoId(), ...dados, hue:CORES[S.fornecedores.length % CORES.length], ativo:true});
    }
    ligarFornecedores(); salvar(); fecharFolha(); reRender();
    avisar(`${curto}: ${modelo === 'proprio' ? 'estoque do Espaço' : modelo === 'integral' ? 'repasse de 100%' : `${Math.round(pct*100)}% fornecedor · ${Math.round((1-pct)*100)}% Espaço`}${ed ? ' · vendas antigas ficam como estavam' : ''}`, 'store');
    return;
  }
  if (f.id === 'fProduto'){
    const nome = $('#pdNome').value.trim(), preco = num($('#pdPreco').value), forn = $('#pdForn').value, cat = $('#pdCat').value;
    if (!nome){ $('#pdNome').focus(); avisar('Dê um nome para o produto', 'circle-alert'); return; }
    if (!(preco > 0)){ $('#pdPreco').focus(); avisar('Digite o preço', 'circle-alert'); return; }
    S.produtos = S.produtos || [];
    const ed = f.dataset.id && prodPor(f.dataset.id);
    if (ed) Object.assign(ed, {nome, preco, forn, cat, icon:CATS_LOJA[cat]?.icon || 'tag'});
    else if (S.produtos.some(p => p.nome.toLowerCase() === nome.toLowerCase() && p.forn === forn)){ avisar('Esse produto já está cadastrado para esse fornecedor', 'circle-alert'); return; }
    else S.produtos.push({id:'p' + novoId(), nome, preco, forn, cat, icon:CATS_LOJA[cat]?.icon || 'tag'});
    salvar(); fecharFolha(); reRender(); avisar(`${nome} · ${brl(preco)} ${ed ? 'atualizado' : 'na lojinha'} (${FORN[forn].curto})`, 'store');
    return;
  }
  if (f.id === 'fLivre'){
    const nome = $('#ilNome').value.trim(), valor = num($('#ilValor').value), forn = $('#ilForn').value;
    if (!nome || !valor) return;
    const id = 'x' + novoId();
    if ($('#ilGuardar')?.checked){ (S.produtos = S.produtos || []).push({id, nome:nome.replace(/^\d+\s+/, ''), preco:valor, forn, cat:'casa', icon:'tag'}); salvar(); }
    else UI.livres[id] = {id, nome, preco:valor, forn, cat:'casa', icon:'tag'};
    UI.cart[id] = 1; fecharFolha(); reRender(); avisar(`${nome} na venda`);
  }
});

window.addEventListener('hashchange', () => { lerHash(); render(); });
lerHash();
render();
if (VALENDO && nuvemLigada()) sincronizarAoAbrir();
if (UI.abrirInscricao){ UI.abrirInscricao = false; history.replaceState(null, '', location.pathname); ACT.inscricao(); }
