/* ============================================================
   NUVEM — a sala "anirvana" no Supabase do estúdio Ti Artes
   Um banco, muitas janelas: cada registro do app é uma linha.
   Mexeu num aparelho, sobe em ~1 s; os outros recebem sozinhos.
   Sem internet: guarda numa fila e sobe quando voltar.
   ============================================================ */
const NUV = {url:'https://uopfqlogjzuqpabptxkb.supabase.co', chave:'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2', sala:'anirvana', topico:'anirvana-mudou'};
const NK = {sessao:'anirvana_sessao', sombra:'anirvana_sombra', fila:'anirvana_fila', marca:'anirvana_marca', emdia:'anirvana_emdia'};

/* como cada parte do estado vira linha no banco */
const COL_LOCAL = new Set(['v', 'seq', 'pinAdmin', 'vou']);                       /* fica só neste aparelho */
const COL_MAPA = new Set(['aulas', 'consent', 'pontosAcoes', 'codigos', 'avisos', 'caixa', 'atividades', 'fechados', 'turmaInstr', 'turmaAjuste']);
const COL_UNICO = new Set(['regras', 'config', 'feriados', 'cats']);
const COL_CONTEUDO = new Set(['presencas', 'backups', 'enviados', 'turmasFora', 'sessoes']);   /* listas sem id: a linha é o conteúdo */
const COL_NOVOS_NO_TOPO = new Set(['avisosLivres', 'eventos']);
/* o que cada papel grava (o banco confere de novo) */
const GRAVA = {instrutor:new Set(['aulas', 'presencas', 'subs', 'pagamentos']), aluno:new Set(['avisosPag', 'consent', 'pontosAcoes', 'trocas'])};

const lerJ = (k, pad) => { try { const t = localStorage.getItem(k); return t ? JSON.parse(t) : pad; } catch(e){ return pad; } };
const gravarJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
let SESSAO = lerJ(NK.sessao, null);
let SOMBRA = lerJ(NK.sombra, {});
let FILA = lerJ(NK.fila, {});
let MARCA = lerJ(NK.marca, null);
let EM_DIA = lerJ(NK.emdia, false);
const NUVEM = {estado:'', erro:'', enviando:false, puxando:false, puxarDeNovo:false, ultima:null, timer:null, orelha:null};
function gravarNuvem(){ gravarJ(NK.sombra, SOMBRA); gravarJ(NK.fila, FILA); gravarJ(NK.marca, MARCA); gravarJ(NK.emdia, EM_DIA); }

/* hash curto e estável para as listas sem id */
function hashTxt(s){ let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return 'h' + (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36); }
function modoCol(k, v){
  if (COL_MAPA.has(k)) return 'mapa';
  if (COL_UNICO.has(k)) return 'unico';
  if (COL_CONTEUDO.has(k)) return 'conteudo';
  if (Array.isArray(v)) return v.every(x => x && typeof x === 'object' && typeof x.id === 'string') ? 'lista' : 'conteudo';
  return 'unico';
}
/* o estado inteiro, como linhas: {colecao: {id: valor}} */
function linhasDe(St){
  const out = {};
  for (const [k, v] of Object.entries(St)){
    if (COL_LOCAL.has(k) || v === undefined) continue;
    const m = out[k] = {}, modo = modoCol(k, v);
    if (modo === 'lista') v.forEach(el => { m[el.id] = el; });
    else if (modo === 'conteudo') (Array.isArray(v) ? v : []).forEach(el => { m[hashTxt(JSON.stringify(el))] = el; });
    else if (modo === 'mapa') Object.entries(v || {}).forEach(([id, x]) => { if (x !== undefined) m[id] = x; });
    else m._ = v;
  }
  return out;
}
const podeGravar = c => !SESSAO ? false : (SESSAO.papel === 'dono' || SESSAO.papel === 'adm') ? true : (GRAVA[SESSAO.papel] || new Set()).has(c);
const papelPainel = p => p === 'dono' || p === 'adm' ? 'admin' : p;
const nuvemLigada = () => VALENDO && !!(SESSAO && SESSAO.token);

