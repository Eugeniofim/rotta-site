/* Projetiva — a cena das três camadas (WebGL 2 puro, sem biblioteca).

   No topo, as três camadas do logo são janelas para três fotos. Ao rolar, a primeira
   janela cresce até a mata ocupar a tela inteira ("entrar na mata pelo logo"). Depois
   cada licença (LP, LI, LO) chega como a camada seguinte, num corte em V que sobe.
   Por cima das fotos: névoa que se abre perto do mouse, feixes de luz e grão.
   O mouse desloca as camadas em profundidades diferentes e abre uma segunda foto.

   Nada muda de uma vez (tudo amortecido, independente da taxa de quadros).
   Qualquer falha devolve a versão parada da página. */

(function () {
  'use strict';

  const raiz = document.documentElement;
  if (!raiz.classList.contains('com-3d')) return;

  function falhar(motivo) {
    console.warn('[Projetiva] cena desligada, fica a versão parada:', motivo);
    raiz.classList.remove('com-3d', 'cena-pronta');
  }

  /* geometria das camadas, na medida do SVG da página (600 × 532,4) */
  const CONJ = { w: 600, h: 532.4 };
  const ESP = 140, CANTO = 16, INCL = 0.36;
  const CAMADAS = [
    { w: 380, y: 4, d: 68.4, par: 22, a: 'img/mata-g.webp', b: 'img/campo-morretes.webp', foco: [0.5, 0.56], nevoa: 1.0, tinta: [0.012, 0.055, 0.022] },
    { w: 490, y: 142.2, d: 88.2, par: 12, a: 'img/vila-g.webp', b: 'img/campo-114.webp', foco: [0.5, 0.48], inverte: 1, nevoa: 0.45, tinta: [0.010, 0.045, 0.018] },
    { w: 592, y: 281.8, d: 106.6, par: 5, a: 'img/costa-g.webp', b: 'img/fortaleza.webp', foco: [0.47, 0.42], nevoa: 0.6, tinta: [0.006, 0.012, 0.075] },
  ];

  const VERT = `#version 300 es
  in vec2 aPos;
  void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `#version 300 es
  precision highp float;
  out vec4 saida;

  uniform vec2 uRes;
  uniform sampler2D uA0, uA1, uA2, uB0, uB1, uB2;
  uniform vec4 uC[3];      /* centro x, y do entalhe, meia largura, espessura */
  uniform vec4 uQ[3];      /* moldura da foto: x, y, largura, altura */
  uniform vec3 uTinta[3];
  uniform float uPA[3];
  uniform float uPB[3];
  uniform vec2 uFoco[3];
  uniform float uNev[3];
  uniform float uInv[3];
  uniform float uR, uIncl;
  uniform vec2 uMouse, uVel, uPar;
  uniform float uRaio, uTempo, uAberto, uVertical;

  float acaso(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(acaso(i), acaso(i + vec2(1.0, 0.0)), f.x),
               mix(acaso(i + vec2(0.0, 1.0)), acaso(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * ruido(p); p = p * 2.03 + vec2(11.3, 7.1); a *= 0.5; }
    return s;
  }

  /* faixa em V com cantos arredondados; 1 dentro, 0 fora */
  float mascara(vec2 p, vec4 C) {
    float dx = abs(p.x - C.x);
    float topo = C.y - uIncl * dx;
    float meio = topo + C.w * 0.5;
    float r = min(uR, min(C.z, C.w * 0.5));
    vec2 q = vec2(dx - (C.z - r), abs(p.y - meio) - (C.w * 0.5 - r));
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    return 1.0 - smoothstep(-1.2, 1.2, sd);
  }

  vec2 cobrir(vec2 uv, float propQ, float propF, float foco) {
    vec2 s = propQ > propF ? vec2(1.0, propF / propQ) : vec2(propQ / propF, 1.0);
    return (uv - 0.5) * s + vec2(0.5, foco);
  }
  vec3 amostra(sampler2D t, vec2 uv, vec2 des) {
    return vec3(texture(t, uv + des).r, texture(t, uv).g, texture(t, uv - des).b);
  }

  vec3 camada(sampler2D A, sampler2D B, vec2 p, vec2 tela, vec4 Q, float pa, float pb, vec2 foco, vec3 tinta, float nev, float inv, float prof) {
    vec2 uv = (p - Q.xy) / Q.zw;
    uv = (uv - 0.5) * 0.94 + 0.5 + uPar * 0.014 * prof;
    uv.y = 1.0 - uv.y;
    float propQ = Q.z / Q.w;

    /* mancha viva em volta do mouse: dentro dela aparece a segunda foto */
    float ligada = step(0.5, uRaio);
    float d = distance(p, uMouse);
    float n = ruido(p / uRes.y * 9.0 + uTempo * 0.35) - 0.5;
    float borda = uRaio * (1.0 + n * 0.5);
    float dentro = (1.0 - smoothstep(borda * 0.86, borda * 1.03, d)) * ligada;
    vec2 dir = (p - uMouse) / max(d, 0.001);
    float onda = smoothstep(borda * 1.6, borda, d) * (1.0 - dentro) * ligada;

    vec2 des = uVel * 0.22;
    vec3 cor = amostra(A, cobrir(uv - vec2(dir.x, -dir.y) * onda * 0.014, propQ, pa, foco.x), des);
    /* "inv": no topo a camada mostra a segunda foto e guarda a primeira dentro da mancha */
    float k = inv * (1.0 - uAberto);
    float qual = mix(dentro, 1.0 - dentro, k);
    if (qual > 0.002) {
      vec3 b = amostra(B, cobrir((uv - 0.5) * (1.0 - 0.05 * dentro) + 0.5, propQ, pb, foco.y), des * 1.5);
      cor = mix(cor, b, qual);
    }

    /* névoa que anda devagar e se abre perto do mouse */
    float nv = fbm(vec2(tela.x * 2.2 + uTempo * 0.018, tela.y * 3.4 - uTempo * 0.012));
    nv = smoothstep(0.40, 0.86, nv);
    float limpa = 1.0 - exp(-pow(d / (uRes.y * 0.24), 2.0));
    float lado = mix(smoothstep(0.74, 0.04, tela.x), smoothstep(0.12, 0.62, tela.y), uVertical);
    cor = mix(cor, vec3(0.52, 0.63, 0.56), nv * nev * limpa * (0.16 + 0.26 * uAberto) * (1.0 - dentro) * (1.0 - 0.75 * lado * uAberto));

    /* feixes de luz entrando pela copa */
    float ang = tela.x * 1.3 - tela.y * 0.55;
    float feixe = pow(ruido(vec2(ang * 7.0, uTempo * 0.04)), 2.6) * smoothstep(1.0, 0.0, tela.y);
    cor += vec3(0.95, 0.88, 0.62) * feixe * 0.11 * nev * (0.4 + 0.6 * uAberto);

    /* escurece para o lado do texto, na cor da própria camada */
    cor = mix(cor, tinta, uAberto * (0.20 + 0.72 * lado));

    /* brilho fino na beira da mancha */
    cor += 0.09 * smoothstep(3.0, 0.0, abs(d - borda)) * ligada * (1.0 - uAberto * 0.5);
    return cor;
  }

  void main() {
    vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    vec2 tela = p / uRes;

    float m0 = mascara(p, uC[0]);
    float m1 = mascara(p, uC[1]);
    float m2 = mascara(p, uC[2]);
    float v2 = m2;
    float v1 = m1 * (1.0 - m2);
    float v0 = m0 * (1.0 - m1) * (1.0 - m2);
    float alfa = v0 + v1 + v2;
    if (alfa < 0.003) { saida = vec4(0.0); return; }

    vec3 cor = vec3(0.0);
    if (v0 > 0.002) cor += v0 * camada(uA0, uB0, p, tela, uQ[0], uPA[0], uPB[0], uFoco[0], uTinta[0], uNev[0], uInv[0], 1.0);
    if (v1 > 0.002) cor += v1 * camada(uA1, uB1, p, tela, uQ[1], uPA[1], uPB[1], uFoco[1], uTinta[1], uNev[1], uInv[1], 0.6);
    if (v2 > 0.002) cor += v2 * camada(uA2, uB2, p, tela, uQ[2], uPA[2], uPB[2], uFoco[2], uTinta[2], uNev[2], uInv[2], 0.3);
    cor /= alfa;

    /* grão de filme */
    cor += (acaso(p + fract(uTempo) * 91.7) - 0.5) * 0.035;
    cor = max(cor, 0.0);

    /* linear para sRGB */
    vec3 srgb = mix(cor * 12.92, 1.055 * pow(cor, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, cor));
    saida = vec4(srgb * alfa, alfa);
  }`;

  const tela = document.getElementById('cena');
  const gl = tela.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
  if (!gl) { falhar('sem WebGL 2'); return; }

  function compila(tipo, fonte) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compila(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compila(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { falhar(e.message); return; }
  gl.useProgram(prog);

  /* um triângulo que cobre a tela */
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uRes', 'uC', 'uQ', 'uTinta', 'uPA', 'uPB', 'uFoco', 'uNev', 'uInv', 'uR', 'uIncl', 'uMouse', 'uVel', 'uPar', 'uRaio', 'uTempo', 'uAberto', 'uVertical',
    'uA0', 'uA1', 'uA2', 'uB0', 'uB1', 'uB2'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  /* fotos: enviadas como sRGB para a conta de luz ser feita em linear */
  const anis = gl.getExtension('EXT_texture_filter_anisotropic');
  function foto(url, unidade) {
    return new Promise((ok, erro) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unidade);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (anis) gl.texParameterf(gl.TEXTURE_2D, anis.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(anis.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        ok(img.naturalWidth / img.naturalHeight);
      };
      img.onerror = () => erro(new Error('foto não carregou: ' + url));
      img.src = url;
    });
  }

  const limita = (v, a, b) => Math.min(b, Math.max(a, v));
  const mistura = (a, b, t) => a + (b - a) * t;
  const degrau = (a, b, v) => { const t = limita((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const arte = document.getElementById('arte-hero');
  const jornada = document.getElementById('licencas');
  const primeiraSolida = document.querySelector('.solido > section');
  const etapas = Array.from(document.querySelectorAll('.etapa'));
  const passos = Array.from(document.querySelectorAll('.palco__passos li'));
  const toqueGrosso = window.matchMedia('(pointer: coarse)').matches;

  let vw = 1, vh = 1, dpr = 1;
  function medir() {
    vw = window.innerWidth; vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, toqueGrosso ? 1.5 : 1.75);
    tela.width = Math.round(vw * dpr);
    tela.height = Math.round(vh * dpr);
    gl.viewport(0, 0, tela.width, tela.height);
  }

  const pont = { px: -9999, py: -9999, x: 0, y: 0, ultimo: -1e9, toque: false };
  function mover(e) {
    pont.px = e.clientX; pont.py = e.clientY;
    pont.x = (e.clientX / vw) * 2 - 1;
    pont.y = (e.clientY / vh) * 2 - 1;
    pont.ultimo = performance.now();
    pont.toque = e.pointerType !== 'mouse';
  }

  let parado = false;
  tela.addEventListener('webglcontextlost', (e) => { e.preventDefault(); parado = true; falhar('contexto WebGL perdido'); });

  Promise.all(CAMADAS.flatMap((c, j) => [foto(c.a, j), foto(c.b, j + 3)])).then((props) => {
    if (!raiz.classList.contains('com-3d')) return;

    gl.uniform1i(U.uA0, 0); gl.uniform1i(U.uA1, 1); gl.uniform1i(U.uA2, 2);
    gl.uniform1i(U.uB0, 3); gl.uniform1i(U.uB1, 4); gl.uniform1i(U.uB2, 5);
    gl.uniform1fv(U.uPA, [props[0], props[2], props[4]]);
    gl.uniform1fv(U.uPB, [props[1], props[3], props[5]]);
    gl.uniform2fv(U.uFoco, CAMADAS.flatMap((c) => c.foco));
    gl.uniform1fv(U.uNev, CAMADAS.map((c) => c.nevoa));
    gl.uniform1fv(U.uInv, CAMADAS.map((c) => c.inverte || 0));
    gl.uniform3fv(U.uTinta, CAMADAS.flatMap((c) => c.tinta));
    gl.uniform1f(U.uIncl, INCL);

    medir();
    window.addEventListener('resize', medir);
    window.addEventListener('pointermove', mover, { passive: true });
    window.addEventListener('pointerdown', mover, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { pont.ultimo = -1e9; });

    let b = 0, c = 0, mx = 0, my = 0, vx = 0, vy = 0, antX = 0, antY = 0;
    let manchaX = vw * 0.7, manchaY = vh * 0.45, manchaR = 0;
    let primeiro = true, inicio = 0, antes = 0, passoAtivo = 0;
    const C = new Float32Array(12), Q = new Float32Array(12);

    function quadro(agora) {
      if (parado || !raiz.classList.contains('com-3d')) return;
      requestAnimationFrame(quadro);
      if (primeiro) { inicio = agora; antes = agora; }
      const dt = Math.min(0.05, (agora - antes) / 1000);
      antes = agora;
      const t = (agora - inicio) / 1000;
      const am = (e) => 1 - Math.pow(1 - e, dt * 60);

      /* a cena some atrás das seções seguintes: aí não gasta bateria */
      if (!primeiro && primeiraSolida.getBoundingClientRect().top <= -80) return;

      const rArte = arte.getBoundingClientRect();
      const rJor = jornada.getBoundingClientRect();
      const jorTopo0 = rJor.top + window.scrollY;
      const bAlvo = limita(1 - rJor.top / Math.max(1, jorTopo0), 0, 1);
      const p = limita(-rJor.top / Math.max(1, rJor.height - vh), 0, 1);
      const s = p * 3;
      const cAlvo = Math.min(2, Math.floor(s) + degrau(0.6, 1, s - Math.floor(s)));
      if (primeiro) { b = bAlvo; c = cAlvo; }
      b += (bAlvo - b) * am(0.1);
      c += (cAlvo - c) * am(0.085);
      const bS = degrau(0, 1, b);
      const sai = degrau(0, 0.72, b);                 /* as camadas 2 e 3 descem antes */
      const sobe = Math.min(0, rJor.bottom - vh);     /* no fim, a cena sobe junto com a página */

      /* mouse; no celular, sem dedo na tela, a cena balança sozinha */
      const idade = agora - pont.ultimo;
      const ativo = pont.toque ? idade < 2600 : idade < 1e8;
      const alvoX = ativo ? pont.x : Math.sin(t * 0.32) * 0.35;
      const alvoY = ativo ? pont.y : Math.cos(t * 0.27) * 0.25;
      mx += (alvoX - mx) * am(0.07);
      my += (alvoY - my) * am(0.07);
      const dvx = limita((mx - antX) / Math.max(dt * 60, 0.001), -0.08, 0.08);
      const dvy = limita((my - antY) / Math.max(dt * 60, 0.001), -0.08, 0.08);
      antX = mx; antY = my;
      vx += (dvx - vx) * am(0.12);
      vy += (dvy - vy) * am(0.12);

      /* topo: o conjunto ocupa o lugar reservado na página */
      const e = Math.min(rArte.width / CONJ.w, rArte.height / CONJ.h);
      const ox = rArte.left + rArte.width / 2 - (CONJ.w / 2) * e;
      const oy = rArte.top + rArte.height / 2 - (CONJ.h / 2) * e;
      const escondido = vh + INCL * vw * 0.5 + 90;

      CAMADAS.forEach((cam, j) => {
        const f = j === 0 ? bS : sai;
        const solto = 1 - bS;
        /* topo */
        const hx = ox + 300 * e + mx * cam.par * solto;
        const hy = oy + (cam.y + cam.d) * e + my * cam.par * 0.7 * solto;
        const hw = (cam.w / 2) * e, ht = ESP * e;
        /* tela cheia */
        const abre = j === 0 ? 1 : limita(c - (j - 1), 0, 1);
        const sy = mistura(escondido, -90, abre) + sobe;
        const cx = mistura(hx, vw / 2, bS), cy = mistura(hy, sy, f);
        const cw = mistura(hw, vw * 1.7, bS), ct = mistura(ht, vh * 4, bS);
        C[j * 4] = cx * dpr;
        C[j * 4 + 1] = cy * dpr;
        C[j * 4 + 2] = cw * dpr;
        C[j * 4 + 3] = ct * dpr;
        /* moldura da foto: a caixa da camada, recortada pela tela; em tela cheia vira a tela inteira */
        const x0 = mistura(Math.max(0, cx - cw), 0, bS);
        const x1 = mistura(Math.min(vw, cx + cw), vw, bS);
        const y0 = mistura(Math.max(sobe, cy - INCL * cw), sobe, bS);
        const y1 = mistura(Math.min(vh + sobe, cy + ct), vh + sobe, bS);
        Q[j * 4] = x0 * dpr;
        Q[j * 4 + 1] = y0 * dpr;
        Q[j * 4 + 2] = Math.max(1, x1 - x0) * dpr;
        Q[j * 4 + 3] = Math.max(1, y1 - y0) * dpr;
      });

      /* mancha: segue o mouse sobre a arte; senão passeia sozinha */
      const noTopo = bS < 0.5;
      const sobreArte = ativo && (noTopo
        ? pont.px > rArte.left - 40 && pont.px < rArte.right + 40 && pont.py > rArte.top - 40 && pont.py < rArte.bottom + 40
        : true);
      let ax, ay, ar;
      if (sobreArte) {
        ax = pont.px; ay = pont.py;
        ar = noTopo ? ESP * e * 0.46 : Math.min(vw, vh) * 0.17;
      } else if (noTopo) {
        ax = rArte.left + rArte.width * (0.5 + 0.26 * Math.cos(t * 0.4));
        ay = rArte.top + rArte.height * (0.48 + 0.3 * Math.sin(t * 0.27));
        ar = ESP * e * 0.36;
      } else {
        const lado = vw < 900;
        ax = vw * (lado ? 0.5 + 0.22 * Math.cos(t * 0.33) : 0.7 + 0.14 * Math.cos(t * 0.33));
        ay = vh * (lado ? 0.26 + 0.08 * Math.sin(t * 0.41) : 0.48 + 0.2 * Math.sin(t * 0.41));
        ar = Math.min(vw, vh) * 0.13;
      }
      manchaX += (ax - manchaX) * am(0.1);
      manchaY += (ay - manchaY) * am(0.1);
      manchaR += (ar - manchaR) * am(0.06);

      gl.uniform2f(U.uRes, tela.width, tela.height);
      gl.uniform4fv(U.uC, C);
      gl.uniform4fv(U.uQ, Q);
      gl.uniform1f(U.uR, mistura(CANTO * e, 0, bS) * dpr);
      gl.uniform2f(U.uMouse, manchaX * dpr, manchaY * dpr);
      gl.uniform1f(U.uRaio, manchaR * dpr);
      gl.uniform2f(U.uVel, vx, vy);
      gl.uniform2f(U.uPar, mx, my);
      gl.uniform1f(U.uTempo, t);
      gl.uniform1f(U.uAberto, bS);
      gl.uniform1f(U.uVertical, vw < 900 ? 1 : 0);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      /* textos das etapas e marcador */
      etapas.forEach((el, j) => {
        const r = j - c;
        const o = (1 - degrau(0.12, 0.42, Math.abs(r))) * degrau(0.55, 0.95, b);
        el.style.opacity = o.toFixed(3);
        el.style.transform = 'translate3d(0,' + (r * 56).toFixed(1) + 'px,0)';
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
      const ativoAgora = Math.round(c);
      if (ativoAgora !== passoAtivo) {
        passoAtivo = ativoAgora;
        passos.forEach((li, j) => li.classList.toggle('ativo', j === passoAtivo));
      }

      if (primeiro) { primeiro = false; raiz.classList.add('cena-pronta'); }
    }
    requestAnimationFrame(quadro);
  }).catch((e) => falhar(e.message));
})();
