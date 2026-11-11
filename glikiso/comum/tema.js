/* Temas da vitrine por época do ano: Natal, Páscoa e Namorados (ou o padrão).
   Quem escolhe é a Melissa, no painel (Tema do site). "Automático" segue o calendário.
   No protótipo a escolha do painel vale no aparelho dela; para todo mundo vale o calendário
   e o link com ?tema=natal (que serve de prévia). Na versão final a escolha fica na nuvem. */
(function () {
  const TEMAS = {
    padrao:    { nome: "Padrão", rotulo: "Gliki Sô Cookeria" },
    natal:     { nome: "Natal", rotulo: "Natal na Gliki Sô", particula: "neve", luzes: ["#ff6b6b", "#ffe9b8", "#6fdc95"], som: true,
                 /* abertura própria: o cookie de gorro, o gorro cai e o cookie se parte (vídeo de IA) */
                 quadros: { pasta: "abertura-natal", g: 133, p: 66, faixa: [0.02, 0.72] } },
    pascoa:    { nome: "Páscoa", rotulo: "Páscoa na Gliki Sô", particula: "ovo", luzes: ["#f6c5d0", "#ffe9b8", "#bfe3d9"] },
    namorados: { nome: "Dia dos Namorados", rotulo: "Dia dos Namorados na Gliki", particula: "coracao", luzes: ["#ff8fa3", "#ffe9b8", "#e9a9b2"] }
  };

  /* domingo de Páscoa (algoritmo de Meeus) */
  function pascoa(ano) {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }
  function pelaData(hoje = new Date()) {
    const ano = hoje.getFullYear(), dia = 86400000;
    const md = (hoje.getMonth() + 1) * 100 + hoje.getDate();
    if (md >= 1101 || md <= 106) return "natal";
    const p = pascoa(ano);
    if (hoje >= new Date(p.getTime() - 35 * dia) && hoje <= new Date(p.getTime() + dia)) return "pascoa";
    if (md >= 525 && md <= 612) return "namorados";
    return "padrao";
  }
  function escolhido() {
    const url = new URLSearchParams(location.search).get("tema");
    if (url && TEMAS[url]) return url;
    let salvo = null;
    try { salvo = localStorage.getItem("glk_tema"); } catch (e) {}
    if (salvo && TEMAS[salvo]) return salvo;
    return pelaData();
  }

  const soDados = document.currentScript && document.currentScript.dataset.so === "dados";
  const id = escolhido();
  const T = TEMAS[id];
  if (soDados) { window.GlikiTema = { id, T, TEMAS, pelaData }; return; }
  document.documentElement.dataset.tema = id;
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.GlikiTema = { id, T, TEMAS, pelaData };
  if (id === "padrao") return;

  /* ---------- cores das fitas de LED e textos ---------- */
  const [c1, c2, c3] = T.luzes;
  const css = document.createElement("style");
  css.textContent = `
  html[data-tema] .abertura-fitas path:nth-child(1), html[data-tema] .fitas path:nth-child(1) { stroke: ${c1}; }
  html[data-tema] .abertura-fitas path:nth-child(2), html[data-tema] .fitas path:nth-child(2) { stroke: ${c2}; }
  html[data-tema] .abertura-fitas path:nth-child(3), html[data-tema] .fitas path:nth-child(3) { stroke: ${c3}; }
  html[data-tema] .abertura-fitas path, html[data-tema] .fitas path { animation: temaPisca 2.6s ease-in-out infinite; }
  html[data-tema] .abertura-fitas path:nth-child(2), html[data-tema] .fitas path:nth-child(2) { animation-delay: .9s; }
  html[data-tema] .abertura-fitas path:nth-child(3), html[data-tema] .fitas path:nth-child(3) { animation-delay: 1.7s; }
  @keyframes temaPisca { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
  .tema-particulas { pointer-events: none; display: block; }
  .tema-particulas.no-palco { position: absolute; inset: 0; width: 100%; height: 100%; }
  .tema-particulas.no-fundo { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0; }
  html[data-tema] .abertura { z-index: 1; }
  html[data-tema] .pagina { position: relative; z-index: 1; }
  .sino-caixa { position: fixed; left: 18px; bottom: calc(22px + env(safe-area-inset-bottom)); z-index: 45; display: flex; align-items: center; gap: 8px; }
  .sino { position: relative; width: 58px; height: 58px; border-radius: 50%; border: 0; cursor: pointer; display: grid; place-items: center;
    background: radial-gradient(circle at 35% 30%, #4a2c1e, #2a1913 70%); box-shadow: 0 0 0 2px rgba(255,233,184,.55), 0 0 22px rgba(255,200,120,.45), 0 10px 24px rgba(0,0,0,.45); }
  .sino svg { width: 34px; height: 34px; transform-origin: 50% 12%; }
  .sino.toca svg { animation: sinoBalanca .9s cubic-bezier(.36,.07,.19,.97); }
  @keyframes sinoBalanca { 0% { transform: rotate(0); } 15% { transform: rotate(24deg); } 32% { transform: rotate(-20deg); } 50% { transform: rotate(13deg); } 68% { transform: rotate(-8deg); } 84% { transform: rotate(4deg); } 100% { transform: rotate(0); } }
  .sino-balao, .sino-som { font: 600 13px/1.2 "Figtree", system-ui, sans-serif; color: #2a1913; background: #ffe9b8; border-radius: 999px; padding: 0 14px; min-height: 36px; display: inline-flex; align-items: center;
    box-shadow: 0 0 16px rgba(255,214,140,.45); border: 0; white-space: nowrap; transition: opacity .4s, transform .4s; }
  .sino-som { cursor: pointer; min-height: 44px; }
  .sino-balao[hidden], .sino-som[hidden] { display: none; }
  .sino-balao.some { opacity: 0; transform: translateX(-8px); }
  @media (max-width: 759px) { .sino-caixa { left: 14px; bottom: calc(92px + env(safe-area-inset-bottom)); } }
  @media (prefers-reduced-motion: reduce) { html[data-tema] .abertura-fitas path, html[data-tema] .fitas path { animation: none; } .sino.toca svg { animation: none; } }
  `;
  document.head.appendChild(css);
  const trocarTextos = () => document.querySelectorAll("[data-tema-rotulo]").forEach((el) => (el.textContent = T.rotulo));

  /* ---------- partículas: neve, ovinhos ou corações (bem de leve) ----------
     Caem por trás dos textos e botões, e mais pelas laterais: na abertura, entre o cookie e o texto;
     no resto da página, por trás dos cartões. */
  function particulas() {
    if (reduz || !T.particula) return;
    const neve = T.particula === "neve";
    const CORES = { neve: ["#ffffff"], ovo: ["#f6c5d0", "#bfe3d9", "#f7e3af", "#d8c8f0"], coracao: ["#ff8fa3", "#e9a9b2", "#ffd1dc"] }[T.particula];
    const camadas = [];
    function camada(tela, medidor, visivel) {
      const ctx = tela.getContext("2d");
      const c = { tela, ctx, W: 0, H: 0, dpr: 1, lista: [], visivel };
      c.medir = () => {
        const [w, h] = medidor();
        c.dpr = Math.min(2, devicePixelRatio || 1); c.W = w; c.H = h;
        tela.width = w * c.dpr; tela.height = h * c.dpr;
        const n = Math.round(Math.min(neve ? 60 : 22, w / (neve ? 18 : 44)));
        c.lista = Array.from({ length: n }, () => nova(c, true));
      };
      camadas.push(c);
      return c;
    }
    function nova(c, qualquer) {
      /* 85% nas laterais (até 24% da largura de cada lado), o resto espalhado e mais apagado */
      const lado = Math.random() < 0.85;
      const x = lado ? (Math.random() < 0.5 ? Math.random() * c.W * 0.24 : c.W - Math.random() * c.W * 0.24) : Math.random() * c.W;
      return {
        x, y: qualquer ? Math.random() * c.H : -20,
        r: neve ? 0.8 + Math.random() * 2.2 : 4 + Math.random() * 4,
        v: neve ? 0.25 + Math.random() * 0.7 : 0.25 + Math.random() * 0.45,
        fase: Math.random() * 6.28, giro: (Math.random() - 0.5) * 0.02, ang: Math.random() * 6.28,
        cor: CORES[Math.floor(Math.random() * CORES.length)],
        a: (neve ? 0.35 + Math.random() * 0.45 : 0.35 + Math.random() * 0.3) * (lado ? 1 : 0.55)
      };
    }
    function coracao(ctx, r) {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.35);
      ctx.bezierCurveTo(-r * 1.1, -r * 0.45, -r * 0.45, -r * 1.15, 0, -r * 0.45);
      ctx.bezierCurveTo(r * 0.45, -r * 1.15, r * 1.1, -r * 0.45, 0, r * 0.35);
      ctx.fill();
    }
    /* na abertura: logo acima do cookie e abaixo do texto */
    const palco = document.getElementById("palco"), telaCookie = document.getElementById("tela");
    if (palco && telaCookie) {
      const t = document.createElement("canvas");
      t.className = "tema-particulas no-palco";
      t.setAttribute("aria-hidden", "true");
      telaCookie.after(t);
      camada(t, () => [palco.clientWidth, palco.clientHeight], () => palco.getBoundingClientRect().bottom > 0);
    }
    /* no resto da página: por trás dos cartões */
    const fundo = document.createElement("canvas");
    fundo.className = "tema-particulas no-fundo";
    fundo.setAttribute("aria-hidden", "true");
    document.body.prepend(fundo);
    camada(fundo, () => [innerWidth, innerHeight], () => true);
    const medirTudo = () => camadas.forEach((c) => c.medir());
    medirTudo();
    addEventListener("resize", medirTudo);
    let ultimo = 0;
    function passo(t) {
      requestAnimationFrame(passo);
      if (document.hidden || t - ultimo < 30) return;
      ultimo = t;
      for (const c of camadas) {
        if (!c.visivel()) continue;
        const ctx = c.ctx;
        ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
        ctx.clearRect(0, 0, c.W, c.H);
        for (const p of c.lista) {
          p.y += p.v; p.fase += 0.012; p.ang += p.giro;
          const x = p.x + Math.sin(p.fase) * 14;
          if (p.y > c.H + 20) Object.assign(p, nova(c, false));
          ctx.globalAlpha = p.a;
          ctx.fillStyle = p.cor;
          ctx.save();
          ctx.translate(x, p.y);
          ctx.rotate(p.ang);
          if (neve) { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); }
          else if (T.particula === "ovo") { ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.78, p.r, 0, 0, 6.283); ctx.fill(); }
          else coracao(ctx, p.r);
          ctx.restore();
        }
      }
    }
    requestAnimationFrame(passo);
  }

  /* ---------- Natal: o sininho e o carrilhão (som gerado aqui, sem arquivo) ---------- */
  let audio = null, mestre = null, somLigado = false;
  function abrirAudio() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
      mestre = audio.createGain();
      mestre.gain.value = 0.5;
      const comp = audio.createDynamicsCompressor();
      const sala = audio.createConvolver();
      const n = Math.floor(audio.sampleRate * 2.2), buf = audio.createBuffer(2, n, audio.sampleRate);
      for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.4); }
      sala.buffer = buf;
      const molhado = audio.createGain();
      molhado.gain.value = 0.32;
      mestre.connect(comp); mestre.connect(sala); sala.connect(molhado); molhado.connect(comp); comp.connect(audio.destination);
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }
  /* uma nota de glockenspiel: as parciais de uma barra de metal, com ataque curto */
  function glock(freq, vol, atraso = 0) {
    if (!audio) return;
    const t = audio.currentTime + atraso;
    [[1, 1, 1.7], [2.76, 0.3, 0.55], [5.4, 0.11, 0.26], [8.93, 0.045, 0.13]].forEach(([m, a, d]) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine";
      o.frequency.value = freq * m;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * a, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(mestre);
      o.start(t); o.stop(t + d + 0.05);
    });
  }
  function tocarSino() {
    if (!abrirAudio()) return;
    for (let i = 0; i < 11; i++) glock(2300 + Math.random() * 2000, 0.011, i * 0.032 + Math.random() * 0.02);
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => glock(f, 0.045, 0.06 + i * 0.12));
  }
  /* ao descer a página, uma nota por vez da escala pentatônica, bem baixinho */
  const ESCALA = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 1760, 1568, 1318.5, 1174.7];
  let nota = 0, andou = 0, ultimoY = scrollY, ultimaNota = 0;
  addEventListener("scroll", () => {
    const dy = Math.abs(scrollY - ultimoY);
    ultimoY = scrollY;
    if (!somLigado || !audio) return;
    andou += dy;
    const agora = performance.now();
    if (andou > 170 && agora - ultimaNota > 140) {
      andou = 0; ultimaNota = agora;
      glock(ESCALA[nota++ % ESCALA.length], 0.026);
    }
  }, { passive: true });

  function sininho() {
    if (!T.som) return;
    const caixa = document.createElement("div");
    caixa.className = "sino-caixa";
    caixa.innerHTML = `<button class="sino" type="button" aria-label="Tocar o sino de Natal">
      <svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="ouro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9b8"/><stop offset=".55" stop-color="#e6b35a"/><stop offset="1" stop-color="#a8702a"/></linearGradient></defs>
      <path d="M24 6c-1.6 0-2.8 1.2-2.8 2.8v1.1C14.6 11.3 11 17 11 23.5v7.6l-3.2 4.1c-.6.8 0 2 1 2h30.4c1 0 1.6-1.2 1-2L37 31.1v-7.6c0-6.5-3.6-12.2-10.2-13.6V8.8C26.8 7.2 25.6 6 24 6Z" fill="url(#ouro)"/>
      <circle cx="24" cy="40.5" r="3.6" fill="#e6b35a"/><path d="M15 33h18" stroke="#a8702a" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>
      <path d="M17 8.5c2.5 2.2 5 2.2 7 0 2 2.2 4.5 2.2 7 0" fill="none" stroke="#d63a3a" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="8.5" r="2.4" fill="#d63a3a"/>
      </svg></button>
      <span class="sino-balao" id="sinoBalao">Toque o sino</span>
      <button class="sino-som" id="sinoSom" type="button" hidden>Som de Natal ligado · desligar</button>`;
    document.body.appendChild(caixa);
    const sino = caixa.querySelector(".sino"), balao = caixa.querySelector("#sinoBalao"), som = caixa.querySelector("#sinoSom");
    setTimeout(() => balao.classList.add("some"), 7000);
    setTimeout(() => (balao.hidden = true), 7500);
    sino.addEventListener("click", () => {
      sino.classList.remove("toca"); void sino.offsetWidth; sino.classList.add("toca");
      tocarSino();
      somLigado = true;
      balao.hidden = true;
      som.hidden = false;
      clearTimeout(sininho._t);
      sininho._t = setTimeout(() => (som.hidden = true), 4000);
    });
    som.addEventListener("click", () => { somLigado = false; som.hidden = true; });
  }

  const comecar = () => { trocarTextos(); particulas(); sininho(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", comecar);
  else comecar();
})();
