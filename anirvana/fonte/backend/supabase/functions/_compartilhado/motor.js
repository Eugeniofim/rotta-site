// GERADO por build.py a partir de src/ (data, engine, pontos, backup). Não editar à mão.
// O servidor usa exatamente as mesmas contas do app: repasse da yoga, lojinha, balanço, pontos e o backup em Excel.
export function criarMotor(cfg = {}) {
const nomePlano = m => m.plano ? `${ATIV[m.atv].curto} ${m.plano}` : ATIV[m.atv].curto;
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

const HOJE = cfg.HOJE || new Date(2026, 9, 29, 10, 50);   /* data da demonstração: qui 29/10/2026 */
const MES_ATUAL = cfg.MES_ATUAL || '2026-10';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_C = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const DIAS = ['dom','seg','ter','qua','qui','sex','sáb'];
const DIAS_L = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

/* ---------- equipe ---------- */
const EQUIPE = cfg.EQUIPE || [
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
const TURMAS = cfg.TURMAS || [
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
const FORNECEDORES = cfg.FORNECEDORES || [
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

/* ============================================================
   MOTOR — gera a demonstração e faz todas as contas
   (as mesmas regras da planilha, agora automáticas)
   ============================================================ */
const VERSAO = 'proto-1.2';
const CHAVE = 'anirvana_proto_v1';

/* ---------- utilidades ---------- */
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d||1); };
const addD = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const diasEntre = (a,b) => Math.round((pd(iso(b)) - pd(iso(a))) / 864e5);
const mesDe = s => s.slice(0,7);
const HOJE_ISO = iso(HOJE);
const r2 = v => Math.round(v*100)/100;
const brl = v => (v < -0.004 ? '−' : '') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const brl0 = v => (v < -0.004 ? '−' : '') + 'R$ ' + Math.abs(Math.round(v)).toLocaleString('pt-BR');
const dataBR = s => { const d = pd(s); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}`; };
const dataLonga = s => { const d = pd(s); return `${DIAS_L[d.getDay()].toLowerCase()}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`; };
const nomeMes = m => MESES[+m.slice(5,7)-1];
const mesCurto = m => MESES_C[+m.slice(5,7)-1];
const fimDoMes = m => { const d = pd(m+'-01'); return iso(new Date(d.getFullYear(), d.getMonth()+1, 0)); };
const escapeH = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ini = nome => nome.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
const corDe = nome => { let h = 0; for (const c of nome) h = (h*31 + c.charCodeAt(0)) >>> 0; const cs = ['#E5672A','#B9488E','#3E8E6E','#2F7FB8','#6A55C9','#C08A12','#1F8A9E','#A2563A','#5B8C2A','#8E5BB0']; return cs[h % cs.length]; };

const TURMA = Object.fromEntries(TURMAS.map(t => [t.id, t]));
const FORN = Object.fromEntries(FORNECEDORES.map(f => [f.id, f]));
const PESSOA = Object.fromEntries(EQUIPE.map(p => [p.id, p]));
const FERIADOS = ['2026-09-07','2026-10-12'];
const nomeTurma = t => t.nome || ATIV[t.atv].curto;

/* ============================================================
   SEMENTE — monta a demonstração (sempre igual pra todo mundo)
   ============================================================ */
function semear(){
  const R = rng(20261029);
  const S = {v:VERSAO, regras:{...REGRAS_PADRAO, planos:Object.fromEntries(Object.entries(PLANOS_YOGA).map(([k,p])=>[k,p.preco])), pct:Object.fromEntries(Object.entries(ATIV).map(([k,a])=>[k,a.repasse]))},
    alunos:[], aulas:{}, presencas:[], pagamentos:[], sessoes:[], vendas:[], repLoja:[], fiado:[], lanc:[], repEquipe:[], subs:[], vou:{}, seq:1000};

  /* alunos */
  ALUNOS_BASE.forEach(([id,nome,desde,mats,obs]) => {
    S.alunos.push({id, nome, desde, obs:obs||'', status:'ativo', tel:'(41) 9'+String(8000+Math.floor(R()*1999))+'-'+String(1000+Math.floor(R()*8999)),
      mats: mats.map(([atv,plano,turmas,venc,metodo,instr],i) => ({id:`${id}-${i}`, atv, plano: typeof plano === 'string' ? plano : null, valor: typeof plano === 'number' ? plano : null, turmas, venc, metodo, cartaoFim: metodo==='cartao' ? String(1000+Math.floor(R()*8999)) : null, instr: instr||null, status:'ativo'}))});
  });

  /* aulas e presenças de 01/ago até hoje */
  const subsHist = {'2026-10-14_qua1830':'sara', '2026-09-24_qui1900':'kamala', '2026-08-29_sab0900':'stefy'};
  const vazias = ['2026-10-08_qui0800','2026-09-03_qui0800','2026-08-22_sab1030'];
  const agoraMin = HOJE.getHours()*60 + HOJE.getMinutes();
  for (let d = pd('2026-08-01'); d <= HOJE; d = addD(d,1)){
    const di = iso(d);
    if (FERIADOS.includes(di)) continue;
    TURMAS.filter(t => t.dia === d.getDay()).forEach(t => {
      const [hh,mm] = t.h.split(':').map(Number);
      if (di === HOJE_ISO && hh*60+mm > agoraMin) return;          /* ainda não aconteceu */
      const sid = `${di}_${t.id}`;
      const pendente = di === HOJE_ISO;                              /* chamada de hoje ainda não feita */
      const instr = subsHist[sid] || t.instr;
      S.aulas[sid] = {id:sid, d:di, turma:t.id, instr, feita:!pendente, vazia:false, sub:!!subsHist[sid]};
      if (pendente) return;
      let n = 0;
      if (!vazias.includes(sid)){
        S.alunos.forEach(a => a.mats.forEach(m => {
          if (!m.turmas.includes(t.id) || di < a.desde) return;
          const ult = ULTIMA_VINDA[a.id];
          if (ult && di > ult) return;
          const recente = diasEntre(d, HOJE) <= 9 && !ult;               /* quem não está sumido veio nos últimos dias */
          const p = recente ? .97 : t.atv === 'particular' ? .95 : t.atv === 'ingles' ? .86 : m.plano === '1x' ? .86 : .78;
          if ((ult && di === ult) || R() < p){ S.presencas.push({s:sid, a:a.id, t: m.plano || 'mensal'}); n++; }
        }));
        if (t.atv === 'yoga' && R() < .2){ S.presencas.push({s:sid, a:null, nome:'Visitante', t:'avulsa'}); n++; }
      }
      if (n === 0) S.aulas[sid].vazia = true;
    });
  }

  /* mensalidades pagas (ago–out) */
  ['2026-08','2026-09','2026-10'].forEach(mes => {
    S.alunos.forEach(a => a.mats.forEach(m => {
      if (a.desde > fimDoMes(mes)) return;
      const venc = `${mes}-${pad(Math.min(m.venc,28))}`;
      if (mes === MES_ATUAL && (venc > HOJE_ISO || SEM_PAGAR_OUT.includes(a.id))) return;
      let dia = m.metodo === 'cartao' ? venc : iso(addD(pd(venc), Math.floor(R()*4) - 1));
      if (a.desde.slice(0,7) === mes && a.desde > dia) dia = a.desde;
      if (dia > HOJE_ISO) dia = HOJE_ISO;
      S.pagamentos.push({id:'pg'+(S.seq++), a:a.id, mat:m.id, mes, valor:valorMat(S,m), d:dia, metodo:m.metodo==='cartao'?'cartao':'pix'});
    }));
  });

  /* atendimentos com hora marcada (massagem e terapias) */
  const clientes = ['Rosana','Marcelo','Tereza','Jorge','Silvia','Paulo','Cristina','Luana Ferraz','Ivone','Márcia','Eduardo','Lúcia'];
  ['2026-08','2026-09','2026-10'].forEach((mes,k) => {
    const nM = [7,9,6][k], nT = [2,1,2][k];
    for (let i=0;i<nM;i++) S.sessoes.push({id:'se'+(S.seq++), atv:'massagem', instr:'aurelice', d:`${mes}-${pad(2+Math.floor(i*26/nM))}`, cliente:clientes[Math.floor(R()*clientes.length)], valor:250});
    for (let i=0;i<nT;i++) S.sessoes.push({id:'se'+(S.seq++), atv:'terapias', instr:'kamala', d:`${mes}-${pad(6+i*11)}`, cliente:clientes[Math.floor(R()*clientes.length)], valor:i%2?260:220});
  });
  S.sessoes = S.sessoes.filter(s => s.d <= HOJE_ISO);

  /* vendas reais da planilha (mar–jul) */
  const porMes = {};
  VENDAS_PLANILHA.forEach(v => (porMes[v[0]] = porMes[v[0]] || []).push(v));
  Object.entries(porMes).forEach(([mm, lista]) => {
    let normais = lista.filter(v => !v[5]), k = 0;
    lista.forEach(([m,desc,valor,forma,forn,evento]) => {
      const dia = evento ? 20 : 1 + Math.floor((k++) * 28 / normais.length);
      S.vendas.push({id:'v'+(S.seq++), d:`2026-${mm}-${pad(dia)}`, desc, valor, forma, forn, evento:evento||'', fonte:'planilha'});
    });
  });
  /* vendas de exemplo (ago–out) */
  const formas = ['pix','pix','pix','debito','credito','dinheiro','credito2x'];
  ['2026-08','2026-09','2026-10'].forEach((mes,k) => {
    const n = [13,11,14][k];
    for (let i=0;i<n;i++){
      const p = PRODUTOS[Math.floor(R()*PRODUTOS.length)];
      const q = R() < .2 ? 2 : 1;
      const dia = 1 + Math.floor(i * (k===2 ? 28 : 29) / n);
      S.vendas.push({id:'v'+(S.seq++), d:`${mes}-${pad(dia)}`, desc:`${q} ${p[1].toLowerCase()}`, valor:r2(p[2]*q), forma:formas[Math.floor(R()*formas.length)], forn:p[3], evento:'', fonte:'exemplo', itens:[{p:p[0], q}]});
    }
  });
  S.vendas = S.vendas.filter(v => v.d <= HOJE_ISO);

  /* repasses já feitos aos fornecedores: até julho tudo pago; agosto pago em 05/09; setembro só parte */
  const devido = (forn, ate) => S.vendas.filter(v => v.forn === forn && v.d <= ate).reduce((s,v) => s + partesVenda(v).forn, 0);
  FORNECEDORES.filter(f => f.pct > 0).forEach(f => {
    const ateJul = devido(f.id,'2026-07-31'), ateAgo = devido(f.id,'2026-08-31') - ateJul;
    if (ateJul > 0) S.repLoja.push({id:'rl'+(S.seq++), forn:f.id, valor:r2(ateJul), d:'2026-08-05'});
    if (ateAgo > 0) S.repLoja.push({id:'rl'+(S.seq++), forn:f.id, valor:r2(ateAgo), d:'2026-09-05'});
    if (['stefy','dada','valefadas'].includes(f.id)){
      const ateSet = devido(f.id,'2026-09-30') - ateJul - ateAgo;
      if (ateSet > 0) S.repLoja.push({id:'rl'+(S.seq++), forn:f.id, valor:r2(ateSet), d:'2026-10-05'});
    }
  });

  /* fiado: soma R$ 312,70, o mesmo "A RECEBER!" da planilha */
  S.fiado = [
    {id:'fi1', cliente:'Bianca Rocha',   desc:'Vestido — 2ª parcela', valor:62.40, d:'2026-09-12', pago:false},
    {id:'fi2', cliente:'Débora Martins', desc:'Bolsa indiana — 2ª parcela', valor:69.50, d:'2026-10-03', pago:false},
    {id:'fi3', cliente:'Juliana Alves',  desc:'Óleo essencial alecrim', valor:48.90, d:'2026-10-10', pago:false},
    {id:'fi4', cliente:'Kamala',         desc:'OE lavandin + cedro + verbena (descontar no repasse)', valor:131.90, d:'2026-10-21', pago:false},
  ];

  /* controle financeiro: lançamentos manuais jan–out (valores de exemplo) */
  const airbnb = [3200,2600,900,1100,700,900,2100,800,1300,1500];
  for (let mi = 1; mi <= 10; mi++){
    const mes = `2026-${pad(mi)}`;
    const L = (tipo, dia, valor, desc, cat, extra={}) => { const d = `${mes}-${pad(Math.min(dia,28))}`; if (d <= HOJE_ISO) S.lanc.push({id:'l'+(S.seq++), tipo, d, valor:r2(valor), desc, cat, ...extra}); };
    CONTAS_FIXAS.forEach(c => {
      if (mi === 10 && ['cf-son','cf-tx','cf-mei','cf-can'].includes(c.id)) return;      /* pendentes em outubro */
      const v = c.varia ? 250 + Math.round(R()*90) + .4 : c.valor;
      L('saida', c.dia, v, c.nome, c.cat, {conta:c.id});
    });
    if (mi % 2 === 1) L('saida', 18, 88 + Math.round(R()*20), 'Água', 'Despesa Fixa');
    for (let i=0;i<2+Math.floor(R()*3);i++) L('saida', 3+i*7, 40+Math.round(R()*180), ['Café da manhã hóspedes','Roupa de cama','Lavanderia','Amenities'][i%4], 'Airbnb');
    L('saida', 9+Math.floor(R()*15), 30+Math.round(R()*150), ['Lâmpadas','Papelaria','Conserto torneira','Tinta parede'][mi%4], 'Manutenção');
    L('saida', 6+Math.floor(R()*15), 60+Math.round(R()*140), 'Insumos cantina', 'Cantina');
    if (R() < .45) L('saida', 14, 120+Math.round(R()*480), ['Ventilador','Almofadas de meditação','Tapetes de yoga','Chaleira elétrica'][mi%4], 'Utensílios/eletro/melhorias');
    if (mi === 6) L('saida', 18, 1840, 'Festival — estrutura e materiais', 'Eventos');
    if ([4,8,10].includes(mi)) L('saida', 22, 140, 'Yoga & café — insumos', 'Eventos');
    /* entradas manuais */
    const nb = 1 + Math.floor(R()*3); for (let i=0;i<nb;i++) L('entrada', 2+i*9, airbnb[mi-1]/nb, 'Hospedagem Airbnb', 'Airbnb');
    L('entrada', 10, 300+Math.round(R()*6)*50, 'Coworking — mensalistas', 'Coworking');
    L('entrada', 25, 120+Math.round(R()*230), 'Cantina', 'Cantina');
    if (mi === 6) L('entrada', 20, 4200, 'Festival — ingressos', 'Eventos');
    if ([4,8,10].includes(mi)) L('entrada', 22, 380, 'Yoga & café', 'Eventos');
    if (mi === 7) L('entrada', 4, 400, '50% aluguel do espaço 04/07', 'Extra');
  }

  /* repasses da equipe já pagos (meses fechados) */
  ['2026-08','2026-09'].forEach(mes => EQUIPE.forEach(p => S.repEquipe.push({id:'re'+(S.seq++), p:p.id, mes, d:`${mes.slice(0,5)}${pad(+mes.slice(5)+1)}-05`})));

  /* formação de instrutores: presença por dia de módulo, estágio e monografia */
  S.formandos = FORMACAO.formandos.map(([nome, aluno, dias, estagio, mono], i) => ({id:'fo'+i, nome, aluno, dias, estagio, mono}));


  /* ---------- fichas (no lugar do Google Forms), pontos, avisos e eventos ---------- */
  const OBJ = ['Flexibilidade','Dor nas costas','Ansiedade e estresse','Condicionamento','Respiração','Espiritualidade','Dormir melhor'];
  const COMO_ = ['Instagram','Indicação','Google','Passei na frente','Evento do Espaço'];
  const SAUDE = {a05:'Hérnia de disco na lombar (L4-L5). Evitar flexão profunda.', a10:'Cirurgia no joelho direito em 2024.', a16:'Pressão alta, controlada com remédio.', a23:'Gestante de 24 semanas.', a24:'Gestante de 16 semanas.', a13:'Labirintite de vez em quando.'};
  const EMERG = ['Carlos','Ana','Marcelo','Rita','Jorge','Sônia','Paulo','Lúcia'];
  S.alunos.forEach((a, i) => {
    const kid = /Responsável: ([^·]+)·\s*(\d+) anos/.exec(a.obs);
    const anos = kid ? +kid[2] : 22 + Math.floor(R()*38);
    a.nasc = `${2026 - anos - (HOJE.getMonth() < 6 ? 1 : 0)}-${pad(1 + Math.floor(R()*12))}-${pad(1 + Math.floor(R()*27))}`;
    if (kid){ a.resp = kid[1].trim(); a.respTel = '(41) 9' + String(8000+Math.floor(R()*1999)) + '-' + String(1000+Math.floor(R()*8999)); }
    const pn = a.nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    a.email = i % 4 === 3 ? '' : `${pn}.${a.nome.split(' ').slice(-1)[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}@gmail.com`;
    const saude = SAUDE[a.id];
    a.ficha = {exp:['nunca','ja','pratico'][Math.floor(R()*3)], obj:[OBJ[i%7], OBJ[(i*3+2)%7]].filter((x,j,arr) => arr.indexOf(x) === j).join(','),
      temSaude: saude ? 'sim' : 'nao', saude: saude || '', saudeOk: !!saude && a.id !== 'a13', emerg: kid ? a.resp : `${EMERG[i%8]} (${['marido','mãe','irmã','pai','esposa','filho'][i%6]})`, emergTel:'(41) 9' + String(8000+Math.floor(R()*1999)) + '-' + String(1000+Math.floor(R()*8999)),
      como: COMO_[i%5], indicou: i%5 === 1 ? 'Luana Ferraz' : '', whats:true, imagem: i%3 !== 0, termos:true, completa: !['a12','a22','a38'].includes(a.id)};
    if (kid) a.ficha.obj = 'Musicalidade,Socialização';
  });
  S.consent = Object.fromEntries(S.alunos.map(a => [a.id, {whatsapp:a.ficha.whats, imagem:a.ficha.imagem, whatsappEm:a.desde, imagemEm:a.desde}]));
  /* quem já instalou o app e ligou os avisos (a Luana ainda não: é o exemplo da demonstração) */
  S.pontosAcoes = {};
  S.alunos.forEach((a, i) => { if (a.id !== 'a01' && i % 3 !== 2) S.pontosAcoes[a.id] = {instalar:'2026-10-0' + (1 + i%8), ...(i % 2 ? {notif:'2026-10-0' + (1 + i%8)} : {})}; });
  S.pontosAcoes.a07 = {...S.pontosAcoes.a07, indicar:'2026-09-14'};
  S.trocas = [{id:'tr1', a:'a07', premio:'pr2', custo:500, d:'2026-10-26', estado:'pendente'}, {id:'tr2', a:'a10', premio:'pr1', custo:300, d:'2026-10-12', estado:'entregue'}];
  S.avisos = {}; S.caixa = {};
  /* lojinha: os fornecedores ficam; os produtos a Dessa cadastra (o histórico de vendas continua) */
  S.produtos = [];
  /* alunos que avisaram que pagaram: só a administração dá baixa */
  S.avisosPag = [{id:'ap1', a:'a29', mat:'a29-0', mes:'2026-10', valor:130, d:'2026-10-28', h:'19:42', metodo:'pix', estado:'aguardando'}];
  S.backups = [{mes:'2026-08', d:'2026-09-01', h:'03:00', por:'automático'}, {mes:'2026-09', d:'2026-10-01', h:'03:00', por:'automático'}];
  S.enviados = [
    {para:'Débora Martins', canal:'whatsapp', regra:'atraso', quando:'27/10 09:00'},
    {para:'Gabriel Lima', canal:'whatsapp', regra:'saudade', quando:'27/10 10:00'},
    {para:'Turma seg 18:30 · 9 alunos', canal:'push', regra:'lembrete', quando:'26/10 16:30'},
    {para:'Juliana Alves', canal:'email', regra:'recibo', quando:'28/10 08:12'},
    {para:'Turma qua 18:30 · 9 alunos', canal:'push', regra:'lembrete', quando:'28/10 16:30'},
    {para:'Turma qui 08:00 · 3 alunos', canal:'push', regra:'lembrete', quando:'29/10 06:00'},
  ];
  /* inscrições novas, como chegariam pelo link (no lugar do Google Forms) */
  S.inscricoes = [
    {id:'in1', d:'2026-10-28', estado:'nova', origem:'app', dados:{nome:'Marina Souto', nasc:'1991-04-12', tel:'(41) 99812-4410', email:'marina.souto@gmail.com', atv:'yoga', plano:'2x', turmas:'ter1900,qui1900', experimental:true, exp:'nunca', obj:'Ansiedade e estresse,Flexibilidade', temSaude:'nao', emerg:'Rui (marido)', emergTel:'(41) 99771-2030', como:'Instagram', termos:true, priv:true, whats:true, imagem:true}},
    {id:'in2', d:'2026-10-29', estado:'nova', origem:'app', dados:{nome:'Pedro Alves', nasc:'2011-09-03', tel:'(41) 99640-1187', resp:'Sandra Alves', respTel:'(41) 99640-1180', atv:'violao', turmas:'qui1700', exp:'ja', obj:'Musicalidade', temSaude:'nao', emerg:'Sandra Alves (mãe)', emergTel:'(41) 99640-1180', como:'Indicação', indicou:'Rodrigo Pacheco', termos:true, priv:true, whats:true, imagem:false}},
    {id:'in3', d:'2026-10-29', estado:'nova', origem:'app', dados:{nome:'Helena Ribeiro', nasc:'1995-01-27', tel:'(41) 99733-5521', email:'helena.rib@hotmail.com', atv:'gestantes', turmas:'sab1030', exp:'nunca', obj:'Gestação,Respiração', temSaude:'sim', saude:'Gestante de 20 semanas, gravidez sem intercorrências.', saudeOk:true, emerg:'Diego (marido)', emergTel:'(41) 99733-5500', como:'Google', termos:true, priv:true, whats:true, imagem:false}},
  ];
  /* eventos criados pela administração */
  S.eventos = EVENTOS.map(e => ({...e, vagas:20, alvo:'todos', canais:['push','whatsapp'], criado:'2026-10-20', divulgado:'2026-10-21', inscritos:['a04','a07','a10','a16','a20','a25','a28'].map((a, i) => ({a, d:`2026-10-${21 + i}`, pago:a !== 'a20'})), externos:3}));

  /* pedido de substituição aberto (Sara pede; Kamala e Ana Julia veem) */
  S.subs.push({id:'sb1', turma:'ter1900', d:'2026-11-03', de:'sara', para:null, motivo:'Consulta médica no fim da tarde', status:'aberto', criado:'2026-10-27'});
  return S;
}

/* ---------- valores e partes ---------- */
function valorMat(S, m){ return m.plano ? S.regras.planos[m.plano] : m.valor; }
function partesVenda(v){
  const f = FORN[v.forn] || {pct:0};
  const forn = r2(v.valor * (v.pct ?? f.pct));
  return {forn, ea: r2(v.valor - forn)};
}
function taxasYoga(planos, pct = .7){
  const t = {};
  Object.entries(PLANOS_YOGA).forEach(([k,p]) => { t[k] = p.sem ? pct * planos[k] / (p.sem*4) : pct * planos[k]; });
  return t;
}

/* ---------- consultas ---------- */
const alunoPor = (S,id) => S.alunos.find(a => a.id === id);
function presencasDoAluno(S, aid){ return S.presencas.filter(p => p.a === aid).map(p => ({...p, aula:S.aulas[p.s]})).filter(p => p.aula).sort((a,b) => a.aula.d < b.aula.d ? 1 : -1); }
function ultimaVinda(S, aid){ const p = presencasDoAluno(S, aid)[0]; return p ? p.aula.d : null; }
function freqStatus(S, a){
  const turma = a.mats.some(m => m.turmas.some(t => ATIV[TURMA[t].atv].turma));
  if (!turma) return {st:'ok', dias:null, txt:'Hora marcada'};
  const u = ultimaVinda(S, a.id);
  if (!u) return {st:'bad', dias:null, txt:'Ainda não veio'};
  const dias = diasEntre(pd(u), HOJE);
  if (dias > 10.5) return {st:'bad', dias, txt:`Faltando há ${dias} dias`};
  if (dias > 7)    return {st:'warn', dias, txt:`Sem vir há ${dias} dias`};
  return {st:'ok', dias, txt: dias === 0 ? 'Veio hoje' : dias === 1 ? 'Veio ontem' : `Veio há ${dias} dias`};
}
function statusPagamento(S, a, m, mes = MES_ATUAL){
  const pg = S.pagamentos.find(p => p.mat === m.id && p.mes === mes);
  const venc = `${mes}-${pad(Math.min(m.venc,28))}`;
  if (pg) return {st:'pago', pg, venc, txt:`Pago em ${dataBR(pg.d)}`};
  const av_ = (S.avisosPag || []).find(x => x.mat === m.id && x.mes === mes && x.estado === 'aguardando');
  if (av_) return {st:'analise', aviso:av_, venc, txt:`Avisou que pagou em ${dataBR(av_.d)} · ${av_.metodo === 'cartao' ? 'cartão' : 'Pix'} · falta a administração confirmar`};
  if (m.status === 'cancelado') return {st:'cancelado', venc, txt:`Cancelado em ${dataBR(m.fim || HOJE_ISO)}`};
  if (m.status === 'pausado') return {st:'pausado', venc, txt:'Plano pausado'};
  if (a && a.desde > venc){ const d0 = pd(venc); const prox = iso(new Date(d0.getFullYear(), d0.getMonth()+1, Math.min(m.venc,28))); return {st:'avencer', venc:prox, dias:diasEntre(HOJE, pd(prox)), txt:`Primeira cobrança ${dataBR(prox)}`}; }
  const d = diasEntre(pd(venc), HOJE);
  if (d > 0) return {st:'atrasado', venc, dias:d, txt:`Venceu ${dataBR(venc)} · ${d} ${d===1?'dia':'dias'}`};
  return {st:'avencer', venc, dias:-d, txt: d === 0 ? 'Vence hoje' : `Vence ${dataBR(venc)}`};
}
function proximaCobranca(S, m){
  const st = statusPagamento(S, S.alunos.find(a => a.mats.includes(m)), m);
  if (st.st !== 'pago') return st.venc;
  /* o primeiro mês ainda sem pagamento (quem adiantou não paga duas vezes o mesmo mês) */
  let d = pd(st.venc);
  for (let i = 0; i < 24; i++){ d = new Date(d.getFullYear(), d.getMonth()+1, Math.min(m.venc,28)); const mes = `${d.getFullYear()}-${pad(d.getMonth()+1)}`; if (!S.pagamentos.some(p => p.mat === m.id && p.mes === mes)) break; }
  return iso(d);
}
function alunosVisiveis(S, instrId){
  const p = PESSOA[instrId];
  return S.alunos.filter(a => a.mats.some(m => (m.instr ? m.instr === instrId : p.atvs.includes(m.atv) && ATIV[m.atv].vis === 'todos')));
}
function turmasDoInstr(instrId){ return TURMAS.filter(t => t.instr === instrId); }
function matriculadosNaTurma(S, tid){ return S.alunos.filter(a => a.mats.some(m => m.turmas.includes(tid) && m.status === 'ativo')); }

/* ---------- receitas por atividade no mês ---------- */
function receitaMes(S, mes){
  const pct = S.regras.pct, linhas = [];
  const add = (atv, bruto, fonte, instrs) => { if (bruto > 0 || fonte === 'planilha') linhas.push({atv, bruto:r2(bruto), pct:pct[atv] ?? .7, instr:r2(bruto*(pct[atv] ?? .7)), ea:r2(bruto*(1-(pct[atv] ?? .7))), fonte, instrs}); };
  const F = FECH_PLANILHA[mes];
  if (F){
    const P = ATIV; /* na planilha os % eram fixos: 70/30 e inglês 65/35 */
    const lin = (atv, bruto) => linhas.push({atv, bruto, pct:P[atv].repasse, instr:r2(bruto*P[atv].repasse), ea:r2(bruto*(1-P[atv].repasse)), fonte:'planilha'});
    lin('yoga', F.yogaBruto);
    lin('particular', (F.extras.kamala.particular||0) + (F.extras.anajulia.particular||0));
    lin('gestantes', F.extras.kamala.gestantes||0);
    lin('meditacao', F.extras.kamala.meditacao||0);
    Object.entries(F.outras).forEach(([k,v]) => lin(k, v));
  } else if (MENSAL_EXEMPLO[mes]){
    Object.entries(MENSAL_EXEMPLO[mes]).forEach(([k,v]) => add(k, v, 'exemplo'));
  } else {
    const soma = {};
    S.pagamentos.filter(p => p.mes === mes).forEach(p => { const a = alunoPor(S,p.a); const m = a && a.mats.find(x => x.id === p.mat); if (m) soma[m.atv] = (soma[m.atv]||0) + p.valor; });
    S.sessoes.filter(s => mesDe(s.d) === mes).forEach(s => soma[s.atv] = (soma[s.atv]||0) + s.valor);
    Object.keys(ATIV).forEach(k => soma[k] && add(k, soma[k], 'app'));
  }
  const tot = linhas.reduce((t,l) => ({bruto:t.bruto+l.bruto, ea:t.ea+l.ea, instr:t.instr+l.instr}), {bruto:0, ea:0, instr:0});
  return {linhas, ...tot, fonte: F ? 'planilha' : MENSAL_EXEMPLO[mes] ? 'exemplo' : 'app'};
}
function lojaMes(S, mes){
  const vs = S.vendas.filter(v => mesDe(v.d) === mes);
  const r = vs.reduce((t,v) => { const p = partesVenda(v); return {bruto:t.bruto+v.valor, forn:t.forn+p.forn, ea:t.ea+p.ea}; }, {bruto:0, forn:0, ea:0});
  return {...r, n:vs.length, vendas:vs};
}
function balancoMes(S, mes){
  const rec = receitaMes(S, mes), loja = lojaMes(S, mes);
  const lan = S.lanc.filter(l => mesDe(l.d) === mes);
  const manualIn = lan.filter(l => l.tipo === 'entrada'), saidas = lan.filter(l => l.tipo === 'saida');
  const eIn = manualIn.reduce((s,l) => s + l.valor, 0), eOut = saidas.reduce((s,l) => s + l.valor, 0);
  const entradas = rec.ea + loja.ea + eIn;
  return {mes, rec, loja, manualIn, saidas, entradas:r2(entradas), saidasTot:r2(eOut), saldo:r2(entradas - eOut), repassar:r2(rec.instr + loja.forn)};
}

/* ---------- FECHAMENTO DA YOGA (a regra da aba "ALUNOS / INSTRUTORAS") ----------
   1) cada presença vale 70% do plano ÷ aulas do mês; aula vazia vale R$ 10
   2) o "excedente" = 70% das mensalidades − soma do passo 1
   3) o excedente é dividido igualmente por aula dada e somado a cada instrutora
   4) somam-se 70% das particulares, gestantes e meditação */
function fechamentoYoga(S, mes){
  const F = FECH_PLANILHA[mes];
  let bruto, aulaVazia, instrs = {}, extras = {}, fonte, taxas;
  const P = F ? Object.fromEntries(Object.entries(ATIV).map(([k,a]) => [k, a.repasse])) : S.regras.pct;   /* % da equipe */
  if (F){
    fonte = 'planilha'; bruto = F.yogaBruto; aulaVazia = F.aulaVazia;
    taxas = taxasYoga(Object.fromEntries(Object.entries(PLANOS_YOGA).map(([k,p]) => [k,p.preco])));
    Object.entries(F.instr).forEach(([id,v]) => instrs[id] = {aulas:v.aulas, c:{...v.c}});
    Object.entries(F.extras).forEach(([id,v]) => extras[id] = {...v});
  } else {
    fonte = 'app'; aulaVazia = S.regras.aulaVazia; taxas = taxasYoga(S.regras.planos, P.yoga);
    bruto = 0;
    S.pagamentos.filter(p => p.mes === mes).forEach(p => { const a = alunoPor(S,p.a); const m = a && a.mats.find(x => x.id === p.mat); if (m && m.atv === 'yoga') bruto += p.valor; });
    Object.values(S.aulas).filter(au => mesDe(au.d) === mes && au.feita && TURMA[au.turma].atv === 'yoga').forEach(au => {
      const I = instrs[au.instr] = instrs[au.instr] || {aulas:0, c:{vazia:0,'4x':0,'3x':0,'2x':0,'1x':0,avulsa:0}};
      I.aulas++;
      if (au.vazia){ I.c.vazia++; return; }
      S.presencas.filter(p => p.s === au.id).forEach(p => { if (I.c[p.t] !== undefined) I.c[p.t]++; });
    });
    S.pagamentos.filter(p => p.mes === mes).forEach(p => {
      const a = alunoPor(S,p.a); const m = a && a.mats.find(x => x.id === p.mat); if (!m) return;
      if (!['particular','gestantes','meditacao'].includes(m.atv)) return;
      const who = responsavelMat(m); if (!who) return;            /* sem instrutor definido: fica fora até a administração escolher */
      (extras[who] = extras[who] || {})[m.atv] = (extras[who][m.atv] || 0) + p.valor;
    });
  }
  const pool = r2(bruto * P.yoga);
  const linhas = Object.entries(instrs).map(([id,I]) => {
    const aReceber = I.c.vazia*aulaVazia + ['4x','3x','2x','1x','avulsa'].reduce((s,k) => s + I.c[k]*taxas[k], 0);
    return {id, nome:PESSOA[id].nome, aulas:I.aulas, c:I.c, aReceber};
  });
  const somaAR = linhas.reduce((s,l) => s + l.aReceber, 0);
  const totalAulas = linhas.reduce((s,l) => s + l.aulas, 0);
  const excedente = pool - somaAR;
  const porAula = totalAulas ? excedente / totalAulas : 0;
  linhas.forEach(l => {
    l.ajuste = porAula * l.aulas;
    l.yoga = l.aReceber + l.ajuste;
    l.piso = l.aulas * aulaVazia;
    l.yogaFinal = S.regras.piso ? Math.max(l.yoga, l.piso) : l.yoga;
    const ex = extras[l.id] || {};
    l.extras = {particular:(ex.particular||0)*P.particular, gestantes:(ex.gestantes||0)*P.gestantes, meditacao:(ex.meditacao||0)*P.meditacao};
    l.total = l.yogaFinal + l.extras.particular + l.extras.gestantes + l.extras.meditacao;
    if (F && F.conferido) l.conferido = F.conferido[l.id];
  });
  Object.entries(extras).forEach(([id,ex]) => { if (PESSOA[id] && !linhas.find(l => l.id === id)){ const e = {particular:(ex.particular||0)*P.particular, gestantes:(ex.gestantes||0)*P.gestantes, meditacao:(ex.meditacao||0)*P.meditacao}; linhas.push({id, nome:PESSOA[id].nome, aulas:0, c:{vazia:0,'4x':0,'3x':0,'2x':0,'1x':0,avulsa:0}, aReceber:0, ajuste:0, yoga:0, yogaFinal:0, piso:0, extras:e, total:e.particular+e.gestantes+e.meditacao}); }});
  linhas.sort((a,b) => b.total - a.total);
  return {mes, fonte, bruto, pool, pctYoga:P.yoga, aulaVazia, obsVazia: F && F.obsVazia, taxas, linhas, somaAR, totalAulas, excedente, porAula};
}
/* quem dá a aula desta matrícula: o escolhido, o da turma ou o único da atividade */
function responsavelMat(m){
  if (m.instr) return m.instr;
  const t = (m.turmas || []).map(id => TURMA[id]).find(Boolean);
  if (t) return t.instr;
  const quem = EQUIPE.filter(p => p.atvs.includes(m.atv));
  return quem.length === 1 ? quem[0].id : null;
}

/* ---------- repasses da equipe no mês (yoga + demais atividades) ---------- */
function repassesEquipe(S, mes){
  const fy = fechamentoYoga(S, mes), rec = receitaMes(S, mes);
  const out = {};
  const add = (id, lab, v) => { if (Math.abs(v) < .005 || !PESSOA[id]) return; (out[id] = out[id] || {id, nome:PESSOA[id].nome, itens:[], total:0}).itens.push({lab, v}); out[id].total += v; };
  fy.linhas.forEach(l => { add(l.id, 'Yoga (turmas)', l.yogaFinal); add(l.id, 'Particular', l.extras.particular); add(l.id, 'Gestantes', l.extras.gestantes); add(l.id, 'Meditação', l.extras.meditacao); });
  const dono = {aquarela:'bruno', musicalizacao:'brunos', violao:'brunos', ingles:'marina', massagem:'aurelice', terapias:'kamala'};
  rec.linhas.filter(l => dono[l.atv]).forEach(l => add(dono[l.atv], ATIV[l.atv].curto, l.instr));
  (S.descontos || []).filter(d => d.mes === mes && out[d.p]).forEach(d => add(d.p, `Lojinha: ${d.desc}`, -d.valor));
  return Object.values(out).map(o => ({...o, pago: S.repEquipe.find(r => r.p === o.id && r.mes === mes)})).sort((a,b) => b.total - a.total);
}

/* ---------- lojinha: quanto devo a cada fornecedor ---------- */
function saldoFornecedores(S){
  return FORNECEDORES.filter(f => f.pct > 0).map(f => {
    const devido = S.vendas.filter(v => v.forn === f.id).reduce((s,v) => s + partesVenda(v).forn, 0);
    const pago = S.repLoja.filter(r => r.forn === f.id).reduce((s,r) => s + r.valor, 0);
    const vendasAbertas = S.vendas.filter(v => v.forn === f.id && v.d > (S.repLoja.filter(r => r.forn === f.id).map(r => r.d).sort().pop() || '0')).length;
    return {...f, devido:r2(devido), pago:r2(pago), saldo:r2(devido - pago), vendasAbertas};
  }).sort((a,b) => b.saldo - a.saldo);
}

/* ---------- alertas do painel ---------- */
function alertasAdmin(S){
  const A = [];
  const atrasados = [], semPagar = [];
  S.alunos.forEach(a => a.mats.forEach(m => {
    const st = statusPagamento(S, a, m);
    if (st.st === 'atrasado'){
      atrasados.push({a, m, st});
      const veio = presencasDoAluno(S, a.id).some(p => mesDe(p.aula.d) === MES_ATUAL);
      if (veio) semPagar.push(a);
    }
  }));
  const conf = (S.avisosPag || []).filter(x => x.estado === 'aguardando');
  if (conf.length) A.push({cls:'pri', icon:'badge-check', t:`${conf.length} ${conf.length === 1 ? 'pagamento para confirmar' : 'pagamentos para confirmar'}`, s:`Avisaram que pagaram: ${conf.slice(0,3).map(x => alunoPor(S,x.a).nome.split(' ')[0]).join(', ')}${conf.length>3?'…':''}. Confira no banco e dê baixa.`, go:'admin-confirmar'});
  if (atrasados.length) A.push({cls:'bad', icon:'circle-alert', t:`${atrasados.length} mensalidades atrasadas`, s:`${brl(atrasados.reduce((s,x) => s + valorMat(S,x.m), 0))} em aberto · ${atrasados.slice(0,3).map(x => x.a.nome.split(' ')[0]).join(', ')}${atrasados.length>3?'…':''}`, go:'admin-mensalidades'});
  if (semPagar.length) A.push({cls:'warn', icon:'user-round-check', t:`${semPagar.length} vieram às aulas sem mensalidade paga`, s:`O app cruzou a chamada com os pagamentos: ${[...new Set(semPagar.map(a => a.nome.split(' ')[0]))].join(', ')}`, go:'admin-mensalidades'});
  const sumidos = S.alunos.map(a => ({a, f:freqStatus(S,a)})).filter(x => x.f.st !== 'ok');
  if (sumidos.length) A.push({cls:'warn', icon:'clock', t:`${sumidos.length} alunos sumindo`, s:sumidos.map(x => `${x.a.nome.split(' ')[0]} (${x.f.dias ?? '—'}d)`).join(' · '), go:'admin-alunos'});
  const forn = saldoFornecedores(S).filter(f => f.saldo > .01);
  if (forn.length) A.push({cls:'pri', icon:'store', t:`${brl(forn.reduce((s,f) => s+f.saldo,0))} a pagar a ${forn.length} fornecedores`, s:forn.slice(0,4).map(f => f.curto).join(', ') + (forn.length>4?'…':''), go:'admin-lojinha', sub:'fornecedores'});
  const fiado = S.fiado.filter(f => !f.pago);
  if (fiado.length) A.push({cls:'pri', icon:'receipt', t:`${brl(fiado.reduce((s,f) => s+f.valor,0))} a receber da lojinha`, s:`${fiado.length} compras fiadas ou parceladas`, go:'admin-lojinha', sub:'receber'});
  const subs = S.subs.filter(s => s.status === 'aberto');
  if (subs.length) A.push({cls:'warn', icon:'repeat', t:`${subs.length} pedido de substituição sem resposta`, s:subs.map(s => `${PESSOA[s.de].nome} · ${nomeTurma(TURMA[s.turma])} ${DIAS[pd(s.d).getDay()]} ${dataBR(s.d)}`).join(' · '), go:'admin-mais'});
  const pend = Object.values(S.aulas).filter(a => !a.feita);
  if (pend.length) A.push({cls:'pri', icon:'list-checks', t:`${pend.length} chamadas de hoje por fazer`, s:pend.map(a => `${nomeTurma(TURMA[a.turma])} ${TURMA[a.turma].h} · ${PESSOA[a.instr].nome}`).join(' · '), go:'admin-mais'});
  return A;
}
/* ---------- formação ---------- */
function formacaoStatus(){
  const feitos = FORMACAO.datas.filter(d => d <= HOJE_ISO).length, diasDados = feitos * 2;
  const prox = FORMACAO.datas.find(d => d > HOJE_ISO);
  return {feitos, diasDados, prox};
}
function formandoSituacao(f, st){
  const pct = st.diasDados ? f.dias / st.diasDados : 1;
  const faltasPermitidas = Math.floor(FORMACAO.modulos * 2 * .2), faltas = st.diasDados - f.dias;
  const sobra = faltasPermitidas - faltas;
  const estado = sobra < 0 ? 'bad' : sobra <= 2 ? 'warn' : 'ok';
  return {pct, faltas, sobra, st:estado, ok: sobra >= 0, txt: sobra < 0 ? 'passou do limite de faltas: precisa repor' : sobra === 0 ? 'não pode mais faltar' : `pode faltar mais ${sobra} ${sobra===1?'dia':'dias'} no curso`};
}
function contasDoMes(S, mes){
  return CONTAS_FIXAS.map(c => ({...c, pago: S.lanc.find(l => l.conta === c.id && mesDe(l.d) === mes)}));
}

/* ============================================================
   PONTOS DOS ALUNOS — regra pura (roda no app e no servidor)
   ============================================================ */
const REGRAS_PONTOS = [
  {id:'instalar', nome:'Instalar o app na tela de início', pts:50, vez:true, icon:'house'},
  {id:'notif',    nome:'Ativar os avisos do app', pts:20, vez:true, icon:'bell'},
  {id:'ficha',    nome:'Completar a ficha', pts:30, vez:true, icon:'clipboard-check'},
  {id:'aula',     nome:'Cada aula feita', pts:10, icon:'check'},
  {id:'vou',      nome:'Confirmar presença e ir', pts:5, icon:'calendar-days'},
  {id:'emdia',    nome:'Pagar até o vencimento', pts:20, icon:'wallet'},
  {id:'indicar',  nome:'Indicar alguém que se matricula', pts:100, icon:'user-plus'},
];
const PREMIOS = [
  {id:'pr1', nome:'10% em uma compra da lojinha', custo:300, icon:'store'},
  {id:'pr2', nome:'Uma aula avulsa de presente', custo:500, icon:'ticket'},
  {id:'pr3', nome:'Chá artesanal AzuLuaAr', custo:800, icon:'coffee'},
  {id:'pr4', nome:'Camiseta Anirvana', custo:1200, icon:'shirt'},
];
const NIVEIS = [['Semente',0],['Broto',150],['Folha',400],['Botão',800],['Lótus',1500]];
const PTS = Object.fromEntries(REGRAS_PONTOS.map(r => [r.id, r.pts]));

function pontosAluno(S, aid){
  const a = alunoPor(S, aid), itens = [];
  const pres = presencasDoAluno(S, aid);
  if (pres.length) itens.push({lab:`${pres.length} aulas feitas`, pts:pres.length * PTS.aula});
  const foi = new Set(pres.map(p => p.s));
  const vou = Object.entries(S.vou || {}).filter(([sid, v]) => v && foi.has(sid) && sid.includes('_')).length;
  if (vou) itens.push({lab:`${vou} presenças confirmadas antes`, pts:vou * PTS.vou});
  const emdia = S.pagamentos.filter(p => { if (p.a !== aid) return false; const m = a.mats.find(x => x.id === p.mat); return m && p.d <= `${p.mes}-${pad(Math.min(m.venc,28))}`; }).length;
  if (emdia) itens.push({lab:`${emdia} mensalidades pagas em dia`, pts:emdia * PTS.emdia});
  const acoes = {...((S.pontosAcoes || {})[aid] || {})};
  if (a.ficha && a.ficha.completa) acoes.ficha = acoes.ficha || a.desde;
  ['instalar','notif','ficha','indicar'].forEach(k => { if (acoes[k]) itens.push({lab:REGRAS_PONTOS.find(r => r.id === k).nome, pts:PTS[k], d:acoes[k]}); });
  const total = itens.reduce((s,i) => s + i.pts, 0);
  const gasto = (S.trocas || []).filter(t => t.a === aid && t.estado !== 'recusada').reduce((s,t) => s + t.custo, 0);
  let n = 0; NIVEIS.forEach(([, min], i) => { if (total >= min) n = i; });
  const prox = NIVEIS[n+1];
  return {itens, total, saldo:total - gasto, nivel:NIVEIS[n][0], prox:prox ? {nome:prox[0], falta:prox[1] - total, pct:(total - NIVEIS[n][1]) / (prox[1] - NIVEIS[n][1])} : null, acoes};
}

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

return { montarBackup, nomeBackup, balancoMes, repassesEquipe, pontosAluno, statusPagamento, ATIV, PLANOS_YOGA, REGRAS_PADRAO, HOJE, MES_ATUAL };
}
