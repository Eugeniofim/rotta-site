/* ============================================================
   DADOS-BASE — tirados das planilhas do Espaço Anirvana
   (Mensalidades 2026, LojinhaANIRVANA, Controle financeiro 2026
   e o documento "Programação APP" da Dessa)
   ============================================================ */

/* contato público (ficha do Sebrae PR "Yoga & Café" e redes) */
const ESPACO = {endereco:'Rua Erva Cidreira, 48', cidade:'Pontal do Sul · Pontal do Paraná/PR', instagram:'espaco_anirvana', link:'linktr.ee/espacoanirvana', tel:'(41) 99848-7892', email:'espacoanirvana@gmail.com'};
const EVENTOS = [
  {id:'yogacafe', nome:'Yoga & Café', icon:'coffee', idade:'A partir de 12 anos',
   desc:'Flua com o yoga e sinta-se conectado(a) com a natureza. Ao relaxar a mente, nutra o corpo com um delicioso café.',
   publico:'Para quem mora no litoral e para quem está de passagem, buscando bem-estar, serenidade e relaxamento.',
   data:'2026-11-08', h:'08:00', valor:60, exemplo:true},
];

/* ---------- CURSO DE INSTRUTORES DE YOGA (página do site anirvana.com.br) ---------- */
const FORMACAO = {
  nome:'Curso de Instrutores de Yoga', turma:'Turma 2026', inicio:'2026-08', modulos:12,
  formato:'Um fim de semana por mês, das 7h às 12h, com café da manhã incluso. Aulas presenciais com monges e professores.',
  proposta:'Proporcionar ao estudante um desenvolvimento integrado — físico, mental e espiritual — através das práticas e filosofia milenar do Tantra Yoga, com Biopsicologia.',
  conteudo:['Mantras e meditação','Estudo de posturas','Automassagem e relaxamento','Filosofia do Tantra Yoga','Biopsicologia'],
  requisitos:[['freq','80% de frequência nas aulas presenciais'],['estagio','Estágio de 60 horas'],['mono','Monografia'],['aval','Avaliação teórico-prática']],
  mentores:[
    {nome:'Acarya Jinanananda Avadhuta', bio:'Pratica Tantra Yoga desde 1986.'},
    {nome:'Camilla Beatritse Kamalá', bio:'Instrutora de Yoga e AcroYoga, terapeuta sistêmica e integrativa. Formação em Tantra Yoga e Yoga Terapêutico.'},
    {nome:'Giorgia Vecchi', bio:'Estuda e pratica Vinyasa Flow, Ashtanga, Tantra, Yoga Restaurativo e Yoga Dance.'},
    {nome:'Luciana Maniolo', bio:'Fisioterapeuta, com formação em acupuntura e terapias quânticas.'},
  ],
  /* sábados de cada módulo (datas de exemplo; o curso é sábado e domingo) */
  datas:['2026-08-15','2026-09-12','2026-10-17','2026-11-14','2026-12-12','2027-01-16','2027-02-13','2027-03-13','2027-04-17','2027-05-15','2027-06-12','2027-07-17'],
  /* formandos de exemplo: [nome, aluno do Espaço?, dias presentes de 6, horas de estágio, monografia] */
  formandos:[
    ['Luana Ferraz','a01',6,12,'tema'],['Bianca Rocha','a05',5,8,'tema'],['Tiago Moreira',null,6,16,'escrevendo'],['Fernanda Luz',null,4,0,'nao'],
    ['Paulo Henrique Dias',null,6,10,'tema'],['Renata Lopes','a26',3,4,'nao'],['Cláudia Prates',null,5,20,'escrevendo'],['Vinícius Ramos',null,6,6,'nao'],
  ],
};

const HOJE = new Date(2026, 9, 29, 10, 50);   /* data da demonstração: qui 29/10/2026 */
const MES_ATUAL = '2026-10';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_C = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const DIAS = ['dom','seg','ter','qua','qui','sex','sáb'];
const DIAS_L = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

/* ---------- equipe ---------- */
const EQUIPE = [
  {id:'anajulia', nome:'Ana Julia', atvs:['yoga','particular'], cor:'#E5672A', pix:'ana•••@gmail.com'},
  {id:'kamala',   nome:'Kamala',    atvs:['yoga','particular','gestantes','meditacao','terapias'], cor:'#B9488E', pix:'(41) 9••••-2210',
   nomeCompleto:'Camilla Beatritse Kamalá', bio:'Instrutora de Yoga e AcroYoga, terapeuta sistêmica e integrativa, com formação em Tantra Yoga e Yoga Terapêutico.'},
  {id:'sara',     nome:'Sara',      atvs:['yoga'], cor:'#3E8E6E', pix:'(41) 9••••-7781'},
  {id:'stefy',    nome:'Stefy',     atvs:['yoga'], cor:'#C08A12', pix:'•••.482.•••-10', obs:'Yoga de férias'},
  {id:'bruno',    nome:'Bruno',     atvs:['aquarela'], cor:'#2F7FB8', pix:'bru•••@gmail.com'},
  {id:'brunos',   nome:'Bruno S.',  atvs:['musicalizacao','violao'], cor:'#6A55C9', pix:'(41) 9••••-0098'},
  {id:'marina',   nome:'Marina',    atvs:['ingles'], cor:'#1F8A9E', pix:'mar•••@hotmail.com'},
  {id:'aurelice', nome:'Aurelice',  atvs:['massagem'], cor:'#A2563A', pix:'(41) 9••••-3345'},
];
const ADMINS = [{id:'dessa', nome:'Dessa'},{id:'vitor', nome:'Vitor'}];

