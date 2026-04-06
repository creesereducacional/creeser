import { supabase } from '../../_shared';

const ASSINAFY_BASE_URL = process.env.ASSINAFY_BASE_URL || 'https://api.assinafy.com.br/v1';

const asText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const onlyDigits = (value) => asText(value).replace(/\D/g, '');

const toE164Brazil = (value) => {
  const digits = onlyDigits(value);
  if (!digits) return '';

  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }

  if (digits.length >= 10) {
    return `+55${digits}`;
  }

  return '';
};

const parseId = (value) => {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('could not find the table')
  );
};

const normalizeStatus = (value, fallback = 'pending_signature') => {
  const status = asText(value).toLowerCase();
  return status || fallback;
};

const saveAssinaturaRecord = async (record) => {
  const payload = {
    ...record,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('contratos_assinaturas')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }

    throw error;
  }

  return data?.id || null;
};

const normalizeWhitespace = (value) => asText(value).replace(/\s+/g, ' ');

const htmlToPlainText = (html) => {
  const source = String(html || '');

  return source
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const toPdfSafeText = (value) => {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?');

  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
};

const wrapText = (text, maxCharsPerLine = 95) => {
  const lines = [];
  const paragraphs = String(text || '').split('\n');

  paragraphs.forEach((paragraph) => {
    const raw = paragraph.trim();

    if (!raw) {
      lines.push('');
      return;
    }

    const words = raw.split(/\s+/);
    let line = '';

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= maxCharsPerLine) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        if (word.length > maxCharsPerLine) {
          let remaining = word;
          while (remaining.length > maxCharsPerLine) {
            lines.push(remaining.slice(0, maxCharsPerLine));
            remaining = remaining.slice(maxCharsPerLine);
          }
          line = remaining;
        } else {
          line = word;
        }
      }
    });

    if (line) lines.push(line);
  });

  return lines;
};

