/* =====================================================
   DADOS DO MILLA VENDAS (12/11/2026)

   Três coleções, iguais na demonstração e no banco:
     lead       uma imobiliária interessada (calor, etapa, vendedor, próximo passo, venda)
     vendedor   um parceiro que vende (Tiago, Betão…), com o link de indicação dele
     pagamento  uma parcela de um cliente que fechou: prevista → recebida → repassada

   Demonstração (sem banco): tudo no navegador (localStorage), com exemplos inventados.
   Banco: a tabela `itens` da sala millavendas (colecao, id, dados). A RLS do banco
   entrega a cada vendedor SÓ o que é dele; a tela filtra de novo, por garantia.

   A divisão de cada pagamento recebido (decisão de 12/11/2026):
     25% Ti Artes · 37,5% Eugênio · 37,5% o vendedor que trouxe.
   Sem vendedor (venda direta), os 75% ficam com o Eugênio.
   ===================================================== */
'use strict';

const DIV = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.divisao) || { tiartes: 0.25, eugenio: 0.375, vendedor: 0.375 };
const ETAPAS = [['novo', 'Novo'], ['conversa', 'Em conversa'], ['reuniao', 'Reunião'], ['proposta', 'Proposta'], ['fechou', 'Fechou'], ['perdeu', 'Perdeu']];
const ABERTA = e => !['fechou', 'perdeu'].includes(e);
const CALOR = [['quente', 'Quente'], ['morno', 'Morno'], ['frio', 'Frio']];
const ORIGENS = { site: 'Formulário do site', link: 'Link do vendedor', manual: 'Cadastro manual', whatsapp: 'WhatsApp' };
/* os jeitos de comprar; o "sem implantação" ainda é proposta (falta o OK do Eugênio) */
const PLANOS = {
  mensal: { nome: 'Mensal', resumo: 'R$ 3.700 de implantação + R$ 460/mês, contrato de 6 meses', implantacao: 3700, mensal: 460, meses: 6 },
  anual: { nome: 'Ano à vista', resumo: 'R$ 5.520 do ano + implantação pela metade, R$ 1.850', implantacao: 1850, ano: 5520 },
  semimpl: { nome: 'Sem implantação', resumo: 'R$ 790/mês nos 12 primeiros meses, depois R$ 460', mensal: 790, meses: 12, depois: 460 },
};
const TIPO_PAG = { implantacao: 'Implantação', mensalidade: 'Mensalidade', ano: 'Ano à vista' };

const DB = { leads: [], vendedores: [], pagamentos: [], carregou: false, erro: '', papel: '', vendedor: '' };
const DEMO_KEY = 'millavendas_demo_v1', DEMO_VER = 'millavendas_demo_ver';
const NUVEM = () => typeof temNuvem === 'function' && temNuvem();

/* ---------- datas e números ---------- */
const hojeIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
function somaDias(iso, n) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function somaMeses(iso, n) {
  const d = new Date(iso + 'T12:00:00'), dia = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, fim));
  return d.toISOString().slice(0, 10);
}
const mesDe = iso => String(iso || '').slice(0, 7);
const novoId = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const slugDe = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
const soDig = s => String(s || '').replace(/\D/g, '');
/* WhatsApp do Brasil chega às vezes sem o 9: compara pelos 8 últimos dígitos */
const mesmoWhats = (a, b) => { a = soDig(a); b = soDig(b); return a.length >= 8 && b.length >= 8 && a.slice(-8) === b.slice(-8); };

/* ---------- a divisão de um pagamento ---------- */
function partes(p) {
  const v = Number(p.valor) || 0;
  const ti = v * DIV.tiartes;
  if (!p.vendedor) return { tiartes: ti, eugenio: v - ti, vendedor: 0 };
  const ve = v * DIV.vendedor;
  return { tiartes: ti, eugenio: v - ti - ve, vendedor: ve };
}