/* ---------- chamada ao banco (com prazo: uma chamada pendurada não trava o app) ---------- */
async function rpc(nome, corpo, prazo = 15000){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), prazo);
  try {
    const r = await fetch(`${NUV.url}/rest/v1/rpc/${nome}`, {method:'POST', signal:ctl.signal,
      headers:{apikey:NUV.chave, 'Content-Type':'application/json', 'Content-Profile':NUV.sala, 'Accept-Profile':NUV.sala}, body:JSON.stringify(corpo || {})});
    const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch(e){}
    if (!r.ok){ const msg = (j && j.message) || txt || ('HTTP ' + r.status); const e = new Error(msg); if (/sessao/.test(msg)) e.sessao = true; throw e; }
    return j;
  } finally { clearTimeout(t); }
}

/* ---------- mexeu no app: o que mudou vai para a fila ---------- */
function enfileirar(){
  if (!nuvemLigada() || !EM_DIA) return 0;
  const L = linhasDe(S); let n = 0; const base = Date.now() * 1000;
  for (const [c, m] of Object.entries(L)){
    if (!podeGravar(c)) continue;
    const sb = SOMBRA[c] = SOMBRA[c] || {};
    const ids = Object.keys(m), desc = COL_NOVOS_NO_TOPO.has(c);
    ids.forEach((id, pos) => {
      const j = JSON.stringify(m[id]);
      if (sb[id] !== j){ FILA[c + '\u0001' + id] = {c, i:id, d:m[id], o: base + (desc ? ids.length - pos : pos)}; sb[id] = j; n++; }
    });
    for (const id of Object.keys(sb)) if (!(id in m)){ FILA[c + '\u0001' + id] = {c, i:id, x:true}; delete sb[id]; n++; }
  }
  for (const c of Object.keys(SOMBRA)) if (!(c in L) && podeGravar(c) && !COL_LOCAL.has(c)){
    for (const id of Object.keys(SOMBRA[c])){ FILA[c + '\u0001' + id] = {c, i:id, x:true}; n++; }
    delete SOMBRA[c];
  }
  if (n) gravarNuvem();
  return n;
}
function nuvemMexeu(){
  if (!nuvemLigada() || !EM_DIA) return;
  if (enfileirar()){ estadoNuvem(navigator.onLine === false ? 'fora' : 'enviando'); clearTimeout(NUVEM.timer); NUVEM.timer = setTimeout(enviarFila, 700); }
}
async function enviarFila(){
  if (!nuvemLigada() || NUVEM.enviando) return;
  const itens = Object.values(FILA); if (!itens.length){ estadoNuvem('ok'); return; }
  NUVEM.enviando = true;
  try {
    for (let k = 0; k < itens.length; k += 300){
      const lote = itens.slice(k, k + 300);
      const r = await rpc('enviar', {p_token:SESSAO.token, p_itens:lote}, 30000);
      if (r && r.erro) throw new Error(r.erro);
      lote.forEach(it => { const kk = it.c + '\u0001' + it.i; if (FILA[kk] === it) delete FILA[kk]; });
      if (r && r.negados && r.negados.length) console.warn('o banco não aceitou', r.negados);
      gravarNuvem();
    }
    NUVEM.ultima = Date.now(); estadoNuvem(Object.keys(FILA).length ? 'enviando' : 'ok');
  } catch(e){
    if (e.sessao) return sessaoCaiu();
    estadoNuvem('fora', e.message);
  } finally { NUVEM.enviando = false; }
  if (Object.keys(FILA).length && NUVEM.estado !== 'fora') setTimeout(enviarFila, 1500);
}