/* ---------- atividades ----------
   repasse = parte do instrutor. vis:'todos' -> aparece pra todo instrutor da atividade;
   vis:'escolhido' -> só pro instrutor que o aluno escolheu (regra do documento da Dessa) */
const ATIV = {
  yoga:          {nome:'Yoga & AcroYoga', curto:'Yoga', icon:'sun', cor:'var(--sol)', hex:'#EE7A2F', repasse:.70, vis:'todos', turma:true,
                  desc:'Turmas de hatha yoga pela manhã e à noite, e AcroYoga aos sábados. Planos de 1 a 4 aulas por semana.'},
  particular:    {nome:'Yoga particular', curto:'Particular', icon:'user', cor:'#B9488E', hex:'#B9488E', repasse:.70, vis:'escolhido',
                  desc:'Aula individual no horário combinado com a instrutora que você escolher.'},
  gestantes:     {nome:'Yoga para gestantes', curto:'Gestantes', icon:'baby', cor:'#D46A8C', hex:'#D46A8C', repasse:.70, vis:'todos', turma:true,
                  desc:'Prática suave para cada trimestre da gestação, com respiração e preparo para o parto.'},
  meditacao:     {nome:'Meditação', curto:'Meditação', icon:'flower-2', cor:'#6A55C9', hex:'#6A55C9', repasse:.70, vis:'todos', turma:true,
                  desc:'Encontro semanal de meditação guiada e silêncio, às segundas à noite.'},
  aquarela:      {nome:'Aquarela', curto:'Aquarela', icon:'palette', cor:'#2F7FB8', hex:'#2F7FB8', repasse:.70, vis:'todos', turma:true,
                  desc:'Ateliê de aquarela para iniciantes e quem já pinta. Material básico incluso.'},
  musicalizacao: {nome:'Musicalização infantil', curto:'Musicalização', icon:'music', cor:'#C08A12', hex:'#C08A12', repasse:.70, vis:'todos', turma:true,
                  desc:'Música, ritmo e brincadeira para crianças de 3 a 7 anos.'},
  violao:        {nome:'Violão', curto:'Violão', icon:'guitar', cor:'#7A5C2E', hex:'#7A5C2E', repasse:.70, vis:'todos', turma:true,
                  desc:'Aulas de violão em pequenos grupos, do primeiro acorde às músicas favoritas.'},
  ingles:        {nome:'Inglês', curto:'Inglês', icon:'languages', cor:'#1F8A9E', hex:'#1F8A9E', repasse:.65, vis:'todos', turma:true,
                  desc:'Turma de conversação às terças e quintas de manhã.'},
  massagem:      {nome:'Massagem terapêutica', curto:'Massagem', icon:'hand-heart', cor:'#A2563A', hex:'#A2563A', repasse:.70, vis:'escolhido', agendada:true,
                  desc:'Sessões de 60 minutos com hora marcada.'},
  terapias:      {nome:'Terapias integrais', curto:'Terapias', icon:'sprout', cor:'#3E8E6E', hex:'#3E8E6E', repasse:.70, vis:'escolhido', agendada:true,
                  desc:'Atendimentos individuais de terapias integrativas com hora marcada.'},
};

/* ---------- planos de yoga ----------
   O valor que a instrutora recebe por aluno presente sai daqui:
   70% do preço ÷ aulas do mês. Ex.: 2x = 160 × 0,7 ÷ 8 = R$ 14,00 (bate com a planilha). */
const PLANOS_YOGA = {
  '1x':     {nome:'1x por semana', preco:110, sem:1},
  '2x':     {nome:'2x por semana', preco:160, sem:2},
  '3x':     {nome:'3x por semana', preco:220, sem:3},
  '4x':     {nome:'4x por semana', preco:290, sem:4},
  'avulsa': {nome:'Aula avulsa',   preco:45,  sem:0},
};
const REGRAS_PADRAO = {aulaVazia:10, aulaVaziaFerias:25, piso:false};

