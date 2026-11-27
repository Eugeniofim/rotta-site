/* Projetiva — comportamento da página (menu, WhatsApp, busca, formulário, movimento leve). */

/* ====== O ÚNICO LUGAR PARA TROCAR O CONTATO ======
   whatsapp: número com país e DDD, só dígitos (55 + DDD + número).
   Enquanto estiver vazio, o WhatsApp abre com a mensagem pronta e pede para escolher o contato. */
const PROJETIVA = {
  whatsapp: '',
};

(function () {
  'use strict';

  const raiz = document.documentElement;
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- WhatsApp ---------- */

  function linkZap(texto) {
    const base = PROJETIVA.whatsapp ? 'https://wa.me/' + PROJETIVA.whatsapp : 'https://wa.me/';
    return base + '?text=' + encodeURIComponent(texto);
  }

  function ligarZap(a, texto) {
    a.href = linkZap(texto);
    a.target = '_blank';
    a.rel = 'noopener';
  }

  document.querySelectorAll('a[data-zap]').forEach(function (a) {
    ligarZap(a, a.dataset.zap);
  });

  /* cada linha de serviço abre a conversa já com o serviço escrito */
  const servicos = Array.from(document.querySelectorAll('.servico'));
  servicos.forEach(function (a) {
    const sigla = a.querySelector('.servico__sigla').textContent.trim();
    const nome = a.querySelector('.servico__nome').textContent.trim();
    ligarZap(a, 'Olá! Preciso de um orçamento para: ' + (sigla ? sigla + ' – ' : '') + nome + '.');
    a.setAttribute('aria-label', (sigla ? sigla + ', ' : '') + nome + '. Pedir orçamento no WhatsApp');
  });

  /* ---------- menu do celular ---------- */

  const topo = document.querySelector('.topo');
  const botaoMenu = document.querySelector('.topo__menu');
  const rotuloMenu = botaoMenu.querySelector('.so-leitor');

  function menu(abrir) {
    topo.classList.toggle('aberto', abrir);
    botaoMenu.setAttribute('aria-expanded', String(abrir));
    rotuloMenu.textContent = abrir ? 'Fechar menu' : 'Abrir menu';
  }
  botaoMenu.addEventListener('click', function () {
    menu(!topo.classList.contains('aberto'));
  });
  document.querySelectorAll('.topo__nav a').forEach(function (a) {
    a.addEventListener('click', function () { menu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && topo.classList.contains('aberto')) {
      menu(false);
      botaoMenu.focus();
    }
  });

  /* ---------- busca de serviços ---------- */

  function simples(t) {
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  const campoBusca = document.getElementById('busca-servico');
  const contaBusca = document.getElementById('busca-conta');
  const vazioBusca = document.getElementById('busca-vazio');
  const grupos = Array.from(document.querySelectorAll('.grupo'));

  /* a busca casa pelo começo das palavras: "car" acha CAR e "caracterização", não "Orçar" */
  function palavras(t) {
    return simples(t).replace(/[^a-z0-9+]+/g, ' ').trim();
  }
  servicos.forEach(function (a) {
    const sigla = a.querySelector('.servico__sigla').textContent;
    const nome = a.querySelector('.servico__nome').textContent;
    const grupo = a.closest('.grupo').querySelector('h3').textContent;
    a.dataset.busca = ' ' + palavras(sigla + ' ' + nome + ' ' + grupo + ' ' + (a.dataset.extra || ''));
  });

  function filtrar() {
    const termos = palavras(campoBusca.value).split(' ').filter(Boolean);
    let achados = 0;
    servicos.forEach(function (a) {
      const bate = termos.every(function (t) { return a.dataset.busca.indexOf(' ' + t) !== -1; });
      a.parentElement.hidden = !bate;
      if (bate) achados += 1;
    });
    grupos.forEach(function (g) {
      g.hidden = !g.querySelector('li:not([hidden])');
      g.classList.add('visto');
    });
    vazioBusca.hidden = achados !== 0;
    if (!termos.length) contaBusca.textContent = '';
    else if (achados === 0) contaBusca.textContent = 'Nenhum serviço encontrado.';
    else contaBusca.textContent = achados === 1 ? '1 serviço encontrado.' : achados + ' serviços encontrados.';
  }
  campoBusca.addEventListener('input', filtrar);

  /* ---------- formulário → WhatsApp ---------- */

  const formulario = document.getElementById('formulario');
  const nome = document.getElementById('f-nome');
  const erroNome = document.getElementById('erro-nome');
  const retorno = document.getElementById('retorno');
  const retornoLink = document.getElementById('retorno-link');

  function validarNome() {
    const ok = nome.value.trim().length > 1;
    nome.setAttribute('aria-invalid', String(!ok));
    erroNome.hidden = ok;
    return ok;
  }
  nome.addEventListener('blur', function () { if (nome.value) validarNome(); });
  nome.addEventListener('input', function () { if (!erroNome.hidden) validarNome(); });

  formulario.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validarNome()) { nome.focus(); return; }
    const dados = new FormData(formulario);
    const linhas = [
      'Olá, Projetiva! Meu nome é ' + String(dados.get('nome')).trim() + '.',
      'Preciso de: ' + dados.get('tipo') + '.',
    ];
    const cidade = String(dados.get('cidade')).trim();
    const detalhes = String(dados.get('detalhes')).trim();
    if (cidade) linhas.push('Município: ' + cidade + '.');
    if (detalhes) linhas.push(detalhes);
    const url = linkZap(linhas.join('\n'));
    retornoLink.href = url;
    retorno.hidden = false;
    window.open(url, '_blank', 'noopener');
  });

  /* ---------- revelar ao rolar ---------- */

  const revelaveis = document.querySelectorAll('[data-revela]');
  if ('IntersectionObserver' in window && !quieto) {
    const olheiro = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visto'); olheiro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revelaveis.forEach(function (el) { olheiro.observe(el); });
  } else {
    revelaveis.forEach(function (el) { el.classList.add('visto'); });
  }

  /* ---------- fotos que inclinam com o mouse ---------- */

  if (!quieto && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-inclina]').forEach(function (foto) {
      foto.addEventListener('pointermove', function (e) {
        const r = foto.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        foto.classList.add('inclinando');
        foto.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        foto.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
        foto.style.setProperty('--px', (-x * 14).toFixed(1) + 'px');
        foto.style.setProperty('--py', (-y * 14).toFixed(1) + 'px');
      });
      foto.addEventListener('pointerleave', function () {
        foto.classList.remove('inclinando');
        ['--rx', '--ry', '--px', '--py'].forEach(function (v) { foto.style.removeProperty(v); });
      });
    });
  }

  /* ---------- botão fixo do celular: aparece depois do topo, some no contato ---------- */

  const zapFixo = document.getElementById('zap-fixo');
  const hero = document.getElementById('inicio');
  const contato = document.getElementById('contato');
  let pedido = false;
  function atualizarZap() {
    pedido = false;
    const passouTopo = hero.getBoundingClientRect().bottom < window.innerHeight * 0.35;
    const noContato = contato.getBoundingClientRect().top < window.innerHeight * 0.75;
    zapFixo.classList.toggle('visivel', passouTopo && !noContato);
  }
  window.addEventListener('scroll', function () {
    if (!pedido) { pedido = true; requestAnimationFrame(atualizarZap); }
  }, { passive: true });
  atualizarZap();

  /* ---------- rede de segurança da cena 3D ----------
     Se a cena não ficar pronta em 8 s (sem internet para a biblioteca, por exemplo),
     a página volta para a versão parada. */
  if (raiz.classList.contains('com-3d')) {
    window.addEventListener('projetiva:cena-falhou', function () { raiz.classList.remove('com-3d'); });
    setTimeout(function () {
      if (!raiz.classList.contains('cena-pronta')) raiz.classList.remove('com-3d');
    }, 8000);
  }
})();
