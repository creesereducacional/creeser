import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const getBodyValue = (body, key) => {
  if (!body) return undefined;
  return body[key] ?? body[key.toLowerCase()];
};

const parseAno = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const normalizado = value.trim();
    if (!normalizado) return null;
    const convertido = Number.parseInt(normalizado, 10);
    return Number.isNaN(convertido) ? null : convertido;
  }
  return null;
};

const enforceAnoAtualVigente = async () => {
  const anoAtual = new Date().getFullYear();

  const { error: disableError } = await supabase
    .from('anos_letivos')
    .update({ ativo: false })
    .neq('ano', anoAtual);

  if (disableError) {
    throw disableError;
  }

  const { error: enableError } = await supabase
    .from('anos_letivos')
    .update({ ativo: true })
    .eq('ano', anoAtual);

  if (enableError) {
    throw enableError;
  }
};

const mapRowToResponse = (row) => {
  const dataInicio = row.datainicio ?? row.dataInicio ?? row.data_inicio ?? null;
  const dataFim = row.datafim ?? row.dataFim ?? row.data_fim ?? null;
  const ativo = row.ativo ?? false;

  return {
    id: row.id,
    nome: row.ano !== null && row.ano !== undefined ? row.ano.toString() : '',
    dataInicio,
    dataFim,
    anoVigente: Boolean(ativo),
    status: ativo ? 'ATIVO' : 'INATIVO',
    observacoes: row.observacoes ?? null,
  };
};

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('anos_letivos')
        .select('*')
        .order('ano', { ascending: false });

      if (error) {
        console.error('Supabase GET error:', error);
        return res.status(500).json({ error: 'Erro ao recuperar anos letivos', detail: error.message });
      }

      return res.status(200).json((data || []).map(mapRowToResponse));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const ano = parseAno(getBodyValue(body, 'ano') ?? getBodyValue(body, 'nome'));
      const dataInicio = getBodyValue(body, 'dataInicio') ?? getBodyValue(body, 'datainicio');
      const dataFim = getBodyValue(body, 'dataFim') ?? getBodyValue(body, 'datafim');

      if (!ano || !dataInicio || !dataFim) {
        return res.status(400).json({ error: 'Ano, data início e data fim são obrigatórios' });
      }

      const anoAtual = new Date().getFullYear();
      const ativo = Number(ano) === anoAtual;
      const observacoes = getBodyValue(body, 'observacoes') ?? null;

      const payload = {
        ano,
        datainicio: dataInicio,
        datafim: dataFim,
        ativo,
        observacoes,
      };

      await enforceAnoAtualVigente();

      const { data, error } = await supabase
        .from('anos_letivos')
        .insert([payload])
        .select();

      if (error) {
        console.error('Supabase POST error:', error);
        return res.status(500).json({ error: 'Erro ao inserir ano letivo', detail: error.message });
      }

      return res.status(201).json(mapRowToResponse(data[0]));
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const id = getBodyValue(body, 'id');

      if (!id) {
        return res.status(400).json({ error: 'ID não informado' });
      }

      const { data: registroAtual, error: registroError } = await supabase
        .from('anos_letivos')
        .select('id, ano')
        .eq('id', id)
        .single();

      if (registroError) {
        console.error('Supabase GET error:', registroError);
        return res.status(500).json({ error: 'Erro ao localizar ano letivo', detail: registroError.message });
      }

      if (!registroAtual) {
        return res.status(404).json({ error: 'Ano letivo não encontrado' });
      }

      const ano = parseAno(getBodyValue(body, 'ano') ?? getBodyValue(body, 'nome'));
      const dataInicio = getBodyValue(body, 'dataInicio') ?? getBodyValue(body, 'datainicio');
      const dataFim = getBodyValue(body, 'dataFim') ?? getBodyValue(body, 'datafim');
      const anoAtual = new Date().getFullYear();
      const ativo = Number(ano) === anoAtual;
      const observacoes = getBodyValue(body, 'observacoes') ?? null;

      if (Number(registroAtual.ano) === anoAtual && Number(ano) !== anoAtual) {
        return res.status(400).json({ error: 'O ano vigente deve ser o ano atual' });
      }

      const payload = {
        ano,
        datainicio: dataInicio,
        datafim: dataFim,
        ativo,
        observacoes,
      };

      await enforceAnoAtualVigente();

      const { data, error } = await supabase
        .from('anos_letivos')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase PUT error:', error);
        return res.status(500).json({ error: 'Erro ao atualizar ano letivo', detail: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Ano letivo não encontrado' });
      }

      return res.status(200).json(mapRowToResponse(data[0]));
    }

    if (req.method === 'DELETE') {
      const id = getBodyValue(req.body, 'id');

      if (!id) {
        return res.status(400).json({ error: 'ID não informado' });
      }

      const { data: registroAtual, error: registroError } = await supabase
        .from('anos_letivos')
        .select('id, ano')
        .eq('id', id)
        .single();

      if (registroError) {
        console.error('Supabase GET error:', registroError);
        return res.status(500).json({ error: 'Erro ao localizar ano letivo', detail: registroError.message });
      }

      if (!registroAtual) {
        return res.status(404).json({ error: 'Ano letivo não encontrado' });
      }

      const anoAtual = new Date().getFullYear();
      if (Number(registroAtual.ano) === anoAtual) {
        return res.status(400).json({ error: 'Não é permitido excluir o ano vigente' });
      }

      const { error } = await supabase
        .from('anos_letivos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase DELETE error:', error);
        return res.status(500).json({ error: 'Erro ao deletar ano letivo', detail: error.message });
      }

      return res.status(200).json({ message: 'Ano letivo deletado' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de anos letivos:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição', detail: error.message });
  }
}
