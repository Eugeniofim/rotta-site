/* =====================================================
   MILLA VENDAS (12/11/2026) — o CRM de quem VENDE a Milla.
   Pedido do Eugênio: "um app de CRM com cliente morno, quente e frio, bem básico
   mas eficiente, com os vendedores (Betão, Tiago) e eu vendo tudo organizado".

   O Eugênio (admin) vê tudo. Cada vendedor entra com o próprio e-mail e vê só os
   clientes que trouxe e a parte dele. Sem banco, abre a demonstração com "ver como".
   Telas em telas.js e telas2.js; dados em dados.js; aqui, rota, porta e cliques.
   ===================================================== */
'use strict';

const S = { etapa: 'abertos', calor: '', vend: '', busca: '', mes: '', rotaAnterior: '', entrarMsg: '', primeiro: false, senhaNova: false, conferido: false };
const TELAS = ['inicio', 'leads', 'vendedores', 'meulink', 'comissoes'];
function rota() {
  const [tela, param] = location.hash.replace(/^#\/?/, '').split('/');
  return { tela: TELAS.includes(tela) ? tela : 'inicio', param: param ? decodeURIComponent(param) : '' };
}

/* ---------- a porta (só com banco) ---------- */
const LOGADO = () => typeof isLoggedIn === 'function' && isLoggedIn();
const caixaEntrar = (id, titulo, sub, corpo) => `<div class="entrar-fundo"><form class="entrar-caixa" id="${id}" aria-label="${esc(titulo)}">
    <div class="entrar-marca">${SIMBOLO('grande')}<span class="olho">Milla Vendas</span><h1>${esc(titulo)}</h1><div class="sm">${sub}</div></div>${corpo}</form><div class="entrar-pe">Milla · por studio Ti Artes</div></div>`;
function vEntrar() {
  return caixaEntrar('entrar-form', 'Entrar no CRM de vendas', 'Cada vendedor entra com o próprio e-mail e a própria senha.', `
    <label for="e-mail" class="sm b">E-mail</label><input id="e-mail" class="inp" type="email" autocomplete="username" required>
    <label for="e-senha" class="sm b">Senha</label><input id="e-senha" class="inp" type="password" autocomplete="current-password" required>
    <button type="submit" class="btn btn-navy btn-g">Entrar</button><div class="sm" id="entrar-msg" role="status" style="text-align:center">${esc(S.entrarMsg)}</div>
    <button type="button" class="btn btn-line btn-p" data-act="esqueci">Esqueci a senha</button>
    <button type="button" class="btn btn-line btn-p" data-act="primeiro">Primeiro acesso: criar a minha senha</button>`);
}
function vPrimeiro() {
  return caixaEntrar('primeiro-form', 'Primeiro acesso', 'Use o e-mail que o Eugênio pôs na lista e crie a sua senha. Ela é só sua: não mande para ninguém.', `
    <label for="p-mail" class="sm b">E-mail</label><input id="p-mail" class="inp" type="email" autocomplete="username" required>
    <label for="p-senha" class="sm b">Crie a senha (mínimo 8 caracteres)</label><input id="p-senha" class="inp" type="password" minlength="8" autocomplete="new-password" required>
    <label for="p-senha2" class="sm b">Repita a senha</label><input id="p-senha2" class="inp" type="password" minlength="8" autocomplete="new-password" required>
    <button type="submit" class="btn btn-navy btn-g">Criar o meu acesso</button><div class="sm" id="primeiro-msg" role="status" style="text-align:center"></div>
    <button type="button" class="btn btn-line btn-p" data-act="primeiro-volta">Já tenho senha: entrar</button>`);
}
function vSenhaNova() {
  return caixaEntrar('senha-form', 'Crie a sua senha nova', '', `
    <label for="s-nova" class="sm b">Senha nova (mínimo 8 caracteres)</label><input id="s-nova" class="inp" type="password" minlength="8" autocomplete="new-password" required>
    <button type="submit" class="btn btn-navy btn-g">Salvar e entrar</button><div class="sm" id="senha-msg" role="status" style="text-align:center"></div>`);
}
async function conferePapel() {
  if (conferePapel.indo) return; conferePapel.indo = true;
  try {
    await authEnsure();
    const x = await nuvemPapel();
    if (x.sair) { authSave(null); return; }
    DB.papel = x.papel; DB.vendedor = x.vendedor; S.conferido = true;
    if (DB.papel) await dbCarregar();
  } catch (e) { DB.erro = 'Sem conexão agora. Tentando de novo…'; setTimeout(render, 3000); }
  finally { conferePapel.indo = false; render(); }
}

/* ---------- desenhar ---------- */
function render() {
  const porta = S.senhaNova ? vSenhaNova() : (NUVEM() && !LOGADO() ? (S.primeiro ? vPrimeiro() : vEntrar()) : '');
  document.body.classList.toggle('entrar', !!porta);
  if (porta) { $('meio').innerHTML = porta; $('lado').innerHTML = ''; $('barra-cel').innerHTML = ''; document.title = 'Milla Vendas · entrar'; return; }
  if (NUVEM() && !S.conferido) { $('meio').innerHTML = '<div class="sm" style="padding:24px">Conferindo a conta…</div>'; conferePapel(); return; }
  if (NUVEM() && !DB.papel) {
    $('meio').innerHTML = `<div class="box"><b>Esta conta ainda não tem acesso ao CRM de vendas.</b><div class="sm">Você entrou como ${esc(authEmail() || '')}. Peça ao Eugênio para pôr este e-mail na lista de vendedores e entre de novo.</div><button type="button" class="btn btn-line btn-p" data-act="sair">Sair</button></div>`;
    $('lado').innerHTML = ''; $('barra-cel').innerHTML = ''; return;
  }
  let r = rota();
  if (r.tela === 'vendedores' && !EH_ADMIN()) r = { tela: 'meulink', param: '' };
  if (r.tela === 'meulink' && EH_ADMIN()) r = { tela: 'vendedores', param: '' };
  const chave = r.tela + '/' + r.param;
  if (chave !== S.rotaAnterior) {
    S.rotaAnterior = chave; window.scrollTo(0, 0);
    if (r.tela === 'leads' && r.param) {
      if (CALOR.some(c => c[0] === r.param)) { S.calor = r.param; S.etapa = 'abertos'; }
      else if (ETAPAS.some(e => e[0] === r.param)) { S.etapa = r.param; S.calor = ''; }
    }
  }
  const html = r.tela === 'leads' ? vLeads(S) : r.tela === 'vendedores' ? vVendedores() : r.tela === 'meulink' ? vMeuLink() : r.tela === 'comissoes' ? vComissoes(S) : vInicio();
  $('meio').innerHTML = (NUVEM() ? '' : '<div class="faixa-demo sm"><b>Demonstração</b> · dados inventados, só neste navegador. Troque em "ver como" para ver o que o Tiago ou o Betão enxergam.</div>') + html;
  renderLado(r.tela);
  document.title = 'Milla Vendas · ' + ({ inicio: 'Início', leads: 'Leads', vendedores: 'Vendedores', meulink: 'Meu link', comissoes: 'Comissões' }[r.tela]);
}
window.addEventListener('hashchange', render);

/* ---------- a ficha ---------- */
function abreFicha(l, ancora) {
  const m = $('modal'); m.innerHTML = vFicha(l); m.hidden = false; document.body.classList.add('com-modal');
  const alvo = ancora ? m.querySelector('#' + ancora) : m.querySelector('input[name="imobiliaria"]');
  if (alvo) { if (ancora) alvo.scrollIntoView({ block: 'start' }); else if (!l.id) alvo.focus(); }
}
function fechaFicha() { const m = $('modal'); m.hidden = true; m.innerHTML = ''; document.body.classList.remove('com-modal'); }
const anota = (l, t) => { l.historico = [...(l.historico || []), { em: new Date().toISOString(), t, por: EH_ADMIN() ? 'Eugênio' : nomeVendedor(meuVendedor()) }].slice(-40); };
async function salva(colecao, obj, ok) {
  try { await dbGrava(colecao, obj); if (ok) toast(ok); return true; }
  catch (e) { toast('Não consegui salvar: ' + (e.message || 'tente de novo')); return false; }
}
async function mudaLead(id, campo, valor) {
  const l = leadDe(id); if (!l || l[campo] === valor) return;
  const n = { ...l, [campo]: valor, atualizado: new Date().toISOString() };
  anota(n, campo === 'calor' ? 'Calor: ' + (CALOR.find(c => c[0] === valor) || [, valor])[1] : 'Etapa: ' + etapaNome(valor));
  if (await salva('lead', n, 'Salvo.')) {
    render();
    if (campo === 'etapa' && valor === 'fechou' && !n.venda && EH_ADMIN()) abreFicha(n, 'fechar');
  }
}

/* ---------- cliques ---------- */
document.addEventListener('click', async e => {
  if (e.target.id === 'modal') { fechaFicha(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'wa' && !NUVEM()) { e.preventDefault(); toast('Demonstração: no app de verdade, abre a conversa com o contato.'); return; }
  if (b.tagName === 'SELECT') return;
  if (act === 'novo') abreFicha({ calor: 'morno', etapa: 'novo', vendedor: meuVendedor() });
  else if (act === 'abrir') { const l = leadDe(id); if (l) abreFicha(l); }
  else if (act === 'fechar-modal') fechaFicha();
  else if (act === 'etapa') { S.etapa = b.dataset.v; render(); }
  else if (act === 'calor') { S.calor = S.calor === b.dataset.v ? '' : b.dataset.v; render(); }
  else if (act === 'mes') { S.mes = b.dataset.v; render(); }
  else if (act === 'copiar') { try { await navigator.clipboard.writeText(b.dataset.v); toast('Link copiado.'); } catch (_) { toast(b.dataset.v); } }
  else if (act === 'receber' || act === 'repassar') {
    const p = DB.pagamentos.find(x => x.id === id); if (!p || !EH_ADMIN()) return;
    const n = { ...p, [act === 'receber' ? 'recebido' : 'repassado']: hojeIso() };
    if (await salva('pagamento', n, act === 'receber' ? 'Pagamento marcado como recebido.' : 'Comissão marcada como repassada.')) { render(); const l = leadDe(p.lead); if (!$('modal').hidden && l) abreFicha(l); }
  } else if (act === 'renovar') {
    const l = leadDe(id); if (!l || !EH_ADMIN()) return;
    for (const p of parcelasDaRenovacao(l)) if (!(await salva('pagamento', p))) return;
    const n = { ...l }; anota(n, 'Renovou'); await salva('lead', n, 'Renovação lançada.'); render(); abreFicha(n);
  } else if (act === 'fechar-venda') {
    const l = leadDe(id), f = $('ficha-form'); if (!l || !f || !EH_ADMIN()) return;
    const plano = f.plano.value, P = PLANOS[plano], valor = Number(f.v_valor.value) || 0;
    const venda = { plano, implantacao: plano === 'semimpl' ? 0 : Number(f.v_implantacao.value) || 0, inicio: f.v_inicio.value || hojeIso(),
      ...(plano === 'anual' ? { ano: valor } : { mensal: valor, meses: P.meses }), ...(plano === 'semimpl' ? { depois: P.depois } : {}) };
    const n = { ...l, etapa: 'fechou', calor: 'quente', venda, proximo: '', passo: '', atualizado: new Date().toISOString() }; anota(n, 'Fechou: ' + P.nome);
    for (const p of parcelasDaVenda(n)) if (!(await salva('pagamento', p))) return;
    if (await salva('lead', n, 'Venda registrada e parcelas geradas.')) { render(); abreFicha(n, 'venda'); }
  } else if (act === 'demo-recomeca') { if (confirm('Voltar a demonstração para os exemplos do começo? O que você mudou nela some.')) { demoRecomeca(); fechaFicha(); render(); toast('Demonstração recomeçada.'); } }
  else if (act === 'sair') { await authSignOut(); S.conferido = false; DB.papel = ''; render(); }
  else if (act === 'primeiro') { S.primeiro = true; render(); }
  else if (act === 'primeiro-volta') { S.primeiro = false; render(); }
  else if (act === 'esqueci') {
    const email = ($('e-mail') || {}).value || ''; const msg = $('entrar-msg');
    if (!email.trim()) { msg.textContent = 'Escreva o seu e-mail acima e toque de novo.'; return; }
    const r = await authReset(email.trim()); msg.textContent = r.ok ? 'Mandei um link para o seu e-mail (de "Ti Arts", em inglês). Abra neste aparelho.' : (r.error || 'Não consegui mandar agora.');
  }
});
document.addEventListener('change', async e => {
  const el = e.target, act = el.dataset && el.dataset.act; if (!act) return;
  if (act === 'ver-como') { demoVerComo(el.value ? 'vendedor' : 'admin', el.value); S.vend = ''; S.rotaAnterior = ''; render(); toast(el.value ? 'Agora você vê como ' + nomeVendedor(el.value) + '.' : 'Agora você vê tudo.'); }
  else if (act === 'mudar-calor') mudaLead(el.dataset.id, 'calor', el.value);
  else if (act === 'mudar-etapa') mudaLead(el.dataset.id, 'etapa', el.value);
  else if (act === 'vend') { S.vend = el.value; render(); }
  else if (act === 'plano-escolhe') {
    const f = $('ficha-form'), P = PLANOS[el.value];
    f.v_implantacao.value = P.implantacao || 0; f.v_implantacao.disabled = el.value === 'semimpl'; f.v_valor.value = el.value === 'anual' ? P.ano : P.mensal;
  }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'busca') return;
  S.busca = e.target.value; clearTimeout(render.t);
  render.t = setTimeout(() => { render(); const b = $('busca'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } }, 220);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) fechaFicha(); });
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id === 'ficha-form') {
    e.preventDefault();
    const id = f.dataset.id, antes = id ? leadDe(id) : null, v = n => (f[n] ? f[n].value.trim() : '');
    if (!v('imobiliaria')) { toast('Escreva o nome da imobiliária.'); return; }
    const whats = v('whats');
    const repetido = whats && DB.leads.find(x => x.id !== id && mesmoWhats(x.whats, whats));
    if (repetido) { toast(EH_ADMIN() ? 'Esse WhatsApp já está em ' + repetido.imobiliaria + ' (' + nomeVendedor(repetido.vendedor) + ').' : 'Esse WhatsApp já está no CRM. Fale com o Eugênio.'); return; }
    const agora = new Date().toISOString();
    const n = { ...(antes || { id: novoId('l'), criado: agora, origem: 'manual', historico: [] }),
      imobiliaria: v('imobiliaria'), contato: v('contato'), cidade: v('cidade'), whats, email: v('email'),
      vendedor: EH_ADMIN() ? v('vendedor') : meuVendedor(), calor: v('calor'), etapa: v('etapa'), proximo: v('proximo'), passo: v('passo'), nota: v('nota'), atualizado: agora };
    if (!antes) anota(n, 'Entrou no CRM'); else {
      if (antes.etapa !== n.etapa) anota(n, 'Etapa: ' + etapaNome(n.etapa));
      if (antes.calor !== n.calor) anota(n, 'Calor: ' + (CALOR.find(c => c[0] === n.calor) || [, ''])[1]);
      if ((antes.vendedor || '') !== n.vendedor) { anota(n, 'Vendedor: ' + nomeVendedor(n.vendedor)); DB.pagamentos.filter(p => p.lead === n.id).forEach(p => { p.vendedor = n.vendedor; salva('pagamento', p); }); }
    }
    if (await salva('lead', n, antes ? 'Ficha salva.' : 'Lead criado.')) {
      render(); if (n.etapa === 'fechou' && !n.venda && EH_ADMIN()) abreFicha(n, 'fechar'); else fechaFicha();
    }
    return;
  }
  if (f.id === 'vend-form') {
    e.preventDefault(); if (!EH_ADMIN()) return;
    const nome = f.nome.value.trim(); if (!nome) return;
    /* mesmo nome de quem já está na lista = completar a ficha dele (o e-mail chega depois, por exemplo) */
    const slug = slugDe(nome) || 'vendedor', ja = vendedorDe(slug);
    const email = f.email.value.trim().toLowerCase() || (ja && ja.email) || '';
    const v = { ...(ja || { id: slug, ativo: true, criado: new Date().toISOString() }), nome: ja ? ja.nome : nome, email, whats: f.whats.value.trim() || (ja && ja.whats) || '' };
    if (!(await salva('vendedor', v, ja ? 'Ficha de ' + v.nome + ' atualizada.' : nome + ' entrou na lista.'))) return;
    /* com banco: o e-mail dele também entra na lista de acesso, para o "Primeiro acesso" valer */
    if (NUVEM() && email) {
      const r = await supaFetch('acessos?on_conflict=email', { method: 'POST', body: JSON.stringify({ email, nome: v.nome, papel: 'vendedor', vendedor: slug }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } }).catch(() => null);
      toast(r && r.ok ? v.nome + ' já pode entrar: no app, "Primeiro acesso" com ' + email + '.' : 'Vendedor criado, mas o acesso dele não gravou. Tente de novo.');
    }
    render();
    return;
  }
  if (f.id === 'entrar-form') {
    e.preventDefault(); const msg = $('entrar-msg'); msg.textContent = 'Entrando…';
    const r = await authSignIn($('e-mail').value.trim(), $('e-senha').value);
    if (!r || !r.ok) { msg.textContent = (r && r.error) || 'E-mail ou senha não conferem.'; return; }
    S.conferido = false; S.entrarMsg = ''; render(); return;
  }
  if (f.id === 'primeiro-form') {
    e.preventDefault(); const msg = $('primeiro-msg'), email = $('p-mail').value.trim(), s1 = $('p-senha').value, s2 = $('p-senha2').value;
    if (s1.length < 8) { msg.textContent = 'A senha precisa de pelo menos 8 caracteres.'; return; }
    if (s1 !== s2) { msg.textContent = 'As duas senhas não são iguais.'; return; }
    msg.textContent = 'Criando…';
    const r = await authSignUp(email, s1);
    if (!r.ok) { msg.textContent = /already|registered|exist/i.test(r.error || '') ? 'Esse e-mail já tem conta. Volte e use "Esqueci a senha".' : (r.error || 'Não consegui criar agora.'); return; }
    if (r.logged) { S.primeiro = false; S.conferido = false; render(); return; }
    msg.textContent = 'Pronto. Chegou um e-mail de "Ti Arts", em inglês ("Confirm your email address"): abra neste aparelho e toque em "Confirm email address".';
    return;
  }
  if (f.id === 'senha-form') {
    e.preventDefault(); const msg = $('senha-msg'); msg.textContent = 'Salvando…';
    const r = await authSetPassword($('s-nova').value);
    if (!r.ok) { msg.textContent = r.error || 'Não consegui salvar. Peça um link novo em "Esqueci a senha".'; return; }
    S.senhaNova = false; S.conferido = false; toast('Senha nova salva.'); render();
  }
});

/* ---------- começo ---------- */
(async function inicio() {
  const volta = typeof authFromHash === 'function' ? authFromHash() : null;
  if (volta && volta.tipo === 'recovery') S.senhaNova = true;
  if (volta && volta.erro) S.entrarMsg = 'O link do e-mail não valeu (' + volta.erro + '). Peça outro em "Esqueci a senha".';
  if (!NUVEM()) await dbCarregar();
  render();
})();
