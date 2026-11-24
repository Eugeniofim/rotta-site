/* ============================================================
   INSCRIÇÃO NO APP (no lugar dos Google Forms) E FICHA DO ALUNO
   passo 1: a atividade · passos 2 a 4: as perguntas do formulário dela
   ============================================================ */
UI.insc = {passo:0, d:{}};
/* os grupos da inscrição (sem nome de instrutora: quem dá a aula muda, a atividade fica) */
function gruposAtv(){
  const resto = Object.keys(ATIV).filter(k => !FORMULARIOS.yoga.atvs.includes(k) && !FORMULARIOS.arte.atvs.includes(k) && !FORMULARIOS.criancas.atvs.includes(k));
  return [['Yoga e meditação', [...FORMULARIOS.yoga.atvs, ...resto]], ['Arte e música', [...FORMULARIOS.arte.atvs, ...FORMULARIOS.criancas.atvs]]];
}
/* menor valor por mês de cada atividade (para o cartão da inscrição) */
function precoAtv(k){
  if (k === 'yoga') return Math.min(...PLANOS_MENSAIS.map(p => S.regras.planos[p]));
  if (k === 'particular') return Math.min(...PLANOS_MENSAIS.map(p => (S.regras.planosPart || {})[p] ?? PLANOS_PART[p].preco));
  if (PLANOS_ATV[k]){ const vs = Object.values(((S.regras.planosAtv || {})[k]) || {}).filter(v => v > 0); return vs.length ? Math.min(...vs) : null; }
  return ATIV[k] && ATIV[k].valor ? +ATIV[k].valor : null;
}
function resumoAtv(k){
  const a = ATIV[k], v = precoAtv(k), ts = TURMAS.filter(t => t.atv === k && !t.aluno);
  const preco = v ? `${['yoga','particular'].includes(k) || PLANOS_ATV[k] ? 'a partir de ' : ''}${brl(v)}/mês` : 'valor pelo WhatsApp';
  const hor = a.combinar ? 'horário combinado' : a.vis === 'escolhido' ? 'presencial ou online' : ts.length ? `${ts.length} ${ts.length === 1 ? 'horário' : 'horários'} na semana` : 'horário a combinar';
  return `${preco} · ${hor}`;
}

function campoHTML(c, d){
  if (c.sec) return `<div class="insc-sec">${escapeH(c.sec)}</div>`;
  const id = 'f_' + c.k, v = d[c.k] ?? '', obr = c.obr ? '<span class="obr" aria-hidden="true">*</span>' : '';
  const lab = `<label for="${id}">${escapeH(c.l)}${obr}</label>${c.ajuda ? `<span class="help">${escapeH(c.ajuda)}</span>` : ''}`;
  if (c.tipo === 'multi' || c.tipo === 'escolha'){
    const multi = c.tipo === 'multi', ops = c.ops.map(o => Array.isArray(o) ? o : [o, o]), sel = String(v).split(',');
    return `<div class="field" data-campo="${c.k}"><label>${escapeH(c.l)}${obr}</label>${c.texto ? `<div class="termo-txt">${escapeH(c.texto)}</div>` : ''}${c.ajuda ? `<span class="help">${escapeH(c.ajuda)}</span>` : ''}
      <div class="optgrid">${ops.map(([k, l]) => `<button type="button" class="opt ${sel.includes(k) ? 'on' : ''}" data-act="${multi ? 'optMulti' : 'opt'}" data-grp="${id}" data-v="${escapeH(k)}"><span>${escapeH(l)}</span></button>`).join('')}</div><input type="hidden" id="${id}" value="${escapeH(v)}"></div>`;
  }
  if (c.tipo === 'aceite') return `<div class="field aceite"><p class="termo">${escapeH(c.l)}${obr}</p>
    <label class="aceite-op"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}><span>${escapeH(c.op)}</span></label></div>`;
  if (c.tipo === 'check') return `<label class="insc-check"><input type="checkbox" id="${id}" ${(v === '' ? c.padrao : v) ? 'checked' : ''}><span>${escapeH(c.l)}${obr}</span></label>`;
  const attrs = {data:'type="date" data-act-in="inscNasc"', tel:'type="tel" inputmode="tel" placeholder="(41) 9 0000-0000" autocomplete="tel"', email:'type="email" autocomplete="email"', cpf:'inputmode="numeric" placeholder="000.000.000-00" data-act-in="cpf"'}[c.tipo] || `type="text"${c.auto ? ` autocomplete="${c.auto}"` : ''}`;
  const campo = c.area ? `<textarea class="inp" id="${id}" rows="3">${escapeH(v)}</textarea>` : `<input class="inp" id="${id}" ${attrs} value="${escapeH(v)}">`;
  return `<div class="field ${c.menor ? 'menor-f' : ''}" ${c.menor && !ehMenor(d) ? 'hidden' : ''}>${lab}${campo}</div>`;
}
/* aquarela e violão: vale a resposta "é menor de idade?"; no yoga, a data de nascimento */
const ehMenor = d => { if (d.menor === 'sim') return true; if (d.menor === 'nao') return false; const i = idade(d.nasc); return i !== null && i < 18; };
/* passo do responsável só aparece para menor de idade */
function passoPula(p){ const F = formAtual(); return !!(F && p >= 1 && F.passos[p - 1] && F.passos[p - 1].soMenor && !ehMenor(UI.insc.d)); }
function formAtual(){ const d = UI.insc.d; return d.atv ? FORMULARIOS[formDe(d.atv)] : null; }
function camposDoPasso(p){ const F = formAtual(); if (!F || p < 1) return []; return [...F.passos[p - 1].campos, ...(p === F.passos.length ? CAMPOS_APP : [])]; }

