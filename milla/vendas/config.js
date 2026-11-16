/* CRM DE VENDAS DA MILLA (12/11/2026) — o único lugar que diz qual banco usar.
   Aqui ficam só as imobiliárias que querem COMPRAR a Milla e os vendedores parceiros
   (Tiago, Betão…). Nada de cliente final de imobiliária nem de conversa de cliente:
   isso mora na sala de cada imobiliária (regra: jamais misturar).

   No fonte fica a DEMONSTRAÇÃO (sem banco, dados inventados guardados no navegador).
   A cópia publicada recebe supabaseUrl/supabaseKey e a sala 'millavendas'. */
var APP_CONFIG = {
  nome: 'Milla Vendas',
  curto: 'Milla Vendas',
  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',   /* vazio = demonstração sem banco */
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',
  sala: 'millavendas',
  /* o link que cada vendedor espalha: o site da Milla grava de quem veio (?de=) */
  site: 'https://rottaguide.com/milla/',
  /* a divisão combinada em 12/11/2026, sobre implantação e cada mensalidade paga */
  divisao: { tiartes: 0.25, eugenio: 0.375, vendedor: 0.375 },
};

/* o banco da cópia publicada (rottaguide.com/milla/vendas): o publicar.sh grava isto no APP_CONFIG
   só na cópia. A chave é a pública (anon); quem decide o que cada um vê é a RLS da sala. */
var APP_NUVEM_PRODUCAO = {
  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',
  sala: 'millavendas',
};
