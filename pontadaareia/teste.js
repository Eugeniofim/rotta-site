/* =====================================================
   TESTE AO VIVO NO CRM DE VERDADE (16/11/2026)

   Pedido do Eugênio: "quando a pessoa clica em testar e preenche os dados, ela aperta pra falar
   com a Milla no WhatsApp, mas a tela do CRM original já abre ao lado pra ele ver".

   Só liga na cópia publicada em milla-app.com/testar/ (config.js com APP_CONFIG.teste =
   { api, chave, numero }). É a demonstração da Imobiliária Milla (sem login, dados de exemplo)
   com UMA conversa de verdade: a de quem fez o teste. A cada 3 s a página pergunta à sala da
   demonstração millademo.teste_ao_vivo(código, número), que devolve só aquela conversa (sem CPF,
   sem e-mail). A conversa entra no topo do WhatsApp como "Você", e o lead dela entra em Leads,
   no Início e na Gestão, junto dos exemplos.

   O código e o número vêm do formulário Testar do site (localStorage 'milla_teste', nunca no
   endereço). Sem eles (16/11, noite), a página abre o CRM direto, com "Testar com o meu WhatsApp"
   (o mesmo cadastro do site) e "Já tenho um código" (quem se cadastrou em outro aparelho).
   No computador (16/11, noite, pedido do Eugênio: "queria que o WhatsApp abrisse o WhatsApp da pessoa
   mesmo, sem ser o Web"), o botão abre o WhatsApp instalado (whatsapp://send); se em 2,5 s nada abriu,
   a faixa mostra o QR para abrir no celular. No celular, o WhatsApp abre o app e a barra "Voltar ao
   WhatsApp" fica embaixo, com as mensagens novas.
   ===================================================== */
'use strict';

const TESTE_CFG = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.teste && APP_CONFIG.teste.api) ? APP_CONFIG.teste : null;
const TS = { guarda: null, sig: '', vistas: 0, lidasAte: 0, over: {}, timer: null, ultimaOk: 0, parar: 0, msgs: 0, codigoMsg: '', fim: false };

function testeLeGuarda() {
  let g = null;
  try { g = JSON.parse(localStorage.getItem('milla_teste') || 'null'); } catch (e) {}
  if (!g || !/^\d{6}$/.test(String(g.codigo || '')) || String(g.fone || '').replace(/\D/g, '').length < 10 || Date.now() - (g.em || 0) > 864e5) return null;
  return g;
}
const testeAtivo = () => !!(TESTE_CFG && TS.guarda);
const testeNumero = () => 'teste-' + String(TS.guarda.fone).replace(/\D/g, '').slice(-8);
const testeCodigoBonito = () => String(TS.guarda.codigo).replace(/(\d{3})(\d{3})/, '$1 $2');
const testeTextoWa = () => 'Oi Milla! Meu código de teste é ' + TS.guarda.codigo + '.';
/* computador = mouse; o mesmo critério do site (o botão abre o WhatsApp instalado em vez do wa.me) */
const testeComputador = () => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return false; } };

