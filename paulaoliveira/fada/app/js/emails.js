/* E-mails automáticos do Clube da Fada.
   Cada um tem: quando sai, o assunto e o texto. Na versão de verdade, saem pelo Brevo (ou Resend)
   com o domínio fadamarinha.com, disparados pelo banco (compra paga, aniversário, lote marcado...). */
(function () {
  var BASE = 'https://rottaguide.com/paulaoliveira/fada/app/';
  var EMAILS = [
    { id: 'boasvindas', nome: 'Boas-vindas ao Clube', quando: 'Assim que a cliente vira membro',
      assunto: 'Bem-vinda ao Clube da Fada, {nome}',
      titulo: 'Você agora é do Clube da Fada',
      texto: ['Que alegria ter você por aqui, {nome}.', 'Você já começou com {pontos} pontos. Cada compra vira ponto, e os pontos viram amostra, frete grátis, desconto e miniatura.', 'E o melhor: membro fica sabendo dos lotes antes e entra 1 hora antes de todo mundo.'],
      botao: 'Abrir o app' },
    { id: 'compra', nome: 'Compra com pontos', quando: 'Quando o pagamento de um pedido é aprovado na loja',
      assunto: 'Sua compra rendeu {ganhou} pontos',
      titulo: 'Obrigada pela compra, {nome}',
      texto: ['Seu pedido foi aprovado e já está sendo preparado com carinho.', 'Ele rendeu {ganhou} pontos. Agora você tem {pontos} pontos no Clube da Fada.', 'Faltam {falta} pontos para o próximo presente.'],
      botao: 'Ver meus pontos' },
    { id: 'nivel', nome: 'Subiu de nível', quando: 'Quando ela passa para Pérola ou Sereia',
      assunto: 'Você agora é {nivel}',
      titulo: 'Bem-vinda ao nível {nivel}',
      texto: ['Você subiu de nível no Clube da Fada.', 'A partir de agora: entrada ainda mais cedo nos lotes e frete grátis no mês do seu aniversário.'],
      botao: 'Ver o que mudou' },
    { id: 'trocar', nome: 'Pontos para trocar', quando: 'Quando os pontos já dão para um prêmio',
      assunto: 'Seus pontos já viraram presente',
      titulo: '{nome}, você já pode trocar',
      texto: ['Você tem {pontos} pontos no Clube da Fada.', 'Já dá para trocar por uma amostra de 2 ml de um perfume que você escolher. Ou guardar para um prêmio maior.'],
      botao: 'Trocar meus pontos' },
    { id: 'cupom', nome: 'Cupom pronto', quando: 'Quando ela troca pontos por desconto ou frete',
      assunto: 'Seu cupom {cupom} está pronto',
      titulo: 'Seu presente está guardado',
      texto: ['Use o cupom {cupom} no pagamento da sua próxima compra.', 'Ele vale por 60 dias e é só seu.'],
      botao: 'Ir para a loja', cupom: true },
    { id: 'aniversario', nome: 'Aniversário', quando: 'No dia do aniversário, às 9h',
      assunto: 'Feliz aniversário, {nome}',
      titulo: 'Hoje o mar inteiro canta para você',
      texto: ['Feliz aniversário, {nome}!', 'Deixamos 100 pontos de presente no seu Clube da Fada. Eles valem o mês inteiro.'],
      botao: 'Ver meu presente' },
    { id: 'lote', nome: 'Lote abre amanhã', quando: 'Na véspera de um lote, para quem está na fila',
      assunto: '{produto} volta amanhã, às {hora}',
      titulo: '{produto} volta amanhã',
      texto: ['O lote abre amanhã, às {hora}, com poucas unidades.', 'Como você é membro, entra 1 hora antes: o app avisa na hora.'],
      botao: 'Ver o lançamento' },
    { id: 'saudade', nome: 'Saudade', quando: '90 dias sem comprar', desligado: true,
      assunto: 'Sentimos sua falta, {nome}',
      titulo: 'O mar sentiu sua falta',
      texto: ['Faz um tempinho que você não aparece.', 'Seus {pontos} pontos continuam guardados. Tem perfume novo à tona e receita nova na Receitas da Fada.'],
      botao: 'Ver as novidades' }
  ];

  function preenche(t, d) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return d[k] != null ? d[k] : ''; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* HTML de e-mail (tabelas e estilo na linha, como os programas de e-mail exigem) */
  function html(e, d) {
    var t = function (x) { return esc(preenche(x, d)); };
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + t(e.assunto) + '</title></head>' +
      '<body style="margin:0;padding:0;background:#EFE4D7">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFE4D7"><tr><td align="center" style="padding:28px 14px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FBF5EE;border-radius:22px;overflow:hidden">' +
      '<tr><td style="background:#DCE4E2 url(' + BASE + 'arte/agua.webp) center/cover;height:150px;text-align:center;vertical-align:middle">' +
      '<img src="' + BASE + 'arte/sereia-dourada.png" width="150" alt="Fada Marinha" style="display:inline-block;width:150px;height:auto"></td></tr>' +
      '<tr><td style="padding:30px 30px 8px;text-align:center;font-family:Montserrat,Arial,sans-serif;font-size:11px;letter-spacing:4px;color:#7A5A2E">CLUBE DA FADA</td></tr>' +
      '<tr><td style="padding:6px 30px 0;text-align:center;font-family:\'Cormorant Garamond\',Georgia,serif;font-style:italic;font-size:32px;line-height:1.1;color:#33241A">' + t(e.titulo) + '</td></tr>' +
      '<tr><td style="padding:16px 34px 0;font-family:Georgia,serif;font-size:17px;line-height:1.55;color:#5B4A3C;text-align:center">' +
      e.texto.map(function (p) { return '<p style="margin:0 0 12px">' + t(p) + '</p>'; }).join('') + '</td></tr>' +
      (e.cupom ? '<tr><td align="center" style="padding:6px 30px 0"><div style="display:inline-block;padding:14px 26px;border:1.5px dashed #A98451;border-radius:14px;font-family:Montserrat,Arial,sans-serif;font-size:22px;letter-spacing:3px;color:#7A5A2E">' + t('{cupom}') + '</div></td></tr>' : '') +
      '<tr><td align="center" style="padding:22px 30px 34px"><a href="' + BASE + '" style="display:inline-block;padding:15px 34px;border-radius:30px;background:#8E6A3E;color:#FFF8EE;font-family:Montserrat,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:3px;text-decoration:none;text-transform:uppercase">' + t(e.botao) + '</a></td></tr>' +
      '<tr><td style="padding:18px 30px 26px;border-top:1px solid #E7DACB;text-align:center;font-family:Montserrat,Arial,sans-serif;font-size:11px;line-height:1.6;color:#8A7766">Perfumaria botânica · Cosméticos naturais<br>Você recebe este e-mail porque é membro do Clube da Fada. <a href="#" style="color:#8A7766">Não quero mais receber</a></td></tr>' +
      '</table></td></tr></table></body></html>';
  }

  window.EMAILS = EMAILS;
  window.Email = { preenche: preenche, html: html };
})();
