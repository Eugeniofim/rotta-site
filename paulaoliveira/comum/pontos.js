/* Pontos do app, a entrada do app (Google + avisos) e a tela "Meus pontos".
   Os dois sites usam igual; cada um só veste com as próprias cores.
   Nesta prévia tudo fica neste aparelho. Na versão de verdade:
   - login pelo Google = Supabase Auth com o Google (chave gratuita criada na conta da Paula);
   - avisos = Web Push com o service worker (o mesmo pedido de permissão daqui);
   - pontos = uma tabela no banco, e a compra soma sozinha quando a Nuvemshop confirma o pagamento. */
(function () {
  var CFG = {
    paula: {
      loja: 'Paula Oliveira', clube: 'Elenco', ola: 'Seja membro do Elenco', lojaLink: '#/programacao', lojaTxt: 'Ver a programação',
      avisoTitulo: 'Saiba do lote antes de todo mundo',
      avisoExemplo: 'Lord chega sábado, às 8. Fique pronta.',
      avisoPorque: 'Os lotes da Paula esgotam em poucas horas. Com os avisos ligados, você fica sabendo na hora.',
      niveis: [
        { n: 'Plateia', de: 0, vale: 'Aviso no celular e 1 hora antes de todo mundo em cada lote.' },
        { n: 'Camarote', de: 500, vale: '2 horas antes de todo mundo e frete grátis no mês do seu aniversário.' },
        { n: 'Bastidores', de: 1500, vale: 'Entra primeiro em todo lote e prova cada estreia antes de estrear.' }
      ],
      premios: [
        { id: 'amostra', t: 'Amostra de 2 ml', d: 'De um perfume que você escolher, junto com o próximo pedido.', pts: 150 },
        { id: 'frete', t: 'Frete grátis', d: 'No próximo pedido, para qualquer lugar do Brasil.', pts: 300 },
        { id: 'mini', t: 'Miniatura de 10 ml', d: 'De um perfume em cartaz.', pts: 900 }
      ]
    },
    fada: {
      loja: 'Fada Marinha', clube: 'Cardume', ola: 'Seja membro do Cardume', lojaLink: '#/perfumes', lojaTxt: 'Ver os perfumes',
      avisoTitulo: 'Saiba quando voltar à tona',
      avisoExemplo: 'Sereias, a Guardiã das Flores voltou à tona.',
      avisoPorque: 'Os perfumes da Fada voltam em pouca quantidade. Com os avisos ligados, você fica sabendo na hora.',
      niveis: [
        { n: 'Concha', de: 0, vale: 'Aviso no celular e entrada antes de todo mundo quando um perfume volta.' },
        { n: 'Pérola', de: 500, vale: 'Entrada ainda mais cedo e frete grátis no mês do seu aniversário.' },
        { n: 'Sereia', de: 1500, vale: 'Entra primeiro em toda maré e recebe a amostra de cada lançamento antes de todo mundo.' }
      ],
      premios: [
        { id: 'amostra', t: 'Amostra de 2 ml', d: 'De um perfume que você escolher, junto com o próximo pedido.', pts: 150 },
        { id: 'frete', t: 'Frete grátis', d: 'No próximo pedido, para qualquer lugar do Brasil.', pts: 300 },
        { id: 'mini', t: 'Miniatura de 10 ml', d: 'De um perfume que estiver à tona.', pts: 700 }
      ]
    }
  };
  /* quanto vale cada coisa; a Paula muda no painel */
  var REGRAS = { app: 50, avisos: 50, compra: 1, voto: 10, senha: 10, aniversario: 20, aniversarioMes: 100, avaliar: 20, amiga: 100 };

  var G = '<svg class="g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function fmt(n) { return Number(n).toLocaleString('pt-BR'); }
  function hoje() { return new Date().toISOString(); }

  var ouvintes = [];
  function avisa() { ouvintes.forEach(function (f) { try { f(); } catch (e) {} }); }

  /* regras e prêmios: o padrão daqui + o que a Paula mudou no painel (fica na loja de demonstração) */
  function ajustes(m) { try { return ((window.Loja && Loja.estado().pontos) || {})[m] || {}; } catch (e) { return {}; } }
  function regras(m) { var a = ajustes(m).regras || {}, r = {}; Object.keys(REGRAS).forEach(function (k) { r[k] = a[k] != null ? +a[k] : REGRAS[k]; }); return r; }
  function premios(m) { var a = ajustes(m).premios || {}; return CFG[m].premios.map(function (p) { return Object.assign({}, p, { pts: a[p.id] != null ? +a[p.id] : p.pts }); }); }

  function estado(m) {
    var s; try { s = JSON.parse(ler('pp_pontos_' + m) || 'null'); } catch (e) { s = null; }
    return s || { extrato: [], feitos: {} };
  }
  function salva(m, s) { gravar('pp_pontos_' + m, JSON.stringify(s)); avisa(); }

  function nivel(m, ganhos) {
    var ns = CFG[m].niveis, i = 0;
    ns.forEach(function (n, k) { if (ganhos >= n.de) i = k; });
    var prox = ns[i + 1];
    return { i: i, atual: ns[i], prox: prox, falta: prox ? prox.de - ganhos : 0, pct: prox ? Math.round(100 * (ganhos - ns[i].de) / (prox.de - ns[i].de)) : 100 };
  }
  function meu(m) {
    var s = estado(m), saldo = 0, ganhos = 0;
    s.extrato.forEach(function (e) { saldo += e.pts; if (e.pts > 0) ganhos += e.pts; });
    return { saldo: saldo, ganhos: ganhos, extrato: s.extrato, feitos: s.feitos, nivel: nivel(m, ganhos) };
  }

  /* chave = o que rendeu; unica = só vale uma vez */
  function ganhar(m, chave, pts, texto, unica) {
    var s = estado(m);
    if (unica && s.feitos[chave]) return 0;
    var antes = nivel(m, meu(m).ganhos).i;
    s.feitos[chave] = s.feitos[chave] || hoje();
    if (pts) s.extrato.unshift({ t: texto, pts: pts, em: hoje() });
    salva(m, s);
    var depois = meu(m).nivel;
    if (pts) diz(depois.i > antes ? 'Você subiu para ' + depois.atual.n + '!' : '+' + fmt(pts) + ' pontos · ' + texto);
    return pts;
  }
  function marca(m, chave, valor) { var s = estado(m); s.feitos[chave] = valor; salva(m, s); }
  function diz(t) { if (typeof window.toast === 'function') window.toast(t); }
  function rende(m, valor) { return Math.floor(Number(valor || 0) * regras(m).compra); }

  /* ---------- login (Google na versão de verdade) ---------- */
  function logado(m) { return window.Rec && Rec.conta(m); }
  function google(m, depois) {
    /* prévia: entra com uma conta de exemplo. De verdade: janela do Google, escolhe a conta, volta logado. */
    Rec.entrar(m, { nome: 'Ana Ribeiro', email: 'ana.ribeiro@gmail.com', google: true, exemplo: true });
    diz('Entrou com o Google · conta de exemplo');
    avisa();
    if (depois) depois();
  }
  function botaoGoogle(m, acao) {
    return '<button type="button" class="pts-google" onclick="' + acao + '">' + G + '<span>Continuar com o Google</span></button>';
  }

  /* ---------- avisos (notificações) ---------- */
  function suportaAvisos() { return 'Notification' in window && 'serviceWorker' in navigator; }
  function permissao() { return suportaAvisos() ? Notification.permission : 'sem'; }
  function mostraExemplo(m) {
    var c = CFG[m];
    if (!suportaAvisos()) return;
    navigator.serviceWorker.getRegistration().then(function (r) {
      var corpo = 'Pronto. É assim que chega o aviso: ' + c.avisoExemplo;
      if (r && r.showNotification) return r.showNotification(c.loja, { body: corpo, icon: 'icone-192.png', badge: 'icone-192.png', tag: 'boas-vindas', data: { url: location.pathname } });
      try { new Notification(c.loja, { body: corpo, icon: 'icone-192.png' }); } catch (e) {}
    }).catch(function () {});
  }
  /* precisa ser chamada direto do toque: o iPhone só mostra a janela "Permitir" depois de um toque */
  function ativarAvisos(m, depois) {
    if (!suportaAvisos()) { if (depois) depois('sem'); return; }
    var fim = function (r) {
      if (r === 'granted') { ganhar(m, 'avisos', regras(m).avisos, 'Ligou os avisos', true); mostraExemplo(m); }
      avisa();
      if (depois) depois(r);
    };
    try {
      var p = Notification.requestPermission(fim);
      if (p && p.then) p.then(fim);
    } catch (e) { fim('default'); }
  }

  /* ---------- a entrada do app ---------- */
  var ent = null, entM = null;
  function emApp() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  function fechaEntrada(irPara) {
    if (!ent) return;
    gravar('pp_entrada_' + entM, '1');
    ent.remove(); ent = null; document.documentElement.classList.remove('com-entrada');
    if (irPara) location.hash = irPara;
  }
  function passo(qual) {
    var m = entM, c = CFG[m], h = '';
    if (qual === 'login') {
      h = '<img class="ent-ic" src="icone-192.png" alt=""><p class="ent-sobre">' + esc(c.loja) + '</p>' +
        '<h1>' + esc(c.ola) + '</h1><p>Membro sabe dos lotes antes, junta pontos e troca por presentes. Entra com um toque: nome e e-mail vêm do Google, sem senha nova.</p>' +
        botaoGoogle(m, "Pontos._entGoogle()") +
        '<details class="ent-outro"><summary>Usar outro e-mail</summary><form onsubmit="Pontos._entEmail(event)"><label class="campo">Seu nome<input required name="nome" autocomplete="name"></label><label class="campo">E-mail<input required name="email" type="email" autocomplete="email" spellcheck="false"></label><button class="acao">Entrar</button></form></details>' +
        '<button type="button" class="ent-depois" onclick="Pontos._entPasso(\'avisos\')">Agora não</button>' +
        '<p class="ent-nota">Prévia: o botão do Google entra com uma conta de exemplo.</p>';
    } else if (qual === 'avisos') {
      var r = regras(m), sem = !suportaAvisos(), negado = permissao() === 'denied';
      h = '<p class="ent-sobre">' + esc(c.loja) + '</p><h1>' + esc(c.avisoTitulo) + '</h1>' +
        '<div class="ent-push" aria-hidden="true"><img src="icone-192.png" alt=""><div><b>' + esc(c.loja) + ' <span>agora</span></b>' + esc(c.avisoExemplo) + '</div></div>' +
        '<p>' + esc(c.avisoPorque) + '</p>' +
        (sem
          ? '<p class="ent-dica">No iPhone, os avisos chegam pelo app na tela de início. Baixe o app e abra por ele.</p><button type="button" class="acao" onclick="Pontos._entFim();baixar()">Baixar o app</button>'
          : negado
            ? '<p class="ent-dica">Os avisos estão bloqueados neste aparelho. Para ligar: Ajustes do celular, Notificações, ' + esc(c.loja) + '.</p>'
            : '<button type="button" class="acao" onclick="Pontos._entAvisos()">Ativar os avisos <span class="ent-mais">+' + r.avisos + ' pontos</span></button>') +
        '<button type="button" class="ent-depois" onclick="Pontos._entPasso(\'pronto\')">' + (sem || negado ? 'Continuar' : 'Agora não') + '</button>';
    } else {
      var eu = meu(m), n = eu.nivel, conta = logado(m);
      h = '<p class="ent-sobre">' + esc(c.clube) + ' · ' + esc(c.loja) + '</p>' +
        '<h1>' + (conta ? esc(conta.nome.split(' ')[0]) + ', você é membro' : 'Você é membro') + ' do ' + esc(c.clube) + '</h1>' +
        '<div class="ent-nivel"><span>' + esc(n.atual.n) + '</span>' + fmt(eu.saldo) + ' pontos' + (n.prox ? ' · faltam ' + fmt(n.falta) + ' para ' + esc(n.prox.n) : '') + '</div>' +
        '<p>Você ganha pontos comprando, votando em qual perfume volta primeiro e chamando amigas. Troca por amostra, frete grátis e miniatura.</p>' +
        '<button type="button" class="acao" onclick="Pontos._entFim(\'#/pontos\')">Ver meus pontos</button>' +
        '<a class="ent-depois" href="' + c.lojaLink + '" onclick="Pontos._entFim()">' + esc(c.lojaTxt) + '</a>';
    }
    ent.querySelector('.ent-in').innerHTML = h;
    ent.dataset.passo = qual;
    var foco = ent.querySelector('h1'); if (foco) { foco.setAttribute('tabindex', '-1'); foco.focus({ preventScroll: true }); }
  }
  function proximoDepoisDoLogin() { passo(permissao() === 'granted' ? 'pronto' : 'avisos'); }
  function entrada(m, forcar) {
    if (ent) return;
    if (!forcar && ler('pp_entrada_' + m)) return;
    entM = m;
    if (emApp()) ganhar(m, 'app', regras(m).app, 'Baixou o app', true);
    ent = document.createElement('div');
    ent.className = 'ent'; ent.setAttribute('role', 'dialog'); ent.setAttribute('aria-modal', 'true'); ent.setAttribute('aria-label', CFG[m].ola);
    ent.innerHTML = '<div class="ent-in"></div>';
    document.body.append(ent);
    document.documentElement.classList.add('com-entrada');
    if (!logado(m)) passo('login'); else proximoDepoisDoLogin();
  }

  /* ---------- a tela "Meus pontos" ---------- */
  function linhaGanho(chave, titulo, sub, pts, botao, feito) {
    return '<li class="' + (feito ? 'feito' : '') + '"><span class="pts-t"><b>' + titulo + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
      '<span class="pts-v">' + pts + '</span>' +
      (feito ? '<span class="pts-ok" aria-label="Feito">✓</span>' : botao ? botao : '<span></span>') + '</li>';
  }
  function bt(acao, txt) { return '<button type="button" class="pts-b" onclick="' + acao + '">' + txt + '</button>'; }
  function data(iso) { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''); }

  function tela(m) {
    var c = CFG[m], r = regras(m), eu = meu(m), n = eu.nivel, f = eu.feitos, conta = logado(m), perm = permissao();
    var prem = premios(m);
    var h = '<div class="pts">' +
      '<p class="pts-sobre">' + esc(c.clube) + ' · ' + esc(c.loja) + '</p><h1>Meus pontos</h1>' +
      '<div class="pts-cartao"><div class="pts-c1"><span>Membro do ' + esc(c.clube) + '</span><span>' + (conta ? esc(conta.nome) : 'Sem login') + '</span></div>' +
      '<div class="pts-nivel">' + esc(n.atual.n) + '</div>' +
      '<div class="pts-saldo"><b>' + fmt(eu.saldo) + '</b> pontos</div>' +
      '<div class="pts-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + n.pct + '" aria-label="Caminho até o próximo nível"><i style="width:' + Math.max(3, n.pct) + '%"></i></div>' +
      '<p class="pts-falta">' + (n.prox ? 'Faltam <b>' + fmt(n.falta) + '</b> pontos para ' + esc(n.prox.n) : 'Você está no nível mais alto do ' + esc(c.clube)) + '</p></div>';

    if (!conta) h += '<div class="pts-aviso"><p><b>Seja membro para não perder seus pontos.</b> Eles ficam guardados na sua conta, em qualquer celular.</p>' + botaoGoogle(m, "Pontos.google('" + m + "')") + '</div>';

    h += '<h2>Como ganhar pontos</h2><ul class="pts-lista">' +
      linhaGanho('avisos', 'Ligar os avisos', perm === 'denied' ? 'Bloqueados neste celular: ligue nos Ajustes.' : perm === 'sem' ? 'No iPhone, pelo app na tela de início.' : 'Para saber de cada lote na hora.', '+' + r.avisos,
        perm === 'denied' ? '' : perm === 'sem' ? bt('baixar()', 'Baixar') : bt("Pontos.ativarAvisos('" + m + "')", 'Ligar'), !!f.avisos) +
      linhaGanho('app', 'Baixar o app', 'Uma vez, quando abrir pelo ícone.', '+' + r.app, bt('baixar()', 'Baixar'), !!f.app) +
      linhaGanho('compra', 'Comprar', r.compra === 1 ? '1 ponto para cada real.' : r.compra + ' pontos para cada real.', 'R$ 1 = ' + r.compra, '<a class="pts-b" href="' + c.lojaLink + '">Ver</a>', false) +
      linhaGanho('voto', 'Votar em qual volta primeiro', f.voto ? 'Seu voto: ' + esc(f.votoNome || '') : 'A Paula vê a votação no painel.', '+' + r.voto, bt("Pontos.votar('" + m + "')", 'Votar'), !!f.voto) +
      linhaGanho('senha', 'Pegar a senha de um lote', 'Entre na fila de um perfume esgotado.', '+' + r.senha, '<a class="pts-b" href="' + c.lojaLink + '">Ver</a>', !!f.senha) +
      linhaGanho('aniversario', 'Contar seu aniversário', 'E ganha +' + r.aniversarioMes + ' no seu mês.', '+' + r.aniversario, bt("Pontos.aniversario('" + m + "')", 'Contar'), !!f.aniversario) +
      linhaGanho('avaliar', 'Avaliar um perfume que você usa', 'Vale uma vez por perfume.', '+' + r.avaliar, bt("Pontos.avaliar('" + m + "')", 'Avaliar'), false) +
      linhaGanho('amiga', 'Chamar uma amiga', f.convites ? 'Convites enviados: ' + f.convites + '. Os pontos entram quando ela comprar.' : 'Os pontos entram quando ela fizer a primeira compra.', '+' + r.amiga, bt("Pontos.convidar('" + m + "')", 'Chamar'), false) +
      '</ul>';

    h += '<h2>Trocar seus pontos</h2><ul class="pts-premios">' + prem.map(function (p) {
      var da = eu.saldo >= p.pts;
      return '<li><span class="pts-t"><b>' + esc(p.t) + '</b><small>' + esc(p.d) + '</small></span><span class="pts-v">' + fmt(p.pts) + '</span>' +
        (da ? bt("Pontos.trocar('" + m + "','" + p.id + "')", 'Trocar') : '<span class="pts-faltam">Faltam ' + fmt(p.pts - eu.saldo) + '</span>') + '</li>';
    }).join('') + '</ul>';

    h += '<h2>Os níveis do ' + esc(c.clube) + '</h2><ol class="pts-niveis">' + c.niveis.map(function (x, k) {
      return '<li class="' + (k === n.i ? 'aqui' : k < n.i ? 'passou' : '') + '"><b>' + esc(x.n) + '</b><span>' + (x.de ? 'A partir de ' + fmt(x.de) + ' pontos' : 'Ao entrar') + (k === n.i ? ' · você está aqui' : '') + '</span><small>' + esc(x.vale) + '</small></li>';
    }).join('') + '</ol><p class="miudo">O nível conta tudo o que você já ganhou. Trocar pontos não faz você descer.</p>';

    h += '<h2>Extrato</h2>' + (eu.extrato.length
      ? '<ul class="pts-extrato">' + eu.extrato.slice(0, 40).map(function (e) { return '<li><span>' + data(e.em) + '</span><span>' + esc(e.t) + '</span><b class="' + (e.pts < 0 ? 'neg' : '') + '">' + (e.pts > 0 ? '+' : '−') + fmt(Math.abs(e.pts)) + '</b></li>'; }).join('') + '</ul>'
      : '<p>Ainda não tem nada aqui. Comece ligando os avisos.</p>');

    h += '<p class="miudo">Prévia: os pontos ficam guardados só neste aparelho.</p>' +
      (conta && conta.exemplo ? '<button type="button" class="acao vazada" onclick="Pontos.sair(\'' + m + '\')">Sair da conta de exemplo</button>' : '') +
      '</div>';
    return h;
  }

  /* ---------- ações da tela ---------- */
  function abre(h) { if (typeof window.abre === 'function') window.abre(h); }
  function fechaDlg() { var d = document.getElementById('dlg'); if (d && d.open) d.close(); }

  function votar(m) {
    var ps = Loja.produtos(m).filter(function (p) { return p.tipo === 'perfume' && p.status === 'esgotado'; }).sort(function (a, b) { return b.fila - a.fila; }).slice(0, 4);
    abre('<h2>Qual volta primeiro?</h2><p>Os mais pedidos que estão esgotados. A Paula vê o resultado no painel.</p><div class="pts-voto">' +
      ps.map(function (p) { return '<button type="button" onclick="Pontos._vota(\'' + m + '\',\'' + p.id + '\',this)"><b>' + esc(p.nome) + '</b><small>' + fmt(p.fila) + ' pessoas na fila</small></button>'; }).join('') + '</div>');
  }
  function _vota(m, id, el) {
    var p = Loja.produto(m, id);
    fechaDlg();
    Loja.mexe(function (s) { s.filas[m] = s.filas[m] || {}; s.filas[m][id] = (s.filas[m][id] || 0) + 1; });
    marca(m, 'votoNome', p.nome);
    ganhar(m, 'voto', regras(m).voto, 'Votou em ' + p.nome, true);
  }
  function aniversario(m) {
    abre('<h2>Seu aniversário</h2><p>No seu mês você ganha +' + regras(m).aniversarioMes + ' pontos e um presente.</p><form onsubmit="Pontos._aniv(event,\'' + m + '\')"><label class="campo">Dia e mês<input required name="d" type="date" autocomplete="bday"></label><button class="acao">Guardar</button></form>');
  }
  function _aniv(e, m) { e.preventDefault(); fechaDlg(); marca(m, 'nascimento', e.target.d.value); ganhar(m, 'aniversario', regras(m).aniversario, 'Contou o aniversário', true); }
  function avaliar(m) {
    var f = estado(m).feitos.avaliou || {};
    var ps = Loja.produtos(m).filter(function (p) { return p.tipo === 'perfume' && !f[p.id]; });
    abre('<h2>Avaliar um perfume</h2><form onsubmit="Pontos._avalia(event,\'' + m + '\')"><label class="campo">Qual perfume<select name="p" required>' +
      ps.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + '</option>'; }).join('') + '</select></label>' +
      '<fieldset class="pts-estrelas"><legend>Sua nota</legend>' + [5, 4, 3, 2, 1].map(function (n) { return '<input type="radio" name="n" value="' + n + '" id="pe' + n + '" required' + (n === 5 ? ' checked' : '') + '><label for="pe' + n + '" aria-label="' + n + ' de 5">★</label>'; }).join('') + '</fieldset>' +
      '<label class="campo">Conte em uma frase (opcional)<textarea name="t" rows="2" placeholder="Fixa o dia inteiro…"></textarea></label><button class="acao">Mandar a avaliação</button></form>');
  }
  function _avalia(e, m) {
    e.preventDefault();
    var id = e.target.p.value, nota = +e.target.n.value, p = Loja.produto(m, id), s = estado(m);
    fechaDlg();
    s.feitos.avaliou = s.feitos.avaliou || {}; s.feitos.avaliou[id] = nota; salva(m, s);
    ganhar(m, 'avaliou-' + id, regras(m).avaliar, 'Avaliou ' + p.nome, true);
  }
  function convidar(m) {
    var c = CFG[m], url = location.href.split('#')[0].split('?')[0] + '?convite=' + (logado(m) ? 'ANA' : 'AMIGA') + '#/' + (m === 'paula' ? 'elenco' : 'cardume');
    var txt = 'Entra no ' + c.clube + ' da ' + c.loja + ' comigo. Os lotes esgotam rápido e quem está lá sabe antes:';
    var s = estado(m); s.feitos.convites = (s.feitos.convites || 0) + 1; salva(m, s);
    window.open(Rec.redes(url, txt)[0].u, '_blank', 'noopener');
  }
  function trocar(m, id) {
    var p = premios(m).filter(function (x) { return x.id === id; })[0];
    if (!p || meu(m).saldo < p.pts) return;
    abre('<h2>Trocar por ' + esc(p.t.toLowerCase()) + '?</h2><p>' + esc(p.d) + '</p><p>Saem <b>' + fmt(p.pts) + ' pontos</b> do seu saldo. Seu nível continua o mesmo.</p><button type="button" class="acao" onclick="Pontos._troca(\'' + m + '\',\'' + id + '\')">Trocar ' + fmt(p.pts) + ' pontos</button><button type="button" class="acao vazada" onclick="dlg.close()">Agora não</button>');
  }
  function _troca(m, id) {
    var p = premios(m).filter(function (x) { return x.id === id; })[0], s = estado(m);
    s.extrato.unshift({ t: 'Trocou por ' + p.t.toLowerCase(), pts: -p.pts, em: hoje() });
    salva(m, s);
    abre('<h2>Pronto, é seu</h2><p>' + esc(p.t) + ' fica guardado na sua conta e vai junto com o próximo pedido. A ' + (m === 'paula' ? 'Paula' : 'Fada') + ' recebe o aviso no painel.</p><button type="button" class="acao" onclick="dlg.close()">Fechar</button>');
  }
  function compra(m, valor, nomes) {
    var pts = rende(m, valor);
    ganhar(m, 'compra-' + Date.now(), pts, 'Compra: ' + nomes, false);
    return pts;
  }
  function resumo(m) {
    var c = CFG[m], eu = meu(m);
    return '<a class="pts-resumo" href="#/pontos"><span>Membro do ' + esc(c.clube) + ' · ' + esc(eu.nivel.atual.n) + '</span><b>' + fmt(eu.saldo) + ' pontos</b><span>Ver meus pontos →</span></a>';
  }
  function sair(m) { if (window.Rec) Rec.sair(m); avisa(); }

  /* ---------- estilo comum (cada site veste com as variáveis --pt-*) ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.pts{max-width:640px}',
    '.pts-sobre,.ent-sobre{font:var(--pt-rotulo);letter-spacing:.08em;text-transform:uppercase;opacity:.8}',
    '.pts h2{margin:38px 0 6px;font:var(--pt-h2)}',
    '.pts-cartao{position:relative;margin-top:22px;padding:20px 22px 18px;background:var(--pt-cartao);color:var(--pt-cartao-tx);border-radius:var(--pt-canto,18px);overflow:hidden;box-shadow:0 18px 40px -18px #0009}',
    '.pts-c1{display:flex;justify-content:space-between;gap:12px;font:var(--pt-rotulo);letter-spacing:.08em;text-transform:uppercase;opacity:.85}',
    '.pts-c1 span:last-child{text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pts-nivel{font:var(--pt-nivel);margin:14px 0 2px;line-height:.95}',
    '.pts-saldo{font-size:18px}.pts-saldo b{font:var(--pt-numero);font-variant-numeric:tabular-nums;margin-right:4px}',
    '.pts-barra{height:8px;border-radius:8px;background:color-mix(in srgb,var(--pt-cartao-tx) 22%,transparent);margin:14px 0 8px;overflow:hidden}',
    '.pts-barra i{display:block;height:100%;border-radius:8px;background:var(--pt-acento);transition:width .8s cubic-bezier(.2,.8,.2,1)}',
    '.pts-falta{font-size:16px;opacity:.9}',
    '.pts-aviso{margin-top:16px;padding:16px 18px;border-radius:14px;background:var(--pt-caixa);font-size:17px}',
    '.pts-lista,.pts-premios,.pts-extrato,.pts-niveis{list-style:none;padding:0;margin:8px 0 0}',
    '.pts-lista li,.pts-premios li{display:grid;grid-template-columns:minmax(0,1fr) auto 84px;gap:12px;align-items:center;padding:13px 0;border-top:1px solid var(--pt-linha)}',
    '.pts-t b{display:block;font-weight:600;line-height:1.2}.pts-t small{display:block;font-size:.84em;opacity:.78;line-height:1.3;margin-top:2px}',
    '.pts-v{font:var(--pt-numero-p);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}',
    '.pts-b{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border-radius:var(--pt-canto-b,22px);background:var(--pt-botao);color:var(--pt-botao-tx);border:0;font:inherit;font-size:15px;font-weight:600;text-decoration:none;cursor:pointer}',
    '.pts-ok{justify-self:center;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--pt-acento);color:var(--pt-acento-tx);font-weight:700}',
    '.pts-lista li.feito .pts-t,.pts-lista li.feito .pts-v{opacity:.55}',
    '.pts-faltam{font-size:13px;opacity:.75;text-align:center;line-height:1.2}',
    '.pts-niveis li{position:relative;padding:12px 0 12px 22px;border-top:1px solid var(--pt-linha)}',
    '.pts-niveis li::before{content:"";position:absolute;left:0;top:19px;width:10px;height:10px;border-radius:50%;box-shadow:inset 0 0 0 1.5px currentColor}',
    '.pts-niveis li.passou::before,.pts-niveis li.aqui::before{background:var(--pt-acento);box-shadow:none}',
    '.pts-niveis li.aqui::before{box-shadow:0 0 0 4px color-mix(in srgb,var(--pt-acento) 35%,transparent)}',
    '.pts-niveis b{font:var(--pt-h3)}.pts-niveis span{margin-left:10px;font-size:.85em;opacity:.8}.pts-niveis small{display:block;margin-top:3px;line-height:1.3}',
    '.pts-extrato li{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:10px;padding:9px 0;border-top:1px solid var(--pt-linha);font-size:16px}',
    '.pts-extrato li span:first-child{opacity:.7;font-variant-numeric:tabular-nums}.pts-extrato b{font-variant-numeric:tabular-nums}.pts-extrato b.neg{opacity:.7}',
    '.pts-google{display:inline-flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:52px;margin-top:14px;padding:0 18px;background:#fff;color:#1f1f1f;border:1px solid #747775;border-radius:26px;font:500 16px/1 Roboto,system-ui,-apple-system,sans-serif;cursor:pointer}',
    '.pts-google .g{width:20px;height:20px;flex:none}',
    '.pts-resumo{display:grid;gap:4px;margin:18px 0 26px;padding:18px 22px;background:var(--pt-cartao);color:var(--pt-cartao-tx);border-radius:var(--pt-canto,18px);text-decoration:none}.pts-resumo span{font-size:15px;opacity:.85}.pts-resumo b{font:var(--pt-numero)}',
    '.pts-ou{margin:16px 0 0;text-align:center;font-size:15px;opacity:.75}',
    '.pts-voto{display:grid;gap:10px;margin-top:14px}.pts-voto button{display:block;text-align:left;padding:14px 16px;border-radius:14px;border:1.5px solid currentColor;background:none;color:inherit;font:inherit;cursor:pointer}.pts-voto b{display:block;font-size:19px}.pts-voto small{opacity:.75}',
    '.pts-estrelas{border:0;padding:0;margin:14px 0 0;display:flex;flex-direction:row-reverse;justify-content:flex-end;gap:2px}.pts-estrelas legend{float:left;width:100%;margin-bottom:4px;font-weight:500}',
    '.pts-estrelas input{position:absolute;opacity:0;width:1px;height:1px}.pts-estrelas label{font-size:34px;line-height:1;color:#0003;cursor:pointer;padding:2px}',
    '.pts-estrelas input:checked~label,.pts-estrelas label:hover,.pts-estrelas label:hover~label{color:#E8A900}.pts-estrelas input:focus-visible+label{outline:2px solid currentColor;border-radius:4px}',
    /* entrada do app */
    'html.com-entrada,html.com-entrada body{overflow:hidden}',
    '.ent{position:fixed;inset:0;z-index:200;background:var(--pt-ent);color:var(--pt-ent-tx);overflow-y:auto;-webkit-overflow-scrolling:touch;animation:ent-in .45s cubic-bezier(.2,.8,.2,1)}',
    '.ent-in{min-height:100%;max-width:460px;margin:0 auto;padding:calc(env(safe-area-inset-top) + 48px) 22px calc(env(safe-area-inset-bottom) + 28px);display:flex;flex-direction:column;justify-content:center}',
    '.ent h1{font:var(--pt-ent-h1);margin:10px 0 14px;outline:0}',
    '.ent p{font-size:18px;line-height:1.4}',
    '.ent-ic{width:64px;height:64px;border-radius:16px;margin-bottom:18px;box-shadow:0 8px 24px #0005}',
    '.ent .acao{margin-top:22px}.ent-mais{margin-left:10px;padding:4px 9px 3px;border-radius:12px;background:color-mix(in srgb,currentColor 16%,transparent);font-size:.72em;letter-spacing:.02em}',
    '.ent-depois{display:block;width:100%;margin-top:14px;padding:12px;background:none;border:0;color:inherit;font:inherit;font-size:17px;text-align:center;text-decoration:underline;text-underline-offset:3px;cursor:pointer;opacity:.85}',
    '.ent-outro{margin-top:16px}.ent-outro summary{cursor:pointer;text-align:center;font-size:17px;opacity:.9}.ent-outro .campo{color:inherit}',
    '.ent-nota,.ent-dica{font-size:15px!important;opacity:.75;margin-top:12px}.ent-dica{opacity:.9;padding:12px 14px;border-radius:12px;background:color-mix(in srgb,var(--pt-ent-tx) 10%,transparent)}',
    '.ent-push{display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:start;margin:8px 0 18px;padding:14px;border-radius:20px;background:color-mix(in srgb,#fff 82%,transparent);color:#111;font:15px/1.35 system-ui,-apple-system,sans-serif;box-shadow:0 14px 34px -12px #0008;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);animation:ent-push 1s .25s cubic-bezier(.2,.8,.2,1) both}',
    '.ent-push img{width:40px;height:40px;border-radius:10px}.ent-push b{display:flex;justify-content:space-between;font-weight:600}.ent-push b span{font-weight:400;opacity:.6}',
    '.ent-nivel{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:17px;margin-bottom:6px}.ent-nivel span{padding:6px 12px 5px;border-radius:20px;background:var(--pt-acento);color:var(--pt-acento-tx);font:var(--pt-h3)}',
    '@keyframes ent-in{from{opacity:0;transform:translateY(24px)}}',
    '@keyframes ent-push{from{opacity:0;transform:translateY(-22px) scale(.96)}}',
    '@media(prefers-reduced-motion:reduce){.ent,.ent-push{animation:none}.pts-barra i{transition:none}}',
    '@media(max-width:420px){.pts-lista li,.pts-premios li{grid-template-columns:minmax(0,1fr) auto 76px;gap:10px}}'
  ].join('');
  document.head.append(css);

  window.Pontos = {
    CFG: CFG, REGRAS: REGRAS, regras: regras, premios: premios, meu: meu, ganhar: ganhar, rende: rende, compra: compra,
    tela: tela, resumo: resumo, entrada: entrada, botaoGoogle: function (m) { return botaoGoogle(m, "Pontos.google('" + m + "')"); }, google: function (m) { google(m); }, sair: sair,
    ativarAvisos: function (m) { ativarAvisos(m); }, permissao: permissao,
    votar: votar, aniversario: aniversario, avaliar: avaliar, convidar: convidar, trocar: trocar,
    aoMudar: function (f) { ouvintes.push(f); },
    _vota: _vota, _aniv: _aniv, _avalia: _avalia, _troca: _troca,
    _entGoogle: function () { google(entM, proximoDepoisDoLogin); },
    _entEmail: function (e) { e.preventDefault(); Rec.entrar(entM, { nome: e.target.nome.value.trim(), email: e.target.email.value.trim() }); avisa(); proximoDepoisDoLogin(); },
    _entAvisos: function () { ativarAvisos(entM, function () { passo('pronto'); }); },
    _entPasso: passo, _entFim: fechaEntrada
  };

  /* abre a entrada: no app instalado (1ª vez) ou com ?app=1 no endereço (para mostrar na prévia) */
  var pedeEntrada = /[?&]app=1/.test(location.search);
  if (pedeEntrada) { try { var u = new URL(location.href); u.searchParams.delete('app'); history.replaceState(null, '', u.toString()); } catch (e) {} }
  window.addEventListener('load', function () {
    var m = document.body.dataset.marcaPontos;
    if (!m || !CFG[m]) return;
    if (pedeEntrada) entrada(m, true); else if (emApp()) entrada(m, false);
  });
})();
