/* App da Fada Marinha, desenhado a partir da prancha que ela mandou.
   Produtos, filas e lançamentos vêm da mesma loja de demonstração do site (comum/loja.js);
   na versão de verdade vêm da Nuvemshop dela. Pontos, login e avisos: comum/pontos.js. */
const M='fada',$=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const R=Loja.dinheiro,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduz=matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA='5541996890967';
Object.assign(Pontos.CFG.fada,{clube:'Clube da Fada',ola:'Seja membro do Clube da Fada',lojaLink:'#/loja',lojaTxt:'Ver a loja',pedeCelular:true,
 premios:[{id:'amostra',t:'Amostra de 2 ml',d:'De um perfume que você escolher. Vai junto no próximo pedido.',pts:150,tipo:'brinde'},
  {id:'frete',t:'Frete grátis',d:'Cupom para o próximo pedido, para qualquer lugar do Brasil.',pts:300,tipo:'cupom',valor:'frete'},
  {id:'desc20',t:'R$ 20 de desconto',d:'Cupom para a próxima compra acima de R$ 100.',pts:400,tipo:'cupom',valor:20},
  {id:'mini',t:'Miniatura de 10 ml',d:'De um perfume à tona. Vai junto no próximo pedido.',pts:700,tipo:'brinde'}]});

/* o que o app guarda neste aparelho (na versão de verdade: no banco da Fada) */
const Est={K:'fada_app_v1',
 ler(){try{return Object.assign({avisos:[],visto:0,cupons:[],emails:{}},JSON.parse(localStorage.getItem(this.K)||'{}'))}catch(e){return {avisos:[],visto:0,cupons:[],emails:{}}}},
 mexe(fn){const s=this.ler();fn(s);try{localStorage.setItem(this.K,JSON.stringify(s))}catch(e){}return s}};
function avisosEnviados(){const agora=Date.now();return Est.ler().avisos.filter(a=>new Date(a.quando).getTime()<=agora).sort((a,b)=>a.quando<b.quando?1:-1)}
function naoLidos(){const v=Est.ler().visto;return avisosEnviados().filter(a=>new Date(a.quando).getTime()>v).length}
/* aviso de verdade neste aparelho (a versão final manda para todos pelo servidor) */
function notifica(a){if(Pontos.permissao()!=='granted'||!navigator.serviceWorker)return Promise.resolve(false);return navigator.serviceWorker.getRegistration().then(r=>{const o={body:a.texto,icon:'icone-192.png',badge:'icone-192.png',tag:'aviso-'+a.id,data:{url:location.pathname+(a.link||'#/avisos')}};if(a.imagem)o.image=a.imagem;if(r&&r.showNotification){r.showNotification(a.titulo,o);return true}new Notification(a.titulo,o);return true}).catch(()=>false)}
function codigo(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let x='';for(let i=0;i<4;i++)x+=c[Math.floor(Math.random()*c.length)];return 'FADA-'+x}
function meusPresentes(){return Est.ler().cupons.filter(c=>!c.usado&&(!c.validade||new Date(c.validade)>new Date()))}
/* trocar pontos por cupom de desconto ou brinde */
Pontos.trocar=function(m,id){const p=Pontos.premios(M).find(x=>x.id===id);if(!p)return;if(Pontos.meu(M).saldo<p.pts)return;
 abre(`<h2>${esc(p.t)}</h2><p>${esc(p.d)}</p><p>Saem <b>${p.pts.toLocaleString('pt-BR')} pontos</b> do seu saldo. Seu nível continua o mesmo.</p><button class="acao" onclick="confirmaTroca('${id}')">Trocar ${p.pts.toLocaleString('pt-BR')} pontos</button><button class="acao vazada" onclick="dlg.close()">Agora não</button>`)};
/* no Clube de verdade, quem troca é o banco e o cupom nasce na loja (js/nuvem.js) */
function trocaNuvem(id){const p=Pontos.premios(M).find(x=>x.id===id);if(!p)return;
 abre(`<h2>${esc(p.t)}</h2><p>Trocando seus pontos…</p>`);
 const falhou=t=>abre(`<h2>Não deu para trocar</h2><p>${esc(t||'Tente de novo daqui a pouco.')}</p><button class="acao" onclick="dlg.close()">Fechar</button>`);
 PontosNuvem.trocar(id).then(d=>{if(!d||!d.ok)return falhou(d&&d.erro);const c=d.cupom;
  abre(c.tipo!=='brinde'?`<h2>Seu cupom está pronto</h2><p>Use no pagamento da próxima compra, no app ou no site da loja. Vale até ${new Date(c.vence+'T12:00:00').toLocaleDateString('pt-BR')} e é só seu.</p><div class="cupom-g"><span>${esc(c.codigo)}</span><small>${esc(p.t)}</small></div><button class="acao" onclick="copia('${esc(c.codigo)}',this)">Copiar o código</button><button class="acao vazada" onclick="dlg.close()">Fechar</button>`
   :`<h2>Seu brinde está guardado</h2><p>${esc(p.t)} vai junto no seu próximo pedido. A Fada recebe o aviso no painel para separar.</p><button class="acao" onclick="dlg.close()">Fechar</button>`)}).catch(()=>falhou())}
function confirmaTroca(id){if(window.PontosNuvem)return trocaNuvem(id);const p=Pontos.premios(M).find(x=>x.id===id),c=Rec.conta(M);if(!p||Pontos.meu(M).saldo<p.pts)return;
 const item={id:'c'+Date.now(),premio:p.id,t:p.t,tipo:p.tipo,valor:p.valor||null,codigo:p.tipo==='cupom'?codigo():null,em:new Date().toISOString(),validade:new Date(Date.now()+60*864e5).toISOString(),nome:c?c.nome:'Visitante'};
 Est.mexe(s=>s.cupons.unshift(item));Pontos.debitar(M,p.pts,'Trocou por '+p.t.toLowerCase());
 abre(p.tipo==='cupom'?`<h2>Seu cupom está pronto</h2><p>Use no pagamento da próxima compra. Vale por 60 dias e é só seu.</p><div class="cupom-g"><span>${item.codigo}</span><small>${esc(p.t)}</small></div><button class="acao" onclick="copia('${item.codigo}',this)">Copiar o código</button><button class="acao vazada" onclick="dlg.close()">Fechar</button><p class="miudo">Na sacola do app ele já entra sozinho. O e-mail com o cupom também sai na hora.</p>`
  :`<h2>Seu brinde está guardado</h2><p>${esc(p.t)} vai junto no seu próximo pedido. A Fada recebe o aviso no painel para separar.</p><button class="acao" onclick="dlg.close()">Fechar</button>`)}
function copia(t,b){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{b.textContent='Código copiado'},()=>{b.textContent=t})}


