/* Identidade deste app: o ÚNICO lugar que sabe de quem é o app e qual banco usar.
   nuvem.js, auth.js, pedidos.js e app.js leem daqui e não trazem endereço nem marca fixos.

   IMOBILIÁRIA MILLA — DEMONSTRAÇÃO DE VENDA (16/11/2026).
   Imobiliária FICTÍCIA para mostrar a Milla (o robô de atendimento) junto do site
   e da gestão. Imóveis, nomes, corretores e endereço são inventados
   (dados/gera-demo.py). Todo atendimento vai para o número da Milla, onde o robô
   de demonstração (linha 'millademo' no cofre) responde com estes mesmos imóveis.
   Nada aqui vem de cliente nenhum. */
var APP_CONFIG = {
  nome: 'Imobiliária Milla',
  curto: 'Milla',
  slogan: 'Compra, venda, aluguel e temporada',
  dona: 'Carla',                     /* a corretora responsável (fictícia) */
  donaNome: 'Carla Menezes',
  corretores: [
    { nome: 'Carla Menezes', papel: 'Corretora responsável · vendas', foto: 'arte/corretor-cm.svg' },
    { nome: 'Rafael Duarte', papel: 'Corretor · temporada', foto: 'arte/corretor-rd.svg' },
    { nome: 'Bianca Torres', papel: 'Corretora · locação', foto: 'arte/corretor-bt.svg' },
  ],
  creci: 'Demonstração · dados fictícios',
  cnpj: '00.000.000/0001-00 (demonstração)',
  endereco: 'Av. Atlântica, 1000 · Praia de Leste (endereço de demonstração)',
  cidade: 'Pontal do Paraná/PR · 83255-000',
  whatsapp: '5541963493440',         /* o número da Milla: o robô de demonstração responde aqui */
  whatsappEquipe: '5541963493440',   /* o da equipe: na demonstração é o mesmo, todo atendimento passa pela Milla */
  fixo: '',
  email: '',
  emailPrivacidade: '',
  instagram: '',
  facebook: '',
  horario: 'A Milla atende 24 horas; a equipe, de segunda a sábado, das 9h às 18h',
  horarioSchema: 'Mo-Su 00:00-23:59',
  rua: 'Av. Atlântica, 1000',
  bairro: 'Praia de Leste',
  municipio: 'Pontal do Paraná',
  uf: 'PR',
  cep: '83255-000',
  maps: '',
  lat: -25.6757,
  lng: -48.4770,
  siteOficial: 'https://rottaguide.com/milla/imobiliaria',
  demo: true,                        /* mostra a faixa "demonstração" e tira do Google */
  videos: [],
  vitrine: { oportunidade: ['612', '651', '645'], slide: [] },

  supabaseUrl: '',   /* demonstração: sem banco, os pedidos ficam no aparelho */
  supabaseKey: '',
  sala: '',
};