/* ---------- grade semanal (exemplo — ajustar com a grade real) ---------- */
const TURMAS = [
  {id:'seg0700', atv:'yoga', dia:1, h:'07:00', instr:'anajulia', sala:'Sala Sol'},
  {id:'qua0700', atv:'yoga', dia:3, h:'07:00', instr:'anajulia', sala:'Sala Sol'},
  {id:'seg1830', atv:'yoga', dia:1, h:'18:30', instr:'kamala',   sala:'Sala Sol'},
  {id:'qua1830', atv:'yoga', dia:3, h:'18:30', instr:'kamala',   sala:'Sala Sol'},
  {id:'qui0800', atv:'yoga', dia:4, h:'08:00', instr:'kamala',   sala:'Sala Sol'},
  {id:'ter1900', atv:'yoga', dia:2, h:'19:00', instr:'sara',     sala:'Sala Sol'},
  {id:'qui1900', atv:'yoga', dia:4, h:'19:00', instr:'sara',     sala:'Sala Sol'},
  {id:'sab0900', atv:'yoga', dia:6, h:'09:00', instr:'kamala', sala:'Deck', nome:'AcroYoga'},
  {id:'sab1030', atv:'gestantes', dia:6, h:'10:30', instr:'kamala', sala:'Sala Lua'},
  {id:'seg2000', atv:'meditacao', dia:1, h:'20:00', instr:'kamala', sala:'Sala Lua'},
  {id:'qua1500', atv:'aquarela', dia:3, h:'15:00', instr:'bruno', sala:'Ateliê'},
  {id:'qui1700', atv:'violao', dia:4, h:'17:00', instr:'brunos', sala:'Sala Lua'},
  {id:'sab1000', atv:'musicalizacao', dia:6, h:'10:00', instr:'brunos', sala:'Ateliê'},
  {id:'ter1000', atv:'ingles', dia:2, h:'10:00', instr:'marina', sala:'Coworking'},
  {id:'qui1000', atv:'ingles', dia:4, h:'10:00', instr:'marina', sala:'Coworking'},
  {id:'ter1000p', atv:'particular', dia:2, h:'10:00', instr:'kamala', sala:'Sala Lua', aluno:'a02'},
  {id:'sex1600p', atv:'particular', dia:5, h:'16:00', instr:'anajulia', sala:'Sala Sol', aluno:'a03'},
];

/* ---------- alunos (nomes fictícios: a planilha veio sem nomes) ----------
   [id, nome, desde, matrículas]; matrícula = [atividade, plano/valor, turmas, venc, método, instrutor?] */
const ALUNOS_BASE = [
  ['a01','Luana Ferraz','2025-07-14', [['yoga','2x',['seg1830','qua1830'],3,'cartao'],['meditacao',80,['seg2000'],3,'cartao']]],
  ['a02','Helena Prado','2025-04-01', [['particular',245,['ter1000p'],1,'pix','kamala']]],
  ['a03','Rafael Moura','2025-11-10', [['particular',385,['sex1600p'],10,'pix','anajulia']]],
  ['a04','Camila Duarte','2024-03-02',[['yoga','2x',['seg1830','qua1830'],10,'pix'],['aquarela',240,['qua1500'],10,'pix']]],
  ['a05','Bianca Rocha','2025-02-10', [['yoga','2x',['seg0700','qua0700'],5,'pix']]],
  ['a06','Marcos Teixeira','2026-01-08',[['yoga','1x',['qui0800'],8,'pix']]],
  ['a07','Juliana Alves','2023-08-21',[['yoga','3x',['seg0700','qua0700','sab0900'],1,'cartao']]],
  ['a08','Patrícia Nunes','2025-09-01',[['yoga','2x',['ter1900','qui1900'],15,'pix']]],
  ['a09','Gabriel Lima','2026-03-12', [['yoga','2x',['ter1900','qui1900'],12,'pix']]],
  ['a10','Mariana Costa','2024-11-04',[['yoga','4x',['seg1830','qua1830','qui0800','sab0900'],5,'cartao']]],
  ['a11','Paula Ribeiro','2025-05-19',[['yoga','2x',['seg0700','qua0700'],20,'pix']]],
  ['a12','Débora Martins','2026-06-02',[['yoga','1x',['sab0900'],2,'pix']]],
  ['a13','Carolina Mendes','2025-10-13',[['yoga','2x',['seg1830','qua1830'],13,'cartao']]],
  ['a14','Vanessa Pires','2026-08-03', [['yoga','2x',['ter1900','qui1900'],3,'pix']]],
  ['a15','Lucas Barbosa','2026-02-16', [['yoga','1x',['qui1900'],16,'pix']]],
  ['a16','Aline Farias','2024-06-10',  [['yoga','2x',['seg0700','qua0700'],10,'cartao']]],
  ['a17','Sofia Andrade','2026-09-14', [['yoga','2x',['seg1830','qua1830'],14,'pix']]],
  ['a18','Bruna Cardoso','2025-03-03', [['yoga','3x',['ter1900','qui1900','sab0900'],3,'pix']]],
  ['a19','Igor Santana','2026-04-06',  [['yoga','1x',['qui0800'],6,'pix']]],
  ['a20','Lívia Monteiro','2025-08-11',[['yoga','2x',['seg1830','qua1830'],25,'pix']]],
  ['a21','Natália Freitas','2026-05-04',[['yoga','2x',['ter1900','qui1900'],4,'cartao']]],
  ['a22','Otávio Ramos','2026-07-20',  [['yoga','1x',['sab0900'],20,'pix']]],
  ['a23','Joana Batista','2026-07-01', [['gestantes',160,['sab1030'],1,'pix']]],
  ['a24','Heloísa Cunha','2026-09-05', [['gestantes',160,['sab1030'],5,'pix']]],
  ['a25','Elisa Campos','2025-01-20',  [['meditacao',80,['seg2000'],20,'pix']]],
  ['a26','Renata Lopes','2026-02-05',  [['meditacao',100,['seg2000'],5,'pix']]],
  ['a27','Cecília Moraes','2026-06-15',[['meditacao',100,['seg2000'],15,'pix']]],
  ['a28','Marta Siqueira','2025-06-02',[['aquarela',240,['qua1500'],2,'pix']]],
  ['a29','Larissa Torres','2026-03-09',[['aquarela',130,['qua1500'],15,'pix']]],
  ['a30','Alice Rezende','2026-02-21', [['musicalizacao',150,['sab1000'],21,'pix']], 'Responsável: Mônica Rezende · 5 anos'],
  ['a31','Theo Gomes','2026-03-07',    [['musicalizacao',150,['sab1000'],7,'pix']], 'Responsável: André Gomes · 6 anos'],
  ['a32','Pedro Vieira','2026-04-02',  [['violao',160,['qui1700'],2,'pix']]],
  ['a33','Rodrigo Pacheco','2026-05-14',[['violao',160,['qui1700'],14,'cartao']]],
  ['a34','Amanda Viana','2025-08-04',  [['ingles',500,['ter1000','qui1000'],4,'pix']]],
  ['a35','Beatriz Sales','2025-08-04', [['ingles',500,['ter1000','qui1000'],4,'pix']]],
  ['a36','Tatiane Souza','2025-08-04', [['ingles',500,['ter1000','qui1000'],4,'pix']]],
  ['a37','Fernanda Reis','2026-02-02', [['ingles',500,['ter1000','qui1000'],2,'pix']]],
  ['a38','Heitor Brandão','2026-02-02',[['ingles',500,['ter1000','qui1000'],2,'pix']]],
  ['a39','Clara Nogueira','2026-03-02',[['ingles',500,['ter1000','qui1000'],2,'cartao']]],
];
/* quem anda sumido (última presença) e quem está devendo — para os alertas */
const ULTIMA_VINDA = {a09:'2026-10-15', a19:'2026-10-15', a11:'2026-10-19', a18:'2026-10-20', a22:'2026-10-17'};
const SEM_PAGAR_OUT = ['a12','a09','a19','a29'];

