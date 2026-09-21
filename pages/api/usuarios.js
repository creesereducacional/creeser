import { createClient } from '@supabase/supabase-js';
import { hasPerfil, requireAuth, requirePerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const chosenKeyType = serviceRoleKey ? 'SERVICE_ROLE' : (anonKey ? 'ANON' : 'NENHUMA');
const selectedKey = serviceRoleKey || anonKey || '';

console.log('================ SUPABASE RUNTIME =================');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'NÃO CONFIGURADA');
console.log('SUPABASE_SERVICE_ROLE_KEY existe:', Boolean(serviceRoleKey));
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY existe:', Boolean(anonKey));
console.log('Chave escolhida pelo código:', chosenKeyType);
console.log('Prefixo da chave utilizada:', selectedKey.slice(0, 15));
console.log('Primeiros 25 caracteres:', selectedKey.slice(0, 25));
console.log('Últimos 10 caracteres:', selectedKey.slice(-10));
console.log('===================================================');

const supabase = (supabaseUrl && selectedKey) ? createClient(supabaseUrl, selectedKey) : null;
if (supabase) {
  console.log('Cliente Supabase criado com sucesso.');
}

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Configuração do banco de dados ausente' });
  }
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!requirePerfil(authUser, res, ['grupo_admin', 'instituicao_admin', 'admin', 'coordenador', 'secretaria'])) return;

  const isGroupAdmin = hasPerfil(authUser, ['grupo_admin']);
  const isWrite = ['POST', 'PUT', 'DELETE'].includes(req.method);
  const instituicaoId = resolveInstituicaoId(req, authUser, { allowAll: isGroupAdmin && !isWrite });

  if (!isGroupAdmin && !instituicaoId) {
    return res.status(403).json({ error: 'Instituicao nao definida para o usuario atual' });
  }

  // Normalização do perfil do operador logado
  const rawP = String(authUser.perfil || authUser.tipo || '').toLowerCase();
  const mapearPerfil = (p) => {
    if (p === 'admin') return 'instituicao_admin';
    if (p === 'financeiro_admin') return 'financeiro';
    if (p === 'comercial_master') return 'comercial';
    return p;
  };
  const operadorPerfil = mapearPerfil(rawP);

  // Helper para validar se o operador logado pode gerenciar/atribuir o perfil solicitado
  const validarPerfilAlvo = (perfilAlvo) => {
    const alvo = mapearPerfil(String(perfilAlvo || '').toLowerCase());
    
    if (operadorPerfil === 'grupo_admin') {
      return true;
    }
    if (operadorPerfil === 'instituicao_admin') {
      return alvo !== 'grupo_admin' && alvo !== 'instituicao_admin';
    }
    if (operadorPerfil === 'coordenador') {
      return alvo === 'professor' || alvo === 'aluno';
    }
    if (operadorPerfil === 'secretaria') {
      return alvo === 'aluno';
    }
    return false;
  };

  if (req.method === 'GET') {
    const { tipo } = req.query;
    console.log('Executando SELECT em public.usuarios');
    let query = supabase.from('usuarios').select('*');
    query = applyInstituicaoFilter(query, instituicaoId);
    if (tipo) query = query.eq('tipo', tipo);

    const { data, error } = await query;
    if (error) {
      console.error('[RC40.2][GET /api/usuarios] ERRO COMPLETO:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar usuarios no banco' });
    }

    const lista = Array.isArray(data) ? data : [];
    
    // Buscar vínculos em usuario_instituicoes para os usuários retornados
    const userIds = lista.map(u => u.id);
    let vinculosMap = {};

    if (userIds.length > 0) {
      try {
        const { data: vinculosData, error: errVinc } = await supabase
          .from('usuario_instituicoes')
          .select(`
            id,
            usuario_id,
            instituicao_id,
            unidade_id,
            unidades (
              id,
              nome,
              is_matriz
            )
          `)
          .in('usuario_id', userIds);

        if (!errVinc && Array.isArray(vinculosData)) {
          vinculosData.forEach(v => {
            if (!vinculosMap[v.usuario_id]) vinculosMap[v.usuario_id] = [];
            vinculosMap[v.usuario_id].push({
              id: v.id,
              instituicao_id: v.instituicao_id,
              unidade_id: v.unidade_id,
              unidade_nome: v.unidades?.nome || null,
              is_matriz: Boolean(v.unidades?.is_matriz),
            });
          });
        }
      } catch (eVinc) {
        console.warn('Aviso ao carregar usuario_instituicoes:', eVinc.message);
      }
    }

    // Ordenar em memória para garantir compatibilidade com nome / nomecompleto
    lista.sort((a, b) => {
      const nA = String(a.nomecompleto || a.nome || a.email || '').toLowerCase();
      const nB = String(b.nomecompleto || b.nome || b.email || '').toLowerCase();
      return nA.localeCompare(nB);
    });

    // Omitir campo senha da resposta e anexar vínculos
    return res.status(200).json(lista.map(u => {
      const { senha, ...rest } = u;
      return {
        ...rest,
        vinculos: vinculosMap[u.id] || [],
      };
    }));
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const instId = resolveInstituicaoId(req, authUser);
    const {
      nomeCompleto,
      email,
      senha,
      cpf,
      dataNascimento,
      whatsapp,
      tipo,
      perfil,
      status,
      instituicao_id: bodyInstId,
      unidade_id: bodyUnidadeId,
      vinculos: bodyVinculos,
    } = body;

    if (!nomeCompleto || !email || !senha || !tipo) {
      return res.status(400).json({ error: 'Nome, email, senha e tipo são obrigatórios' });
    }
    const perfilResolvido = perfil || (tipo === 'admin' ? 'instituicao_admin' : tipo);

    // Validação de coerência entre Tipo e Perfil
    if (tipo === 'aluno' && perfilResolvido !== 'aluno') {
      return res.status(400).json({ error: 'Coerência inválida: Tipo aluno exige Perfil aluno.' });
    }
    if (tipo === 'professor' && perfilResolvido !== 'professor') {
      return res.status(400).json({ error: 'Coerência inválida: Tipo professor exige Perfil professor.' });
    }
    if (tipo === 'funcionario' && (perfilResolvido === 'aluno' || perfilResolvido === 'professor')) {
      return res.status(400).json({ error: 'Coerência inválida: Tipo funcionário não pode receber Perfil aluno ou professor.' });
    }

    // Validar se o operador logado pode atribuir o perfil de destino
    if (!validarPerfilAlvo(perfilResolvido)) {
      return res.status(403).json({ error: 'Acesso negado: Perfil de acesso não permitido para o seu cargo.' });
    }

    // Resolução dos vínculos institucionais (suporta múltiplos vínculos via bodyVinculos ou fallback único)
    let vinculosParaProcessar = [];
    if (Array.isArray(bodyVinculos) && bodyVinculos.length > 0) {
      vinculosParaProcessar = bodyVinculos;
    } else if (bodyInstId || instId || (!isGroupAdmin && (authUser.instituicao_id || authUser.instituicaoId))) {
      vinculosParaProcessar = [{
        instituicao_id: bodyInstId || instId || authUser.instituicao_id || authUser.instituicaoId,
        unidade_id: bodyUnidadeId != null && bodyUnidadeId !== '' ? Number(bodyUnidadeId) : null,
      }];
    }

    if (vinculosParaProcessar.length === 0) {
      return res.status(400).json({ error: 'Instituição é obrigatória para criar usuário. Adicione ao menos um vínculo.' });
    }

    // Validar cada vínculo
    const vinculosValidados = [];
    const instituicoesVistas = new Set();

    for (const v of vinculosParaProcessar) {
      const vInstId = v.instituicao_id != null && v.instituicao_id !== '' ? Number(v.instituicao_id) : null;
      if (!vInstId) {
        return res.status(400).json({ error: 'ID da instituição não informado em um dos vínculos.' });
      }

      // Restrição de perfil: usuários que não são grupo_admin só podem vincular à sua própria instituição
      if (!isGroupAdmin) {
        const opInstId = Number(authUser.instituicao_id || authUser.instituicaoId || instId);
        if (vInstId !== opInstId) {
          return res.status(403).json({ error: 'Acesso negado: Você não tem permissão para vincular usuários a outras instituições.' });
        }
      }

      // Unicidade de instituição por usuário
      if (instituicoesVistas.has(vInstId)) {
        return res.status(400).json({ error: `A instituição #${vInstId} foi informada mais de uma vez nos vínculos.` });
      }
      instituicoesVistas.add(vInstId);

      // Validação de existência da instituição
      const { data: instCheck, error: errInstCheck } = await supabase
        .from('instituicoes')
        .select('id')
        .eq('id', vInstId)
        .maybeSingle();

      if (errInstCheck || !instCheck) {
        return res.status(400).json({ error: `A instituição #${vInstId} informada no vínculo não existe.` });
      }

      // Validação da Unidade (se informada)
      const vUnidadeIdNum = v.unidade_id != null && v.unidade_id !== '' ? Number(v.unidade_id) : null;
      if (vUnidadeIdNum !== null) {
        const { data: unidadeCheck, error: errUnidadeCheck } = await supabase
          .from('unidades')
          .select('id, instituicao_id')
          .eq('id', vUnidadeIdNum)
          .maybeSingle();

        if (errUnidadeCheck || !unidadeCheck) {
          return res.status(400).json({ error: `A unidade #${vUnidadeIdNum} selecionada não existe.` });
        }
        if (String(unidadeCheck.instituicao_id) !== String(vInstId)) {
          return res.status(400).json({ error: `A unidade #${vUnidadeIdNum} não pertence à instituição #${vInstId}.` });
        }
      }

      vinculosValidados.push({
        instituicao_id: vInstId,
        unidade_id: vUnidadeIdNum,
      });
    }

    const vinculoPrincipal = vinculosValidados[0];
    const finalInstId = vinculoPrincipal.instituicao_id;
    const finalUnidadeId = vinculoPrincipal.unidade_id;

    let insertData = {
      email,
      senha,
      cpf:             cpf || null,
      datanascimento:  dataNascimento || null,
      whatsapp:        whatsapp || null,
      tipo,
      perfil:          perfilResolvido,
      instituicao_id:  finalInstId,
      unidade_id:      finalUnidadeId,
      status:          status || 'ativo',
    };

    // Tentar inserir primeiro com nomecompleto
    let resInsert = await supabase.from('usuarios').insert({
      ...insertData,
      nomecompleto: nomeCompleto
    }).select('*').single();

    // Se houver erro de coluna inexistente (ex: nomecompleto vs nome), tenta com campo nome
    if (resInsert.error && resInsert.error.message && resInsert.error.message.includes('nomecompleto')) {
      resInsert = await supabase.from('usuarios').insert({
        ...insertData,
        nome: nomeCompleto
      }).select('*').single();
    }

    const { data: novoUser, error: errUser } = resInsert;

    if (errUser) {
      console.error('[POST /api/usuarios] Erro na inserção:', errUser);
      if (errUser.code === '23505') return res.status(409).json({ error: 'CPF ou email já cadastrado' });
      return res.status(500).json({ error: errUser.message || 'Erro ao criar usuário' });
    }

    // Persistir todos os vínculos em usuario_instituicoes
    if (novoUser && novoUser.id && vinculosValidados.length > 0) {
      const insertsVinc = vinculosValidados.map(v => ({
        usuario_id: novoUser.id,
        instituicao_id: v.instituicao_id,
        unidade_id: v.unidade_id,
      }));

      const { error: errVincInsert } = await supabase
        .from('usuario_instituicoes')
        .insert(insertsVinc);

      if (errVincInsert) {
        console.error('[POST /api/usuarios] Erro ao registrar usuario_instituicoes:', errVincInsert);
        // Rollback da criação do usuário para evitar inconsistência/órfão
        await supabase.from('usuarios').delete().eq('id', novoUser.id);
        return res.status(500).json({ error: `Erro ao associar vínculos institucionais: ${errVincInsert.message || 'Falha no banco'}` });
      }
    }

    const { senha: _, ...userNoSenha } = novoUser || {};
    return res.status(201).json({ message: 'Usuário criado com sucesso', usuario: userNoSenha });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const body = req.body || {};

    // 1. Impedir autoelevação de perfil e autodesativação/inativação
    if (String(id) === String(authUser.id)) {
      if (body.perfil && body.perfil !== authUser.perfil) {
        return res.status(403).json({ error: 'Acesso negado: você não pode alterar seu próprio perfil.' });
      }
      if (body.tipo && body.tipo !== authUser.tipo) {
        return res.status(403).json({ error: 'Acesso negado: você não pode alterar seu próprio tipo.' });
      }
      if (body.status && body.status === 'inativo') {
        return res.status(403).json({ error: 'Acesso negado: você não pode desativar sua própria conta.' });
      }
    }

    // Carregar o registro existente para validar que o operador não está alterando um usuário de perfil superior
    const { data: originalUser, error: checkError } = await supabase
      .from('usuarios')
      .select('id, perfil, tipo, instituicao_id, unidade_id')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !originalUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const originalPerfil = originalUser.perfil || originalUser.tipo;
    if (!validarPerfilAlvo(originalPerfil)) {
      return res.status(403).json({ error: 'Acesso negado: Você não possui privilégios para alterar este usuário.' });
    }

    // Se estiver atualizando tipo e/ou perfil, validar a coerência combinatória
    const tipoAlvo = body.tipo || originalUser.tipo;
    const perfilAlvo = body.perfil || originalUser.perfil;

    if (tipoAlvo === 'aluno' && perfilAlvo !== 'aluno') {
      return res.status(400).json({ error: 'Coerência inválida: Tipo aluno exige Perfil aluno.' });
    }
    if (tipoAlvo === 'professor' && perfilAlvo !== 'professor') {
      return res.status(400).json({ error: 'Coerência inválida: Tipo professor exige Perfil professor.' });
    }
    if (tipoAlvo === 'funcionario' && (perfilAlvo === 'aluno' || perfilAlvo === 'professor')) {
      return res.status(400).json({ error: 'Coerência inválida: Tipo funcionário não pode receber Perfil aluno ou professor.' });
    }

    // Se estiver atualizando o perfil, validar se o operador possui permissão
    if (body.perfil && !validarPerfilAlvo(body.perfil)) {
      return res.status(403).json({ error: 'Acesso negado: Perfil de acesso não permitido para o seu cargo.' });
    }

    // ── FASE 7.2.3: Campos cadastrais enviados para a RPC ────────────────────
    // A coluna pode se chamar "nomecompleto" ou "nome" conforme a migration.
    // Enviamos ambas as variantes ao JSONB; a RPC aplica apenas a que existir.
    const camposCadastrais = {};
    if (body.nomeCompleto) {
      camposCadastrais.nomecompleto = body.nomeCompleto;
      camposCadastrais.nome         = body.nomeCompleto; // fallback caso coluna seja "nome"
    }
    if (body.email)          camposCadastrais.email          = body.email;
    if (body.cpf)            camposCadastrais.cpf            = body.cpf;
    if (body.dataNascimento) camposCadastrais.datanascimento = body.dataNascimento;
    if (body.whatsapp)       camposCadastrais.whatsapp       = body.whatsapp;
    if (body.tipo)           camposCadastrais.tipo           = body.tipo;
    if (body.perfil)         camposCadastrais.perfil         = body.perfil;
    if (body.status)         camposCadastrais.status         = body.status;

    const { vinculos: bodyVinculos } = body;
    const usarRpc = bodyVinculos !== undefined;

    if (usarRpc) {
      // ── Caminho transacional via RPC ────────────────────────────────────────
      if (!Array.isArray(bodyVinculos)) {
        return res.status(400).json({ error: 'Formato inválido para vinculos: esperava-se um array.' });
      }

      const opInstId = isGroupAdmin
        ? null
        : (authUser.instituicao_id || authUser.instituicaoId || null);

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'fn_sincronizar_vinculos_usuario',
        {
          p_usuario_id:              Number(id),
          p_is_grupo_admin:          isGroupAdmin,
          p_operador_instituicao_id: opInstId,
          p_campos_cadastrais:       camposCadastrais,
          p_vinculos:                bodyVinculos,
        }
      );

      if (rpcError) {
        console.error('[PUT /api/usuarios] Erro na RPC fn_sincronizar_vinculos_usuario:', rpcError);
        // Mapear prefixos semânticos da RPC para respostas HTTP adequadas
        const msg = rpcError.message || '';
        if (msg.includes('USUARIO_NAO_ENCONTRADO')) {
          return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        if (
          msg.includes('VINCULO_SEM_INSTITUICAO') ||
          msg.includes('INSTITUICAO_DUPLICADA') ||
          msg.includes('INSTITUICAO_NAO_ENCONTRADA') ||
          msg.includes('UNIDADE_NAO_ENCONTRADA') ||
          msg.includes('UNIDADE_INSTITUICAO_INVALIDA')
        ) {
          return res.status(400).json({ error: msg });
        }
        if (msg.includes('USUARIO_SEM_VINCULO')) {
          return res.status(400).json({ error: 'O usuário deve possuir ao menos um vínculo institucional.' });
        }
        if (msg.includes('OPERADOR_SEM_INSTITUICAO')) {
          return res.status(403).json({ error: 'Instituição do operador não definida para sincronizar vínculos.' });
        }
        return res.status(500).json({ error: `Erro ao sincronizar vínculos: ${msg}` });
      }

      // Buscar o usuário atualizado para retornar ao cliente
      const { data: usuarioAtualizado } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      const { senha: _s, ...userNoSenha } = usuarioAtualizado || {};
      return res.status(200).json({ message: 'Usuário atualizado com sucesso', usuario: userNoSenha });

    } else {
      // ── Caminho legado: sem body.vinculos ────────────────────────────────────
      // Mantém o fluxo REST separado para requisições que não enviam vínculos.
      const updates = { ...camposCadastrais };

      let resUpdate = await supabase.from('usuarios').update(updates).eq('id', id).select('*').single();
      if (resUpdate.error && resUpdate.error.message && resUpdate.error.message.includes('nomecompleto')) {
        // Tentar com coluna "nome" caso "nomecompleto" não exista
        const updatesAlt = { ...updates };
        if (updatesAlt.nomecompleto) {
          delete updatesAlt.nomecompleto;
        }
        resUpdate = await supabase.from('usuarios').update(updatesAlt).eq('id', id).select('*').single();
      }
      const { data, error } = resUpdate;
      if (error) return res.status(500).json({ error: error.message || 'Erro ao atualizar usuário' });

      // Fallback legado: body.instituicao_id / body.unidade_id avulsos
      if (body.instituicao_id !== undefined || body.unidade_id !== undefined) {
        const targetInstId = isGroupAdmin && body.instituicao_id
          ? Number(body.instituicao_id)
          : Number(authUser.instituicao_id || authUser.instituicaoId || originalUser.instituicao_id);

        if (targetInstId) {
          const unidadeIdNum = body.unidade_id != null && body.unidade_id !== '' ? Number(body.unidade_id) : null;
          if (unidadeIdNum !== null) {
            const { data: unidCheck } = await supabase
              .from('unidades')
              .select('id, instituicao_id')
              .eq('id', unidadeIdNum)
              .maybeSingle();

            if (unidCheck && String(unidCheck.instituicao_id) === String(targetInstId)) {
              await supabase
                .from('usuario_instituicoes')
                .upsert({
                  usuario_id:     Number(id),
                  instituicao_id: targetInstId,
                  unidade_id:     unidadeIdNum,
                  updated_at:     new Date().toISOString(),
                }, { onConflict: 'usuario_id,instituicao_id' });
            }
          } else {
            await supabase
              .from('usuario_instituicoes')
              .upsert({
                usuario_id:     Number(id),
                instituicao_id: targetInstId,
                unidade_id:     null,
                updated_at:     new Date().toISOString(),
              }, { onConflict: 'usuario_id,instituicao_id' });
          }
        }
      }

      const { senha: _, ...userNoSenha } = data || {};
      return res.status(200).json({ message: 'Usuário atualizado com sucesso', usuario: userNoSenha });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    // 2. Impedir autoexclusão
    if (String(id) === String(authUser.id)) {
      return res.status(403).json({ error: 'Acesso negado: você não pode excluir a sua própria conta.' });
    }

    const { data: originalUser, error: checkError } = await supabase
      .from('usuarios')
      .select('perfil, tipo')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !originalUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const originalPerfil = originalUser.perfil || originalUser.tipo;
    if (!validarPerfilAlvo(originalPerfil)) {
      return res.status(403).json({ error: 'Acesso negado: Você não possui privilégios para excluir este usuário.' });
    }

    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Usuário deletado com sucesso' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Método ${req.method} não permitido` });
}

