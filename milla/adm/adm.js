/* =====================================================
   ADM DA MILLA — "Clientes da Milla" (16/11/2026)
   Pedido dele: "quem for cliente da Milla está dentro da Milla… quando eu entro com a minha
   conta, eu tenho um ADM junto; quando o cliente entra, é a conta dele".

   Mora num endereço só dele (adm.html → rottaguide.com/milla/adm), fora dos apps das imobiliárias,
   e só a conta do estúdio (ESTUDIO_UID) passa. A tela lista as
   imobiliárias que assinam a Milla: app, plano, valor, vencimento, situação, meses pagos,
   cobrança no WhatsApp com o Pix, Recebi e os avisos de "Já paguei" dos donos.

   NADA É DUPLICADO: a ficha é a mesma das Mensalidades do TI ARTES OS (public.itens da conta do
   estúdio, coleção 'mensal'). A RLS dessa tabela só deixa a própria conta ler e gravar, então
   outra conta que abrisse esta tela não veria nada. O OS recebe as mudanças sozinho e continua
   somando o dinheiro da Milla no "Entrou no mês".
   Cuidado de gravação: antes de mudar, lê a ficha mais nova do banco e muda só o que é desta tela.
   ===================================================== */
'use strict';

const ADM = { fichas: [], cfg: null, avisos: [], nomes: {}, carregou: false, buscando: false, erro: '', salvando: false };
const EH_ESTUDIO = () => LOGADO() && !!authUser() && authUser().id === ESTUDIO_UID;
const ADM_LER = { 'Accept-Profile': 'public' }, ADM_GRAVAR = { 'Content-Profile': 'public' };
const ADM_BASE = () => 'itens?user_id=eq.' + ESTUDIO_UID + '&apagado=eq.false';
/* é da Milla? o mesmo critério do OS (produto escolhido, ou "Milla" no plano), mais a sala ligada */
const admEhMilla = d => !!d && d.produto !== 'nenhum' && (d.produto === 'milla' || MILLA_SALAS.some(x => x.sala === d.sala) || /\bmilla\b/i.test([d.plano, d.nome, d.obs].map(x => String(x || '')).join(' ')));
const admSala = f => MILLA_SALAS.find(x => x.sala === (f && f.sala)) || null;
const admCli = f => (f && f.cliId && ADM.nomes[f.cliId]) || {};
const admNome = f => (f && f.nome) || admCli(f).nome || 'Sem nome';
const admWa = f => String((f && f.wa) || admCli(f).wa || '').replace(/\D/g, '');
const admPessoa = f => String((f && f.contato) || admCli(f).contato || admNome(f)).trim().split(/\s+/)[0];
/* a ficha com os avisos de "Já paguei" daquela sala, no formato da Sua assinatura */
function admComAvisos(f) {
  const avisos = {};
  ADM.avisos.forEach(a => { if (a && f.sala && a.sala === f.sala && (!a.mnId || a.mnId === f.id) && a.venc) avisos[a.venc] = a.quando || ''; });
  return { ...f, avisos };
}
const admPorAviso = (f, v) => { const a = ADM.avisos.find(x => x && x.sala === f.sala && x.venc === v && (!x.mnId || x.mnId === f.id)); return a ? a.por || '' : ''; };