/* ---------- FECHAMENTO REAL (planilha Mensalidades 2026) ----------
   contagens = presenças por tipo de plano em cada mês, exatamente como na aba "ALUNOS / INSTRUTORAS" */
const FECH_PLANILHA = {
  '2026-01': {yogaBruto:1390, aulaVazia:10,
    instr:{anajulia:{aulas:12, c:{vazia:0,'4x':0,'3x':0,'2x':26,'1x':8,avulsa:5}},
           kamala:  {aulas:11, c:{vazia:0,'4x':0,'3x':0,'2x':66,'1x':0,avulsa:9}},
           sara:    {aulas:1,  c:{vazia:0,'4x':0,'3x':0,'2x':1,'1x':0,avulsa:2}}},
    extras:{kamala:{particular:245,gestantes:320,meditacao:280}, anajulia:{particular:630}},
    outras:{aquarela:0, ingles:3000, terapias:700, massagem:2250, musicalizacao:0},
    conferido:{anajulia:623.00, kamala:1346.63, sara:35.88}, entradaEA:2794.50},
  '2026-02': {yogaBruto:1500, aulaVazia:25, obsVazia:'Carnaval',
    instr:{anajulia:{aulas:12, c:{vazia:0,'4x':0,'3x':0,'2x':31,'1x':10,avulsa:6}},
           kamala:  {aulas:15, c:{vazia:1,'4x':0,'3x':0,'2x':66,'1x':13,avulsa:2}},
           sara:    {aulas:7,  c:{vazia:2,'4x':0,'3x':0,'2x':7,'1x':0,avulsa:2}}},
    extras:{kamala:{particular:245,gestantes:80,meditacao:180}, anajulia:{particular:0}},
    outras:{aquarela:370, ingles:3000, terapias:220, massagem:2200, musicalizacao:0},
    conferido:{anajulia:378.29, kamala:1069.24, sara:-44.04}, entradaEA:2488.50},
  '2026-03': {yogaBruto:2360, aulaVazia:10,
    instr:{anajulia:{aulas:14, c:{vazia:1,'4x':0,'3x':1,'2x':46,'1x':3,avulsa:0}},
           kamala:  {aulas:5,  c:{vazia:0,'4x':0,'3x':0,'2x':18,'1x':1,avulsa:0}},
           sara:    {aulas:10, c:{vazia:1,'4x':0,'3x':3,'2x':17,'1x':3,avulsa:1}}},
    extras:{kamala:{particular:245,gestantes:0,meditacao:245}, anajulia:{particular:0}},
    outras:{aquarela:240, ingles:3000, terapias:0, massagem:0, musicalizacao:300},
    conferido:{anajulia:859.96, kamala:662.60, sara:472.45}, entradaEA:1977.00},
};
/* abr–jul: só os totais por atividade (exemplo, para o gráfico do ano) */
const MENSAL_EXEMPLO = {
  '2026-04': {yoga:2210, particular:490, gestantes:160, meditacao:260, aquarela:370, ingles:3000, terapias:440, massagem:1750, musicalizacao:300, violao:160},
  '2026-05': {yoga:2480, particular:490, gestantes:160, meditacao:280, aquarela:370, ingles:3000, terapias:220, massagem:2000, musicalizacao:300, violao:320},
  '2026-06': {yoga:2350, particular:630, gestantes:160, meditacao:280, aquarela:370, ingles:3000, terapias:480, massagem:2250, musicalizacao:300, violao:320},
  '2026-07': {yoga:1980, particular:630, gestantes:320, meditacao:280, aquarela:240, ingles:3000, terapias:220, massagem:2500, musicalizacao:300, violao:320},
};