const buildPdfFromText = (title, text) => {
  const allLines = [normalizeWhitespace(title || 'Contrato')]
    .concat([''])
    .concat(wrapText(text || ''));

  const pageWidth = 595;
  const pageHeight = 842;
  const marginLeft = 42;
  const marginTop = 800;
  const marginBottom = 48;
  const lineHeight = 14;
  const linesPerPage = Math.max(1, Math.floor((marginTop - marginBottom) / lineHeight));

  const pages = [];
  for (let i = 0; i < allLines.length; i += linesPerPage) {
    pages.push(allLines.slice(i, i + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push(['Contrato sem conteúdo.']);
  }

  const objects = {};
  let nextObjectId = 1;

  const catalogObjectId = nextObjectId++;
  const pagesObjectId = nextObjectId++;
  const fontObjectId = nextObjectId++;

  const pageObjectIds = [];

  pages.forEach((pageLines) => {
    const pageObjectId = nextObjectId++;
    const contentObjectId = nextObjectId++;
    pageObjectIds.push(pageObjectId);

    const streamLines = ['BT', '/F1 11 Tf', `${marginLeft} ${marginTop} Td`];

    pageLines.forEach((line, index) => {
      const safeLine = toPdfSafeText(line);
      if (index === 0) {
        streamLines.push(`(${safeLine}) Tj`);
      } else {
        streamLines.push(`0 -${lineHeight} Td (${safeLine}) Tj`);
      }
    });

    streamLines.push('ET');
    const stream = `${streamLines.join('\n')}\n`;

    objects[contentObjectId] = `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}endstream`;
    objects[pageObjectId] = `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
  });

  objects[fontObjectId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[pagesObjectId] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`;
  objects[catalogObjectId] = `<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`;

  const maxObjectId = nextObjectId - 1;
  let pdf = '%PDF-1.4\n';
  const offsets = new Array(maxObjectId + 1).fill(0);

  for (let objectId = 1; objectId <= maxObjectId; objectId += 1) {
    offsets[objectId] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${maxObjectId + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let objectId = 1; objectId <= maxObjectId; objectId += 1) {
    const padded = String(offsets[objectId]).padStart(10, '0');
    pdf += `${padded} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectId + 1} /Root ${catalogObjectId} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

const parseAssinafyPayload = (payload) => payload?.data || payload || {};

const callAssinafy = async (path, options = {}) => {
  const url = `${ASSINAFY_BASE_URL}${path}`;
  const response = await fetch(url, options);

  const raw = await response.text();
  let parsed = null;

  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message = parsed?.message || parsed?.error || raw || `Erro na API Assinafy (${response.status})`;
    throw new Error(message);
  }

  return parsed || {};
};

const findExistingSignerByEmail = async (accountId, apiKey, email) => {
  const normalized = asText(email).toLowerCase();
  if (!normalized) return null;

  const response = await callAssinafy(`/accounts/${accountId}/signers?search=${encodeURIComponent(normalized)}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey
    }
  });

  const data = parseAssinafyPayload(response);
  const list = Array.isArray(data) ? data : [];

  return list.find((item) => asText(item?.email).toLowerCase() === normalized) || null;
};

const ensureSigner = async (accountId, apiKey, signer) => {
  const email = asText(signer.email).toLowerCase();

  if (email) {
    const existing = await findExistingSignerByEmail(accountId, apiKey, email);
    if (existing?.id) {
      return existing;
    }
  }

  const body = {
    full_name: asText(signer.full_name)
  };

  if (email) body.email = email;

  const phone = toE164Brazil(signer.whatsapp_phone_number);
  if (phone) body.whatsapp_phone_number = phone;

  const response = await callAssinafy(`/accounts/${accountId}/signers`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return parseAssinafyPayload(response);
};

const getInternalBaseUrl = (req) => {
  const protocol = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = req.headers.host;
  return `${protocol}://${host}`;
};

const getResponsavelAluno = async (alunoId) => {
  const { data: relacoes, error: relError } = await supabase
    .from('responsavel_aluno')
    .select('responsavel_id')
    .eq('aluno_id', alunoId)
    .limit(1);

  if (relError) {
    const msg = String(relError?.message || '').toLowerCase();
    if (relError?.code === '42P01' || msg.includes('does not exist') || msg.includes('relation')) {
      return null;
    }

    throw relError;
  }

  const responsavelId = parseId(relacoes?.[0]?.responsavel_id);
  if (!responsavelId) return null;

  const { data: responsavel, error: respError } = await supabase
    .from('responsaveis')
    .select('id,nome,email,whatsapp,telefonecelular,cpf')
    .eq('id', responsavelId)
    .single();

  if (respError) {
    if (respError?.code === 'PGRST116') return null;
    throw respError;
  }

  return responsavel || null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.ASSINAFY_API_KEY;
  const accountId = process.env.ASSINAFY_ACCOUNT_ID;

  if (!apiKey || !accountId) {
    return res.status(400).json({
      error: 'Credenciais da Assinafy não configuradas. Defina ASSINAFY_API_KEY e ASSINAFY_ACCOUNT_ID no backend.'
    });
  }

  const assinaturaContext = {
    alunoId: null,
    instituicaoId: null,
    contratoId: null,
    providerDocumentId: null,
    providerAssignmentId: null,
    signers: [],
    signingUrls: [],
    providerPayload: {}
  };

  try {
    const alunoId = parseId(req.query?.id);
    if (!alunoId) {
      return res.status(400).json({ error: 'ID do aluno inválido' });
    }

    assinaturaContext.alunoId = alunoId;

    const baseUrl = getInternalBaseUrl(req);
    const contratoResponse = await fetch(`${baseUrl}/api/contratos/aluno/${alunoId}`);
    const contratoPayload = await contratoResponse.json().catch(() => ({}));

    if (!contratoResponse.ok) {
      return res.status(contratoResponse.status).json({
        error: contratoPayload?.error || 'Não foi possível gerar o contrato do aluno.'
      });
    }

    const contratoHtml = String(contratoPayload?.contrato?.html || '');
    const contratoNome = asText(contratoPayload?.contrato?.nome || `Contrato aluno ${alunoId}`);

    assinaturaContext.instituicaoId = asText(contratoPayload?.instituicao?.id) || null;
    assinaturaContext.contratoId = asText(contratoPayload?.contrato?.id) || null;

    if (!contratoHtml.trim()) {
      return res.status(400).json({ error: 'Contrato sem conteúdo para assinatura digital.' });
    }

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('id,nome,email,telefone_celular,telefonecelular,cpf')
      .eq('id', alunoId)
      .single();

    if (alunoError || !aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado para assinatura digital.' });
    }

    const responsavel = await getResponsavelAluno(alunoId);

    const signersInput = [
      {
        full_name: asText(aluno.nome),
        email: asText(aluno.email),
        whatsapp_phone_number: asText(aluno.telefone_celular || aluno.telefonecelular)
      }
    ];

    if (responsavel && asText(responsavel.nome)) {
      signersInput.push({
        full_name: asText(responsavel.nome),
        email: asText(responsavel.email),
        whatsapp_phone_number: asText(responsavel.whatsapp || responsavel.telefonecelular)
      });
    }

    const signersWithoutEmail = signersInput.filter((signer) => !asText(signer.email));
    if (signersWithoutEmail.length > 0) {
      return res.status(400).json({
        error: 'Todos os signatários precisam ter e-mail cadastrado para convite de assinatura digital.'
      });
    }

    const plainText = htmlToPlainText(contratoHtml);
    const pdfBuffer = buildPdfFromText(contratoNome, plainText);

    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `contrato-aluno-${alunoId}.pdf`);

    const uploadResponse = await callAssinafy(`/accounts/${accountId}/documents`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey
      },
      body: formData
    });

    const uploadedDocument = parseAssinafyPayload(uploadResponse);
    const documentId = uploadedDocument?.id;
    assinaturaContext.providerDocumentId = asText(documentId) || null;
    assinaturaContext.providerPayload = {
      upload: uploadedDocument
    };

    if (!documentId) {
      return res.status(500).json({ error: 'Assinafy não retornou o ID do documento enviado.' });
    }

    const assinafySigners = [];
    for (const signerInput of signersInput) {
      const signer = await ensureSigner(accountId, apiKey, signerInput);
      if (!signer?.id) {
        throw new Error(`Falha ao provisionar signatário: ${signerInput.full_name}`);
      }
      assinafySigners.push(signer);
    }

    const assignmentResponse = await callAssinafy(`/documents/${documentId}/assignments`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'virtual',
        signers: assinafySigners.map((signer) => ({ id: signer.id })),
        message: `Assinatura digital do contrato: ${contratoNome}`
      })
    });

    const assignment = parseAssinafyPayload(assignmentResponse);
    const signingUrls = Array.isArray(assignment?.signing_urls)
      ? assignment.signing_urls
      : [];

    assinaturaContext.providerAssignmentId = asText(assignment?.id) || null;
    assinaturaContext.signingUrls = signingUrls;
    assinaturaContext.signers = assinafySigners;
    assinaturaContext.providerPayload = {
      upload: uploadedDocument,
      assignment
    };

    const assinaturaId = await saveAssinaturaRecord({
      aluno_id: assinaturaContext.alunoId,
      instituicao_id: assinaturaContext.instituicaoId,
      contrato_id: assinaturaContext.contratoId,
      provider: 'assinafy',
      provider_document_id: assinaturaContext.providerDocumentId,
      provider_assignment_id: assinaturaContext.providerAssignmentId,
      status: normalizeStatus(assignment?.status, normalizeStatus(uploadedDocument?.status, 'pending_signature')),
      signers: assinaturaContext.signers,
      signing_urls: assinaturaContext.signingUrls,
      provider_payload: assinaturaContext.providerPayload,
      requested_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString()
    });

    return res.status(200).json({
      status: 'ok',
      provider: 'assinafy',
      alunoId,
      assinaturaId,
      documentId,
      assignmentId: assignment?.id || null,
      signingUrls,
      signers: assinafySigners.map((signer) => ({
        id: signer.id,
        full_name: signer.full_name,
        email: signer.email || ''
      }))
    });
  } catch (error) {
    console.error('Erro ao iniciar assinatura digital via Assinafy:', error);

    try {
      if (assinaturaContext.alunoId) {
        await saveAssinaturaRecord({
          aluno_id: assinaturaContext.alunoId,
          instituicao_id: assinaturaContext.instituicaoId,
          contrato_id: assinaturaContext.contratoId,
          provider: 'assinafy',
          provider_document_id: assinaturaContext.providerDocumentId,
          provider_assignment_id: assinaturaContext.providerAssignmentId,
          status: 'failed',
          signers: assinaturaContext.signers,
          signing_urls: assinaturaContext.signingUrls,
          provider_payload: {
            ...assinaturaContext.providerPayload,
            error: {
              message: error.message || 'Erro interno'
            }
          },
          error_message: error.message || 'Erro interno ao iniciar assinatura digital',
          requested_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString()
        });
      }
    } catch (persistError) {
      console.error('Falha ao persistir erro de assinatura digital:', persistError);
    }

    return res.status(500).json({ error: error.message || 'Erro interno ao iniciar assinatura digital' });
  }
}
