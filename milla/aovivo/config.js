/* Identidade deste app: o ÚNICO lugar que sabe de quem é o app e qual banco usar.

   IMOBILIÁRIA MILLA · AO VIVO (16/11/2026) — demonstração da Ti Artes, NÃO é cliente.
   A mesma imobiliária fictícia da demonstração aberta (rottaguide.com/milla/app), mas com banco:
   a sala 'millademo' no projeto Pro do estúdio, onde caem as conversas e os leads de quem
   escreve para o número da Milla (41) 96349-3440 (robô 'millademo' no cofre). O vendedor mostra
   ao prospect a conversa caindo no CRM. Entra só quem está em millademo.acessos (o Eugênio é a
   dona; Tiago e Betão com o próprio e-mail) — nunca cliente. A sala apaga conversas e leads com
   mais de 7 dias (pg_cron 'millademo-limpeza'): quem testa deixa o número de verdade.

   Publicar: cd ~/Desktop/CODIGO/app-milla && sh publicar-cliente.sh ~/Desktop/CODIGO/app-millademo milla/aovivo "msg"
   Os imóveis são os da demonstração: cp ../app-milla/dados/imoveis.json dados/ (depois de puxa-demo.py). */
var APP_CONFIG = {
  nome: "Imobiliária Milla",
  curto: "Imobiliária Milla",
  site: 'https://rottaguide.com/milla/imobiliaria/',
  instagram: '',
  fixo: '',

  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',   /* vazio no fonte; o publicar grava o de produção só na cópia */
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',
  sala: 'millademo',
};

/* O que o publicar grava no config.js da cópia publicada (nunca no fonte do app). */
var APP_NUVEM_PRODUCAO = {
  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',   /* projeto Pro da Ti Artes */
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',   /* a publicável: quem protege é a RLS da sala */
  sala: 'millademo',
};
