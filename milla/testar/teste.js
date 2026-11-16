/* =====================================================
   TESTE AO VIVO NO CRM DE VERDADE (16/11/2026)

   Pedido do Eugênio: "quando a pessoa clica em testar e preenche os dados, ela aperta pra falar
   com a Milla no WhatsApp, mas a tela do CRM original já abre ao lado pra ele ver".

   Só liga na cópia publicada em rottaguide.com/milla/testar/ (config.js com APP_CONFIG.teste =
   { api, chave, numero }). É a demonstração da Imobiliária Milla (sem login, dados de exemplo)
   com UMA conversa de verdade: a de quem fez o teste. A cada 3 s a página pergunta à sala da
   demonstração millademo.teste_ao_vivo(código, número), que devolve só aquela conversa (sem CPF,
   sem e-mail). A conversa entra no topo do WhatsApp como "Você", e o lead dela entra em Leads,
   no Início e na Gestão, junto dos exemplos.

   O código e o número vêm do formulário Testar do site (localStorage 'milla_teste', nunca no
   endereço). Sem eles, a página pede o WhatsApp e o código.
   No computador, o botão do WhatsApp abre o WhatsApp Web numa janela estreita à direita e o CRM
   abre espaço para ela. No celular, o WhatsApp abre o app e a barra "Voltar ao WhatsApp" fica
   embaixo, com as mensagens novas.
   ===================================================== */
'use strict';

