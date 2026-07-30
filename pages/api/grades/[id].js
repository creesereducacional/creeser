import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil } from '../../../lib/auth-server';

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
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('grades').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Grade não encontrada' });
    const normalized = {
      ...data,
      curso_id: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : null,
      cursoId: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : null,
      created_at: data.created_at || data.datacriacao || null,
      updated_at: data.updated_at || data.dataatualizacao || null,
      situacao: data.situacao || 'ATIVO',
    };
    return res.status(200).json(normalized);
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const anoRaw = body.ano ?? body.Ano;
    const anoFoiInformado = anoRaw !== undefined;
    const ano = anoFoiInformado ? parseAno(anoRaw) : undefined;

    if (anoFoiInformado && ano === null) {
      return res.status(400).json({ error: 'Ano deve conter 4 dígitos' });
    }

    const rawCursoId = body.cursoId || body.curso_id;
    let numericCursoId = undefined;
    if (rawCursoId !== undefined && rawCursoId !== null && rawCursoId !== '') {
      numericCursoId = Number(rawCursoId);
      if (Number.isNaN(numericCursoId)) {
        return res.status(400).json({ error: 'Identificador do Curso (cursoId) deve ser um número inteiro válido.' });
      }
    }

    const isModern = await checkIsModernSchema();
    const updates = {};

    if (isModern) {
      if (body.instituicaoId || body.instituicao_id) updates.instituicao_id = body.instituicaoId || body.instituicao_id;
      if (numericCursoId !== undefined)               updates.curso_id       = numericCursoId;
      if (anoFoiInformado)                             updates.ano            = ano;
      if (body.nome)                                   updates.nome           = body.nome;
      if (body.descricao !== undefined)               updates.descricao      = body.descricao;
      if (body.situacao)                               updates.situacao       = body.situacao;
      updates.updated_at = new Date().toISOString();
    } else {
      if (numericCursoId !== undefined)               updates.cursoid        = numericCursoId;
      if (anoFoiInformado)                             updates.ano            = ano;
      if (body.nome)                                   updates.nome           = body.nome;
      if (body.descricao !== undefined)               updates.descricao      = body.descricao;
      updates.dataatualizacao = new Date().toISOString();
    }

    console.log('UPDATE ÚNICO GRADES (SCHEMA DETECTADO: ' + (isModern ? 'MODERNO' : 'LEGADO') + '):', updates);

    const { data, error } = await supabase.from('grades').update(updates).eq('id', id).select().single();
    
    if (error) {
      console.error('Erro no UPDATE da Tabela grades:', { id, updates, code: error.code, message: error.message });
      if (['22P02', '23502', '23503', '23505'].includes(error.code)) {
        return res.status(400).json({ error: `Dados inválidos para edição de grade: ${error.message}` });
      }
      return res.status(400).json({ error: `Falha ao editar grade: ${error.message}` });
    }

    return res.status(200).json({
      ...data,
      curso_id: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : numericCursoId,
      cursoId: data.curso_id !== undefined && data.curso_id !== null ? Number(data.curso_id) : data.cursoid !== undefined && data.cursoid !== null ? Number(data.cursoid) : numericCursoId,
      updated_at: data.updated_at || data.dataatualizacao || new Date().toISOString(),
      situacao: data.situacao || 'ATIVO'
    });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Grade removida com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}