/* ---------- parcelas de quem fechou ---------- */
function parcelasDaVenda(lead) {
  const v = lead.venda || {}, ini = v.inicio || hojeIso(), out = [];
  const pg = (tipo, valor, vence, ref) => ({ id: novoId('p'), lead: lead.id, vendedor: lead.vendedor || '', tipo, valor: Number(valor) || 0, vence, ref, recebido: '', repassado: '' });
  if (v.plano === 'anual') {
    if (v.implantacao > 0) out.push(pg('implantacao', v.implantacao, ini, ''));
    out.push(pg('ano', v.ano, ini, '1º ano'));
  } else if (v.plano === 'semimpl') {
    for (let k = 0; k < (v.meses || 12); k++) out.push(pg('mensalidade', v.mensal, somaMeses(ini, k), (k + 1) + 'ª de ' + (v.meses || 12)));
  } else {
    if (v.implantacao > 0) out.push(pg('implantacao', v.implantacao, ini, ''));
    for (let k = 1; k <= (v.meses || 6); k++) out.push(pg('mensalidade', v.mensal, somaMeses(ini, k), k + 'ª de ' + (v.meses || 6)));
  }
  return out;
}
/* renovar: mais 6 mensalidades (ou mais um ano), depois da última parcela */
function parcelasDaRenovacao(lead) {
  const v = lead.venda || {}, minhas = DB.pagamentos.filter(p => p.lead === lead.id).sort((a, b) => a.vence.localeCompare(b.vence));
  const ult = minhas.length ? minhas[minhas.length - 1].vence : (v.inicio || hojeIso());
  const pg = (tipo, valor, vence, ref) => ({ id: novoId('p'), lead: lead.id, vendedor: lead.vendedor || '', tipo, valor: Number(valor) || 0, vence, ref, recebido: '', repassado: '' });
  if (v.plano === 'anual') return [pg('ano', v.ano, somaMeses(ult, 12), 'renovação anual')];
  const valor = v.plano === 'semimpl' ? (v.depois || 460) : v.mensal;
  return Array.from({ length: 6 }, (_, k) => pg('mensalidade', valor, somaMeses(ult, k + 1), 'renovação ' + (k + 1) + '/6'));
}

/* ---------- o que esta conta vê ---------- */
const EH_ADMIN = () => DB.papel === 'admin';
const meuVendedor = () => (DB.papel === 'vendedor' ? DB.vendedor : '');
const leadsVisiveis = () => EH_ADMIN() ? DB.leads : DB.leads.filter(l => l.vendedor && l.vendedor === meuVendedor());
const pagsVisiveis = () => EH_ADMIN() ? DB.pagamentos : DB.pagamentos.filter(p => p.vendedor && p.vendedor === meuVendedor());
const vendedorDe = slug => DB.vendedores.find(v => v.id === slug) || null;
const nomeVendedor = slug => slug ? ((vendedorDe(slug) || {}).nome || slug) : 'Direto (Eugênio)';
const leadDe = id => DB.leads.find(l => l.id === id) || null;