function inscSalvar(){
  const d = UI.insc.d, val = id => { const el = $('#' + id); if (!el) return undefined; return el.type === 'checkbox' ? el.checked : el.value.trim(); };
  [['atv','iAtv'],['plano','iPlano'],['modo','iModo'],['turmas','iTur'],['instr','iInstr'],['experimental','iExpm']].forEach(([k, id]) => { const x = val(id); if (x !== undefined) d[k] = x; });
  camposDoPasso(UI.insc.passo).forEach(c => { if (!c.k) return; const x = val('f_' + c.k); if (x !== undefined) d[c.k] = c.tipo === 'cpf' ? cpfMascara(x) : x; });
}
function inscValida(p){
  const d = UI.insc.d, falta = [];
  if (p === 0){ if (!d.atv) falta.push('escolher a atividade'); return falta; }
  if (passoPula(p)) return falta;
  camposDoPasso(p).forEach(c => {
    if (!c.k || !c.obr || (c.menor && !ehMenor(d))) return;
    const v = d[c.k];
    if (v === undefined || v === '' || v === false) falta.push(c.c || c.l.split(/[?(]/)[0].trim().toLowerCase());
    else if (c.tipo === 'cpf' && !cpfOk(v)) falta.push('um CPF válido');
    else if (c.tipo === 'tel' && String(v).replace(/\D/g, '').length < 10) falta.push(`${(c.c || 'telefone').toLowerCase()} com DDD`);
    else if (c.tipo === 'data' && v > HOJE_ISO) falta.push('uma data de nascimento válida');
  });
  return falta;
}

function passoAtividade(d){
  const a = d.atv && ATIV[d.atv], turmas = a && !a.combinar ? TURMAS.filter(t => t.atv === d.atv && !t.aluno) : [];
  const opts = (grp, lista, sel, multi) => `<div class="optgrid">${lista.map(([k, l]) => `<button type="button" class="opt ${(multi ? (sel || '').split(',').includes(k) : sel === k) ? 'on' : ''}" data-act="${multi ? 'optMulti' : 'opt'}" data-grp="${grp}" data-v="${k}"><span>${l}</span></button>`).join('')}</div><input type="hidden" id="${grp}" value="${escapeH(sel || '')}">`;
  const cartao = `<p class="tiny muted">${ic('credit-card','sm')} No cartão de crédito ou débito, acréscimo de ${brl(S.regras.taxaCartao ?? TAXA_CARTAO)}.</p>`;
  const v = a && precoAtv(d.atv);
  return `${gruposAtv().map(([g, ks]) => ks.filter(k => ATIV[k]).length ? `<div class="insc-grupo"><div class="eyebrow">${g}</div><div class="atv-cards">${ks.filter(k => ATIV[k]).map(k => `<button type="button" class="atv-card ${d.atv === k ? 'on' : ''}" style="--c:${ATIV[k].hex}" data-act="opt" data-grp="iAtv" data-v="${k}"><span class="ico-b">${ic(ATIV[k].icon)}</span><span class="tx"><b>${ATIV[k].nome}</b><small>${resumoAtv(k)}</small></span>${d.atv === k ? `<span class="ok">${ic('check','sm')}</span>` : ''}</button>`).join('')}</div></div>` : '').join('')}
    <input type="hidden" id="iAtv" value="${escapeH(d.atv || '')}">
    ${a ? `<div class="insc-escolhas">
      ${d.atv === 'yoga' ? `<div class="field"><label>Plano</label>${opts('iPlano', PLANOS_MENSAIS.map(k => [k, `${PLANOS_YOGA[k].nome}<br><b class="num">${brl(S.regras.planos[k])}</b>`]), PLANOS_MENSAIS.includes(d.plano) ? d.plano : '2x')}${cartao}</div>` : ''}
      ${d.atv === 'particular' ? `<div class="field"><label>Plano do particular</label>${opts('iPlano', Object.keys(PLANOS_PART).map(k => [k, `${PLANOS_PART[k].nome}<br><b class="num">${brl((S.regras.planosPart || {})[k] ?? PLANOS_PART[k].preco)}</b>${k === 'avulsa' ? '' : '<span class="tiny muted"> /mês</span>'}`]), PLANOS_PART[d.plano] ? d.plano : '1x')}${cartao}</div>
        <div class="field"><label>Como você prefere</label>${opts('iModo', [['presencial', `${ic('house','sm')} Presencial, no Espaço`], ['online', `${ic('monitor','sm')} Online`]], d.modo || 'presencial')}</div>
        <p class="small muted">O dia e o horário a equipe combina com você pelo WhatsApp.</p>` : ''}
      ${PLANOS_ATV[d.atv] ? `<div class="field"><label>Plano</label>${opts('iPlano', Object.entries(PLANOS_ATV[d.atv]).map(([k, p]) => { const pv = ((S.regras.planosAtv || {})[d.atv] || {})[k]; return [k, `${p.nome}<br>${pv ? `<b class="num">${brl(pv)}</b>` : '<span class="tiny muted">valor pelo WhatsApp</span>'}`]; }), PLANOS_ATV[d.atv][d.plano] ? d.plano : Object.keys(PLANOS_ATV[d.atv])[0])}${cartao}</div>` : ''}
      ${!['yoga','particular'].includes(d.atv) && !PLANOS_ATV[d.atv] ? `<div class="li" style="padding:10px 12px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)"><span class="ico-b">${ic('wallet')}</span><div class="main-c"><span class="t">${v ? `${brl(v)} por mês` : 'Valor: a equipe passa pelo WhatsApp'}</span><span class="s">${v ? `no cartão, + ${brl(S.regras.taxaCartao ?? TAXA_CARTAO)}` : 'junto com a confirmação da matrícula'}</span></div></div>` : ''}
      ${turmas.length ? `<div class="field"><label>Horários que você prefere</label>${opts('iTur', turmas.map(t => [t.id, `${DIAS_L[t.dia]} ${t.h}${t.nome ? `<br><span class="tiny muted">${escapeH(t.nome)}</span>` : ''}`]), d.turmas, true)}</div>`
        : a.combinar ? `<p class="small muted">${ic('calendar','sm')} O horário você combina com o professor depois da inscrição.</p>` : a.vis !== 'escolhido' ? '<p class="small muted">Os horários desta atividade a equipe combina com você pelo WhatsApp.</p>' : ''}
      ${d.atv === 'particular' ? '' : `<label class="insc-check"><input type="checkbox" id="iExpm" ${d.experimental ? 'checked' : ''}><span>Quero fazer uma aula experimental antes</span></label>`}
    </div>` : ''}`;
}
function folhaInscricao(){
  const {passo, d} = UI.insc, F = formAtual();
  const titulos = ['Atividade', ...(F ? F.passos.map(p => p.t) : ['Você', 'Ficha', 'Combinados'])];
  if (UI.insc.minha){
    abrirFolha(`${folhaCab('Sua ficha', `${tituloForm(F, d.atv)} · ajuda a professora a cuidar de você.${pontosLigados() ? ' Vale +30 pontos.' : ''}`)}
    <div class="stack insc" id="inscCorpo">${camposDoPasso(passo).filter(c => !CAMPOS_APP.includes(c) || c.k === 'saudeOk').map(c => campoHTML(c, d)).join('')}
      <div class="sheet-foot"><button class="btn sec" data-act="fechar">Depois</button><button class="btn pri" data-act="salvarMinhaFicha">${ic('check')}Salvar ficha</button></div></div>`, {wide:true});
    return;
  }
  const corpo = passo === 0 ? passoAtividade(d) : camposDoPasso(passo).map(c => campoHTML(c, d)).join('');
  abrirFolha(`${folhaCab(F && passo > 0 ? tituloForm(F, d.atv) : 'Inscrição no Espaço Anirvana', `${F && passo > 0 ? F.sub + ' · ' : ''}Passo ${passo + 1} de 4 · ${titulos[passo]}`)}
  <div class="passos-insc">${titulos.map((t, i) => `<span class="${i < passo ? 'feito' : i === passo ? 'agora' : ''}"></span>`).join('')}</div>
  <div class="stack insc" id="inscCorpo">${corpo}
    ${passo === 3 ? `<p class="small muted">Depois de enviar, a equipe confirma pelo WhatsApp. A primeira cobrança só acontece quando a matrícula for confirmada.</p>` : ''}
    <div class="sheet-foot">${passo > 0 ? `<button class="btn sec" data-act="inscPasso" data-v="-1">Voltar</button>` : `<button class="btn sec" data-act="fechar">Cancelar</button>`}${passo < 3 ? `<button class="btn pri" data-act="inscPasso" data-v="1">Continuar${ic('arrow-right','sm')}</button>` : `<button class="btn sol" data-act="inscEnviar">${ic('check')}Enviar inscrição</button>`}</div>
  </div>`, {wide:true});
}
function folhaTermos(){
  abrirFolha(`${folhaCab('Termos de responsabilidade', 'Espaço Anirvana')}
  <div class="stack"><div class="termo-txt" style="max-height:none">Aqui entra o texto dos termos de responsabilidade que o Espaço já envia hoje para quem se inscreve no yoga (regras da prática, cuidados com a saúde, pagamento e cancelamento). No app de verdade cada aceite fica guardado com data, hora e a versão do texto.</div>
  <button class="btn pri" data-act="fecharTermos">Voltar para a inscrição</button></div>`);
}

/* ---------- ficha do aluno (administração e professora) ---------- */
function fichaDe(a){ return a.ficha || {}; }
function blocoFicha(a, modo){
  const f = fichaDe(a), F = FORMULARIOS[f.form] || FORMULARIOS[formDe(a.mats?.[0]?.atv)], r = f.respostas || {};
  const verSaude = modo === 'admin' || f.saudeOk;
  const campos = [...camposForm(F), CAMPOS_APP.find(c => c.k === 'indicou')];
  const fora = ['nome', 'termos', 'ciente', 'imagem', 'saudeOk', 'priv', 'whats'];
  const fmt = (c, v) => c.tipo === 'data' ? `${dataBR(v)}/${String(v).slice(0, 4)} · ${idade(v)} anos` : c.tipo === 'cpf' && modo !== 'admin' ? '•••.•••.•••-' + String(v).slice(-2) : v;
  const dados = campos.filter(c => !fora.includes(c.k) && !c.saude && (!c.adm || modo === 'admin') && r[c.k]);
  const saude = campos.filter(c => c.saude && r[c.k]);
  const nada = v => /^(n[aã]o|nenhum[a]?|normal|nada)\.?$/i.test(String(v).trim());
  const saudeHTML = !saude.length ? '<p class="small muted">Ficha de saúde ainda não preenchida.</p>' : verSaude ? `<div class="alert ${saude.some(c => !nada(r[c.k])) ? 'warn' : 'pri'}"><span class="ib">${ic('heart-pulse')}</span><div style="min-width:0;flex:1"><div class="t">Saúde · cuidado na prática</div>
      <div class="saude-lista">${saude.map(c => `<div><span>${escapeH(c.c)}</span><b>${escapeH(r[c.k])}</b></div>`).join('')}</div>${modo === 'admin' && !f.saudeOk ? '<div class="s" style="margin-top:6px"><b>Não autorizou mostrar para as professoras.</b></div>' : ''}</div></div>`
    : `<p class="small muted">${ic('lock','sm')} Tem ficha de saúde, mas a pessoa não autorizou mostrar para a equipe. Fale com a administração.</p>`;
  const cs = (S.consent || {})[a.id] || {whatsapp: r.whats !== false, imagem: r.imagem === 'sim'};
  return `<div><div class="eyebrow" style="margin-bottom:6px">Ficha de inscrição · ${escapeH(tituloForm(F, a.mats?.[0]?.atv))}</div>${saudeHTML}
    ${(r.formsExtra || []).length ? `<div class="list" style="margin-top:6px">${r.formsExtra.map(([h, v]) => `<div class="li" style="padding:8px 4px"><span class="small muted" style="width:120px;flex:none">${escapeH(h.length > 40 ? h.slice(0, 38) + '…' : h)}</span><span class="small" style="flex:1;min-width:0">${escapeH(v)}</span></div>`).join('')}</div>` : ''}
    <div class="list" style="margin-top:6px">${dados.map(c => `<div class="li" style="padding:8px 4px"><span class="small muted" style="width:120px;flex:none">${escapeH(c.c)}</span><span class="small" style="flex:1;min-width:0">${escapeH(fmt(c, r[c.k]))}</span></div>`).join('')}</div>
    <div class="row wrap small" style="margin-top:8px;gap:8px"><span class="pill ${cs.whatsapp ? 'ok' : 'neu'}">${ic(cs.whatsapp ? 'check' : 'x')}WhatsApp</span><span class="pill ${cs.imagem ? 'ok' : 'neu'}">${ic(cs.imagem ? 'check' : 'x')}Uso de imagem</span><span class="pill ${(r.termos || r.ciente) ? 'ok' : 'warn'}">${ic((r.termos || r.ciente) ? 'check' : 'circle-alert')}${F.crianca ? 'Ciente da mensalidade' : 'Termos aceitos'}</span></div></div>`;
}

/* ---------- administração: inscrições novas ---------- */
function cardInscricoes(){
  const novas = (S.inscricoes || []).filter(i => i.estado === 'nova');
  return `<div class="card" style="border-top:4px solid var(--sol)"><div class="card-h"><div><h3>Novas inscrições</h3><span class="sub">${novas.length ? `${novas.length} esperando confirmação` : 'Nenhuma esperando'}</span></div>
    <div class="row wrap"><button class="btn sec sm" data-act="linkInscricao">${ic('copy','sm')}Link da inscrição</button><button class="btn ghost sm" data-act="importarForms">${ic('layers','sm')}Importar do Google Forms</button></div></div>
    <div class="list">${novas.map(i => { const x = i.dados; return `<div class="li">${av(x.nome)}<div class="main-c"><span class="t">${escapeH(x.nome)}${i.origem === 'forms' ? ' <span class="tag">Google Forms</span>' : ''}${(x.conferir || []).length ? ' <span class="tag warn">conferir</span>' : ''}</span><span class="s">${ATIV[x.atv]?.nome || x.atv}${x.plano && x.atv === 'yoga' ? ' · ' + x.plano : ''} · ${dataBR(i.d)}${x.respNome && FORMULARIOS[formDe(x.atv)].crianca ? ' · resp. ' + escapeH(x.respNome) : ''}${x.experimental ? ' · quer aula experimental' : ''}</span></div><div class="end"><button class="btn ghost sm" data-act="verInscricao" data-v="${i.id}">Ver ficha</button><button class="btn pri sm" data-act="confirmarInscricao" data-v="${i.id}">Confirmar</button></div></div>`; }).join('') || '<p class="small muted">Quando alguém se inscrever pelo link, aparece aqui com a ficha completa.</p>'}</div></div>`;
}
function folhaImportar(){
  abrirFolha(`${folhaCab('Importar do Google Forms', 'Para trazer quem já se inscreveu pelos formulários antigos')}
  <div class="stack">
    <ol class="small" style="margin:0;padding-left:18px;display:grid;gap:6px"><li>Pode ser a planilha de alunos que vocês já têm (.xlsx do Excel) ou as respostas do Google Forms (<b>Respostas → Ver no Planilhas → Arquivo → Fazer download</b>, em Excel ou .csv).</li><li>Escolha abaixo de qual formulário é e envie o arquivo.</li><li>O app arruma sozinho o CPF sem o zero da frente, a data do Excel e o celular sem DDD, e mostra o que conferir.</li></ol>
    <div class="field"><label>De qual formulário é?</label><div class="optgrid">${[['yoga','Yoga'],['aquarela','Aquarela'],['musicalizacao','Musicalização'],['violao','Violão']].filter(([k]) => ATIV[k]).map(([k, l], i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-act="opt" data-grp="impAtv" data-v="${k}"><span>${l}</span></button>`).join('')}</div><input type="hidden" id="impAtv" value="yoga"></div>
    <label class="btn sol block" style="cursor:pointer">${ic('layers')}Escolher a planilha (.xlsx ou .csv)<input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" id="csvForms" hidden></label>
    <p class="tiny muted">Quem vier do Google Forms recebe o link para aceitar a política de privacidade no primeiro acesso.</p>
  </div>`);
}
/* Google Forms → planilha → CSV: cada coluna é uma pergunta, na mesma ordem do formulário */
function lerCSV(txt){
  const linhas = [], sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < txt.length; i++){
    const c = txt[i];
    if (aspas){ if (c === '"' && txt[i+1] === '"'){ campo += '"'; i++; } else if (c === '"') aspas = false; else campo += c; }
    else if (c === '"') aspas = true;
    else if (c === sep){ linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r'){ if (c === '\r' && txt[i+1] === '\n') i++; linha.push(campo); campo = ''; if (linha.some(x => x.trim())) linhas.push(linha); linha = []; }
    else campo += c;
  }
  linha.push(campo); if (linha.some(x => x.trim())) linhas.push(linha);
  return linhas;
}
const semAcento = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
/* planilha .xlsx (Excel / Google Planilhas): lê a primeira aba com dados, sem biblioteca.
   O .xlsx é um zip; o navegador descompacta com DecompressionStream. Devolve linhas como no CSV. */
async function lerXLSX(buf){
  const u8 = new Uint8Array(buf), dv = new DataView(buf), dec = new TextDecoder();
  let fim = -1; for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50){ fim = i; break; }
  if (fim < 0) throw new Error('não parece um arquivo .xlsx');
  const arqs = {}; let p = dv.getUint32(fim + 16, true);
  for (let k = 0, tot = dv.getUint16(fim + 10, true); k < tot; k++){
    const metodo = dv.getUint16(p + 10, true), tam = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    arqs[dec.decode(u8.subarray(p + 46, p + 46 + nl))] = {metodo, tam, off}; p += 46 + nl + xl + cl;
  }
  const abrir = async nome => {
    const a = arqs[nome]; if (!a) return null;
    const ini = a.off + 30 + dv.getUint16(a.off + 26, true) + dv.getUint16(a.off + 28, true), dados = u8.subarray(ini, ini + a.tam);
    if (a.metodo === 0) return dec.decode(dados);
    const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(fluxo).text();
  };
  const xml = t => new DOMParser().parseFromString(t || '<x/>', 'application/xml');
  const ss = [...xml(await abrir('xl/sharedStrings.xml')).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].filter(t => t.parentNode.nodeName !== 'rPh').map(t => t.textContent).join(''));
  const rels = Object.fromEntries([...xml(await abrir('xl/_rels/workbook.xml.rels')).getElementsByTagName('Relationship')].map(r => [r.getAttribute('Id'), r.getAttribute('Target')]));
  const abas = [...xml(await abrir('xl/workbook.xml')).getElementsByTagName('sheet')].map(sh => { const t = rels[sh.getAttribute('r:id')] || ''; return t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, ''); });
  const col = ref => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  for (const caminho of abas.length ? abas : ['xl/worksheets/sheet1.xml']){
    const linhas = [];
    for (const row of xml(await abrir(caminho)).getElementsByTagName('row')){
      const L = [];
      for (const c of row.getElementsByTagName('c')){
        const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0];
        L[col(c.getAttribute('r') || 'A')] = t === 's' ? ss[+(v && v.textContent)] ?? '' : t === 'inlineStr' ? (c.getElementsByTagName('is')[0] || {textContent:''}).textContent : t === 'b' ? (v && v.textContent === '1' ? 'Sim' : 'Não') : v ? v.textContent : '';
      }
      const linha = Array.from({length:L.length}, (_, i) => L[i] ?? '');
      if (linha.some(x => String(x).trim())) linhas.push(linha);
    }
    if (linhas.length > 1) return linhas;
  }
  return [];
}
/* data do Excel (número de dias desde 30/12/1899) → AAAA-MM-DD */
const serialISO = n => { const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n * 864e5)); return d.toISOString().slice(0, 10); };
/* celular: só números; sem DDD ganha o 41 (Pontal do Sul) e vai para conferir */
function normalizarTel(v){
  let d = String(v || '').replace(/\D/g, ''); const avisos = [];
  if (!d) return {v:'', avisos};
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  if (d.length === 8 || d.length === 9){ d = '41' + d; avisos.push('celular sem DDD (pus 41)'); }
  if (d.length === 10 && /[6-9]/.test(d[2])) avisos.push('celular parece sem o 9 da frente');
  if (d.length < 10 || d.length > 11) avisos.push('celular incompleto');
  const fmt = d.length === 11 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}` : d;
  return {v:fmt, avisos};
}
/* nome todo em maiúsculas (como vem de alguns formulários): SARA DA SILVA → Sara da Silva */
function nomeBonito(n){
  n = String(n || '').replace(/\s+/g, ' ').trim();
  if (n !== n.toUpperCase() || !/[A-ZÀ-Ý]/.test(n)) return n;
  return n.toLowerCase().split(' ').map((p, i) => i > 0 && ['de','da','do','das','dos','e'].includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
/* Google Forms → planilha (.csv ou .xlsx): cada coluna é uma pergunta, na mesma ordem do formulário.
   Devolve o relatório: quantas entraram, quem já era aluno e o que conferir em cada uma. */
function importarLinhas(L, atv){
  const rel = {n:0, novos:[], repetidos:[], conferir:[]};
  if (!L || L.length < 2) return rel;
  const F = FORMULARIOS[formDe(atv)], campos = camposForm(F), usado = new Set();
  /* liga cada coluna à pergunta: pelo começo do texto, na ordem */
  const mapa = L[0].map(h => {
    const n = semAcento(h); if (!n || n.startsWith('carimbo') || n === 'pontuacao') return null;
    const c = campos.find(c => !usado.has(c.k) && (semAcento(c.l).startsWith(n.slice(0, 18)) || n.startsWith(semAcento(c.l).slice(0, 18)) || (c.k === 'imagem' && n.includes('autoriz')) || (c.k === 'email' && /\be ?mail\b/.test(n))));
    if (c) usado.add(c.k); return c || null;
  });
  const dataISO = s => { s = String(s || '').trim(); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); if (/^\d{4,6}(\.\d+)?$/.test(s)) return serialISO(+s); const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? `${m[3]}-${pad(m[2])}-${pad(m[1])}` : ''; };
  const dig = x => String(x || '').replace(/\D/g, '');
  const jaTem = d => { const cpf = dig(d.cpf), tel = dig(d.tel).slice(-11);
    const igual = (c2, t2) => (cpf.length === 11 && dig(c2) === cpf) || (tel.length >= 10 && dig(t2).slice(-11) === tel);
    return S.alunos.some(a => igual(a.cpf, a.tel)) || (S.inscricoes || []).some(i => i.estado === 'nova' && igual(i.dados.cpf, i.dados.tel)); };
  L.slice(1).forEach(r => {
    const d = {atv, plano: atv === 'yoga' ? '2x' : '', priv:false, saudeOk:false, whats:true}, avisos = [], extra = [];
    mapa.forEach((c, i) => { let v = String(r[i] ?? '').trim();
      if (!c){ const h = String(L[0][i] || '').trim(); if (v && h && !/^(carimbo|pontua)/i.test(semAcento(h))) extra.push([h, v]); return; }
      if (c.tipo === 'data') v = dataISO(v) || v;
      else if (c.tipo === 'aceite') v = !!v;
      else if (c.k === 'imagem') v = /^sim/i.test(v) ? 'sim' : v ? 'nao' : '';
      else if (c.tipo === 'multi') v = v.split(/\s*[,;]\s*/).filter(Boolean).join(',');
      else if (c.tipo === 'cpf'){ const x = dig(v); v = cpfMascara(x.length >= 8 && x.length < 11 ? x.padStart(11, '0') : x); }   /* o Excel come o zero da frente */
      else if (c.tipo === 'tel'){ const t = normalizarTel(v); v = t.v; t.avisos.forEach(a => avisos.push((c.k === 'tel' ? '' : (c.c || '').toLowerCase() + ': ') + a)); }
      d[c.k] = v; });
    if (!d.nome) return;
    d.nome = nomeBonito(d.nome);
    if (F.id === 'arte'){ if (!d.tel && d.respTel) d.tel = d.respTel; d.menor = d.respNome ? 'sim' : (ehMenor(d) ? 'sim' : 'nao'); }
    if (jaTem(d)){ rel.repetidos.push(d.nome); return; }
    if (F.id === 'yoga' && d.cpf && !cpfOk(d.cpf)) avisos.push('CPF não confere');
    if (F.id === 'yoga' && !d.emergNome) avisos.push('sem contato de emergência');
    if (!d.tel) avisos.push('sem celular');
    if (extra.length) d.formsExtra = extra;
    if (avisos.length){ d.conferir = avisos; rel.conferir.push({nome:d.nome, avisos}); }
    (S.inscricoes = S.inscricoes || []).push({id:'in' + novoId(), d:HOJE_ISO, estado:'nova', origem:'forms', dados:d});
    rel.novos.push(d.nome); rel.n++;
  });
  return rel;
}
function importarForms(txt, atv){ return importarLinhas(lerCSV(txt), atv).n; }
async function importarArquivo(arquivo, atv){
  const xlsx = /\.xlsx$/i.test(arquivo.name) || /spreadsheetml/.test(arquivo.type);
  const L = xlsx ? await lerXLSX(await arquivo.arrayBuffer()) : lerCSV(await arquivo.text());
  return importarLinhas(L, atv);
}
function folhaRelatorioImport(rel, atv){
  abrirFolha(`${folhaCab(rel.n ? `${rel.n} ${rel.n === 1 ? 'inscrição trazida' : 'inscrições trazidas'}` : 'Nada novo nesse arquivo', `Formulário de ${ATIV[atv]?.curto || atv} · agora é só confirmar cada uma`)}
  <div class="stack">
    ${rel.conferir.length ? `<div class="alert warn"><span class="ib">${ic('circle-alert')}</span><div style="flex:1;min-width:0"><div class="t">Conferir antes de confirmar (${rel.conferir.length})</div><div class="list" style="margin-top:6px">${rel.conferir.map(x => `<div class="li" style="padding:6px 0"><div class="main-c"><span class="t">${escapeH(x.nome)}</span><span class="s">${x.avisos.map(escapeH).join(' · ')}</span></div></div>`).join('')}</div></div></div>` : ''}
    ${rel.repetidos.length ? `<p class="small muted">${ic('check','sm')} Já estavam no app (não entraram de novo): ${rel.repetidos.map(escapeH).join(', ')}.</p>` : ''}
    <p class="small">Elas aparecem em <b>Inscrições</b> com a etiqueta Google Forms. Ao confirmar cada uma, escolha o plano: vira aluno com a ficha completa.</p>
    <p class="tiny muted">Quem veio da planilha recebe o link para aceitar a política de privacidade no primeiro acesso ao app. A saúde só aparece para a professora depois que a pessoa autorizar no app.</p>
    <div class="sheet-foot"><button class="btn pri" data-act="fecharImport">${ic('check')}Ver as inscrições</button></div>
  </div>`);
}
function confirmarInscricao(id){
  const i = S.inscricoes.find(x => x.id === id), d = i.dados, F = FORMULARIOS[formDe(d.atv)];
  const aid = 'a' + novoId(), plano = d.atv === 'yoga' ? (PLANOS_MENSAIS.includes(d.plano) || ehPlataforma(d.plano) ? d.plano : '2x') : null, crianca = F.crianca || ehMenor(d);
  const part = d.atv === 'particular' ? (PLANOS_PART[d.plano] ? d.plano : '1x') : null;
  const pAtv = PLANOS_ATV[d.atv] ? (PLANOS_ATV[d.atv][d.plano] ? d.plano : Object.keys(PLANOS_ATV[d.atv])[0]) : null, vAtv = pAtv ? ((S.regras.planosAtv || {})[d.atv] || {})[pAtv] : null;
  const resp = crianca ? d.respNome || '' : '';
  const respostas = Object.fromEntries(Object.entries(d).filter(([k]) => !['atv','plano','modo','turmas','instr','experimental','conferir'].includes(k)));
  S.alunos.push({id:aid, nome:d.nome, desde:HOJE_ISO, obs: resp ? `Responsável: ${resp}${d.nasc ? ` · ${idade(d.nasc)} anos` : ''}` : '', status:'ativo', tel:d.tel || d.respTel || '', email:d.email || '', nasc:d.nasc || '', cpf:d.cpf || '', resp, respTel: F.crianca ? d.tel : crianca ? d.respTel || '' : '',
    ficha:{form:F.id, respostas, saudeOk: d.saudeOk !== false, completa: camposForm(F).every(c => !c.obr || c.menor && !crianca || d[c.k])},
    mats:[{id:aid + '-0', atv:d.atv, plano, planoPart:part, planoAtv:pAtv || undefined, online: part ? d.modo === 'online' : undefined, valor: plano ? null : part ? ((S.regras.planosPart || {})[part] ?? PLANOS_PART[part].preco) : vAtv ? vAtv : (+ATIV[d.atv].valor || S.alunos.flatMap(a => a.mats).find(m => m.atv === d.atv)?.valor || 150), turmas:(d.turmas || '').split(',').filter(Boolean), venc:Math.min(28, HOJE.getDate()), metodo:'pix', cartaoFim:null, instr:d.instr || null, status:'ativo', inicio:HOJE_ISO}]});
  (S.consent = S.consent || {})[aid] = {whatsapp: d.whats !== false, imagem: d.imagem === 'sim', whatsappEm: HOJE_ISO, imagemEm: HOJE_ISO};
  i.estado = 'confirmada'; i.aluno = aid;
  /* quem indicou ganha os pontos */
  if (d.indicou && pontosLigados()){ const q = d.indicou.trim().toLowerCase(), quem = S.alunos.find(x => x.id !== aid && (x.nome.toLowerCase() === q || x.nome.split(' ')[0].toLowerCase() === q.split(' ')[0] && q.split(' ').length === 1 || x.nome.toLowerCase().startsWith(q))); if (quem) ganhar('indicar', quem.id); }
  /* a equipe da atividade recebe o aviso com a ficha */
  S.caixa = S.caixa || {};
  const equipe = EQUIPE.filter(p => d.instr ? p.id === d.instr : p.atvs.includes(d.atv));
  equipe.forEach(p => (S.caixa['i:' + p.id] = S.caixa['i:' + p.id] || []).unshift({t:`Aluno novo: ${d.nome}`, s:`${ATIV[d.atv].curto} · a ficha já está no app`, icon:'user-plus', go:'alunos'}));
  (S.enviados = S.enviados || []).push({para:resp || d.nome, canal:'whatsapp', regra:'inscricao', quando:`hoje ${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`});
  return {aid, quem: equipe.map(p => p.nome)};
}

/* ---------- administração: tela de inscrições (botão no topo) ---------- */
function vInscricoes(){
  const ok = (S.inscricoes || []).filter(i => i.estado === 'confirmada').slice(-8).reverse();
  return `<div class="pagehead"><div><h1>Inscrições</h1><p>Quem quer começar no Espaço. Confirme a matrícula e a ficha vai direto para a professora.</p></div>
    <button class="btn sol" data-act="inscricaoBalcao">${ic('user-plus')}Nova inscrição</button></div>
  <div class="grid g3">
    <button class="card insc-atalho" data-act="linkInscricao"><span class="ico-b">${ic('copy')}</span><b>Copiar o link</b><span class="small muted">Para mandar no WhatsApp ou pôr na bio do Instagram</span></button>
    <button class="card insc-atalho" data-act="inscricaoBalcao"><span class="ico-b">${ic('clipboard-check')}</span><b>Inscrever no balcão</b><span class="small muted">A pessoa está aí? Preencha com ela, é o mesmo formulário</span></button>
    <button class="card insc-atalho" data-act="importarForms"><span class="ico-b">${ic('layers')}</span><b>Trazer do Google Forms</b><span class="small muted">Quem já respondeu os formulários antigos</span></button>
  </div>
  ${cardInscricoes()}
  <div class="split">
    <div class="card"><div class="card-h"><h3>Confirmadas por último</h3></div><div class="list">${ok.map(i => `<div class="li tap" data-act="verAluno" data-v="${i.aluno}" role="button" tabindex="0">${av(i.dados.nome)}<div class="main-c"><span class="t">${escapeH(i.dados.nome)}</span><span class="s">${ATIV[i.dados.atv]?.nome || ''} · ${dataBR(i.d)}</span></div>${ic('chevron-right','sm')}</div>`).join('') || '<p class="small muted">Nenhuma ainda.</p>'}</div></div>
    <div class="card"><div class="card-h"><div><h3>Cartaz da inscrição</h3><span class="sub">Aponte a câmera e faça a inscrição</span></div></div><div class="row" style="gap:16px;align-items:center"><div class="qr" style="width:130px;flex:none">${qrSVG(4242)}</div><div class="small"><b>rottaguide.com/anirvana</b><br>Yoga, gestantes, meditação, movimento consciente, aquarela, musicalização e violão.</div></div></div>
  </div>`;
}