async function admCarregar(forcar) {
  if (!EH_ESTUDIO() || ADM.buscando || (ADM.carregou && !forcar)) return;
  ADM.buscando = true;
  try {
    await authEnsure();
    const [rM, rC, rA] = await Promise.all([
      supaFetch(ADM_BASE() + '&colecao=eq.mensal&select=id,dados,atualizado_em&limit=500', { headers: ADM_LER }),
      /* da configuração do OS, só o que o Pix precisa (nada de chave de IA) */
      supaFetch(ADM_BASE() + '&colecao=eq.cfg&id=eq.cfg&select=chave:dados->>pixChave,nome:dados->>pixNome,cidade:dados->>pixCidade,studio:dados->>studio', { headers: ADM_LER }),
      supaFetch(ADM_BASE() + '&colecao=eq.mnavisos&select=id,dados&limit=500', { headers: ADM_LER }),
    ]);
    if (!rM.ok) throw new Error('mensal ' + rM.status);
    ADM.fichas = (await rM.json()).map(l => ({ ...(l.dados || {}), id: l.id, _em: l.atualizado_em })).filter(admEhMilla);
    const c = rC.ok ? (await rC.json())[0] : null;
    ADM.cfg = c ? { chave: c.chave || '', nome: c.nome || 'TI ARTES', cidade: c.cidade || 'CURITIBA', studio: c.studio || 'studio Ti Artes' } : null;
    ADM.avisos = rA.ok ? (await rA.json()).map(l => l.dados || {}) : [];
    const ids = [...new Set(ADM.fichas.map(f => f.cliId).filter(Boolean))];
    if (ids.length) {
      const rN = await supaFetch(ADM_BASE() + '&colecao=eq.clientes&id=in.(' + ids.map(i => '"' + encodeURIComponent(i) + '"').join(',') + ')&select=id,nome:dados->>nome,contato:dados->>contato,wa:dados->>wa', { headers: ADM_LER });
      if (rN.ok) (await rN.json()).forEach(x => { ADM.nomes[x.id] = x; });
    }
    ADM.erro = '';
  } catch (e) { ADM.erro = 'Não consegui ler os clientes agora. Confira a internet e tente de novo.'; }
  finally { ADM.buscando = false; ADM.carregou = true; }
}

/* lê a ficha mais nova do banco, muda só o que esta tela muda e grava */
async function admGravar(id, muda) {
  await authEnsure();
  const alvo = ADM_BASE().replace('&apagado=eq.false', '') + '&colecao=eq.mensal&id=eq.' + encodeURIComponent(id);
  const r0 = await supaFetch(alvo + '&select=dados', { headers: ADM_LER });
  if (!r0.ok) throw new Error('ler ' + r0.status);
  const atual = ((await r0.json())[0] || {}).dados;
  if (!atual) throw new Error('a ficha não está mais no banco');
  const novo = JSON.parse(JSON.stringify(atual)); muda(novo);
  const r = await supaFetch(alvo, { method: 'PATCH', headers: { ...ADM_GRAVAR, Prefer: 'return=minimal' }, body: JSON.stringify({ dados: novo }) });
  if (!r.ok) throw new Error('gravar ' + r.status);
  return novo;
}
async function admCriar(d) {
  await authEnsure();
  const r = await supaFetch('itens', { method: 'POST', headers: { ...ADM_GRAVAR, Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: ESTUDIO_UID, colecao: 'mensal', id: d.id, dados: d }) });
  if (!r.ok) throw new Error('criar ' + r.status);
}
async function admRecebi(id, venc, desfazer) {
  if (ADM.salvando) return;
  ADM.salvando = true;
  try {
    await admGravar(id, d => {
      d.pagos = d.pagos && typeof d.pagos === 'object' ? d.pagos : {};
      if (desfazer) delete d.pagos[venc]; else d.pagos[venc] = { valor: Number(d.valor) || 0, em: asIso(asHoje()) };
    });
    await admCarregar(true);
    toast(desfazer ? 'Desmarcado: ' + asFmt(venc) + ' volta a ficar em aberto.' : 'Recebido: ' + asFmt(venc) + '. O TI ARTES OS já conta no mês.');
  } catch (e) { toast('Não gravou. Tente de novo.'); }
  finally { ADM.salvando = false; render(); }
}

