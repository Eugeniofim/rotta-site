// Confere os pedidos da Dessa (v8): entrada sem nomes, inscrição, aluno, instrutor, administração.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const APP = 'file:///home/user/anirvana-app/dist/anirvana/index.html';
const OUT = path.join(__dirname, 'shots-v8'); fs.rmSync(OUT, {recursive:true, force:true}); fs.mkdirSync(OUT);
const ok = [], falhas = [], erros = [];
const conf = (c, m) => (c ? ok : falhas).push(m);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:390, height:844}, deviceScaleFactor:1});
  const p = await ctx.newPage();
  p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(APP); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(300);
  const shot = n => p.screenshot({path:path.join(OUT, n + '.png'), fullPage:false});
  const clicar = async sel => { await p.click(sel); await p.waitForTimeout(250); };

  // ---------- porta ----------
  const porta = await p.textContent('.doors');
  conf(!/Kamala|Ana Julia|Dessa|Vitor|Andressa|Luana/.test(porta), 'porta sem nomes de ninguém');
  conf(await p.$('#loginCel') && await p.$('#loginPin') && await p.$('[data-act=adminGoogle]'), 'porta: celular, PIN e Google');
  await shot('01-porta');
  // aluno pelo celular
  const tel = await p.evaluate(() => alunoPor(S,'a01').tel);
  await p.fill('#loginCel', tel); await clicar('[data-login=aluno] button[type=submit]');
  const otp = await p.evaluate(() => UI.otp && UI.otp.c);
  conf(!!otp && await p.$('#otpIn'), 'aluno: pede o código do WhatsApp');
  await shot('02-otp');
  await p.fill('#otpIn', '000000'); await clicar('[data-login=otp] button[type=submit]');
  conf(/não confere/.test(await p.textContent('#sheet')), 'código errado avisa');
  await p.fill('#otpIn', otp); await clicar('[data-login=otp] button[type=submit]');
  conf(await p.evaluate(() => UI.role === 'aluno' && UI.who.aluno === 'a01'), 'código certo entra como a aluna do celular');
  // painel do aluno
  const ini = await p.textContent('#root');
  conf(!/pontos/i.test(await p.evaluate(() => document.querySelector('main, #root').innerText.split('Espaço Anirvana')[0])), 'início do aluno sem pontos');
  conf(await p.$('[data-act=alunoAtv][data-v=terapias]') && !(await p.$('[data-act=alunoAtv][data-v=movimento]')), 'aba Terapias; Movimento junto do Yoga');
  conf(/Finados/.test(ini), 'aluno vê o feriado de Finados (sem aula)');
  await clicar('[data-act=alunoAtv][data-v=terapias]');
  conf(/Terapias integrais/.test(await p.textContent('#root')) && await p.$('#root a[href*="wa.me/5541998487892"]'), 'Terapias com botão do WhatsApp');
  await shot('03-terapias');
  await clicar('[data-act=alunoAtv][data-v=yoga]');
  const yoga = await p.textContent('#root');
  conf(/Movimento consciente/.test(yoga) && !/Kamala|Ana Julia/.test(yoga) && !/Wellhub/.test(yoga), 'aba Yoga: Movimento, sem nomes, sem Wellhub na tabela');
  // pagar no cartão
  await p.evaluate(() => ir('aluno','plano')); await p.waitForTimeout(200);
  await p.evaluate(() => { const m = alunoPor(S, UI.who.aluno).mats[0]; folhaPagar(m.id, 'cartao'); }); await p.waitForTimeout(200);
  const pag = await p.textContent('#sheet');
  conf(/R\$ 160,00 \+ R\$ 12,00 = R\$ 172,00/.test(pag), 'cartão mostra 160 + 12 = 172');
  await shot('04-cartao');
  await clicar('[data-act=confirmarPag][data-x=cartao]');
  conf(await p.$('#sheet a[href*="wa.me/5541998487892"]') && /comprovante/.test(await p.textContent('#sheet')), 'depois de pagar: mandar o comprovante pelo WhatsApp');
  conf(await p.evaluate(() => S.avisosPag.some(x => x.a === 'a01' && x.valor === 172 && x.metodo === 'cartao')), 'aviso de pagamento com o acréscimo');
  await shot('05-comprovante');
  await p.evaluate(() => { fecharFolha(); const m = alunoPor(S, UI.who.aluno).mats[0]; folhaPagar(m.id, 'pix'); }); await p.waitForTimeout(150);
  const pix = await p.inputValue('#pixCod');
  conf(/^000201.*6304[0-9A-F]{4}$/.test(pix) && pix.includes('5406160.00'), 'Pix copia e cola no padrão do Banco Central (com CRC)');
  // Wellhub
  const st = await p.evaluate(() => { const a = alunoPor(S,'a34'); return statusPagamento(S, a, a.mats[0]); });
  conf(st.st === 'plataforma' && /Wellhub/.test(st.txt), 'aluno Wellhub não paga mensalidade: ' + st.txt);
  // ---------- inscrição ----------
  await p.evaluate(() => { fecharFolha(); ACT.sair(); }); await p.waitForTimeout(200);
  await clicar('[data-act=inscricao]');
  const p0 = await p.textContent('#sheet');
  conf(!/Kamala|Ana Julia|Sara|Bruno|Stefy/.test(p0), 'inscrição sem nomes de instrutores');
  conf(/Yoga e Movimento Consciente/.test(p0) && /Yoga particular · presencial e online/.test(p0) && /gestantes e pós-parto/.test(p0) && /Prática de meditação/.test(p0), 'nomes das atividades como a Dessa pediu');
  conf(!(await p.$('.atv-card[data-v=movimento]')), 'Movimento não é uma atividade separada');
  await shot('06-insc-atividades');
  await clicar('.atv-card[data-v=particular]');
  const part = await p.textContent('#sheet');
  conf(/R\$ 245,00/.test(part) && /R\$ 385,00/.test(part) && /R\$ 515,00/.test(part) && /R\$ 650,00/.test(part) && /R\$ 80,00/.test(part) && /Online/.test(part), 'particular: 245/385/515/650/80 e online');
  await shot('07-insc-particular');
  await clicar('.atv-card[data-v=yoga]');
  const yo = await p.textContent('#sheet');
  conf(/Movimento consciente/.test(yo) && /Sexta 09:00/.test(yo), 'yoga mostra Movimento consciente sexta 9h');
  await clicar('.atv-card[data-v=aquarela]');
  conf(!(await p.$('#iTur')) && /combina com o professor/.test(await p.textContent('#sheet')), 'aquarela sem horário');
  await clicar('[data-act=inscPasso][data-v="1"]');
  const a1 = await p.textContent('#sheet');
  conf(/Informações do aluno/i.test(a1) && /menor de idade/.test(a1), 'aquarela começa pelo aluno e pergunta se é menor');
  await p.fill('#f_nome', 'Joana Adulta'); await p.fill('#f_nasc', '1990-05-05'); await p.dispatchEvent('#f_nasc', 'input');
  await p.fill('#f_endereco', 'Rua A, 1'); await p.fill('#f_tel', '(41) 99999-1111'); await p.fill('#f_saude', 'Não');
  await clicar('[data-grp=f_restricao][data-v=Nenhuma]');
  conf(await p.inputValue('#f_menor') === 'nao', 'data de nascimento já marca "maior de idade"');
  await clicar('[data-act=inscPasso][data-v="1"]');
  conf(await p.evaluate(() => UI.insc.passo) === 3, 'maior de idade pula o passo do responsável');
  await clicar('[data-act=inscPasso][data-v="-1"]');
  conf(await p.evaluate(() => UI.insc.passo) === 1, 'voltar também pula');
  await clicar('[data-grp=f_menor][data-v=sim]');
  await clicar('[data-act=inscPasso][data-v="1"]');
  conf(await p.evaluate(() => UI.insc.passo) === 2 && /responsável/i.test(await p.textContent('#sheet')), 'menor de idade vai para o responsável');
  await shot('08-insc-responsavel');
  await p.evaluate(() => fecharFolha());
  // termos sem texto provisório
  await clicar('[data-act=inscricao]'); await clicar('.atv-card[data-v=yoga]');
  await p.evaluate(() => { UI.insc.passo = 3; folhaInscricao(); }); await p.waitForTimeout(150);
  conf(!(await p.$('[data-act=verTermos]')) && /que me foram enviados/.test(await p.textContent('#sheet')), 'termos iguais ao Forms, sem texto provisório');
  await p.evaluate(() => fecharFolha());
  // ---------- instrutor pelo PIN ----------
  const pin = await p.evaluate(() => S.codigos.sara.c);
  await p.fill('#loginPin', '111111'); await clicar('[data-login=instrutor] button[type=submit]');
  conf(/não confere/.test(await p.textContent('#pinMsg')), 'PIN errado avisa');
  await p.fill('#loginPin', pin); await clicar('[data-login=instrutor] button[type=submit]');
  conf(await p.evaluate(() => UI.role === 'instrutor' && UI.who.instrutor === 'sara'), 'PIN da Sara entra como Sara');
  conf(await p.evaluate(() => new Set(Object.values(S.codigos).map(c => c.c)).size === Object.keys(S.codigos).length), 'nenhum PIN repetido');
  // chamada com visitante com nome
  await p.evaluate(() => { CHAMADA = null; folhaChamada('2026-10-29_qui1900'); }); await p.waitForTimeout(200);
  conf(await p.$('#visNome') && /Wellhub/.test(await p.textContent('#sheet')), 'chamada: visitante com nome e Wellhub/GoGood');
  await p.fill('#visNome', 'Joana Lima'); await clicar('[data-grp=visTipo][data-v=wellhub]'); await clicar('[data-act=visitAdd]');
  conf(/Joana Lima/.test(await p.textContent('#sheet')), 'visitante aparece na lista');
  await shot('09-chamada');
  await clicar('[data-act=salvarChamada]:not([data-v])');
  conf(await p.evaluate(() => S.presencas.some(x => x.s === '2026-10-29_qui1900' && x.nome === 'Joana Lima' && x.t === 'wellhub')), 'visitante salvo com nome e tipo');
  await p.evaluate(() => { const sid = '2026-11-05_qui1900'; folhaChamada(sid); }); await p.waitForTimeout(150);
  conf(await p.$('.vazia-btn'), 'botão "ninguém veio · aula vazia" à vista');
  await p.evaluate(() => fecharFolha());
  // quadro do valor para quem dá aquarela
  await p.evaluate(() => { UI.who.instrutor = 'bruno'; UI.codigoOk.bruno = S.codigos.bruno.v; ir('instrutor','mes'); }); await p.waitForTimeout(200);
  const q = await p.evaluate(() => [...document.querySelectorAll('.card')].find(c => /Como o valor é calculado/.test(c.textContent)).querySelectorAll('li').length);
  conf(q === 1, 'Bruno (aquarela): quadro só com o ponto 1');
  // ---------- administração: Google + PIN ----------
  await p.evaluate(() => ACT.sair()); await p.waitForTimeout(150);
  await clicar('[data-act=adminGoogle]'); await clicar('[data-act=adminConta][data-v=saraadm]');
  await p.fill('#pinAdm', '1470'); await clicar('[data-login=admin] button[type=submit]');
  conf(await p.evaluate(() => UI.role === 'admin' && UI.who.admin === 'saraadm'), 'Sara entra na administração com Google + PIN');
  await p.evaluate(() => { UI.mensVis = 'regras'; ir('admin','mensalidades'); }); await p.waitForTimeout(200);
  const rg = await p.textContent('#root');
  conf(/Yoga particular/.test(rg) && /Wellhub \(por aula\)/.test(rg) && /GoGood \(por aula\)/.test(rg) && /Link do cartão/.test(rg), 'Regras: particular, Wellhub 25,50, GoGood 27,00, link do cartão');
  conf(await p.evaluate(() => S.regras.planos.wellhub === 25.5 && S.regras.planos.gogood === 27), 'valores Wellhub e GoGood');
  conf(/todo dia 15 sai o backup do mês anterior/.test(rg) && /15\/11/.test(rg), 'backup todo dia 15 (próximo 15/11)');
  await clicar('[data-act=driveConectar]'); await clicar('[data-act=driveOk]');
  conf(/Google Drive conectado/.test(await p.textContent('#root')), 'Google Drive conectado');
  await clicar('[data-act=driveEnviar]');
  conf(await p.evaluate(() => !!S.config.drive.ultimo && S.backups.some(x => x.drive)), 'enviar agora para o Drive');
  await shot('10-backup-drive');
  await p.evaluate(() => { UI.mensVis = 'alunos'; UI.mensSt = 'plataforma'; ir('admin','mensalidades'); }); await p.waitForTimeout(200);
  conf(/Tiago Melo/.test(await p.textContent('#root')) && /Wellhub e GoGood/.test(await p.textContent('#root')), 'Mensalidades: filtro Wellhub e GoGood');
  // feriados
  await p.evaluate(() => { UI.escolaVis = 'horarios'; ir('admin','escola'); }); await p.waitForTimeout(200);
  conf(/Finados/.test(await p.textContent('#root')) && /Consciência Negra/.test(await p.textContent('#root')), 'Escola → Horários: feriados');
  await clicar('[data-act=feriadoToggle][data-v="2026-11-20"]');
  conf(await p.evaluate(() => semAula('2026-11-20') === null), 'marcar "tem aula" no feriado');
  await clicar('[data-act=feriadoNovo]'); await p.fill('#frD', '2026-12-21'); await p.fill('#frNome', 'Recesso'); await clicar('#fFeriado button[type=submit]');
  conf(await p.evaluate(() => semAula('2026-12-21')?.nome === 'Recesso'), 'dia sem aula criado pela administração');
  await shot('11-feriados');
  // avisos editáveis
  await p.evaluate(() => { UI.div.vis = 'avisos'; ir('admin','divulgar'); }); await p.waitForTimeout(200);
  await clicar('[data-act=editarAviso][data-v=vence]');
  await p.fill('#aq_d', '5'); await p.selectOption('#aq_hora', '10'); await clicar('#fAviso button[type=submit]');
  conf(await p.evaluate(() => regraAviso('vence').quando === '5 dias antes do vencimento, às 10h'), 'aviso de vencimento: 5 dias antes, às 10h');
  conf(/Feriado: sem aula/.test(await p.textContent('#root')), 'aviso automático de feriado');
  await shot('12-avisos');
  // pontos desligados
  await p.evaluate(() => { UI.div.vis = 'pontos'; reRender(); }); await p.waitForTimeout(150);
  conf(/Pontos desligados por enquanto/.test(await p.textContent('#root')), 'Divulgar → Pontos desligado');
  // terapias e atividade com ficha de arte
  await p.evaluate(() => ir('admin','atividades')); await p.waitForTimeout(150);
  conf(/Terapias com hora marcada/.test(await p.textContent('#root')), 'Cursos: terapias editáveis');
  await p.evaluate(() => folhaTerapia('tp2')); await p.waitForTimeout(150);
  await p.fill('#tpQuem', 'Fulana'); await clicar('#fTerapia button[type=submit]');
  conf(await p.evaluate(() => S.terapias.find(t => t.id === 'tp2').quem === 'Fulana'), 'terapeuta da massagem salva');
  // equipe: admin
  await p.evaluate(() => { UI.escolaVis = 'equipe'; ir('admin','escola'); }); await p.waitForTimeout(150);
  conf(/dois logins/.test(await p.textContent('#root')) && /Andressa/.test(await p.textContent('#root')), 'Equipe mostra os dois logins (Andressa e Sara)');
  // backup em Excel continua gerando
  const kb = await p.evaluate(() => montarBackup(S, {quem:'teste'}).length);
  conf(kb > 20000, 'backup .xlsx gerado: ' + Math.round(kb/1024) + ' KB');
  // inscrição completa de violão menor e confirmação
  const r = await p.evaluate(() => { S.inscricoes.push({id:'inT', d:HOJE_ISO, estado:'nova', origem:'app', dados:{atv:'particular', plano:'3x', modo:'online', nome:'Teste Part', nasc:'1980-01-01', tel:'(41) 99000-0000', cpf:'529.982.247-25', termos:true, imagem:'sim', priv:true}}); const x = confirmarInscricao('inT'); const m = alunoPor(S, x.aid).mats[0]; return {v:valorMat(S, m), on:m.online, n:nomePlano(m)}; });
  conf(r.v === 515 && r.on === true, 'confirmar particular 3x online: R$ 515 · ' + r.n);
  console.log('OK', ok.length); console.log('FALHAS', JSON.stringify(falhas, null, 1)); console.log('ERROS', JSON.stringify(erros));
  await b.close();
})();