/* ---------- LOJINHA: fornecedores (aba VENDEDORES) ----------
   modelo: 'consig' = consignado (fornecedor leva %), 'integral' = repasse de 100%, 'proprio' = estoque do Espaço */
const FORNECEDORES = [
  {id:'ea',         nome:'Espaço Anirvana', curto:'Anirvana', modelo:'proprio', pct:0,  hue:'#EE7A2F'},
  {id:'anandani',   nome:'Anandani (Fernanda)', curto:'Anandani', modelo:'proprio', pct:0, hue:'#78BC3A', obs:'Óleos comprados pelo Espaço'},
  {id:'stefy',      nome:'Stefy incensos', curto:'Stefy', modelo:'consig', pct:.8, hue:'#C08A12', pix:'(41) 9••••-7120'},
  {id:'valefadas',  nome:'Vale das Fadas · Impressão Botânica', curto:'Vale das Fadas', modelo:'consig', pct:.8, hue:'#3E8E6E', pix:'•••.921.•••-62'},
  {id:'dada',       nome:'Dada Jinanananda', curto:'Dada', modelo:'integral', pct:1, hue:'#A2563A', pix:'(41) 9••••-5501'},
  {id:'didi',       nome:'Didi Sushiila', curto:'Didi', modelo:'integral', pct:1, hue:'#6A55C9', pix:'•••.690.•••-15'},
  {id:'mardevelas', nome:'Mar de Velas', curto:'Mar de Velas', modelo:'consig', pct:.8, hue:'#D46A8C', pix:'•••.766.•••-99'},
  {id:'rita',       nome:'Rita · Bjaflor Artes', curto:'Rita', modelo:'consig', pct:.8, hue:'#B9488E', pix:'(41) 9••••-5246'},
  {id:'francisco',  nome:'Francisco bolsas', curto:'Francisco', modelo:'consig', pct:.8, hue:'#7A5C2E', pix:'•••.112.•••-94'},
  {id:'azuluaar',   nome:'AzuLuaAr (Kamala)', curto:'AzuLuaAr', modelo:'consig', pct:.8, hue:'#2F7FB8', pix:'(41) 9••••-2210'},
  {id:'colinas',    nome:'Colinas de Sião', curto:'Colinas', modelo:'consig', pct:.8, hue:'#5B8C2A', pix:'(41) 9••••-5189'},
  {id:'yaci',       nome:'Yaci (Bruna Hakim)', curto:'Yaci', modelo:'consig', pct:.8, hue:'#E0A21B', pix:'(41) 9••••-9613'},
  {id:'mel',        nome:'Mel Restinga (Gilberto)', curto:'Mel Restinga', modelo:'consig', pct:.8, hue:'#C9861A', pix:'CNPJ ••.201.923/••••-05'},
  {id:'sara',       nome:'Sara (japamalas)', curto:'Sara', modelo:'consig', pct:.8, hue:'#1F8A9E', pix:'(41) 9••••-7781'},
  {id:'ratna',      nome:'Ratna', curto:'Ratna', modelo:'consig', pct:.8, hue:'#8E5BB0'},
  {id:'krishna',    nome:'Krishna', curto:'Krishna', modelo:'consig', pct:.8, hue:'#4E7D9E', pix:'•••.112.•••-57'},
  {id:'malika',     nome:'Malika', curto:'Malika', modelo:'consig', pct:.8, hue:'#9E4E6A'},
];