const EST='<svg class="estrela" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1c.6 6.5 4.5 10.4 11 11-6.5.6-10.4 4.5-11 11-.6-6.5-4.5-10.4-11-11 6.5-.6 10.4-4.5 11-11z"/></svg>';
const I=(d,c='i')=>`<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const IC={
 perfume:'<path d="M9.5 3h5v3h-5z"/><path d="M10.5 6v2.2M13.5 6v2.2"/><rect x="5" y="8.2" width="14" height="12.8" rx="4"/><path d="M8.5 14.5c1.2-1.6 5.8-1.6 7 0"/>',
 escola:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.3 2.7 3 6 3s6-1.7 6-3v-5"/><path d="M22 9v5"/>',
 receita:'<path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="m15 3-4 9"/><path d="M8 21h8"/>',
 folha:'<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="m5 19 8-8"/>',
 estrela:'<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
 presente:'<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5C10 4 6.5 5 7.5 7.5c.5 1 4.5 1 4.5 1s4-.1 4.5-1C17.5 5 14 4 12 8.5z"/>',
 seta:'<path d="m9 6 6 6-6 6"/>',volta:'<path d="M15 6 9 12l6 6"/>',
 coracao:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
 sino:'<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
 whats:'<path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z"/><path d="M9 9.5c.5 2.6 2.4 4.5 5 5l1.2-1.2-2-1-1 .8c-.9-.4-1.6-1.1-2-2l.8-1-1-2z"/>',
 fila:'<path d="M5 6h14M5 12h14M5 18h9"/>',pedido:'<path d="M6 7h12l1 13H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
 baixar:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 20h14"/>',globo:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18"/>',
 sair:'<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>'
};

/* conteúdo da Escola e das Receitas: exemplo até a Fada mandar o dela */
const ESCOLA=[
 {id:'perfumaria',t:'Perfumaria Natural',s:'Do essencial ao autoral',img:'arte/perola.webp',f:['Online','No seu ritmo','Vídeo e apostila'],
  d:'Aprenda a ler as notas, a combinar óleos essenciais e absolutos e a montar seu primeiro perfume botânico, do jeito que a Fada cria os dela.',
  m:['As famílias olfativas e a pirâmide de notas','Óleos essenciais, absolutos e fixadores naturais','Diluição, maceração e maturação','Seu primeiro perfume autoral, do rascunho ao frasco']},
 {id:'cosmeticos',t:'Cosméticos Naturais',s:'Cuidados que vêm da natureza',img:'arte/hibisco.webp',f:['Online','Turma com encontros ao vivo'],
  d:'Sabonetes, óleos, manteigas e brumas com ingredientes que você entende. Para usar em casa ou para começar a vender.',
  m:['O que cada óleo e cada manteiga faz na pele','Higiene, conservação e validade','Sabonete de glicerina e manteiga batida','Rótulo e embalagem que encantam']},
 {id:'avancadas',t:'Formulações Avançadas',s:'Crie suas próprias linhas',img:'arte/coral.webp',f:['Online','Turma pequena','Acompanhamento'],
  d:'Para quem já faz e quer uma linha com identidade: fórmulas estáveis, testes de uso e a história de cada produto.',
  m:['Emulsões e fases','Estabilidade e testes de uso','Ficha técnica e custo de cada fórmula','Uma linha com começo, meio e fim']}
];
const RECEITAS=[
 {id:'sabonetes',t:'Sabonetes Artesanais',s:'Sabonete de glicerina com flores',img:'arte/sabonete.webp',f:['Rende 4 sabonetes','40 minutos','Fácil'],
  ing:[['Base glicerinada branca','200 g'],['Óleo de amêndoas doces','1 colher de chá'],['Óleo essencial de lavanda','20 gotas'],['Pétalas secas (opcional)','1 colher de sopa']],
  p:['Corte a base em cubos e derreta em banho-maria, sem deixar ferver.','Tire do fogo e misture o óleo de amêndoas.','Espere esfriar um pouco e pingue o óleo essencial.','Espalhe as pétalas no fundo das forminhas e despeje a base.','Deixe firmar por 2 horas e desenforme.'],
  dica:'Use luva e cuidado com a base quente. Teste na parte de dentro do braço antes de usar no rosto.'},
 {id:'hidratantes',t:'Hidratantes Naturais',s:'Manteiga corporal batida',img:'arte/seda.webp',f:['Rende 100 g','30 minutos','Fácil'],
  ing:[['Manteiga de karité','50 g'],['Óleo de coco','30 g'],['Óleo de amêndoas doces','20 ml'],['Vitamina E','5 gotas'],['Óleo essencial que você ama','10 gotas']],
  p:['Derreta a manteiga de karité e o óleo de coco em banho-maria.','Junte o óleo de amêndoas e deixe esfriar até começar a firmar nas bordas.','Acrescente a vitamina E e o óleo essencial.','Bata com o fouet por 5 minutos, até virar um creme fofo.','Guarde em pote limpo e seco. Dura cerca de 3 meses.'],
  dica:'Se ficar mole, leve 10 minutos à geladeira e bata de novo.'},
 {id:'solidos',t:'Perfumes Sólidos',s:'Para levar na bolsa',img:'arte/concha.webp',f:['Rende 2 latinhas','20 minutos','Fácil'],
  ing:[['Cera de abelha','10 g'],['Óleo de jojoba','10 ml'],['Óleos essenciais','30 gotas']],
  p:['Derreta a cera de abelha com o óleo de jojoba em banho-maria.','Tire do fogo e espere 1 minuto.','Pingue os óleos essenciais e misture com um palito.','Despeje nas latinhas e deixe firmar sem tampa por 1 hora.'],
  dica:'Comece com 3 notas: uma fresca, uma floral e uma de fundo, como baunilha ou sândalo.'},
 {id:'brumas',t:'Brumas e Águas Perfumadas',s:'Bruma de flor de laranjeira',img:'arte/hibisco.webp',f:['Rende 100 ml','15 minutos + 2 dias','Fácil'],
  ing:[['Álcool de cereais','30 ml'],['Óleo essencial de flor de laranjeira','20 gotas'],['Glicerina vegetal','5 ml'],['Água destilada','65 ml']],
  p:['Misture o álcool com o óleo essencial.','Junte a glicerina e, por último, a água destilada.','Feche o vidro e deixe descansar por 2 dias, longe da luz.','Passe para um frasco com borrifador e agite antes de usar.'],
  dica:'Não borrife nos olhos. Teste na pele do braço antes de usar no corpo todo.'}
];
const AVISOS=[
 {t:'Sereia da Lua chega sexta, às 19h.',c:'Membros do Clube da Fada entram 1 hora antes.',q:'há 2 dias'},
 {t:'A Guardiã das Flores voltou à tona.',c:'Sérum capilar · 30 ml. Poucas unidades.',q:'há 5 dias'},
 {t:'Receita nova para membros',c:'Bruma de flor de laranjeira, na Receitas da Fada.',q:'há 1 semana'}
];
const ZONAS=window.ZONAS_FADA||{};
const TIPO={perfume:'Perfumes',cabelo:'Cabelo',corpo:'Corpo'};

/* fotos da loja: cada uma existe em vários tamanhos; se faltar uma, tenta a próxima */
const TAMS=['-640-0.webp','-480-0.webp','-1024-1024.webp','-320-0.webp','-240-0.webp'];
function fotoTag(u,t,alt='',extra=''){if(!u)return '';if(/^data:|\.(jpg|png|webp)$/.test(u))return `<img src="${u}" alt="${esc(alt)}" ${extra}>`;return `<img src="${u}-${t}-0.webp" data-base="${u}" alt="${esc(alt)}" loading="lazy" decoding="async" ${extra}>`}
addEventListener('error',e=>{const im=e.target;if(im.tagName!=='IMG'||!im.dataset.base)return;const k=+(im.dataset.k||0);if(k>=TAMS.length)return;im.dataset.k=k+1;im.src=im.dataset.base+TAMS[k]},true);

const DIAS=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
function quando(iso){const d=new Date(iso);return DIAS[d.getDay()]+', '+d.getHours()+'h'}
function falta(iso){let s=Math.max(0,(new Date(iso)-Date.now())/1e3);return {d:Math.floor(s/86400),h:Math.floor(s%86400/3600),m:Math.floor(s%3600/60)}}
const estado=p=>p.status==='disponivel'?'À tona':p.status==='estreia'?'Na próxima maré':'Foi com a maré';
function seloP(p){return p.status==='disponivel'?'<span class="selo ok">À tona</span>':p.status==='estreia'?'<span class="selo vem">'+esc(quando(p.estreia))+'</span>':'<span class="selo">Foi com a maré</span>'}
function cartaoP(p){return `<a class="prod" href="#/p/${p.id}"><figure>${fotoTag(p.fotos[0],480,p.nome)}${seloP(p)}</figure><div class="tx"><b>${esc(p.nome)}</b><small>${esc(p.medida)}</small><div class="pr"><span>${R(p.preco)}</span><i>${p.status==='disponivel'?'':p.fila?p.fila+' esperando':''}</i></div></div></a>`}
function ordem(a,b){const o={disponivel:0,estreia:1,esgotado:2};return o[a.status]-o[b.status]||(b.fila||0)-(a.fila||0)}
function favs(){try{return JSON.parse(localStorage.getItem('fada_favs')||'[]')}catch(e){return[]}}
function lanc(){return Loja.estado().lancamentos.filter(l=>l.marca===M).sort((a,b)=>a.quando<b.quando?-1:1)}

/* ---------- telas ---------- */
function inicio(){
 const ps=Loja.produtos(M),l=lanc()[0],lp=l&&Loja.produto(M,l.produto),tona=ps.filter(p=>p.status==='disponivel'),esperados=ps.filter(p=>p.status==='esgotado'&&p.fila).sort((a,b)=>b.fila-a.fila).slice(0,6),eu=Pontos.meu(M),f=l&&falta(l.quando);
 return `<a class="heroi rv" href="#/loja?c=perfume"><div class="h-img" data-px="-.16"><img src="arte/perola.webp" alt=""></div><div class="h-tx" data-px=".08"><h1>Nossos<br>Perfumes</h1><span>Descubra as coleções →</span></div></a>
 <nav class="ladrilhos" aria-label="Atalhos">
  ${[['loja?c=perfume','perfume','Perfumes'],['escola','escola','Escola<br>da Fada'],['receitas','receita','Receitas<br>da Fada'],['loja?c=corpo','folha','Cosméticos<br>Naturais'],['lancamentos','estrela','Lançamentos<br>Exclusivos'],['clube','presente','Clube<br>da Fada']].map(([h,i,t],k)=>`<a class="rv" style="--d:${.04*k}s" href="#/${h}">${I(IC[i])}<span>${t}</span></a>`).join('')}
 </nav>
 ${l&&lp?`<section class="secao"><h2 class="rv">A próxima maré <a href="#/lancamentos">Ver todos</a></h2><a class="mare rv" href="#/lancamentos"><div><span class="rotulo">Lançamento</span><h3>${esc(lp.nome)}</h3><p>Abre ${esc(quando(l.quando))}. Membros do Clube da Fada entram 1 hora antes.</p><div class="conta" data-fim="${l.quando}">${contaHTML(f)}</div></div><figure><img src="arte/frasco.webp" alt="" data-px="-.12"></figure></a></section>`:''}
 ${tona.length?`<section class="secao"><h2 class="rv">À tona agora <a href="#/loja">A loja</a></h2><div class="trilho">${tona.map(cartaoP).join('')}</div></section>`:''}
 <section class="secao"><h2 class="rv">Os mais esperados <a href="#/loja?c=perfume">Todos</a></h2><div class="trilho">${esperados.map(cartaoP).join('')}</div></section>
 <section class="secao"><a class="clube-c rv" href="#/clube"><div><span class="rotulo">Clube da Fada</span><b>${eu.nivel.atual.n}</b><small>${eu.nivel.prox?'Faltam '+eu.nivel.falta.toLocaleString('pt-BR')+' pontos para '+eu.nivel.prox.n:'Você está no nível mais alto'}</small></div><strong>${eu.saldo.toLocaleString('pt-BR')}<small>pontos</small></strong></a></section>
 ${cartaoApp(true)}
 <footer class="rodape">${EST}<p>Perfumaria botânica · Cosméticos naturais<br>Escola da Fada · Receitas exclusivas</p><small>Prévia feita pela Ti Artes</small></footer>`
}
function contaHTML(f){return f?[['d','dias'],['h','horas'],['m','min']].map(([k,t])=>`<span><b>${String(f[k]).padStart(2,'0')}</b><small>${t}</small></span>`).join(''):''}

let LJ={c:'perfume',z:'todas'};
function loja(qs){
 const q=new URLSearchParams(qs||'');if(q.get('c'))LJ.c=q.get('c');
 const todos=Loja.produtos(M).filter(p=>p.tipo===LJ.c&&(LJ.c!=='perfume'||LJ.z==='todas'||p.zona===LJ.z)).sort(ordem);
 const zs=LJ.c==='perfume'?['todas',...Object.keys(ZONAS)]:[];
 const k=Object.keys(TIPO).indexOf(LJ.c);
 return `<header class="cab"><h1 class="titulo">Loja</h1><p class="lead">${LJ.c==='perfume'?'Perfumes botânicos, em lotes pequenos.':LJ.c==='cabelo'?'Rituais para os cabelos de sereia.':'Sabonetes, poções e cuidados para o corpo.'}</p></header>
 <div class="seg" role="group" aria-label="O que você procura"><span class="pilula" style="transform:translateX(${k*100}%)"></span>${Object.entries(TIPO).map(([t,n])=>`<button aria-pressed="${LJ.c===t}" onclick="mudaLoja('c','${t}')">${n}</button>`).join('')}</div>
 ${zs.length?`<div class="chips" role="group" aria-label="Coleções">${zs.map(z=>`<button aria-pressed="${LJ.z===z}" onclick="mudaLoja('z','${z}')">${z==='todas'?'Todas as coleções':esc(ZONAS[z][0])}</button>`).join('')}</div>`:''}
 <div class="grade">${todos.map((p,i)=>`<div class="rv" style="--d:${Math.min(i,6)*.05}s">${cartaoP(p)}</div>`).join('')||'<p class="vazio">Nada nesta coleção agora.</p>'}</div>`
}
function mudaLoja(k,v){LJ[k]=v;if(k==='c')LJ.z='todas';history.replaceState(null,'','#/loja?c='+LJ.c);desenha(true);const s=$('.seg');if(s&&s.getBoundingClientRect().top>innerHeight*.4)return;scrollTo({top:0,behavior:reduz?'instant':'smooth'})}

function produto(id){
 const p=Loja.produto(M,id);if(!p)return `<header class="cab"><h1 class="titulo">Esse perfume foi com a maré</h1><a class="acao curta" href="#/loja">Ver a loja</a></header>`;
 const notas=(p.notas||'').split('·').map(s=>s.trim()).filter(Boolean),fav=favs().includes(id);
 const hist=(p.historia||'').trim().split(/\n+/).filter(Boolean).slice(0,4);
 const sim=Loja.produtos(M).filter(x=>x.id!==id&&x.tipo===p.tipo).sort((a,b)=>(a.zona===p.zona?0:1)-(b.zona===p.zona?0:1)||ordem(a,b)).slice(0,6);
 const tipoTx=p.tipo==='perfume'?'Eau de parfum · '+p.medida:p.medida;
 return `<div class="p-flut"><button class="ib" onclick="history.length>1?history.back():ir('loja')" aria-label="Voltar">${I(IC.volta)}</button><button class="ib" aria-pressed="${fav}" onclick="favorita('${id}',this)" aria-label="Guardar nos favoritos">${I(IC.coracao)}</button></div>
 <div class="p-barra" id="p-barra">${esc(p.nome)}</div>
 <section class="p-heroi" id="p-heroi"><div class="p-fotos" id="p-fotos">${p.fotos.map((u,i)=>fotoTag(u,1024,i?'':p.nome,i?'loading="lazy"':'')).join('')}</div>
  <div class="p-tit" id="p-tit"><h1>${esc(p.nome)}</h1><p class="rotulo">${esc(tipoTx)}</p><button class="acao" onclick="document.getElementById('p-folha').scrollIntoView({behavior:reduz?'instant':'smooth'})">Conhecer</button></div>
  ${p.fotos.length>1?`<div class="p-pontos" id="p-pontos">${p.fotos.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</section>
 <article class="p-folha" id="p-folha">
  <div class="p-preco"><div>${p.de?`<s>${R(p.de)}</s>`:''}<b>${R(p.preco)}</b></div><div class="est">${estado(p)}${p.status==='estreia'?'<br>'+esc(quando(p.estreia)):''}${p.status!=='disponivel'&&p.fila?'<br>'+p.fila+' esperando':''}</div></div>
  ${acaoP(p)}
  <div class="p-ganha">${EST}<span>Membro do Clube da Fada ganha <b>${Pontos.rende(M,p.preco).toLocaleString('pt-BR')} pontos</b> com ${p.tipo==='perfume'?'este perfume':'este produto'}.</span></div>
  ${p.frase?`<p class="p-frase rv">“${esc(p.frase)}”</p>`:''}
  ${notas.length?`<h2 class="rotulo rv" style="margin-top:22px">Notas</h2><div class="notas rv">${notas.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`:''}
  ${hist.length?`<div class="p-hist rv">${hist.map(t=>`<p>${esc(t)}</p>`).join('')}</div>`:''}
 </article>
 ${sim.length?`<section class="secao"><h2 class="rv">Combina com</h2><div class="trilho">${sim.map(cartaoP).join('')}</div></section>`:''}
 <div class="p-compra" id="p-compra"><div class="pc-preco"><b>${R(p.preco)}</b><small>${esc(p.status==='disponivel'?Loja.parcela(p.preco,4).replace(/ sem juros$/,''):p.status==='estreia'?quando(p.estreia):p.fila?p.fila+' na fila':'Foi com a maré')}</small></div>${botaoP(p)}</div>`
}
/* o botão de compra mora na cápsula de vidro do pé da página (revisão de 15/11/2026: no iPhone, o botão da
   folha ficava atrás do menu de baixo na primeira tela). Na folha fica só a explicação. */
function botaoP(p){
 if(p.status==='disponivel')return `<button class="acao" onclick="colocar('${p.id}')">Colocar na sacola</button>`;
 return `<button class="acao" onclick="fila('${p.id}')">Entrar na fila</button>`
}
function acaoP(p){
 if(p.status==='disponivel')return '';
 if(p.status==='estreia')return `<p class="miudo">Lote de ${p.lote||'poucas'} unidades. Quem entra na fila recebe o aviso, e membros do Clube entram 1 hora antes.</p>`;
 return `<p class="miudo">Volta em lote pequeno. Quem está na fila recebe o aviso antes de todo mundo.</p>`
}

function escola(){return `<header class="cab">${EST}<h1 class="titulo">Escola da Fada</h1><p class="lead">Cursos de perfumaria, cosméticos naturais e formulações botânicas.</p></header>
 <div class="foto-c rv"><img src="arte/escola.webp" alt="" data-px="-.12"></div>
 <ul class="lista">${ESCOLA.map((c,i)=>`<li class="rv" style="--d:${i*.06}s"><a href="#/escola/${c.id}"><img src="${c.img}" alt=""><span><b>${c.t}</b><small>${c.s}</small></span>${I(IC.seta)}</a></li>`).join('')}</ul>
 <p class="exemplo">Textos de exemplo. A Fada troca pelos cursos dela.</p>`}
function curso(id){const c=ESCOLA.find(x=>x.id===id);if(!c)return escola();
 return `<div class="p-flut"><button class="ib" onclick="history.length>1?history.back():ir('escola')" aria-label="Voltar">${I(IC.volta)}</button><span></span></div>
 <div class="det-cab"><img src="${c.img}" alt="" data-px="-.14"></div>
 <div class="det-tx"><span class="rotulo">Escola da Fada</span><h1>${c.t}</h1><p class="sub">${c.s}</p><div class="fatos">${c.f.map(x=>`<span>${x}</span>`).join('')}</div>
  <p class="rv">${c.d}</p><h2 class="rv">O que você aprende</h2><ul class="ing rv">${c.m.map(x=>`<li><span>${x}</span></li>`).join('')}</ul>
  <div class="trava rv"><p>Membros do Clube da Fada têm prioridade na próxima turma.</p><button class="acao" onclick="conversa('Oi, Paula! Quero saber da Escola da Fada: ${c.t}.')">Quero participar</button></div>
  <p class="exemplo" style="margin:16px 0 0">Texto de exemplo. A Fada troca pelo dela.</p></div>`}

function receitas(){return `<header class="cab">${EST}<h1 class="titulo">Receitas da Fada</h1><p class="lead">Fórmulas exclusivas, naturais e encantadas para você baixar e criar.</p></header>
 <div class="foto-c rv"><img src="arte/sabonete.webp" alt="" data-px="-.12"></div>
 <ul class="lista">${RECEITAS.map((c,i)=>`<li class="rv" style="--d:${i*.06}s"><a href="#/receitas/${c.id}"><img src="${c.img}" alt=""><span><b>${c.t}</b><small>${c.s}</small></span>${I(IC.seta)}</a></li>`).join('')}</ul>
 <p class="exemplo">Receitas de exemplo. A Fada coloca as dela.</p>`}
function receita(id){const c=RECEITAS.find(x=>x.id===id);if(!c)return receitas();const membro=!!Rec.conta(M);
 return `<div class="p-flut"><button class="ib" onclick="history.length>1?history.back():ir('receitas')" aria-label="Voltar">${I(IC.volta)}</button><span></span></div>
 <div class="det-cab"><img src="${c.img}" alt="" data-px="-.14"></div>
 <div class="det-tx"><span class="rotulo">Receitas da Fada</span><h1>${c.t}</h1><p class="sub">${c.s}</p><div class="fatos">${c.f.map(x=>`<span>${x}</span>`).join('')}</div>
  <h2 class="rv">Você vai precisar</h2><ul class="ing rv">${c.ing.map(([a,b])=>`<li><span>${a}</span><b>${b}</b></li>`).join('')}</ul>
  <h2 class="rv">Passo a passo</h2><ol class="passos rv">${c.p.map(x=>`<li>${x}</li>`).join('')}</ol>
  <div class="dica rv">${EST}<span>${c.dica}</span></div>
  ${membro?`<button class="acao" onclick="imprime('${c.id}')">${I(IC.baixar)}Baixar a receita</button>`:`<div class="trava rv"><p>Baixar a receita é exclusivo para membros do Clube da Fada.</p><button class="acao" onclick="Pontos.entrada(M,true)">Seja membro</button></div>`}
  <p class="exemplo" style="margin:16px 0 0">Receita de exemplo. A Fada coloca as dela.</p></div>`}
function imprime(id){const c=RECEITAS.find(x=>x.id===id);const d=$('#impressao');d.innerHTML=`<h1 style="font:italic 500 34px Cormorant Garamond,serif">${c.t}</h1><p style="font:14px Montserrat,sans-serif">Receitas da Fada · Fada Marinha</p><h2 style="margin-top:18px;font:600 18px Montserrat,sans-serif">Você vai precisar</h2><ul>${c.ing.map(([a,b])=>`<li>${a}: ${b}</li>`).join('')}</ul><h2 style="margin-top:18px;font:600 18px Montserrat,sans-serif">Passo a passo</h2><ol>${c.p.map(x=>`<li style="margin:6px 0">${x}</li>`).join('')}</ol><p style="margin-top:14px">${c.dica}</p>`;setTimeout(()=>print(),50)}

function lancamentos(){const ls=lanc();
 return `<header class="cab">${EST}<h1 class="titulo">Lançamentos Exclusivos</h1><p class="lead">Os membros do Clube da Fada sabem antes e entram antes.</p></header>
 ${ls.map(l=>{const p=Loja.produto(M,l.produto);if(!p)return '';return `<article class="lanc rv"><figure><img src="arte/frasco.webp" alt="" data-px="-.12"></figure><div class="tx"><span class="rotulo">${esc(quando(l.quando))} · lote de ${l.lote||'poucas'} unidades</span><h3>${esc(p.nome)}</h3><p class="miudo">${esc(p.frase||'')}</p><div class="mare"><div class="conta" data-fim="${l.quando}">${contaHTML(falta(l.quando))}</div></div><button class="acao" onclick="fila('${p.id}')">Me avise quando abrir</button><a class="acao vazada" href="#/p/${p.id}">Conhecer</a></div></article>`}).join('')||'<p class="vazio">Nenhum lançamento marcado agora.</p>'}
 <section class="secao"><h2 class="rv">Qual sereia volta primeiro?</h2><p class="miudo rv" style="margin-top:-4px">Vote nos esgotados. A Fada vê o resultado no painel.</p><button class="acao rv" onclick="Pontos.votar(M)">Votar</button></section>`}

function avisos(){const p=Pontos.permissao();Est.mexe(s=>{s.visto=Date.now()});
 return `<header class="cab">${EST}<h1 class="titulo">Avisos</h1><p class="lead">Lotes, voltas à tona e receitas novas.</p></header>
 ${p==='granted'?'':`<div class="liga rv"><div><b>${p==='denied'?'Avisos bloqueados':'Ligue os avisos'}</b>${p==='denied'?'Para ligar: Ajustes do celular, Notificações, Fada Marinha.':p==='sem'?'No iPhone, os avisos chegam pelo app na tela de início.':'Saiba do lote na hora e ganhe 50 pontos.'}</div>${p==='denied'?'':p==='sem'?`<button class="acao" onclick="baixar()">Baixar</button>`:`<button class="acao" onclick="Pontos.ativarAvisos(M)">Ligar</button>`}</div>`}
 <ul class="avisos-l">${avisosEnviados().map((a,i)=>`<li class="rv" style="--d:${i*.06}s"><img src="icone-192.png" alt=""><div><b>Fada Marinha <span>${tempo(a.quando)}</span></b><p><strong>${esc(a.titulo)}</strong> ${esc(a.texto)}</p>${a.link?`<a class="aviso-ir" href="${a.link}">Ver →</a>`:''}</div></li>`).join('')}${AVISOS.map((a,i)=>`<li class="rv" style="--d:${i*.06}s"><img src="icone-192.png" alt=""><div><b>Fada Marinha <span>${a.q}</span></b><p><strong>${a.t}</strong> ${a.c}</p></div></li>`).join('')}</ul>
 <p class="exemplo">Os três últimos são exemplos. Os avisos que a Fada manda pelo painel aparecem aqui em cima.</p>`}
function tempo(iso){const s=(Date.now()-new Date(iso))/1e3;if(s<60)return 'agora';if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}

function perfil(){const c=Rec.conta(M),eu=Pontos.meu(M),filas=Loja.estado().espera.filter(e=>e.marca===M&&e.meu),fv=favs(),perm=Pontos.permissao(),inst=Instalar.situacao()==='instalado';
 return `<header class="perfil"><div class="avatar">${c?esc(c.nome.trim()[0]):'✦'}</div><h1>${c?esc(c.nome):'Seja membro'}</h1><p class="rotulo">${c?'Membro do Clube da Fada · '+eu.nivel.atual.n:'Clube da Fada'}</p>${c?'':`<div style="width:100%;max-width:340px">${Pontos.botaoGoogle(M)}<button class="acao vazada" onclick="Pontos.entrada(M,true)">Outras formas de entrar</button></div>`}</header>
 <section class="secao" style="padding-top:18px"><a class="clube-c" href="#/clube"><div><span class="rotulo">Seus pontos</span><b>${eu.nivel.atual.n}</b><small>${eu.nivel.prox?'Faltam '+eu.nivel.falta.toLocaleString('pt-BR')+' para '+eu.nivel.prox.n:'Nível mais alto'}</small></div><strong>${eu.saldo.toLocaleString('pt-BR')}</strong></a></section>
 <ul class="menu-l">
  <li><a href="#/lancamentos">${I(IC.fila)}<span>Minhas filas</span><em>${filas.length||'nenhuma'}</em></a></li>
  <li><a href="#/favoritos">${I(IC.coracao)}<span>Favoritos</span><em>${fv.length||'nenhum'}</em></a></li>
  <li><button onclick="abre('<h2>Meus pedidos</h2><p>Quando você comprar, seus pedidos aparecem aqui com o código de rastreio. Na versão de verdade vêm da loja da Fada na Nuvemshop.</p>')">${I(IC.pedido)}<span>Meus pedidos</span><em>nenhum</em></button></li>
  <li><a href="#/avisos">${I(IC.sino)}<span>Avisos</span><em>${perm==='granted'?'ligados':'desligados'}</em></a></li>
  <li><button onclick="conversa('Oi, Paula! Vim pelo app da Fada Marinha.')">${I(IC.whats)}<span>Falar com a Fada</span><em>WhatsApp</em></button></li>
  ${inst?'':`<li><button onclick="baixar()">${I(IC.baixar)}<span>Baixar o app</span><em>${Instalar.situacao()==='umtoque'?'1 toque':''}</em></button></li>`}
  <li><a href="#/adm">${I(IC.presente)}<span>Painel da Fada</span><em>prévia</em></a></li>
  ${c?`<li><button onclick="Pontos.sair(M);desenha(true)">${I(IC.sair)}<span>Sair</span><em></em></button></li>`:''}
 </ul>
 <footer class="rodape"><small>Prévia feita pela Ti Artes</small></footer>`}

function favoritos(){const ps=favs().map(id=>Loja.produto(M,id)).filter(Boolean);
 return `<header class="cab">${EST}<h1 class="titulo">Favoritos</h1><p class="lead">Os que você guardou com o coração.</p></header><div class="grade">${ps.map(cartaoP).join('')}</div>${ps.length?'':'<p class="vazio">Toque no coração de um perfume para guardar aqui.</p>'}`}
function clube(){const ps=meusPresentes();
 const pres=ps.length?`<h2 class="pres-t">Seus presentes</h2><ul class="pres">${ps.map(c=>`<li>${c.tipo==='cupom'?`<button class="cupom" onclick="copia('${c.codigo}',this.querySelector('em'))"><b>${c.codigo}</b><span>${esc(c.t)} · vale até ${new Date(c.validade).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span><em>Copiar</em></button>`:`<div class="cupom brinde"><b>${esc(c.t)}</b><span>Vai junto no próximo pedido</span><em>Brinde</em></div>`}</li>`).join('')}</ul>`:'';
 const h=Pontos.tela(M);const i=h.indexOf('<h2>Como ganhar');
 return `<section class="pg-clube">${i>0?h.slice(0,i)+pres+h.slice(i):h+pres}</section>`}

/* ---------- rotas ---------- */
const TELAS={'':inicio,inicio,loja,escola,receitas,lancamentos,avisos,perfil,favoritos,clube,pontos:clube};
function rota(){const h=location.hash.replace(/^#\/?/,''),[cam,qs]=h.split('?'),[a,b]=cam.split('/');return {a:a||'',b,qs}}
function ir(a){location.hash='#/'+a}
let primeira=true;
function desenha(fica){
 const {a,b,qs}=rota(),main=$('#conteudo');
 const faz=()=>{
  let h;
  if(a==='adm')h=Adm.tela(b||'hoje');else if(a==='p')h=produto(b);else if(a==='escola'&&b)h=curso(b);else if(a==='receitas'&&b)h=receita(b);else h=(TELAS[a]||inicio)(qs);
  main.innerHTML=h;
  document.body.className=(a==='p'?'tela-p':'')+((a==='escola'||a==='receitas')&&b?' sem-topo':'')+(a==='adm'?' modo-adm':'');
  const aba=a==='p'?'loja':a==='lancamentos'||a==='clube'||a==='pontos'||a==='avisos'||a==='favoritos'?'':a||'inicio';
  $$('#nav-app a').forEach((x,i)=>{if(x.dataset.aba===(aba||'x')){x.setAttribute('aria-current','page');$('#nav-app .nav-pilula').style.transform=`translateX(${i*100}%)`}else x.removeAttribute('aria-current')});$('#nav-app .nav-pilula').style.opacity=$('#nav-app a[aria-current]')?1:0;
  if(a==='adm')Adm.monta(b||'hoje');
  document.title=tituloDe(a,b);
  if(!fica){scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true})}
  monta();
 };
 if(!fica&&!primeira&&document.startViewTransition&&!reduz){const t=document.startViewTransition(faz);t.ready.catch(()=>{});t.finished.catch(()=>{})}else faz();
 primeira=false;
}
function tituloDe(a,b){const n={adm:'Painel',loja:'Loja',escola:'Escola da Fada',receitas:'Receitas da Fada',lancamentos:'Lançamentos',avisos:'Avisos',perfil:'Perfil',clube:'Clube da Fada',pontos:'Clube da Fada',favoritos:'Favoritos'};if(a==='p'){const p=Loja.produto(M,b);return (p?p.nome+' · ':'')+'Fada Marinha'}return (n[a]?n[a]+' · ':'')+'Fada Marinha'}
addEventListener('hashchange',()=>desenha());

/* ---------- movimento ao rolar ---------- */
let efeitos=[],agendado=false,io;
function monta(){
 efeitos=[];
 const topo=$('#topo'),est=$('.marca .estrela');
 efeitos.push(y=>{topo.classList.toggle('rolou',y>8);if(est&&!reduz)est.style.transform=`rotate(${y*.25}deg)`});
 if(!reduz){
  $$('[data-px]').forEach(el=>{const k=+el.dataset.px;efeitos.push(()=>{const r=el.parentElement.getBoundingClientRect();if(r.bottom<-80||r.top>innerHeight+80)return;const c=(r.top+r.height/2-innerHeight/2)/innerHeight;el.style.transform=`translate3d(0,${(c*k*100).toFixed(1)}%,0)`})});
  const heroi=$('#p-heroi');
  if(heroi){const tit=$('#p-tit'),fotos=$('#p-fotos'),barra=$('#p-barra');efeitos.push(y=>{const h=heroi.offsetHeight,t=Math.min(1,y/h);fotos.style.transform=`translate3d(0,${y*.42}px,0) scale(${1+t*.12})`;tit.style.transform=`translate3d(0,${-y*.18}px,0)`;tit.style.opacity=1-Math.min(1,t*1.8);barra.classList.toggle('on',y>h-120)})}
 }else{const heroi=$('#p-heroi');if(heroi){const barra=$('#p-barra');efeitos.push(y=>barra.classList.toggle('on',y>heroi.offsetHeight-120))}}
 /* trilhos: o cartão do meio cresce, os das pontas recuam */
 $$('.trilho').forEach(tr=>{const vai=()=>{const r=tr.getBoundingClientRect(),c=r.left+r.width/2;[...tr.children].forEach(el=>{const b=el.getBoundingClientRect(),d=Math.min(1,Math.abs(b.left+b.width/2-c)/r.width);el.style.transform=reduz?'':`scale(${(1-d*.12).toFixed(3)})`;el.style.opacity=(1-d*.35).toFixed(2)})};tr.addEventListener('scroll',()=>requestAnimationFrame(vai),{passive:true});vai()});
 /* fotos do produto: bolinhas acompanham o deslize */
 const pf=$('#p-fotos'),pp=$('#p-pontos');if(pf&&pp)pf.addEventListener('scroll',()=>{const i=Math.round(pf.scrollLeft/pf.clientWidth);[...pp.children].forEach((e,k)=>e.classList.toggle('on',k===i))},{passive:true});
 /* revelar */
 if(io)io.disconnect();
 io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target)}}),{rootMargin:'0px 0px -6% 0px'});
 $$('.rv').forEach(e=>io.observe(e));
 roda();atualizaSacola();atualizaSino();
}
function roda(){const y=scrollY;efeitos.forEach(f=>f(y))}
addEventListener('scroll',()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;roda()})},{passive:true});
addEventListener('resize',roda);
setInterval(()=>$$('.conta[data-fim]').forEach(e=>e.innerHTML=contaHTML(falta(e.dataset.fim))),30000);

