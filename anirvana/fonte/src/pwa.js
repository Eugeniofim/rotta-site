/* ============================================================
   APP INSTALÁVEL — vigia de versão (skill pwa-atualiza)
   só roda no endereço próprio (https); no artifact fica quieto
   ============================================================ */
const VOLTOU = []; let _voltouEm = 0;
function aoVoltar(fn, minSeg){ VOLTOU.push({fn, min:(minSeg||0)*1000, ultimo:0}); }
function _dispararVolta(forcado){
  const agora = Date.now();
  if (!forcado && agora - _voltouEm < 1500) return;
  _voltouEm = agora;
  VOLTOU.forEach(v => {
    if (!forcado && v.min && agora - v.ultimo < v.min) return;
    v.ultimo = agora;
    try{ v.fn(); }catch(e){ console.warn('aoVoltar:', e); }
  });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) _dispararVolta(); });
window.addEventListener('focus', () => _dispararVolta());
window.addEventListener('pageshow', e => { if (e.persisted) _dispararVolta(true); });
window.addEventListener('online', () => _dispararVolta(true));

let NOVA_ESPERANDO = null, _recarregando = false;
function mostrarNova(w){ NOVA_ESPERANDO = w; const b = document.querySelector('#novaBar'); if (b) b.classList.add('on'); }
function aplicarNova(){
  if (_recarregando) return; _recarregando = true;
  document.querySelector('#novaBar').classList.remove('on');
  try{ if (NOVA_ESPERANDO) NOVA_ESPERANDO.postMessage({tipo:'assumir'}); }catch(e){}
  setTimeout(() => { try{ location.reload(); }catch(e){} }, 2000);   /* rede de segurança */
}
function ligarAtualizacao(){
  if (!('serviceWorker' in navigator)) return;
  if (!location.protocol.startsWith('http')) return;                  /* file:// não tem service worker */
  if (!document.querySelector('link[rel=manifest]')) return;          /* só no endereço próprio */
  navigator.serviceWorker.register('sw.js', {updateViaCache:'none'}).catch(() => {});
  navigator.serviceWorker.ready.then(reg => {
    if (reg.waiting && navigator.serviceWorker.controller) mostrarNova(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const novo = reg.installing; if (!novo) return;
      novo.addEventListener('statechange', () => {
        /* 'installed' COM controller = atualização; sem controller = primeira instalação */
        if (novo.state === 'installed' && navigator.serviceWorker.controller) mostrarNova(novo);
      });
    });
    const checar = () => reg.update().catch(() => {});
    checar();
    aoVoltar(checar, 60);
    setInterval(checar, 30*60*1000);
  }).catch(() => {});
  const tinhaVersao = !!navigator.serviceWorker.controller;
  let jaTrocou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!tinhaVersao && !_recarregando) return;     /* primeira instalação: não mexe na tela */
    if (jaTrocou) return; jaTrocou = true;
    try{ location.reload(); }catch(e){}
  });
}
document.addEventListener('click', e => {
  if (e.target.closest('#btnNova')) aplicarNova();
  if (e.target.closest('#btnNovaX')) document.querySelector('#novaBar').classList.remove('on');
});
ligarAtualizacao();
