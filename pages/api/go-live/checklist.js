/**
 * API Go-Live Checklist
 * GET /api/go-live/checklist
 *
 * Valida se uma instituição está pronta para operar.
 * Retorna lista de checks com status: 'ok' | 'aviso' | 'bloqueante'
 */
import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveInstituicaoId,
  applyInstituicaoFilter,
} from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERFIS = ['grupo_admin', 'instituicao_admin'];

function check(id, categoria, label, status, detalhe = '') {
  return { id, categoria, label, status, detalhe };
}

async function safeCount(query) {
  try {
    const { count } = await query;
    return count || 0;
  } catch { return 0; }
}

async function safeQuery(promise) {
  try {
    const result = await promise;
    return result.data || [];
  } catch { return []; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo nao permitido' });

  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, PERFIS)) return;

  const isGroupAdmin  = hasPerfil(authUser, ['grupo_admin']);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: false });

  const checks = [];

  // ── INSTITUIÇÃO ──────────────────────────────────────────
  {
    let q = supabase
      .from('instituicoes')
      .select('id, nome, ativa', { count: 'exact', head: false })
      .limit(1);
    q = applyInstituicaoFilter(q, instituicaoId);
    const { data: inst } = await q.maybeSingle().catch(() => ({ data: null }));

    if (!inst) {
      checks.push(check('inst_existe',  'Instituição', 'Instituição cadastrada',    'bloqueante', 'Nenhuma instituicao encontrada'));
      checks.push(check('inst_ativa',   'Instituição', 'Instituição ativa',         'bloqueante', 'Sem instituicao'));
    } else {
      checks.push(check('inst_existe',  'Instituição', 'Instituição cadastrada',    'ok', inst.nome));
      checks.push(check('inst_ativa',   'Instituição', 'Instituição ativa',
        inst.ativa !== false ? 'ok' : 'bloqueante',
        inst.ativa !== false ? 'Ativa' : 'Instituição inativa'));
    }
  }

  // ── USUÁRIOS ─────────────────────────────────────────────
  const perfisCheck = [
    { id: 'user_recepcao',    label: 'Usuário Recepção',    perfil: 'recepcao'        },
    { id: 'user_financeiro',  label: 'Usuário Financeiro',  perfil: 'financeiro'      },
    { id: 'user_coordenador', label: 'Usuário Coordenador', perfil: 'coordenador'     },
    { id: 'user_comercial',   label: 'Usuário Comercial',   perfil: 'comercial_master' },
  ];

  for (const { id, label, perfil } of perfisCheck) {
    let q = supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .in('perfil', [perfil])
      .in('status', ['ativo', 'ATIVO', 'active', '1', true]);
    q = applyInstituicaoFilter(q, instituicaoId);
    const qtd = await safeCount(q);
    const secao = perfil === 'comercial_master' ? 'Comercial' : 'Usuários';
    checks.push(check(id, secao, label,
      qtd > 0 ? 'ok' : 'aviso',
      qtd > 0 ? `${qtd} usuario(s) ativo(s)` : 'Nenhum usuario com este perfil'));
  }

  // ── ACADÊMICO ─────────────────────────────────────────────
  {
    let cursoQ = supabase
      .from('cursos')
      .select('id', { count: 'exact', head: true });
    cursoQ = applyInstituicaoFilter(cursoQ, instituicaoId);
    const qtdCursos = await safeCount(cursoQ);
    checks.push(check('curso_ativo', 'Acadêmico', 'Curso ativo',
      qtdCursos > 0 ? 'ok' : 'bloqueante',
      qtdCursos > 0 ? `${qtdCursos} curso(s) cadastrado(s)` : 'Nenhum curso encontrado'));
  }

  {
    let turmaQ = supabase
      .from('turmas')
      .select('id', { count: 'exact', head: true })
      .eq('situacao', 'ativo');
    turmaQ = applyInstituicaoFilter(turmaQ, instituicaoId);
    const qtdTurmas = await safeCount(turmaQ);
    checks.push(check('turma_ativa', 'Acadêmico', 'Turma ativa',
      qtdTurmas > 0 ? 'ok' : 'bloqueante',
      qtdTurmas > 0 ? `${qtdTurmas} turma(s) ativa(s)` : 'Nenhuma turma ativa'));
  }

  {
    // Checar grade vinculada (tabela disciplinas ou grade via curso)
    const gradeData = await safeQuery(supabase
      .from('disciplinas')
      .select('id', { count: 'exact', head: false })
      .limit(1));
    const temGrade = gradeData.length > 0;
    checks.push(check('grade_vinculada', 'Acadêmico', 'Grade curricular cadastrada',
      temGrade ? 'ok' : 'aviso',
      temGrade ? 'Grade encontrada' : 'Nenhuma disciplina/grade cadastrada'));
  }

  // ── FINANCEIRO ────────────────────────────────────────────
  {
    const temEfi = Boolean(
      process.env.GN_CLIENT_ID ||
      process.env.EFI_CLIENT_ID ||
      process.env.GERENCIANET_CLIENT_ID ||
      process.env.EFI_PIX_CLIENT_ID
    );
    checks.push(check('efi_configurado', 'Financeiro', 'EFI (Gerencianet) configurado',
      temEfi ? 'ok' : 'aviso',
      temEfi ? 'Credenciais presentes' : 'GN_CLIENT_ID / EFI_CLIENT_ID nao configurado'));

    const temWebhook = Boolean(
      process.env.EFI_WEBHOOK_SECRET ||
      process.env.GN_WEBHOOK_SECRET  ||
      process.env.WEBHOOK_SECRET
    );
    checks.push(check('webhook_configurado', 'Financeiro', 'Webhook de pagamento configurado',
      temWebhook ? 'ok' : 'aviso',
      temWebhook ? 'Segredo do webhook presente' : 'EFI_WEBHOOK_SECRET nao configurado'));
  }

  // ── CONTRATOS ─────────────────────────────────────────────
  {
    let contratoQ = supabase
      .from('contratos_instituicao')
      .select('id', { count: 'exact', head: true })
      .eq('padrao', true);
    if (instituicaoId) contratoQ = contratoQ.eq('instituicao_id', instituicaoId);
    const qtdContratos = await safeCount(contratoQ);
    checks.push(check('contrato_padrao', 'Contratos', 'Modelo de contrato padrão ativo',
      qtdContratos > 0 ? 'ok' : 'aviso',
      qtdContratos > 0 ? `${qtdContratos} modelo(s) padrao configurado(s)` : 'Nenhum contrato padrao definido'));

    const temAssinafy = Boolean(process.env.ASSINAFY_API_KEY && process.env.ASSINAFY_ACCOUNT_ID);
    checks.push(check('assinafy_configurado', 'Contratos', 'Assinafy configurado',
      temAssinafy ? 'ok' : 'aviso',
      temAssinafy ? 'ASSINAFY_API_KEY e ASSINAFY_ACCOUNT_ID presentes' : 'ASSINAFY_API_KEY / ASSINAFY_ACCOUNT_ID nao configurados'));
  }

  // ── SEGURANÇA ─────────────────────────────────────────────
  {
    const secret = process.env.AUTH_JWT_SECRET || '';
    const temSecret = secret.length >= 32;
    checks.push(check('jwt_secret', 'Segurança', 'AUTH_JWT_SECRET configurado',
      temSecret ? 'ok' : 'bloqueante',
      temSecret ? 'Segredo presente e suficientemente longo' : 'AUTH_JWT_SECRET ausente ou curto demais (minimo 32 chars)'));

    const isProducao = process.env.NODE_ENV === 'production';
    checks.push(check('ambiente_producao', 'Segurança', 'Ambiente de produção',
      isProducao ? 'ok' : 'aviso',
      isProducao ? 'NODE_ENV=production' : `NODE_ENV=${process.env.NODE_ENV || 'nao definido'}`));
  }

  // ── SCORE ─────────────────────────────────────────────────
  const total      = checks.length;
  const ok         = checks.filter(c => c.status === 'ok').length;
  const avisos     = checks.filter(c => c.status === 'aviso').length;
  const bloqueantes= checks.filter(c => c.status === 'bloqueante').length;
  const score      = Math.round((ok / total) * 100);

  let resultado;
  if (bloqueantes > 0)       resultado = 'VERMELHO';
  else if (avisos > 0)       resultado = 'AMARELO';
  else                       resultado = 'VERDE';

  return res.status(200).json({
    checks,
    score,
    resultado,
    resumo: { total, ok, avisos, bloqueantes },
    instituicaoId,
  });
}