/* ---------- puxar o que os outros mudaram ---------- */
function aplicarLinhas(linhas, primeira){
  if (!linhas.length) return 0;
  const porCol = {}; linhas.forEach(l => (porCol[l.c] = porCol[l.c] || []).push(l));
  let mudou = 0;
  for (const [c, ls] of Object.entries(porCol)){
    if (COL_LOCAL.has(c)) continue;
    const sb = SOMBRA[c] = SOMBRA[c] || {};
    const vivas = ls.filter(l => !FILA[c + '\u0001' + l.i]);        /* o que este aparelho ainda vai mandar vale mais */
    const muda = vivas.filter(l => l.x ? (l.i in sb) || primeira : sb[l.i] !== JSON.stringify(l.d));
    if (!muda.length) continue;
    const modo = modoCol(c, S[c] !== undefined ? S[c] : (muda.find(l => !l.x) || {}).d);
    if (modo === 'unico'){ const l = muda[muda.length - 1]; if (!l.x){ S[c] = l.d; sb._ = JSON.stringify(l.d); } mudou++; continue; }
    if (modo === 'mapa'){ const M = S[c] = (S[c] && typeof S[c] === 'object' && !Array.isArray(S[c])) ? S[c] : {}; muda.forEach(l => { if (l.x){ delete M[l.i]; delete sb[l.i]; } else { M[l.i] = l.d; sb[l.i] = JSON.stringify(l.d); } }); mudou += muda.length; continue; }
    const A = Array.isArray(S[c]) ? S[c] : (S[c] = []);
    const chave = modo === 'lista' ? (el => el && el.id) : (el => hashTxt(JSON.stringify(el)));
    const idx = new Map(); A.forEach((el, k) => idx.set(chave(el), k));
    const tirar = new Set();
    muda.forEach(l => {
      if (l.x){ if (idx.has(l.i)) tirar.add(idx.get(l.i)); delete sb[l.i]; return; }
      sb[l.i] = JSON.stringify(l.d);
      if (idx.has(l.i)) A[idx.get(l.i)] = l.d;
      else { if (COL_NOVOS_NO_TOPO.has(c) && !primeira) A.unshift(l.d); else A.push(l.d); idx.clear(); A.forEach((el, k) => idx.set(chave(el), k)); }
    });
    if (tirar.size){ const fica = A.filter((el, k) => !tirar.has(k)); A.splice(0, A.length, ...fica); }
    if (primeira){ const ord = {}; ls.forEach(l => { ord[l.i] = l.o; }); const sinal = COL_NOVOS_NO_TOPO.has(c) ? -1 : 1; A.sort((a, b) => sinal * ((ord[chave(a)] ?? 0) - (ord[chave(b)] ?? 0))); }
    mudou += muda.length;
  }
  return mudou;
}
async function puxar(){
  if (!nuvemLigada()) return 0;
  if (NUVEM.puxando){ NUVEM.puxarDeNovo = true; return 0; }
  NUVEM.puxando = true; let mudou = 0;
  const primeira = !EM_DIA;
  try {
    let desde = MARCA ? new Date(new Date(MARCA).getTime() - 15000).toISOString() : null, cc = null, ci = null, voltas = 0, r;
    const todas = [];
    do {
      r = await rpc('puxar', {p_token:SESSAO.token, p_desde:desde, p_cur_c:cc, p_cur_i:ci}, 30000);
      const ls = (r && r.linhas) || [];
      todas.push(...ls);
      const ult = ls[ls.length - 1];
      if (ult){ desde = ult.t; cc = ult.c; ci = ult.i; if (!MARCA || ult.t > MARCA) MARCA = ult.t; }
    } while (r && r.mais && ++voltas < 400);
    mudou = aplicarLinhas(todas, primeira);
    if (mudou){ religar(); try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch(e){} }
    gravarNuvem();
    if (NUVEM.estado === 'fora' || NUVEM.estado === '') estadoNuvem(Object.keys(FILA).length ? 'enviando' : 'ok');
    if (mudou && UI.role) redesenharSemPular();
  } catch(e){
    if (e.sessao){ NUVEM.puxando = false; sessaoCaiu(); return 0; }
    estadoNuvem('fora', e.message); throw e;
  } finally {
    NUVEM.puxando = false;
    if (NUVEM.puxarDeNovo){ NUVEM.puxarDeNovo = false; setTimeout(() => puxar().catch(() => {}), 300); }
  }
  return mudou;
}
let _puxarLogo = null;
const puxarLogo = () => { clearTimeout(_puxarLogo); _puxarLogo = setTimeout(() => puxar().catch(() => {}), 400); };
/* depois de receber dados: as listas de fábrica (atividades, equipe, fornecedores, categorias) se refazem */
function religar(){ try { ligarCats(); ligarAtividades(); ligarEquipe(); ligarFornecedores(); } catch(e){ console.warn(e); } }
/* não redesenha embaixo de quem está digitando numa janela */
function redesenharSemPular(){
  const ativo = document.activeElement, sheet = $('#sheet');
  if (sheet && sheet.classList.contains('on')){ NUVEM.redesenharAoFechar = true; return; }
  if (ativo && /INPUT|TEXTAREA|SELECT/.test(ativo.tagName) && $('#root').contains(ativo)){ NUVEM.redesenharAoFechar = true; return; }
  reRender();
}

