/* =====================================================
   PEDIDOS — tudo que uma pessoa manda pelo site vira um pedido:
   interesse num imóvel, contato, anúncio de imóvel, e os serviços da área
   do cliente (2ª via, reembolso, chamado, desocupação, extrato, informe, vistoria).

   Com banco: o pedido entra na tabela `pedidos` da sala (quem está de fora só
   CRIA; só a dona lê). Sem banco: fica neste aparelho e sai pelo WhatsApp.
   Nos dois casos o aceite da política de privacidade vai gravado com a hora.

   LGPD: só pedimos o que o serviço precisa. CPF só nos serviços de cliente
   (é como a AD7 acha o contrato), nunca no primeiro contato.
   ===================================================== */
'use strict';

const PED_KEY = 'ad7_pedidos_v1';
const PED_TIPOS = {
  interesse: 'Interesse em imóvel', contato: 'Contato', anuncio: 'Anunciar imóvel',
  boleto: '2ª via de boleto', reembolso: 'Reembolso de taxa extraordinária', chamado: 'Chamado de manutenção',
  desocupacao: 'Aviso de desocupação', extrato: 'Extrato de contas', informe: 'Informe de rendimentos', vistoria: 'Vistorias e fotos',
};
const PED_COM_CPF = ['boleto', 'reembolso', 'chamado', 'desocupacao', 'extrato', 'informe', 'vistoria'];

function pedidosLocais() { try { return JSON.parse(localStorage.getItem(PED_KEY)) || []; } catch (e) { return []; } }
function pedidosGravar(lista) { try { localStorage.setItem(PED_KEY, JSON.stringify(lista)); } catch (e) {} }
function pedidoNovoId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function soDigitos(s) { return String(s || '').replace(/\D/g, ''); }

function validarPedido(tipo, c) {
  if (!PED_TIPOS[tipo]) return 'Tipo de pedido desconhecido.';
  if (!String(c.nome || '').trim()) return 'Escreva o seu nome.';
  if (soDigitos(c.telefone).length < 10) return 'Confira o WhatsApp, com o DDD.';
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return 'Confira o e-mail.';
  if (PED_COM_CPF.includes(tipo) && soDigitos(c.cpf).length !== 11) return 'Confira o CPF do titular do contrato (11 números).';
  if (!c.aceite) return 'Marque o aceite da Política de Privacidade para a gente poder responder.';
  return '';
}

function montarPedido(tipo, c) {
  return {
    id: pedidoNovoId(), tipo, rotulo: PED_TIPOS[tipo],
    nome: String(c.nome || '').trim(), telefone: soDigitos(c.telefone), email: String(c.email || '').trim().toLowerCase(),
    cpf: PED_COM_CPF.includes(tipo) ? soDigitos(c.cpf) : '',
    imovelRef: String(c.imovelRef || '').trim(), mensagem: String(c.mensagem || '').trim(),
    extra: c.extra && typeof c.extra === 'object' ? c.extra : {},
    consentimento: { politica: true, em: new Date().toISOString(), marketing: !!c.marketing },
    origem: 'site', criadoEm: new Date().toISOString(), status: 'novo',
  };
}

function textoPedido(p) {
  const l = ['Olá! Pedido pelo site da AD7: *' + p.rotulo + '*', 'Nome: ' + p.nome];
  if (p.imovelRef) l.push('Imóvel: Ref. ' + p.imovelRef);
  if (p.cpf) l.push('CPF do titular: ***.' + p.cpf.slice(3, 6) + '.' + p.cpf.slice(6, 9) + '-**');
  for (const [k, v] of Object.entries(p.extra || {})) if (v) l.push(k + ': ' + v);
  if (p.mensagem) l.push('Mensagem: ' + p.mensagem);
  l.push('(pedido ' + p.id + ')');
  return l.join('\n');
}
function linkWhatsPedido(p) {
  const num = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.whatsapp) || '';
  return 'https://wa.me/' + num + '?text=' + encodeURIComponent(textoPedido(p));
}

async function enviarPedido(tipo, campos) {
  const erro = validarPedido(tipo, campos || {});
  if (erro) return { ok: false, erro };
  const p = montarPedido(tipo, campos);
  let nuvem = false;
  if (typeof temNuvem === 'function' && temNuvem()) {
    try {
      const r = await supaFetch('pedidos', { method: 'POST', body: JSON.stringify({ id: p.id, data: p }), headers: { Prefer: 'return=minimal' } });
      nuvem = r.ok;
    } catch (e) { nuvem = false; }
  }
  if (!nuvem) pedidosGravar(pedidosLocais().concat([p]));
  return { ok: true, nuvem, pedido: p, whatsapp: linkWhatsPedido(p) };
}

/* ---- o lado da dona (painel) ---- */
async function listarPedidos() {
  if (typeof temNuvem === 'function' && temNuvem() && typeof isLoggedIn === 'function' && isLoggedIn()) {
    try {
      const r = await supaFetch('pedidos?select=id,data,created_at&order=created_at.desc&limit=500');
      if (r.ok) return { nuvem: true, lista: (await r.json()).map(x => ({ ...x.data, id: x.id })) };
    } catch (e) {}
  }
  return { nuvem: false, lista: pedidosLocais().slice().reverse() };
}
async function marcarPedido(id, status) {
  const local = pedidosLocais();
  const i = local.findIndex(p => p.id === id);
  if (typeof temNuvem === 'function' && temNuvem() && typeof isLoggedIn === 'function' && isLoggedIn()) {
    try {
      const r0 = await supaFetch('pedidos?id=eq.' + encodeURIComponent(id) + '&select=data');
      const atual = r0.ok ? (await r0.json())[0] : null;
      if (atual) {
        const r = await supaFetch('pedidos?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ data: { ...atual.data, status } }), headers: { Prefer: 'return=minimal' } });
        if (r.ok) return true;
      }
    } catch (e) {}
  }
  if (i >= 0) { local[i].status = status; pedidosGravar(local); return true; }
  return false;
}

if (typeof module !== 'undefined') module.exports = { PED_TIPOS, PED_COM_CPF, validarPedido, montarPedido, textoPedido, linkWhatsPedido, enviarPedido, listarPedidos, marcarPedido, pedidosLocais };
