/* App da Gliki Sô: "Baixar o app" (um toque no Android), o service worker e a versão nova.
   Vale para o site, o clube e o painel. Qualquer elemento com [data-instalar] vira o botão.
   Três caminhos, porque cada celular entrega um:
   - Android/Chrome: o próprio navegador instala com um toque;
   - iPhone: a Apple não deixa instalar sozinho, então mostramos os 3 toques, desenhados;
   - dentro do Instagram/Facebook: ali não instala, então abrimos no navegador do celular. */
(function () {
  const RAIZ = new URL("../", document.currentScript.src);
  const ua = navigator.userAgent;
  const noIphone = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const noAndroid = /Android/i.test(ua);
  const dentroDeOutroApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Snapchat|Twitter/i.test(ua);
  const noPainel = location.pathname.includes("/painel/");
  const NOME = noPainel ? "o painel da Gliki" : "o app da Gliki Sô";
  const ICONE = new URL(noPainel ? "icones/apple-adm-180.png" : "icones/apple-180.png", RAIZ).href;
  const instalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  let pedido = null;
  const parametros = new URLSearchParams(location.search);
  let querInstalar = parametros.has("instalar");
  if (querInstalar) { parametros.delete("instalar"); history.replaceState(null, "", location.pathname + (parametros.toString() ? "?" + parametros : "") + location.hash); }

  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pedido = e;
    atualizarBotoes();
    if (querInstalar || folha.aberta) abrirFolha();
  });
  addEventListener("appinstalled", () => {
    pedido = null;
    fecharFolha();
    atualizarBotoes();
    avisar("Pronto, está na sua tela", `Procure o ícone da Gliki Sô no seu celular.`);
  });

  /* ---------- botões ---------- */
  function atualizarBotoes() {
    document.querySelectorAll("[data-instalar]").forEach((b) => {
      b.hidden = instalado();
      b.toggleAttribute("data-um-toque", !!pedido);
    });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-instalar]");
    if (!b) return;
    e.preventDefault();
    instalar();
  });

  async function instalar() {
    if (pedido) {
      const p = pedido;
      pedido = null;
      try { p.prompt(); await p.userChoice; } catch (e) {}
      atualizarBotoes();
      fecharFolha();
      return;
    }
    abrirFolha();
  }

  /* ---------- a folha que explica (quando o celular não deixa instalar com um toque) ---------- */
  const css = `
  .gk-fundo { position: fixed; inset: 0; z-index: 90; background: rgba(10,5,3,.62); opacity: 0; transition: opacity .25s; }
  .gk-folha { position: fixed; left: 0; right: 0; bottom: 0; z-index: 91; max-width: 480px; margin: 0 auto; max-height: 92vh; overflow: auto;
    background: #3a2419; color: #f3e6d3; border-radius: 28px 28px 0 0; padding: 12px 22px calc(24px + env(safe-area-inset-bottom));
    font: 400 16px/1.45 "Figtree", system-ui, sans-serif; transform: translateY(100%); transition: transform .32s cubic-bezier(.2,.8,.2,1); box-shadow: 0 -20px 60px rgba(0,0,0,.45); }
  .gk-aberta .gk-fundo { opacity: 1; } .gk-aberta .gk-folha { transform: none; }
  .gk-alca { width: 44px; height: 5px; border-radius: 3px; background: rgba(243,230,211,.25); margin: 0 auto 16px; }
  .gk-topo { display: flex; gap: 14px; align-items: center; margin-bottom: 14px; }
  .gk-topo img { width: 64px; height: 64px; border-radius: 16px; box-shadow: 0 6px 18px rgba(0,0,0,.4); }
  .gk-topo b { display: block; font: 400 26px/1.05 "Gloock", Georgia, serif; }
  .gk-topo small { color: #d9c7ae; font-size: 14px; }
  .gk-x { margin-left: auto; align-self: flex-start; width: 44px; height: 44px; border: 0; border-radius: 50%; background: rgba(243,230,211,.12); color: #f3e6d3; font-size: 22px; cursor: pointer; }
  .gk-txt { margin: 0 0 16px; color: #d9c7ae; }
  .gk-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 56px; border-radius: 999px; border: 0; cursor: pointer;
    font: 700 17px "Figtree", system-ui, sans-serif; text-decoration: none; margin-top: 10px; }
  .gk-led { background: #ffe9b8; color: #2a1913; box-shadow: 0 0 24px rgba(255,214,140,.45); }
  .gk-linha { background: transparent; color: #f3e6d3; border: 1.5px solid rgba(243,230,211,.35); }
  .gk-passos { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; counter-reset: p; }
  .gk-passos li { display: grid; grid-template-columns: 34px 1fr; gap: 12px; align-items: center; counter-increment: p; }
  .gk-passos li::before { content: counter(p); display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #ffe9b8; color: #2a1913; font: 600 16px "Oswald", sans-serif; }
  .gk-passos p { margin: 0 0 6px; font-weight: 600; }
  .gk-tela { background: #f4f1ee; color: #1c1c1e; border-radius: 14px; padding: 10px 12px; font: 500 14px -apple-system, system-ui, sans-serif; display: flex; align-items: center; gap: 10px; position: relative; }
  .gk-tela svg { width: 22px; height: 22px; flex: none; }
  .gk-tela .gk-luz { position: relative; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px; color: #0a84ff; }
  .gk-tela .gk-luz::after { content: ""; position: absolute; inset: -3px; border-radius: 12px; border: 3px solid #e0912f; animation: gkPulsa 1.4s ease-in-out infinite; }
  .gk-tela.gk-barra { justify-content: space-around; color: #0a84ff; }
  .gk-tela.gk-linhaMenu { justify-content: space-between; }
  .gk-tela.gk-linhaMenu.gk-alvo { outline: 3px solid #e0912f; outline-offset: 2px; animation: gkBrilha 1.4s ease-in-out infinite; }
  .gk-tela .gk-add { color: #0a84ff; font-weight: 700; padding: 4px 8px; border-radius: 8px; outline: 3px solid #e0912f; animation: gkBrilha 1.4s ease-in-out infinite; }
  .gk-tela img { width: 30px; height: 30px; border-radius: 7px; }
  @keyframes gkPulsa { 0%,100% { opacity: .35; transform: scale(.94); } 50% { opacity: 1; transform: scale(1.06); } }
  @keyframes gkBrilha { 0%,100% { outline-color: rgba(224,145,47,.45); } 50% { outline-color: #e0912f; } }
  .gk-nota { margin: 16px 0 0; font-size: 13px; color: #d9c7ae; }
  .gk-qr { width: 200px; margin: 6px auto 12px; padding: 12px; background: #fff; border-radius: 18px; }
  .gk-qr svg { width: 100%; height: auto; display: block; }
  .gk-aviso { position: fixed; left: 50%; top: 14px; transform: translateX(-50%); z-index: 95; width: calc(100% - 28px); max-width: 448px; padding: 14px 16px; border-radius: 18px;
    background: #f3e6d3; color: #2a1913; box-shadow: 0 12px 30px rgba(0,0,0,.45); font: 400 15px/1.4 "Figtree", system-ui, sans-serif; display: flex; gap: 12px; align-items: center; }
  .gk-aviso img { width: 40px; height: 40px; border-radius: 10px; }
  .gk-aviso b { display: block; }
  .gk-nova { position: fixed; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom)); transform: translate(-50%, 140%); z-index: 96; width: calc(100% - 28px); max-width: 448px;
    display: flex; gap: 10px; align-items: center; padding: 12px 12px 12px 16px; border-radius: 18px; background: #f3e6d3; color: #2a1913;
    box-shadow: 0 12px 30px rgba(0,0,0,.45); font: 400 14px/1.35 "Figtree", system-ui, sans-serif; transition: transform .3s cubic-bezier(.2,.8,.2,1); }
  .gk-nova.gk-on { transform: translate(-50%, 0); }
  .gk-nova b { display: block; font-size: 15px; }
  .gk-nova button { min-height: 44px; border: 0; border-radius: 999px; cursor: pointer; font: 700 15px "Figtree", system-ui, sans-serif; }
  .gk-nova .gk-at { padding: 0 16px; background: #2a1913; color: #ffe9b8; }
  .gk-nova .gk-fecha { width: 44px; background: transparent; color: #2a1913; font-size: 20px; }
  @media (prefers-reduced-motion: reduce) { .gk-folha, .gk-fundo, .gk-nova { transition: none; } .gk-tela * { animation: none !important; } }
  `;
  const estilo = document.createElement("style");
  estilo.textContent = css;
  document.head.appendChild(estilo);

  const folha = { aberta: false, raiz: null };
  const SVG = {
    compartilhar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    voltar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
    avancar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
    livro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z"/></svg>',
    abas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="7" width="12" height="12" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v10"/></svg>',
    mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    pontos: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    baixar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>'
  };

  function conteudo() {
    const topo = `<div class="gk-alca"></div><div class="gk-topo"><img src="${ICONE}" alt=""><div><b>${noPainel ? "Painel da Gliki" : "Gliki Sô"}</b><small>${noPainel ? "Para a equipe" : "Pontos, prêmios e pedidos"}</small></div><button class="gk-x" type="button" data-gk-fechar aria-label="Fechar">×</button></div>`;
    if (pedido) {
      return topo + `<p class="gk-txt">Instala em um toque, sem loja e sem ocupar espaço. O ícone vai para a tela do seu celular.</p>
        <button class="gk-btn gk-led" type="button" data-gk-instalar>${SVG.baixar}Instalar agora</button>`;
    }
    if (dentroDeOutroApp) {
      const destino = new URL(location.href);
      destino.searchParams.set("instalar", "1");
      const semEsquema = destino.host + destino.pathname + destino.search + destino.hash;
      const abrir = noAndroid
        ? `intent://${semEsquema}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(destino.href)};end`
        : `x-safari-https://${semEsquema}`;
      return topo + `<p class="gk-txt">Aqui dentro do Instagram o celular não deixa instalar apps. Toque abaixo e a página abre no navegador, já pronta para instalar.</p>
        <a class="gk-btn gk-led" href="${abrir}">Abrir no navegador</a>
        <button class="gk-btn gk-linha" type="button" data-gk-copiar="${destino.href}">Copiar o link</button>
        <p class="gk-nota">Se não abrir, toque nos <b>três pontinhos</b> no canto e escolha <b>“Abrir no navegador”</b>.</p>`;
    }
    if (noIphone) {
      return topo + `<p class="gk-txt">No iPhone são 3 toques. A Apple não deixa instalar de outro jeito.</p>
        <ol class="gk-passos">
          <li><div><p>Toque em Compartilhar</p><div class="gk-tela gk-barra">${SVG.voltar}${SVG.avancar}<span class="gk-luz">${SVG.compartilhar}</span>${SVG.livro}${SVG.abas}</div></div></li>
          <li><div><p>Escolha “Adicionar à Tela de Início”</p><div class="gk-tela gk-linhaMenu gk-alvo">Adicionar à Tela de Início${SVG.mais}</div></div></li>
          <li><div><p>Toque em “Adicionar”</p><div class="gk-tela" style="justify-content:space-between"><img src="${ICONE}" alt="">${noPainel ? "Gliki ADM" : "Gliki Sô"}<span class="gk-add">Adicionar</span></div></div></li>
        </ol>
        <p class="gk-nota">Não achou o Compartilhar? No Safari ele fica embaixo; no Chrome do iPhone, no canto de cima. Se a lista for longa, role até o fim.</p>`;
    }
    if (noAndroid) {
      return topo + `<p class="gk-txt">Seu navegador ainda não liberou o botão de um toque. Faça assim:</p>
        <ol class="gk-passos">
          <li><div><p>Toque nos três pontinhos do navegador</p><div class="gk-tela" style="justify-content:flex-end"><span class="gk-luz" style="color:#1c1c1e">${SVG.pontos}</span></div></div></li>
          <li><div><p>Escolha “Instalar app” ou “Adicionar à tela inicial”</p><div class="gk-tela gk-linhaMenu gk-alvo">Instalar app${SVG.baixar}</div></div></li>
          <li><div><p>Confirme em “Instalar”</p><div class="gk-tela" style="justify-content:space-between"><img src="${ICONE}" alt="">${noPainel ? "Gliki ADM" : "Gliki Sô"}<span class="gk-add">Instalar</span></div></div></li>
        </ol>`;
    }
    /* computador sem instalação: leva para o celular */
    const alvo = new URL(noPainel ? "painel/?instalar=1" : "?instalar=1", RAIZ).href;
    return topo + `<p class="gk-txt">Aponte a câmera do celular para o QR: a página abre lá, pronta para instalar.</p>
      <div class="gk-qr">${window.qrSVG ? window.qrSVG(alvo, 176) : ""}</div>
      <p class="gk-nota">No Chrome ou no Edge do computador, o botão de instalar também aparece na barra de endereço.</p>`;
  }

  function abrirFolha() {
    querInstalar = false;
    if (!folha.raiz) {
      folha.raiz = document.createElement("div");
      folha.raiz.innerHTML = '<div class="gk-fundo" data-gk-fechar></div><div class="gk-folha" role="dialog" aria-modal="true" aria-label="Baixar o app"></div>';
      document.body.appendChild(folha.raiz);
      folha.raiz.addEventListener("click", async (e) => {
        if (e.target.closest("[data-gk-fechar]")) return fecharFolha();
        if (e.target.closest("[data-gk-instalar]")) return instalar();
        const c = e.target.closest("[data-gk-copiar]");
        if (c) { try { await navigator.clipboard.writeText(c.dataset.gkCopiar); c.textContent = "Link copiado"; } catch (err) { c.textContent = c.dataset.gkCopiar; } }
      });
      addEventListener("keydown", (e) => { if (e.key === "Escape" && folha.aberta) fecharFolha(); });
    }
    folha.raiz.querySelector(".gk-folha").innerHTML = conteudo();
    folha.aberta = true;
    requestAnimationFrame(() => requestAnimationFrame(() => folha.raiz.classList.add("gk-aberta")));
    const b = folha.raiz.querySelector(".gk-btn, .gk-x");
    if (b) setTimeout(() => b.focus(), 320);
  }
  function fecharFolha() {
    if (!folha.raiz || !folha.aberta) return;
    folha.aberta = false;
    folha.raiz.classList.remove("gk-aberta");
  }

  function avisar(titulo, texto) {
    const a = document.createElement("div");
    a.className = "gk-aviso";
    a.setAttribute("role", "status");
    a.innerHTML = `<img src="${ICONE}" alt=""><div><b>${titulo}</b>${texto}</div>`;
    document.body.appendChild(a);
    setTimeout(() => a.remove(), 5000);
  }

  /* ---------- service worker: atualiza sozinho, sem atrapalhar ---------- */
  const VOLTOU = []; let voltouEm = 0;
  function aoVoltar(fn, minSeg) { VOLTOU.push({ fn, min: (minSeg || 0) * 1000, ultimo: 0 }); }
  function disparaVolta(forcado) {
    const agora = Date.now();
    if (!forcado && agora - voltouEm < 1500) return;
    voltouEm = agora;
    VOLTOU.forEach((v) => {
      if (!forcado && v.min && agora - v.ultimo < v.min) return;
      v.ultimo = agora;
      try { v.fn(); } catch (e) {}
    });
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) disparaVolta(); });
  addEventListener("focus", () => disparaVolta());
  addEventListener("pageshow", (e) => { if (e.persisted) disparaVolta(true); });
  addEventListener("online", () => disparaVolta(true));

  /* "a pessoa está no meio de algo?" — digitando, com uma janela aberta ou com a câmera ligada */
  function ocupada() {
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;
    return !!document.querySelector("dialog[open]") || folha.aberta;
  }

  let registroPronto = null, esperando = null, recarregando = false;
  const barra = document.createElement("div");
  barra.className = "gk-nova";
  barra.setAttribute("role", "status");
  barra.innerHTML = '<div style="flex:1;min-width:0"><b>Tem uma versão nova</b>Seus pontos ficam como estão.</div><button class="gk-at" type="button">Atualizar</button><button class="gk-fecha" type="button" aria-label="Agora não">×</button>';
  function aplicarNova() {
    if (recarregando) return;
    recarregando = true;
    barra.classList.remove("gk-on");
    try { if (esperando) esperando.postMessage({ tipo: "assumir" }); } catch (e) {}
    setTimeout(() => { try { location.reload(); } catch (e) {} }, 2000);
  }
  function chegouNova(w) {
    esperando = w;
    if (!ocupada()) return aplicarNova();
    if (!barra.isConnected) document.body.appendChild(barra);
    requestAnimationFrame(() => barra.classList.add("gk-on"));
  }
  barra.querySelector(".gk-at").addEventListener("click", aplicarNova);
  barra.querySelector(".gk-fecha").addEventListener("click", () => barra.classList.remove("gk-on"));

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    const jaTinhaControlador = !!navigator.serviceWorker.controller;
    registroPronto = navigator.serviceWorker.register(new URL("sw.js", RAIZ).href, { scope: RAIZ.pathname, updateViaCache: "none" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) chegouNova(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const novo = reg.installing;
          if (!novo) return;
          novo.addEventListener("statechange", () => {
            if (novo.state === "installed" && navigator.serviceWorker.controller) chegouNova(novo);
          });
        });
        const checar = () => reg.update().catch(() => {});
        aoVoltar(checar, 60);
        setInterval(checar, 30 * 60 * 1000);
        return reg;
      })
      .catch(() => null);
    let jaTrocou = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!jaTinhaControlador || jaTrocou) return;
      jaTrocou = true;
      try { location.reload(); } catch (e) {}
    });
  }

  window.GlikiApp = {
    instalar, instalado, aoVoltar,
    registro: () => registroPronto || Promise.resolve(null),
    podeUmToque: () => !!pedido
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { atualizarBotoes(); if (querInstalar && !instalado()) abrirFolha(); });
  else { atualizarBotoes(); if (querInstalar && !instalado()) abrirFolha(); }
})();