const CATS_LOJA = {
  roupas:{nome:'Roupas', icon:'shirt'}, aromas:{nome:'Aromas', icon:'droplets'}, incensos:{nome:'Incensos', icon:'sparkles'},
  velas:{nome:'Velas', icon:'flame'}, bemestar:{nome:'Bem-estar', icon:'leaf'}, acessorios:{nome:'Acessórios', icon:'gem'},
  livros:{nome:'Livros e baralhos', icon:'book-open'}, casa:{nome:'Casa', icon:'house'},
};
/* catálogo montado a partir do que foi vendido de março a julho */
const PRODUTOS = [
  ['p01','Chá artesanal',44,'azuluaar','bemestar','coffee'],
  ['p02','Incenso nag champa',18,'stefy','incensos','sparkles'],
  ['p03','Incenso artesanal',25,'stefy','incensos','sparkles'],
  ['p04','Incenso natural',22,'stefy','incensos','sparkles'],
  ['p05','Óleo essencial alecrim',48.9,'anandani','aromas','droplet'],
  ['p06','Óleo essencial eucalipto',39.9,'anandani','aromas','droplet'],
  ['p07','Óleo essencial tea tree',49.9,'anandani','aromas','droplet'],
  ['p08','Óleo essencial lavandin',49,'anandani','aromas','droplet'],
  ['p09','Óleo essencial laranja doce',34.9,'anandani','aromas','droplet'],
  ['p10','Óleo essencial lemon',45.9,'anandani','aromas','droplet'],
  ['p11','Desodorante natural',39.9,'anandani','bemestar','leaf'],
  ['p12','Colar Anandani',46.9,'anandani','acessorios','gem'],
  ['p13','Raspador de língua',15,'dada','bemestar','leaf'],
  ['p14','Livro P.R. Sarkar',40,'dada','livros','book-open'],
  ['p15','Tiger balm',60,'dada','bemestar','leaf'],
  ['p16','Asafétida (hing)',60,'dada','bemestar','leaf'],
  ['p17','Saia',130,'ea','roupas','shirt'],
  ['p18','Calça de seda',130,'ea','roupas','shirt'],
  ['p19','Vestido',170,'ea','roupas','shirt'],
  ['p20','Lenço',90,'ea','roupas','wind'],
  ['p21','Camiseta Anirvana',65,'ea','roupas','shirt'],
  ['p22','Camiseta Festival',85,'ea','roupas','shirt'],
  ['p23','Bolsa indiana',139,'ea','acessorios','shopping-bag'],
  ['p24','Incensário',62.5,'ea','casa','flower-2'],
  ['p25','Mobile',50,'ea','casa','wind'],
  ['p26','Aromatizador pessoal',46.9,'ea','aromas','droplets'],
  ['p27','Camisa botânica',188,'valefadas','roupas','shirt'],
  ['p28','Vestido botânica',188,'valefadas','roupas','shirt'],
  ['p29','Vestido infantil botânica',125,'valefadas','roupas','baby'],
  ['p30','Macacão botânica',250,'valefadas','roupas','shirt'],
  ['p31','Cachepô',45,'rita','casa','sprout'],
  ['p32','Pijama',60,'rita','roupas','moon'],
  ['p33','Cordão de celular',69,'rita','acessorios','phone'],
  ['p34','Chaveiro',19,'rita','acessorios','tag'],
  ['p35','Bolsa colombiana',67,'francisco','acessorios','shopping-bag'],
  ['p36','Bolsa artesanal grande',285,'francisco','acessorios','shopping-bag'],
  ['p37','Vela aromática',62,'mardevelas','velas','flame'],
  ['p38','Vela Buda',20,'mardevelas','velas','flame'],
  ['p39','Vela olho',35,'mardevelas','velas','flame'],
  ['p40','Baralho Didi',120,'didi','livros','layers'],
  ['p41','Hidrolato',38,'colinas','aromas','droplets'],
  ['p42','Óleo essencial alfavaca',44,'colinas','aromas','droplet'],
  ['p43','Óleo essencial tangerina',28,'yaci','aromas','droplet'],
  ['p44','Própolis spray',30,'mel','bemestar','leaf'],
  ['p45','Japamala',41.5,'sara','acessorios','gem'],
];

/* ---------- VENDAS REAIS mar–jul/2026 (planilha Lojinha) ----------
   [mês, descrição, valor, forma, fornecedor] */
