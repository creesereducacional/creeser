import { createClient } from '@supabase/supabase-js';

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

const getConvenioById = async (id) => {
  const { data, error } = await supabase
    .from('financeiro_convenios')
    .select('id,nome,percentual,instituicao_id,cnpj,observacoes,ativo,created_at,updated_at,instituicoes(nome)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapRowToResponse(data);
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('financeiro_convenios')
        .select('id,nome,percentual,instituicao_id,cnpj,observacoes,ativo,created_at,updated_at,instituicoes(nome)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json((data || []).map((row) => withLowercaseKeys(mapRowToResponse(row))));
    } catch (error) {
      console.error('Erro ao listar convenios:', error);
      return res.status(500).json({ message: 'Erro ao listar convenios' });
    }
  }

  if (req.method === 'POST') {
    try {
      const nome = normalizeText(req.body?.nome);
      const percentual = parsePercentual(req.body?.percentual);
      const instituicaoId = normalizeText(
        req.body?.instituicaoId ?? req.body?.instituicao_id ?? req.body?.instituicao
      );
      const cnpj = formatCnpj(req.body?.cnpj);
      const observacoes = normalizeText(req.body?.observacoes);

      if (!nome) {
        return res.status(400).json({ message: 'Nome e obrigatorio' });
      }

      if (percentual === null || percentual < 0 || percentual > 100) {
        return res.status(400).json({ message: 'Percentual deve ser um valor entre 0 e 100' });
      }

      if (!instituicaoId) {
        return res.status(400).json({ message: 'Instituicao e obrigatoria' });
      }

      if (req.body?.cnpj && !cnpj) {
        return res.status(400).json({ message: 'CNPJ deve conter 14 digitos' });
      }

      const payload = {
        nome,
        percentual,
        instituicao_id: instituicaoId,
        cnpj,
        observacoes,
        ativo: req.body?.ativo !== false,
      };

      const { data, error } = await supabase
        .from('financeiro_convenios')
        .insert([payload])
        .select('id')
        .single();

      if (error) throw error;

      const created = await getConvenioById(data.id);
      return res.status(201).json(withLowercaseKeys(created));
    } catch (error) {
      console.error('Erro ao criar convenio:', error);
      return res.status(500).json({ message: 'Erro ao criar convenio' });
    }
  }

  return res.status(405).json({ message: 'Metodo nao permitido' });
}