/* ---------- ações ---------- */
function abre(h){const d=$('#dlg');d.innerHTML=`<button class="fechar" aria-label="Fechar" onclick="dlg.close()">${I('<path d="M6 6l12 12M18 6 6 18"/>')}</button>${h}`;if(!d.open)d.showModal()}
const dlg=$('#dlg');dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
function toast(t){const e=$('#toast');e.firstElementChild.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2600)}
function baixar(){abre(Instalar.html())}
/* "Baixe o app" no fim da tela inicial: o mesmo instalador do menu, no jeito certo de cada celular.
   Android com Chrome: um toque abre a janela de instalar do próprio celular. iPhone: a Apple só deixa pelos dois toques do Safari.
   Dentro do Instagram não dá para instalar: o botão leva para o Chrome (Android) ou explica o Safari (iPhone). Some quando o app já está instalado. */
function cartaoApp(entra){const s=Instalar.situacao();if(s==='instalado')return '';
 const sub={umtoque:'Um toque e ele aparece na sua tela, sem passar por loja de aplicativos.',android:'Fica na sua tela como um app, sem passar por loja de aplicativos.',iphone:'Dois toques no iPhone e ele fica na sua tela de início.','instagram-android':'Dentro do Instagram não dá para instalar: abra no Chrome e baixe com um toque.','instagram-iphone':'Dentro do Instagram não dá para instalar: abra no Safari e baixe em dois toques.',computador:'Abra este endereço no celular para baixar.'}[s]||'';
 const bt=s==='umtoque'?`<button class="acao" onclick="baixarJa(this)">Baixar o app</button>`:s==='instagram-android'?`<a class="acao" href="${Instalar.linkChrome()}">Abrir no Chrome</a>`:s==='computador'?`<button class="acao" onclick="Instalar.copiarEndereco(this)">Copiar o endereço</button>`:`<button class="acao" onclick="baixar()">${s==='instagram-iphone'?'Como abrir no Safari':'Baixar o app'}</button>`;
 return `<section class="secao" id="app-c"><div class="app-c${entra?' rv':''}"><img src="icone-192.png" alt="" width="64" height="64"><div><span class="rotulo">O app da Fada</span><b>Baixe o app e ganhe ${Pontos.regras(M).app} pontos</b><small>${sub}</small></div>${bt}<ul class="app-v"><li>Aviso quando um perfume volta à tona</li><li>Seus pontos e cupons do Clube</li><li>A Escola e as receitas da Fada</li></ul></div></section>`}
