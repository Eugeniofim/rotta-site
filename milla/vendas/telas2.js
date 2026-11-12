/* TELAS DO MILLA VENDAS, parte 2 (12/11/2026): a ficha do lead, os vendedores e as comissões. */
'use strict';

/* ---------- a ficha (janela por cima) ---------- */
function vFicha(l) {
  const novo = !l.id;
  const sel = (nome, opcoes, atual, extra = '') => `<select class="inp" name="${nome}" ${extra}>${opcoes.map(([v, n]) => `<option value="${esc(v)}" ${atual === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  const vend = EH_ADMIN()
    ? `<label>Vendedor${sel('vendedor', [['', 'Direto (Eugênio)'], ...DB.vendedores.map(v => [v.id, v.nome])], l.vendedor || '')}</label>`
    : `<label>Vendedor<input class="inp" value="${esc(nomeVendedor(meuVendedor()))}" readonly></label>`;
  const pags = l.id ? DB.pagamentos.filter(p => p.lead === l.id).sort((a, b) => a.vence.localeCompare(b.vence)) : [];
  const venda = l.venda ? `<section class="ficha-venda" id="venda"><h3>Venda · ${esc((PLANOS[l.venda.plano] || {}).nome || '')}</h3>
      <div class="sm">Início ${fmtD(l.venda.inicio)} · ${esc(resumoVenda(l.venda))}</div>
      <div class="rolagem"><table class="tab tab-p"><thead><tr><th scope="col">Vence</th><th scope="col">Parcela</th><th scope="col">Valor</th><th scope="col">${EH_ADMIN() ? 'Vendedor 37,5%' : 'Sua parte'}</th><th scope="col">Situação</th></tr></thead>
      <tbody>${pags.map(p => `<tr><td>${fmtD(p.vence)}</td><td>${esc(TIPO_PAG[p.tipo] || '')}${p.ref ? ` <span class="sm">${esc(p.ref)}</span>` : ''}</td><td class="num">${fmtR(p.valor)}</td><td class="num">${p.vendedor ? fmtR(partes(p).vendedor) : '—'}</td><td>${situacao(p)}</td></tr>`).join('')}</tbody></table></div>
      ${EH_ADMIN() ? `<button type="button" class="btn btn-line btn-p" data-act="renovar" data-id="${esc(l.id)}">Renovar: mais ${l.venda.plano === 'anual' ? '1 ano' : '6 mensalidades'}</button>` : ''}</section>`
    : (EH_ADMIN() && l.id ? `<section class="ficha-venda" id="fechar"><h3>Fechou? Registre a venda</h3><div class="fg">
        <label class="lin2">Jeito de pagar${sel('plano', Object.entries(PLANOS).map(([k, p]) => [k, p.nome + ' · ' + p.resumo]), 'mensal', 'data-act="plano-escolhe"')}</label>
        <label>Implantação (R$)<input class="inp" name="v_implantacao" type="number" min="0" step="10" value="3700"></label>
        <label>Mensalidade ou ano (R$)<input class="inp" name="v_valor" type="number" min="0" step="10" value="460"></label>
        <label>Começa em<input class="inp" name="v_inicio" type="date" value="${hojeIso()}"></label>
        <span class="sm lin2">Gera as parcelas do contrato. A divisão de cada uma que entrar: 25% Ti Artes, 37,5% Eugênio, 37,5% ${esc(l.vendedor ? nomeVendedor(l.vendedor) : 'o vendedor (venda direta: 75% Eugênio)')}.</span>
        <button type="button" class="btn btn-navy btn-p lin2" data-act="fechar-venda" data-id="${esc(l.id)}">Registrar a venda e gerar as parcelas</button></div></section>` : '');
  const hist = (l.historico || []).slice(-6).reverse().map(h => `<li>${fmtD(h.em)} · ${esc(h.t)}</li>`).join('');
  return `<form class="modal-caixa" id="ficha-form" data-id="${esc(l.id || '')}" aria-label="${novo ? 'Novo lead' : 'Ficha de ' + esc(l.imobiliaria)}">
    <div class="ficha-topo"><div><span class="olho">${novo ? 'Novo lead' : esc(etapaNome(l.etapa))}</span><h2>${novo ? 'Quem é a imobiliária?' : esc(l.imobiliaria)}</h2></div>
      <button type="button" class="btn btn-line btn-p" data-act="fechar-modal" aria-label="Fechar">Fechar</button></div>
    <div class="fg">
      <label class="lin2">Imobiliária<input class="inp" name="imobiliaria" required maxlength="80" value="${esc(l.imobiliaria || '')}"></label>
      <label>Contato<input class="inp" name="contato" maxlength="60" value="${esc(l.contato || '')}"></label>
      <label>Cidade<input class="inp" name="cidade" maxlength="60" value="${esc(l.cidade || '')}"></label>
      <label>WhatsApp<input class="inp" name="whats" inputmode="tel" maxlength="20" value="${esc(l.whats || '')}" placeholder="(41) 99999-9999"></label>
      <label>E-mail<input class="inp" name="email" type="email" maxlength="120" value="${esc(l.email || '')}"></label>
      ${vend}
      <label>Calor${sel('calor', CALOR, l.calor || 'morno')}</label>
      <label>Etapa${sel('etapa', ETAPAS, l.etapa || 'novo')}</label>
      <label>Próximo passo: quando<input class="inp" name="proximo" type="date" value="${esc(l.proximo || '')}"></label>
      <label class="lin2">Próximo passo: o quê<input class="inp" name="passo" maxlength="80" value="${esc(l.passo || '')}" placeholder="Ex.: ligar para fechar, mandar a proposta"></label>
      <label class="lin2">Anotações<textarea class="inp" name="nota" rows="3" maxlength="1500">${esc(l.nota || '')}</textarea></label>
    </div>
    <div class="ficha-acoes"><button type="submit" class="btn btn-navy">Salvar</button>${l.whats ? `<a class="btn btn-wa" href="${esc(waDe(l.whats))}" target="_blank" rel="noopener" data-act="wa">${svg(ICO.whats)}Chamar no WhatsApp</a>` : ''}
      ${!novo ? `<span class="sm">${esc(ORIGENS[l.origem] || 'Cadastro manual')} · entrou em ${fmtD(l.criado)}</span>` : ''}</div>
    ${venda}
    ${hist ? `<section class="ficha-hist"><h3>O que mudou</h3><ul>${hist}</ul></section>` : ''}
  </form>`;
}
function resumoVenda(v) {
  if (v.plano === 'anual') return `${fmtR(v.ano)} do ano + ${fmtR(v.implantacao)} de implantação`;
  if (v.plano === 'semimpl') return `${fmtR(v.mensal)}/mês por ${v.meses || 12} meses, depois ${fmtR(v.depois || 460)}`;
  return `${fmtR(v.implantacao)} de implantação + ${fmtR(v.mensal)}/mês por ${v.meses || 6} meses`;
}
function situacao(p) {
  if (p.repassado) return `<span class="st st-ok">${p.vendedor ? 'Repassado ' + fmtD(p.repassado) : 'Recebido'}</span>`;
  if (p.recebido) return `<span class="st st-rec">Recebido ${fmtD(p.recebido)}</span>${EH_ADMIN() && p.vendedor ? ` <button type="button" class="btn btn-line btn-p" data-act="repassar" data-id="${esc(p.id)}">Repassei</button>` : ''}`;
  return `<span class="st ${p.vence < hojeIso() ? 'st-atr' : ''}">${p.vence < hojeIso() ? 'Atrasado' : 'Previsto'}</span>${EH_ADMIN() ? ` <button type="button" class="btn btn-line btn-p" data-act="receber" data-id="${esc(p.id)}">Recebi</button>` : ''}`;
}

/* ---------- VENDEDORES (só o Eugênio) ---------- */
function vVendedores() {
  const card = v => { const x = numerosDe(v.id);
    return `<article class="vend">${av(v.nome)}<div class="vend-tx"><b>${esc(v.nome)}</b><span class="sm">${esc([v.email || 'sem e-mail: ainda não entra no app', v.whats].filter(Boolean).join(' · '))}</span>
        <span class="vend-link"><code>${esc(linkDe(v.id))}</code><button type="button" class="btn btn-line btn-p" data-act="copiar" data-v="${esc(linkDe(v.id))}">Copiar o link</button></span></div>
      <dl class="vend-num"><div><dt>Em aberto</dt><dd>${x.abertos}</dd></div><div><dt>Quentes</dt><dd>${x.quentes}</dd></div><div><dt>Fechados</dt><dd>${x.fechados}</dd></div>
        <div><dt>A repassar</dt><dd>${fmtR(x.aRepassar)}</dd></div><div><dt>Já repassado</dt><dd>${fmtR(x.repassado)}</dd></div></dl></article>`; };
  return `${faixaCel()}<header class="topo"><div><h1>Vendedores <small>· quem traz cliente</small></h1></div></header>
    <div class="vend-lista">${DB.vendedores.map(card).join('') || '<div class="box sm">Nenhum vendedor ainda.</div>'}</div>
    <form class="box" id="vend-form"><b>Novo vendedor, ou completar um da lista</b><div class="sm">Para dar acesso a quem já está na lista, escreva o mesmo nome e o e-mail dele. Cada vendedor recebe um link próprio. Quem entra pelo site por esse link e preenche o formulário já cai na lista dele. Para ele entrar no app, use o e-mail dele: no primeiro acesso ele cria a própria senha.</div>
      <div class="fg fg3"><label>Nome<input class="inp" name="nome" required maxlength="40" placeholder="Ex.: Betão"></label>
        <label>E-mail<input class="inp" name="email" type="email" maxlength="120"></label>
        <label>WhatsApp<input class="inp" name="whats" inputmode="tel" maxlength="20"></label></div>
      <button type="submit" class="btn btn-navy btn-p">Pôr na lista</button></form>`;
}
function vMeuLink() {
  const v = vendedorDe(meuVendedor()) || { id: meuVendedor(), nome: nomeVendedor(meuVendedor()) };
  const msg = `Olá! Conheça a Milla, a atendente de IA que responde os clientes da sua imobiliária no WhatsApp 24 h: ${linkDe(v.id)}`;
  return `${faixaCel()}<header class="topo"><div><h1>Meu link</h1></div></header>
    <section class="box"><b>Este é o seu link de indicação</b><div class="vend-link"><code>${esc(linkDe(v.id))}</code><button type="button" class="btn btn-navy btn-p" data-act="copiar" data-v="${esc(linkDe(v.id))}">Copiar</button></div>
      <div class="sm">Quem abre o site da Milla por ele e preenche o formulário entra direto na sua lista de Leads. Se a imobiliária já estava com outro vendedor, ela continua com quem trouxe primeiro.</div>
      <a class="btn btn-wa btn-p" href="${esc('https://wa.me/?text=' + encodeURIComponent(msg))}" target="_blank" rel="noopener">${svg(ICO.whats)}Mandar o link no WhatsApp</a></section>
    <section class="box"><b>Como você ganha</b><div class="sm">Em cada pagamento que o cliente faz, a implantação e cada mensalidade, enquanto ele ficar: 25% ficam com a Ti Artes e os 75% se dividem meio a meio entre você e o Eugênio. Numa implantação de R$ 3.700, a sua parte é R$ 1.387,50; em cada mensalidade de R$ 460, R$ 172,50.</div></section>`;
}

/* ---------- COMISSÕES ---------- */
function vComissoes(S) {
  const ps = pagsVisiveis();
  const meses = [...new Set(ps.map(p => mesDe(p.vence)))].sort();
  const mes = meses.includes(S.mes) ? S.mes : (meses.includes(mesDe(hojeIso())) ? mesDe(hojeIso()) : meses[meses.length - 1] || mesDe(hojeIso()));
  const doMes = ps.filter(p => mesDe(p.vence) === mes).sort((a, b) => a.vence.localeCompare(b.vence));
  const rec = doMes.filter(p => p.recebido), soma = f => rec.reduce((s, p) => s + f(p), 0);
  const tot = EH_ADMIN()
    ? [['Recebido no mês', fmtR(soma(p => p.valor))], ['Ti Artes 25%', fmtR(soma(p => partes(p).tiartes))], ['Eugênio', fmtR(soma(p => partes(p).eugenio))], ['Vendedores', fmtR(soma(p => partes(p).vendedor))]]
    : [['Sua parte no mês', fmtR(soma(p => partes(p).vendedor))], ['Já repassado', fmtR(rec.filter(p => p.repassado).reduce((s, p) => s + partes(p).vendedor, 0))], ['A receber', fmtR(rec.filter(p => !p.repassado).reduce((s, p) => s + partes(p).vendedor, 0))], ['Ainda previsto', fmtR(doMes.filter(p => !p.recebido).reduce((s, p) => s + partes(p).vendedor, 0))]];
  const linha = p => { const l = leadDe(p.lead) || {}, x = partes(p);
    return `<tr><td>${fmtD(p.vence)}</td><th scope="row"><button type="button" class="lk" data-act="abrir" data-id="${esc(p.lead)}">${esc(l.imobiliaria || '—')}</button><span class="sm">${esc([TIPO_PAG[p.tipo], p.ref].filter(Boolean).join(' · '))}</span></th>
      <td class="num">${fmtR(p.valor)}</td>${EH_ADMIN() ? `<td class="num">${fmtR(x.tiartes)}</td><td class="num">${fmtR(x.eugenio)}</td><td class="num">${p.vendedor ? fmtR(x.vendedor) + ` <span class="sm">${esc(nomeVendedor(p.vendedor))}</span>` : '—'}</td>` : `<td class="num">${fmtR(x.vendedor)}</td>`}
      <td>${situacao(p)}</td></tr>`; };
  return `${faixaCel()}<header class="topo"><div><h1>Comissões <small>· ${EH_ADMIN() ? '25% Ti Artes, 37,5% Eugênio, 37,5% vendedor' : 'a sua parte: 37,5% de cada pagamento'}</small></h1></div></header>
    <div class="chips" role="group" aria-label="Mês">${meses.map(m => `<button type="button" class="chip ${m === mes ? 'on' : ''}" data-act="mes" data-v="${m}">${fmtMes(m)}</button>`).join('') || '<span class="sm">Ainda não há venda.</span>'}</div>
    <div class="kpis">${tot.map(([r, v], i) => `<div class="kpi ${i === 0 ? 'quente' : ''}"><span class="kpi-rot">${r}</span><b class="kpi-r">${v}</b></div>`).join('')}</div>
    <section class="bloco"><div class="rolagem"><table class="tab"><thead><tr><th scope="col">Vence</th><th scope="col">Cliente</th><th scope="col">Valor</th>${EH_ADMIN() ? '<th scope="col">Ti Artes</th><th scope="col">Eugênio</th><th scope="col">Vendedor</th>' : '<th scope="col">Sua parte</th>'}<th scope="col">Situação</th></tr></thead>
      <tbody>${doMes.map(linha).join('') || `<tr><td colspan="7" class="sm">Nenhuma parcela em ${fmtMes(mes)}.</td></tr>`}</tbody></table></div></section>
    <div class="sm">A comissão só conta quando o pagamento entra. ${EH_ADMIN() ? '"Recebi" marca que o cliente pagou; "Repassei" marca que a parte do vendedor foi paga a ele.' : 'Quando o Eugênio paga a sua parte, a parcela fica "Repassado".'}</div>`;
}
