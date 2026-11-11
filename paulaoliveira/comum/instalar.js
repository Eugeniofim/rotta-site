/* Baixar o app direto do site, sem loja de aplicativos.
   - Android no Chrome/Samsung: um toque (a janela "Instalar" do próprio celular).
   - Android dentro do Instagram: um toque abre a página no Chrome, que já abre esta janela.
   - iPhone: a Apple não deixa site nenhum instalar sozinho. São dois toques da própria
     pessoa (Compartilhar e "Adicionar à Tela de Início"); aqui eles vêm desenhados e com
     uma seta mostrando onde fica o Compartilhar.
   - iPhone dentro do Instagram: precisa abrir no Safari antes. */
(function () {
  var pedido = null, ouvintes = [];
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedido = e; ouvintes.forEach(function (f) { f(); }); });

  var ua = navigator.userAgent || '';
  function dentroDeOutroApp() { return /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly/i.test(ua); }
  function iphone() { return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function android() { return /Android/i.test(ua); }
  function instalado() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }

  function situacao() {
    if (instalado()) return 'instalado';
    if (dentroDeOutroApp()) return android() ? 'instagram-android' : 'instagram-iphone';
    if (pedido) return 'umtoque';
    if (iphone()) return 'iphone';
    if (android()) return 'android';
    return 'computador';
  }

  function enderecoLimpo(abrirJanela) {
    var u = new URL(location.href);
    u.hash = '';
    if (abrirJanela) u.searchParams.set('instalar', '1'); else u.searchParams.delete('instalar');
    return u.toString();
  }
  function linkChrome() {
    var u = new URL(enderecoLimpo(true));
    return 'intent://' + u.host + u.pathname + u.search + '#Intent;scheme=' + u.protocol.replace(':', '') + ';package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(u.toString()) + ';end';
  }

  var L = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var IC = {
    partilhar: '<svg viewBox="0 0 24 24" ' + L + '><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M7 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    adicionar: '<svg viewBox="0 0 24 24" ' + L + '><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
    pontos: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    pontosV: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
    fora: '<svg viewBox="0 0 24 24" ' + L + '><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    ok: '<svg viewBox="0 0 24 24" ' + L + '><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
  };

  function passos(lista) {
    return '<ol class="ins-passos">' + lista.map(function (p) {
      return '<li><span class="ins-ic" aria-hidden="true">' + IC[p[0]] + '</span><span><b>' + p[1] + '</b>' + (p[2] ? '<small>' + p[2] + '</small>' : '') + '</span></li>';
    }).join('') + '</ol>';
  }

  function html() {
    var s = situacao(), h;
    if (s === 'instalado') h = '<h2>O app já está no seu celular</h2><p>Tudo certo. Os avisos chegam por ele.</p>';
    else if (s === 'umtoque') h = '<h2>Baixar o app</h2><p>É um toque. Não ocupa quase nada e não passa por loja de aplicativos.</p><button class="acao" onclick="Instalar.tocar(this)">Baixar agora</button>';
    else if (s === 'instagram-android') h = '<h2>Abra no Chrome para baixar</h2><p>Dentro do Instagram o celular não deixa instalar. Um toque abre esta página no Chrome, já pronta para baixar.</p><a class="acao" href="' + linkChrome() + '">Abrir no Chrome</a>' +
      '<p class="ins-nota">Se não abrir: toque nos três pontinhos do Instagram e escolha "Abrir no Chrome".</p>';
    else if (s === 'instagram-iphone') h = '<h2>Abra no Safari para baixar</h2><p>Dentro do Instagram o iPhone não deixa instalar. São dois toques para sair:</p>' +
      passos([['pontos', 'Toque nos três pontinhos', 'No canto de cima da tela.'], ['fora', 'Escolha "Abrir no navegador externo"', 'A página abre no Safari. Lá, toque em Baixar o app de novo.']]) +
      '<button class="acao" onclick="Instalar.copiarEndereco(this)">Copiar o endereço</button>';
    else if (s === 'iphone') h = '<h2>Dois toques no iPhone</h2><p>A Apple pede que a própria pessoa adicione o app. Fica assim:</p>' +
      passos([['partilhar', 'Toque em Compartilhar', 'O quadrado com a setinha, na barra do Safari. No iOS 26, ele fica dentro do botão •••.'], ['adicionar', 'Escolha "Adicionar à Tela de Início"', 'Se não aparecer, role a lista para baixo.']]) +
      '<p class="ins-nota">Pronto: o ícone aparece na sua tela e abre como app. Abra por ele e permita os avisos.</p><button class="acao" onclick="Instalar.mostrarSeta(this)">Mostrar onde fica o Compartilhar</button>';
    else if (s === 'android') h = '<h2>Baixar no Android</h2>' +
      passos([['pontosV', 'Toque nos três pontinhos do navegador', 'No canto de cima.'], ['adicionar', 'Escolha "Instalar app"', 'Em alguns celulares aparece "Adicionar à tela inicial".']]);
    else h = '<h2>Abra pelo celular</h2><p>O app é feito para o celular. Abra este endereço lá e toque em Baixar o app.</p><button class="acao" onclick="Instalar.copiarEndereco(this)">Copiar o endereço</button>';
    return '<div class="ins">' + h + '</div>';
  }

  function tocar(botao) {
    if (!pedido) return Promise.resolve(false);
    pedido.prompt();
    return pedido.userChoice.then(function (r) {
      pedido = null;
      var ok = r.outcome === 'accepted', caixa = botao && botao.closest('.ins');
      if (ok && caixa) caixa.innerHTML = '<span class="ins-ic ins-feito" aria-hidden="true">' + IC.ok + '</span><h2>Pronto, o app está na sua tela</h2><p>Abra pelo ícone novo e permita os avisos para saber dos lotes antes de todo mundo.</p>';
      return ok;
    });
  }

  function copiarEndereco(botao) {
    var url = enderecoLimpo(false);
    var feito = function () { if (botao) botao.textContent = 'Endereço copiado'; };
    if (navigator.clipboard) return navigator.clipboard.writeText(url).then(feito, feito);
    feito();
    return Promise.resolve();
  }

  function mostrarSeta(botao) {
    var d = botao && botao.closest('dialog');
    if (d) d.close();
    var velha = document.querySelector('.ins-seta');
    if (velha) velha.remove();
    var s = document.createElement('button');
    s.className = 'ins-seta';
    s.setAttribute('aria-label', 'O Compartilhar fica na barra do Safari, embaixo. Toque para fechar.');
    s.innerHTML = '<span>O Compartilhar fica aqui</span><b aria-hidden="true">↓</b>';
    s.onclick = function () { s.remove(); };
    document.body.append(s);
    setTimeout(function () { s.remove(); }, 9000);
  }

  var css = document.createElement('style');
  css.textContent = '.ins-passos{list-style:none;padding:0;margin:14px 0 6px;display:grid;gap:12px}' +
    '.ins-passos li{display:grid;grid-template-columns:46px minmax(0,1fr);gap:12px;align-items:center}' +
    '.ins-ic{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:rgba(0,0,0,.07)}' +
    '.ins-ic svg{width:25px;height:25px}' +
    '.ins-passos b{display:block;font-weight:600;line-height:1.2}' +
    '.ins-passos small{display:block;opacity:.78;font-size:.84em;line-height:1.3;margin-top:2px}' +
    '.ins-nota{font-size:.88em;opacity:.85;margin-top:10px}' +
    '.ins-feito{background:#1F8A4C;color:#fff;margin-bottom:10px}' +
    '.ins-seta{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));z-index:95;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 18px 8px;white-space:nowrap;border:0;border-radius:24px;background:#111;color:#fff;font:600 15px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45);transform:translateX(-50%);animation:ins-pula 1s ease-in-out infinite;cursor:pointer}' +
    '.ins-seta b{font-size:22px;line-height:1}' +
    '@keyframes ins-pula{50%{transform:translate(-50%,7px)}}' +
    '@media(prefers-reduced-motion:reduce){.ins-seta{animation:none}}';
  document.head.append(css);

  window.Instalar = {
    situacao: situacao, html: html, tocar: tocar, copiarEndereco: copiarEndereco, mostrarSeta: mostrarSeta,
    conteudo: function () { return { t: '', p: [] }; }
  };

  /* veio do Instagram pelo botão "Abrir no Chrome": abre a janela de baixar sozinha */
  if (/[?&]instalar=1/.test(location.search)) {
    history.replaceState(null, '', enderecoLimpo(false) + location.hash);
    window.addEventListener('load', function () {
      var tentativas = 0;
      (function espera() {
        if (typeof window.baixar !== 'function') return;
        if (pedido || tentativas++ > 10 || !android()) return window.baixar();
        setTimeout(espera, 300);
      })();
    });
  }

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