function refazApp(){const c=$('#app-c');if(!c)return;const h=cartaoApp(false);if(!h)return c.remove();c.outerHTML=h}
function baixarJa(b){Instalar.tocar(b).then(ok=>{if(ok){toast('Pronto, o app está na sua tela');refazApp()}})}
Instalar.aoMudar(refazApp);
function conversa(txt){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(txt),'_blank','noopener')}
function favorita(id,b){let f=favs();f=f.includes(id)?f.filter(x=>x!==id):[id,...f];try{localStorage.setItem('fada_favs',JSON.stringify(f))}catch(e){}b.setAttribute('aria-pressed',f.includes(id));toast(f.includes(id)?'Guardado nos favoritos':'Tirado dos favoritos')}
function abreMenu(){abre(`<h2>Fada Marinha</h2><ul class="menu-g">${[['loja?c=perfume','Perfumes'],['loja?c=corpo','Cosméticos naturais'],['loja?c=cabelo','Cabelo'],['escola','Escola da Fada'],['receitas','Receitas da Fada'],['lancamentos','Lançamentos exclusivos'],['clube','Clube da Fada'],['avisos','Avisos']].map(([a,t])=>`<li><a href="#/${a}" onclick="dlg.close()">${t}<small>→</small></a></li>`).join('')}<li><a href="#/adm" onclick="dlg.close()">Painel da Fada<small>ADM</small></a></li></ul><p class="miudo">Prévia feita pela Ti Artes. O painel fica só com a Fada na versão final.</p>`)}
let semAviso=false;
function colocar(id){semAviso=true;Loja.colocar(M,id);semAviso=false;const p=Loja.produto(M,id);toast(p.nome+' na sacola');atualizaSacola()}
function atualizaSacola(){const it=Loja.sacola(M).map(i=>({...i,p:Loja.produto(M,i.id)})).filter(x=>x.p),n=it.reduce((s,x)=>s+x.qtd,0),v=it.reduce((s,x)=>s+x.p.preco*x.qtd,0);$('#sacola-f').hidden=!n;document.body.classList.toggle('com-sacola',!!n);$('#sacola-t').textContent=n?`Sacola · ${n} · ${R(v)}`:''}
let cupomEscolhido=null;
function contaSacola(){const it=Loja.sacola(M).map(i=>({...i,p:Loja.produto(M,i.id)})).filter(x=>x.p),sub=it.reduce((s,x)=>s+x.p.preco*x.qtd,0),ps=meusPresentes(),cs=ps.filter(c=>c.tipo==='cupom'),br=ps.filter(c=>c.tipo==='brinde');
 if(cupomEscolhido&&!cs.find(c=>c.id===cupomEscolhido))cupomEscolhido=null;if(cupomEscolhido===null&&cs.length)cupomEscolhido=cs[0].id;
 const cp=cs.find(c=>c.id===cupomEscolhido),desc=cp&&typeof cp.valor==='number'&&sub>=100?cp.valor:0;return {it,sub,cs,br,cp,desc,v:sub-desc}}
