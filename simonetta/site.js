/* Simonetta Viagens — movimento da página e o formulário de pedido. */
(function () {
  'use strict';
  const ZAP = '5511998410681';
  const NUVEM = { url: 'https://uopfqlogjzuqpabptxkb.supabase.co', chave: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2', sala: 'ademir' };
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* topo: transparente sobre a foto, papel depois dela */
  const topo = $('#topo'), abertura = $('#inicio');
  const escuras = $$('.galeria, .contato');
  const ajustaTopo = () => {
    topo.classList.toggle('cheio', scrollY > abertura.offsetHeight - innerHeight * 0.6);
    /* sobre as partes escuras, o topo fica escuro */
    topo.classList.toggle('escuro', escuras.some((s) => { const r = s.getBoundingClientRect(); return r.top < 60 && r.bottom > 60; }));
  };
  addEventListener('scroll', ajustaTopo, { passive: true }); ajustaTopo();

  if (!calmo && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    /* rolagem suave (Lenis), sincronizada com as animações da página */
    if (window.Lenis) {
      document.documentElement.style.scrollBehavior = 'auto';
      const lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const alvo = a.getAttribute('href'); if (alvo.length > 1 && $(alvo)) { e.preventDefault(); lenis.scrollTo(alvo, { offset: -70 }); } }));
    }

    /* abertura: a foto de tela cheia encolhe até virar um quadro emoldurado na parede */
    const ab = gsap.timeline({ scrollTrigger: { trigger: '.abertura', start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
    ab.to('.abertura-texto', { y: -80, opacity: 0, ease: 'none', duration: 0.35 }, 0)
      .to('.rolar', { opacity: 0, duration: 0.1 }, 0)
      .to('.abertura-quadro', { scale: 0.44, y: '-3vh', boxShadow: '0 0 0 18px #fff, 0 70px 120px -40px rgba(0,0,0,.85)', ease: 'power1.inOut', duration: 1 }, 0)
      .to('.abertura-quadro img', { scale: 1, ease: 'none', duration: 1 }, 0);

    /* galeria: a câmera anda por um corredor; cada quadro vem do fundo e passa ao lado de quem lê */
    const quadros = $$('.quadro'), cena = $('#cena');
    const barra = document.createElement('div'); barra.className = 'barra-galeria'; barra.innerHTML = '<i></i>';
    $('.galeria-palco').appendChild(barra);
    const mm = gsap.matchMedia();
    mm.add({ largo: '(min-width: 901px)', estreito: '(max-width: 900px)' }, (ctx) => {
      const largo = ctx.conditions.largo, D = largo ? 1250 : 1000, X = largo ? 19 : 5, GIRO = largo ? 20 : 8, Z0 = 700, PERTO = largo ? -160 : -220;
      quadros.forEach((q, i) => {
        const lado = q.dataset.lado === 'e' ? -1 : 1;
        gsap.set(q, { xPercent: -50, yPercent: -46, x: (lado * X) + 'vw', z: -i * D - Z0, rotationY: -lado * GIRO });
      });
      const fim = (quadros.length - 1) * D + Z0 + PERTO;   /* o último para perto, sem passar da câmera */
      const pos = () => +gsap.getProperty(cena, 'z') || 0;
      const opacidades = () => {
        const cz = pos();
        quadros.forEach((q, i) => {
          const z = -i * D - Z0 + cz;                        /* onde o quadro está em relação à câmera */
          const o = z > PERTO ? Math.max(0, 1 - (z - PERTO) / 300)  /* chegou perto: some antes de cobrir a tela */
                  : z < -3 * D ? Math.max(0, 1 + (z + 3 * D) / D) /* muito no fundo: aparece aos poucos */
                  : 1;
          q.style.opacity = o.toFixed(3);
          q.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
        });
      };
      const t = gsap.to(cena, { z: fim, ease: 'none', scrollTrigger: { trigger: '.galeria', start: 'top top', end: 'bottom bottom', scrub: 0.9,
        onUpdate: (s) => { opacidades(); barra.firstChild.style.height = (s.progress * 100).toFixed(1) + '%'; } } });
      opacidades();
      /* o título sai de cena quando o primeiro quadro chega */
      gsap.to('.galeria-cab', { opacity: 0, y: -30, ease: 'none', scrollTrigger: { trigger: '.galeria', start: () => 'top+=' + innerHeight * 0.35 + ' top', end: () => 'top+=' + innerHeight * 0.9 + ' top', scrub: true } });
      return () => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); };
    });

    /* sobre as partes escuras, o topo fica escuro */

    /* entradas discretas no resto da página */
    gsap.from('.caminho', { opacity: 0, y: 40, stagger: 0.09, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: '.caminhos-grade', start: 'top 85%' } });
    gsap.from('.agenda-linha li', { opacity: 0, y: 24, stagger: 0.07, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: '.agenda-linha', start: 'top 85%' } });
    gsap.from('.passos-lista li', { opacity: 0, y: 30, stagger: 0.12, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.passos-lista', start: 'top 85%' } });
    $$('.quem-texto > *, .servico, .servicos-cab, .contato-texto, .pedido').forEach((el) =>
      gsap.from(el, { opacity: 0, y: 36, duration: 0.9, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
    gsap.from('.servico', { rotationX: -18, transformOrigin: '50% 100%', stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.servicos-grade', start: 'top 85%' } });
  }

  /* ---------- formulário: grava o pedido no painel da agência e abre o WhatsApp ---------- */
  const f = $('#pedido'), erro = $('#pedido-erro'), ok = $('#pedido-ok');
  const digitos = (s) => String(s || '').replace(/\D/g, '');
  const texto = (d) => {
    const partes = [d.destino && 'para ' + d.destino, d.quando && d.quando, d.pessoas && d.pessoas + (+d.pessoas === 1 ? ' pessoa' : ' pessoas')].filter(Boolean);
    return 'Olá, Simonetta! Sou ' + d.nome + '. Quero planejar uma viagem' + (partes.length ? ' ' + partes.join(', ') : '') + (d.tipo ? ' (' + d.tipo.toLowerCase() + ')' : '') + '.' + (d.mensagem ? '\n\n' + d.mensagem : '') + '\n\n(enviado pelo site)';
  };
  const linkZap = (msg) => 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(msg);
  const mostraErro = (msg, campo) => { erro.textContent = msg; erro.hidden = false; if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); } };
  $$('input, textarea', f).forEach((c) => c.addEventListener('input', () => { c.removeAttribute('aria-invalid'); erro.hidden = true; }));

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f).entries());
    d.nome = (d.nome || '').trim();
    if (d.nome.length < 2) return mostraErro('Escreva o seu nome.', f.nome);
    if (digitos(d.whats).length < 10) return mostraErro('Escreva o seu WhatsApp com DDD, para a Simonetta responder.', f.whats);
    if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return mostraErro('Esse e-mail parece incompleto. Confira ou deixe em branco.', f.email);
    const msg = texto(d), zap = linkZap(msg);
    /* o WhatsApp abre já no clique (o navegador só deixa abrir janela nesse momento) */
    const janela = window.open(zap, '_blank', 'noopener');
    const btn = $('#pedido-enviar'); btn.disabled = true;
    try {
      const r = await fetch(NUVEM.url + '/rest/v1/rpc/novo_pedido', {
        method: 'POST', headers: { apikey: NUVEM.chave, 'Content-Type': 'application/json', 'Content-Profile': NUVEM.sala },
        body: JSON.stringify({ p: { nome: d.nome, whats: d.whats, email: d.email || '', destino: d.destino || '', quando: d.quando || '', pessoas: d.pessoas || '', tipo: d.tipo || '', mensagem: d.mensagem || '' } }) });
      if (!r.ok) throw new Error('pedido ' + r.status);
    } catch (x) { /* mesmo sem gravar no painel, a mensagem do WhatsApp leva tudo */ }
    $('#pedido-zap').href = zap;
    $$('.campos, #pedido-enviar, .aviso-dados', f).forEach((el) => { el.hidden = true; });
    ok.hidden = false; ok.focus();
    if (!janela) $('#pedido-zap').textContent = 'toque aqui para abrir o WhatsApp com a mensagem';
  });

  /* "Qual é a sua viagem?": o caminho escolhido já chega marcado no formulário */
  $$('[data-tipo]').forEach((a) => a.addEventListener('click', () => { const r = $('input[name="tipo"][value="' + a.dataset.tipo + '"]'); if (r) r.checked = true; setTimeout(() => f.nome.focus({ preventScroll: true }), 900); }));

  /* botões de WhatsApp soltos abrem com uma saudação pronta */
  $$('[data-zap]').forEach((a) => { a.href = linkZap('Olá, Simonetta! Vim pelo site e quero conversar sobre uma viagem.'); });
})();
