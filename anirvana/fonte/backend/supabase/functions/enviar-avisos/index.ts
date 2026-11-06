// Avisos automáticos do Espaço Anirvana: push no celular, WhatsApp e e-mail.
// Roda a cada 5 minutos (pg_cron, ver banco.sql seção 9). Duas etapas:
//   1) ENFILEIRAR: olha o banco e põe na fila o que precisa sair agora (lembrete de aula, vencimento,
//      atraso, saudade, véspera de evento). A fila tem chave única: o mesmo aviso nunca sai duas vezes.
//   2) ENVIAR: manda o que está na fila pelo canal certo e marca como enviado (ou guarda o erro).
// LGPD: a própria fila recusa WhatsApp/e-mail de quem não aceitou (gatilho fila_respeita_consentimento).
// Segredos (Supabase → Edge Functions → Secrets): CRON_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   RESEND_API_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, VAPID_PUBLIC, VAPID_PRIVATE, EMAIL_REMETENTE
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const tz = 'America/Sao_Paulo';
const hojeBR = () => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());   // AAAA-MM-DD
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const preencher = (modelo: string, dados: Record<string, string>) => modelo.replace(/\{(\w+)\}/g, (_, k) => dados[k] ?? '');
const primeiro = (nome: string) => (nome || '').split(' ')[0];

