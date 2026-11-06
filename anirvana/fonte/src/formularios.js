/* ============================================================
   FORMULÁRIOS DE INSCRIÇÃO — réplica dos Google Forms do Espaço
   (as perguntas são as mesmas, na mesma ordem; só o desenho é do app)
   - "Aulas de Yoga Espaço Anirvana": yoga e acroyoga, gestantes, particular,
     meditação e movimento consciente
   - "Inscrição Aulas de Aquarela / Musicalização": crianças, com responsável
     (violão usa o mesmo de musicalização)
   Regra pura: roda no app e no servidor (backup).
   ============================================================ */
const PROF_FORM = {aquarela:'Bruno Costa', musicalizacao:'Bruno Saes', violao:'Bruno Saes'};
const IMAGEM_TXT = 'AUTORIZO SEM QUALQUER ÔNUS ECONÔMICO/FINANCEIRO extra ao Espaço Anirvana utilizar a imagem de minha pessoa, bem como a voz, minha ou de quem represento, inseridas uma ou ambas, no material a ser transmitido ao vivo ou gravado e em qualquer tipo de mídia e veículo de comunicação, para os fins que a Instituição acima citada lhe pretender dar, do qual declaro estar plenamente ciente, especialmente quanto ao fato de que esta imagem poderá ser utilizada em aulas, palestras ou outros usos, comerciais ou não.';
const FORMULARIOS = {
  yoga: {id:'yoga', nome:'Aulas de Yoga', sub:'Formulário de inscrição para as aulas presenciais', atvs:['yoga','particular','gestantes','meditacao','movimento'], passos:[
    {t:'Você', campos:[
      {k:'nome', l:'Nome completo', c:'Nome', obr:1, auto:'name'},
      {k:'nasc', l:'Data de nascimento', c:'Nascimento', tipo:'data', obr:1},
      {k:'tel', l:'Telefone (WhatsApp de preferência)', c:'WhatsApp', tipo:'tel', obr:1},
      {k:'cpf', l:'CPF', c:'CPF', tipo:'cpf', obr:1, adm:1},
      {k:'email', l:'E-mail', c:'E-mail', tipo:'email', ajuda:'Opcional. Para receber o recibo e os avisos.', adm:1},
      {k:'respNome', l:'Nome do responsável', c:'Responsável', obr:1, menor:1},
      {k:'respTel', l:'WhatsApp do responsável', c:'Tel. do responsável', tipo:'tel', obr:1, menor:1},
    ]},
    {t:'Prática e saúde', campos:[
      {k:'motivo', l:'Qual o motivo principal de sua procura pelo Yoga?', c:'Motivo', obr:1},
      {k:'praticou', l:'Já praticou ou pratica Yoga?', c:'Já praticou', obr:1},
      {k:'pressao', l:'Como está sua pressão arterial?', c:'Pressão arterial', tipo:'multi', ops:['Baixa','Normal','Alta'], obr:1, saude:1},
      {k:'coluna', l:'Você sente dores na coluna? Se sim, em que região?', c:'Coluna', obr:1, saude:1},
      {k:'dores', l:'Você sente dores...? Se sim, descreva brevemente.', c:'Outras dores', obr:1, saude:1},
      {k:'intestino', l:'Como está o funcionamento do seu intestino?', c:'Intestino', ajuda:'Funciona todos os dias, mais de uma vez ao dia ou quantas vezes na semana', obr:1, saude:1},
      {k:'labirintite', l:'Tem labirintite, tonturas ou algo do gênero?', c:'Labirintite / tontura', obr:1, saude:1},
      {k:'saudeGeral', l:'Como você considera sua saúde física e mental?', c:'Saúde física e mental', obr:1, saude:1},
      {k:'maisInfo', l:'Mais alguma informação importante?', c:'Medicação, tratamento, cirurgia', ajuda:'Uso de medicação, tratamento de saúde, cirurgias realizadas', obr:1, saude:1, area:1},
      {sec:'Contato de emergência'},
      {k:'emergNome', l:'Nome e grau de parentesco', c:'Emergência', obr:1},
      {k:'emergTel', l:'Telefone', c:'Tel. de emergência', tipo:'tel', obr:1},
    ]},
    {t:'Combinados', campos:[
      {k:'termos', c:'aceitar os termos', tipo:'aceite', l:'Declaro estar ciente e concordar com os termos de responsabilidade que me foram enviados.', op:'Sim, declaro estar ciente e concordo com os termos.', obr:1, termos:1},
      {k:'imagem', c:'responder sobre o uso de imagem', tipo:'escolha', l:'Autorização de uso de imagem', texto:IMAGEM_TXT, ops:[['sim','Sim, autorizo.'],['nao','Não, não autorizo.']], obr:1},
    ]},
  ]},
  criancas: {id:'criancas', nome:'Aulas de {atv}', sub:'Inscrição no Espaço Anirvana', atvs:['aquarela','musicalizacao','violao'], crianca:1, passos:[
    {t:'A criança', campos:[
      {sec:'Informações da criança'},
      {k:'nome', l:'Nome', c:'Nome', obr:1},
      {k:'nasc', l:'Data de nascimento', c:'Nascimento', tipo:'data', obr:1},
      {k:'endereco', l:'Endereço', c:'Endereço', obr:1, adm:1},
      {k:'saude', l:'Possui algum problema de saúde, alergia ou informações de saúde que possam ser relevantes? Se sim, conte-nos um pouco.', c:'Saúde e alergias', obr:1, saude:1, area:1},
      {k:'restricao', l:'Restrições alimentares', c:'Restrição alimentar', tipo:'escolha', ops:[['Nenhuma','Nenhuma'],['Vegetariano','Vegetariano'],['Vegano','Vegano'],['Sem glúten','Sem glúten']], obr:1},
    ]},
    {t:'Responsável', campos:[
      {sec:'Informações do(a) responsável'},
      {k:'respNome', l:'Nome', c:'Responsável', obr:1},
      {k:'respParentesco', l:'Grau de parentesco da criança', c:'Parentesco', obr:1},
      {k:'tel', l:'Telefone de contato', c:'WhatsApp', ajuda:'De preferência com WhatsApp', tipo:'tel', obr:1},
      {k:'email', l:'E-mail do responsável', c:'E-mail', tipo:'email', ajuda:'Opcional. Para o recibo e os avisos.', adm:1},
    ]},
    {t:'Combinados', campos:[
      {k:'imagem', c:'responder sobre imagens e filmagens', tipo:'escolha', l:'Você autoriza o uso de imagens e filmagens, feitas durante as aulas, para divulgações em nossas redes sociais?', ops:[['sim','Sim, autorizo'],['nao','Não']], obr:1},
      {k:'ciente', c:'confirmar a mensalidade', tipo:'aceite', l:'Estou ciente que devo pagar a mensalidade para iniciar as atividades.', op:'Sim!', obr:1},
    ]},
  ], final:'Agradecemos a sua inscrição! Agora é só nos avisar pelo WhatsApp (41) 99848-7892 que passaremos os dados para o pagamento da mensalidade. Até breve! Espaço Anirvana e Prof. {prof}.'},
};
/* o app acrescenta no fim o que a LGPD pede (e a indicação, que dá pontos) */
const CAMPOS_APP = [
  {k:'saudeOk', tipo:'check', padrao:true, l:'Autorizo que as informações de saúde acima sejam vistas só pela professora da atividade, para cuidar da segurança na aula.'},
  {k:'priv', c:'aceitar a política de privacidade', tipo:'check', obr:1, l:'Li e aceito a política de privacidade (como o Espaço cuida dos dados).'},
  {k:'whats', tipo:'check', padrao:true, l:'Quero receber avisos de aula e de pagamento pelo WhatsApp.'},
  {k:'indicou', l:'Alguém indicou o Espaço? (opcional)', c:'Indicação', ajuda:'A pessoa ganha pontos quando a matrícula é confirmada.'},
];
const formDe = atv => Object.values(FORMULARIOS).find(F => F.atvs.includes(atv))?.id || 'yoga';
const tituloForm = (F, atv) => F.nome.replace('{atv}', ATIV[atv] ? ATIV[atv].curto : '');
const camposForm = F => F.passos.flatMap(p => p.campos).filter(c => c.k);
const cpfOk = s => { const d = String(s || '').replace(/\D/g, ''); if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false; const dv = n => { let t = 0; for (let i = 0; i < n; i++) t += +d[i] * (n + 1 - i); const r = (t * 10) % 11; return r === 10 ? 0 : r; }; return dv(9) === +d[9] && dv(10) === +d[10]; };
const cpfMascara = s => { const d = String(s || '').replace(/\D/g, '').slice(0, 11); return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2'); };
const idade = nasc => { if (!nasc) return null; const n = pd(nasc); let i = HOJE.getFullYear() - n.getFullYear(); if (HOJE.getMonth() < n.getMonth() || (HOJE.getMonth() === n.getMonth() && HOJE.getDate() < n.getDate())) i--; return i; };
/* resumo de saúde em uma linha (para planilha e listas) */
function resumoSaude(f){
  const F = FORMULARIOS[f.form] || FORMULARIOS.yoga, r = f.respostas || {};
  const nada = v => !v || /^(n[aã]o|nenhum[a]?|normal|nada|-)\.?$/i.test(String(v).trim());
  return camposForm(F).filter(c => c.saude && !nada(r[c.k])).map(c => `${c.c}: ${r[c.k]}`).join(' · ');
}