function abreSacola(){const {it,sub,cs,br,cp,desc,v}=contaSacola();
 abre(`<h2>Sacola</h2>${it.length?`<ul class="itens">${it.map(x=>`<li>${fotoTag(x.p.fotos[0],240,'')}<div><b>${esc(x.p.nome)}</b><small class="miudo">${esc(x.p.medida)}<br>${R(x.p.preco)}</small></div><div class="qtd"><button onclick="qtd('${x.id}',-1)" aria-label="Tirar um">−</button><b>${x.qtd}</b><button onclick="qtd('${x.id}',1)" aria-label="Colocar mais um">+</button></div></li>`).join('')}</ul>${br.length?`<ul class="itens">${br.map(b=>`<li class="li-brinde"><span class="brinde-ic">${EST}</span><div><b>${esc(b.t)}</b><small class="miudo">Brinde do Clube da Fada</small></div><b>R$ 0</b></li>`).join('')}</ul>`:''}
 ${cs.length?`<div class="cupons-s">${cs.map(c=>`<label class="op"><input type="radio" name="cp" ${cp&&cp.id===c.id?'checked':''} onchange="cupomEscolhido='${c.id}';abreSacola()"><span><b>${c.codigo}</b> · ${esc(c.t)}${typeof c.valor==='number'&&sub<100?' (compras acima de R$ 100)':''}</span></label>`).join('')}<label class="op"><input type="radio" name="cp" ${cp?'':'checked'} onchange="cupomEscolhido='';abreSacola()"><span>Guardar o cupom para depois</span></label></div>`:''}
 ${desc?`<div class="soma" style="font-weight:500;font-size:15px"><span>Cupom ${cp.codigo}</span><span>−${R(desc)}</span></div>`:''}${cp&&cp.valor==='frete'?`<div class="soma" style="font-weight:500;font-size:15px"><span>Frete</span><span>Grátis</span></div>`:''}
 <div class="soma"><span>Total</span><span>${R(v)}</span></div><p class="miudo">${Loja.parcela(v,4)} ou Pix. Rende ${Pontos.rende(M,v).toLocaleString('pt-BR')} pontos no Clube da Fada.</p><button class="acao" onclick="pagar()">Finalizar compra</button>`:'<p>Sua sacola está vazia.</p><a class="acao" href="#/loja" onclick="dlg.close()">Ver a loja</a>'}`)}
