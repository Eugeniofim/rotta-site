// Abre o protótipo, passa por todas as telas, executa os fluxos principais e tira prints.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'anirvana.html');   /* gerado pelo build.py */
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, {recursive:true});
const wrap = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${fs.readFileSync(SRC,'utf8')}</body></html>`;
const PAGE = path.join(__dirname, 'page.html'); fs.writeFileSync(PAGE, wrap);

(async () => {
  const b = await chromium.launch();
  const erros = [];
  const run = async (nome, vp, scheme, fn) => {
    const ctx = await b.newContext({viewport:vp, colorScheme:scheme, deviceScaleFactor:1});
    const p = await ctx.newPage();
    p.on('pageerror', e => erros.push(`[${nome}] ${e.message}`));
    p.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) erros.push(`[${nome}] console: ${m.text()}`); });
    await p.goto('file://' + PAGE);
    await fn(p);
    await ctx.close();
  };
  const shot = async (p, n, full=true) => { await p.waitForTimeout(450); await p.screenshot({path:path.join(OUT, n + '.png'), fullPage:full}); };
  const overflow = async (p, n) => { const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (w[0] > w[1] + 1) erros.push(`[${n}] rolagem horizontal ${w[0]} > ${w[1]}`); };

  await run('desk', {width:1366, height:900}, 'light', async p => {
    await shot(p, '00-porta', false);
    await p.click('[data-act=entrar][data-v=admin][data-who=dessa]');
    await shot(p, '01-admin-inicio');
    await p.click('.rail [data-act=tab][data-v=balanco]'); await shot(p, '02-balanco-mes');
    await p.click('[data-act=balVis][data-v=ano]'); await shot(p, '03-balanco-ano');
    await p.hover('.chart .hit[data-i="5"]'); await shot(p, '03b-tooltip', false);
    await p.click('.rail [data-act=tab][data-v=mensalidades]'); await shot(p, '04-mens-alunos');
    await p.click('[data-act=mensVis][data-v=fechamento]');
    for (const m of ['2026-01','2026-02','2026-03','2026-10']){ await p.click(`[data-act=fechMes][data-v="${m}"]`); await shot(p, '05-fech-' + m); }
    await p.click('[data-act=fechMes][data-v="2026-03"]'); await p.click('.rail [data-act=tab][data-v=balanco]'); await p.click('[data-act=balVis][data-v=mes]'); await p.click('[data-act=balMes][data-v="2026-03"]'); await shot(p, '05b-balanco-marco');
    await p.click('.rail [data-act=tab][data-v=mensalidades]'); await p.click('[data-act=mensVis][data-v=regras]'); await shot(p, '06-regras');
    await p.click('.rail [data-act=tab][data-v=lojinha]'); await p.waitForTimeout(900); await shot(p, '07-loja-vender', false);
    await p.click('.prod[data-v=p21]'); await p.click('.prod[data-v=p02]'); await p.click('.prod[data-v=p02]'); await p.waitForTimeout(800);
    await p.click('[data-act=checkout]'); await shot(p, '08-checkout', false);
    await p.click('[data-act=registrarVenda]'); await p.waitForTimeout(700); await shot(p, '09-recibo', false);
    await p.click('#sheet [data-act=fechar]');
    for (const v of ['vendas','fornecedores','receber']){ await p.click(`[data-act=lojaVis][data-v=${v}]`); await shot(p, '10-loja-' + v); }
    await p.click('.rail [data-act=tab][data-v=escola]'); await shot(p, '11-escola-alunos');
    await p.click('[data-act=escolaVis][data-v=formacao]'); await shot(p, '11b-formacao'); await p.click('[data-act=estagio] >> nth=3'); await p.click('[data-act=escolaVis][data-v=equipe]'); await shot(p, '11c-equipe');
    await p.click('[data-act=escolaVis][data-v=horarios]'); await shot(p, '12-escola-horarios');
    await p.click('.rail [data-act=tab][data-v=inicio]'); await p.click('[data-act=lancar]'); await p.fill('#lValor','120,50'); await p.fill('#lDesc','Lâmpadas'); await p.click('.opt[data-v="Manutenção"]'); await shot(p, '13-lancar', false);
    await p.click('#fLanc button[type=submit]'); await p.waitForTimeout(300);
    await p.click('.rail [data-act=role][data-v=instrutor]'); await shot(p, '14-instr-hoje');
    await p.click('[data-act=chamada]'); await p.click('.roll >> nth=0'); await p.click('.roll >> nth=1'); await shot(p, '15-chamada', false);
    await p.click('[data-act=salvarChamada]:not([data-v])'); await p.waitForTimeout(300); await shot(p, '16-instr-pos-chamada');
    await p.click('[data-act=aceitarSub]'); await p.waitForTimeout(200);
    await p.click('.rail [data-act=tab][data-v=agenda]'); await shot(p, '17-agenda');
    await p.click('.slot.mine >> nth=0'); await shot(p, '17b-minha-turma', false); await p.click('#sheet [data-act=pedirSub] >> nth=0'); await p.fill('#sMot','Viagem'); await p.click('#fSub button[type=submit]');
    await p.click('.rail [data-act=tab][data-v=alunos]'); await shot(p, '18-instr-alunos');
    await p.click('.rail [data-act=tab][data-v=mes]'); await shot(p, '19-meu-mes');
    await p.click('[data-act=meuMes][data-v="2026-01"]'); await shot(p, '19b-meu-mes-jan');
    await p.click('.rail [data-act=role][data-v=aluno]'); await shot(p, '20-aluno-inicio');
    await p.click('[data-act=alunoAtv][data-v=aquarela]'); await shot(p, '21-aluno-aquarela'); await p.click('[data-act=alunoAtv][data-v=eventos]'); await shot(p, '21b-eventos'); await p.click('[data-act=evento]'); await p.click('[data-act=alunoAtv][data-v=formacao]'); await shot(p, '21c-formacao-aluno'); await p.click('[data-act=alunoAtv][data-v=pratica]');
    await p.click('.rail [data-act=tab][data-v=plano]'); await shot(p, '22-aluno-plano');
    await p.click('[data-act=maisFin] >> nth=0'); await shot(p, '23-mais-fin', false);
    await p.click('#sheet [data-x=pausar]'); await p.click('#sheet [data-act=pausar]'); await p.waitForTimeout(300);
    await p.click('[data-act=pagar] >> nth=0'); await shot(p, '24-pagar-pix', false); await p.click('#sheet [data-act=fechar]');
    await p.click('.rail [data-act=tab][data-v=historico]'); await shot(p, '25-historico');
    await p.click('.rail [data-act=tab][data-v=aulas]'); await shot(p, '26-aulas');
    await p.click('.rail [data-act=tab][data-v=plano]'); await p.click('[data-act=consent][data-v=imagem]'); await shot(p, '27-meus-dados');
    await p.click('[data-act=maisFin] >> nth=0'); await p.click('#sheet [data-x=cancelar]'); await shot(p, '28-cancelar', false); await p.click('#sheet [data-act=cancelarPlano]'); await p.waitForTimeout(300);
    await p.click('[data-act=maisFin] >> nth=0'); await p.click('#sheet [data-x=metodo]'); await shot(p, '29-pix-automatico', false); await p.click('#sheet .opt[data-v=pixauto]'); await p.click('#sheet [data-act=salvarMetodo]');
    await p.click('.rail [data-act=role][data-v=admin]'); await p.click('.rail [data-act=tab][data-v=mensalidades]'); await p.click('[data-act=mensVis][data-v=fechamento]'); await p.click('[data-act=fechMes][data-v="2026-09"]'); await shot(p, '30-fechar-mes'); await p.click('[data-act=fecharMes]'); await shot(p, '31-mes-fechado');
    await p.click('.rail [data-act=tab][data-v=escola]'); await p.click('[data-act=escolaVis][data-v=alunos]'); await p.click('.li.tap[data-v=a09]'); await shot(p, '32-saudade', false);
    await overflow(p, 'desk');
  });

  for (const [scheme, tag] of [['light','m'],['dark','d']]){
    await run('mob-'+tag, {width:390, height:844}, scheme, async p => {
      await shot(p, `${tag}00-porta`);
      await p.click('[data-act=entrar][data-v=admin][data-who=vitor]'); await shot(p, `${tag}01-admin`); await overflow(p, tag+'admin');
      await p.click('.bnav [data-v=balanco]'); await shot(p, `${tag}02-balanco`); await overflow(p, tag+'bal');
      await p.click('.bnav [data-v=mensalidades]'); await p.click('[data-act=mensVis][data-v=fechamento]'); await shot(p, `${tag}03-fech`); await overflow(p, tag+'fech');
      await p.click('.bnav [data-v=lojinha]'); await p.waitForTimeout(800); await shot(p, `${tag}04-loja`); await overflow(p, tag+'loja');
      await p.click('.prod[data-v=p27]'); await p.waitForTimeout(800); await shot(p, `${tag}05-loja-cart`, false);
      await p.click('.rolebtn'); await p.click('#sheet [data-act=entrar][data-v=instrutor][data-who=kamala]'); await shot(p, `${tag}06-instr`); await overflow(p, tag+'instr');
      await p.click('.bnav [data-v=agenda]'); await shot(p, `${tag}07-agenda`); await overflow(p, tag+'agenda');
      await p.click('.rolebtn'); await p.click('#sheet [data-act=entrar][data-v=aluno][data-who=a01]'); await shot(p, `${tag}08-aluno`); await overflow(p, tag+'aluno');
      await p.click('.bnav [data-v=plano]'); await shot(p, `${tag}09-plano`);
      await p.click('.bnav [data-v=historico]'); await shot(p, `${tag}10-hist`); await overflow(p, tag+'hist');
      await p.click('.bnav [data-v=inicio]'); await p.click('[data-act=alunoAtv][data-v=formacao]'); await shot(p, `${tag}11-formacao`); await overflow(p, tag+'formacao');
      await p.click('.rolebtn'); await p.click('#sheet [data-act=entrar][data-v=admin][data-who=dessa]'); await p.click('.bnav [data-v=escola]'); await p.click('[data-act=escolaVis][data-v=formacao]'); await shot(p, `${tag}12-formacao-adm`); await overflow(p, tag+'formacao-adm');
    });
  }
  await b.close();
  console.log(erros.length ? 'ERROS:\n' + erros.join('\n') : 'sem erros');
})();
