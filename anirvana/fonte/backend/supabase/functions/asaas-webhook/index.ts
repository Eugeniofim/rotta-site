// Recebe os avisos do Asaas (pagamento confirmado, estornado) e põe o pagamento na fila "Para confirmar" da administração.
// Segurança:
//   - só aceita o token configurado no painel do Asaas (cabeçalho asaas-access-token)
//   - cada evento é aplicado UMA vez (tabela eventos_gateway, chave = id do evento)
//   - nunca recebe nem guarda número de cartão: o cartão fica no Asaas
// Variáveis (Supabase → Edge Functions → Secrets): ASAAS_WEBHOOK_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from 'jsr:@supabase/supabase-js@2';

const PAGO = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);
const ESTORNO = new Set(['PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED', 'PAYMENT_DELETED']);

function iguais(a: string, b: string): boolean {            // comparação em tempo constante
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('método não permitido', { status: 405 });

  const esperado = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? '';
  const recebido = req.headers.get('asaas-access-token') ?? '';
  if (!esperado || !iguais(recebido, esperado)) return new Response('não autorizado', { status: 401 });

  let ev: { id?: string; event?: string; payment?: { id?: string; billingType?: string; paymentDate?: string; clientPaymentDate?: string } };
  try { ev = await req.json(); } catch { return new Response('corpo inválido', { status: 400 }); }
  if (!ev.id || !ev.event || !ev.payment?.id) return new Response('evento incompleto', { status: 400 });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // idempotência: o Asaas reenvia avisos; o mesmo evento nunca é aplicado duas vezes
  const { error: jaVisto } = await db.from('eventos_gateway').insert({ id: ev.id, tipo: ev.event, payload: ev });
  if (jaVisto) {
    if (jaVisto.code === '23505') return new Response('ok (repetido)');
    console.error('eventos_gateway', jaVisto);
    return new Response('erro ao registrar', { status: 500 });          // o Asaas tenta de novo depois
  }

  const metodo = ev.payment.billingType === 'CREDIT_CARD' ? 'cartao' : ev.payment.billingType === 'PIX' ? 'pix' : null;
  const desfaz = async (onde: string, error: unknown) => {
    console.error(onde, error);
    await db.from('eventos_gateway').delete().eq('id', ev.id);            // deixa o reenvio tentar de novo
    return new Response('erro ao atualizar', { status: 500 });
  };

  if (PAGO.has(ev.event)) {
    // REGRA DO ESPAÇO: quem dá baixa é a administração. O banco só avisa que o dinheiro caiu;
    // o pagamento aparece em "Para confirmar" já marcado como "o banco confirmou", e a Dessa ou o Vitor dão baixa com um toque.
    // (Se um dia quiserem baixa automática, ligar configuracoes.baixa_automatica_banco = true.)
    const { data: cob } = await db.from('cobrancas').select('id, estado, matricula_id, matriculas(aluno_id)').eq('gateway_id', ev.payment.id).maybeSingle();
    if (!cob) return new Response('ok (cobrança não encontrada)');
    if (cob.estado !== 'aberta') return new Response('ok (já resolvida)');
    const { data: cfg } = await db.from('configuracoes').select('valor').eq('chave', 'baixa_automatica_banco').maybeSingle();
    if (cfg?.valor === true) {
      const quando = ev.payment.clientPaymentDate ?? ev.payment.paymentDate ?? new Date().toISOString();
      const { error } = await db.from('cobrancas').update({ estado: 'paga', pago_em: quando, ...(metodo ? { metodo } : {}) }).eq('id', cob.id);
      if (error) return desfaz('cobrancas', error);
    } else {
      // @ts-ignore: relação de um para um
      const aluno = cob.matriculas?.aluno_id;
      const { error } = await db.from('avisos_pagamento').upsert(
        { cobranca_id: cob.id, aluno_id: aluno, metodo: metodo ?? 'pix', origem: 'banco' },
        { onConflict: 'cobranca_id', ignoreDuplicates: true });
      if (error && error.code !== '23505') return desfaz('avisos_pagamento', error);
    }
  } else if (ESTORNO.has(ev.event)) {
    const { error } = await db.from('cobrancas').update({ estado: 'estornada' }).eq('gateway_id', ev.payment.id);
    if (error) return desfaz('cobrancas', error);
  }
  return new Response('ok');
});