function qtd(id,d){const it=Loja.sacola(M).find(i=>i.id===id);if(!it)return;semAviso=true;Loja.quantidade(M,id,it.qtd+d);semAviso=false;atualizaSacola();abreSacola()}
/* no Clube de verdade, quem cobra é a loja da Fada: o app abre o caixa dela (ou a página do perfume) */
function pagarNaLoja(){const {it,v,cp}=contaSacola(),p=it[0]&&it[0].p,url=p?PontosNuvem.loja+'/produtos/'+encodeURIComponent(p.slug||p.id)+'/':PontosNuvem.loja+'/';
 abre(`<h2>Pagamento</h2><p>O pagamento é feito na loja da Fada, com Pix, cartão e frete, como sempre. Quando ele for aprovado, os pontos caem aqui sozinhos.</p>${it.length>1?`<p>Na loja, coloque na sacola: ${it.map(x=>esc(x.p.nome)+(x.qtd>1?' ('+x.qtd+')':'')).join(', ')}.</p>`:''}${cp&&cp.codigo?`<p>No pagamento, use o cupom <b>${esc(cp.codigo)}</b>.</p>`:''}<p>Esta compra rende <b>${Pontos.rende(M,v).toLocaleString('pt-BR')} pontos</b>. Use na loja o mesmo e-mail do Clube.</p><a class="acao" id="ir-loja" href="${url}" target="_blank" rel="noopener">Ir para o pagamento</a><button class="acao vazada" onclick="dlg.close()">Voltar</button>`);
 if(PontosNuvem.lojaLigada()){const b=$('#ir-loja');b.textContent='Abrindo o caixa da loja…';PontosNuvem.caixa(it.map(x=>({nid:x.p.nid,qtd:x.qtd}))).then(u=>{if(u)b.href=u;b.textContent='Ir para o pagamento'}).catch(()=>{b.textContent='Ir para o pagamento'})}}