function testeRpc(nome, corpo, sala) {
  return fetch(TESTE_CFG.api + '/rest/v1/rpc/' + nome, {
    method: 'POST',
    headers: { apikey: TESTE_CFG.chave, Authorization: 'Bearer ' + TESTE_CFG.chave, 'Content-Type': 'application/json', 'Content-Profile': sala || 'millademo' },
    body: JSON.stringify(corpo),
  }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
}

/* ---------- "Já tenho um código": quem fez o cadastro em outro aparelho ----------
   (desde 16/11, noite: sem teste, a página abre o CRM direto, com o botão de começar; o código é opcional) */
function testePorta() {
  if (!TESTE_CFG || TS.guarda || !TS.pedeCodigo) return '';
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="teste-form" aria-label="Acompanhar o teste ao vivo" novalidate>
    <div class="entrar-marca">${SIMBOLO('grande')}<span class="olho">Teste ao vivo</span><h1>Acompanhe o seu teste no CRM</h1>
      <div class="sm">Digite o mesmo WhatsApp do cadastro e o código de 6 números que apareceu para você.</div></div>
    <label for="teste-whats" class="sm b">WhatsApp</label><input class="inp" id="teste-whats" type="tel" inputmode="tel" autocomplete="tel" placeholder="(41) 99999-9999" maxlength="20">
    <label for="teste-codigo" class="sm b">Código do teste</label><input class="inp" id="teste-codigo" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" maxlength="7">
    <p class="sm teste-msg" id="teste-msg" role="alert"></p>
    <button class="btn btn-navy btn-g" type="submit">Acompanhar ao vivo</button>
    <div class="sm" style="text-align:center">Ainda não fez o teste? <a href="#/whats" data-act="teste-sem-codigo">Comece por aqui</a>.</div>
  </form><div class="entrar-pe">Milla · por studio Ti Artes</div></div>`;
}
document.addEventListener('submit', e => {
  if (e.target.id !== 'teste-form') return;
  e.preventDefault();
  const fone = $('teste-whats').value.replace(/\D/g, ''), cod = $('teste-codigo').value.replace(/\D/g, ''), msg = $('teste-msg');
  if (fone.length < 10) { msg.textContent = 'Confira o WhatsApp, com o DDD.'; return $('teste-whats').focus(); }
  if (cod.length !== 6) { msg.textContent = 'O código tem 6 números.'; return $('teste-codigo').focus(); }
  msg.textContent = 'Procurando o seu teste…';
  testeRpc('teste_ao_vivo', { p_codigo: cod, p_fone: fone }).then(r => {
    if (!r || !r.ok) { msg.textContent = 'Não achei esse teste. Confira o número e o código (ele vale por 24 horas).'; return; }
    TS.guarda = { codigo: cod, fone, nome: r.nome || '', em: Date.now() };
    try { localStorage.setItem('milla_teste', JSON.stringify(TS.guarda)); } catch (x) {}
    testeLiga(); render();
  }).catch(() => { msg.textContent = 'Sem conexão agora. Tente de novo em instantes.'; });
});

/* ---------- a faixa do teste, no topo de cada tela ---------- */
function testeFaixaHtml() {
  if (TESTE_CFG && !TS.guarda) return `<section class="teste-faixa comecar" aria-label="Teste ao vivo">
    <span class="teste-vivo"><i aria-hidden="true"></i>Teste ao vivo</span>
    <p><b>Teste a Milla com o seu WhatsApp.</b> Fale com ela como um cliente procurando imóvel e veja a sua conversa e o lead aparecendo aqui no CRM, na hora.</p>
    <span class="teste-acoes"><button type="button" class="btn btn-line btn-p" data-act="teste-codigo">Já tenho um código</button><button type="button" class="btn btn-wa btn-p" data-act="teste-comecar">${svg(ICO.whats)}Testar com o meu WhatsApp</button></span>
  </section>`;
  if (!testeAtivo()) return '';
  const esperando = !TS.msgs;
  const pc = testeComputador();
  const botao = pc
    ? `<button type="button" class="btn btn-wa btn-p teste-wa" data-act="teste-app">${svg(ICO.whats)}${esperando ? 'Abrir o WhatsApp' : 'Voltar ao WhatsApp'}</button>`
    : `<a class="btn btn-wa btn-p teste-wa" href="${esc(testeWaLink())}" target="_blank" rel="noopener">${svg(ICO.whats)}Abrir o WhatsApp</a>`;
  /* o QR (abre a conversa no celular): enquanto espera o oi, ou quando o WhatsApp do computador não abriu */
  const comQr = pc && (esperando || TS.semApp);
  const qr = comQr ? `<span class="teste-qr" aria-hidden="true">${testeQr()}</span>` : '';
  const texto = esperando
    ? `<b>Mande um oi para a Milla</b> com o código <b class="num teste-cod">${esc(testeCodigoBonito())}</b>. A sua conversa aparece aqui, no topo do WhatsApp, como “Você”.${pc ? (TS.semApp ? ' Não achei o WhatsApp neste computador: aponte a câmera do celular para o QR.' : ' Prefere o celular? Aponte a câmera para o QR.') : ''}`
    : `<b>A sua conversa está no CRM</b> · ${TS.msgs} ${TS.msgs === 1 ? 'mensagem' : 'mensagens'} até agora. Continue no WhatsApp e veja tudo chegando aqui.${TS.semApp ? ' Pelo celular: aponte a câmera para o QR.' : ''}`;
  return `<section class="teste-faixa ${esperando ? 'espera' : ''}" aria-label="Teste ao vivo">
    ${qr}<span class="teste-vivo"><i aria-hidden="true"></i>Teste ao vivo</span>
    <p>${texto}</p>
    <span class="teste-acoes">${!esperando ? `<a class="btn btn-line btn-p" href="#/whats/${esc(testeNumero())}">Ver a conversa</a>` : ''}${botao}</span>
  </section>`;
}
/* com a conversa já começada, voltar ao WhatsApp não põe o código de novo na caixa de texto */
function testeWaLink() { return 'https://wa.me/' + TESTE_CFG.numero + (TS.msgs ? '' : '?text=' + encodeURIComponent(testeTextoWa())); }
function testeQr() {
  if (TS.qr) return TS.qr;
  try {
    if (typeof qrcode !== 'function') return '';
    const q = qrcode(0, 'M'); q.addData('https://wa.me/' + TESTE_CFG.numero + '?text=' + encodeURIComponent(testeTextoWa())); q.make();
    TS.qr = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
  } catch (e) { TS.qr = ''; }
  return TS.qr;
}
/* depois de cada render: a faixa no topo da tela e, no celular, a barra de voltar ao WhatsApp */
function testeDepoisDoRender() {
  if (!TESTE_CFG) return;
  const meio = $('meio'); if (!meio) return;
  const velha = meio.querySelector('.teste-faixa'); if (velha) velha.remove();
  /* no celular, logo abaixo da barra do topo; no computador, no começo da tela */
  const topo = meio.querySelector('.demo-faixa');
  if (topo) topo.insertAdjacentHTML('afterend', testeFaixaHtml()); else meio.insertAdjacentHTML('afterbegin', testeFaixaHtml());
  testeBarraCel();
}
function testeBarraCel() {
  let b = $('teste-volta');
  if (testeComputador() || !TESTE_CFG || document.body.classList.contains('entrar')) { if (b) b.remove(); return; }
  /* ainda sem teste: a barra começa o teste */
  if (!TS.guarda) {
    if (b && b.tagName !== 'BUTTON') { b.remove(); b = null; }
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.id = 'teste-volta'; b.className = 'teste-volta'; b.dataset.act = 'teste-comecar'; document.body.appendChild(b); }
    b.innerHTML = `${svg(ICO.whats)}<span>Testar com o meu WhatsApp</span>`;
    return;
  }
  if (b && b.tagName !== 'A') { b.remove(); b = null; }
  if (!b) { b = document.createElement('a'); b.id = 'teste-volta'; b.className = 'teste-volta'; b.target = '_blank'; b.rel = 'noopener'; document.body.appendChild(b); }
  b.href = testeWaLink();
  const novas = Math.max(0, TS.msgs - TS.vistas);
  b.innerHTML = `${svg(ICO.whats)}<span>${TS.msgs ? 'Voltar ao WhatsApp' : 'Mandar um oi para a Milla'}</span>${novas ? `<b class="num">${novas} ${novas === 1 ? 'nova' : 'novas'}</b>` : ''}`;
}

/* ---------- o WhatsApp instalado no computador (16/11, noite) ----------
   Abre whatsapp://send com o código já escrito. Quando a janela perde o foco, o app abriu. Se em 2,5 s nada
   abriu (a pessoa não tem o WhatsApp no computador), a faixa mostra o QR para abrir a conversa no celular. */
function testeAbreApp() {
  let foi = false;
  const abriu = () => { foi = true; window.removeEventListener('blur', abriu); };
  window.addEventListener('blur', abriu);
  location.href = 'whatsapp://send?phone=' + TESTE_CFG.numero + (TS.msgs ? '' : '&text=' + encodeURIComponent(testeTextoWa()));
  setTimeout(() => {
    window.removeEventListener('blur', abriu);
    if (foi || document.visibilityState !== 'visible') return;
    TS.semApp = true; testeDepoisDoRender();
    toast('Não achei o WhatsApp neste computador. Aponte a câmera do celular para o QR.');
  }, 2500);
}
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act="teste-app"]');
  if (!el) return;
  testeAbreApp();
});

/* ---------- a conversa de verdade dentro da demonstração ---------- */
function testeAplica(r) {
  WZ_EXEMPLO = WZ_EXEMPLO || wzDemo();
  const n = testeNumero();
  const nome = 'Você · ' + ((TS.guarda.nome || r.nome || (r.conversa && r.conversa.nome) || 'teste').trim().split(' ')[0]);
  const msgs = (r.msgs || []).map(m => ({ numero: n, dir: m.dir || 'cliente', texto: m.texto || '', quando: m.quando, ...(m.por ? { por: m.por } : {}) }));
  WZ_EXEMPLO.conv = WZ_EXEMPLO.conv.filter(c => c.numero !== n);
  WZ_EXEMPLO.msgs = WZ_EXEMPLO.msgs.filter(m => m.numero !== n);
  WZ_EXEMPLO.ped = WZ_EXEMPLO.ped.filter(p => !p.teste);
  /* quem está com a conversa aberta já leu */
  if (typeof wzAberto === 'function' && wzAberto() === n) TS.lidasAte = msgs.length;
  if (msgs.length) {
    const u = msgs[msgs.length - 1], cli = msgs.filter(m => m.dir === 'cliente');
    const naoLidas = msgs.slice(TS.lidasAte).filter(m => m.dir === 'cliente').length;
    WZ_EXEMPLO.conv.unshift({ numero: n, nome, voce: true, ultima: u.texto, ultimaEm: u.quando, ultimaDir: u.dir,
      clienteEm: cli.length ? cli[cli.length - 1].quando : u.quando, naoLidas, robo: (r.conversa && r.conversa.robo) || 'ligado' });
    WZ_EXEMPLO.msgs.push(...msgs);
  }
  (r.pedidos || []).forEach((p, i) => {
    const id = 'teste-p' + i;
    WZ_EXEMPLO.ped.unshift(Object.assign({
      id, teste: true, nome, telefone: n, rotulo: p.rotulo || 'Pedido', imovelRef: p.imovelRef || '', status: p.status || 'novo',
      temperatura: p.temperatura || 'quente', mensagem: p.mensagem || '', extra: (p.extra && typeof p.extra === 'object') ? p.extra : {},
      criadoEm: p.criadoEm || new Date().toISOString(), origem: 'robo-whatsapp',
      ...(p.avisados && p.avisados.length ? { equipe: { avisados: p.avisados, em: p.criadoEm, ...(p.respondeu ? { resposta: { por: p.respondeu, acao: 'confirmado', em: p.criadoEm } } : {}) } } : {}),
    }, TS.over[id] || {}));
  });
  LD.lista = WZ_EXEMPLO.ped; LD.carregou = true;
  const antes = TS.msgs; TS.msgs = msgs.length;
  if (antes && msgs.length > antes) {
    const novas = msgs.slice(antes);
    const daMilla = novas.some(m => m.dir !== 'cliente');
    toast(daMilla ? 'A Milla respondeu na sua conversa.' : 'Chegou a sua mensagem no CRM.');
  }
  if (!antes && msgs.length && !String(location.hash).startsWith('#/whats/')) location.hash = '#/whats/' + encodeURIComponent(n);
  if (typeof wzAberto === 'function' && wzAberto() === n) TS.vistas = TS.msgs;
}
/* o que a pessoa muda no lead dela (status, calor) fica, mesmo com a página perguntando de novo */
document.addEventListener('change', e => {
  const act = e.target.dataset && e.target.dataset.act, id = e.target.dataset && e.target.dataset.id;
  if (!id || !String(id).startsWith('teste-p')) return;
  if (act === 'ld-status' || act === 'wz-status') TS.over[id] = Object.assign(TS.over[id] || {}, { status: e.target.value, statusEm: new Date().toISOString() });
  if (act === 'ld-temp' || act === 'wz-temp') TS.over[id] = Object.assign(TS.over[id] || {}, { temperatura: e.target.value });
}, true);

function testeBusca() {
  if (!testeAtivo() || TS.fim) return;
  if (Date.now() > TS.parar) { TS.fim = true; clearInterval(TS.timer); toast('O teste ao vivo pausou. Recarregue a página para continuar.'); return; }
  testeRpc('teste_ao_vivo', { p_codigo: TS.guarda.codigo, p_fone: TS.guarda.fone }).then(r => {
    TS.ultimaOk = Date.now();
    if (!r || !r.ok) { TS.fim = true; clearInterval(TS.timer); toast('Este teste expirou (vale 24 horas). Faça outro pelo site.'); return; }
    const msgs = r.msgs || [], peds = r.pedidos || [];
    const sig = JSON.stringify([msgs.length, msgs.length && msgs[msgs.length - 1].quando, peds.map(p => [p.status, p.temperatura, p.avisados, p.respondeu])]);
    if (sig === TS.sig) return;
    TS.sig = sig;
    testeAplica(r);
    /* redesenha a tela que está aberta (o WhatsApp tem o próprio relógio, mas não espera 12 s) */
    /* no WhatsApp, recarrega a lista dos exemplos já com a conversa nova; com a conversa aberta mas ainda
       sem o painel dela (primeira vez), redesenha a tela inteira */
    if (typeof wzNaTela === 'function' && wzNaTela()) wzAtualiza(!!wzAberto() && !$('wz-corpo')); else render();
    testeDepoisDoRender();
  }).catch(() => {});
}

function testeEntra() {
  /* entra como a Carla (dona), para a pessoa ver tudo, inclusive a Gestão */
  try { if (!localStorage.getItem('milla_demo_quem')) localStorage.setItem('milla_demo_quem', 'carla'); } catch (e) {}
  if (typeof demoPessoa === 'function' && !demoPessoa().id) demoPessoa.mem = 'carla';
  if (!location.hash || location.hash === '#' || location.hash === '#/') location.hash = '#/whats';
}
function testeLiga() {
  testeEntra();
  if (!testeAtivo()) return;
  TS.parar = Date.now() + 2 * 3600e3;
  clearInterval(TS.timer);
  TS.timer = setInterval(() => { if (document.visibilityState === 'visible') testeBusca(); }, 3000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') testeBusca(); });
  testeBusca();
}
function testeInicio() {
  if (!TESTE_CFG) return;
  document.body.classList.add('modo-teste');
  /* a janela do WhatsApp Web ao lado saiu (16/11, noite): apaga a marca que o site antigo deixava */
  try { sessionStorage.removeItem('milla_teste_lado'); } catch (e) {}
  TS.guarda = testeLeGuarda();
  testeGuardaDe();
  testeLiga();
}

/* ---------- começar o teste aqui mesmo (16/11/2026, noite) ----------
   O botão "Painel Milla CRM" do site da Imobiliária Milla traz direto para cá. Quem chega sem teste vê o CRM com
   os exemplos e começa por este cadastro, o MESMO do formulário Testar do site: o contato vai para o CRM de vendas
   (millavendas.pedir_teste, com o vendedor do link ?de=) e a sala da demonstração dá o código (millademo.teste_novo). */
function testeGuardaDe() {
  let de = '';
  try { const g = JSON.parse(localStorage.getItem('milla_de') || 'null'); if (g && g.ate > Date.now() && /^[a-z0-9-]{2,30}$/.test(g.de)) de = g.de; } catch (e) {}
  const q = (new URLSearchParams(location.search).get('de') || '').toLowerCase();
  if (!de && /^[a-z0-9-]{2,30}$/.test(q)) { de = q; try { localStorage.setItem('milla_de', JSON.stringify({ de: q, ate: Date.now() + 90 * 864e5 })); } catch (e) {} }
  TS.de = de;
  /* um pedido que não chegou ao CRM de vendas da última vez */
  try {
    const pend = JSON.parse(localStorage.getItem('milla_teste_pendente') || 'null');
    if (pend && TESTE_CFG) testeRpc('pedir_teste', { p: pend }, 'millavendas').then(r => { if (r && r.ok !== false) localStorage.removeItem('milla_teste_pendente'); }).catch(() => {});
  } catch (e) {}
}
function testeDialogo() {
  let m = $('teste-modal');
  if (m) { m.hidden = false; setTimeout(() => { const n = $('tc-nome'); if (n) n.focus(); }, 30); return; }
  m = document.createElement('div'); m.id = 'teste-modal'; m.className = 'teste-modal';
  m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'tc-titulo');
  m.innerHTML = `<form class="entrar-caixa teste-caixa" id="teste-comecar-form" novalidate>
    <button type="button" class="teste-x" data-act="teste-fecha" aria-label="Fechar">&times;</button>
    <span class="olho">Teste ao vivo</span><h2 id="tc-titulo">Fale com a Milla agora</h2>
    <div class="sm">Deixe o seu contato e mande um oi para a Milla no WhatsApp. A conversa e o lead aparecem aqui no CRM, na hora.</div>
    <label for="tc-nome" class="sm b">Seu nome</label><input class="inp" id="tc-nome" autocomplete="name" maxlength="80">
    <label for="tc-imob" class="sm b">Imobiliária <span class="sm">(se tiver)</span></label><input class="inp" id="tc-imob" autocomplete="organization" maxlength="80">
    <label for="tc-whats" class="sm b">WhatsApp</label><input class="inp" id="tc-whats" type="tel" inputmode="tel" autocomplete="tel" placeholder="(41) 99999-9999" maxlength="20">
    <label for="tc-email" class="sm b">E-mail</label><input class="inp" id="tc-email" type="email" inputmode="email" autocomplete="email" maxlength="120">
    <input class="teste-armadilha" id="tc-site" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="teste-aceite"><input type="checkbox" id="tc-aceite">Aceito receber contato da Ti Artes sobre a Milla pelo WhatsApp e por e-mail.</label>
    <p class="sm teste-msg" id="tc-msg" role="alert"></p>
    <button class="btn btn-wa btn-g" type="submit" id="tc-enviar">${svg(ICO.whats)}Começar o teste</button>
  </form>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) testeFechaDialogo(); });
  setTimeout(() => { const n = $('tc-nome'); if (n) n.focus(); }, 30);
}
function testeFechaDialogo() { const m = $('teste-modal'); if (m) m.hidden = true; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') testeFechaDialogo(); });
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act^="teste-"]');
  if (!el) return;
  const a = el.dataset.act;
  if (a === 'teste-comecar') { e.preventDefault(); testeDialogo(); }
  if (a === 'teste-fecha') testeFechaDialogo();
  if (a === 'teste-codigo') { TS.pedeCodigo = true; render(); testeBarraCel(); }
  if (a === 'teste-sem-codigo') { e.preventDefault(); TS.pedeCodigo = false; render(); setTimeout(testeDialogo, 50); }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'teste-comecar-form') return;
  e.preventDefault();
  const msg = $('tc-msg'), enviar = $('tc-enviar');
  const campo = id => $(id);
  const falha = (t, id) => { msg.textContent = t; if (id) campo(id).focus(); };
  const dig = campo('tc-whats').value.replace(/\D/g, '');
  const d = { nome: campo('tc-nome').value.trim(), imobiliaria: campo('tc-imob').value.trim(), whats: dig.length <= 11 ? '55' + dig : dig,
    email: campo('tc-email').value.trim(), aceite: campo('tc-aceite').checked, armadilha: campo('tc-site').value, de: TS.de || '',
    pagina: location.pathname + (TS.de ? '?de=' + TS.de : '') };
  if (d.nome.length < 2) return falha('Escreva o seu nome.', 'tc-nome');
  if (dig.length < 10) return falha('Confira o WhatsApp, com o DDD.', 'tc-whats');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return falha('Confira o e-mail.', 'tc-email');
  if (!d.aceite) return falha('Marque que aceita o contato para seguir.', 'tc-aceite');
  msg.textContent = ''; enviar.disabled = true;
  const ja = TS.vendaFeita === d.whats;
  const venda = ja ? Promise.resolve(null) : testeRpc('pedir_teste', { p: d }, 'millavendas').catch(() => { try { localStorage.setItem('milla_teste_pendente', JSON.stringify(d)); } catch (x) {} return null; });
  const codigo = testeRpc('teste_novo', { p_nome: d.nome, p_fone: d.whats }).catch(() => null);
  Promise.all([venda, codigo]).then(([v, c]) => {
    enviar.disabled = false;
    if (v && v.ok === false && v.erro === 'whats') return falha('Confira o WhatsApp, com o DDD.', 'tc-whats');
    if (v && v.ok === false && v.erro === 'email') return falha('Confira o e-mail.', 'tc-email');
    TS.vendaFeita = d.whats;
    if (!c || !c.ok || !/^\d{6}$/.test(c.codigo || '')) {
      return falha(c && c.erro === 'limite' ? 'Este número já fez muitos testes hoje. Tente amanhã ou fale com a Ti Artes.' : 'Não consegui começar o teste agora. Tente de novo em instantes.');
    }
    TS.guarda = { codigo: c.codigo, fone: d.whats, nome: d.nome, em: Date.now() };
    try { localStorage.setItem('milla_teste', JSON.stringify(TS.guarda)); } catch (x) {}
    testeFechaDialogo();
    testeLiga(); render();
    toast('Pronto! Mande um oi para a Milla com o código ' + testeCodigoBonito() + '.');
  });
});
