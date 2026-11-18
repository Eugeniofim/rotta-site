/* O Clube da Fada de verdade: liga o app à sala 'fadamarinha' (Supabase do estúdio) e ao carteiro (função 'fada'),
   que é quem conversa com a loja dela na Nuvemshop.

   Desligado (o padrão), o app é a demonstração de sempre, com tudo guardado só neste aparelho.
     ?nuvem=1  liga o Clube de verdade neste aparelho (fica guardado)
     ?nuvem=0  volta à demonstração
   Para ligar para todo mundo: ligado: true.

   Quem decide ponto é o banco. Este arquivo só pede (entrar, estado, ganhar, trocar, caixa) e espelha
   a resposta no motor de pontos do app (comum/pontos.js), que desenha as telas como antes. */
(function () {
  const CFG = {
    url: 'https://uopfqlogjzuqpabptxkb.supabase.co',
    chave: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',   // pública por desenho: quem protege é a sala
    sala: 'fadamarinha',
    ligado: false,
    loja: 'https://fadamarinha.com',
  };
  const FN = CFG.url + '/functions/v1/fada';
  const K = { modo: 'fada_modo', tok: 'fada_token', cache: 'fada_nuvem_v1', convite: 'fada_convite' };
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const gravar = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };

  const q = new URLSearchParams(location.search);
  let mudou = false;
  if (q.has('nuvem') || q.has('convite')) {
    if (q.has('nuvem')) { const novo = q.get('nuvem') === '1' ? 'nuvem' : 'demo'; mudou = ler(K.modo) !== novo; gravar(K.modo, novo); }
    if (q.get('convite')) gravar(K.convite, q.get('convite').slice(0, 12));
    try { const u = new URL(location.href); u.searchParams.delete('nuvem'); u.searchParams.delete('convite'); history.replaceState(null, '', u.toString()); } catch (e) {}
  }
  const modo = ler(K.modo);
  const ativo = modo === 'nuvem' || (CFG.ligado && modo !== 'demo');
  if (!ativo) {
    // voltou para a demonstração: apaga o espelho do Clube de verdade deste aparelho
    if (mudou) { gravar(K.cache, null); try { Pontos.espelhar(M, null); Rec.sair(M); Est.mexe((s) => { s.cupons = []; }); } catch (e) {} }
    return;
  }

  async function rpc(nome, args) {
    const r = await fetch(`${CFG.url}/rest/v1/rpc/${nome}`, {
      method: 'POST',
      headers: { apikey: CFG.chave, 'Content-Type': 'application/json', 'Content-Profile': CFG.sala, 'Accept-Profile': CFG.sala },
      body: JSON.stringify(args || {}),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error('O Clube não respondeu agora. Tente de novo.');
    return d;
  }
  async function carteiro(rota, corpo) {
    const r = await fetch(FN + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo || {}) });
    return r.json().catch(() => ({ ok: false, erro: 'A loja não respondeu agora.' }));
  }
  const avisa = (t) => { if (typeof window.toast === 'function') window.toast(t); };

  let est = null;
  try { est = JSON.parse(ler(K.cache) || 'null'); } catch (e) { est = null; }

  function espelhaCupons(cs) {
    Est.mexe((s) => {
      s.cupons = (cs || []).filter((c) => ['pronto', 'gerando', 'separar'].includes(c.estado)).map((c) => ({
        id: c.codigo, premio: c.premio, t: c.nome, tipo: c.tipo === 'brinde' ? 'brinde' : 'cupom',
        valor: c.tipo === 'frete' ? 'frete' : (c.valor != null ? +c.valor : null),
        codigo: c.tipo === 'brinde' ? null : c.codigo, em: new Date(c.criado).toISOString(),
        validade: c.vence ? new Date(c.vence + 'T23:59:00-03:00').toISOString() : null, usado: false, nuvem: true,
      }));
    });
  }
  function aplica(e) {
    est = e; gravar(K.cache, JSON.stringify(e));
    if (e.regras) Object.keys(Pontos.REGRAS).forEach((k) => { if (e.regras[k] != null) Pontos.REGRAS[k] = +e.regras[k]; });
    if (Array.isArray(e.premios) && e.premios.length) {
      Pontos.CFG.fada.premios = e.premios.map((p) => ({ id: p.id, t: p.t, d: p.d, pts: +p.pts, tipo: p.tipo, valor: p.valor === 'frete' ? 'frete' : (p.valor != null ? +p.valor : null) }));
    }
    const m = e.membro;
    if (!m) { espelhaCupons([]); Rec.sair(M); Pontos.espelhar(M, null); return; }
    Rec.entrar(M, { nome: m.nome, email: m.email, wa: m.whats, membro: m.id });
    const feitos = { celular: m.whats, emailOk: m.aceitaEmail };
    (m.feitos || []).forEach((t) => { feitos[t] = true; });
    if (m.niver) feitos.nascimento = '2000-' + m.niver;
    espelhaCupons(e.cupons);
    Pontos.espelhar(M, {
      extrato: (e.extrato || []).map((x) => ({ t: x.t, pts: x.pts, em: new Date(x.em).toISOString() })),
      srv: { saldo: m.saldo, ganhos: m.ganhos }, feitos,
    });
  }
  async function sync() {
    const tok = ler(K.tok);
    const e = await rpc('estado', { p_token: tok || '' });
    if (tok && e && !e.membro) gravar(K.tok, null);   // chave deste celular não vale mais
    if (e) aplica(e);
    return e;
  }

  async function entrar(d) {
    const r = await rpc('entrar', { p_email: d.email || '', p_whats: d.whats || '', p_nome: d.nome || null, p_niver: d.niver || null,
      p_aceita: d.aceita !== false, p_convite: ler(K.convite) });
    if (!r || r.erro) throw new Error((r && r.erro) || 'Não deu para entrar agora.');
    if (r.precisaNome) throw new Error('Falta o seu nome.');
    gravar(K.tok, r.token); gravar(K.convite, null);
    await sync();
    return r;
  }
  /* o que o app tenta dar sozinho: no banco, só valem os avisos e o aniversário (o app já vem na entrada) */
  function ganhar(m, chave) {
    const tok = ler(K.tok);
    if (!tok) return 0;
    if (chave === 'avisos') {
      rpc('ganhar', { p_token: tok, p_tipo: 'avisos' })
        .then((r) => { if (r && r.ok) avisa('+' + Pontos.REGRAS.avisos + ' pontos · Ligou os avisos'); return sync(); }).catch(() => {});
    } else if (chave === 'aniversario') {
      const n = (Pontos.estado(M).feitos || {}).nascimento;
      if (n) rpc('guardar_aniversario', { p_token: tok, p_niver: String(n).slice(5, 10) })
        .then((r) => { if (r && r.ok) avisa('+' + Pontos.REGRAS.aniversario + ' pontos · Contou o aniversário'); return sync(); }).catch(() => {});
    }
    return 0;
  }
  async function trocar(premio) {
    const d = await carteiro('/trocar', { token: ler(K.tok) || '', premio });
    await sync().catch(() => {});
    return d;
  }
  /* a sacola vira pedido no caixa da loja. Precisa da loja ligada (produtos com o número da variação). */
  async function caixa(itens) {
    if (!est || !est.lojaLigada) return null;
    const vit = await rpc('vitrine', {}).catch(() => []);
    const porId = {}; (vit || []).forEach((p) => { porId[p.id] = p; });
    const lista = [];
    for (const i of itens) {
      const p = porId[String(i.nid || '')];
      const v = p && p.variantes && p.variantes[0];
      if (!v) return null;          // um item que a loja não conhece: termina no site
      lista.push({ variante: v.id, qtd: i.qtd });
    }
    const d = await carteiro('/caixa', { token: ler(K.tok) || '', itens: lista });
    return d && d.ok ? d.url : null;
  }
  async function sair() {
    const tok = ler(K.tok);
    if (tok) await rpc('sair', { p_token: tok }).catch(() => {});
    gravar(K.tok, null);
    aplica(Object.assign({}, est || {}, { membro: null, extrato: [], cupons: [] }));
    avisa('Você saiu deste celular. Seus pontos continuam guardados.');
  }

  window.PontosNuvem = {
    ativo: true, entrar, sync, ganhar, trocar, caixa, sair,
    membro: () => (est && est.membro) || null,
    lojaLigada: () => !!(est && est.lojaLigada),
    loja: CFG.loja,
  };

  // primeira vez no Clube de verdade: tira a conta e os pontos de exemplo da demonstração
  if (mudou || !est) { espelhaCupons([]); Rec.sair(M); Pontos.espelhar(M, null); }
  else aplica(est);
  sync().catch(() => {});
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync().catch(() => {}); });
})();
