import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

let cursoUnidadeSchemaCache = null;

const isMissingColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('does not exist');
};

const getCursoUnidadeSchema = async () => {
  if (cursoUnidadeSchemaCache) {
    return cursoUnidadeSchemaCache;
  }

  const camelSchema = { cursoCol: 'cursoId', unidadeCol: 'unidadeId' };
  const snakeSchema = { cursoCol: 'curso_id', unidadeCol: 'unidade_id' };
  const lowerSchema = { cursoCol: 'cursoid', unidadeCol: 'unidadeid' };

  const { error: camelError } = await supabase
    .from('curso_unidade')
    .select(camelSchema.cursoCol)
    .limit(1);

  if (!camelError) {
    cursoUnidadeSchemaCache = camelSchema;
    return cursoUnidadeSchemaCache;
  }

  if (!isMissingColumnError(camelError)) {
    throw camelError;
  }

  const { error: snakeError } = await supabase
    .from('curso_unidade')
    .select(snakeSchema.cursoCol)
    .limit(1);

  if (!snakeError) {
    cursoUnidadeSchemaCache = snakeSchema;
    return cursoUnidadeSchemaCache;
  }

  if (!isMissingColumnError(snakeError)) {
    throw snakeError;
  }

  const { error: lowerError } = await supabase
    .from('curso_unidade')
    .select(lowerSchema.cursoCol)
    .limit(1);

  if (!lowerError) {
    cursoUnidadeSchemaCache = lowerSchema;
    return cursoUnidadeSchemaCache;
  }

  if (!isMissingColumnError(lowerError)) {
    throw lowerError;
  }

  throw new Error('Não foi possível identificar as colunas da tabela curso_unidade');
};

const mapRowToResponse = (row) => ({
  id: row.id,
  instituicaoId: row.instituicao_id || '',
  instituicaoNome: row.instituicao_nome || '',
  nome: row.nome || '',
  cnpj: row.cnpj || '',
  cep: row.cep || '',
  cidade: row.cidade || '',
  estado: row.estado || '',
  endereco: row.endereco || '',
  numero: row.numero || '',
  bairro: row.bairro || '',
  local: row.local || '',
  email: row.email || '',
  telefone: row.telefoneprincipal || row.telefone || '',
  codigoPoloRecenseamento: row.codigo_polo_recenseamento || '',
  instituicaoEnsinoSuperior: Boolean(row.instituicao_ensino_superior),
  situacao: row.situacao || (row.ativo ? 'ATIVO' : 'INATIVO'),
  codMecMantenedora: row.cod_mec_mantenedora || '',
  cnpjMantenedora: row.cnpj_mantenedora || '',
  razaoSocial: row.razao_social || '',
  cepMantenedora: row.cep_mantenedora || '',
  logradouroMantenedora: row.logradouro_mantenedora || '',
  numeroMantenedora: row.numero_mantenedora || '',
  complementoMantenedora: row.complemento_mantenedora || '',
  bairroMantenedora: row.bairro_mantenedora || '',
  ufMantenedora: row.uf_mantenedora || '',
  tipoCredenciamento: row.tipo_credenciamento || '',
  numeroCredenciamento: row.numero_credenciamento || '',
  dataCredenciamento: row.data_credenciamento || '',
  veiculoPublicacao: row.veiculo_publicacao || '',
  dataPublicacao: row.data_publicacao || '',
  secaoPublicacao: row.secao_publicacao || '',
  paginaPublicacao: row.pagina_publicacao || '',
  numeroDOU: row.numero_dou || '',
  temRecredenciamento: Boolean(row.tem_recredenciamento),
  tipoRecredenciamento: row.tipo_recredenciamento || '',
  numeroRecredenciamento: row.numero_recredenciamento || '',
  dataRecredenciamento: row.data_recredenciamento || '',
  veiculoRecredenciamento: row.veiculo_recredenciamento || '',
  dataPublicacaoRecredenciamento: row.data_publicacao_recredenciamento || '',
  secaoRecredenciamento: row.secao_recredenciamento || '',
  paginaRecredenciamento: row.pagina_recredenciamento || '',
  numeroDOURecredenciamento: row.numero_dou_recredenciamento || '',
  numeroProcessoRecredenciamento: row.numero_processo_recredenciamento || '',
  tipoProcessoRecredenciamento: row.tipo_processo_recredenciamento || '',
  dataCadastroRecredenciamento: row.data_cadastro_recredenciamento || '',
  dataProtocoloRecredenciamento: row.data_protocolo_recredenciamento || '',
  temRenovacao: Boolean(row.tem_renovacao),
  tipoRenovacao: row.tipo_renovacao || '',
  numeroRenovacao: row.numero_renovacao || '',
  dataRenovacao: row.data_renovacao || '',
  veiculoRenovacao: row.veiculo_renovacao || '',
  dataPublicacaoRenovacao: row.data_publicacao_renovacao || '',
  secaoRenovacao: row.secao_renovacao || '',
  paginaRenovacao: row.pagina_renovacao || '',
  numeroDOURenovacao: row.numero_dou_renovacao || '',
  numeroProcessoRenovacao: row.numero_processo_renovacao || '',
  tipoProcessoRenovacao: row.tipo_processo_renovacao || '',
  dataCadastroRenovacao: row.data_cadastro_renovacao || '',
  dataProtocoloRenovacao: row.data_protocolo_renovacao || '',
  cursos: Array.isArray(row.cursos) ? row.cursos : [],
  dataCriacao: row.datacriacao || null,
  dataAtualizacao: row.dataatualizacao || null,
});

