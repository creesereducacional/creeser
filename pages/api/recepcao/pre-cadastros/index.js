import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  applyInstituicaoFilter,
  resolveInstituicaoId,
} from '../../../../lib/auth-server';
import { rateLimit, getClientIp } from '../../../../lib/rate-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS_PERMITIDOS = ['recepcao', 'grupo_admin', 'instituicao_admin', 'admin', 'financeiro'];

const STATUS_LISTADOS = ['PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO_MATRICULA', 'AGUARDANDO_FORMACAO_TURMA', 'ATIVO', 'DESISTENTE', 'CANCELADO'];

export default async function handler(req, res) {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS_PERMITIDOS)) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin });

  // ── GET ─ listar pré-cadastros ──────────────────────────────────
  if (req.method === 'GET') {
    let query = supabase
      .from('alunos')
      .select('id, nome, cpf, email, telefone_celular, cursoid, turmaid, statusmatricula, datacriacao, captado_por_id, instituicao_id')
      .in('statusmatricula', STATUS_LISTADOS)
      .order('datacriacao', { ascending: false });

    query = applyInstituicaoFilter(query, instituicaoId);
    const { data, error } = await query;
    if (error) {
      console.error('[pre-cadastros/GET]', error.message);
      return res.status(500).json({ error: 'Erro interno ao carregar pré-cadastros' });
    }
    return res.status(200).json(data || []);
  }

  // ── POST ─ criar pré-cadastro ───────────────────────────────────
  if (req.method === 'POST') {    // Rate limit: 20 pré-cadastros por IP a cada hora
    const ip = getClientIp(req);
    const rl = rateLimit({ key: `precadastro_criar:${ip}`, limit: 20, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde antes de criar mais pré-cadastros.' });
    }
    // recepcao puro não pode alterar status para ATIVO
    const isRecepcaoPuro = hasPerfil(authUser, ['recepcao']) &&
      !hasPerfil(authUser, ['grupo_admin', 'instituicao_admin', 'admin']);

    const {
      nome,
      cpf,
      email,
      telefone_celular,
      cursoid,
      turmaid,
      valor_matricula,
      valor_mensalidade,
      qtd_parcelas,
      observacoes_adicionais,
    } = req.body;

    if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });

    const efetivInstituicaoId = isGroupAdmin
      ? (req.body.instituicao_id || instituicaoId)
      : (authUser.instituicao_id || instituicaoId);

    if (!efetivInstituicaoId) {
      return res.status(400).json({ error: 'Instituição não definida para este usuário.' });
    }

    // Pré-cadastro sempre inicia como PRE_CADASTRO
    // O financeiro gerará a cobrança e avançará o status manualmente
    const statusmatricula = 'PRE_CADASTRO';

    const novoAluno = {
      nome: nome.trim(),
      cpf:              cpf?.trim()             || null,
      email:            email?.trim()            || null,
      telefone_celular: telefone_celular?.trim() || null,
      instituicao_id:   efetivInstituicaoId,
      captado_por_id:   authUser.id,
      statusmatricula,
      data_captacao:    new Date().toISOString().slice(0, 10),
      ...(cursoid             ? { cursoid: Number(cursoid) }                   : {}),
      ...(turmaid             ? { turmaid: Number(turmaid) }                   : {}),
      ...(valor_matricula     ? { valor_matricula: Number(valor_matricula) }   : {}),
      ...(valor_mensalidade   ? { valor_mensalidade: Number(valor_mensalidade) } : {}),
      ...(qtd_parcelas        ? { qtd_parcelas: Number(qtd_parcelas) }         : {}),
      ...(observacoes_adicionais ? { observacoes_adicionais }                  : {}),
    };

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .insert(novoAluno)
      .select('id, nome, statusmatricula')
      .single();

    if (alunoError) return res.status(500).json({ error: alunoError.message });

    // Auditoria
    try {
      await supabase.from('recepcao_auditoria').insert({
        aluno_id:   aluno.id,
        usuario_id: authUser.id,
        acao:       'CRIAR_PRE_CADASTRO',
        dados:      JSON.stringify({ nome: aluno.nome, statusmatricula: aluno.statusmatricula }),
        data_hora:  new Date().toISOString(),
      });
    } catch (_) { /* nao bloqueia */ }

    return res.status(201).json({
      id: aluno.id,
      nome: aluno.nome,
      statusmatricula: aluno.statusmatricula,
      mensagem: `Pré-cadastro criado com status: ${aluno.statusmatricula}`,
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
