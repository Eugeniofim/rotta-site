/* Clube Glikilovers — protótipo.
   Tudo fica no navegador (localStorage), então o clube e o painel conversam
   quando abertos no MESMO aparelho. Na versão de verdade isso vira um banco
   (Supabase) e o aviso chega em todos os celulares. */
(function () {
  const CHAVE = "glk_demo_v3";
  const CHAVE_EU = "glk_eu";

  const CANAIS = {
    maquina: "Máquina · Jockey Plaza",
    "loja-cwb": "Gliki Curitiba",
    "loja-pgua": "Gliki Paranaguá",
    delivery: "Delivery",
    caioba: "Caiobá"
  };
  const CIDADES = ["Curitiba", "Paranaguá", "Caiobá"];

  /* A nota só vale se for destes CNPJs. Falta saber se Caiobá tem CNPJ próprio. */
  const CNPJS = {
    "58476355000131": { canal: "loja-cwb", cidade: "Curitiba" },
    "42656312000106": { canal: "loja-pgua", cidade: "Paranaguá" }
  };
  /* Onde o prêmio é retirado: é o motivo de a pessoa ir até a loja. */
  const LOJAS = [
    { id: "loja-cwb", nome: "Curitiba", end: "R. Hildebrando de Araújo, 1035 · Jardim Botânico", mapa: "R. Hildebrando de Araújo, 1035, Jardim Botânico, Curitiba - PR" },
    { id: "loja-pgua", nome: "Paranaguá", end: "R. Manoel Corrêa, 622 · Costeira", mapa: "R. Manoel Corrêa, 622, Costeira, Paranaguá - PR" }
  ];

  /* Passaporte: um selo em cada cidade e um na máquina. É o que leva a pessoa a conhecer as outras lojas. */
  const PASSAPORTE = ["loja-pgua", "caioba", "loja-cwb", "maquina"];
  const NOME_SELO = { "loja-pgua": "Paranaguá", caioba: "Caiobá", "loja-cwb": "Curitiba", maquina: "Máquina do Jockey" };
  /* o selo que vale a pena sugerir primeiro para quem mora em cada cidade (o mais perto antes) */
  const PERTO = {
    Curitiba: ["maquina", "loja-cwb", "loja-pgua", "caioba"],
    "Paranaguá": ["loja-pgua", "caioba", "loja-cwb", "maquina"],
    "Caiobá": ["caioba", "loja-pgua", "loja-cwb", "maquina"]
  };
  /* Onde pode haver balcão. Loja sem CNPJ cadastrado (Caiobá, por enquanto) soma sem a nota. */
  const BALCOES = ["loja-pgua", "caioba", "loja-cwb"];

  const REGRAS_PADRAO = {
    pontosPorNota: 10,
    notasPorDia: 3,
    notaMeses: 1,
    pontosPorCookie: 10,
    validadeMeses: 3,
    bonusCadastro: 10,
    bonusIndicacao: 20,
    bonusSequencia: 30,
    premioPassaporte: "1 cookie recheado à escolha",
    dobro: null,
    presenteAniversario: "1 cookie tradicional na semana do aniversário"
  };
  const PREMIOS_PADRAO = [
    { id: "fa", faixa: "Fã", pontos: 50, nome: "Mini cookie" },
    { id: "bronze", faixa: "Bronze", pontos: 100, nome: "Cookie Tradicional" },
    { id: "prata", faixa: "Prata", pontos: 300, nome: "Cookie recheado à escolha" },
    { id: "ouro", faixa: "Ouro", pontos: 600, nome: "Potinho + cookie" },
    { id: "master", faixa: "Master", pontos: 1000, nome: "Caixa com 6 cookies" }
  ];

  const DIA = 86400000;
  const agora = () => Date.now();

  /* ---------- utilidades ---------- */
  const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function codigoNovo(tam = 6, rnd = Math.random) {
    let s = "";
    for (let i = 0; i < tam; i++) s += LETRAS[Math.floor(rnd() * LETRAS.length)];
    return s;
  }
  const limpaCodigo = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const mostraCodigo = (c) => (c.length === 6 ? c.slice(0, 3) + "-" + c.slice(3) : c);
  const soDigitos = (w) => String(w || "").replace(/\D/g, "");
  const dataBR = (t) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const dataHoraBR = (t) => new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  /* DDD + 8 últimos: o WhatsApp às vezes grava o celular sem o 9. */
  function chaveFone(w) {
    let x = soDigitos(w);
    if (x.length > 11 && x.startsWith("55")) x = x.slice(2);
    return x.length >= 10 ? x.slice(0, 2) + x.slice(-8) : "";
  }
  function mascaraFone(w) {
    const x = soDigitos(w).slice(0, 11);
    if (x.length <= 2) return x ? "(" + x : "";
    const meio = x.length === 11 ? 7 : 6;
    return `(${x.slice(0, 2)}) ${x.slice(2, meio)}${x.length > meio ? "-" + x.slice(meio) : ""}`;
  }

  /* ---------- nota fiscal ----------
     A chave de 44 números já diz, sem consultar ninguém: estado, ano/mês, CNPJ de quem emitiu,
     modelo, número e o dígito verificador. O QR da nota traz essa chave dentro do link da SEFAZ. */
  function dvChave(c43) {
    let peso = 2, soma = 0;
    for (let i = 42; i >= 0; i--) { soma += Number(c43[i]) * peso; peso = peso === 9 ? 2 : peso + 1; }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  }
  function achaChave(texto) {
    const t = String(texto || "");
    const m = t.match(/(?:^|\D)(\d{44})(?:\D|$)/);
    if (m) return m[1];
    const so = soDigitos(t);
    return so.length === 44 ? so : null;
  }
  function analisarNota(texto) {
    const c = achaChave(texto);
    if (!c) return null;
    return {
      chave: c, valida: dvChave(c.slice(0, 43)) === Number(c[43]),
      ano: 2000 + Number(c.slice(2, 4)), mes: Number(c.slice(4, 6)),
      cnpj: c.slice(6, 20), modelo: c.slice(20, 22), numero: String(Number(c.slice(25, 34)))
    };
  }
  function montaChave(cnpj, quando, rnd = Math.random) {
    const t = new Date(quando);
    const aamm = String(t.getFullYear()).slice(2) + String(t.getMonth() + 1).padStart(2, "0");
    const num = String(Math.floor(1000 + rnd() * 90000)).padStart(9, "0");
    const cod = String(Math.floor(rnd() * 99999999)).padStart(8, "0");
    const c43 = "41" + aamm + cnpj + "65" + "001" + num + "1" + cod;
    return c43 + dvChave(c43);
  }

  function semente(n) {
    return function () {
      n = (n * 1664525 + 1013904223) % 4294967296;
      return n / 4294967296;
    };
  }

  /* ---------- exemplo: um clube que já está rodando há um mês ---------- */
  function exemplo() {
    const rnd = semente(20261108);
    const nomes = ["Ana Clara M.", "Bruna S.", "Camila R.", "Diego F.", "Eduarda L.", "Felipe A.", "Gabriela P.", "Helena C.",
      "Isabela T.", "João Pedro B.", "Júlia N.", "Larissa G.", "Lucas V.", "Manuela D.", "Marina K.", "Mateus O.",
      "Nicole H.", "Pedro H.", "Rafaela Z.", "Sofia E.", "Thiago W.", "Valentina I.", "Vitória Q.", "Yasmin U."];
    const d = { regras: { ...REGRAS_PADRAO }, premios: PREMIOS_PADRAO.map((p) => ({ ...p })), membros: [], codigos: {}, notas: {}, lotes: [], resgates: [], avisos: [], criado: agora(), v4: true };

    const lotes = [
      { canal: "maquina", qtd: 240, dias: 20 }
    ];
    lotes.forEach((l, i) => {
      const lote = { id: "L" + (i + 1), data: agora() - l.dias * DIA, qtd: l.qtd, pontos: 10, canal: l.canal };
      d.lotes.push(lote);
      for (let k = 0; k < l.qtd; k++) d.codigos[codigoNovo(6, rnd)] = { lote: lote.id, pontos: 10, canal: l.canal, usadoPor: null, usadoEm: null };
    });

    const livres = (canal) => Object.entries(d.codigos).filter(([, c]) => c.canal === canal && !c.usadoPor);
    nomes.forEach((nome, i) => {
      const cidade = i % 3 === 0 ? "Paranaguá" : i % 5 === 0 ? "Caiobá" : "Curitiba";
      const desde = agora() - Math.floor(3 + rnd() * 27) * DIA;
      const mes = 1 + Math.floor(rnd() * 12);
      const dia = 1 + Math.floor(rnd() * 28);
      const m = {
        id: "M" + (1001 + i), nome, whats: "41 9" + String(80000000 + Math.floor(rnd() * 19999999)).slice(0, 8),
        niver: (i === 2 || i === 9) ? niverDaqui(i === 2 ? 2 : 5) : String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0"),
        cidade, desde, pontos: 0, total: 0, ultimo: desde, indicacao: codigoNovo(5, rnd), indicadoPor: null, extrato: []
      };
      lancar(m, d.regras.bonusCadastro, "Boas-vindas", null, desde);
      const compras = Math.floor(rnd() * (i < 6 ? 34 : 14));
      for (let k = 0; k < compras; k++) {
        const naMaquina = rnd() < 0.34 && cidade === "Curitiba";
        if (naMaquina) {
          const lista = livres("maquina");
          if (!lista.length) continue;
          const [cod, c] = lista[Math.floor(rnd() * lista.length)];
          const lote = d.lotes.find((x) => x.id === c.lote);
          const quando = Math.max(desde, lote.data) + Math.floor(rnd() * (agora() - Math.max(desde, lote.data)));
          c.usadoPor = m.id; c.usadoEm = quando;
          lancar(m, c.pontos, "Etiqueta " + mostraCodigo(cod), "maquina", quando);
        } else if (cidade === "Caiobá" && rnd() < 0.7) {
          // Caiobá ainda não tem CNPJ cadastrado: soma no balcão
          const quando = desde + Math.floor(rnd() * (agora() - desde));
          const q = 1 + Math.floor(rnd() * 3);
          lancar(m, q * d.regras.pontosPorCookie, `${q} cookie${q > 1 ? "s" : ""} no balcão`, "caioba", quando);
        } else {
          const fora = rnd() < 0.18; // de vez em quando compra em outra cidade
          const cnpj = (cidade === "Paranaguá") !== fora ? "42656312000106" : "58476355000131";
          const quando = desde + Math.floor(rnd() * (agora() - desde));
          const chave = montaChave(cnpj, quando, rnd);
          const nota = analisarNota(chave);
          d.notas[chave] = { membro: m.id, data: quando, canal: CNPJS[cnpj].canal, numero: nota.numero, pontos: d.regras.pontosPorNota };
          lancar(m, d.regras.pontosPorNota, "Nota fiscal nº " + nota.numero, CNPJS[cnpj].canal, quando);
        }
      }
      m.extrato.sort((a, b) => b.data - a.data);
      // quem já fechou o passaporte no exemplo já buscou o presente
      const s = selosDe(m);
      if (PASSAPORTE.every((c) => s[c])) {
        const quando = Math.max(...Object.values(s));
        m.passaporte = quando;
        d.resgates.push({ codigo: codigoNovo(6, rnd), membro: m.id, premio: "passaporte", nome: d.regras.premioPassaporte, pontos: 0, data: quando, entregue: quando + DIA, loja: null });
        m.extrato.unshift({ data: quando, pontos: 0, motivo: "Passaporte completo", canal: null });
        m.extrato.sort((a, b) => b.data - a.data);
      }
      d.membros.push(m);
    });

    // dois prêmios já trocados, um ainda esperando retirada
    const ricos = d.membros.filter((m) => m.pontos >= 100);
    ricos.slice(0, 3).forEach((m, i) => {
      const r = { codigo: codigoNovo(6, rnd), membro: m.id, premio: "bronze", nome: "Cookie Tradicional", pontos: 100, data: agora() - (i + 1) * 2 * DIA, entregue: i < 2 ? agora() - i * DIA : null, loja: i % 2 ? "loja-pgua" : "loja-cwb" };
      lancar(m, -100, "Trocou: Cookie Tradicional", null, r.data);
      d.resgates.push(r);
    });

    d.avisos.push(
      { id: "A1", data: agora() - 6 * DIA, titulo: "Sabor novo: Brigadeiro Belga", texto: "Chegou o clássico da Gliki com chocolate nobre. Já no delivery!", publico: "todos", alcance: 21 },
      { id: "A2", data: agora() - 1 * DIA, titulo: "Domingo tem inauguração", texto: "A 1ª máquina de cookies do Paraná abre no Jockey Plaza às 10h. Vem com a gente!", publico: "Curitiba", alcance: 13 }
    );
    return d;
  }
  function niverDaqui(dias) {
    const t = new Date(agora() + dias * DIA);
    return String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  }
  function lancar(m, pontos, motivo, canal, quando = agora()) {
    m.pontos = Math.max(0, m.pontos + pontos);
    if (pontos > 0) m.total += pontos;
    if (pontos > 0 && canal) m.ultimo = Math.max(m.ultimo || 0, quando);
    m.extrato.unshift({ data: quando, pontos, motivo, canal });
  }

  /* ---------- guardar e ler ---------- */
  function ler() {
    try {
      const s = localStorage.getItem(CHAVE);
      if (s) return atualizar(JSON.parse(s));
    } catch (e) {}
    const d = exemplo();
    gravar(d);
    return d;
  }
  /* quem já tinha o protótipo aberto ganha as regras novas sem perder o que fez */
  function atualizar(d) {
    d.notas = d.notas || {};
    d.regras = { ...REGRAS_PADRAO, ...d.regras };
    if (!d.v4) {
      if (!d.premios.some((p) => p.id === "fa")) d.premios.unshift({ ...PREMIOS_PADRAO[0] });
      d.v4 = true;
    }
    return d;
  }
  function gravar(d) {
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) {}
  }
  function mexer(fn) {
    const d = ler();
    const r = fn(d);
    gravar(d);
    return r;
  }

  /* ---------- regras do clube ---------- */
  function faixaDe(pontos, premios) {
    const lista = [...premios].sort((a, b) => a.pontos - b.pontos);
    let atual = null;
    lista.forEach((p) => { if (pontos >= p.pontos) atual = p; });
    const proximo = lista.find((p) => p.pontos > pontos) || null;
    return { atual, proximo };
  }
  function expiraEm(m, regras) {
    const t = new Date(m.ultimo || m.desde);
    t.setMonth(t.getMonth() + regras.validadeMeses);
    return t.getTime();
  }
  function aniversarioPerto(m) {
    if (!m.niver) return false;
    const [mm, dd] = m.niver.split("-").map(Number);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    for (let k = -1; k <= 7; k++) {
      const t = new Date(hoje.getTime() + k * DIA);
      if (t.getMonth() + 1 === mm && t.getDate() === dd) return true;
    }
    return false;
  }

  function premiaIndicacao(d, m, primeira) {
    if (!primeira || !m.indicadoPor) return;
    const quem = Clube.membro(d, m.indicadoPor);
    if (quem) lancar(quem, d.regras.bonusIndicacao, "Sua amiga " + m.nome.split(" ")[0] + " comprou");
  }

  /* ---------- o que deixa o clube esperto ---------- */
  const mesNum = (t) => { const x = new Date(t); return x.getFullYear() * 12 + x.getMonth(); };
  const mesAtual = () => { const x = new Date(); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0"); };
  const ehCompra = (e) => e.canal && e.pontos > 0 && !e.comp;

  /* selo -> data do primeiro, de cada lugar onde a pessoa já comprou */
  function selosDe(m) {
    const s = {};
    for (let i = m.extrato.length - 1; i >= 0; i--) {
      const e = m.extrato[i];
      if (ehCompra(e) && PASSAPORTE.includes(e.canal) && !s[e.canal]) s[e.canal] = e.data;
    }
    return s;
  }
  /* pontos em dobro num lugar, até o fim do mês em que foi ligado */
  function dobroAtivo(d) {
    const x = d.regras.dobro;
    return x && x.mes === mesAtual() ? x.canal : null;
  }
  const vezes = (d, canal) => (canal && dobroAtivo(d) === canal ? 2 : 1);
  /* meses seguidos com compra, contando este mês (ou a partir do passado, se ainda não comprou) */
  function seguidos(m) {
    const s = new Set(m.extrato.filter(ehCompra).map((e) => mesNum(e.data)));
    const h = mesNum(agora());
    const corte = m.seqBonus == null ? -1 : m.seqBonus;
    let k = s.has(h) ? h : h - 1, n = 0;
    while (s.has(k) && k > corte) { n++; k--; }
    return { n, esteMes: s.has(h) };
  }
  /* roda depois de toda compra: selo novo, passaporte completo, 3 meses seguidos */
  function depoisDaCompra(d, m, canal) {
    const r = {};
    if (PASSAPORTE.includes(canal) && !m.extrato.slice(1).some((e) => ehCompra(e) && e.canal === canal)) {
      r.selo = { canal, nome: NOME_SELO[canal], n: Object.keys(selosDe(m)).length, de: PASSAPORTE.length };
    }
    if (!m.passaporte && PASSAPORTE.every((c) => selosDe(m)[c])) {
      m.passaporte = agora();
      const res = { codigo: codigoNovo(6), membro: m.id, premio: "passaporte", nome: d.regras.premioPassaporte, pontos: 0, data: agora(), entregue: null, loja: null };
      d.resgates.push(res);
      lancar(m, 0, "Passaporte completo: " + res.nome, null);
      r.passaporte = res;
    }
    const b = d.regras.bonusSequencia;
    const q = seguidos(m);
    if (b > 0 && q.esteMes && q.n >= 3) {
      m.seqBonus = mesNum(agora());
      lancar(m, b, "3 meses seguidos na Gliki", null);
      r.sequencia = b;
    }
    return r;
  }
  /* a nota precisa ser da Gliki, deste mês ou do passado, e de compra */
  function checarNota(d, n) {
    if (!n) return { erro: "Não reconheci essa nota. Tente de novo ou digite os 44 números." };
    if (!n.valida) return { erro: "Esse número tem algum dígito errado. Confira e tente de novo." };
    const loja = CNPJS[n.cnpj];
    if (!loja) return { erro: "Essa nota não é da Gliki Sô." };
    if (!["65", "55", "59"].includes(n.modelo)) return { erro: "Esse documento não é uma nota de compra." };
    const hoje = new Date();
    const meses = (hoje.getFullYear() - n.ano) * 12 + (hoje.getMonth() + 1 - n.mes);
    if (meses < 0 || meses > d.regras.notaMeses) return { erro: `Essa nota é de ${String(n.mes).padStart(2, "0")}/${n.ano}. Valem as notas deste mês e do mês passado.` };
    return { loja };
  }
  const umaCompra = (d) => Math.max(1, d.regras.pontosPorNota);
  function quaseNoPremio(d, m) {
    const { proximo } = faixaDe(m.pontos, d.premios);
    return proximo && m.pontos > 0 && proximo.pontos - m.pontos <= umaCompra(d);
  }
  function vencendo(m, regras) {
    const falta = expiraEm(m, regras) - agora();
    return m.pontos > 0 && falta >= 0 && falta <= 15 * DIA;
  }
  const faltaUmSelo = (m) => !m.passaporte && Object.keys(selosDe(m)).length === PASSAPORTE.length - 1;

  /* "Sua próxima jogada": o que vale mais a pena para ESTA pessoa agora, no máximo 2 */
  function missoes(d, m) {
    const r = d.regras, lista = [];
    const perto = PERTO[m.cidade] || PERTO.Curitiba;
    const { proximo } = faixaDe(m.pontos, d.premios);
    const pode = [...d.premios].filter((p) => m.pontos >= p.pontos).sort((a, b) => b.pontos - a.pontos)[0];
    const esperando = d.resgates.some((x) => x.membro === m.id && !x.entregue);
    if (pode && !esperando) lista.push({ tipo: "troca", peso: 95, titulo: `Você já pode trocar: ${pode.nome}`,
      texto: proximo ? `Ou junte mais ${proximo.pontos - m.pontos} e troque por ${proximo.nome}.` : "Troque na aba Prêmios e busque na loja." });
    if (proximo && !(pode && !esperando)) {
      const falta = proximo.pontos - m.pontos;
      const compras = Math.ceil(falta / umaCompra(d));
      if (compras <= 2) lista.push({ tipo: "premio", peso: compras === 1 ? 90 : 60,
        titulo: compras === 1 ? `Mais 1 compra e você troca: ${proximo.nome}` : `Mais 2 compras e você troca: ${proximo.nome}`,
        texto: `Faltam ${falta} pontos. O prêmio você busca na loja.` });
    }
    const dias = Math.ceil((expiraEm(m, r) - agora()) / DIA);
    if (m.pontos > 0 && dias <= 15) lista.push({ tipo: "vence", peso: dias <= 7 ? 100 : 80,
      titulo: `Seus ${m.pontos} pontos vencem ${dias <= 0 ? "hoje" : dias === 1 ? "amanhã" : "em " + dias + " dias"}`,
      texto: "Qualquer compra renova o prazo de todos eles." });
    if (!m.passaporte) {
      const s = selosDe(m);
      const faltam = perto.filter((c) => !s[c]);
      const tem = PASSAPORTE.length - faltam.length;
      if (faltam.length === 1) lista.push({ tipo: "selo", peso: 85, titulo: `Falta 1 selo: ${NOME_SELO[faltam[0]]}`, texto: `Complete o passaporte e ganhe ${r.premioPassaporte}.` });
      else if (faltam.length) lista.push({ tipo: "selo", peso: 45, titulo: tem ? `Próximo selo: ${NOME_SELO[faltam[0]]}` : "Comece o seu passaporte", texto: `${tem} de ${PASSAPORTE.length} selos. Um em cada cidade e um na máquina: completo, vale ${r.premioPassaporte}.` });
    }
    const dob = dobroAtivo(d);
    if (dob) lista.push({ tipo: "dobro", peso: perto.indexOf(dob) <= 1 ? 88 : 50, titulo: `Pontos em dobro: ${NOME_SELO[dob] || CANAIS[dob]}`, texto: "Até o fim do mês, cada compra lá vale o dobro." });
    if (r.bonusSequencia > 0) {
      const q = seguidos(m);
      if (!q.esteMes && q.n >= 1) lista.push({ tipo: "seq", peso: q.n + 1 >= 3 ? 75 : 55,
        titulo: q.n + 1 >= 3 ? `Compre este mês e ganhe +${r.bonusSequencia}` : `Compre este mês: ${q.n + 1} meses seguidos`,
        texto: q.n + 1 >= 3 ? "É o 3º mês seguido na Gliki." : `No 3º mês seguido você ganha +${r.bonusSequencia} pontos.` });
    }
    return lista.sort((a, b) => b.peso - a.peso).slice(0, 2);
  }

  /* o que o painel sugere à Melissa, com o botão que já resolve */
  function sugestoes(d) {
    const r = d.regras, out = [];
    const t30 = agora() - 30 * DIA;
    const conta = {};
    PASSAPORTE.forEach((c) => (conta[c] = 0));
    d.membros.forEach((m) => m.extrato.forEach((e) => { if (ehCompra(e) && e.data >= t30 && e.canal in conta) conta[e.canal]++; }));
    const dob = dobroAtivo(d);
    if (dob) {
      const desde = r.dobro.desde || 0;
      const n = d.membros.reduce((s, m) => s + m.extrato.filter((e) => ehCompra(e) && e.canal === dob && e.data >= desde).length, 0);
      out.push({ tipo: "dobro-ligado", canal: dob, titulo: `Pontos em dobro em ${NOME_SELO[dob]}`, texto: `${n} compra${n === 1 ? "" : "s"} lá desde que você ligou. Desliga sozinho no fim do mês.`, botao: "Desligar agora" });
    } else {
      const lojas = BALCOES.map((c) => ({ c, n: conta[c] })).sort((a, b) => a.n - b.n);
      const fraca = lojas[0], forte = lojas[lojas.length - 1];
      if (forte.n >= 6 && fraca.n * 2 <= forte.n) out.push({ tipo: "dobro", canal: fraca.c, titulo: `${NOME_SELO[fraca.c]} está mais parada`,
        texto: `${fraca.n} compra${fraca.n === 1 ? "" : "s"} no clube em 30 dias, contra ${forte.n} em ${NOME_SELO[forte.c]}. Ligar pontos em dobro lá até o fim do mês?`, botao: "Ligar o dobro" });
    }
    const avisa = (publico, titulo, texto, modelo) => { const n = Clube.publico(d, publico).length; if (n) out.push({ tipo: "aviso", publico, titulo: titulo(n), texto, botao: "Avisar", modelo }); };
    avisa("vencendo", (n) => `${n} ${n === 1 ? "pessoa perde" : "pessoas perdem"} os pontos em até 15 dias`, "Um aviso lembra que uma compra renova o prazo.",
      ["Seus pontos vencem logo", "Uma compra na Gliki renova o prazo de todos os seus pontos. Não deixa vencer!"]);
    avisa("quase", (n) => `${n} ${n === 1 ? "pessoa está" : "pessoas estão"} a 1 compra de um prêmio`, "Quem sabe que falta pouco volta antes.",
      ["Falta 1 compra para o seu prêmio", "Mais uma compra na Gliki e você já troca seus pontos. Passa aqui?"]);
    avisa("passaporte", (n) => `${n} ${n === 1 ? "pessoa está" : "pessoas estão"} a 1 selo do passaporte`, `Completo, o passaporte vale ${r.premioPassaporte}.`,
      ["Falta 1 selo no seu passaporte", `Complete o Passaporte Gliki e ganhe ${r.premioPassaporte}. Veja qual falta no clube.`]);
    return out;
  }

  const Clube = {
    CANAIS, CIDADES, CNPJS, LOJAS, REGRAS_PADRAO, PREMIOS_PADRAO, PASSAPORTE, NOME_SELO, BALCOES,
    /* quantas compras até o prêmio mais barato, contando as boas-vindas */
    comprasAtePrimeiro(d) { const p = Math.min(...d.premios.map((x) => x.pontos)); return { n: Math.max(1, Math.ceil((p - d.regras.bonusCadastro) / umaCompra(d))), premio: d.premios.find((x) => x.pontos === p) }; },
    mascaraFone, chaveFone, analisarNota, checarNota, selosDe, dobroAtivo, missoes, sugestoes, seguidos,
    temCNPJ(canal) { return Object.values(CNPJS).some((x) => x.canal === canal); },
    ligarDobro(canal) { return mexer((d) => { d.regras.dobro = canal ? { canal, mes: mesAtual(), desde: agora() } : null; }); },
    notaExemplo() { return montaChave("58476355000131", agora()); },
    ler, mexer, codigoNovo, limpaCodigo, mostraCodigo, soDigitos, dataBR, dataHoraBR, faixaDe, expiraEm, aniversarioPerto,

    eu() { try { return localStorage.getItem(CHAVE_EU); } catch (e) { return null; } },
    entrarComo(id) { try { id ? localStorage.setItem(CHAVE_EU, id) : localStorage.removeItem(CHAVE_EU); } catch (e) {} },
    membro(d, id) { return d.membros.find((m) => m.id === id) || null; },
    porWhats(d, w) { const x = chaveFone(w); return x ? d.membros.find((m) => chaveFone(m.whats) === x) : null; },
    guardarAniversario(id, niver) { return mexer((d) => { const m = Clube.membro(d, id); if (m) m.niver = niver; return m; }); },

    cadastrar({ nome, whats, niver = null, cidade = null, indicacao }) {
      return mexer((d) => {
        const ja = Clube.porWhats(d, whats);
        if (ja) return { membro: ja, novo: false };
        const m = { id: "M" + (1001 + d.membros.length + Math.floor(Math.random() * 90)), nome: nome.trim(), whats: whats.trim(), niver, cidade, desde: agora(), pontos: 0, total: 0, ultimo: agora(), indicacao: codigoNovo(5), indicadoPor: null, extrato: [] };
        lancar(m, d.regras.bonusCadastro, "Boas-vindas");
        const quem = indicacao && d.membros.find((x) => x.indicacao === limpaCodigo(indicacao));
        if (quem) { m.indicadoPor = quem.id; lancar(m, d.regras.bonusIndicacao, "Indicação de " + quem.nome.split(" ")[0]); }
        d.membros.push(m);
        return { ok: true, membro: m, novo: true, indicadoPor: quem || null };
      });
    },

    /* O coração do clube: o código único da etiqueta. Serve na máquina, na loja e no delivery. */
    usarCodigo(idMembro, bruto) {
      return mexer((d) => {
        const cod = limpaCodigo(bruto);
        const c = d.codigos[cod];
        const m = Clube.membro(d, idMembro);
        if (!m) return { ok: false, erro: "Entre no clube para guardar seus pontos." };
        if (!c) return { ok: false, erro: "Não achei esse código. Confira as letras da etiqueta." };
        if (c.usadoPor) return { ok: false, erro: `Esse código já foi usado em ${dataBR(c.usadoEm)}.` };
        c.usadoPor = m.id; c.usadoEm = agora();
        const primeira = !m.extrato.some((e) => e.canal);
        const x = vezes(d, c.canal);
        lancar(m, c.pontos * x, "Etiqueta " + mostraCodigo(cod) + (x > 1 ? " (em dobro)" : ""), c.canal);
        const extra = depoisDaCompra(d, m, c.canal);
        premiaIndicacao(d, m, primeira);
        return { ok: true, pontos: c.pontos * x, dobro: x > 1, canal: c.canal, saldo: m.pontos, tipo: "Etiqueta da máquina", ...extra };
      });
    },

    /* Cada nota pontua uma vez só, e só se for da Gliki. */
    usarNota(idMembro, texto) {
      return mexer((d) => {
        const m = Clube.membro(d, idMembro);
        if (!m) return { ok: false, erro: "Entre no clube para guardar seus pontos." };
        const n = analisarNota(texto);
        const ch = checarNota(d, n);
        if (ch.erro) return { ok: false, erro: ch.erro };
        const loja = ch.loja;
        const ja = d.notas[n.chave];
        if (ja) return { ok: false, erro: ja.balcao ? `Essa nota já pontuou no balcão em ${dataBR(ja.data)}.` : ja.membro === m.id ? `Você já pontuou essa nota em ${dataBR(ja.data)}.` : `Essa nota já foi usada em ${dataBR(ja.data)}.` };
        const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0);
        const deHoje = Object.values(d.notas).filter((x) => x.membro === m.id && !x.balcao && x.data >= inicioDia.getTime()).length;
        if (deHoje >= d.regras.notasPorDia) return { ok: false, erro: `Você já pontuou ${deHoje} notas hoje. Guarde esta e volte amanhã.` };
        const primeira = !m.extrato.some((e) => e.canal);
        const x = vezes(d, loja.canal);
        const pts = d.regras.pontosPorNota * x;
        d.notas[n.chave] = { membro: m.id, data: agora(), canal: loja.canal, numero: n.numero, pontos: pts };
        lancar(m, pts, "Nota fiscal nº " + n.numero + (x > 1 ? " (em dobro)" : ""), loja.canal);
        if (!m.cidade) m.cidade = loja.cidade;
        const extra = depoisDaCompra(d, m, loja.canal);
        premiaIndicacao(d, m, primeira);
        return { ok: true, pontos: pts, dobro: x > 1, canal: loja.canal, saldo: m.pontos, tipo: "Nota fiscal nº " + n.numero, ...extra };
      });
    },

    trocar(idMembro, idPremio, idLoja) {
      return mexer((d) => {
        const m = Clube.membro(d, idMembro);
        const p = d.premios.find((x) => x.id === idPremio);
        if (!m || !p) return { ok: false, erro: "Prêmio não encontrado." };
        if (m.pontos < p.pontos) return { ok: false, erro: `Faltam ${p.pontos - m.pontos} pontos.` };
        const r = { codigo: codigoNovo(6), membro: m.id, premio: p.id, nome: p.nome, pontos: p.pontos, data: agora(), entregue: null, loja: idLoja || null };
        lancar(m, -p.pontos, "Trocou: " + p.nome);
        d.resgates.push(r);
        return { ok: true, resgate: r };
      });
    },

    entregar(bruto) {
      return mexer((d) => {
        const r = d.resgates.find((x) => x.codigo === limpaCodigo(bruto));
        if (!r) return { ok: false, erro: "Esse código de prêmio não existe." };
        if (r.entregue) return { ok: false, erro: `Esse prêmio já foi entregue em ${dataHoraBR(r.entregue)}.` };
        r.entregue = agora();
        return { ok: true, resgate: r, membro: Clube.membro(d, r.membro) };
      });
    },

    /* No balcão a atendente lê a nota da compra: pontua por cookie e a nota fica usada,
       então a mesma compra não pontua de novo pelo celular. Se a cliente já tinha lido a nota,
       o balcão só completa a diferença. Loja sem CNPJ cadastrado ainda soma sem nota. */
    pontuarBalcao(idMembro, cookies, canalBalcao, textoNota) {
      return mexer((d) => {
        const m = Clube.membro(d, idMembro);
        if (!m) return { ok: false, erro: "Cliente não encontrada." };
        let canal = canalBalcao, n = null, jaTinha = 0;
        if (textoNota && String(textoNota).trim()) {
          n = analisarNota(textoNota);
          const ch = checarNota(d, n);
          if (ch.erro) return { ok: false, erro: ch.erro };
          const ja = d.notas[n.chave];
          if (ja && ja.membro !== m.id) return { ok: false, erro: `Essa nota já foi usada por outra pessoa em ${dataBR(ja.data)}.` };
          if (ja && ja.balcao) return { ok: false, erro: `Essa nota já foi somada no balcão em ${dataHoraBR(ja.data)}.` };
          jaTinha = ja ? ja.pontos : 0;
          canal = ch.loja.canal;
        } else if (Clube.temCNPJ(canalBalcao)) {
          return { ok: false, precisaNota: true, erro: "Leia a nota desta compra. É ela que impede a mesma compra de pontuar duas vezes." };
        }
        const x = vezes(d, canal);
        const total = cookies * d.regras.pontosPorCookie * x;
        const pts = Math.max(0, total - jaTinha);
        const primeira = !m.extrato.some((e) => e.canal);
        if (n) d.notas[n.chave] = { membro: m.id, data: agora(), canal, numero: n.numero, pontos: total, balcao: true };
        const motivo = `${cookies} cookie${cookies > 1 ? "s" : ""} no balcão${n ? " · nota nº " + n.numero : ""}${x > 1 ? " (em dobro)" : ""}`;
        if (pts > 0) {
          lancar(m, pts, jaTinha ? motivo + " (completa a nota)" : motivo, canal);
          if (jaTinha) m.extrato[0].comp = true; // a compra já tinha contado; isto é só o resto dos pontos
        }
        const extra = pts > 0 ? depoisDaCompra(d, m, canal) : {};
        if (pts > 0) premiaIndicacao(d, m, primeira);
        return { ok: true, pontos: pts, total, jaTinha, dobro: x > 1, canal, saldo: m.pontos, ...extra };
      });
    },

    gerarLote(qtd, canal, pontos) {
      return mexer((d) => {
        const lote = { id: "L" + (d.lotes.length + 1), data: agora(), qtd, pontos, canal };
        const lista = [];
        while (lista.length < qtd) {
          const c = codigoNovo(6);
          if (d.codigos[c]) continue;
          d.codigos[c] = { lote: lote.id, pontos, canal, usadoPor: null, usadoEm: null };
          lista.push(c);
        }
        d.lotes.push(lote);
        return { lote, codigos: lista };
      });
    },

    publico(d, publico) {
      const hoje = agora();
      return d.membros.filter((m) => {
        if (publico === "todos") return true;
        if (publico === "aniversario") return aniversarioPerto(m);
        if (publico === "sumidos") return hoje - (m.ultimo || m.desde) > 30 * DIA;
        if (publico === "premio") return m.pontos >= Math.min(...d.premios.map((p) => p.pontos));
        if (publico === "quase") return quaseNoPremio(d, m);
        if (publico === "vencendo") return vencendo(m, d.regras);
        if (publico === "passaporte") return faltaUmSelo(m);
        return m.cidade === publico;
      });
    },

    avisar(titulo, texto, publico) {
      return mexer((d) => {
        const a = { id: "A" + (d.avisos.length + 1) + "-" + agora(), data: agora(), titulo, texto, publico, alcance: Clube.publico(d, publico).length };
        d.avisos.push(a);
        return a;
      });
    },

    zerar() { try { localStorage.removeItem(CHAVE); localStorage.removeItem(CHAVE_EU); } catch (e) {} },
    CHAVE,

    /* as mesmas portas da nuvem, para a tela não precisar saber onde mora o clube */
    nuvem: false,
    Sessao: null,
    iniciar() { return Promise.resolve(ler()); },
    recarregar() { return Promise.resolve(ler()); },
    entrarFone(whats) {
      const m = Clube.porWhats(ler(), whats);
      if (m) { Clube.entrarComo(m.id); return { ok: true, membro: m }; }
      return { precisaNome: true };
    },
    salvarRegras(regras, premios) {
      return mexer((d) => { Object.assign(d.regras, regras); if (premios) d.premios = premios; return { regras: d.regras, premios: d.premios }; });
    },
    salvarTema(tema) { try { localStorage.setItem("glk_tema", tema); } catch (e) {} return { ok: true }; }
  };

  /* ---------- nuvem: o clube de verdade (Supabase do estúdio, sala glikiso) ----------
     As regras rodam no banco; aqui só pedimos e guardamos uma cópia para desenhar a tela.
     Sem comum/nuvem.js ligado, tudo continua no aparelho (demonstração).
     ?nuvem=1 liga neste aparelho; ?nuvem=0 volta para a demonstração. */
  const N = window.GLIKI_NUVEM || {};
  function querNuvem() {
    let m = null;
    try {
      const q = new URLSearchParams(location.search).get("nuvem");
      if (q === "1") localStorage.setItem("glk_modo", "nuvem");
      if (q === "0") localStorage.setItem("glk_modo", "demo");
      m = localStorage.getItem("glk_modo");
    } catch (e) {}
    return !!(N.url && N.chave && N.sala && (m ? m === "nuvem" : N.ligado));
  }
  function instalarNuvem(K) {
    const TOKEN = "glk_token", SESSAO = "glk_sessao";
    const pega = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const poe = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
    let cache = null, painel = false;

    async function chamar(caminho, corpo, tok, extra) {
      const ctrl = new AbortController();
      const corta = setTimeout(() => ctrl.abort(), 15000);
      try {
        const r = await fetch(N.url + caminho, {
          method: "POST", signal: ctrl.signal,
          headers: { apikey: N.chave, Authorization: "Bearer " + (tok || N.chave), "Content-Type": "application/json", ...(extra || {}) },
          body: JSON.stringify(corpo || {})
        });
        const t = await r.text();
        let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) {
          const e = new Error((j && (j.message || j.msg || j.error_description)) || "Erro " + r.status);
          e.status = r.status; e.codigo = j && j.code;
          throw e;
        }
        return j;
      } catch (e) {
        if (e.name === "AbortError") throw new Error("A internet está lenta. Tente de novo.");
        if (e instanceof TypeError) throw new Error("Sem internet agora. Tente de novo.");
        throw e;
      } finally { clearTimeout(corta); }
    }
    const rpc = (fn, args, tok) => chamar("/rest/v1/rpc/" + fn, args, tok, { "Content-Profile": N.sala, "Accept-Profile": N.sala });

    /* a dona entra no painel com e-mail e senha (login criado no Supabase do estúdio) */
    const Sessao = {
      ler() { try { return JSON.parse(pega(SESSAO) || "null"); } catch (e) { return null; } },
      gravar(s) { poe(SESSAO, s ? JSON.stringify(s) : null); },
      async entrar(email, senha) {
        try {
          const d = await chamar("/auth/v1/token?grant_type=password", { email, password: senha });
          Sessao.gravar({ access_token: d.access_token, refresh_token: d.refresh_token, expira: Date.now() + (d.expires_in || 3600) * 1000, email: d.user && d.user.email });
          return { ok: true };
        } catch (e) { return { ok: false, erro: e.status === 400 ? "E-mail ou senha não conferem." : e.message }; }
      },
      async valida() {
        const s = Sessao.ler();
        if (!s) return null;
        if (s.expira - Date.now() > 60000) return s;
        try {
          const d = await chamar("/auth/v1/token?grant_type=refresh_token", { refresh_token: s.refresh_token });
          const n = { ...s, access_token: d.access_token, refresh_token: d.refresh_token, expira: Date.now() + (d.expires_in || 3600) * 1000 };
          Sessao.gravar(n);
          return n;
        } catch (e) {
          if (e.status) Sessao.gravar(null); // o servidor recusou: sessão acabou. Sem internet, guarda e tenta depois.
          return null;
        }
      },
      sair() { Sessao.gravar(null); cache = null; }
    };
    async function comoDona(fn, args) {
      const s = await Sessao.valida();
      if (!s) { const e = new Error("Entre de novo no painel."); e.sessao = true; throw e; }
      return rpc(fn, args, s.access_token);
    }
    const vazio = () => ({ regras: { ...REGRAS_PADRAO }, premios: PREMIOS_PADRAO.map((p) => ({ ...p })), membros: [], resgates: [], avisos: [], notas: {}, codigos: {}, lotes: [] });
    function montaCliente(j) {
      cache = { ...vazio(), regras: { ...REGRAS_PADRAO, ...(j.regras || {}) }, premios: j.premios || PREMIOS_PADRAO, membros: j.membro ? [j.membro] : [], resgates: j.resgates || [], avisos: j.avisos || [] };
      return cache;
    }
    function montaPainel(j) {
      cache = { ...vazio(), ...j, regras: { ...REGRAS_PADRAO, ...(j.regras || {}) } };
      return cache;
    }
    async function recarregar() {
      if (painel) return montaPainel(await comoDona("painel_estado", {}));
      const tok = pega(TOKEN);
      const j = await rpc("estado", { p_token: tok || "" });
      if (tok && !j.membro) poe(TOKEN, null); // a chave deste aparelho não vale mais
      return montaCliente(j);
    }
    const depois = async (r) => { try { await recarregar(); } catch (e) {} return r; };
    const falhou = (e) => ({ ok: false, erro: e.message || "Não deu certo. Tente de novo.", sessao: !!e.sessao });
    const tok = () => pega(TOKEN) || "";
    const chama = async (fn, args, dona) => { try { return await depois(await (dona ? comoDona(fn, args) : rpc(fn, args))); } catch (e) { return falhou(e); } };

    Object.assign(K, {
      nuvem: true,
      Sessao,
      iniciar(opc = {}) { painel = !!opc.painel; return recarregar(); },
      recarregar,
      ler() { return cache || montaCliente({}); },
      mexer() { throw new Error("Na nuvem, use as funções do clube."); },
      gravarLocal() {},
      eu() { return cache && !painel && cache.membros[0] ? cache.membros[0].id : null; },
      entrarComo(id) {
        if (id) return;
        const t = pega(TOKEN);
        poe(TOKEN, null);
        if (t) rpc("sair", { p_token: t }).catch(() => {});
        montaCliente({ regras: cache && cache.regras, premios: cache && cache.premios });
      },
      async entrarFone(whats) {
        try {
          const j = await rpc("entrar", { p_fone: whats });
          if (j.erro) return { ok: false, erro: j.erro };
          if (j.precisaNome) return { precisaNome: true };
          poe(TOKEN, j.token);
          await recarregar();
          return { ok: true, membro: cache.membros[0] };
        } catch (e) { return falhou(e); }
      },
      async cadastrar({ nome, whats, niver = null, cidade = null, indicacao }) {
        try {
          const j = await rpc("entrar", { p_fone: whats, p_nome: nome, p_niver: niver, p_cidade: cidade, p_indicacao: indicacao || null });
          if (j.erro) return { ok: false, erro: j.erro };
          poe(TOKEN, j.token);
          await recarregar();
          return { ok: true, membro: cache.membros[0], novo: j.novo, indicadoPor: j.indicadoPor ? { nome: j.indicadoPor } : null };
        } catch (e) { return falhou(e); }
      },
      usarNota(_, texto) { return chama("usar_nota", { p_token: tok(), p_texto: texto }); },
      usarCodigo(_, cod) { return chama("usar_codigo", { p_token: tok(), p_codigo: cod }); },
      trocar(_, premio, loja) { return chama("trocar", { p_token: tok(), p_premio: premio, p_loja: loja || null }); },
      guardarAniversario(_, niver) { return chama("guardar_aniversario", { p_token: tok(), p_niver: niver }); },
      pontuarBalcao(id, cookies, canal, nota) { return chama("pontuar_balcao", { p_membro: id, p_cookies: cookies, p_canal: canal, p_nota: nota || "" }, true); },
      entregar(cod) { return chama("entregar", { p_codigo: cod }, true); },
      gerarLote(qtd, canal, pontos) { return chama("gerar_lote", { p_qtd: qtd, p_canal: canal, p_pontos: pontos }, true); },
      avisar(titulo, texto, publico) { return chama("avisar", { p_titulo: titulo, p_texto: texto, p_publico: publico, p_alcance: cache ? K.publico(cache, publico).length : 0 }, true); },
      ligarDobro(canal) { return chama("ligar_dobro", { p_canal: canal || null }, true); },
      salvarRegras(regras, premios) { return chama("salvar_regras", { p_regras: regras, p_premios: premios || null }, true); },
      async salvarTema(tema) {
        const r = await chama("salvar_tema", { p_tema: tema }, true);
        if (r && r.ok !== false) { try { localStorage.setItem("glk_tema_nuvem", tema); } catch (e) {} }
        return r;
      },
      zerar() {}
    });
  }
  if (querNuvem()) instalarNuvem(Clube);
  window.Clube = Clube;
})();