const VENDAS_PLANILHA = [
 ['03','2 chás',88,'pix','azuluaar'],['03','2 incensos',50,'pix','stefy'],['03','1 OE alecrim',48.9,'pix','anandani'],['03','Cópias coloridas e P&B',8.5,'dinheiro','ea'],
 ['03','1 raspador de língua',15,'dinheiro','dada'],['03','1 saia',130,'pix','ea'],['03','1 calça seda',130,'descontado','ea'],['03','1 camisa botânica',188,'credito3x','valefadas'],
 ['03','1 incenso nag + 1 artesanal',40,'credito3x','stefy'],['03','1 saia indiana',130,'credito3x','ea'],['03','1 mobile',50,'credito3x','ea'],['03','1 camisa botânica',188,'pix','valefadas'],
 ['03','1 cachepô',35,'pix','rita'],['03','1 OE eucalipto',39.9,'pix','anandani'],['03','1 calça',130,'dinheiro','ea'],['03','1 saia',130,'credito2x','ea'],
 ['03','2 incensos',50,'descontado','stefy'],['03','3 incensos',62,'pix','stefy'],['03','1 calça',130,'dinheiro','ea'],['03','2 raspadores de língua',25,'dinheiro','dada'],
 ['03','1 lenço',82,'dinheiro','ea'],['03','1 vestido',170,'credito2x','ea'],['03','1 vestido botânica',188,'dinheiro','valefadas'],['03','1 bolsa colombiana',67,'debito','francisco'],
 ['03','1 OE lavanda + 1 OE tea tree',121.8,'dinheiro','ea'],['03','1 vela',20,'dinheiro','mardevelas'],['03','1 vestido infantil botânica',125,'pix','valefadas'],['03','1 livro P.R. Sarkar',40,'pix','dada'],
 ['03','1 baralho',120,'pix','didi'],['03','1 calça',130,'pix','ea'],['03','1 desodorante',39.9,'credito2x','ea'],['03','1 vestido',100,'credito2x','ea'],
 ['03','1 incensário',62.5,'credito2x','ea'],['03','5 velas Buda',100,'dinheiro','mardevelas'],
 ['04','1 macacão',250,'debito','valefadas'],['04','1 hidrolato',38,'credito','colinas'],['04','1 vestido botânica',188,'dinheiro','valefadas'],['04','1 OE alecrim',48.9,'fiado','anandani'],
 ['04','1 camiseta EA',64,'dinheiro','ea'],['04','1 OE tangerina',28,'pix','yaci'],['04','1 colar Anandani',46.9,'pix','anandani'],['04','1 tiger balm',60,'dinheiro','dada'],
 ['04','1 strong hing',60,'dinheiro','dada'],['04','1 colar Anandani',46.9,'pix','anandani'],['04','1 baralho Didi',120,'pix','didi'],['04','1 OE alfavaca',44,'dinheiro','colinas'],
 ['04','1 incenso nag champa',18,'dinheiro','stefy'],['04','1 saia',130,'pix','ea'],['04','1 vestido',170,'pix','ea'],['04','4 livros',125,'pix','dada'],
 ['04','1 própolis spray',30,'dinheiro','mel'],['04','1 camiseta EA',64,'dinheiro','ea'],['04','1 chá',44,'dinheiro','azuluaar'],
 ['05','1 saia',130,'dinheiro','ea'],['05','1 incenso',18,'dinheiro','stefy'],['05','1 OE lavandin',49,'dinheiro','anandani'],['05','1 OE cedro',48.9,'dinheiro','anandani'],
 ['05','1 OE verbena',32,'dinheiro','colinas'],['05','1 saia',130,'credito','ea'],['05','1 japamala',41.5,'credito2x','sara'],['05','1 incensário',62.5,'credito2x','ea'],
 ['05','1 bolsa',130,'credito2x','ea'],['05','1 vela',62,'dinheiro','mardevelas'],['05','1 OE laranja doce',34.9,'dinheiro','anandani'],['05','1 OE lemon',45.9,'dinheiro','anandani'],
 ['05','1 OE laranja',34.9,'dinheiro','anandani'],['05','1 desodorante',39.9,'dinheiro','anandani'],['05','2 velas',124,'dinheiro','mardevelas'],['05','1 cachepô',45,'dinheiro','rita'],
 ['05','1 incenso',18,'pix','stefy'],['05','1 incenso',25,'pix','stefy'],['05','2 incensos',44,'dinheiro','stefy'],['05','2 baralhos Didi',240,'pix','didi'],
 ['05','1 OE tea tree',49.9,'pix','anandani'],['05','1 incenso',22,'credito','stefy'],['05','1 cachepô',45,'dinheiro','rita'],
 ['06','1 bolsa Francisco',140,'pix','francisco','Festival'],['06','1 camiseta',65,'pix','ea','Festival'],['06','1 camiseta Festival',85,'debito','ea','Festival'],['06','1 camiseta',65,'debito','ea','Festival'],
 ['06','1 bolsa Francisco',285,'debito','francisco','Festival'],['06','1 painel',100,'debito','ea','Festival'],['06','1 camiseta',65,'debito','ea','Festival'],['06','1 camiseta',65,'pix','ea','Festival'],
 ['06','1 camiseta',65,'credito','ea','Festival'],['06','1 camiseta Festival',85,'credito','ea','Festival'],['06','1 camiseta',65,'pix','ea','Festival'],['06','1 tiger balm',60,'pix','dada','Festival'],
 ['06','1 asafétida',60,'pix','dada','Festival'],['06','2 incensos',50,'pix','stefy','Festival'],['06','1 incenso',22,'pix','stefy','Festival'],['06','1 camiseta',65,'credito','ea','Festival'],
 ['06','1 camiseta Festival',85,'credito','ea','Festival'],['06','2 incensos',47,'debito','stefy','Festival'],['06','1 tiger balm',60,'pix','dada','Festival'],['06','1 incenso',25,'pix','stefy','Festival'],
 ['06','1 camiseta',65,'pix','ea','Festival'],['06','1 camiseta Festival',85,'pix','ea','Festival'],['06','1 camiseta',65,'pix','ea','Festival'],['06','3 camisetas Festival',255,'pix','ea','Festival'],
 ['06','1 camiseta Festival',85,'dinheiro','ea','Festival'],
 ['06','1 japamala',40,'debito','sara'],['06','1 lenço',90,'credito','ea'],['06','1 nag champa',18,'descontado','stefy'],['06','1 pijama',60,'dinheiro','rita'],
 ['06','1 própolis sabor',30,'pix','mel'],['06','1 camiseta Festival',85,'pix','ea'],['06','1 chaveiro',19,'dinheiro','rita'],['06','1 alça de celular',35,'dinheiro','rita'],
 ['06','1 aromatizador pessoal',46.9,'pix','ea'],
 ['07','1 OE eucalipto',39.9,'dinheiro','ea'],['07','1 OE laranja',35,'credito2x','ea'],['07','1 OE alecrim',49,'credito2x','ea'],['07','1 vela',62,'credito2x','mardevelas'],
 ['07','1 bolsa indiana',139,'descontado','ea'],['07','1 vela Buda',20,'dinheiro','mardevelas'],['07','1 vela olho',35,'dinheiro','mardevelas'],['07','1 incenso',22,'dinheiro','stefy'],
 ['07','1 incenso',18,'pix','stefy'],['07','1 cordão de celular',69,'pix','rita'],['07','1 própolis',30,'pix','mel'],['07','1 calça',125,'credito','ea'],
 ['07','2 incensos',47,'pix','stefy'],
];

