/* Projetiva — cena 3D das três camadas.

   As três camadas do logo viram janelas de foto. O scroll desce por elas
   (uma por licença: LP, LI, LO), o fundo acompanha com a cor de cada camada
   e o mouse inclina a cena e abre uma segunda foto dentro de cada janela.

   Regras: nada muda de uma vez (tudo amortecido e independente da taxa de
   quadros), pixelRatio limitado, e qualquer falha devolve a versão parada. */

import * as THREE from 'three';

const raiz = document.documentElement;

/* geometria das camadas, na mesma medida do SVG da página (600 × 532,4) */
const K = 0.01;
const ESPESSURA = 140 * K;
const CANTO = 16 * K;
const CONJUNTO = { w: 600 * K, h: 532.4 * K, cy: 266.2 };
const CAMADAS = [
  { w: 380, h: 208.4, d: 68.4, cy: 108.2, z: 0.45, a: 'img/mata.webp', b: 'img/vila.webp', foco: [0.5, 0.5] },
  { w: 490, h: 228.2, d: 88.2, cy: 256.3, z: 0, a: 'img/campo-114.webp', b: 'img/campo-109.webp', foco: [0.48, 0.52] },
  { w: 592, h: 246.6, d: 106.6, cy: 405.1, z: -0.45, a: 'img/costa-farol.webp', b: 'img/fortaleza.webp', foco: [0.48, 0.42] },
];

const FOV = 35;
const CAM_Z = 10;
const TAN = Math.tan((FOV * Math.PI) / 360);

/* cores do fundo: topo, LP, LI, LO */
const COR_TOPO = [244, 247, 243];
const COR_ETAPA = [[220, 239, 223], [11, 90, 35], [10, 17, 70]];

