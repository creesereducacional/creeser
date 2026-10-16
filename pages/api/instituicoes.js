/**
 * API de Instituições
 * Endpoints para CRUD de instituições do grupo educacional
 */

import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  requirePerfil,
  hasPerfil,
  resolveContextoUsuario,
  getUserVinculos,
} from '../../lib/auth-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { method } = req;

  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;

    // GET - Listar instituições autorizadas para o usuário logado
    if (method === 'GET') {
      const isGrupoAdmin = hasPerfil(authUser, ['grupo_admin']) || authUser.is_superadmin;

      if (isGrupoAdmin) {
        const { data, error } = await supabase
          .from('instituicoes')
          .select('*')
          .order('ordem', { ascending: true })
          .order('nome', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data || []);
      }

      // Usuário comum: consultar vínculos para retornar todas as instituições às quais tem acesso
      let instIds = [];
      try {
        const vinculos = await getUserVinculos(authUser.id);
        instIds = [...new Set((vinculos || []).map(v => v.instituicao_id).filter(Boolean))];
      } catch (e) {
        console.warn('[instituicoes] Falha ao buscar vinculos:', e.message);
      }

      if (instIds.length === 0) {
        const ctx = await resolveContextoUsuario(req, authUser);
        const resolvedId = ctx?.instituicaoId || authUser.instituicao_id;
        if (resolvedId) instIds = [resolvedId];
      }

      if (instIds.length === 0) {
        return res.status(200).json([]);
      }

      const { data, error } = await supabase
        .from('instituicoes')
        .select('*')
        .in('id', instIds)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (!requirePerfil(authUser, res, ['grupo_admin'])) {
      return;
    }

    // POST - Criar nova instituição
    if (method === 'POST') {
      const { nome, cnpj, email, telefone, endereco, cidade, estado, cep, website, ativa, descricao } = req.body;
      const codMec = req.body?.codMec || req.body?.cod_mec || null;
      const tipoInstituicao = req.body?.tipo_instituicao || req.body?.tipoInstituicao || null;

      if (!nome || nome.trim() === '') {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const { data, error } = await supabase
        .from('instituicoes')
        .insert([
          {
            nome: nome.trim(),
            cod_mec: codMec || null,
            tipo_instituicao: tipoInstituicao || null,
            cnpj: cnpj || null,
            email: email || null,
            telefone: telefone || null,
            endereco: endereco || null,
            cidade: cidade || null,
            estado: estado || null,
            cep: cep || null,
            website: website || null,
            ativa: ativa !== undefined ? ativa : true,
            descricao: descricao || null,
            ordem: 0
          }
        ])
        .select();

      if (error) throw error;
      return res.status(201).json(data[0]);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de instituições:', error);
    return res.status(500).json({ error: error.message });
  }
}