/* ---------- a tela ---------- */
function vClientes() {
  if (!EH_ESTUDIO()) return `${faixaCel()}<div class="topo"><h1>Clientes da Milla</h1></div><div class="box"><b>Esta tela é só do studio Ti Artes.</b><div class="sm">As conversas, os leads e os imóveis estão no menu.</div></div>`;
  const topo = `${faixaCel()}<div class="topo"><div><span class="olho">ADM · só a sua conta vê</span><h1>Clientes da Milla</h1>
      <p class="sm adm-sub">As imobiliárias que assinam a Milla. É a mesma ficha das Mensalidades do TI ARTES OS: o que você muda aqui aparece lá, e o dinheiro entra no "Entrou no mês" de lá.</p></div>
    <div class="acoes"><button type="button" class="btn btn-navy btn-p" data-act="adm-ficha" data-v="">+ Imobiliária</button></div></div>`;
  if (!ADM.carregou || (ADM.buscando && !ADM.fichas.length)) return topo + '<div class="sm vazio">Carregando os clientes…</div>';
  if (ADM.erro) return topo + `<div class="box"><b>${esc(ADM.erro)}</b><button type="button" class="btn btn-line btn-p" data-act="adm-recarregar">Tentar de novo</button></div>`;
  const hoje = asHoje(), mes = hoje.getMonth(), ano = hoje.getFullYear();
  const L = ADM.fichas.map(admComAvisos);
  const ativos = L.filter(f => f.status !== 'pausado' && f.status !== 'encerrado');
  let recMes = 0, aberto = 0, avisaram = 0;
  L.forEach(f => {
    Object.values(f.pagos || {}).forEach(p => { if (p && p.em && asD(p.em).getMonth() === mes && asD(p.em).getFullYear() === ano) recMes += Number(p.valor) || 0; });
    const s = asSituacao(f, hoje); if (s.t === 'atrasado') aberto += s.valor || 0;
    if (Object.keys(f.avisos).some(v => asAvisou(f, v))) avisaram++;
  });
  const kpis = [
    ['Entra por mês', asReal(ativos.reduce((t, f) => t + (Number(f.valor) || 0), 0)), ativos.length + ' imobiliária' + (ativos.length === 1 ? '' : 's') + ' ativa' + (ativos.length === 1 ? '' : 's')],
    ['Recebido em ' + AS_MES_LONGO[mes], asReal(recMes), 'mensalidades que caíram'],
    ['Em aberto', asReal(aberto), aberto ? 'cobre pelo botão do cartão' : 'ninguém atrasado'],
    ['Avisaram que pagaram', String(avisaram), avisaram ? 'confira o extrato e dê o Recebi' : 'nenhum aviso esperando'],
  ];
  const ord = { atrasado: 0, hoje: 1, logo: 2, semdata: 3, carencia: 4, emdia: 5, pausado: 6, encerrado: 7 };
  const V = L.map(f => ({ f, s: asSituacao(f, hoje) })).sort((a, b) => {
    const av = x => Object.keys(x.f.avisos).some(v => asAvisou(x.f, v)) ? -1 : 0;
    return av(a) - av(b) || (ord[a.s.t] ?? 9) - (ord[b.s.t] ?? 9) || admNome(a.f).localeCompare(admNome(b.f));
  });
  const cartao = ({ f, s }) => {
    const x = asTexto(f, s, 'adm'), sal = admSala(f), alvo = asAlvo(f, hoje), abertoAgora = ['atrasado', 'hoje', 'logo'].includes(s.t);
    const avisoV = Object.keys(f.avisos).filter(v => asAvisou(f, v)).sort()[0];
    const meses = asVencs(f, asMais(hoje, 62)).slice(-7);
    const dia = Number(f.diaVenc) || (asOkData(f.inicio) ? asD(f.inicio).getDate() : '');
    return `<article class="adm-card adm-${x.cor}${avisoV ? ' adm-avisou' : ''}">
      <div class="adm-c1">${av(admNome(f))}<div class="adm-quem"><b>${esc(admNome(f))}</b>
        <span class="sm">${esc([f.plano, f.contato || admCli(f).contato, admWa(f) ? '+' + admWa(f) : ''].filter(Boolean).join(' · ') || 'sem plano escrito')}</span>
        <span class="as-pill as-${x.cor}"><i></i>${esc(x.txt)}${x.sub ? ` <small>${esc(x.sub)}</small>` : ''}</span></div></div>
      <div class="adm-c2"><div class="adm-val num">${esc(asReal(f.valor))}<small>/mês</small></div>
        <div class="sm">${dia ? 'vence todo dia ' + esc(String(dia)) : 'sem data de início'}${f.implValor ? ' · implantação ' + esc(asReal(f.implValor)) + (f.implPaga ? ', paga' : ', em aberto') : ''}</div>
        ${sal ? `<a class="adm-app" href="${esc(sal.url)}" target="_blank" rel="noopener">App: ${esc(sal.nome)} · o dono vê ↗</a>` : `<button type="button" class="adm-app adm-semapp" data-act="adm-ficha" data-v="${esc(f.id)}">Sem app ligado · ligar</button>`}
        ${meses.length ? `<div class="as-meses">${meses.map(v => { const p = asPago(f, v), atr = !p && asDias(v, hoje) < 0, avi = asAvisou(f, v);
          return `<button type="button" class="as-mes ${p ? 'ok' : avi ? 'avisado' : atr ? 'atr' : v === alvo ? 'prox' : ''}" data-act="adm-mes" data-id="${esc(f.id)}" data-v="${esc(v)}" title="${esc(p ? 'Pago' + (f.pagos[v].em ? ' em ' + asFmt(f.pagos[v].em) : '') + ' — toque para desfazer' : 'Em aberto — toque para marcar como recebido')}">${AS_MES[asD(v).getMonth()]}<small>${p ? 'pago' : avi ? 'avisou' : asFmt(v).slice(0, 2)}</small></button>`; }).join('')}</div>` : ''}</div>
      <div class="adm-c3">
        <button type="button" class="btn ${abertoAgora ? 'btn-wa' : 'btn-line'} btn-p" data-act="adm-cobrar" data-id="${esc(f.id)}">${s.t === 'atrasado' ? 'Cobrar' : 'Lembrete'}</button>
        <button type="button" class="btn btn-line btn-p" data-act="adm-pix" data-id="${esc(f.id)}">Pix</button>
        ${abertoAgora && !avisoV ? `<button type="button" class="btn btn-navy btn-p" data-act="adm-recebi" data-id="${esc(f.id)}" data-v="${esc(alvo)}">Recebi</button>` : ''}
        <button type="button" class="btn btn-line btn-p" data-act="adm-ficha" data-v="${esc(f.id)}">Ficha</button></div>
      ${avisoV ? `<div class="adm-aviso"><span><b>${esc(admPessoa(f))} avisou pelo app que pagou a de ${esc(asFmt(avisoV))}</b> · ${esc(asQuando(f.avisos[avisoV]))}${admPorAviso(f, avisoV) ? ' · ' + esc(admPorAviso(f, avisoV)) : ''}. Confira o extrato e dê o Recebi.</span>
        <button type="button" class="btn btn-navy btn-p" data-act="adm-recebi" data-id="${esc(f.id)}" data-v="${esc(avisoV)}">Recebi a de ${esc(asFmt(avisoV))}</button></div>` : ''}
    </article>`;
  };
  return `${topo}
    <section class="kpis adm-kpis" aria-label="Resumo">${kpis.map(([t, v, s], i) => `<div class="kpi ${i === 3 && avisaram ? 'quente' : ''}"><span class="kpi-rot">${esc(t)}</span><b class="num">${esc(v)}</b><span class="sm">${esc(s)}</span></div>`).join('')}</section>
    ${ADM.cfg && ADM.cfg.chave ? '' : '<div class="box"><b>Falta a chave Pix no TI ARTES OS.</b><div class="sm">Sem ela a cobrança vai sem o código. Ponha a chave uma vez em Mensalidades, no OS.</div></div>'}
    <div class="adm-lista">${V.length ? V.map(cartao).join('') : `<div class="box"><b>Nenhuma imobiliária ainda.</b><div class="sm">Toque em "+ Imobiliária" quando fechar a primeira. A ficha aparece também nas Mensalidades do TI ARTES OS.</div></div>`}</div>`;
}