/* ---------- DEMONSTRAÇÃO: dados inventados no navegador ---------- */
function demoSemente() {
  const h = hojeIso(), d = n => somaDias(h, n), t = n => new Date(Date.now() + n * 864e5).toISOString();
  const vendedores = [
    { id: 'tiago', nome: 'Tiago', email: 'tiago@exemplo.com', whats: '41900000001', ativo: true, criado: t(-20) },
    { id: 'betao', nome: 'Betão', email: 'betao@exemplo.com', whats: '41900000002', ativo: true, criado: t(-18) },
  ];
  const L = (id, imobiliaria, contato, cidade, vendedor, calor, etapa, origem, proximo, passo, nota, dias) => ({
    id, imobiliaria, contato, cidade, whats: '4190000' + String(1000 + Math.floor(Math.random() * 8999)), email: '', vendedor, calor, etapa, origem,
    proximo, passo, nota, criado: t(-dias), atualizado: t(-Math.max(0, dias - 2)), historico: [] });
  const leads = [
    L('l1', 'Maré Alta Imóveis', 'Renata', 'Matinhos (PR)', 'tiago', 'quente', 'proposta', 'link', d(0), 'Ligar para fechar o mensal', 'Gostou do teste no WhatsApp. Quer começar antes do verão.', 6),
    L('l2', 'Âncora Imóveis', 'Paulo', 'Paranaguá (PR)', 'betao', 'quente', 'reuniao', 'link', d(1), 'Reunião às 10h pelo Meet', '3 corretores, muito movimento de temporada.', 4),
    L('l3', 'Brisa Litoral', 'Carla', 'Guaratuba (PR)', 'tiago', 'morno', 'conversa', 'site', d(-1), 'Mandar o vídeo e a proposta', 'Preencheu o formulário do site. Já usa outro CRM.', 3),
    L('l4', 'Alto da Serra Imóveis', 'Marcos', 'São José dos Pinhais (PR)', '', 'morno', 'novo', 'site', d(0), 'Primeiro contato', 'Veio direto pelo site, sem vendedor.', 1),
    L('l5', 'Vila Mar Negócios', 'Sônia', 'Itapoá (SC)', 'betao', 'frio', 'conversa', 'manual', d(7), 'Voltar a falar depois do feriado', 'Achou caro; pediu para pensar.', 12),
    L('l6', 'Horizonte Imóveis', 'Diego', 'Curitiba (PR)', 'betao', 'quente', 'novo', 'link', d(0), 'Chamar no WhatsApp hoje', 'Testou a Milla ontem à noite.', 1),
    L('l7', 'Porto Azul Imobiliária', 'Juliana', 'Joinville (SC)', 'tiago', 'frio', 'perdeu', 'manual', '', '', 'Fechou com outro fornecedor.', 15),
    L('l8', 'Costa Verde Imóveis', 'Rafael', 'Balneário Camboriú (SC)', 'tiago', 'morno', 'reuniao', 'link', d(2), 'Mostrar o painel', '2 lojas; quer a Milla nas duas.', 5),
  ];
  const f1 = L('l9', 'Recanto Imóveis', 'Fernanda', 'Pontal do Sul (PR)', 'tiago', 'quente', 'fechou', 'link', '', '', 'Fechou no mensal.', 70);
  f1.venda = { plano: 'mensal', implantacao: 3700, mensal: 460, meses: 6, inicio: somaMeses(h, -2) };
  const f2 = L('l10', 'Sol Nascente Imóveis', 'André', 'Matinhos (PR)', 'betao', 'quente', 'fechou', 'link', '', '', 'Pagou o ano à vista.', 40);
  f2.venda = { plano: 'anual', implantacao: 1850, ano: 5520, inicio: somaMeses(h, -1) };
  const f3 = L('l11', 'Nova Era Imóveis', 'Cláudio', 'Curitiba (PR)', '', 'quente', 'fechou', 'whatsapp', '', '', 'Venda direta do Eugênio.', 30);
  f3.venda = { plano: 'mensal', implantacao: 3700, mensal: 460, meses: 6, inicio: h.slice(0, 8) + '01' };
  leads.push(f1, f2, f3);
  DB.leads = leads; DB.vendedores = vendedores; DB.pagamentos = [];
  const pags = [...parcelasDaVenda(f1), ...parcelasDaVenda(f2), ...parcelasDaVenda(f3)];
  /* o que já venceu entrou; o que entrou há mais de 10 dias já foi repassado */
  pags.forEach(p => { if (p.vence <= h) { p.recebido = p.vence; if (p.vence <= somaDias(h, -10) && p.vendedor) p.repassado = somaDias(p.vence, 5); } });
  return { leads, vendedores, pagamentos: pags };
}
function demoLe() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); } catch (e) { d = null; }
  if (!d || !Array.isArray(d.leads)) { d = demoSemente(); demoGrava(d); }
  return d;
}
function demoGrava(d) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(d || { leads: DB.leads, vendedores: DB.vendedores, pagamentos: DB.pagamentos })); } catch (e) { /* aba anônima: segue só na memória */ } }
function demoRecomeca() { try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* nada */ } const d = demoSemente(); demoGrava(d); Object.assign(DB, d); }
function demoVerComo(papel, vendedor) {
  DB.papel = papel === 'vendedor' ? 'vendedor' : 'admin'; DB.vendedor = DB.papel === 'vendedor' ? vendedor : '';
  try { localStorage.setItem(DEMO_VER, DB.papel === 'vendedor' ? vendedor : ''); } catch (e) { /* nada */ }
}

