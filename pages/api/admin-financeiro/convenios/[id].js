import { createClient } from '@supabase/supabase-js';
import {
  applyInstituicaoFilter,
  hasPerfil,
  requireAuth,
  requirePerfil,
  resolveInstituicaoId,
  resolveContextoUsuario,
} from '../../../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const withLowercaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowered = {};
  Object.entries(obj).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return { ...obj, ...lowered };
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const parsePercentual = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;

  const normalized = String(value)
    .trim()
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatCnpj = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits.length) return null;
  if (digits.length !== 14) return null;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const mapRowToResponse = (row) => ({
  id: row.id,
  nome: row.nome || '',
  percentual: row.percentual !== null && row.percentual !== undefined ? Number(row.percentual) : 0,
  instituicaoId: row.instituicao_id || '',
  instituicaoNome: row.instituicoes?.nome || '',
  cnpj: row.cnpj || '',
  observacoes: row.observacoes || '',
  ativo: row.ativo !== false,
  createdAt: row.created_at || null,
  updatedAt: row.updated_at || null,
});

const getConvenioById = async (id, instituicaoId) => {
  let query = supabase
    .from('financeiro_convenios')
    .select('id,nome,percentual,instituicao_id,cnpj,observacoes,ativo,created_at,updated_at,instituicoes(nome)')
    .eq('id', id);

  query = applyInstituicaoFilter(query, instituicaoId);

  const { data, error } = await query.single();

  if (error) throw error;
  return mapRowToResponse(data);
};

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID obrigatorio' });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'financeiro', 'admin'])) {
    return;
  }

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);

  // ── FASE 6.1.10: Resolver contexto de escopo institucional ──────────────────
  const ctx = await resolveContextoUsuario(req, authUser);

  if (ctx.queryError) {
    console.error('[convenios/id] Falha ao resolver contexto de escopo:', ctx.queryError);
    return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente novamente.' });
  }

  // A tabela financeiro_convenios é de escopo institucional (instituicao_id).
  // Não possui relação direta ou coluna de unidade_id.
  const userInstituicaoId = ctx.legacyFallback
    ? resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin })
    : ctx.instituicaoId;

  const instituicaoId = isGroupAdmin ? null : userInstituicaoId;

  if (!isGroupAdmin && !userInstituicaoId) {
    return res.status(403).json({ message: 'Instituicao nao definida para o usuario atual' });
  }
  // ────────────────────────────────────────────────────────────────────────────

  if (req.method === 'GET') {
    try {
      const convenio = await getConvenioById(id, instituicaoId);
      return res.status(200).json(withLowercaseKeys(convenio));
    } catch (error) {
      if (error?.code === 'PGRST116') {
        return res.status(404).json({ message: 'Convenio nao encontrado' });
      }
      console.error('Erro ao buscar convenio:', error);
      return res.status(500).json({ message: 'Erro ao buscar convenio' });
    }
  }

  if (req.method === 'PUT') {
    try {
      // 1. Validar existência e escopo do convênio atual antes de atualizar
      const { data: convenioAtual, error: getErr } = await supabase
        .from('financeiro_convenios')
        .select('id, instituicao_id')
        .eq('id', id)
        .maybeSingle();

      if (getErr) throw getErr;
      if (!convenioAtual) {
        return res.status(404).json({ message: 'Convenio nao encontrado' });
      }

      // Validação de segurança multi-tenant
      if (!isGroupAdmin && userInstituicaoId && convenioAtual.instituicao_id !== userInstituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: convenio pertence a outra instituicao' });
      }

      const nome = normalizeText(req.body?.nome);
      const percentual = parsePercentual(req.body?.percentual);
      const cnpj = formatCnpj(req.body?.cnpj);
      const observacoes = normalizeText(req.body?.observacoes);

      if (!nome) {
        return res.status(400).json({ message: 'Nome e obrigatorio' });
      }

      if (percentual === null || percentual < 0 || percentual > 100) {
        return res.status(400).json({ message: 'Percentual deve ser um valor entre 0 e 100' });
      }

      if (req.body?.cnpj && !cnpj) {
        return res.status(400).json({ message: 'CNPJ deve conter 14 digitos' });
      }

      // Manter a instituição original do convênio (ou a selecionada pelo grupo_admin)
      const instituicaoIdFinal = isGroupAdmin
        ? (req.body?.instituicao_id || convenioAtual.instituicao_id)
        : userInstituicaoId;

      const payload = {
        nome,
        percentual,
        instituicao_id: instituicaoIdFinal,
        cnpj,
        observacoes,
        ativo: req.body?.ativo !== false,
      };

      const { error } = await supabase
        .from('financeiro_convenios')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      const updated = await getConvenioById(id, instituicaoId);
      return res.status(200).json(withLowercaseKeys(updated));
    } catch (error) {
      console.error('Erro ao atualizar convenio:', error);
      return res.status(500).json({ message: 'Erro ao atualizar convenio' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // 1. Validar existência e escopo do convênio antes de deletar
      const { data: convenioAtual, error: getErr } = await supabase
        .from('financeiro_convenios')
        .select('id, instituicao_id')
        .eq('id', id)
        .maybeSingle();

      if (getErr) throw getErr;
      if (!convenioAtual) {
        return res.status(404).json({ message: 'Convenio nao encontrado' });
      }

      // Validação de segurança multi-tenant
      if (!isGroupAdmin && userInstituicaoId && convenioAtual.instituicao_id !== userInstituicaoId) {
        return res.status(403).json({ message: 'Acesso negado: convenio pertence a outra instituicao' });
      }

      let query = supabase
        .from('financeiro_convenios')
        .delete()
        .eq('id', id);

      query = applyInstituicaoFilter(query, instituicaoId);

      const { error } = await query;

      if (error) throw error;
      return res.status(204).end();
    } catch (error) {
      console.error('Erro ao excluir convenio:', error);
      return res.status(500).json({ message: 'Erro ao excluir convenio' });
    }
  }

  return res.status(405).json({ message: 'Metodo nao permitido' });
}
