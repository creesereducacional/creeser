/**
 * Webhook Assinafy — recebe eventos de assinatura e atualiza status_contrato no aluno.
 *
 * Configurar na Assinafy: POST https://seudominio.com/api/webhooks/assinafy
 *
 * Segurança: validar ASSINAFY_WEBHOOK_SECRET se configurado.
 * Payload esperado: { event, data: { document: { id, status } } }
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapa de status Assinafy → status_contrato interno
const STATUS_MAP = {
  signed:              'ASSINADO',
  completed:           'ASSINADO',
  refused:             'RECUSADO',
  declined:            'RECUSADO',
  expired:             'EXPIRADO',
  pending_signature:   'ENVIADO_ASSINATURA',
  pending:             'ENVIADO_ASSINATURA',
  created:             'ENVIADO_ASSINATURA',
};

function asText(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  // Validação de segredo do webhook (opcional mas recomendado)
  const webhookSecret = process.env.ASSINAFY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const receivedSecret = req.headers['x-assinafy-secret'] || req.headers['x-webhook-secret'] || '';
    if (asText(receivedSecret) !== webhookSecret) {
      return res.status(401).json({ error: 'Segredo do webhook invalido' });
    }
  }

  try {
    const body       = req.body || {};
    const event      = asText(body.event).toLowerCase();
    const docData    = body.data?.document || body.document || {};
    const documentId = asText(docData.id || body.document_id);
    const rawStatus  = asText(docData.status || body.status).toLowerCase();

    if (!documentId) {
      return res.status(400).json({ error: 'document_id nao informado no payload' });
    }

    // Buscar registro de assinatura pelo provider_document_id
    const { data: assinaturas, error: findError } = await supabase
      .from('contratos_assinaturas')
      .select('id, aluno_id, status')
      .eq('provider_document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) return res.status(500).json({ error: findError.message });
    if (!assinaturas || assinaturas.length === 0) {
      // Documento desconhecido — aceitar sem erro para não reenviar
      return res.status(200).json({ received: true, warning: 'document_id nao encontrado nos registros' });
    }

    const assinatura = assinaturas[0];
    const novoStatus = STATUS_MAP[rawStatus] || null;

    // Atualizar contratos_assinaturas
    await supabase.from('contratos_assinaturas').update({
      status:          rawStatus || assinatura.status,
      last_synced_at:  new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    }).eq('id', assinatura.id);

    // Atualizar aluno.status_contrato e data_assinatura_contrato se aplicável
    if (novoStatus && assinatura.aluno_id) {
      const patch = { status_contrato: novoStatus };
      if (novoStatus === 'ASSINADO') {
        patch.data_assinatura_contrato = new Date().toISOString();
      }

      await supabase.from('alunos')
        .update(patch)
        .eq('id', assinatura.aluno_id);
    }

    return res.status(200).json({
      received:          true,
      event,
      documentId,
      novoStatusContrato: novoStatus || 'sem_mapeamento',
      alunoId:           assinatura.aluno_id,
    });
  } catch (err) {
    console.error('Erro no webhook Assinafy:', err);
    return res.status(500).json({ error: err.message });
  }
}
