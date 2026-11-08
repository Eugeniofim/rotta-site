/* Baixar o app direto do site, sem loja de aplicativos.
   São quatro situações diferentes, e a que mais pesa aqui é a terceira:
   quase todo mundo chega pelo link da bio, ou seja, dentro do Instagram,
   e lá dentro o celular não deixa instalar nada. */
(function () {
  var pedido = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedido = e; });

  var ua = navigator.userAgent || '';
  function dentroDeOutroApp() { return /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly/i.test(ua); }
  function iphone() { return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function android() { return /Android/i.test(ua); }
  function instalado() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }

  function situacao() {
    if (instalado()) return 'instalado';
    if (dentroDeOutroApp()) return 'instagram';
    if (pedido) return 'umtoque';
    if (iphone()) return 'iphone';
    if (android()) return 'android';
    return 'computador';
  }

  var TEXTOS = {
    instalado: { t: 'O app já está no seu celular', p: ['Tudo certo. Os avisos chegam por aqui.'] },
    instagram: { t: 'Abra fora do Instagram', p: ['Toque nos três pontinhos no canto da tela.', 'Escolha “Abrir no navegador”.', 'Lá, volte aqui e toque em baixar.'], copiar: true },
    umtoque: { t: 'Baixar o app', p: ['É um toque. Não ocupa quase nada e não passa por loja de aplicativos.'], botao: true },
    iphone: { t: 'No iPhone são dois toques', p: ['Toque em Compartilhar, o quadrado com a setinha para cima.', 'Escolha “Adicionar à Tela de Início”.', 'Abra pelo ícone novo e permita os avisos.'] },
    android: { t: 'No Android', p: ['Toque nos três pontinhos do navegador.', 'Escolha “Instalar aplicativo”.'] },
    computador: { t: 'Abra pelo celular', p: ['O app é feito para o celular. Abra este endereço lá e toque em baixar.'] }
  };

  window.Instalar = {
    situacao: situacao,
    conteudo: function () { return TEXTOS[situacao()]; },
    tocar: function () {
      if (!pedido) return Promise.resolve(false);
      pedido.prompt();
      return pedido.userChoice.then(function (r) { pedido = null; return r.outcome === 'accepted'; });
    },
    copiarEndereco: function () {
      var url = location.href.split('#')[0];
      if (navigator.clipboard) return navigator.clipboard.writeText(url);
      return Promise.resolve();
    }
  };

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