/* ---------- abrir o app: buscar tudo, e só então começar a mandar ---------- */
async function sincronizarAoAbrir(){
  if (!nuvemLigada()) return;
  estadoNuvem(EM_DIA ? 'enviando' : 'buscando');
  for (let t = 0; t < 3; t++){
    try { await puxar(); break; }
    catch(e){ if (!nuvemLigada()) return; if (t === 2){ estadoNuvem('fora', e.message); if (!EM_DIA) return; } else await new Promise(r => setTimeout(r, 1500 * (t + 1))); }
  }
  if (!EM_DIA){
    EM_DIA = true; gravarNuvem();
    if (UI.role) reRender();
    if (SESSAO.papel === 'dono' || SESSAO.papel === 'adm') avisar('Tudo em dia com a nuvem', 'cloud');
  }
  nuvemMexeu(); enviarFila(); ligarOrelha();
}

/* ---------- ouvir o banco: cutucão em tempo real + conferida a cada 20 s ---------- */
function ligarOrelha(){
  if (!nuvemLigada() || NUVEM.orelha) return;
  let ws = null, hb = null, espera = 3000, viva = true;
  const abrir = () => {
    if (!viva || !nuvemLigada()) return;
    try { ws = new WebSocket(`${NUV.url.replace('https', 'wss')}/realtime/v1/websocket?apikey=${NUV.chave}&vsn=1.0.0`); } catch(e){ return setTimeout(abrir, espera); }
    ws.onopen = () => { espera = 3000; ws.send(JSON.stringify({topic:'realtime:' + NUV.topico, event:'phx_join', payload:{config:{broadcast:{self:false, ack:false}, presence:{key:''}, private:false}}, ref:'1'}));
      clearInterval(hb); hb = setInterval(() => { try { ws.send(JSON.stringify({topic:'phoenix', event:'heartbeat', payload:{}, ref:String(Date.now())})); } catch(e){} }, 25000); };
    ws.onmessage = e => { try { const m = JSON.parse(e.data); if (m.event === 'broadcast' && m.payload && m.payload.event === 'mudou') puxarLogo(); } catch(er){} };
    ws.onclose = () => { clearInterval(hb); if (viva) { setTimeout(abrir, espera); espera = Math.min(espera * 2, 60000); } };
  };
  abrir();
  const pulso = setInterval(() => { if (document.visibilityState === 'visible') puxar().catch(() => {}); }, 20000);
  NUVEM.orelha = {fechar:() => { viva = false; clearInterval(pulso); clearInterval(hb); try { ws && ws.close(); } catch(e){} NUVEM.orelha = null; }};
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !nuvemLigada()) return;
  /* virou o dia com o app aberto: recarrega para a data certa (os dados ficam) */
  if (iso(new Date()) !== HOJE_ISO && !Object.keys(FILA).length){ location.reload(); return; }
  puxar().catch(() => {}); enviarFila();
});
addEventListener('online', () => { if (nuvemLigada()){ enviarFila(); puxar().catch(() => {}); } });
addEventListener('offline', () => { if (nuvemLigada()) estadoNuvem('fora'); });

/* ---------- estado da nuvem (o pontinho no topo) ---------- */
function estadoNuvem(st, erro){
  NUVEM.estado = st; if (erro !== undefined) NUVEM.erro = erro;
  const el = document.getElementById('nuvemSt'); if (el){ el.outerHTML = chipNuvem(); }
}
function chipNuvem(){
  if (!nuvemLigada()) return '';
  const n = Object.keys(FILA).length, st = NUVEM.estado || 'ok';
  const [icon, txt, cls] = st === 'fora' ? ['cloud-off', n ? `${n} para subir` : 'Sem conexão', 'warn'] : st === 'buscando' ? ['cloud-download', 'Buscando…', ''] : st === 'enviando' || n ? ['cloud-upload', 'Salvando…', ''] : ['cloud', 'Salvo', 'ok'];
  return `<button class="nuvem-st ${cls}" id="nuvemSt" data-act="nuvemInfo" aria-label="Nuvem: ${txt}">${ic(icon, 'sm')}<span>${txt}</span></button>`;
}

