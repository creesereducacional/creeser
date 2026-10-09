import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmlwgvrtissssknqpvbg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export const cursosFilePath = path.join(process.cwd(), 'data', 'cursos.json');

/**
 * Lê cursos do arquivo data/cursos.json local como storage de fallback
 */
export function lerCursosLocal() {
  try {
    if (!fs.existsSync(cursosFilePath)) {
      const dataDir = path.dirname(cursosFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(cursosFilePath, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const data = fs.readFileSync(cursosFilePath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler cursos EAD do JSON local:', error);
    return [];
  }
}

/**
 * Salva cursos no arquivo data/cursos.json local
 */
export function salvarCursosLocal(cursos) {
  try {
    const dataDir = path.dirname(cursosFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(cursosFilePath, JSON.stringify(cursos, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar cursos EAD no JSON local:', error);
    return false;
  }
}

/**
 * Lê árvore completa de cursos EAD do Supabase (quando as tabelas ead_ estiverem criadas)
 */
export async function lerCursosSupabase(instituicaoId = null) {
  if (!supabaseAdmin) return null;
  try {
    let query = supabaseAdmin
      .from('ead_cursos')
      .select(`
        id, instituicao_id, titulo, descricao, categoria, carga_horaria, thumbnail_url, video_apresentacao_url, ativo, created_at,
        ead_modulos (
          id, titulo, descricao, ordem,
          ead_aulas (
            id, titulo, descricao, video_url, duracao_minutos, ordem,
            ead_materiais ( id, titulo, tipo, url ),
            ead_questoes ( id, enunciado, opcoes, resposta_correta, explicacao, ordem )
          )
        ),
        ead_avaliacoes (
          id, titulo, descricao, nota_minima, duracao_minutos,
          ead_questoes ( id, enunciado, opcoes, resposta_correta, explicacao, ordem )
        )
      `)
      .order('id', { ascending: false });

    if (instituicaoId) {
      query = query.or(`instituicao_id.eq.${instituicaoId},instituicao_id.is.null`);
    }

    const { data: dbCursos, error } = await query;

    if (error) {
      // Se a tabela ainda não existir no banco (código 42P01 ou PGRST205), retorna null para acionar fallback
      return null;
    }

    if (!Array.isArray(dbCursos)) return null;

    return dbCursos.map(c => {
      const avalDb = Array.isArray(c.ead_avaliacoes) ? c.ead_avaliacoes[0] : c.ead_avaliacoes;
      let avaliacaoObj = null;
      if (avalDb) {
        const questoesOrdenadas = (avalDb.ead_questoes || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        avaliacaoObj = {
          id: avalDb.id,
          titulo: avalDb.titulo,
          descricao: avalDb.descricao,
          notaMinima: avalDb.nota_minima,
          duracaoMinutos: avalDb.duracao_minutos,
          questoes: questoesOrdenadas.map(q => ({
            id: q.id,
            enunciado: q.enunciado,
            opcoes: Array.isArray(q.opcoes) ? q.opcoes : [],
            respostaCorreta: q.resposta_correta || 0,
            explicacao: q.explicacao || ''
          }))
        };
      }

      const modulosOrdenados = (c.ead_modulos || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      const modulosFormatados = modulosOrdenados.map(m => {
        const aulasOrdenadas = (m.ead_aulas || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        const aulasFormatadas = aulasOrdenadas.map(a => {
          const materiaisFormatados = (a.ead_materiais || []).map(mat => ({
            id: mat.id,
            titulo: mat.titulo,
            tipo: mat.tipo || 'pdf',
            url: mat.url
          }));

          const questoesFormatadas = (a.ead_questoes || []).sort((x, y) => (x.ordem || 0) - (y.ordem || 0)).map(q => ({
            id: q.id,
            enunciado: q.enunciado,
            opcoes: Array.isArray(q.opcoes) ? q.opcoes : [],
            respostaCorreta: q.resposta_correta || 0,
            explicacao: q.explicacao || ''
          }));

          return {
            id: a.id,
            titulo: a.titulo,
            descricao: a.descricao,
            videoUrl: a.video_url,
            duracao: String(a.duracao_minutos || 0),
            ordem: a.ordem,
            materiais: materiaisFormatados,
            questoes: questoesFormatadas
          };
        });

        return {
          id: m.id,
          titulo: m.titulo,
          descricao: m.descricao,
          ordem: m.ordem,
          aulas: aulasFormatadas
        };
      });

      return {
        id: c.id,
        instituicaoId: c.instituicao_id,
        titulo: c.titulo,
        descricao: c.descricao,
        categoria: c.categoria || 'Geral',
        cargaHoraria: String(c.carga_horaria || 15),
        thumbnail: c.thumbnail_url || '',
        videoApresentacao: c.video_apresentacao_url || '',
        ativo: c.ativo !== false,
        dataCriacao: c.created_at,
        modulos: modulosFormatados,
        avaliacao: avaliacaoObj
      };
    });
  } catch (err) {
    console.error('Erro na leitura de cursos EAD do Supabase:', err);
    return null;
  }
}

/**
 * Retorna todos os cursos EAD ativos ou totais.
 * Prioridade: Supabase PostgreSQL (fonte definitiva); Fallback resiliente: data/cursos.json
 */
export async function obterCursosEAD(apenasAtivos = false, instituicaoId = null) {
  const dbCursos = await lerCursosSupabase(instituicaoId);
  if (dbCursos !== null) {
    if (apenasAtivos) {
      return dbCursos.filter(c => c.ativo !== false);
    }
    return dbCursos;
  }

  // Fallback para arquivo JSON
  const cursos = lerCursosLocal();
  if (apenasAtivos) {
    return cursos.filter(c => c.ativo !== false);
  }
  return cursos;
}
