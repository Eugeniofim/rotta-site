/* Um só laço de rolagem para os efeitos 3D. Quem pediu menos movimento no celular não vê nenhum. */
(function () {
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tarefas = new Set();
  let quadro = 0;
  const roda = () => { quadro = 0; tarefas.forEach((f) => f()); };
  const pede = () => { if (!quadro) quadro = requestAnimationFrame(roda); };
  addEventListener("scroll", pede, { passive: true });
  addEventListener("resize", pede);
  window.Rolagem = {
    reduz, pede,
    add(f) { if (!reduz) { tarefas.add(f); pede(); } },
    tira(f) { tarefas.delete(f); },
    limita: (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)),
    suave: (t) => t * t * (3 - 2 * t)
  };
})();
