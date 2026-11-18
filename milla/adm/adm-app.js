/* =====================================================
   ADM DA MILLA (16/11/2026) — o painel do dono da Milla, num endereço só dele: rottaguide.com/milla/adm.
   A Milla tem três peças: a vitrine (o site que vende), o app de cada imobiliária (cada uma com o
   seu login e o seu CRM) e este ADM, do studio Ti Artes.
   Entra a conta do estúdio (o mesmo e-mail e a mesma senha do TI ARTES OS). Qualquer outra conta
   ouve "esta conta não é do studio Ti Artes" e não vê nada: a RLS do banco confere de novo.
     #/clientes  as imobiliárias e as mensalidades (adm.js)
     #/custos    o gasto de IA de cada uma, mês a mês (custos.js)
   ===================================================== */
'use strict';

const MARCA = 'ADM da Milla';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
function av(nome) {
  const ini = String(nome || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('') || '?';
  return `<span class="av p" title="${esc(nome)}" aria-label="${esc(nome)}">${esc(ini)}</span>`;
}
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 3600); }
const LOGADO = () => typeof isLoggedIn === 'function' && isLoggedIn();
const SIMBOLO = (cls = '') => `<svg class="simbolo ${cls}" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 8H46.5V41.5H8V26A18 18 0 0 1 26 8Z"/><path d="M8 48.5H46.5V82H26L8 92Z"/><path d="M53.5 48.5H92V64A18 18 0 0 1 74 82H53.5Z"/><path class="luz" d="M53.5 8H74A18 18 0 0 1 92 26V41.5H53.5Z"/></svg>`;
const AI = {
  clientes: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2',
  custos: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  app: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2',
  site: 'M4 12h16M12 4a16 16 0 0 1 0 16M12 4a16 16 0 0 0 0 16M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0',
  sair: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
};
const ADM_TELAS = [['clientes', 'Clientes e mensalidades', 'Clientes'], ['custos', 'Custos de IA', 'Custos']];
const ADM_LINKS = [['Site da Milla (vitrine)', 'https://rottaguide.com/milla/', 'site'], ['Demonstração ao vivo', 'https://rottaguide.com/milla/aovivo/', 'app']];
const AP = { msg: '', anterior: '', senhaNova: false };
function rota() { const t = location.hash.replace(/^#\/?/, '').split('/')[0]; return { tela: ADM_TELAS.some(x => x[0] === t) ? t : 'clientes' }; }
function faixaCel() {
  return `<div class="demo-faixa"><a href="#/clientes" class="faixa-marca" aria-label="ADM da Milla">${SIMBOLO()}<span><b>Milla</b><small>ADM · studio Ti Artes</small></span></a><button type="button" class="btn btn-line btn-p" data-act="ap-sair">Sair</button></div>`;
}

function vEntrar() {
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="ap-entrar" aria-label="Entrar no ADM da Milla">
    <div class="entrar-marca">${SIMBOLO('grande')}<span class="olho">studio Ti Artes</span><h1>ADM da Milla</h1><div class="sm">Só a conta do estúdio entra aqui: o mesmo e-mail e a mesma senha do TI ARTES OS.</div></div>
    <label for="e-mail" class="sm b">E-mail</label><input id="e-mail" class="inp" type="email" autocomplete="username" required>
    <label for="e-senha" class="sm b">Senha</label><input id="e-senha" class="inp" type="password" autocomplete="current-password" required>
    <button type="submit" class="btn btn-navy btn-g">Entrar</button>
    <div class="sm" id="entrar-msg" role="status" style="text-align:center">${esc(AP.msg)}</div>
    <button type="button" class="btn btn-line btn-p" data-act="ap-esqueci">Esqueci a senha</button>
  </form><div class="entrar-pe">Milla · por studio Ti Artes</div></div>`;
}
/* voltou do e-mail de "Esqueci a senha": a senha nova vale também no TI ARTES OS (é a mesma conta) */
function vSenhaNova() {
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="ap-senha" aria-label="Criar a senha nova">
    <div class="entrar-marca">${SIMBOLO('grande')}<span class="olho">studio Ti Artes</span><h1>Crie a sua senha nova</h1><div class="sm">Ela vale aqui e no TI ARTES OS: é a mesma conta.</div></div>
    <label for="s-nova" class="sm b">Senha nova (mínimo 8 caracteres)</label><input id="s-nova" class="inp" type="password" minlength="8" autocomplete="new-password" required>
    <button type="submit" class="btn btn-navy btn-g">Salvar a senha</button>
    <div class="sm" id="senha-msg" role="status" style="text-align:center"></div>
  </form></div>`;
}
function vNaoEstudio() {
  return `${faixaCel()}<div class="topo"><h1>ADM da Milla</h1></div><div class="box"><b>Esta conta não é a do studio Ti Artes.</b>
    <div class="sm">${authEmail() ? 'Você entrou como ' + esc(authEmail()) + '. ' : ''}O ADM é só do estúdio. Quem é de uma imobiliária entra pelo app dela.</div>
    <button type="button" class="btn btn-line btn-p" data-act="ap-sair">Sair desta conta</button></div>`;
}
function renderLado(r) {
  $('lado').innerHTML = `
    <a class="marca" href="#/clientes" aria-label="ADM da Milla"><span class="logo-milla">${SIMBOLO()}<b>Milla</b></span></a>
    <div class="conta"><span class="conta-rot">ADM</span><b>studio Ti Artes</b><span class="sm">as imobiliárias, as mensalidades e os custos</span></div>
    <nav class="menu" aria-label="Menu">${ADM_TELAS.map(([id, l]) => `<a class="mi ${r.tela === id ? 'on' : ''}" href="#/${id}" ${r.tela === id ? 'aria-current="page"' : ''}>${svg(AI[id])}<span>${l}</span></a>`).join('')}</nav>
    <div class="ap-links"><span class="conta-rot">Apps das imobiliárias</span>
      ${MILLA_SALAS.map(x => `<a class="mi site" href="${esc(x.url)}" target="_blank" rel="noopener">${svg(AI.app)}<span>${esc(x.nome)}</span></a>`).join('')}
      ${ADM_LINKS.map(([t, u, i]) => `<a class="mi site" href="${esc(u)}" target="_blank" rel="noopener">${svg(AI[i])}<span>${esc(t)}</span></a>`).join('')}</div>
    <div class="quem"><span class="sm">${esc(authEmail() || '')}</span><button type="button" class="btn btn-line btn-p" data-act="ap-sair">${svg(AI.sair)}Sair</button></div>`;
  $('barra-cel').innerHTML = ADM_TELAS.map(([id, , c]) => `<a href="#/${id}" class="${r.tela === id ? 'on' : ''}" ${r.tela === id ? 'aria-current="page"' : ''}>${svg(AI[id])}${c}</a>`).join('');
}

function render() {
  const porta = AP.senhaNova ? vSenhaNova() : !LOGADO() ? vEntrar() : '';
  document.body.classList.toggle('entrar', !!porta);
  if (porta) { $('meio').innerHTML = porta; $('lado').innerHTML = ''; $('barra-cel').innerHTML = ''; document.title = 'ADM da Milla · entrar'; return; }
  const r = rota();
  if (!EH_ESTUDIO()) { $('meio').innerHTML = vNaoEstudio(); $('lado').innerHTML = ''; $('barra-cel').innerHTML = ''; document.title = 'ADM da Milla'; return; }
  if (r.tela !== AP.anterior) {
    AP.anterior = r.tela; window.scrollTo(0, 0);
    /* as duas telas usam as fichas (os custos casam o robô com a imobiliária pela sala) */
    admCarregar(true).then(() => { if (r.tela === 'custos') return cuCarregar(true); }).then(() => { if (rota().tela === r.tela) render(); });
  }
  $('meio').innerHTML = r.tela === 'custos' ? vCustos() : vClientes();
  renderLado(r);
  document.title = 'ADM da Milla · ' + (r.tela === 'custos' ? 'Custos de IA' : 'Clientes');
}
window.addEventListener('hashchange', render);

document.addEventListener('submit', async e => {
  if (e.target.id === 'ap-senha') {
    e.preventDefault();
    const msg = $('senha-msg'); msg.textContent = 'Salvando…';
    const r = await authSetPassword($('s-nova').value);
    if (!r.ok) { msg.textContent = r.error || 'Não consegui salvar. Peça um link novo em "Esqueci a senha".'; return; }
    AP.senhaNova = false; toast('Senha nova salva.'); render(); return;
  }
  if (e.target.id !== 'ap-entrar') return;
  e.preventDefault();
  const msg = $('entrar-msg'); msg.textContent = 'Entrando…';
  const r = await authSignIn($('e-mail').value.trim(), $('e-senha').value);
  if (!r || !r.ok) { msg.textContent = (r && r.error) || 'E-mail ou senha não conferem.'; return; }
  AP.msg = ''; AP.anterior = ''; render();
});
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el || !el.dataset.act.startsWith('ap-')) return;
  if (el.dataset.act === 'ap-sair') {
    await authSignOut(); AP.anterior = '';
    Object.assign(ADM, { fichas: [], cfg: null, avisos: [], nomes: {}, carregou: false, erro: '' });
    Object.assign(CU, { dados: null, carregou: false, erro: '', semFuncao: false });
    render(); return;
  }
  if (el.dataset.act === 'ap-esqueci') {
    const email = ($('e-mail') && $('e-mail').value.trim()) || '';
    if (!email) { $('entrar-msg').textContent = 'Escreva o seu e-mail acima e toque de novo em "Esqueci a senha".'; return; }
    el.disabled = true; const r = await authReset(email); el.disabled = false;
    $('entrar-msg').textContent = r.ok ? 'Pronto: chegou um e-mail com o link para criar a senha nova.' : (r.error || 'Não consegui mandar agora. Tente de novo.');
  }
});

(function inicio() {
  const volta = typeof authFromHash === 'function' ? authFromHash() : null;
  if (volta && volta.tipo === 'recovery') AP.senhaNova = true;
  if (volta && volta.erro) AP.msg = 'O link do e-mail não valeu (' + volta.erro + '). Peça outro em "Esqueci a senha".';
  render();
})();
