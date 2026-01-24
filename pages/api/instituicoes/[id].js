/**
 * API de Instituição Individual
 * Endpoints para operações específicas em uma instituição (GET, PUT, DELETE)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID não informado' });
  }

  try {
    // GET - Obter uma instituição específica
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('instituicoes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Instituição não encontrada' });
      
      return res.status(200).json(data);
    }

    // PUT - Atualizar instituição
    if (method === 'PUT') {
      const { nome, cnpj, email, telefone, endereco, cidade, estado, cep, website, ativa, descricao } = req.body;

      if (!nome || nome.trim() === '') {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const { data, error } = await supabase
        .from('instituicoes')
        .update({
          nome: nome.trim(),
          cnpj: cnpj || null,
          email: email || null,
          telefone: telefone || null,
          endereco: endereco || null,
          cidade: cidade || null,
          estado: estado || null,
          cep: cep || null,
          website: website || null,
          ativa: ativa !== undefined ? ativa : true,
          descricao: descricao || null
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Instituição não encontrada' });
      }

      return res.status(200).json(data[0]);
    }

    // DELETE - Deletar instituição
    if (method === 'DELETE') {
      const { error } = await supabase
        .from('instituicoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ message: 'Instituição deletada com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de instituição:', error);
    return res.status(500).json({ error: error.message });
  }
}
