// BACKUP MENSAL EM EXCEL — regra do app: todo dia 1º, às 3h, e de novo quando um mês é fechado.
// Gera o .xlsx no mesmo formato das planilhas do Espaço (Controle financeiro com uma aba por mês + ANO,
// Mensalidades com o fechamento da yoga, Lojinha), mais alunos e fichas, presenças, equipe, eventos e pontos.
// Guarda no Storage (bucket privado "backups", só a administração lê) e manda para o e-mail do Espaço.
// O arquivo é montado pelo MESMO código do app (_compartilhado/motor.js, gerado pelo build.py).
// Segredos: CRON_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_REMETENTE
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';
import { criarMotor } from '../_compartilhado/motor.js';

const mesDe = (d: string) => d.slice(0, 7);
const anterior = (hoje: Date) => { const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 1)); return d.toISOString().slice(0, 7); };

Deno.serve(async (req: Request) => {
  if ((req.headers.get('Authorization') ?? '') !== `Bearer ${Deno.env.get('CRON_TOKEN')}`) return new Response('não autorizado', { status: 401 });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const corpo = await req.json().catch(() => ({}));
  const competencia: string = corpo.competencia ?? anterior(new Date());             // dia 1º: o mês que acabou
  const tudo = async (t: string, sel = '*') => { const { data, error } = await db.from(t).select(sel); if (error) throw new Error(`${t}: ${error.message}`); return data ?? []; };

  // ---------- o banco no formato que as regras do app entendem ----------
  const [equipe, turmas, fornecedores, alunos, mats, aulas, presencas, cobrancas, vendas, itens, repForn, fiado, lanc, repEq, fichas, saude, consent, eventos, inscEv, inscricoes, acoes, trocas, planos, atividades, privado] = await Promise.all(
    ['equipe', 'turmas', 'fornecedores', 'alunos', 'matriculas', 'aulas', 'presencas', 'cobrancas', 'vendas', 'venda_itens', 'repasses_fornecedor', 'fiado', 'lancamentos', 'repasses_equipe',
     'fichas', 'fichas_saude', 'consentimentos', 'eventos_espaco', 'inscricoes_evento', 'inscricoes', 'pontos_acoes', 'trocas_pontos', 'planos', 'atividades', 'alunos_privado'].map(t => tudo(t)));
  const [ano, mes] = competencia.split('-').map(Number), fimMes = new Date(Date.UTC(ano, mes, 0, 15));
  const M = criarMotor({
    HOJE: fimMes, MES_ATUAL: competencia,
    EQUIPE: equipe.map((p: any) => ({ id: p.id, nome: p.nome, atvs: p.atividades, cor: '#0E7266', pix: '' })),
    TURMAS: turmas.map((t: any) => ({ id: t.id, atv: t.atividade, dia: t.dia, h: String(t.hora).slice(0, 5), instr: t.instrutor_id, sala: t.sala ?? '' })),
    FORNECEDORES: fornecedores.map((f: any) => ({ id: f.id, nome: f.nome, curto: f.nome.split(' ')[0], modelo: f.modelo, pct: +f.pct_fornecedor })),
  });
  const plano = (id: string | null) => id ? id.replace(/^yoga-/, '') : null;
  const ativos = new Set(consent.filter((c: any) => !c.revogado_em).map((c: any) => `${c.aluno_id}:${c.tipo}`));
  const S: any = {
    v: 'servidor', regras: { ...M.REGRAS_PADRAO, planos: Object.fromEntries(planos.map((p: any) => [plano(p.id), +p.preco])), pct: Object.fromEntries(atividades.map((a: any) => [a.id, +a.repasse])) },
    alunos: alunos.filter((a: any) => !a.apagado).map((a: any) => {
      const f: any = fichas.find((x: any) => x.aluno_id === a.id) ?? {}, s: any = saude.find((x: any) => x.aluno_id === a.id);
      return { id: a.id, nome: a.nome, desde: a.desde, obs: a.observacoes ?? '', tel: a.telefone ?? '', email: a.email ?? '', nasc: a.nascimento ?? '', resp: a.responsavel_nome ?? '', respTel: a.responsavel_telefone ?? '',
        cpf: privado.find((x: any) => x.aluno_id === a.id)?.cpf ?? '',
        ficha: { form: f.formulario ?? 'yoga', respostas: { ...(f.respostas ?? {}), ...(s?.respostas ?? {}), endereco: privado.find((x: any) => x.aluno_id === a.id)?.endereco ?? undefined }, saudeOk: !!s?.mostrar_para_instrutores, completa: !!f.completa },
        mats: mats.filter((m: any) => m.aluno_id === a.id).map((m: any) => ({ id: m.id, atv: m.atividade, plano: plano(m.plano_id), valor: m.plano_id ? null : +m.valor, turmas: m.turmas, venc: m.vencimento_dia, metodo: m.metodo, instr: m.instrutor_id, status: { ativa: 'ativo', pausada: 'pausado', cancelada: 'cancelado' }[m.estado as string], inicio: m.inicio, fim: m.fim })) };
    }),
    aulas: Object.fromEntries(aulas.map((au: any) => [au.id, { id: au.id, d: au.data, turma: au.turma_id, instr: au.instrutor_id, sub: au.instrutor_id !== turmas.find((t: any) => t.id === au.turma_id)?.instrutor_id, feita: au.estado === 'feita', vazia: !presencas.some((p: any) => p.aula_id === au.id) }])),
    presencas: presencas.map((p: any) => ({ s: p.aula_id, a: p.aluno_id, t: p.tipo_plano })),
    pagamentos: cobrancas.filter((c: any) => c.estado === 'paga').map((c: any) => ({ id: c.id, a: mats.find((m: any) => m.id === c.matricula_id)?.aluno_id, mat: c.matricula_id, mes: c.competencia, valor: +c.valor, d: String(c.pago_em).slice(0, 10), metodo: c.metodo })),
    sessoes: [],
    vendas: itens.map((i: any) => { const v: any = vendas.find((x: any) => x.id === i.venda_id); return { id: i.id, d: String(v?.data ?? v?.criada_em).slice(0, 10), desc: `${i.qtd} ${i.descricao}`, valor: +i.qtd * +i.preco_unit, forma: v?.forma, forn: i.fornecedor_id, evento: v?.evento ?? '' }; }),
    repLoja: repForn.map((r: any) => ({ forn: r.fornecedor_id, valor: +r.valor, d: String(r.data ?? r.pago_em).slice(0, 10) })),
    fiado: fiado.map((f: any) => ({ id: f.id, cliente: f.cliente, desc: f.descricao, valor: +f.valor, d: String(f.data ?? f.criado_em).slice(0, 10), pago: !!f.pago_em, pagoEm: f.pago_em })),
    lanc: lanc.filter((l: any) => !l.apagado).map((l: any) => ({ id: l.id, tipo: l.tipo, d: l.data, valor: +l.valor, desc: l.descricao, cat: l.categoria })),
    repEquipe: repEq.filter((r: any) => r.pago_em).map((r: any) => ({ p: r.equipe_id, mes: r.competencia, d: String(r.pago_em).slice(0, 10) })),
    consent: Object.fromEntries(alunos.map((a: any) => [a.id, { whatsapp: ativos.has(`${a.id}:whatsapp`), imagem: ativos.has(`${a.id}:imagem`) }])),
    eventos: eventos.filter((e: any) => !e.apagado).map((e: any) => ({ id: e.id, nome: e.nome, data: e.data, h: String(e.hora).slice(0, 5), valor: +e.valor, vagas: e.vagas, inscritos: inscEv.filter((i: any) => i.evento_id === e.id).map((i: any) => ({ a: i.aluno_id, d: String(i.criada_em).slice(0, 10), pago: !!i.pago_em })) })),
    inscricoes: inscricoes.map((i: any) => ({ d: String(i.criada_em).slice(0, 10), estado: i.estado === 'nova' ? 'nova' : 'confirmada', origem: i.origem, dados: i.dados })),
    pontosAcoes: acoes.reduce((o: any, x: any) => ((o[x.aluno_id] = o[x.aluno_id] || {})[x.tipo] = String(x.criado_em).slice(0, 10), o), {}),
    trocas: trocas.map((t: any) => ({ a: t.aluno_id, premio: t.premio_id, custo: t.custo, d: String(t.criada_em).slice(0, 10), estado: t.estado })),
  };

  // ---------- gerar, guardar e mandar ----------
  const bytes: Uint8Array = M.montarBackup(S, { ate: competencia, quem: 'automático (dia 1º)', quando: new Date() });
  const nome = M.nomeBackup(competencia), caminho = `${competencia.slice(0, 4)}/${nome}`;
  const up = await db.storage.from('backups').upload(caminho, bytes, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', upsert: true });
  if (up.error) return new Response('erro ao guardar: ' + up.error.message, { status: 500 });
  const { data: cfg } = await db.from('configuracoes').select('valor').eq('chave', 'backup_email').maybeSingle();
  const para = (cfg?.valor as string) ?? 'espacoanirvana@gmail.com';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `App Espaço Anirvana <${Deno.env.get('EMAIL_REMETENTE')}>`, to: [para], subject: `Backup do app em Excel · ${competencia}`,
      text: `Segue o backup do app em Excel, no formato das planilhas do Espaço.\nGuarde com cuidado: tem dados de saúde dos alunos.\n\nTambém fica guardado no app, em Mensalidades → Regras → Backup mensal.`,
      attachments: [{ filename: nome, content: encodeBase64(bytes) }] }) });
  await db.from('backups').insert({ competencia, arquivo: `backups/${caminho}`, bytes: bytes.length, enviado_para: r.ok ? para : null, motivo: corpo.motivo ?? 'mensal' });
  await db.from('fila_avisos').update({ enviado_em: new Date().toISOString() }).eq('regra', 'backup').is('enviado_em', null);
  return Response.json({ competencia, arquivo: caminho, bytes: bytes.length, email: r.ok });
});