const TESTE_CFG = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.teste && APP_CONFIG.teste.api) ? APP_CONFIG.teste : null;
const TS = { guarda: null, sig: '', vistas: 0, lidasAte: 0, over: {}, timer: null, ultimaOk: 0, parar: 0, msgs: 0, codigoMsg: '', fim: false };
const TESTE_LADO = 460;   /* largura da janela do WhatsApp Web, no computador */

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
const testeComputador = () => { try { return matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1100px)').matches; } catch (e) { return false; } };

function testeRpc(nome, corpo) {
  return fetch(TESTE_CFG.api + '/rest/v1/rpc/' + nome, {
    method: 'POST',
    headers: { apikey: TESTE_CFG.chave, Authorization: 'Bearer ' + TESTE_CFG.chave, 'Content-Type': 'application/json', 'Content-Profile': 'millademo' },
    body: JSON.stringify(corpo),
  }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
}

/* ---------- a porta: sem teste neste aparelho, pede o WhatsApp e o código ---------- */
function testePorta() {
  if (!TESTE_CFG || TS.guarda) return '';
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="teste-form" aria-label="Acompanhar o teste ao vivo" novalidate>
    <div class="entrar-marca">${SIMBOLO('grande')}<span class="olho">Teste ao vivo</span><h1>Acompanhe o seu teste no CRM</h1>
      <div class="sm">Digite o mesmo WhatsApp do cadastro e o código de 6 números que apareceu para você.</div></div>
    <label for="teste-whats" class="sm b">WhatsApp</label><input class="inp" id="teste-whats" type="tel" inputmode="tel" autocomplete="tel" placeholder="(41) 99999-9999" maxlength="20">
    <label for="teste-codigo" class="sm b">Código do teste</label><input class="inp" id="teste-codigo" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" maxlength="7">
    <p class="sm teste-msg" id="teste-msg" role="alert"></p>
    <button class="btn btn-g" type="submit">Acompanhar ao vivo</button>
    <div class="sm" style="text-align:center">Ainda não fez o teste? <a href="../?testar=1">Comece pelo site</a>.</div>
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
  if (!testeAtivo()) return '';
  const esperando = !TS.msgs;
  const pc = testeComputador();
  const lado = document.body.classList.contains('com-whats');
  const botao = pc
    ? `<button type="button" class="btn btn-p teste-wa" data-act="teste-lado">${svg(ICO.whats)}${lado ? 'Trazer o WhatsApp de volta' : 'Abrir o WhatsApp ao lado'}</button>`
    : `<a class="btn btn-p teste-wa" href="${esc(testeWaLink())}" target="_blank" rel="noopener">${svg(ICO.whats)}Abrir o WhatsApp</a>`;
  const qr = esperando && pc ? `<span class="teste-qr" aria-hidden="true">${testeQr()}</span>` : '';
  const texto = esperando
    ? `<b>Mande um oi para a Milla</b> com o código <b class="num teste-cod">${esc(testeCodigoBonito())}</b>. A sua conversa aparece aqui, no topo do WhatsApp, como “Você”.${pc ? ' Prefere o celular? Aponte a câmera para o QR.' : ''}`
    : `<b>A sua conversa está no CRM</b> · ${TS.msgs} ${TS.msgs === 1 ? 'mensagem' : 'mensagens'} até agora. Continue no WhatsApp e veja tudo chegando aqui.`;
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
  if (!testeAtivo()) return;
  const meio = $('meio'); if (!meio) return;
  const velha = meio.querySelector('.teste-faixa'); if (velha) velha.remove();
  /* no celular, logo abaixo da barra do topo; no computador, no começo da tela */
  const topo = meio.querySelector('.demo-faixa');
  if (topo) topo.insertAdjacentHTML('afterend', testeFaixaHtml()); else meio.insertAdjacentHTML('afterbegin', testeFaixaHtml());
  testeBarraCel();
}
function testeBarraCel() {
  let b = $('teste-volta');
  if (testeComputador() || !testeAtivo()) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('a'); b.id = 'teste-volta'; b.className = 'teste-volta'; b.target = '_blank'; b.rel = 'noopener'; document.body.appendChild(b); }
  b.href = testeWaLink();
  const novas = Math.max(0, TS.msgs - TS.vistas);
  b.innerHTML = `${svg(ICO.whats)}<span>${TS.msgs ? 'Voltar ao WhatsApp' : 'Mandar um oi para a Milla'}</span>${novas ? `<b class="num">${novas} ${novas === 1 ? 'nova' : 'novas'}</b>` : ''}`;
}

/* ---------- o WhatsApp Web numa janela ao lado (computador) ---------- */
function testeAbreLado() {
  /* a tela inteira (não só a janela do navegador); nunca fora dela */
  const sw = Math.max(screen.availWidth || 0, window.outerWidth || 0, window.innerWidth || 0), sh = Math.max(screen.availHeight || 0, 600);
  const left = Math.max(0, (screen.availLeft || 0) + sw - TESTE_LADO), top = Math.max(0, screen.availTop || 0);
  const url = 'https://web.whatsapp.com/send?phone=' + TESTE_CFG.numero + (TS.msgs ? '' : '&text=' + encodeURIComponent(testeTextoWa()));
  const w = window.open(url, 'milla-whats', `popup=yes,width=${TESTE_LADO},height=${sh},left=${left},top=${top}`);
  if (!w) { window.open(testeWaLink(), '_blank', 'noopener'); toast('O navegador bloqueou a janela ao lado: abri o WhatsApp numa aba.'); return; }
  document.body.classList.add('com-whats');
  try { w.focus(); } catch (e) {}
  /* fechou a janela do WhatsApp: o CRM devolve o espaço */
  clearInterval(TS.olhaJanela);
  TS.olhaJanela = setInterval(() => { try { if (w.closed) { clearInterval(TS.olhaJanela); document.body.classList.remove('com-whats'); try { sessionStorage.removeItem('milla_teste_lado'); } catch (x) {} testeDepoisDoRender(); } } catch (x) {} }, 1500);
  testeDepoisDoRender();
}
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act="teste-lado"]');
  if (!el) return;
  testeAbreLado();
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

function testeLiga() {
  if (!testeAtivo()) return;
  /* entra como a Carla (dona), para a pessoa ver tudo, inclusive a Gestão */
  try { if (!localStorage.getItem('milla_demo_quem')) localStorage.setItem('milla_demo_quem', 'carla'); } catch (e) {}
  if (typeof demoPessoa === 'function' && !demoPessoa().id) demoPessoa.mem = 'carla';
  if (!location.hash || location.hash === '#' || location.hash === '#/') location.hash = '#/whats';
  TS.parar = Date.now() + 2 * 3600e3;
  clearInterval(TS.timer);
  TS.timer = setInterval(() => { if (document.visibilityState === 'visible') testeBusca(); }, 3000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') testeBusca(); });
  testeBusca();
}
function testeInicio() {
  if (!TESTE_CFG) return;
  document.body.classList.add('modo-teste');
  /* veio do site com o WhatsApp Web já aberto ao lado (sessionStorage da mesma aba) */
  try { if (sessionStorage.getItem('milla_teste_lado') === '1' && testeComputador()) document.body.classList.add('com-whats'); } catch (e) {}
  TS.guarda = testeLeGuarda();
  testeLiga();
}
