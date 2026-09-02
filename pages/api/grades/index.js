import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const parseAno = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length !== 4) return null;
  const parsed = Number.parseInt(digits, 10);
  if (Number.isNaN(parsed) || parsed < 1900 || parsed > 3000) return null;
  return parsed;
};

let modernSchemaCache = null;

const checkIsModernSchema = async () => {
  if (modernSchemaCache !== null) return modernSchemaCache;
  try {
    const { error } = await supabase.from('grades').select('curso_id').limit(1);
    if (error && (error.code === 'PGRST204' || String(error.message).includes('column'))) {
      modernSchemaCache = false;
    } else {
      modernSchemaCache = true;
    }
  } catch {
    modernSchemaCache = false;
  }
  return modernSchemaCache;
};

export default async function handler(req, res) {
  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;
    if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

    const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: true });

    if (req.method === 'GET') {
      let query = supabase.from('grades').select('*').order('nome', { ascending: true });
      query = applyInstituicaoFilter(query, instituicaoId);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      const normalized = (data || []).map(g => ({
        ...g,
        instituicao_id: g.instituicao_id || g.instituicaoid || null,
        instituicaoId: g.instituicao_id || g.instituicaoid || null,
        curso_id: g.curso_id !== undefined && g.curso_id !== null ? Number(g.curso_id) : g.cursoid !== undefined && g.cursoid !== null ? Number(g.cursoid) : null,
        cursoId: g.curso_id !== undefined && g.curso_id !== null ? Number(g.curso_id) : g.cursoid !== undefined && g.cursoid !== null ? Number(g.cursoid) : null,
        created_at: g.created_at || g.datacriacao || null,
        updated_at: g.updated_at || g.dataatualizacao || null,
        situacao: g.situacao || 'ATIVO',
      }));

      return res.status(200).json(normalized);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      
      const instId = resolveInstituicaoId(req, authUser);
      const reqInstId = body.instituicaoId || body.instituicao_id || instId;
      const anoVal = parseAno(body.ano);
      const rawCursoId = body.cursoId || body.curso_id;

      if (!reqInstId) return res.status(400).json({ error: 'Instituição é obrigatória' });
      if (!rawCursoId) return res.status(400).json({ error: 'Curso é obrigatório' });
      
      const numericCursoId = Number(rawCursoId);
      if (Number.isNaN(numericCursoId)) {
        console.warn('Validação de Tipo Falhou: cursoId deve ser um número inteiro válido', { rawCursoId });
        return res.status(400).json({ error: 'Identificador do Curso (cursoId) deve ser um número inteiro válido.' });
      }

      if (anoVal === null) return res.status(400).json({ error: 'Ano é obrigatório e deve conter 4 dígitos' });
      if (!body.nome) return res.status(400).json({ error: 'Nome é obrigatório' });

      // Detectar schema uma única vez
      const isModern = await checkIsModernSchema();

      let insertPayload = {};

      if (isModern) {
        // Schema modernizado: enviar apenas colunas modernas
        insertPayload = {
          nome:             body.nome,
          descricao:        body.descricao || null,
          curso_id:         numericCursoId,
          instituicao_id:   reqInstId || null,
          ano:              anoVal,
          situacao:         body.situacao || 'ATIVO',
          created_at:       new Date().toISOString(),
          updated_at:       new Date().toISOString()
        };
      } else {
        // Schema legado: enviar apenas colunas físicas legadas
        insertPayload = {
          nome:      body.nome,
          descricao: body.descricao || null,
          cursoid:   numericCursoId,
          ano:       anoVal
        };
      }

      if (body.id !== undefined && body.id !== null) {
        const parsedId = Number(body.id);
        if (!Number.isNaN(parsedId) && Number.isInteger(parsedId)) {
          insertPayload.id = parsedId;
        }
      }

      console.log('PERSISTÊNCIA ÚNICA GRADES (SCHEMA DETECTADO: ' + (isModern ? 'MODERNO' : 'LEGADO') + '):', insertPayload);

      // Executar UM ÚNICO INSERT sem retentativas ou fallbacks
      const { data, error } = await supabase.from('grades').insert(insertPayload).select().single();
      
      if (error) {
        console.error('Erro no INSERT da Tabela grades:', {
          payload: insertPayload,
          code: error.code,
          message: error.message
        });

        // Tratar erros de restrição/sintaxe do PostgreSQL como HTTP 400
        if (['22P02', '23502', '23503', '23505'].includes(error.code)) {
          return res.status(400).json({ error: `Dados inválidos para cadastro de grade: ${error.message}` });
        }

        return res.status(400).json({ error: `Falha ao cadastrar grade: ${error.message}` });
      }

      // Normalizar resposta final
      const responseData = {
        ...data,
        curso_id: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : numericCursoId,
        cursoId: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : numericCursoId,
        created_at: data.created_at || data.datacriacao || new Date().toISOString(),
        updated_at: data.updated_at || data.dataatualizacao || new Date().toISOString(),
        situacao: data.situacao || 'ATIVO'
      };

      return res.status(201).json(responseData);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  } catch (err) {
    console.error('Exceção Inesperada no Handler da API de Grades:', err);
    return res.status(500).json({ error: err?.message || 'Erro interno no servidor' });
  }
}
