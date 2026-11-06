/* ============================================================
   BACKUP MENSAL EM EXCEL (.xlsx) — no mesmo formato das planilhas
   que o Espaço já usa: Controle financeiro (uma aba por mês + ANO),
   Mensalidades (uma aba por mês, com o fechamento da yoga) e Lojinha.
   Depois vêm as abas de cadastro (alunos e fichas, presenças, equipe,
   eventos, pontos) e uma aba escondida com a cópia completa do app.
   Sem biblioteca externa e sem tela: o mesmo código roda no celular
   e na função do servidor que manda o backup todo dia 1º.
   ============================================================ */
const XLS = (() => {
  /* ---------- zip (sem compressão: abre em Excel, Google Planilhas e Numbers) ---------- */
  const T = new Uint32Array(256);
  for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(arquivos, quando = new Date()){
    const enc = new TextEncoder(), partes = [], central = [];
    const hora = (quando.getHours() << 11) | (quando.getMinutes() << 5) | (quando.getSeconds() >> 1);
    const dia = ((quando.getFullYear() - 1980) << 9) | ((quando.getMonth() + 1) << 5) | quando.getDate();
    let off = 0;
    arquivos.forEach(({nome, dados}) => {
      const n = enc.encode(nome), d = typeof dados === 'string' ? enc.encode(dados) : dados, crc = crc32(d);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, hora, true); h.setUint16(12, dia, true); h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true);
      h.setUint16(26, n.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), n, d);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, hora, true); c.setUint16(14, dia, true); c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true);
      c.setUint16(28, n.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), n);
      off += 30 + n.length + d.length;
    });
    const tamC = central.reduce((s, p) => s + p.length, 0);
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true); fim.setUint32(12, tamC, true); fim.setUint32(16, off, true);
    const tudo = [...partes, ...central, new Uint8Array(fim.buffer)], out = new Uint8Array(tudo.reduce((s, p) => s + p.length, 0));
    let i = 0; tudo.forEach(p => { out.set(p, i); i += p.length; });
    return out;
  }

  /* ---------- planilha ---------- */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const col = n => { let s = ''; n++; while (n){ const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
  const ref = (c, r) => col(c) + (r + 1);
  /* estilos: 0 normal · 1 cabeçalho · 2 R$ · 3 título · 4 data · 5 total R$ · 6 % · 7 negrito · 8 subtítulo · 9 nota · 10 inteiro · 11 total rótulo */
  const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00;\\-&quot;R$&quot;\\ #,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="0%"/></numFmts>
<fonts count="6"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="15"/><color rgb="FF0E7266"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="12"/><color rgb="FFA84A0E"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF6B6257"/><name val="Calibri"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0E7266"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE3C8"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5E3B8"/></patternFill></fill></fills>
<borders count="2"><border/><border><top style="thin"><color rgb="FF2C2B2B"/></top></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="12">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" xfId="0"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1" xfId="0"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" xfId="0"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyNumberFormat="1" xfId="0"/>
<xf numFmtId="164" fontId="3" fillId="3" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" xfId="0"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyNumberFormat="1" xfId="0"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1" xfId="0"/>
<xf numFmtId="0" fontId="4" fillId="4" borderId="0" applyFont="1" applyFill="1" xfId="0"/>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" applyFont="1" applyAlignment="1" xfId="0"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="1" fontId="0" fillId="0" borderId="0" applyNumberFormat="1" xfId="0"/>
<xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" xfId="0"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="0"/><tableStyles count="0"/>
</styleSheet>`;
  const serial = isoD => { const [y, m, d] = isoD.split('-').map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000; };

  /* uma aba: escreva células com put(); fórmulas com {f:'SUM(B4:B9)', s:5} */
  function aba(nome, opt = {}){
    const linhas = [], merges = [];
    const A = {nome: nome.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31), cor: opt.cor, larguras: opt.larguras || [], congela: opt.congela, escondida: !!opt.escondida, linhas, merges,
      put(r, c, v, s){ (linhas[r] = linhas[r] || [])[c] = {v, s}; return A; },
      linha(r, c0, vals, s){ vals.forEach((v, i) => { if (v !== undefined && v !== null && v !== '') A.put(r, c0 + i, v, Array.isArray(s) ? s[i] : s); }); return A; },
      junta(r, c0, c1){ merges.push(`${ref(c0, r)}:${ref(c1, r)}`); return A; },
    };
    return A;
  }
  function celula(r, c, cel){
    const {v, s} = cel, R = ref(c, r), st = s ? ` s="${s}"` : '';
    if (v && typeof v === 'object' && v.f) return `<c r="${R}"${v.s || s ? ` s="${v.s || s}"` : ''}><f>${esc(v.f)}</f></c>`;
    if (v && typeof v === 'object' && v.d) return `<c r="${R}" s="${s || 4}"><v>${serial(v.d)}</v></c>`;
    if (typeof v === 'number' && isFinite(v)) return `<c r="${R}"${st}><v>${Math.round(v * 100) / 100}</v></c>`;
    return `<c r="${R}" t="inlineStr"${st}><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  }
  function xmlAba(A){
    const cols = A.larguras.length ? `<cols>${A.larguras.map((w, i) => `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
    const pane = A.congela ? `<pane ySplit="${A.congela}" topLeftCell="A${A.congela + 1}" activePane="bottomLeft" state="frozen"/>` : '';
    const dados = A.linhas.map((ln, r) => ln ? `<row r="${r+1}">${ln.map((cel, c) => cel ? celula(r, c, cel) : '').join('')}</row>` : '').join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${A.cor ? `<sheetPr><tabColor rgb="FF${A.cor}"/></sheetPr>` : ''}<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${dados}</sheetData>${A.merges.length ? `<mergeCells count="${A.merges.length}">${A.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}</worksheet>`;
  }
  function livro(abas, {titulo = 'Backup', autor = 'App'} = {}){
    const agora = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const arqs = [
      {nome:'[Content_Types].xml', dados:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${abas.map((a, i) => `<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`},
      {nome:'_rels/.rels', dados:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`},
      {nome:'docProps/core.xml', dados:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(titulo)}</dc:title><dc:creator>${esc(autor)}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${agora}</dcterms:created></cp:coreProperties>`},
      {nome:'docProps/app.xml', dados:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Espaço Anirvana</Application></Properties>`},
      {nome:'xl/_rels/workbook.xml.rels', dados:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas.map((a, i) => `<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${abas.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
      {nome:'xl/workbook.xml', dados:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${abas.map((a, i) => `<sheet name="${esc(a.nome)}" sheetId="${i+1}"${a.escondida ? ' state="hidden"' : ''} r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`},
      {nome:'xl/styles.xml', dados:ESTILOS},
      ...abas.map((a, i) => ({nome:`xl/worksheets/sheet${i+1}.xml`, dados:xmlAba(a)})),
    ];
    return zip(arqs);
  }
  return {aba, livro, ref, col};
})();

/* ---------- o conteúdo do backup ---------- */
const MES_ABA = mes => `${MESES[+mes.slice(5) - 1]} ${mes.slice(2, 4)}`;
const COR = {fin:'0E7266', mens:'F47B2D', loja:'FFC526', cad:'9EC83C', info:'2C2B2B'};
function mesesDoBackup(ate = MES_ATUAL){ const out = []; for (let m = 1; m <= +ate.slice(5); m++) out.push(`${ate.slice(0, 4)}-${pad(m)}`); return out; }

function montarBackup(S, {ate = MES_ATUAL, quem = 'Administração', quando = HOJE} = {}){
  const meses = mesesDoBackup(ate), abas = [], rotTot = {};
  const fimMes = mes => fimDoMes(mes);

  /* LEIA-ME */
  const L = XLS.aba('LEIA-ME', {cor:COR.info, larguras:[30, 90]});
  L.put(0, 0, 'Espaço Anirvana · backup do app', 3);
  L.linha(2, 0, ['Gerado em', `${dataBR(iso(quando))}/${quando.getFullYear()} às ${pad(quando.getHours())}:${pad(quando.getMinutes())}`], [7, 0]);
  L.linha(3, 0, ['Por', quem], [7, 0]);
  L.linha(4, 0, ['Período', `janeiro a ${MESES[+ate.slice(5) - 1].toLowerCase()} de ${ate.slice(0, 4)}`], [7, 0]);
  L.linha(5, 0, ['Regra', 'Todo dia 1º o app gera este arquivo sozinho, manda para o e-mail do Espaço e guarda na pasta de backups. Ao fechar um mês, gera de novo.'], [7, 9]);
  let r = 7;
  L.put(r++, 0, 'O que tem em cada aba', 8);
  [
    ['Controle financeiro', 'Uma aba por mês, igual à planilha de vocês: saídas à esquerda, entradas à direita, TOTAL, saldo e totais por categoria. A aba ANO junta os 12 meses.'],
    ['Mensalidades', 'Uma aba por mês com a entrada de cada atividade, a parte da equipe e do Espaço, e o fechamento da yoga (ALUNOS / INSTRUTORAS).'],
    ['Lojinha', 'Todas as vendas por mês, com forma de pagamento, fornecedor e a parte de cada um. No topo, o fiado a receber. Na aba seguinte, o saldo com cada fornecedor.'],
    ['Alunos e fichas', 'Cadastro, ficha de inscrição, contato de emergência e autorizações (LGPD). A coluna de saúde é dado sensível: guarde o arquivo com cuidado.'],
    ['Presenças, Equipe, Eventos, Pontos', 'A chamada de cada aula, o repasse de cada pessoa por mês, os eventos com inscritos e os pontos dos alunos.'],
    ['(escondida) dados-app', 'A cópia completa do app, para restaurar tudo se um dia precisar. Não mexa nela.'],
  ].forEach(([a, b]) => L.linha(r++, 0, [a, b], [7, 9]));
  r++; L.put(r, 0, 'Os valores são os do app na hora do backup. Mexer neste arquivo não muda o app.', 9);
  abas.push(L);

  /* CONTROLE FINANCEIRO: uma aba por mês, mesmo desenho da planilha */
  meses.forEach(mes => {
    const b = balancoMes(S, mes), A = XLS.aba(MES_ABA(mes), {cor:COR.fin, larguras:[12, 14, 34, 26, 3, 12, 14, 34, 22], congela:3});
    const saidas = b.saidas.slice().sort((x, y) => x.d < y.d ? -1 : 1).map(l => [{d:l.d}, l.valor, l.desc, l.cat]);
    const entradas = [
      ...b.rec.linhas.filter(l => l.ea > 0).map(l => [{d:fimMes(mes)}, l.ea, ATIV[l.atv].nome, 'Atividades fixas']),
      ...(b.loja.ea > 0 ? [[{d:fimMes(mes)}, b.loja.ea, 'Lojinha', 'Atividades fixas']] : []),
      ...b.manualIn.slice().sort((x, y) => x.d < y.d ? -1 : 1).map(l => [{d:l.d}, l.valor, l.desc, l.cat]),
    ];
    const n = Math.max(saidas.length, entradas.length, 1), tot = 3 + n;
    A.put(0, 0, MESES[+mes.slice(5) - 1].toUpperCase(), 3).junta(0, 0, 3);
    A.put(0, 5, {f:`G${tot + 1}-B${tot + 1}`, s:5}).junta(0, 5, 8);
    A.put(1, 0, 'Saídas', 8).junta(1, 0, 3); A.put(1, 5, 'Entradas', 8).junta(1, 5, 8);
    A.linha(2, 0, ['Data', 'Valor', 'fornecedor', 'Categoria'], 1); A.linha(2, 5, ['Data', 'Valor', 'fornecedor', 'Categoria'], 1);
    saidas.forEach((l, i) => A.linha(3 + i, 0, l, [4, 2, 0, 0]));
    entradas.forEach((l, i) => A.linha(3 + i, 5, l, [4, 2, 0, 0]));
    A.put(tot, 0, 'TOTAL', 11).put(tot, 1, {f:`SUM(B4:B${tot})`, s:5}).put(tot, 5, 'TOTAL', 11).put(tot, 6, {f:`SUM(G4:G${tot})`, s:5});
    rotTot[mes] = tot + 1;
    let c = tot + 2;
    A.linha(c, 0, ['CATEGORIA', '', 'TOTAL'], [1, 1, 1]); A.linha(c, 5, ['CATEGORIA', '', 'TOTAL'], [1, 1, 1]);
    const catS = [...new Set([...Object.keys(CAT_SAIDA), ...b.saidas.map(l => l.cat)])], catE = [...new Set(['Atividades fixas', ...Object.keys(CAT_ENTRADA), ...b.manualIn.map(l => l.cat)])];
    catS.forEach((k, i) => { A.put(c + 1 + i, 0, k).junta(c + 1 + i, 0, 1).put(c + 1 + i, 2, {f:`SUMIF(D4:D${tot},"${k}",B4:B${tot})`, s:2}); });
    catE.forEach((k, i) => { A.put(c + 1 + i, 5, k).junta(c + 1 + i, 5, 6).put(c + 1 + i, 7, {f:`SUMIF(I4:I${tot},"${k}",G4:G${tot})`, s:2}); });
    const fimCat = c + 1 + Math.max(catS.length, catE.length) + 1;
    A.put(fimCat, 0, b.rec.fonte === 'planilha' ? 'Mensalidades deste mês vieram da planilha original.' : b.rec.fonte === 'exemplo' ? 'Mensalidades deste mês são exemplo do protótipo.' : 'Entradas de atividades já sem a parte da equipe; lojinha já sem a parte dos fornecedores.', 9);
    abas.push(A);
  });
  const ANO = XLS.aba('ANO' + ate.slice(0, 4), {cor:COR.fin, larguras:[16, 16, 3, 16, 3, 16]});
  ANO.put(0, 1, +ate.slice(0, 4), 3).put(0, 3, {f:'SUM(F3:F14)', s:5});
  ANO.linha(1, 1, ['Saídas', '', 'Entradas', '', 'Saldo'], [1, 0, 1, 0, 1]);
  for (let m = 0; m < 12; m++){
    const mes = `${ate.slice(0, 4)}-${pad(m + 1)}`, nomeA = MES_ABA(mes);
    ANO.put(2 + m, 0, MESES[m].toUpperCase(), 7);
    if (rotTot[mes]){ ANO.put(2 + m, 1, {f:`'${nomeA}'!B${rotTot[mes]}`, s:2}).put(2 + m, 3, {f:`'${nomeA}'!G${rotTot[mes]}`, s:2}); }
    ANO.put(2 + m, 5, {f:`D${3 + m}-B${3 + m}`, s:2});
  }
  ANO.put(14, 0, 'TOTAL', 11).put(14, 1, {f:'SUM(B3:B14)', s:5}).put(14, 3, {f:'SUM(D3:D14)', s:5}).put(14, 5, {f:'SUM(F3:F14)', s:5});
  abas.push(ANO);

  /* MENSALIDADES: uma aba por mês */
  const NOME_SECAO = {yoga:'YOGA + ACROYOGA', particular:'YOGA PARTICULAR', gestantes:'YOGA GESTANTES', meditacao:'MEDITAÇÃO', aquarela:'AQUARELA', musicalizacao:'MUSICALIZAÇÃO', violao:'VIOLÃO', ingles:'INGLÊS', massagem:'MASSAGEM TERAPÊUTICA', terapias:'TERAPIAS INTEGRAIS'};
  const DONO = {aquarela:'Bruno', musicalizacao:'Bruno S.', violao:'Bruno S.', ingles:'Marina', massagem:'Aurelice', terapias:'Kamala', yoga:'Instrutoras', particular:'Instrutora', gestantes:'Kamala', meditacao:'Kamala'};
  meses.forEach(mes => {
    const rec = receitaMes(S, mes), fy = fechamentoYoga(S, mes), M = XLS.aba('Mens. ' + MES_ABA(mes), {cor:COR.mens, larguras:[14, 30, 14, 30, 4, 16, 16, 14, 14, 14, 14]});
    M.put(0, 0, `ENTRADA ANIRVANA - ${MESES[+mes.slice(5) - 1].toUpperCase()}/${mes.slice(0, 4)}`, 3).junta(0, 0, 2).put(0, 3, rec.ea, 5);
    let r = 2;
    rec.linhas.forEach(l => {
      M.put(r++, 0, NOME_SECAO[l.atv] || ATIV[l.atv].nome.toUpperCase(), 8); M.junta(r - 1, 0, 3);
      M.linha(r++, 0, ['Data', 'Nome', 'Valor', 'Obs.'], 1);
      const ini = r;
      let itens = [];
      if (rec.fonte === 'app'){
        itens = S.pagamentos.filter(p => p.mes === mes).map(p => { const a = alunoPor(S, p.a), m = a && a.mats.find(x => x.id === p.mat); return m && m.atv === l.atv ? [{d:p.d}, a.nome, p.valor, `${p.metodo === 'cartao' ? 'cartão' : p.metodo}${m.plano ? ' · ' + PLANOS_YOGA[m.plano].nome : ''}${m.instr ? ' · ' + PESSOA[m.instr].nome : ''}`] : null; }).filter(Boolean)
          .concat(S.sessoes.filter(s => mesDe(s.d) === mes && s.atv === l.atv).map(s => [{d:s.d}, s.cliente, s.valor, `sessão com ${PESSOA[s.instr].nome}`]));
        itens.sort((x, y) => x[0].d < y[0].d ? -1 : 1);
      }
      if (!itens.length) itens = [['', rec.fonte === 'planilha' ? 'Total do mês (planilha original)' : 'Total do mês', l.bruto, rec.fonte === 'exemplo' ? 'valor de exemplo' : '']];
      itens.forEach(it => M.linha(r++, 0, it, [4, 0, 2, 9]));
      M.put(r, 0, 'TOTAL', 11).put(r, 1, '', 11).put(r, 2, {f:`SUM(C${ini + 1}:C${r})`, s:5}); const t = r + 1; r++;
      M.put(r, 1, `${DONO[l.atv] || 'Equipe'} (${Math.round(l.pct * 100)}%)`).put(r++, 2, {f:`C${t}*${l.pct}`, s:2});
      M.put(r, 1, `EA (${Math.round((1 - l.pct) * 100)}%)`).put(r++, 2, {f:`C${t}*${Math.round((1 - l.pct) * 100) / 100}`, s:2});
      r++;
    });
    /* FECHAMENTO YOGA — a aba "ALUNOS / INSTRUTORAS" */
    let c0 = 5, y = 2;
    M.put(y++, c0, 'FECHAMENTO YOGA', 8); M.junta(y - 1, c0, c0 + 6);
    M.put(y++, c0, 'ALUNOS / INSTRUTORAS', 7);
    const tipos = [['vazia', 'AULA VAZIA'], ['4x', 'Alunos 4x'], ['3x', 'Alunos 3x'], ['2x', 'Alunos 2x'], ['1x', 'Alunos 1x'], ['avulsa', 'Aula Avulsa']];
    M.linha(y++, c0, ['', ...tipos.map(t => t[1])], 1);
    const taxas = FECH_PLANILHA[mes] ? taxasYoga(Object.fromEntries(Object.entries(PLANOS_YOGA).map(([k, p]) => [k, p.preco]))) : taxasYoga(S.regras.planos, S.regras.pct.yoga);
    const vazia = FECH_PLANILHA[mes] ? FECH_PLANILHA[mes].aulaVazia : S.regras.aulaVazia;
    const linhaValor = y;
    M.put(y, c0, 'VALOR POR AULA', 7); tipos.forEach(([k], i) => M.put(y, c0 + 1 + i, k === 'vazia' ? vazia : taxas[k], 2)); y++;
    const iniI = y;
    fy.linhas.forEach(l => { M.put(y, c0, l.nome, 7); tipos.forEach(([k], i) => M.put(y, c0 + 1 + i, l.c[k] || 0, 10)); y++; });
    y++;
    M.put(y++, c0, 'A RECEBER (pela qtdade de alunos)', 7); M.junta(y - 1, c0, c0 + 3);
    fy.linhas.forEach((l, i) => {
      const rr = iniI + i + 1, soma = tipos.map((_, j) => `${XLS.col(c0 + 1 + j)}$${linhaValor + 1}*${XLS.col(c0 + 1 + j)}${rr}`).join('+');
      M.put(y, c0, l.nome).put(y++, c0 + 1, {f:soma, s:2});
    });
    M.put(y, c0, 'EXCEDENTE', 7).put(y, c0 + 1, fy.excedente ?? 0, 2).put(y++, c0 + 2, `${XLS.col(0) && ''}${(fy.porAula ?? 0).toFixed(2).replace('.', ',')} por aula`, 9);
    y++;
    M.put(y++, c0, 'TOTAL (alunos + excedente + particulares + gestantes + meditação)', 7); M.junta(y - 1, c0, c0 + 5);
    M.linha(y++, c0, ['Instrutora', 'Aulas', 'Yoga', 'Particular', 'Gestantes', 'Meditação', 'Total'], 1);
    fy.linhas.forEach(l => { M.linha(y, c0, [l.nome, l.aulas, l.yogaFinal, l.extras.particular, l.extras.gestantes, l.extras.meditacao], [7, 10, 2, 2, 2, 2]); M.put(y, c0 + 6, {f:`SUM(${XLS.col(c0 + 2)}${y + 1}:${XLS.col(c0 + 5)}${y + 1})`, s:5}); y++; });
    y++;
    const rep = repassesEquipe(S, mes);
    M.put(y++, c0, 'REPASSE DO MÊS (toda a equipe)', 8); M.junta(y - 1, c0, c0 + 6);
    M.linha(y++, c0, ['Pessoa', 'O que entra', '', '', '', 'Pago em', 'Total'], 1);
    rep.forEach(p => { M.linha(y, c0, [p.nome, p.itens.map(i => `${i.lab} ${brl(i.v)}`).join(' · ')], [7, 9]); M.junta(y, c0 + 1, c0 + 4); if (p.pago) M.put(y, c0 + 5, {d:p.pago.d}, 4); M.put(y, c0 + 6, p.total, 5); y++; });
    abas.push(M);
  });

  /* LOJINHA: igual à planilha (mês, produto, valor, forma, fornecedor, partes) */
  const LJ = XLS.aba('Lojinha', {cor:COR.loja, larguras:[14, 12, 40, 13, 16, 20, 15, 13, 10], congela:3});
  const aReceber = S.fiado.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0);
  LJ.put(0, 0, 'LOJINHA ANIRVANA', 3).junta(0, 0, 2).put(0, 6, 'A RECEBER!', 11).put(0, 7, aReceber, 5);
  LJ.linha(2, 0, ['MÊS', 'Data', 'Produto', 'Valor', 'Forma', 'Fornecedor', 'Fornecedor (R$)', 'EA (R$)', 'Repasse'], 1);
  let lr = 3; const totLoja = [];
  meses.forEach(mes => {
    const vs = S.vendas.filter(v => mesDe(v.d) === mes).sort((a, b) => a.d < b.d ? -1 : 1); if (!vs.length) return;
    const ultimoRep = f => S.repLoja.filter(x => x.forn === f).map(x => x.d).sort().pop() || '';
    const ini = lr;
    vs.forEach((v, i) => { const p = partesVenda(v), f = FORN[v.forn]; LJ.linha(lr++, 0, [i === 0 ? `${MESES[+mes.slice(5) - 1].toUpperCase()}/${mes.slice(0, 4)}` : '', {d:v.d}, v.desc + (v.evento ? ` (${v.evento})` : ''), v.valor, v.forma, !f ? v.forn : f.id === 'ea' ? 'EA' : f.curto || f.nome, p.forn, p.ea, !f || f.pct === 0 ? 'EA' : v.d <= ultimoRep(v.forn) ? 'ok' : 'a pagar'], [7, 4, 0, 2, 0, 0, 2, 2, 0]); });
    LJ.put(lr, 2, `TOTAL ${MESES[+mes.slice(5) - 1].toLowerCase()}/${mes.slice(0, 4)}`, 11).put(lr, 3, {f:`SUM(D${ini + 1}:D${lr})`, s:5}).put(lr, 6, {f:`SUM(G${ini + 1}:G${lr})`, s:5}).put(lr, 7, {f:`SUM(H${ini + 1}:H${lr})`, s:5});
    totLoja.push(lr + 1); lr += 2;
  });
  LJ.put(lr, 2, 'TOTAL DO ANO', 11).put(lr, 3, {f:totLoja.map(x => `D${x}`).join('+') || '0', s:5}).put(lr, 6, {f:totLoja.map(x => `G${x}`).join('+') || '0', s:5}).put(lr, 7, {f:totLoja.map(x => `H${x}`).join('+') || '0', s:5});
  abas.push(LJ);
  const LS = XLS.aba('Lojinha saldos', {cor:COR.loja, larguras:[24, 10, 16, 16, 16, 4, 26, 30, 14, 12]});
  LS.put(0, 0, 'Saldo com cada fornecedor', 3);
  LS.linha(2, 0, ['Fornecedor', '%', 'Vendido (parte dele)', 'Já pago', 'A pagar'], 1);
  saldoFornecedores(S).forEach((f, i) => LS.linha(3 + i, 0, [f.nome, f.pct, f.devido, f.pago, {f:`C${4 + i}-D${4 + i}`, s:5}], [7, 6, 2, 2, 5]));
  LS.put(0, 6, 'Fiado e descontar', 3);
  LS.linha(2, 6, ['Quem', 'O quê', 'Valor', 'Situação'], 1);
  S.fiado.forEach((f, i) => LS.linha(3 + i, 6, [f.cliente, f.desc, f.valor, f.pago ? `recebido ${dataBR(f.pagoEm || f.d)}` : `desde ${dataBR(f.d)}`], [7, 0, 2, 0]));
  LS.put(4 + Math.max(saldoFornecedores(S).length, S.fiado.length), 0, 'Produtos cadastrados', 3);
  { const r0 = 6 + Math.max(saldoFornecedores(S).length, S.fiado.length); LS.linha(r0, 0, ['Produto', 'Categoria', 'Preço', 'Fornecedor'], 1); (S.produtos || []).forEach((p, i) => LS.linha(r0 + 1 + i, 0, [p.nome, CATS_LOJA[p.cat]?.nome || '', p.preco, FORN[p.forn]?.nome || p.forn], [7, 0, 2, 0])); }
  abas.push(LS);

  /* ALUNOS E FICHAS */
  const AL = XLS.aba('Alunos e fichas', {cor:COR.cad, larguras:[24, 12, 16, 28, 22, 34, 12, 14, 26, 18, 18, 40, 30, 16, 12, 12, 12], congela:1});
  AL.linha(0, 0, ['Nome', 'Nascimento', 'WhatsApp', 'E-mail', 'Responsável', 'Atividades e planos', 'Desde', 'Situação', 'Busca', 'Experiência', 'Conheceu por', 'Saúde (dado sensível)', 'Emergência', 'Instrutoras veem saúde?', 'WhatsApp?', 'Imagem?', 'Pontos'], 1);
  S.alunos.forEach((a, i) => { const f = a.ficha || {}, c = (S.consent || {})[a.id] || {}, P = pontosAluno(S, a.id);
    AL.linha(1 + i, 0, [a.nome, a.nasc ? {d:a.nasc} : '', a.tel, a.email || '', a.resp ? `${a.resp} ${a.respTel || ''}` : '', a.mats.map(m => `${nomePlano(m).replace(/<[^>]+>/g, '')} ${brl(valorMat(S, m))} dia ${m.venc}${m.status !== 'ativo' ? ' (' + m.status + ')' : ''}`).join(' + '), {d:a.desde}, a.mats.every(m => m.status === 'cancelado') ? 'saiu' : 'ativo',
      (f.obj || '').split(',').filter(Boolean).join(', '), {nunca:'nunca praticou', ja:'já praticou', pratico:'pratica'}[f.exp] || '', f.como ? f.como + (f.indicou ? ` (${f.indicou})` : '') : '', f.temSaude === 'sim' ? f.saude : 'nada informado', f.emerg ? `${f.emerg} ${f.emergTel || ''}` : '', f.temSaude === 'sim' ? (f.saudeOk ? 'sim' : 'não') : '', c.whatsapp ? 'sim' : 'não', c.imagem ? 'sim' : 'não', P.total], [7, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10]); });
  abas.push(AL);
  const PG = XLS.aba('Pagamentos', {cor:COR.cad, larguras:[12, 24, 22, 12, 14, 12], congela:1});
  PG.linha(0, 0, ['Data', 'Aluno', 'Atividade', 'Mês', 'Valor', 'Forma'], 1);
  S.pagamentos.slice().sort((a, b) => a.d < b.d ? -1 : 1).forEach((p, i) => { const a = alunoPor(S, p.a), m = a && a.mats.find(x => x.id === p.mat); PG.linha(1 + i, 0, [{d:p.d}, a ? a.nome : '—', m ? ATIV[m.atv].nome : '', p.mes, p.valor, p.metodo === 'cartao' ? 'cartão' : p.metodo], [4, 0, 0, 0, 2, 0]); });
  abas.push(PG);
  const PR = XLS.aba('Presenças', {cor:COR.cad, larguras:[12, 8, 26, 16, 24, 12], congela:1});
  PR.linha(0, 0, ['Data', 'Hora', 'Turma', 'Quem deu', 'Aluno', 'Tipo'], 1);
  let pr = 1;
  Object.values(S.aulas).filter(a => a.feita).sort((a, b) => a.id < b.id ? -1 : 1).forEach(au => { const t = TURMA[au.turma], ps = S.presencas.filter(p => p.s === au.id);
    if (au.vazia || !ps.length) PR.linha(pr++, 0, [{d:au.d}, t.h, nomeTurma(t), PESSOA[au.instr].nome, 'aula vazia', ''], [4, 0, 0, 0, 9, 0]);
    ps.forEach(p => PR.linha(pr++, 0, [{d:au.d}, t.h, nomeTurma(t), PESSOA[au.instr].nome, p.a ? alunoPor(S, p.a)?.nome || '—' : (p.nome || 'Visitante'), p.t], [4, 0, 0, 0, 0, 0])); });
  abas.push(PR);
  const EQ = XLS.aba('Equipe', {cor:COR.cad, larguras:[16, ...meses.map(() => 13), 14]});
  EQ.put(0, 0, 'Repasse de cada pessoa por mês', 3);
  EQ.linha(2, 0, ['Pessoa', ...meses.map(m => MESES_C[+m.slice(5) - 1]), 'Total'], 1);
  const repM = Object.fromEntries(meses.map(m => [m, repassesEquipe(S, m)]));
  EQUIPE.forEach((p, i) => { EQ.put(3 + i, 0, p.nome, 7); meses.forEach((m, j) => { const x = repM[m].find(o => o.id === p.id); if (x) EQ.put(3 + i, 1 + j, x.total, 2); }); EQ.put(3 + i, 1 + meses.length, {f:`SUM(B${4 + i}:${XLS.col(meses.length)}${4 + i})`, s:5}); });
  abas.push(EQ);
  const EV = XLS.aba('Eventos', {cor:COR.cad, larguras:[26, 12, 8, 12, 8, 26, 12, 10]});
  EV.linha(0, 0, ['Evento', 'Dia', 'Hora', 'Valor', 'Vagas', 'Inscrito', 'Inscrição', 'Pago?'], 1);
  let er = 1; (S.eventos || []).forEach(e => { EV.linha(er++, 0, [e.nome, {d:e.data}, e.h, e.valor, e.vagas], [7, 4, 0, 2, 10]); e.inscritos.forEach(i => EV.linha(er++, 5, [alunoPor(S, i.a)?.nome || '—', {d:i.d}, i.pago ? 'sim' : 'não'], [0, 4, 0])); if (e.externos) EV.linha(er++, 5, [`${e.externos} de fora (link)`, '', 'sim']); er++; });
  abas.push(EV);
  const PT = XLS.aba('Pontos e inscrições', {cor:COR.cad, larguras:[24, 10, 10, 12, 16, 4, 24, 12, 22, 12]});
  PT.linha(0, 0, ['Aluno', 'Pontos', 'Saldo', 'Nível', 'App instalado'], 1);
  S.alunos.map(a => ({a, P:pontosAluno(S, a.id)})).sort((x, y) => y.P.total - x.P.total).forEach(({a, P}, i) => PT.linha(1 + i, 0, [a.nome, P.total, P.saldo, P.nivel, P.acoes.instalar ? 'sim' : 'não'], [0, 10, 10, 0, 0]));
  PT.linha(0, 6, ['Inscrição', 'Data', 'Atividade', 'Situação'], 1);
  (S.inscricoes || []).forEach((x, i) => PT.linha(1 + i, 6, [x.dados.nome, {d:x.d}, ATIV[x.dados.atv]?.nome || x.dados.atv, x.estado + (x.origem === 'forms' ? ' (Google Forms)' : '')], [0, 4, 0, 0]));
  abas.push(PT);

  /* cópia completa para restaurar (aba escondida, em pedaços de 30 mil letras) */
  const D = XLS.aba('dados-app', {escondida:true});
  const json = JSON.stringify(S); D.put(0, 0, `app Espaço Anirvana · versão ${S.v} · ${json.length} letras`);
  for (let i = 0, k = 1; i < json.length; i += 30000, k++) D.put(k, 0, json.slice(i, i + 30000));
  abas.push(D);

  return XLS.livro(abas, {titulo:`Backup Espaço Anirvana ${MESES[+ate.slice(5) - 1]} ${ate.slice(0, 4)}`, autor:quem});
}
const nomeBackup = (mes = MES_ATUAL) => `Anirvana-backup-${mes}.xlsx`;