/* ---------- entrar e sair ---------- */
const nomeAparelho = () => { const u = navigator.userAgent; const so = /iPhone|iPad/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Navegador'; return `${so} · ${new Date().toLocaleDateString('pt-BR')}`; };
async function entrarNaNuvem(papel, codigo, extra){
  let r;
  try { r = await rpc('entrar', {p_papel:papel, p_codigo:codigo, p_extra:extra || null, p_aparelho:nomeAparelho()}); }
  catch(e){ return {erro: navigator.onLine === false ? 'Sem internet. Conecte e tente de novo.' : 'Não consegui falar com o banco. Tente de novo em instantes.'}; }
  if (!r || r.erro) return r || {erro:'Não deu certo. Tente de novo.'};
  /* outra pessoa entrando neste aparelho: começa do zero (nada do anterior fica) */
  if (SESSAO && (SESSAO.papel !== r.papel || SESSAO.quem !== r.quem)) limparLocal();
  SESSAO = {token:r.token, papel:r.papel, quem:r.quem, nome:r.nome, alunos:r.alunos || null};
  gravarJ(NK.sessao, SESSAO);
  return r;
}
function limparLocal(){
  if (NUVEM.orelha) NUVEM.orelha.fechar();
  SOMBRA = {}; FILA = {}; MARCA = null; EM_DIA = false; gravarNuvem();
  S = semearVazio(); restaurarBases(); religar();
  try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch(e){}
}
async function sairDaNuvem(){
  const pend = Object.keys(FILA).length;
  if (pend){ try { await enviarFila(); } catch(e){} }
  if (SESSAO){ try { await rpc('sair', {p_token:SESSAO.token}, 6000); } catch(e){} }
  SESSAO = null; try { localStorage.removeItem(NK.sessao); } catch(e){}
  limparLocal();
}
function sessaoCaiu(){
  SESSAO = null; try { localStorage.removeItem(NK.sessao); } catch(e){}
  limparLocal(); fecharFolha(); UI.pilha = []; UI.role = null; history.replaceState(null, '', location.pathname); render();
  avisar('O acesso deste aparelho terminou. Entre de novo.', 'lock');
}
/* abriu o app com sessão: vai direto para o painel certo */
function abrirComSessao(){
  if (!nuvemLigada()) return false;
  const role = papelPainel(SESSAO.papel);
  UI.who[role] = SESSAO.quem;
  if (role === 'instrutor') UI.codigoOk[SESSAO.quem] = SESSAO.v;
  if (UI.role !== role){ UI.role = role; if (!NAV[role].some(n => n[0] === UI.tab[role])) UI.tab[role] = NAV[role][0][0]; }
  return true;
}
function folhaNuvem(){
  const n = Object.keys(FILA).length, quando = NUVEM.ultima ? new Date(NUVEM.ultima).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : null;
  const papel = {dono:'Dono', adm:'Administração', instrutor:'Instrutor', aluno:'Aluno'}[SESSAO.papel] || '';
  abrirFolha(`${folhaCab('Seus dados na nuvem', `${escapeH(SESSAO.nome || '')} · ${papel}`)}
  <div class="stack">
    <div class="li"><span class="ico-b">${ic(NUVEM.estado === 'fora' ? 'cloud-off' : 'cloud')}</span><div class="main-c"><span class="t">${NUVEM.estado === 'fora' ? 'Sem conexão agora' : n ? 'Subindo as últimas mudanças' : 'Tudo salvo na nuvem'}</span>
      <span class="s">${NUVEM.estado === 'fora' ? `Pode continuar usando. ${n ? `${n} ${n === 1 ? 'mudança espera' : 'mudanças esperam'} a internet voltar e sobem sozinhas.` : ''}` : `Celular e computador mostram a mesma coisa.${quando ? ' Última subida às ' + quando + '.' : ''}`}</span></div></div>
    <p class="small muted">Cada coisa que alguém lança aparece nos outros aparelhos em segundos. Não precisa apertar nada.</p>
    <div class="sheet-foot"><button class="btn sec" data-act="nuvemAgora">${ic('refresh-cw', 'sm')}Conferir agora</button><button class="btn ghost" data-act="sairAparelho">${ic('log-out', 'sm')}Sair deste aparelho</button></div>
  </div>`);
}