Deno.serve(async (req: Request) => {
  if ((req.headers.get('Authorization') ?? '') !== `Bearer ${Deno.env.get('CRON_TOKEN')}`) return new Response('não autorizado', { status: 401 });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: regras } = await db.from('regras_aviso').select('*').eq('ativo', true);
  const R = Object.fromEntries((regras ?? []).map(r => [r.id, r]));
  const hoje = hojeBR(), fila: Record<string, unknown>[] = [];
  const poe = (regra: string, aluno_id: string, dados: Record<string, string>, chave: string, agendado_para?: string) => {
    if (!R[regra]) return;
    for (const canal of R[regra].canais) fila.push({ regra, aluno_id, canal, mensagem: preencher(R[regra].modelo, dados), chave, ...(agendado_para ? { agendado_para } : {}) });
  };

  // ---------- 1) enfileirar ----------
  const { data: mats } = await db.from('matriculas').select('id, aluno_id, atividade, valor, turmas, vencimento_dia, estado, alunos(nome), atividades(nome)').eq('estado', 'ativa');
  const { data: turmas } = await db.from('turmas').select('id, dia, hora').eq('ativa', true);
  const T = Object.fromEntries((turmas ?? []).map(t => [t.id, t]));
  const agora = new Date(), diaSemana = new Date(`${hoje}T12:00:00-03:00`).getDay();
  for (const m of mats ?? []) {
    // @ts-ignore relações
    const nome = primeiro(m.alunos?.nome), atividade = (m.atividades?.nome ?? '').toLowerCase();
    // lembrete 2 horas antes da aula de hoje
    for (const tid of m.turmas ?? []) {
      const t = T[tid]; if (!t || t.dia !== diaSemana) continue;
      const inicio = new Date(`${hoje}T${t.hora}-03:00`), envio = new Date(inicio.getTime() - 2 * 3600e3);
      if (envio > agora && envio.getTime() - agora.getTime() < 6 * 3600e3) poe('lembrete', m.aluno_id, { nome, atividade, hora: t.hora.slice(0, 5) }, `${hoje}-${tid}`, envio.toISOString());
    }
    // vence em 3 dias / venceu ontem
    const venc = (offset: number) => { const d = new Date(`${hoje}T12:00:00-03:00`); d.setDate(d.getDate() + offset); return d; };
    const em3 = venc(3), ontem = venc(-1);
    if (em3.getDate() === m.vencimento_dia) poe('vence', m.aluno_id, { nome, atividade, valor: brl(+m.valor), vencimento: em3.toLocaleDateString('pt-BR', { timeZone: tz }) }, `${em3.toISOString().slice(0, 7)}-${m.id}`, `${hoje}T12:00:00Z`);
    if (ontem.getDate() === m.vencimento_dia) {
      const comp = ontem.toISOString().slice(0, 7);
      const { data: c } = await db.from('cobrancas').select('estado').eq('matricula_id', m.id).eq('competencia', comp).maybeSingle();
      const { count: avisou } = await db.from('avisos_pagamento').select('id', { count: 'exact', head: true }).eq('estado', 'aguardando').eq('aluno_id', m.aluno_id);
      if (c?.estado === 'aberta' && !avisou) poe('atraso', m.aluno_id, { nome, mes: ontem.toLocaleDateString('pt-BR', { month: 'long', timeZone: tz }) }, `${comp}-${m.id}`, `${hoje}T12:00:00Z`);
    }
  }
  // véspera de evento, às 18h, para quem se inscreveu
  const amanha = new Date(`${hoje}T12:00:00-03:00`); amanha.setDate(amanha.getDate() + 1);
  const { data: evs } = await db.from('eventos_espaco').select('id, nome, hora, inscricoes_evento(aluno_id, alunos(nome))').eq('data', amanha.toISOString().slice(0, 10)).eq('apagado', false);
  for (const e of evs ?? []) for (const i of e.inscricoes_evento ?? []) {
    // @ts-ignore relações
    poe('evento', i.aluno_id, { nome: primeiro(i.alunos?.nome), evento: e.nome, hora: e.hora.slice(0, 5) }, e.id, `${hoje}T21:00:00Z`);
  }
  if (fila.length) {
    const { error } = await db.from('fila_avisos').upsert(fila, { onConflict: 'regra,aluno_id,canal,chave', ignoreDuplicates: true });
    if (error) console.error('enfileirar', error);
  }

  // ---------- 2) enviar ----------
  const { data: pendentes } = await db.from('fila_avisos').select('*, alunos(nome, telefone, email)').is('enviado_em', null).is('erro', null).lte('agendado_para', new Date().toISOString()).limit(100);
  webpush.setVapidDetails('mailto:' + (Deno.env.get('EMAIL_REMETENTE') ?? 'espacoanirvana@gmail.com'), Deno.env.get('VAPID_PUBLIC')!, Deno.env.get('VAPID_PRIVATE')!);
  const { data: cfg } = await db.from('configuracoes').select('valor').eq('chave', 'backup_email').maybeSingle();
  let enviados = 0;
  for (const a of pendentes ?? []) {
    let erro: string | null = null;
    try {
      if (a.canal === 'push') {
        const filtro = a.para_admin ? db.from('push_inscricoes').select('*, perfis!inner(papel)').eq('perfis.papel', 'admin') : db.from('push_inscricoes').select('*').eq('aluno_id', a.aluno_id);
        const { data: subs } = await filtro;
        for (const s of subs ?? []) {
          try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ titulo: 'Espaço Anirvana', texto: a.mensagem, url: './' })); }
          catch (e) { if ((e as { statusCode?: number }).statusCode === 410) await db.from('push_inscricoes').delete().eq('id', s.id); }   // celular desinstalou
        }
      } else if (a.canal === 'whatsapp') {
        // WhatsApp oficial (Cloud API da Meta): mensagem iniciada pela empresa só com modelo aprovado.
        const tel = '55' + String(a.alunos?.telefone ?? '').replace(/\D/g, '').replace(/^55/, '');
        const r = await fetch(`https://graph.facebook.com/v21.0/${Deno.env.get('WHATSAPP_PHONE_ID')}/messages`, {
          method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('WHATSAPP_TOKEN')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', to: tel, type: 'template', template: { name: `anirvana_${a.regra}`, language: { code: 'pt_BR' }, components: [{ type: 'body', parameters: [{ type: 'text', text: a.mensagem }] }] } }) });
        if (!r.ok) erro = `whatsapp ${r.status}: ${(await r.text()).slice(0, 200)}`;
      } else if (a.canal === 'email') {
        const para = a.para_admin ? (cfg?.valor ?? 'espacoanirvana@gmail.com') : a.alunos?.email;
        if (para) {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: `Espaço Anirvana <${Deno.env.get('EMAIL_REMETENTE')}>`, to: [para], subject: R[a.regra]?.nome ?? 'Espaço Anirvana',
              text: `${a.mensagem}\n\n—\nEspaço Anirvana · Rua Erva Cidreira, 48 · Pontal do Sul\nNão quer mais receber? Responda este e-mail com "sair".` }) });
          if (!r.ok) erro = `email ${r.status}: ${(await r.text()).slice(0, 200)}`;
        }
      }
    } catch (e) { erro = String(e).slice(0, 300); }
    await db.from('fila_avisos').update(erro ? { erro } : { enviado_em: new Date().toISOString() }).eq('id', a.id);
    if (!erro) enviados++;
  }
  return Response.json({ enfileirados: fila.length, enviados });
});