/* ---------- BANCO: itens da sala millavendas ---------- */
async function nuvemLista() {
  const r = await supaFetch('itens?select=colecao,id,dados&apagado=eq.false&colecao=in.(lead,vendedor,pagamento)&limit=5000');
  if (!r.ok) throw new Error('ler ' + r.status);
  const linhas = await r.json(), out = { leads: [], vendedores: [], pagamentos: [] };
  for (const x of linhas) {
    const o = { ...(x.dados || {}), id: x.id };
    if (x.colecao === 'lead') out.leads.push(o); else if (x.colecao === 'vendedor') out.vendedores.push(o); else out.pagamentos.push(o);
  }
  return out;
}
async function nuvemGrava(colecao, obj) {
  const { id, ...dados } = obj;
  const r = await supaFetch('itens?on_conflict=colecao,id', { method: 'POST', body: JSON.stringify({ colecao, id, dados, apagado: false }),
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  if (!r.ok) throw new Error((await r.text().catch(() => '')).slice(0, 160) || ('gravar ' + r.status));
}
async function nuvemPapel() {
  const r = await supaFetch('rpc/meu_acesso', { method: 'POST', body: '{}' });
  if (r.status === 401) return { papel: null, sair: true };
  const papel = r.ok ? await r.json().catch(() => null) : null;
  let vendedor = '';
  if (papel === 'vendedor') { const v = await supaFetch('rpc/meu_vendedor', { method: 'POST', body: '{}' }); vendedor = v.ok ? (await v.json().catch(() => '')) || '' : ''; }
  return { papel: papel === 'admin' || papel === 'vendedor' ? papel : '', vendedor };
}

/* ---------- a porta única para ler e gravar ---------- */
async function dbCarregar() {
  DB.erro = '';
  if (!NUVEM()) {
    Object.assign(DB, demoLe());
    let ver = ''; try { ver = localStorage.getItem(DEMO_VER) || ''; } catch (e) { ver = ''; }
    demoVerComo(ver && vendedorDe(ver) ? 'vendedor' : 'admin', ver);
    DB.carregou = true; return;
  }
  try { Object.assign(DB, await nuvemLista()); DB.carregou = true; }
  catch (e) { DB.erro = 'Não consegui ler o CRM agora. Confira a internet e tente de novo.'; DB.carregou = true; }
}
async function dbGrava(colecao, obj) {
  const lista = colecao === 'lead' ? DB.leads : colecao === 'vendedor' ? DB.vendedores : DB.pagamentos;
  const i = lista.findIndex(x => x.id === obj.id);
  const antes = i >= 0 ? lista[i] : null;
  if (i >= 0) lista[i] = obj; else lista.push(obj);
  if (!NUVEM()) { demoGrava(); return true; }
  try { await nuvemGrava(colecao, obj); return true; }
  catch (e) { if (antes) lista[i] = antes; else lista.splice(lista.indexOf(obj), 1); throw e; }
}

if (typeof module !== 'undefined') module.exports = { partes, parcelasDaVenda, parcelasDaRenovacao, somaMeses, mesmoWhats, slugDe, DB, PLANOS, DIV };
