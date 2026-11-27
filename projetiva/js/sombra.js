/* Projetiva — sombra de folhas.

   Uma sombra de copa de árvore passa bem de leve por cima das seções claras, como
   luz atravessando a mata. É um desenho feito por conta (ruído), sem imagem.
   Roda em meia resolução e a 30 quadros por segundo, só enquanto as seções claras
   estão na tela. Com "reduzir movimento", fica parada. */

(function () {
  'use strict';

  const tela = document.getElementById('sombra');
  const marco = document.querySelector('.solido');
  if (!tela || !marco) return;
  const gl = tela.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return;
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VERT = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }';
  const FRAG = `
  precision mediump float;
  uniform vec2 uRes;
  uniform float uT, uRolo;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * n(p); p = p * 2.03 + vec2(11.3, 7.1); a *= 0.5; }
    return s;
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes.y;
    uv.y += uRolo;
    vec2 balanco = 0.07 * vec2(sin(uT * 0.35 + uv.y * 2.0), cos(uT * 0.27 + uv.x * 1.7));
    vec2 p = uv * 2.3 + balanco;
    float copa = fbm(p + vec2(0.0, uT * 0.012));
    float folhas = fbm(p * 4.6 + copa * 1.6 + balanco * 3.0);
    float s = smoothstep(0.50, 0.66, copa * 0.60 + folhas * 0.46) * 0.14;
    gl_FragColor = vec4(vec3(0.03, 0.10, 0.05) * s, s);
  }`;

  function compila(tipo, fonte) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const v = compila(gl.VERTEX_SHADER, VERT), f = compila(gl.FRAGMENT_SHADER, FRAG);
  if (!v || !f) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uT = gl.getUniformLocation(prog, 'uT');
  const uRolo = gl.getUniformLocation(prog, 'uRolo');

  function medir() {
    tela.width = Math.max(2, Math.round(window.innerWidth * 0.5));
    tela.height = Math.max(2, Math.round(window.innerHeight * 0.5));
    gl.viewport(0, 0, tela.width, tela.height);
  }
  medir();
  window.addEventListener('resize', medir);

  function desenha(t) {
    gl.uniform2f(uRes, tela.width, tela.height);
    gl.uniform1f(uT, t);
    gl.uniform1f(uRolo, (window.scrollY / window.innerHeight) * 0.3);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let ultimo = 0, viva = false;
  function quadro(agora) {
    requestAnimationFrame(quadro);
    const naTela = marco.getBoundingClientRect().top < window.innerHeight * 0.7;
    if (naTela !== viva) { viva = naTela; tela.classList.toggle('viva', viva); }
    if (!viva || agora - ultimo < 33) return;
    ultimo = agora;
    desenha(quieto ? 12 : agora / 1000);
  }
  requestAnimationFrame(quadro);
})();