function pagar(){if(window.PontosNuvem)return pagarNaLoja();const {v}=contaSacola();
 abre(`<h2>Pagamento</h2><p>Na versão de verdade, este passo abre o pagamento da loja da Fada na Nuvemshop: Pix, cartão, frete e nota fiscal. A compra entra na conta dela e os pontos caem sozinhos.</p><p>Esta compra rende <b>${Pontos.rende(M,v).toLocaleString('pt-BR')} pontos</b>.</p><button class="acao" onclick="simula()">Simular compra aprovada</button><button class="acao vazada" onclick="dlg.close()">Voltar</button>`)}
function simula(){const {it,v,cp,br}=contaSacola();dlg.close();Est.mexe(s=>s.cupons.forEach(c=>{if((cp&&c.id===cp.id)||br.find(b=>b.id===c.id)){c.usado=true;c.usadoEm=new Date().toISOString()}}));cupomEscolhido=null;semAviso=true;it.forEach(x=>Loja.tirar(M,x.id));semAviso=false;Pontos.compra(M,v,it.map(x=>x.p.nome).join(', '));atualizaSacola();ir('clube')}
function fila(id){const p=Loja.produto(M,id),c=Rec.conta(M);
 abre(`<h2>${esc(p.nome)}</h2><p>${p.status==='estreia'?`Abre ${esc(quando(p.estreia))}. Membros do Clube da Fada recebem o aviso e entram 1 hora antes.`:'Quando voltar à tona, você recebe o aviso antes de abrir para todo mundo.'}</p>
 <form onsubmit="entra(event,'${id}')"><label class="campo">Seu nome<input required name="nome" autocomplete="name" value="${c?esc(c.nome):''}"></label><label class="campo">WhatsApp com DDD<input required name="wa" inputmode="tel" autocomplete="tel" placeholder="(41) 99999-9999" oninput="Rec.mascaraTel(this)"></label><label class="op"><input type="checkbox" required name="ok">Aceito receber este aviso e novidades da Fada Marinha. Posso sair quando quiser.</label><button class="acao">Entrar na fila</button></form>`)}