const mistura = (a, b, t) => a + (b - a) * t;
const limita = (v, a, b) => Math.min(b, Math.max(a, v));
const degrau = (a, b, v) => { const t = limita((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const VERTICE = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENTO = /* glsl */ `
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform vec2 uTam;
  uniform float uT;
  uniform float uD;
  uniform float uR;
  uniform float uPropA;
  uniform float uPropB;
  uniform vec2 uFoco;
  uniform vec2 uMouse;
  uniform float uRaio;
  uniform vec2 uVel;
  uniform vec2 uPar;
  uniform float uTempo;
  uniform float uOpacidade;
  varying vec2 vUv;

  float acaso(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(acaso(i), acaso(i + vec2(1.0, 0.0)), f.x),
               mix(acaso(i + vec2(0.0, 1.0)), acaso(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  /* encaixa a foto na janela sem deformar */
  vec2 cobrir(vec2 uv, float propJanela, float propFoto, float foco) {
    vec2 s = propJanela > propFoto ? vec2(1.0, propFoto / propJanela) : vec2(propJanela / propFoto, 1.0);
    return (uv - 0.5) * s + vec2(0.5, foco);
  }
  vec3 amostra(sampler2D t, vec2 uv, vec2 des) {
    return vec3(texture2D(t, uv + des).r, texture2D(t, uv).g, texture2D(t, uv - des).b);
  }

  void main() {
    /* forma da camada: faixa em V com cantos arredondados */
    vec2 p = (vUv - 0.5) * uTam;
    float meiaL = uTam.x * 0.5;
    float topo = uTam.y * 0.5 - uD * (1.0 - abs(p.x) / meiaL);
    float meio = topo - uT * 0.5;
    vec2 q = vec2(abs(p.x) - (meiaL - uR), abs(p.y - meio) - (uT * 0.5 - uR));
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uR;
    float aa = max(fwidth(sd), 0.0005) * 1.1;
    float mascara = 1.0 - smoothstep(-aa, aa, sd);
    if (mascara < 0.004) discard;

    /* mancha viva em volta do mouse: dentro dela aparece a segunda foto */
    float ligada = step(0.002, uRaio);
    float d = distance(p, uMouse);
    float n = ruido(p * 2.4 + uTempo * 0.35) - 0.5;
    float borda = uRaio * (1.0 + n * 0.55);
    float dentro = (1.0 - smoothstep(borda - 0.10, borda + 0.03, d)) * ligada;
    vec2 dir = (p - uMouse) / max(d, 0.0001);
    float onda = smoothstep(borda + 0.45, borda, d) * (1.0 - dentro) * ligada;

    float prop = uTam.x / uTam.y;
    vec2 uv = (vUv - 0.5) * 0.93 + 0.5 + uPar * 0.022;
    vec2 des = uVel * 0.25;
    vec3 a = amostra(uA, cobrir(uv - dir * onda * 0.018, prop, uPropA, uFoco.x), des);
    vec3 b = amostra(uB, cobrir((uv - 0.5) * (1.0 - 0.06 * dentro) + 0.5, prop, uPropB, uFoco.y), des * 1.6);
    vec3 cor = mix(a, b, dentro);
    cor += 0.10 * smoothstep(0.05, 0.0, abs(d - borda)) * ligada;
    cor += 0.06 * smoothstep(-0.05, 0.0, sd);

    gl_FragColor = vec4(cor, mascara * uOpacidade);
    #include <colorspace_fragment>
  }
`;

const VERTICE_POEIRA = /* glsl */ `
  uniform float uTempo;
  uniform float uEscala;
  attribute float aTam;
  attribute float aFase;
  void main() {
    vec3 p = position;
    p.y += sin(uTempo * 0.25 + aFase) * 0.25;
    p.x += cos(uTempo * 0.2 + aFase * 1.7) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aTam * uEscala / -mv.z;
  }
`;
const FRAGMENTO_POEIRA = /* glsl */ `
  uniform vec3 uCor;
  uniform float uOpacidade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(uCor, smoothstep(0.5, 0.0, d) * uOpacidade);
    #include <colorspace_fragment>
  }
`;

function falhar(motivo) {
  console.warn('[Projetiva] cena 3D desligada, fica a versão parada:', motivo);
  raiz.classList.remove('com-3d', 'cena-pronta');
  window.dispatchEvent(new Event('projetiva:cena-falhou'));
}

async function iniciar() {
  const tela = document.getElementById('cena');
  const fundo = document.querySelector('.fundo');
  const arteTopo = document.getElementById('arte-hero');
  const jornada = document.getElementById('licencas');
  const palco = document.getElementById('palco');
  const janela = document.getElementById('janela-palco');
  const solido = document.querySelector('.solido');
  const topo = document.querySelector('.topo');
  const etapas = Array.from(document.querySelectorAll('.etapa'));
  const passos = Array.from(document.querySelectorAll('.palco__passos li'));

  const toqueGrosso = window.matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas: tela, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, toqueGrosso ? 1.5 : 2));

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);

  /* fotos */
  const carregador = new THREE.TextureLoader();
  const anis = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const carregar = async (url) => {
    const t = await carregador.loadAsync(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anis;
    return t;
  };
  const fotos = await Promise.all(CAMADAS.flatMap((c) => [carregar(c.a), carregar(c.b)]));
  if (!raiz.classList.contains('com-3d')) { renderer.dispose(); return; }

  const camadas = CAMADAS.map((c, j) => {
    const A = fotos[j * 2], B = fotos[j * 2 + 1];
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTICE,
      fragmentShader: FRAGMENTO,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uA: { value: A }, uB: { value: B },
        uTam: { value: new THREE.Vector2(c.w * K, c.h * K) },
        uT: { value: ESPESSURA }, uD: { value: c.d * K }, uR: { value: CANTO },
        uPropA: { value: A.image.width / A.image.height },
        uPropB: { value: B.image.width / B.image.height },
        uFoco: { value: new THREE.Vector2(c.foco[0], c.foco[1]) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uRaio: { value: 0 },
        uVel: { value: new THREE.Vector2(0, 0) },
        uPar: { value: new THREE.Vector2(0, 0) },
        uTempo: { value: 0 },
        uOpacidade: { value: 0 },
      },
    });
    const malha = new THREE.Mesh(new THREE.PlaneGeometry(c.w * K, c.h * K), material);
    cena.add(malha);
    return { ...c, malha, u: material.uniforms, W: c.w * K, H: c.h * K, D: c.d * K };
  });

  /* poeira de fundo: dá profundidade quando a câmera se move */
  const QTD = toqueGrosso ? 70 : 130;
  const pos = new Float32Array(QTD * 3), tam = new Float32Array(QTD), fase = new Float32Array(QTD);
  for (let i = 0; i < QTD; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 1] = 4 - Math.random() * 20;
    pos[i * 3 + 2] = -6 + Math.random() * 9;
    tam[i] = 0.06 + Math.random() * 0.1;
    fase[i] = Math.random() * 6.283;
  }
  const geoPoeira = new THREE.BufferGeometry();
  geoPoeira.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geoPoeira.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
  geoPoeira.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
  const matPoeira = new THREE.ShaderMaterial({
    vertexShader: VERTICE_POEIRA, fragmentShader: FRAGMENTO_POEIRA,
    transparent: true, depthWrite: false,
    uniforms: { uTempo: { value: 0 }, uEscala: { value: 1 }, uCor: { value: new THREE.Color('#0A7A2B') }, uOpacidade: { value: 0.2 } },
  });
  const poeira = new THREE.Points(geoPoeira, matPoeira);
  poeira.frustumCulled = false;
  poeira.renderOrder = -1;
  cena.add(poeira);
  const corPoeiraClara = new THREE.Color('#0A7A2B');
  const corPoeiraEscura = new THREE.Color('#BFE8C8');

  /* tamanho */
  let vw = 1, vh = 1;
  function medir() {
    vw = window.innerWidth; vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    matPoeira.uniforms.uEscala.value = renderer.domElement.height / (2 * TAN);
  }
  medir();
  window.addEventListener('resize', medir);

  /* ponteiro */
  const pont = { x: 0, y: 0, px: -9999, py: -9999, ultimo: -1e9, toque: false };
  function mover(e) {
    pont.px = e.clientX; pont.py = e.clientY;
    pont.x = (e.clientX / vw) * 2 - 1;
    pont.y = -((e.clientY / vh) * 2 - 1);
    pont.ultimo = performance.now();
    pont.toque = e.pointerType !== 'mouse';
  }
  window.addEventListener('pointermove', mover, { passive: true });
  window.addEventListener('pointerdown', mover, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pont.ultimo = -1e9; });

  tela.addEventListener('webglcontextlost', (e) => { e.preventDefault(); parado = true; falhar('contexto WebGL perdido'); });

  /* estado amortecido */
  let b = 0, c = 0, mx = 0, my = 0, vx = 0, vy = 0;
  let antX = 0, antY = 0, corFundo = '', escuro = false, passoAtivo = 0;
  let parado = false, primeiro = true, inicio = 0, antes = 0;
  const manchas = camadas.map(() => ({ x: 0, y: 0, raio: 0 }));
  const raioV = new THREE.Vector3(), dirV = new THREE.Vector3();

  function dentroDe(r, folga) {
    return pont.px >= r.left - folga && pont.px <= r.right + folga && pont.py >= r.top - folga && pont.py <= r.bottom + folga;
  }

  function quadro(agora) {
    if (parado || !raiz.classList.contains('com-3d')) return;
    requestAnimationFrame(quadro);
    if (primeiro) { inicio = agora; antes = agora; }
    const dt = Math.min(0.05, (agora - antes) / 1000);
    antes = agora;
    const t = (agora - inicio) / 1000;
    const am = (e) => 1 - Math.pow(1 - e, dt * 60);

    /* medidas vivas da página */
    const topoH = topo.offsetHeight;
    const rSolido = solido.getBoundingClientRect();
    if (rSolido.top <= topoH + 1 && !primeiro) return; /* a cena está toda coberta: não gasta bateria */

    const rArte = arteTopo.getBoundingClientRect();
    const rJan = janela.getBoundingClientRect();
    const rJor = jornada.getBoundingClientRect();
    const palcoH = vh - topoH;
    const jorTopo0 = rJor.top + window.scrollY;
    const bAlvo = limita(1 - (rJor.top - topoH) / Math.max(1, jorTopo0 - topoH), 0, 1);
    const p = limita((topoH - rJor.top) / Math.max(1, rJor.height - palcoH), 0, 1);
    const s = p * 3;
    const cAlvo = Math.min(2, Math.floor(s) + degrau(0.62, 1, s - Math.floor(s)));
    if (primeiro) { b = bAlvo; c = cAlvo; }
    b += (bAlvo - b) * am(0.1);
    c += (cAlvo - c) * am(0.085);
    const bS = degrau(0, 1, b);

    /* mouse: no celular, sem dedo na tela, a cena balança sozinha */
    const idade = agora - pont.ultimo;
    const ativo = pont.toque ? idade < 2600 : idade < 1e8;
    const alvoX = ativo ? pont.x : Math.sin(t * 0.32) * 0.3;
    const alvoY = ativo ? pont.y : Math.cos(t * 0.27) * 0.2;
    mx += (alvoX - mx) * am(0.07);
    my += (alvoY - my) * am(0.07);
    const dvx = limita((mx - antX) / Math.max(dt * 60, 0.001), -0.08, 0.08);
    const dvy = limita((my - antY) / Math.max(dt * 60, 0.001), -0.08, 0.08);
    antX = mx; antY = my;
    vx += (dvx - vx) * am(0.12);
    vy += (dvy - vy) * am(0.12);

    camera.position.set(mx * 0.5, my * 0.34, CAM_Z);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const upp = (2 * CAM_Z * TAN) / vh; /* unidades do mundo por pixel, no plano z = 0 */
    /* o mesmo, em qualquer profundidade: assim cada camada cai no ponto exato da tela,
       sem a perspectiva puxar as de trás para o centro */
    const uppEm = (z) => (2 * (CAM_Z - z) * TAN) / vh;

    /* onde o conjunto fica no topo (igual ao logo), em pixels a partir do centro da tela */
    const escT = Math.min((rArte.width * upp) / CONJUNTO.w, (rArte.height * upp) / CONJUNTO.h);
    const sxT = rArte.left + rArte.width / 2 - vw / 2;
    const syT = rArte.top + rArte.height / 2 - vh / 2;

    /* onde fica a camada em foco na descida */
    const sxJ = rJan.left + rJan.width / 2 - vw / 2;
    const syJ = rJan.top + rJan.height * (0.36 + 0.07 * c) - vh / 2;
    const naArte = ativo && dentroDe(bS < 0.5 ? rArte : rJan, 48);

    camadas.forEach((cam, j) => {
      const r = j - c;
      const u = cam.u;

      /* pose no topo */
      const tz = cam.z * escT;
      const uT = uppEm(tz);
      const tx = sxT * uT;
      const ty = -(syT + ((cam.cy - CONJUNTO.cy) * K * escT) / upp) * uT;

      /* pose na descida */
      const escJ = Math.min((rJan.width * upp) / cam.W, ((0.52 + 0.06 * c) * rJan.height * upp) / cam.H);
      const alturaPx = (cam.H * escJ) / upp;
      let jz = 0, dyPx = 0, jrx = 0, jop = 1;
      if (r >= 0) {
        /* esperando: encaixada logo abaixo e atrás da camada em foco, como no logo */
        jz = -2.6 * r;
        dyPx = r * 0.62 * alturaPx * (CAM_Z / (CAM_Z - jz));
        jrx = -0.2 * r;
        jop = 1 - 0.2 * r;
      } else {
        /* já passou: sobe e vem na direção da câmera até sumir */
        const f = -r;
        jz = Math.min(9, 9 * f);
        dyPx = -f * 1.3 * alturaPx;
        jrx = 0.5 * f;
        jop = 1 - degrau(0.05, 0.55, f);
      }
      const uJ = uppEm(jz);
      const jx = sxJ * uJ;
      const jy = -(syJ + dyPx) * uJ;

      const escala = mistura(escT, escJ, bS);
      const boia = Math.sin(t * 0.6 + j * 1.7) * 0.035 * escala;
      cam.malha.position.set(mistura(tx, jx, bS), mistura(ty, jy, bS) + boia, mistura(tz, jz, bS));
      cam.malha.scale.setScalar(escala);
      cam.malha.rotation.set(mistura(0, jrx, bS) - my * 0.13, mx * 0.2, 0);
      const opacidade = mistura(1, jop, bS);
      u.uOpacidade.value = opacidade;
      cam.malha.visible = opacidade > 0.004;

      /* mancha: segue o mouse quando ele está sobre a arte; senão passeia sozinha */
      const foco = mistura(1, 1 - degrau(0.15, 0.6, Math.abs(r)), bS);
      const m = manchas[j];
      let ax, ay, ar;
      if (naArte) {
        raioV.set(pont.x, pont.y, 0.5).unproject(camera);
        dirV.copy(raioV).sub(camera.position).normalize();
        const k = (cam.malha.position.z - camera.position.z) / dirV.z;
        ax = (camera.position.x + dirV.x * k - cam.malha.position.x) / escala;
        ay = (camera.position.y + dirV.y * k - cam.malha.position.y) / escala;
        ar = ESPESSURA * 0.46 * foco;
      } else {
        ax = Math.cos(t * 0.45 + j * 2.1) * 0.3 * cam.W;
        const meio = cam.H / 2 - cam.D * (1 - Math.abs(ax) / (cam.W / 2)) - ESPESSURA / 2;
        ay = meio + Math.sin(t * 0.62 + j * 1.3) * 0.16 * ESPESSURA;
        ar = ESPESSURA * 0.34 * foco;
      }
      m.x += (ax - m.x) * am(0.11);
      m.y += (ay - m.y) * am(0.11);
      m.raio += (ar - m.raio) * am(0.07);
      u.uMouse.value.set(m.x, m.y);
      u.uRaio.value = m.raio;
      u.uVel.value.set(vx, vy);
      u.uPar.value.set(mx, my);
      u.uTempo.value = t;
    });

    /* fundo: papel → verde claro (LP) → verde (LI) → marinho (LO) */
    const i0 = Math.min(1, Math.floor(c));
    const fr = degrau(0.2, 0.8, c - i0);
    const peso = degrau(0.3, 1, b);
    const cor = COR_TOPO.map((v, i) => Math.round(mistura(v, mistura(COR_ETAPA[i0][i], COR_ETAPA[i0 + 1][i], fr), peso)));
    const texto = 'rgb(' + cor.join(',') + ')';
    if (texto !== corFundo) { corFundo = texto; fundo.style.backgroundColor = texto; }
    const agoraEscuro = c > 0.5;
    if (agoraEscuro !== escuro) { escuro = agoraEscuro; palco.classList.toggle('escuro', escuro); }
    matPoeira.uniforms.uCor.value.copy(corPoeiraClara).lerp(corPoeiraEscura, degrau(0.3, 0.7, c));
    matPoeira.uniforms.uTempo.value = t;
    poeira.position.y = window.scrollY * upp * 0.35;

    /* textos das etapas e marcador */
    etapas.forEach((el, j) => {
      const r = j - c;
      const o = 1 - degrau(0.12, 0.42, Math.abs(r));
      el.style.opacity = o.toFixed(3);
      el.style.transform = 'translate3d(0,' + (r * 56).toFixed(1) + 'px,0)';
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    });
    const ativoAgora = Math.round(c);
    if (ativoAgora !== passoAtivo) {
      passoAtivo = ativoAgora;
      passos.forEach((li, j) => li.classList.toggle('ativo', j === passoAtivo));
    }

    renderer.render(cena, camera);
    if (primeiro) { primeiro = false; raiz.classList.add('cena-pronta'); }
  }
  requestAnimationFrame(quadro);
}

if (raiz.classList.contains('com-3d')) {
  iniciar().catch(falhar);
}