/* ---------- janelas (ficha, cobrança, Pix) ---------- */
function admModal(titulo, corpo, pe) {
  const m = $('modal');
  m.innerHTML = `<div class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-mt"><div class="adm-mcab"><h2 id="adm-mt">${esc(titulo)}</h2><button type="button" class="btn btn-line btn-p" data-act="adm-fechar">Fechar</button></div><div class="adm-mcorpo">${corpo}</div>${pe ? `<div class="adm-mpe">${pe}</div>` : ''}</div>`;
  m.hidden = false;
  const f = m.querySelector('input,select,textarea,button'); if (f) f.focus();
}
function admFechar() { const m = $('modal'); if (!m || m.hidden) return; m.hidden = true; m.innerHTML = ''; }

function admFicha(id) {
  const f = id ? ADM.fichas.find(x => x.id === id) : null;
  const d = f || { nome: '', contato: '', wa: '', plano: 'Milla · atendente no WhatsApp + CRM', valor: 460, sala: '', inicio: asIso(asMais(asHoje(), 30)), diaVenc: '', implValor: '', implPaga: false, status: 'ativo', obs: '' };
  const usadas = ADM.fichas.filter(x => x.sala && x.id !== (f && f.id) && x.status !== 'encerrado').map(x => x.sala);
  const opts = MILLA_SALAS.map(x => `<option value="${esc(x.sala)}" ${d.sala === x.sala ? 'selected' : ''} ${usadas.includes(x.sala) ? 'disabled' : ''}>${esc(x.nome)} · ${esc(x.url.replace('https://', ''))}${usadas.includes(x.sala) ? ' (já ligado a outra ficha)' : ''}</option>`).join('');
  const nomeCli = f && f.cliId && !f.nome ? admCli(f).nome : '';
  admModal(f ? 'Ficha · ' + admNome(f) : 'Nova imobiliária', `
    <div class="adm-form">
      <label class="sm b" for="adm-n">Imobiliária</label>
      ${nomeCli ? `<input id="adm-n" class="inp" value="${esc(nomeCli)}" disabled><span class="sm">O nome vem do cadastro de clientes do TI ARTES OS.</span>` : `<input id="adm-n" class="inp" value="${esc(d.nome || '')}" placeholder="Nome da imobiliária" required>`}
      <div class="adm-2"><div><label class="sm b" for="adm-p">Pessoa de contato</label><input id="adm-p" class="inp" value="${esc(d.contato || '')}" placeholder="Jaime"></div>
        <div><label class="sm b" for="adm-w">WhatsApp com DDI</label><input id="adm-w" class="inp" inputmode="tel" value="${esc(d.wa || '')}" placeholder="5541999998888"></div></div>
      <label class="sm b" for="adm-pl">O que assina <span class="sm">· é o nome que o dono vê no app</span></label><input id="adm-pl" class="inp" value="${esc(d.plano || '')}">
      <div class="adm-2"><div><label class="sm b" for="adm-v">Valor por mês (R$)</label><input id="adm-v" class="inp" inputmode="decimal" value="${esc(String(d.valor || ''))}"></div>
        <div><label class="sm b" for="adm-st">Situação</label><select id="adm-st" class="inp">${[['ativo', 'Ativo'], ['pausado', 'Pausado'], ['encerrado', 'Encerrado']].map(([v, t]) => `<option value="${v}" ${(d.status || 'ativo') === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
      <label class="sm b" for="adm-sa">App da imobiliária <span class="sm">· o dono vê a assinatura e paga por lá; corretor não vê</span></label>
      <select id="adm-sa" class="inp"><option value="">— nenhum —</option>${opts}${d.sala && !admSala(d) ? `<option value="${esc(d.sala)}" selected>${esc(d.sala)}</option>` : ''}</select>
      <div class="adm-2"><div><label class="sm b" for="adm-i">1ª mensalidade vence em <span class="sm">· a carência acaba aqui</span></label><input id="adm-i" class="inp" type="date" value="${esc(d.inicio || '')}"></div>
        <div><label class="sm b" for="adm-dv">Vence todo dia <span class="sm">· vazio: o mesmo da 1ª</span></label><input id="adm-dv" class="inp" inputmode="numeric" value="${esc(String(d.diaVenc || ''))}"></div></div>
      <div class="adm-2"><div><label class="sm b" for="adm-iv">Implantação (R$)</label><input id="adm-iv" class="inp" inputmode="decimal" value="${esc(String(d.implValor || ''))}"></div>
        <div><label class="adm-check"><input type="checkbox" id="adm-ip" ${d.implPaga ? 'checked' : ''}> Implantação já paga</label></div></div>
      <label class="sm b" for="adm-o">Observações <span class="sm">· só você vê</span></label><textarea id="adm-o" class="inp" rows="3">${esc(d.obs || '')}</textarea>
      <div class="sm" id="adm-msg" role="status"></div>
    </div>`, `<button type="button" class="btn btn-navy" data-act="adm-salvar" data-v="${esc(f ? f.id : '')}">${f ? 'Salvar a ficha' : 'Cadastrar a imobiliária'}</button>`);
}
const admNum = s => { s = String(s || '').trim().replace(/[R$\s]/g, ''); if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/[.,](?=\d{3}\b)/g, ''); return Number(s) || 0; };
async function admSalvar(id) {
  const msg = t => { const m = $('adm-msg'); if (m) m.textContent = t; };
  const f = id ? ADM.fichas.find(x => x.id === id) : null;
  const nome = ($('adm-n').disabled ? '' : $('adm-n').value.trim()), valor = admNum($('adm-v').value), sala = $('adm-sa').value;
  if (!(f && f.cliId) && !nome) { msg('Falta o nome da imobiliária.'); $('adm-n').focus(); return; }
  if (!valor) { msg('Falta o valor por mês.'); $('adm-v').focus(); return; }
  const status = $('adm-st').value;
  if (sala && status !== 'encerrado' && ADM.fichas.some(x => x.sala === sala && x.id !== id && x.status !== 'encerrado')) { msg('Esse app já está ligado a outra ficha. Uma imobiliária, uma ficha.'); return; }
  const o = { contato: $('adm-p').value.trim(), wa: $('adm-w').value.replace(/\D/g, ''), plano: $('adm-pl').value.trim(), valor, status, sala, produto: 'milla',
    inicio: $('adm-i').value || '', diaVenc: Math.min(31, Math.max(0, parseInt($('adm-dv').value, 10) || 0)) || '', implValor: admNum($('adm-iv').value), implPaga: $('adm-ip').checked, obs: $('adm-o').value.trim() };
  if (!(f && f.cliId)) o.nome = nome;
  if (ADM.salvando) return; ADM.salvando = true; msg('Salvando…');
  try {
    if (f) await admGravar(f.id, d => { if (o.implPaga && !d.implPaga) d.implPagaEm = asIso(asHoje()); Object.assign(d, o); });
    else {
      const nid = 'mn_' + Math.random().toString(36).slice(2, 9);
      await admCriar({ id: nid, cliId: '', implantacao: asIso(asHoje()), meses: '', renova: true, pagos: {}, criadoEm: asIso(asHoje()), contrato: null, ...o, ...(o.implPaga ? { implPagaEm: asIso(asHoje()) } : {}) });
    }
    admFechar(); await admCarregar(true); toast(f ? 'Ficha salva. O TI ARTES OS recebe sozinho.' : 'Imobiliária cadastrada. Já aparece nas Mensalidades do TI ARTES OS.');
  } catch (e) { msg('Não gravou. Confira a internet e tente de novo.'); }
  finally { ADM.salvando = false; render(); }
}

/* a mensagem de cobrança: a mesma do OS, com o Pix e o caminho do app */
function admMsg(f, tipo, v) {
  const pix = asPix(f, v, ADM.cfg), nome = admPessoa(f), val = asReal(f.valor) + (Number(f.valor) % 1 ? '' : ',00');
  const plano = f.plano || 'o serviço', assin = (ADM.cfg && ADM.cfg.studio) || 'studio Ti Artes', sal = admSala(f);
  const comPix = pix ? `\n\nO Pix já vai com o valor. É só copiar o código abaixo e colar no app do banco, em *Pix copia e cola*:\n\n${pix}` : '';
  const noApp = sal ? `\n\nNo app da Milla dá pra ver e pagar a mensalidade, em *Sua assinatura*: ${sal.url}#/assinatura` : '';
  if (tipo === 'atraso') return `Oi ${nome}! Tudo bem? A mensalidade de ${plano} (${val}) do dia ${asFmt(v)} ainda aparece em aberto por aqui.\n\nSe já pagou, me desconsidera e me manda o comprovante, por favor.${comPix}${noApp}\n\nObrigado!\n${assin}`;
  if (tipo === 'hoje') return `Oi ${nome}! Tudo bem? Passando pra lembrar que a mensalidade de ${plano} (${val}) vence hoje, ${asFmt(v)}.${comPix}${noApp}\n\nQualquer dúvida, me chama.\n${assin}`;
  if (tipo === 'recibo') return `Oi ${nome}! Recebi a mensalidade de ${plano} (${val}) referente a ${asFmt(v)}. Obrigado!\n${assin}`;
  return `Oi ${nome}! Tudo bem? Passando pra lembrar que a mensalidade de ${plano} (${val}) vence dia ${asFmt(v)}.${comPix}${noApp}\n\nQualquer dúvida, me chama.\n${assin}`;
}
const ADM_TIPOS = [['lembrete', 'Lembrete'], ['hoje', 'Vence hoje'], ['atraso', 'Atrasado'], ['recibo', 'Recibo']];
function admCobrar(id, tipo) {
  const f = ADM.fichas.find(x => x.id === id); if (!f) return;
  const s = asSituacao(f), v = asAlvo(f);
  tipo = tipo || (s.t === 'atrasado' ? 'atraso' : s.t === 'hoje' ? 'hoje' : 'lembrete');
  const wa = admWa(f);
  admModal('Mensagem para ' + admNome(f), `
    <div class="sm">${wa ? 'Vai para +' + esc(wa) : 'Sem WhatsApp na ficha: o WhatsApp abre para você escolher o contato.'}${ADM.cfg && ADM.cfg.chave ? '' : ' · sem chave Pix: a mensagem vai sem o código.'}</div>
    <div class="chips" role="group" aria-label="Tipo de mensagem">${ADM_TIPOS.map(([k, t]) => `<button type="button" class="chip ${k === tipo ? 'on' : ''}" data-act="adm-tipo" data-id="${esc(id)}" data-v="${k}" aria-pressed="${k === tipo}">${t}</button>`).join('')}</div>
    <label class="sm b" for="adm-txt">Dá para mudar o texto antes de mandar</label>
    <textarea id="adm-txt" class="inp adm-txt" rows="12">${esc(admMsg(f, tipo, v))}</textarea>`,
  `<button type="button" class="btn btn-line" data-act="adm-copiar-txt">Copiar</button><button type="button" class="btn btn-wa" data-act="adm-wa" data-v="${esc(wa)}">Abrir o WhatsApp</button>`);
}
function admPix(id) {
  const f = ADM.fichas.find(x => x.id === id); if (!f) return;
  const v = asAlvo(f), cod = asPix(f, v, ADM.cfg);
  if (!cod) { toast('Falta a chave Pix: ponha uma vez em Mensalidades, no TI ARTES OS.'); return; }
  admModal('Pix de ' + admNome(f), `
    <div class="sm">${esc(asReal(f.valor))} · referente a ${esc(asFmtAno(v))} · cai direto na conta do estúdio</div>
    <div class="as-pix"><div class="as-qr" id="adm-qr"></div><div class="as-pix-tx"><textarea id="adm-cod" class="inp as-cod" rows="5" readonly aria-label="Pix copia e cola">${esc(cod)}</textarea></div></div>`,
  `<button type="button" class="btn btn-navy" data-act="adm-copiar-pix">Copiar o código</button><button type="button" class="btn btn-line" data-act="adm-cobrar" data-id="${esc(id)}">Mandar no WhatsApp</button>`);
  const c = asQr(cod, 260); if (c) $('adm-qr').appendChild(c);
}

/* ---------- cliques do ADM ---------- */
document.addEventListener('click', async e => {
  const modal = $('modal');
  if (modal && !modal.hidden && e.target === modal) { admFechar(); return; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, v = el.dataset.v || '', id = el.dataset.id || '';
  if (!a.startsWith('adm-')) return;
  if (a === 'adm-recarregar') { await admCarregar(true); render(); return; }
  if (a === 'adm-fechar') { admFechar(); return; }
  if (a === 'adm-ficha') { admFicha(v); return; }
  if (a === 'adm-salvar') { admSalvar(v); return; }
  if (a === 'adm-cobrar') { admCobrar(id); return; }
  if (a === 'adm-tipo') { const f = ADM.fichas.find(x => x.id === id); if (!f) return; $('adm-txt').value = admMsg(f, v, asAlvo(f)); document.querySelectorAll('[data-act="adm-tipo"]').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); }); return; }
  if (a === 'adm-copiar-txt') { asCopiar($('adm-txt').value, 'Mensagem copiada: cole no WhatsApp.'); return; }
  if (a === 'adm-wa') { const t = $('adm-txt').value; window.open('https://wa.me/' + (v || '') + '?text=' + encodeURIComponent(t), '_blank', 'noopener'); toast('WhatsApp aberto: confira e aperte enviar.'); return; }
  if (a === 'adm-pix') { admPix(id); return; }
  if (a === 'adm-copiar-pix') { asCopiar($('adm-cod').value, 'Código Pix copiado.'); return; }
  if (a === 'adm-recebi') { el.disabled = true; admRecebi(id, v); return; }
  if (a === 'adm-mes') {
    const f = ADM.fichas.find(x => x.id === id); if (!f) return;
    if (asPago(f, v)) { if (!confirm('Desmarcar o pagamento de ' + asFmt(v) + '?')) return; admRecebi(id, v, true); }
    else admRecebi(id, v);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') admFechar(); });