const syncCursosUnidade = async (unidadeId, cursos) => {
  const schema = await getCursoUnidadeSchema();
  const cursosNormalizados = Array.isArray(cursos)
    ? cursos.map((cursoId) => Number.parseInt(cursoId, 10)).filter((cursoId) => !Number.isNaN(cursoId))
    : [];

  const { error: deleteError } = await supabase
    .from('curso_unidade')
    .delete()
    .eq(schema.unidadeCol, unidadeId);

  if (deleteError) {
    throw deleteError;
  }

  if (cursosNormalizados.length === 0) {
    return;
  }

  const payload = cursosNormalizados.map((cursoId) => ({
    [schema.cursoCol]: cursoId,
    [schema.unidadeCol]: unidadeId,
  }));

  const { error: insertError } = await supabase
    .from('curso_unidade')
    .insert(payload);

  if (insertError) {
    throw insertError;
  }
};

const mapBodyToPayload = (body) => {
  const instituicaoId = body.instituicaoId || null;
  const situacao = body.situacao || 'ATIVO';

  return {
    instituicao_id: instituicaoId,
    instituicao_nome: body.instituicaoNome || null,
    nome: body.nome?.trim() || '',
    cnpj: body.cnpj || null,
    cep: body.cep || null,
    cidade: body.cidade || null,
    estado: body.estado || null,
    endereco: body.endereco || null,
    numero: body.numero || null,
    bairro: body.bairro || null,
    local: body.local || null,
    email: body.email || null,
    telefoneprincipal: body.telefone || body.telefonePrincipal || null,
    codigo_polo_recenseamento: body.codigoPoloRecenseamento || null,
    instituicao_ensino_superior: Boolean(body.instituicaoEnsinoSuperior),
    situacao,
    ativo: situacao === 'ATIVO',
    cod_mec_mantenedora: body.codMecMantenedora || null,
    cnpj_mantenedora: body.cnpjMantenedora || null,
    razao_social: body.razaoSocial || null,
    cep_mantenedora: body.cepMantenedora || null,
    logradouro_mantenedora: body.logradouroMantenedora || null,
    numero_mantenedora: body.numeroMantenedora || null,
    complemento_mantenedora: body.complementoMantenedora || null,
    bairro_mantenedora: body.bairroMantenedora || null,
    uf_mantenedora: body.ufMantenedora || null,
    tipo_credenciamento: body.tipoCredenciamento || null,
    numero_credenciamento: body.numeroCredenciamento || null,
    data_credenciamento: body.dataCredenciamento || null,
    veiculo_publicacao: body.veiculoPublicacao || null,
    data_publicacao: body.dataPublicacao || null,
    secao_publicacao: body.secaoPublicacao || null,
    pagina_publicacao: body.paginaPublicacao || null,
    numero_dou: body.numeroDOU || null,
    tem_recredenciamento: Boolean(body.temRecredenciamento),
    tipo_recredenciamento: body.tipoRecredenciamento || null,
    numero_recredenciamento: body.numeroRecredenciamento || null,
    data_recredenciamento: body.dataRecredenciamento || null,
    veiculo_recredenciamento: body.veiculoRecredenciamento || null,
    data_publicacao_recredenciamento: body.dataPublicacaoRecredenciamento || null,
    secao_recredenciamento: body.secaoRecredenciamento || null,
    pagina_recredenciamento: body.paginaRecredenciamento || null,
    numero_dou_recredenciamento: body.numeroDOURecredenciamento || null,
    numero_processo_recredenciamento: body.numeroProcessoRecredenciamento || null,
    tipo_processo_recredenciamento: body.tipoProcessoRecredenciamento || null,
    data_cadastro_recredenciamento: body.dataCadastroRecredenciamento || null,
    data_protocolo_recredenciamento: body.dataProtocoloRecredenciamento || null,
    tem_renovacao: Boolean(body.temRenovacao),
    tipo_renovacao: body.tipoRenovacao || null,
    numero_renovacao: body.numeroRenovacao || null,
    data_renovacao: body.dataRenovacao || null,
    veiculo_renovacao: body.veiculoRenovacao || null,
    data_publicacao_renovacao: body.dataPublicacaoRenovacao || null,
    secao_renovacao: body.secaoRenovacao || null,
    pagina_renovacao: body.paginaRenovacao || null,
    numero_dou_renovacao: body.numeroDOURenovacao || null,
    numero_processo_renovacao: body.numeroProcessoRenovacao || null,
    tipo_processo_renovacao: body.tipoProcessoRenovacao || null,
    data_cadastro_renovacao: body.dataCadastroRenovacao || null,
    data_protocolo_renovacao: body.dataProtocoloRenovacao || null,
    cursos: Array.isArray(body.cursos) ? body.cursos : [],
  };
};

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID não informado' });
  }

  try {
    if (method === 'GET') {
      console.log(`[DEBUG] Carregando unidade com ID: ${id}`);
      
      const { data, error } = await supabase
        .from('unidades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[ERROR] Supabase GET unidades error:', JSON.stringify(error));
        return res.status(500).json({ 
          error: 'Erro ao recuperar unidade', 
          detail: error.message,
          code: error.code
        });
      }

      if (!data) {
        console.warn(`[WARN] Unidade ${id} não encontrada`);
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      console.log('[DEBUG] Unidade encontrada, carregando cursos...');

      const schema = await getCursoUnidadeSchema();
      
      const { data: cursosData, error: cursosError } = await supabase
        .from('curso_unidade')
        .select(schema.cursoCol)
        .eq(schema.unidadeCol, id);

      if (cursosError) {
        console.error('[ERROR] Supabase curso_unidade query error:', JSON.stringify(cursosError));
        // Não falhar aqui - talvez a tabela não exista ainda
        console.log('[INFO] Retornando unidade sem cursos');
      }

      const cursos = Array.isArray(cursosData)
        ? cursosData.map((item) => item[schema.cursoCol]).filter((cursoId) => !Number.isNaN(Number(cursoId)))
        : [];
      console.log(`[DEBUG] Cursos encontrados: ${cursos.length}`);
      
      return res.status(200).json({
        ...mapRowToResponse(data),
        cursos,
      });
    }

    if (method === 'PUT') {
      const body = req.body || {};
      const instituicaoId = body.instituicaoId || '';
      const instituicaoNome = body.instituicaoNome || body.instituicao || '';

      if (!body.nome || body.nome.trim() === '') {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      if (!instituicaoId && !instituicaoNome) {
        return res.status(400).json({ error: 'Instituição é obrigatória' });
      }

      const payload = mapBodyToPayload(body);

      const { data, error } = await supabase
        .from('unidades')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase PUT error:', error);
        return res.status(500).json({ error: 'Erro ao atualizar unidade', detail: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      try {
        await syncCursosUnidade(id, body.cursos);
      } catch (syncError) {
        console.error('Supabase curso_unidade error:', syncError);
        return res.status(500).json({ error: 'Erro ao atualizar cursos da unidade', detail: syncError.message });
      }

      return res.status(200).json(mapRowToResponse(data[0]));
    }

    if (method === 'DELETE') {
      const { error } = await supabase
        .from('unidades')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase DELETE error:', error);
        return res.status(500).json({ error: 'Erro ao deletar unidade', detail: error.message });
      }

      return res.status(200).json({ message: 'Unidade deletada com sucesso' });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de unidade:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição', detail: error.message });
  }
}
