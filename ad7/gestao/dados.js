/* =====================================================
   DADOS DA DEMONSTRAÇÃO do app de gestão da AD7.

   Os IMÓVEIS são os 116 reais do catálogo (../dados/imoveis.json, vindos do
   Tecimob). Tudo que é PESSOA aqui é inventado: nomes, telefones, propostas,
   comissões. Serve para a Adriana ver o app funcionando antes de existir o banco.

   Na entrega 2 cada lista destas vira uma coleção da sala `ad7` no Supabase
   (pessoas, negocios, captacoes, agenda, chamados, entradas, equipe) e este
   arquivo some. As telas continuam as mesmas.
   ===================================================== */
'use strict';

var DEMO = {
  hoje: { iso: '2026-10-27', texto: 'terça, 27 de outubro', mes: 'outubro' },

  /* quem entra no app */
  equipe: [
    { id: 'adriana', nome: 'Adriana', sub: 'CRECI-PR 6205 · dona', papel: 'Dona', ini: 'AD', ultimo: 'hoje 08:02',
      ve: 'Tudo: imóveis, donos, pessoas, negócios, financeiro, equipe e privacidade.' },
    { id: 'rafael', nome: 'Rafael Costa', sub: 'CRECI-PR [número] · corretor', papel: 'Corretor', ini: 'RC', ultimo: 'hoje 07:48',
      ve: 'Catálogo inteiro; dono, chaves e documentos só dos imóveis dele; só os próprios contatos e negócios; só a parte dele da comissão.' },
    { id: 'paulo', nome: 'Paulo Henrique Ramos', sub: 'captador autônomo · parceria', papel: 'Captador externo', ini: 'PH', ultimo: '—',
      ve: 'Não entra no app. Fica registrado como "captou" no imóvel e recebe por e-mail o aviso do fechamento com a parte dele.' }
  ],

  /* regra de comissão: definida uma vez na Equipe, usada no fechamento */
  comissao: {
    venda:     { pct: 0.06, base: 'do valor da venda',  partes: { ad7: 0.5, vendeu: 0.4, captou: 0.1 } },
    aluguel:   { pct: 1,    base: '1º aluguel',         partes: { ad7: 0.6, vendeu: 0.4, captou: 0 } },
    temporada: { pct: 0.2,  base: 'das diárias',        partes: { ad7: 0.7, vendeu: 0.3, captou: 0 } }
  },

  /* a história por trás de alguns imóveis do catálogo (os outros o app deriva) */
  imoveis: {
    '382': { resp: 'Rafael', cap: 'Paulo Henrique (externo)', aut: 'ok', autDe: '12/08/2026', autAte: '12/02/2027', excl: 'Com exclusividade', dono: 'd-helena', chaves: 'Na loja · gancho 12', obs: 'Aceita permuta por apto no Centro', visitas: '4 visitas · 1 proposta',
      hist: [['24/10', 'Proposta de Patrícia Mendes · R$ 720 mil · enviada à dona', 'aguarda', 'warn'], ['19/10', 'Visita de Patrícia Mendes (2ª vez) · feita por Rafael', 'feita', 'ok'], ['02/10', 'Preço de R$ 790 mil para R$ 750 mil · dona aprovou por WhatsApp', 'preço', 'neu'], ['12/08', 'Autorização assinada no celular · captação de Paulo Henrique', 'captado', 'ok']] },
    '309': { resp: 'Adriana', cap: 'Adriana', aut: 'vence', autDe: '02/05/2026', autAte: '02/11/2026', excl: 'Sem exclusividade', dono: 'd-jose', chaves: 'Com o dono', obs: 'Quer vender até o verão', visitas: '2 visitas',
      hist: [['hoje', 'Visita de Carlos e Ana Beatriz · 09:30 · Adriana', 'hoje', 'warn'], ['14/10', 'Visita de Família Ramos · acharam pequena', 'feita', 'ok'], ['02/05', 'Autorização assinada · 180 dias', 'captado', 'ok']] },
    '406': { resp: 'Adriana', cap: 'Adriana', aut: 'loc', autDe: '10/01/2025', autAte: 'renovação anual', excl: 'Administração', dono: 'd-helena', chaves: 'Com o caseiro', obs: 'Caseiro abre de manhã', visitas: '12 reservas no ano',
      hist: [['ontem', 'Juliana Prado pediu réveillon · 28/12 a 02/01 · 8 pessoas', 'novo', 'ok'], ['05/10', 'Prestação de contas de setembro enviada à dona', 'enviada', 'neu']] },
    '407': { resp: 'Adriana', cap: 'Adriana', aut: 'loc', autDe: '05/03/2025', autAte: 'renovação anual', excl: 'Administração', dono: 'd-ricardo', chaves: 'Na loja · gancho 5', obs: 'Reajuste pelo IPCA', visitas: '3 visitas',
      hist: [['24/10', 'Cadastro de Débora Antunes aprovado · contrato quinta 16:00', 'fechamento', 'ok'], ['17/10', 'Visita de Débora Antunes', 'feita', 'ok']] },
    '402': { resp: 'Rafael', cap: 'Rafael Costa', aut: 'ok', autDe: '20/09/2026', autAte: '20/03/2027', excl: 'Com exclusividade', dono: 'd-marcos', chaves: 'Na loja · gancho 7', obs: 'Aceita financiamento', visitas: '1 visita',
      hist: [['hoje', 'Visita de Família Ramos · 15:00 · sem confirmação', 'hoje', 'warn'], ['20/09', 'Anunciado no site e nos portais', 'anunciado', 'ok'], ['20/09', 'Autorização assinada no celular · captação de Rafael', 'captado', 'ok']] },
    '269': { resp: 'Rafael', cap: 'Paulo Henrique (externo)', aut: 'vendido', autDe: '15/06/2026', autAte: 'encerrada na venda', excl: 'Com exclusividade', dono: 'd-mar', chaves: 'Entregues ao comprador', obs: '—', visitas: '6 visitas',
      hist: [['14/10', 'VENDIDO por R$ 380 mil · comissão R$ 22.800 rateada', 'ganho', 'ok'], ['30/09', 'Proposta aceita · financiamento Caixa', 'proposta', 'neu']] },
    '395': { resp: 'Adriana', cap: 'Adriana', aut: 'ok', autDe: '01/10/2026', autAte: '01/04/2027', excl: 'Sem exclusividade', dono: 'd-dias', chaves: '—', obs: 'Parceria 50/50 com a Imobiliária Dias', visitas: '1 visita',
      hist: [['01/10', 'Anunciado · parceria com a Imobiliária Dias', 'anunciado', 'ok']] },
    '221': { resp: 'Adriana', cap: 'Adriana', aut: 'loc', autDe: '12/12/2024', autAte: 'renovação anual', excl: 'Administração', dono: 'd-helena', chaves: 'Na loja · gancho 3', obs: '—', visitas: '9 reservas no ano',
      hist: [['hoje', 'Vistoria de saída · Família Souza · 11:00', 'hoje', 'warn'], ['ontem', 'Aviso de desocupação pelo site (Área do Cliente)', 'site', 'neu'], ['12/10', 'Temporada: 12 diárias · R$ 11.400 · comissão R$ 2.280', 'ganho', 'ok']] },
    '391': { resp: 'Rafael', cap: 'Rafael Costa', aut: 'falta', autDe: '—', autAte: '—', excl: '—', dono: 'd-claudia', chaves: 'Com a dona', obs: 'Mandar a autorização para assinar no celular', visitas: '—',
      hist: [['amanhã', 'Assinatura da autorização · 10:00 · Rafael', 'marcado', 'warn'], ['20/10', 'Visita de avaliação · Rafael', 'feita', 'ok']] },
    '350': { resp: 'Adriana', cap: 'Adriana', aut: 'ok', autDe: '18/07/2026', autAte: '18/01/2027', excl: 'Com exclusividade', dono: 'd-nogueira', chaves: 'Na loja · gancho 9', obs: '—', visitas: '3 visitas',
      hist: [['23/10', 'Proposta de Henrique Sales · R$ 780 mil · família pediu R$ 795', 'contraproposta', 'warn'], ['15/10', 'Visita de Carlos e Ana Beatriz · acharam caro', 'feita', 'ok']] },
    '389': { resp: 'Rafael', cap: 'Rafael Costa', aut: 'ok', autDe: '03/06/2026', autAte: '03/12/2026', excl: 'Com exclusividade', dono: 'd-generico', chaves: 'Na loja · gancho 2', obs: 'Comprador financiando pela Caixa', visitas: '5 visitas',
      hist: [['15/10', 'Proposta de Eduardo Lins aceita · R$ 365 mil · financiamento aprovado', 'fechamento', 'ok'], ['28/09', 'Visita de Eduardo Lins', 'feita', 'ok']] },
    '392': { resp: 'Adriana', cap: 'Adriana', aut: 'vendido', autDe: '20/03/2026', autAte: 'encerrada na venda', excl: 'Com exclusividade', dono: 'd-generico', chaves: 'Entregues ao comprador', obs: '—', visitas: '4 visitas',
      hist: [['06/10', 'VENDIDA por R$ 295 mil · Adriana captou e vendeu', 'ganho', 'ok']] },
    '120': { resp: 'Rafael', cap: 'Rafael Costa', aut: 'ok', autDe: '10/09/2026', autAte: '10/03/2027', excl: 'Sem exclusividade', dono: 'd-generico', chaves: '—', obs: '—', visitas: '1 visita', hist: [] },
    '375': { resp: 'Rafael', cap: 'Rafael Costa', aut: 'ok', autDe: '22/08/2026', autAte: '22/02/2027', excl: 'Com exclusividade', dono: 'd-generico', chaves: 'Na loja · gancho 14', obs: '—', visitas: '2 visitas', hist: [] },
    '383': { resp: 'Adriana', cap: 'Adriana', aut: 'ok', autDe: '30/07/2026', autAte: '30/01/2027', excl: 'Com exclusividade', dono: 'd-generico', chaves: 'Na loja · gancho 11', obs: '—', visitas: '3 visitas', hist: [] }
  },

  /* proprietários (carteira de quem tem imóvel com a AD7) */
  donos: [
    { id: 'd-helena', nome: 'Helena Bastos', ini: 'HB', tel: '(41) 9 ____-____', mail: 'helena@____.com', resp: 'Adriana', desde: 'jan/2025', refs: ['382', '406', '221'],
      contas: 'Prestação de contas de setembro enviada 05/10 · R$ 3.420 repassados', sugere: 'A casa 382 está há 60 dias sem proposta acima de R$ 700 mil. Vale propor R$ 739 mil: entra na faixa de busca de 3 contatos.',
      hist: [['24/10', 'Recebeu a proposta de R$ 720 mil pela 382 · responde até 28/10', 'warn'], ['05/10', 'Prestação de contas de setembro (406 e 221) · R$ 3.420', 'neu'], ['02/10', 'Aprovou por WhatsApp o preço novo da 382', 'ok']] },
    { id: 'd-jose', nome: 'José Almeida', ini: 'JA', tel: '(41) 9 ____-____', mail: 'jose@____.com', resp: 'Adriana', desde: 'mai/2026', refs: ['309'],
      contas: '—', sugere: 'Autorização vence 02/11. Mandar a renovação para assinar no celular hoje, junto com o relatório das 2 visitas.',
      hist: [['hoje', 'Visita de Carlos e Ana Beatriz · 09:30', 'warn'], ['02/05', 'Autorização assinada · 180 dias', 'ok']] },
    { id: 'd-marcos', nome: 'Marcos Vieira', ini: 'MV', tel: '(41) 9 ____-____', mail: 'marcos@____.com', resp: 'Rafael', desde: 'set/2026', refs: ['402'],
      contas: '—', sugere: 'Sobrado com 1 visita em 5 semanas e 2 contatos que combinam. Sugerir fotos novas da área externa antes de mexer no preço.',
      hist: [['hoje', 'Visita de Família Ramos · 15:00', 'warn'], ['20/09', 'Autorização assinada · anunciado nos portais', 'ok']] },
    { id: 'd-ricardo', nome: 'Ricardo Teles', ini: 'RT', tel: '(41) 9 ____-____', mail: 'ricardo@____.com', resp: 'Adriana', desde: 'mar/2025', refs: ['407'],
      contas: 'Casa vazia desde 30/09 · contrato novo assina quinta', sugere: 'Avisar que o contrato com Débora Antunes assina quinta 16:00 e que o 1º aluguel (R$ 2.200) é a comissão da AD7.',
      hist: [['24/10', 'Cadastro da inquilina aprovado', 'ok'], ['30/09', 'Inquilino anterior entregou as chaves · vistoria ok', 'neu']] },
    { id: 'd-claudia', nome: 'Cláudia Moreira', ini: 'CM', tel: '(41) 9 ____-____', mail: 'claudia@____.com', resp: 'Rafael', desde: 'out/2026', refs: ['391'],
      contas: '—', sugere: 'Sem autorização assinada a casa não vai para o site nem para os portais. Assinatura marcada amanhã 10:00.',
      hist: [['amanhã', 'Assinatura da autorização · 10:00 · Rafael', 'warn'], ['20/10', 'Visita de avaliação · R$ 750 mil combinado', 'ok']] },
    { id: 'd-nogueira', nome: 'Família Nogueira', ini: 'FN', tel: '(41) 9 ____-____', mail: 'nogueira@____.com', resp: 'Adriana', desde: 'jul/2026', refs: ['350'],
      contas: '—', sugere: 'Proposta de R$ 780 mil na mesa e eles pediram R$ 795 mil. Diferença de 2%: vale uma conversa hoje antes de o comprador esfriar.',
      hist: [['23/10', 'Contraproposta de R$ 795 mil enviada a Henrique Sales', 'warn'], ['18/07', 'Autorização assinada · 180 dias', 'ok']] },
    { id: 'd-mar', nome: 'Construtora Mar', ini: 'CM', tel: '(41) 3___-____', mail: 'vendas@____.com', resp: 'Rafael', desde: 'jun/2026', refs: ['269'],
      contas: 'Venda do 269 concluída · escritura 10/11', sugere: 'Pedir à construtora os 2 aptos restantes do prédio: o comprador do 269 veio de um lead do ZAP, prova de que o produto roda.',
      hist: [['14/10', 'Apto 269 vendido por R$ 380 mil', 'ok']] },
    { id: 'd-dias', nome: 'Imobiliária Dias', ini: 'ID', tel: '(41) 3___-____', mail: 'contato@____.com', resp: 'Adriana', desde: 'out/2026', refs: ['395'],
      contas: 'Parceria 50/50 na comissão', sugere: '—',
      hist: [['01/10', 'Terreno 395 anunciado em parceria', 'ok']] },
    { id: 'd-generico', nome: 'Proprietário (cadastro do Tecimob)', ini: 'PR', tel: 'vem na importação', mail: '—', resp: 'Adriana', desde: '—', refs: [], contas: '—', sugere: '—', hist: [] }
  ],

  /* quem procura: compradores, inquilinos e hóspedes */
  pessoas: [
    { id: 'p-patricia', nome: 'Patrícia Mendes', ini: 'PM', tel: '(41) 9 ____-____', origem: 'indicação', entrou: '10/10', resp: 'Rafael', temp: 'quente',
      perfil: { neg: 'venda', tipos: ['Casa'], bairros: ['Pontal do Sul'], max: 800000, dorm: 3, extra: 'Churrasqueira', paga: 'À vista com venda de apto em Curitiba', prazo: 'até dezembro' },
      sinais: ['respondeu em 10 min', 'visitou a 382 duas vezes', 'fez proposta de R$ 720 mil'], ultimo: 'ontem · WhatsApp',
      prox: { o: 'Resposta da dona da 382 até 28/10', quando: 'amanhã', atraso: false },
      visitou: [['382', '19/10', 'Gostou de tudo; quer trocar o piso da cozinha'], ['382', '12/10', 'Primeira visita, voltou com o marido']],
      hist: [['24/10', 'Proposta de R$ 720 mil pela 382 enviada à dona', 'proposta', 'warn'], ['19/10', 'Visita à 382 (2ª)', 'visita', 'ok'], ['12/10', 'Visita à 382', 'visita', 'ok'], ['10/10', 'Chegou por indicação da Família Nogueira', 'novo', 'neu']],
      resumo: 'Compradora decidida: duas visitas na 382 e proposta 4% abaixo do preço. Paga à vista. O risco é a dona demorar a responder.', dados: 'nome, telefone, CPF e renda (só na proposta)' },
    { id: 'p-carlos', nome: 'Carlos e Ana Beatriz', ini: 'CA', tel: '(41) 9 ____-____', origem: 'Instagram', entrou: '28/09', resp: 'Adriana', temp: 'quente',
      perfil: { neg: 'venda', tipos: ['Casa', 'Sobrado'], bairros: ['Pontal do Sul', 'Shangri-la'], max: 600000, dorm: 3, extra: 'Garagem', paga: 'Financiado Caixa · entrada R$ 150 mil', prazo: 'até março' },
      sinais: ['abriu os 5 imóveis enviados', 'visitou 2 imóveis', 'pediu simulação no site (Financie)'], ultimo: 'hoje · visita marcada',
      prox: { o: 'Visita à casa 309 hoje às 09:30', quando: 'hoje', atraso: false },
      visitou: [['350', '15/10', 'Acharam caro para o tamanho'], ['309', 'hoje', '—']],
      hist: [['hoje', 'Visita à 309 · 09:30', 'visita', 'warn'], ['15/10', 'Visita à 350 · acharam caro', 'visita', 'ok'], ['28/09', 'Chegou pelo direct do Instagram', 'novo', 'neu']],
      resumo: 'Casal com financiamento aprovado e entrada na mão. Já descartaram a 350 pelo preço; a 309 (R$ 530 mil) está dentro da faixa.', dados: 'nome, telefone, e-mail' },
    { id: 'p-ramos', nome: 'Família Ramos', ini: 'FR', tel: '(41) 9 ____-____', origem: 'site · interesse na Ref. 402', entrou: '12/10', resp: 'Rafael', temp: 'morno',
      perfil: { neg: 'venda', tipos: ['Casa', 'Sobrado'], bairros: ['Pontal do Sul'], max: 500000, dorm: 4, extra: 'Quintal', paga: 'Financiado', prazo: 'sem pressa' },
      sinais: ['abriu 2 dos 4 imóveis enviados', 'visita de hoje ainda sem confirmação', '6 dias sem resposta'], ultimo: '21/10 · WhatsApp',
      prox: { o: 'Confirmar a visita de hoje às 15:00 no sobrado 402', quando: 'hoje', atraso: true },
      visitou: [['309', '14/10', 'Acharam pequena para 5 pessoas']],
      hist: [['21/10', 'Rafael marcou visita ao 402 para 27/10 15:00', 'visita', 'warn'], ['14/10', 'Visita à 309', 'visita', 'ok'], ['12/10', 'Pedido pelo site: interesse na Ref. 402', 'site', 'neu']],
      resumo: 'Família grande (5 pessoas), quer 4 quartos. Esfriou depois da visita à 309. A visita de hoje ao 402 é a chance de reaquecer.', dados: 'nome, telefone' },
    { id: 'p-roberto', nome: 'Roberto Nunes', ini: 'RN', tel: '(41) 9 ____-____', origem: 'ZAP', entrou: '25/10', resp: 'Rafael', temp: 'morno',
      perfil: { neg: 'venda', tipos: ['Apartamento'], bairros: ['Centro'], max: 400000, dorm: 2, extra: 'Elevador', paga: 'À vista', prazo: 'até o verão' },
      sinais: ['chegou pelo ZAP há 2 dias', 'respondeu o 1º contato', 'favoritou 3 imóveis no site'], ultimo: 'ontem · WhatsApp',
      prox: { o: 'Ligar hoje e mandar os aptos do Centro', quando: 'hoje', atraso: false }, visitou: [],
      hist: [['ontem', 'Respondeu no WhatsApp: prefere andar alto', 'contato', 'ok'], ['25/10', 'Lead do ZAP · rodízio: Rafael', 'novo', 'neu']],
      resumo: 'Investidor do Centro, paga à vista. Favoritou 3 aptos no site antes de falar com alguém: sabe o que quer.', dados: 'nome, e-mail' },
    { id: 'p-juliana', nome: 'Juliana Prado', ini: 'JP', tel: '(41) 9 ____-____', origem: 'WhatsApp', entrou: 'ontem', resp: 'Adriana', temp: 'quente',
      perfil: { neg: 'temporada', tipos: ['Casa'], bairros: ['Pontal do Sul'], max: 1800, dorm: 3, extra: 'Piscina', paga: '50% na reserva', prazo: 'réveillon · 28/12 a 02/01 · 8 pessoas' },
      sinais: ['mandou 3 áudios em 1 hora', 'perguntou o valor total', 'pediu fotos da piscina'], ultimo: 'ontem 21:40 · WhatsApp',
      prox: { o: 'Responder com a casa 406 e o total do réveillon', quando: 'agora', atraso: true }, visitou: [],
      hist: [['ontem', 'Chegou pelo WhatsApp da loja · rodízio: Adriana', 'novo', 'ok']],
      resumo: 'Reserva de réveillon para 8 pessoas, quer piscina. A 406 fecha com tudo; responder hoje porque réveillon vai rápido.', dados: 'nome, telefone' },
    { id: 'p-tiago', nome: 'Tiago Moraes', ini: 'TM', tel: '(41) 9 ____-____', origem: 'OLX', entrou: '24/10', resp: 'Rafael', temp: 'frio',
      perfil: { neg: 'venda', tipos: ['Terreno'], bairros: ['Pontal do Sul', 'Ipanema'], max: 400000, dorm: 0, extra: '', paga: 'À vista', prazo: 'sem pressa' },
      sinais: ['chegou pelo OLX', 'não abriu o terreno enviado', 'sem resposta há 2 dias'], ultimo: '25/10 · WhatsApp',
      prox: { o: 'Mandar as fotos do terreno 120 e perguntar se quer visitar', quando: 'hoje', atraso: false }, visitou: [],
      hist: [['25/10', 'Rafael mandou o terreno 395 · sem resposta', 'contato', 'neu'], ['24/10', 'Lead do OLX · rodízio: Rafael', 'novo', 'neu']],
      resumo: 'Quer terreno até R$ 400 mil. O 395 (R$ 450 mil) passou da faixa; o 120 (R$ 350 mil) cabe e ainda não foi enviado.', dados: 'nome, telefone' },
    { id: 'p-livia', nome: 'Lívia Carvalho', ini: 'LC', tel: '(41) 9 ____-____', origem: 'Instagram', entrou: '15/10', resp: 'Adriana', temp: 'frio',
      perfil: { neg: 'aluguel', tipos: ['Casa'], bairros: ['Pontal do Sul'], max: 2000, dorm: 2, extra: 'Garagem', paga: 'Fiador', prazo: 'mudança em dezembro' },
      sinais: ['9 dias sem resposta', 'abriu 1 dos 2 imóveis enviados'], ultimo: '18/10 · direct',
      prox: { o: 'Perguntar se ainda procura casa para alugar', quando: 'atrasado 3 dias', atraso: true }, visitou: [],
      hist: [['18/10', 'Adriana mandou a 407 · não respondeu', 'contato', 'neu'], ['15/10', 'Chegou pelo direct', 'novo', 'neu']],
      resumo: 'Só 2 imóveis de aluguel no catálogo e nenhum até R$ 2.000. Se ela confirmar que ainda procura, vale captar casa de aluguel em Pontal do Sul.', dados: 'nome' },
    { id: 'p-renata', nome: 'Renata Freitas', ini: 'RF', tel: '(41) 9 ____-____', origem: 'site · interesse na Ref. 221', entrou: '20/10', resp: 'Adriana', temp: 'morno',
      perfil: { neg: 'temporada', tipos: ['Apartamento'], bairros: ['Pontal do Sul'], max: 1000, dorm: 2, extra: 'Mobiliado', paga: '50% na reserva', prazo: 'carnaval · 6 diárias' },
      sinais: ['pediu pelo site', 'respondeu em 1 dia', 'quer ver vídeo'], ultimo: '25/10 · WhatsApp',
      prox: { o: 'Mandar o vídeo do apto 221 de frente para o mar', quando: 'hoje', atraso: false }, visitou: [],
      hist: [['25/10', 'Pediu um vídeo do 221', 'contato', 'ok'], ['20/10', 'Pedido pelo site: interesse na Ref. 221', 'site', 'neu']],
      resumo: 'Carnaval no 221. Falta o vídeo: a família Souza sai hoje e dá para gravar depois da vistoria.', dados: 'nome, telefone, e-mail' },
    { id: 'p-henrique', nome: 'Henrique Sales', ini: 'HS', tel: '(41) 9 ____-____', origem: 'ZAP', entrou: '08/10', resp: 'Adriana', temp: 'morno',
      perfil: { neg: 'venda', tipos: ['Casa'], bairros: ['Pontal do Sul'], max: 800000, dorm: 3, extra: 'Garagem', paga: 'À vista', prazo: 'até dezembro' },
      sinais: ['visitou a 350', 'fez proposta de R$ 780 mil', '4 dias esperando a contraproposta'], ultimo: '23/10 · ligação',
      prox: { o: 'Levar a contraproposta de R$ 795 mil e propor R$ 788 mil', quando: 'hoje', atraso: false },
      visitou: [['350', '16/10', 'Gostou; achou a garagem apertada']],
      hist: [['23/10', 'Família Nogueira contrapropôs R$ 795 mil', 'proposta', 'warn'], ['20/10', 'Proposta de R$ 780 mil pela 350', 'proposta', 'ok'], ['16/10', 'Visita à 350', 'visita', 'ok']],
      resumo: 'Diferença de R$ 15 mil entre as partes. Está morno porque ninguém falou com ele desde a contraproposta.', dados: 'nome, telefone, CPF (proposta)' },
    { id: 'p-eduardo', nome: 'Eduardo Lins', ini: 'EL', tel: '(41) 9 ____-____', origem: 'site · simulação no Financie', entrou: '14/09', resp: 'Rafael', temp: 'quente',
      perfil: { neg: 'venda', tipos: ['Casa', 'Apartamento'], bairros: ['Shangri-la', 'Centro'], max: 380000, dorm: 2, extra: 'Garagem', paga: 'Financiado Caixa · aprovado', prazo: 'escritura 10/11' },
      sinais: ['financiamento aprovado', 'proposta aceita', 'documentos entregues'], ultimo: 'ontem · e-mail',
      prox: { o: 'Conferir a matrícula com o cartório antes da escritura', quando: 'até 05/11', atraso: false },
      visitou: [['389', '28/09', 'Fechou na primeira visita']],
      hist: [['15/10', 'Proposta aceita · R$ 365 mil pela 389', 'fechamento', 'ok'], ['28/09', 'Visita à 389', 'visita', 'ok'], ['14/09', 'Simulou financiamento no site (R$ 320 mil, entrada 64 mil)', 'site', 'neu']],
      resumo: 'Veio do simulador do site. Em fechamento: escritura marcada para 10/11.', dados: 'nome, telefone, CPF, renda (contrato)' },
    { id: 'p-debora', nome: 'Débora Antunes', ini: 'DA', tel: '(41) 9 ____-____', origem: 'WhatsApp', entrou: '12/10', resp: 'Adriana', temp: 'quente',
      perfil: { neg: 'aluguel', tipos: ['Casa'], bairros: ['Pontal do Sul'], max: 2500, dorm: 3, extra: 'Piscina', paga: 'Seguro-fiança', prazo: 'entrar em novembro' },
      sinais: ['cadastro aprovado', 'contrato marcado'], ultimo: 'ontem · WhatsApp',
      prox: { o: 'Assinatura do contrato da 407 quinta às 16:00', quando: 'quinta', atraso: false },
      visitou: [['407', '17/10', 'Adorou a piscina']],
      hist: [['24/10', 'Cadastro aprovado · seguro-fiança', 'fechamento', 'ok'], ['17/10', 'Visita à 407', 'visita', 'ok'], ['12/10', 'Chegou pelo WhatsApp', 'novo', 'neu']],
      resumo: 'Locação da 407 fechando quinta. Depois da assinatura o app gera o contrato, o boleto e o portal dela.', dados: 'nome, telefone, CPF, renda (contrato)' },
    { id: 'p-teixeira', nome: 'Marcos e Fernanda Teixeira', ini: 'MT', tel: '(41) 9 ____-____', origem: 'VivaReal', entrou: 'hoje', resp: 'Rafael', temp: 'frio',
      perfil: { neg: 'venda', tipos: ['Casa'], bairros: ['Praia de Leste'], max: 500000, dorm: 3, extra: 'Churrasqueira', paga: '—', prazo: '—' },
      sinais: ['chegou hoje 07:50', 'ainda sem contato'], ultimo: '—',
      prox: { o: 'Primeiro contato em até 2 horas (regra do rodízio)', quando: 'agora', atraso: false }, visitou: [],
      hist: [['hoje', 'Lead do VivaReal · interesse na Ref. 375 · rodízio: Rafael', 'novo', 'neu']],
      resumo: 'Lead novo do portal. Nada sabido além do imóvel que chamou a atenção.', dados: 'nome, telefone' },
    { id: 'p-bruno', nome: 'Bruno Caldas', ini: 'BC', tel: '(41) 9 ____-____', origem: 'site · interesse na Ref. 383', entrou: 'hoje', resp: 'Adriana', temp: 'frio',
      perfil: { neg: 'venda', tipos: ['Casa', 'Sobrado'], bairros: ['Pontal do Sul'], max: 700000, dorm: 2, extra: '', paga: '—', prazo: '—' },
      sinais: ['chegou hoje 08:12 pelo site', 'ainda sem contato'], ultimo: '—',
      prox: { o: 'Primeiro contato em até 2 horas (regra do rodízio)', quando: 'agora', atraso: false }, visitou: [],
      hist: [['hoje', 'Pedido pelo site: interesse na Ref. 383 · rodízio: Adriana', 'site', 'neu']],
      resumo: 'Lead novo do site. Aceitou a política de privacidade às 08:12.', dados: 'nome, telefone' }
  ],

  /* funil de quem compra, aluga ou hospeda — etapas: 0 Novo · 1 Em contato · 2 Visita · 3 Proposta · 4 Fechamento */
  negocios: [
    { id: 'n-juliana', pessoa: 'p-juliana', ref: '406', tipo: 'temporada', valor: 11200, extra: '7 diárias', etapa: 0, dias: 0 },
    { id: 'n-roberto', pessoa: 'p-roberto', ref: '', tipo: 'venda', valor: 400000, extra: 'apto no Centro', etapa: 0, dias: 1 },
    { id: 'n-teixeira', pessoa: 'p-teixeira', ref: '375', tipo: 'venda', valor: 450000, extra: '', etapa: 0, dias: 0 },
    { id: 'n-bruno', pessoa: 'p-bruno', ref: '383', tipo: 'venda', valor: 690000, extra: '', etapa: 0, dias: 0 },
    { id: 'n-tiago', pessoa: 'p-tiago', ref: '120', tipo: 'venda', valor: 350000, extra: '', etapa: 1, dias: 2 },
    { id: 'n-ramos', pessoa: 'p-ramos', ref: '402', tipo: 'venda', valor: 430000, extra: '', etapa: 1, dias: 6 },
    { id: 'n-livia', pessoa: 'p-livia', ref: '', tipo: 'aluguel', valor: 2000, extra: 'casa até R$ 2 mil', etapa: 1, dias: 9 },
    { id: 'n-carlos', pessoa: 'p-carlos', ref: '309', tipo: 'venda', valor: 530000, extra: '', etapa: 2, dias: 3 },
    { id: 'n-renata', pessoa: 'p-renata', ref: '221', tipo: 'temporada', valor: 5700, extra: '6 diárias', etapa: 2, dias: 1 },
    { id: 'n-patricia', pessoa: 'p-patricia', ref: '382', tipo: 'venda', valor: 720000, extra: 'proposta', etapa: 3, dias: 2 },
    { id: 'n-henrique', pessoa: 'p-henrique', ref: '350', tipo: 'venda', valor: 780000, extra: 'proposta', etapa: 3, dias: 4 },
    { id: 'n-eduardo', pessoa: 'p-eduardo', ref: '389', tipo: 'venda', valor: 365000, extra: 'escritura 10/11', etapa: 4, dias: 12 },
    { id: 'n-debora', pessoa: 'p-debora', ref: '407', tipo: 'aluguel', valor: 2200, extra: 'contrato quinta', etapa: 4, dias: 3 }
  ],

  /* ganhos e perdidos do mês */
  ganhos: [
    { id: 'g-269', titulo: 'Apto Ref. 269', ref: '269', tipo: 'venda', valor: 380000, data: '14/10', vendeu: 'Rafael', captou: 'Paulo Henrique (externo)', capExterno: true },
    { id: 'g-392', titulo: 'Casa Ref. 392', ref: '392', tipo: 'venda', valor: 295000, data: '06/10', vendeu: 'Adriana', captou: 'Adriana', capExterno: false },
    { id: 'g-221', titulo: 'Apto Ref. 221 · 12 diárias', ref: '221', tipo: 'temporada', valor: 11400, data: '12/10', vendeu: 'Adriana', captou: '—', capExterno: false }
  ],
  perdidos: [
    { nome: 'Almir Castro', motivo: 'comprou com outra imobiliária', data: '09/10', resp: 'Rafael' },
    { nome: 'Camila Rocha', motivo: 'desistiu de mudar', data: '03/10', resp: 'Adriana' }
  ],

  /* funil de captação (quem tem imóvel) — etapas: 0 Contato do dono · 1 Visita de avaliação · 2 Autorização · 3 Anunciado */
  captacoes: [
    { id: 'c-fernanda', nome: 'Fernanda Dias', ini: 'FD', o: 'Casa no Atami · 3 dorm', valor: 600000, origem: 'site · Anuncie seu imóvel', etapa: 0, dias: 0, resp: 'Adriana', prox: 'Ligar hoje e marcar a avaliação', dono: '' },
    { id: 'c-osvaldo', nome: 'Osvaldo Pires', ini: 'OP', o: 'Terreno em Ipanema · 450 m²', valor: 280000, origem: 'indicação', etapa: 0, dias: 1, resp: 'Rafael', prox: 'Pedir fotos e a matrícula', dono: '' },
    { id: 'c-sonia', nome: 'Sônia Barros', ini: 'SB', o: 'Apto em Balneário Gaivotas · 2 dorm', valor: 320000, origem: 'WhatsApp', etapa: 1, dias: 3, resp: 'Adriana', prox: 'Visita de avaliação sexta 10:00', dono: '' },
    { id: 'c-claudia', nome: 'Cláudia Moreira', ini: 'CM', o: 'Casa Ref. 391 · Shangri-la', valor: 750000, origem: 'Instagram', etapa: 2, dias: 7, resp: 'Rafael', prox: 'Assinatura amanhã 10:00 (no celular)', dono: 'd-claudia', ref: '391' },
    { id: 'c-jose', nome: 'José Almeida', ini: 'JA', o: 'Casa Ref. 309 · renovar', valor: 530000, origem: 'carteira', etapa: 2, dias: 2, resp: 'Adriana', prox: 'Renovação: vence 02/11', dono: 'd-jose', ref: '309', alerta: true },
    { id: 'c-395', nome: 'Imobiliária Dias', ini: 'ID', o: 'Terreno Ref. 395 · parceria', valor: 450000, origem: 'parceria', etapa: 3, dias: 26, resp: 'Adriana', prox: 'Anunciado 01/10', dono: 'd-dias', ref: '395' },
    { id: 'c-402', nome: 'Marcos Vieira', ini: 'MV', o: 'Sobrado Ref. 402', valor: 430000, origem: 'indicação', etapa: 3, dias: 37, resp: 'Rafael', prox: 'Anunciado 20/09', dono: 'd-marcos', ref: '402' }
  ],

  /* agenda da semana (26/10 a 01/11) */
  agenda: [
    { d: 'Ter 27', hoje: true, h: '09:30', t: 'Visita casa Ref. 309 · Carlos e Ana Beatriz', r: 'Adriana', s: 'confirmada', sc: 'ok', pessoa: 'p-carlos' },
    { d: 'Ter 27', hoje: true, h: '11:00', t: 'Vistoria de saída apto Ref. 221 · Família Souza', r: 'Adriana', s: 'vistoria', sc: 'neu' },
    { d: 'Ter 27', hoje: true, h: '15:00', t: 'Visita sobrado Ref. 402 · Família Ramos', r: 'Rafael', s: 'sem confirmação', sc: 'warn', pessoa: 'p-ramos' },
    { d: 'Qua 28', h: '10:00', t: 'Assinatura da autorização · casa Ref. 391 · Cláudia Moreira', r: 'Rafael', s: 'preparar', sc: 'neu' },
    { d: 'Qua 28', h: '14:00', t: 'Resposta da dona · proposta casa Ref. 382 · Patrícia Mendes', r: 'Rafael', s: 'prazo', sc: 'warn', pessoa: 'p-patricia' },
    { d: 'Qui 29', h: '16:00', t: 'Assinatura do contrato de locação · casa Ref. 407 · Débora Antunes', r: 'Adriana', s: 'contrato', sc: 'ok', pessoa: 'p-debora' },
    { d: 'Sex 30', h: '10:00', t: 'Visita de avaliação · apto de Sônia Barros · Balneário Gaivotas', r: 'Adriana', s: 'captação', sc: 'neu' },
    { d: 'Sáb 31', h: '10:00', t: 'Plantão na loja · Av. Beira Mar', r: 'Adriana', s: 'plantão', sc: 'neu' }
  ],

  /* chamados: manutenção e os serviços da Área do Cliente do site */
  chamados: [
    { n: '#213', im: 'Apto Centro 12 (locação)', q: 'Lucas Ferreira · inquilino', p: 'Interfone não toca', pr: 'Eletro Pontal', s: 'orçamento', sc: 'warn', origem: 'WhatsApp' },
    { n: '#212', im: 'Casa Ref. 303 (temporada)', q: 'Família Lima · hóspede', p: 'Portão da garagem travando', pr: 'Jorge Silva', s: 'agendado 28/10', sc: 'neu', origem: 'WhatsApp' },
    { n: '#211', im: 'Casa R. das Gaivotas 112 (locação)', q: 'Marta Lopes · inquilina', p: '2ª via do boleto de outubro', pr: 'Adriana', s: 'atendido', sc: 'ok', origem: 'site · Área do Cliente' },
    { n: '#210', im: 'Apto Ref. 221 (temporada anual)', q: 'Família Souza · inquilino', p: 'Aviso de desocupação · saída 27/10', pr: 'Adriana', s: 'vistoria hoje 11:00', sc: 'warn', origem: 'site · Área do Cliente' },
    { n: '#209', im: 'Apto Ref. 221', q: 'Família Souza', p: 'Infiltração no banheiro', pr: 'Construtora Mar', s: 'concluído', sc: 'ok', origem: 'site · Área do Cliente' }
  ],
  chamadoNovo: { n: '#214', im: 'Casa R. das Gaivotas 112 (locação)', q: 'Marta Lopes · inquilina', p: 'Vazamento na pia da cozinha', pr: 'Jorge Silva · pede orçamento', s: 'aberto · aguarda orçamento', sc: 'bad', origem: 'ligação · pelo assistente' },

  /* caixa de entrada: tudo que chegou, de onde, e o que o app fez sozinho */
  entradas: [
    { q: 'hoje 08:12', canal: 'site', tipo: 'Interesse em imóvel', quem: 'Bruno Caldas', det: 'Ref. 383 · "quero visitar no fim de semana"', fez: 'Negócio em Novo · rodízio: Adriana', sc: 'ok', pessoa: 'p-bruno' },
    { q: 'hoje 07:50', canal: 'VivaReal', tipo: 'Lead do portal', quem: 'Marcos e Fernanda Teixeira', det: 'Ref. 375 · Praia de Leste', fez: 'Negócio em Novo · rodízio: Rafael', sc: 'ok', pessoa: 'p-teixeira' },
    { q: 'ontem 21:40', canal: 'WhatsApp', tipo: 'Mensagem', quem: 'Juliana Prado', det: '"casa com piscina pro réveillon, 8 pessoas"', fez: 'Negócio em Novo · rodízio: Adriana', sc: 'ok', pessoa: 'p-juliana' },
    { q: 'ontem 19:30', canal: 'site', tipo: 'Anuncie seu imóvel', quem: 'Fernanda Dias', det: 'Casa no Atami · 3 dorm · quer vender', fez: 'Captação em Contato do dono · Adriana', sc: 'ok' },
    { q: 'ontem 16:40', canal: 'site', tipo: '2ª via de boleto', quem: 'Marta Lopes', det: 'CPF ***.456.789-** · contrato 2024-017', fez: 'Chamado #211 · atendido', sc: 'ok' },
    { q: 'ontem 15:10', canal: 'site', tipo: 'Aviso de desocupação', quem: 'Família Souza', det: 'Apto Ref. 221 · saída 27/10', fez: 'Chamado #210 · vistoria marcada hoje 11:00', sc: 'warn' },
    { q: 'ontem 11:05', canal: 'site', tipo: 'Favoritos (sem cadastro)', quem: 'visitante', det: 'Favoritou Ref. 269, 165 e 362', fez: 'Só conta no calor dos imóveis · ninguém é identificado', sc: 'neu' },
    { q: 'sáb 24', canal: 'OLX', tipo: 'Lead do portal', quem: 'Tiago Moraes', det: 'Terreno até R$ 400 mil', fez: 'Negócio em Novo · rodízio: Rafael', sc: 'ok', pessoa: 'p-tiago' },
    { q: 'sex 23', canal: 'site', tipo: 'Simulação no Financie', quem: 'Aline Souto', det: 'R$ 320 mil · entrada R$ 64 mil · Caixa', fez: 'Lead em Novo · rodízio: Adriana · ainda sem imóvel', sc: 'neu' },
    { q: 'sex 23', canal: 'Instagram', tipo: 'Direct', quem: 'Lívia Carvalho', det: '"ainda tem casa pra alugar?"', fez: 'Já era contato da Adriana · juntou na ficha', sc: 'neu', pessoa: 'p-livia' }
  ],

  /* matriz de permissões (Equipe) */
  matriz: [
    ['Ver o catálogo inteiro (igual ao site)', ['sim', 'ok'], ['sim', 'ok'], ['pelo site', 'neu']],
    ['Ver dono, telefone, chaves e documentos', ['sim', 'ok'], ['só dos imóveis dele', 'warn'], ['não', 'bad']],
    ['Ver leads, pessoas e negócios', ['todos', 'ok'], ['só os dele', 'warn'], ['não', 'bad']],
    ['Cadastrar imóvel (vira o responsável)', ['sim', 'ok'], ['sim', 'ok'], ['manda pela Adriana', 'neu']],
    ['Apagar imóvel ou pessoa', ['sim', 'ok'], ['não', 'bad'], ['não', 'bad']],
    ['Locações, repasses e comissões', ['sim', 'ok'], ['só a parte dele', 'warn'], ['só a parte dele, por e-mail', 'warn']],
    ['Equipe, privacidade e portais', ['sim', 'ok'], ['não', 'bad'], ['não', 'bad']],
    ['Assistente de IA', ['tudo', 'ok'], ['só o que ele vê', 'warn'], ['não', 'bad']]
  ]
};