function entra(e,id){e.preventDefault();const f=e.target,p=Loja.produto(M,id);let pos=0;semAviso=true;pos=Loja.entrarNaFila(M,id,{nome:f.nome.value,wa:f.wa.value,meu:true});Loja.mexe(s=>{if(s.espera[0])s.espera[0].senha=pos});semAviso=false;
 Pontos.ganhar(M,'senha',Pontos.regras(M).senha,'Entrou na fila de '+p.nome,true);
 abre(`<h2>Você é a ${pos}ª da fila</h2><p>Avisamos no seu WhatsApp e no app quando ${esc(p.nome)} ${p.status==='estreia'?'abrir':'voltar à tona'}, antes de abrir para todo mundo.</p>${Pontos.permissao()==='granted'?'':`<button class="acao" onclick="Pontos.ativarAvisos(M);dlg.close()">Ligar os avisos do app</button>`}<button class="acao vazada" onclick="dlg.close()">Fechar</button>`)}
function atualizaSino(){$('#sino').hidden=!(naoLidos()>0||Pontos.permissao()!=='granted')}

/* ---------- abertura ---------- */
function entrarNoApp(){const ab=$('#abertura');try{localStorage.setItem('fada_app_entrou','1')}catch(e){}ab.classList.add('sai');setTimeout(()=>{ab.hidden=true;ab.classList.remove('sai');if(!Rec.conta(M))Pontos.entrada(M,true)},reduz?0:650)}
function abertura(){const pede=/[?&]app=1/.test(location.search);let ja=false;try{ja=!!localStorage.getItem('fada_app_entrou')}catch(e){}
 if(pede){try{const u=new URL(location.href);u.searchParams.delete('app');history.replaceState(null,'',u.toString())}catch(e){}}
 if((pede||!ja)&&!/^#\/adm/.test(location.hash))$('#abertura').hidden=false}

Loja.aoMudar(()=>{if(semAviso)return;const a=rota().a;if(!dlg.open&&['','inicio','loja','lancamentos','perfil','favoritos','clube','pontos','adm'].includes(a)){const y=scrollY;desenha(true);scrollTo({top:y,behavior:'instant'})}});
Pontos.aoMudar(()=>{const a=rota().a;if(['','inicio','clube','pontos','perfil','avisos','receitas','adm'].includes(a)){const y=scrollY;desenha(true);scrollTo({top:y,behavior:'instant'})}atualizaSino()});
document.addEventListener('DOMContentLoaded',()=>{abertura();desenha()});
addEventListener('storage',e=>{if(e.key===Est.K||e.key==='pp_demo_v2'){atualizaSino();const a=rota().a;if(['avisos','adm','clube'].includes(a)&&!dlg.open){const y=scrollY;desenha(true);scrollTo({top:y,behavior:'instant'})}}});