/* ---------- CONTROLE FINANCEIRO: categorias da planilha ---------- */
const CAT_SAIDA = {
  'Despesa Fixa':               {icon:'landmark',  dica:'Luz, internet, Nilson, Sara, MEI, taxas, pró-labore, serviços'},
  'Airbnb':                     {icon:'bed',       dica:'Café, roupas de cama e banho, yoga férias'},
  'Limpeza':                    {icon:'sparkle',   dica:'Material de limpeza, Sonia'},
  'Manutenção':                 {icon:'settings',  dica:'Lâmpadas, papelaria, consertos'},
  'Social Mídia e Publicidade': {icon:'trending-up', dica:'Valéria, Instagram, Google, WhatsApp'},
  'Utensílios/eletro/melhorias':{icon:'package',   dica:'Tudo o que é novo, aquisições'},
  'Eventos':                    {icon:'ticket',    dica:'Yoga & café, materiais de eventos'},
  'Cantina':                    {icon:'coffee',    dica:'Insumos para a cantina'},
  'Extra':                      {icon:'circle-alert', dica:'O que não se encaixa nas outras'},
};
const CAT_ENTRADA = {
  'Airbnb':    {icon:'bed'},
  'Coworking': {icon:'grid-2x2'},
  'Eventos':   {icon:'ticket'},
  'Cantina':   {icon:'coffee'},
  'Extra':     {icon:'banknote'},
};
/* contas que se repetem todo mês (aba de cada mês da planilha) — valores de exemplo */
const CONTAS_FIXAS = [
  {id:'cf-mei',  nome:'MEI (DAS)',            cat:'Despesa Fixa', valor:76.90, dia:20},
  {id:'cf-luz',  nome:'Luz',                  cat:'Despesa Fixa', valor:298.40, dia:10, varia:true},
  {id:'cf-net',  nome:'Internet',             cat:'Despesa Fixa', valor:119.90, dia:15},
  {id:'cf-nil',  nome:'Nilson',               cat:'Despesa Fixa', valor:350, dia:5},
  {id:'cf-sara', nome:'Sara',                 cat:'Despesa Fixa', valor:600, dia:5},
  {id:'cf-dv',   nome:'Dessa e Vitor (atividades EA)', cat:'Despesa Fixa', valor:800, dia:5},
  {id:'cf-son',  nome:'Diarista Sonia',       cat:'Limpeza', valor:640, dia:30},
  {id:'cf-val',  nome:'Valéria (social mídia)', cat:'Social Mídia e Publicidade', valor:500, dia:10},
  {id:'cf-can',  nome:'Canva',                cat:'Social Mídia e Publicidade', valor:34.90, dia:12},
  {id:'cf-ig',   nome:'Instagram (anúncios)', cat:'Social Mídia e Publicidade', valor:150, dia:1},
  {id:'cf-gg',   nome:'Google Ads',           cat:'Social Mídia e Publicidade', valor:100, dia:1},
  {id:'cf-tx',   nome:'Taxas bancárias',      cat:'Despesa Fixa', valor:32.50, dia:30},
];
