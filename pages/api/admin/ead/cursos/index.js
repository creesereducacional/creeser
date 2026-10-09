import { requireAuth, requirePerfil, resolveInstituicaoId } from '@/lib/auth-server';
import { 
  obterCursosEAD, 
  lerCursosLocal, 
  salvarCursosLocal, 
  lerCursosSupabase, 
  supabaseAdmin 
} from '@/lib/ead/cursosStorage';

export default async function handler(req, res) {
  // 1. Autenticação e Autorização administrativa CREESER
  const user = requireAuth(req, res);
  if (!user) return;

  if (!requirePerfil(user, res, ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'])) {
    return;
  }

  const instituicaoId = resolveInstituicaoId(req, user, { allowAll: true });
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        const cursos = await obterCursosEAD(false, instituicaoId);
        return res.status(200).json(cursos);
      }

      case 'POST': {
        const { titulo, descricao, categoria, cargaHoraria, thumbnail, videoApresentacao, ativo } = req.body || {};

        if (!titulo || !String(titulo).trim()) {
          return res.status(400).json({ error: 'O título do curso é obrigatório' });
        }

        const payloadCurso = {
          titulo: String(titulo).trim(),
          descricao: descricao ? String(descricao).trim() : '',
          categoria: categoria ? String(categoria).trim() : 'Geral',
          carga_horaria: parseInt(cargaHoraria) || 15,
          thumbnail_url: thumbnail ? String(thumbnail).trim() : '',
          video_apresentacao_url: videoApresentacao ? String(videoApresentacao).trim() : '',
          ativo: ativo !== false,
          instituicao_id: instituicaoId || null
        };

        // 1. Gravação no Supabase (se as tabelas existirem)
        let novoCursoCriado = null;
        let erroSupabase = null;
        if (supabaseAdmin) {
          try {
            const { data: dbCurso, error: dbErr } = await supabaseAdmin
              .from('ead_cursos')
              .insert(payloadCurso)
              .select('*')
              .single();

            if (!dbErr && dbCurso) {
              novoCursoCriado = {
                id: dbCurso.id,
                instituicaoId: dbCurso.instituicao_id,
                titulo: dbCurso.titulo,
                descricao: dbCurso.descricao,
                categoria: dbCurso.categoria,
                cargaHoraria: String(dbCurso.carga_horaria),
                thumbnail: dbCurso.thumbnail_url,
                videoApresentacao: dbCurso.video_apresentacao_url,
                ativo: dbCurso.ativo,
                dataCriacao: dbCurso.created_at,
                modulos: []
              };
            } else if (dbErr) {
              // Se não for erro de tabela inexistente (ex: erro de conexão, validação, etc.), registrar
              erroSupabase = dbErr;
              if (dbErr.code !== '42P01' && dbErr.code !== 'PGRST205') {
                console.error('Erro ao inserir curso EAD no Supabase:', dbErr);
              }
            }
          } catch (e) {
            erroSupabase = e;
          }
        }

        // 2. Persistência local (mantida sincronizada como espelho e fallback)
        const cursos = lerCursosLocal();
        const cursoParaSalvar = novoCursoCriado || {
          id: Date.now(),
          instituicaoId: instituicaoId || null,
          titulo: payloadCurso.titulo,
          descricao: payloadCurso.descricao,
          categoria: payloadCurso.categoria,
          cargaHoraria: String(payloadCurso.carga_horaria),
          thumbnail: payloadCurso.thumbnail_url,
          videoApresentacao: payloadCurso.video_apresentacao_url,
          ativo: payloadCurso.ativo,
          dataCriacao: new Date().toISOString(),
          modulos: []
        };

        cursos.unshift(cursoParaSalvar);
        salvarCursosLocal(cursos);

        return res.status(201).json(cursoParaSalvar);
      }

      case 'PUT': {
        const { id, action, data } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'ID do curso é obrigatório' });
        }

        // Tentar operar no Supabase se as tabelas estiverem ativas
        let supabaseSucesso = false;
        if (supabaseAdmin) {
          try {
            switch (action) {
              case 'updateCurso': {
                const updates = {};
                if (data?.titulo !== undefined) updates.titulo = String(data.titulo).trim();
                if (data?.descricao !== undefined) updates.descricao = String(data.descricao).trim();
                if (data?.categoria !== undefined) updates.categoria = String(data.categoria).trim();
                if (data?.cargaHoraria !== undefined) updates.carga_horaria = parseInt(data.cargaHoraria) || 15;
                if (data?.thumbnail !== undefined) updates.thumbnail_url = String(data.thumbnail).trim();
                if (data?.videoApresentacao !== undefined) updates.video_apresentacao_url = String(data.videoApresentacao).trim();
                if (data?.ativo !== undefined) updates.ativo = Boolean(data.ativo);

                const { error } = await supabaseAdmin.from('ead_cursos').update(updates).eq('id', id);
                if (!error) supabaseSucesso = true;
                break;
              }

              case 'addModulo': {
                const { error } = await supabaseAdmin.from('ead_modulos').insert({
                  curso_id: id,
                  titulo: String(data?.titulo).trim(),
                  descricao: data?.descricao ? String(data.descricao).trim() : '',
                  ordem: (data?.ordem) || 99
                });
                if (!error) supabaseSucesso = true;
                break;
              }

              case 'updateModulo': {
                const moduloId = data?.moduloId;
                const updates = {};
                if (data?.updates?.titulo || data?.titulo) updates.titulo = String(data?.updates?.titulo || data?.titulo).trim();
                if (data?.updates?.descricao !== undefined || data?.descricao !== undefined) {
                  updates.descricao = String(data?.updates?.descricao ?? data?.descricao).trim();
                }
                const { error } = await supabaseAdmin.from('ead_modulos').update(updates).eq('id', moduloId);
                if (!error) supabaseSucesso = true;
                break;
              }

              case 'deleteModulo': {
                const moduloId = data?.moduloId;
                const { error } = await supabaseAdmin.from('ead_modulos').delete().eq('id', moduloId);
                if (!error) supabaseSucesso = true;
                break;
              }

              case 'addAula': {
                const { error } = await supabaseAdmin.from('ead_aulas').insert({
                  modulo_id: data?.moduloId,
                  titulo: String(data?.titulo).trim(),
                  descricao: data?.descricao ? String(data.descricao).trim() : '',
                  video_url: data?.videoUrl ? String(data.videoUrl).trim() : '',
                  duracao_minutos: parseInt(data?.duracao) || 0,
                  ordem: (data?.ordem) || 99
                });
                if (!error) supabaseSucesso = true;
                break;
              }

              case 'updateAula': {
                const aulaId = data?.aulaId;
                const updates = {};
                if (data?.titulo !== undefined) updates.titulo = String(data.titulo).trim();
                if (data?.descricao !== undefined) updates.descricao = String(data.descricao).trim();
                if (data?.videoUrl !== undefined) updates.video_url = String(data.videoUrl).trim();
                if (data?.duracao !== undefined) updates.duracao_minutos = parseInt(data.duracao) || 0;
                const { error } = await supabaseAdmin.from('ead_aulas').update(updates).eq('id', aulaId);
                if (!error) supabaseSucesso = true;
                break;
              }

              case 'deleteAula': {
                const aulaId = data?.aulaId;
                const { error } = await supabaseAdmin.from('ead_aulas').delete().eq('id', aulaId);
                if (!error) supabaseSucesso = true;
                break;
              }

              case 'addMaterial': {
                const { error } = await supabaseAdmin.from('ead_materiais').insert({
                  aula_id: data?.aulaId,
                  titulo: String(data?.titulo).trim(),
                  tipo: data?.tipo ? String(data.tipo).trim() : 'pdf',
                  url: String(data?.url).trim()
                });
                if (!error) supabaseSucesso = true;
                break;
              }

              case 'deleteMaterial': {
                const materialId = data?.materialId;
                const { error } = await supabaseAdmin.from('ead_materiais').delete().eq('id', materialId);
                if (!error) supabaseSucesso = true;
                break;
              }
            }
          } catch (e) {
            // Segue para atualização local
          }
        }

        // Atualizar também no JSON local (garante consistência contínua e funcionamento local)
        const cursos = lerCursosLocal();
        const cursoIndex = cursos.findIndex(c => String(c.id) === String(id));
        if (cursoIndex !== -1) {
          const curso = cursos[cursoIndex];
          if (!curso.modulos) curso.modulos = [];

          switch (action) {
            case 'updateCurso': {
              cursos[cursoIndex] = {
                ...curso,
                titulo: data?.titulo !== undefined ? String(data.titulo).trim() : curso.titulo,
                descricao: data?.descricao !== undefined ? String(data.descricao).trim() : curso.descricao,
                categoria: data?.categoria !== undefined ? String(data.categoria).trim() : curso.categoria,
                cargaHoraria: data?.cargaHoraria !== undefined ? String(data.cargaHoraria).trim() : curso.cargaHoraria,
                thumbnail: data?.thumbnail !== undefined ? String(data.thumbnail).trim() : curso.thumbnail,
                videoApresentacao: data?.videoApresentacao !== undefined ? String(data.videoApresentacao).trim() : curso.videoApresentacao,
                ativo: data?.ativo !== undefined ? data.ativo : curso.ativo,
                dataAtualizacao: new Date().toISOString()
              };
              break;
            }

            case 'addModulo': {
              const novoModulo = {
                id: Date.now(),
                titulo: String(data?.titulo).trim(),
                descricao: data?.descricao ? String(data.descricao).trim() : '',
                ordem: curso.modulos.length + 1,
                aulas: []
              };
              curso.modulos.push(novoModulo);
              break;
            }

            case 'updateModulo': {
              const modulo = curso.modulos.find(m => String(m.id) === String(data?.moduloId));
              if (modulo) {
                const updates = data.updates || data;
                if (updates.titulo) modulo.titulo = String(updates.titulo).trim();
                if (updates.descricao !== undefined) modulo.descricao = String(updates.descricao).trim();
              }
              break;
            }

            case 'deleteModulo': {
              curso.modulos = curso.modulos.filter(m => String(m.id) !== String(data?.moduloId));
              curso.modulos.forEach((m, idx) => { m.ordem = idx + 1; });
              break;
            }

            case 'reorderModulos': {
              if (Array.isArray(data?.modulos)) {
                curso.modulos = data.modulos.map((m, idx) => ({ ...m, ordem: idx + 1 }));
              }
              break;
            }

            case 'addAula': {
              const modulo = curso.modulos.find(m => String(m.id) === String(data?.moduloId));
              if (modulo) {
                if (!modulo.aulas) modulo.aulas = [];
                const novaAula = {
                  id: Date.now(),
                  titulo: String(data?.titulo).trim(),
                  descricao: data?.descricao ? String(data.descricao).trim() : '',
                  videoUrl: data?.videoUrl ? String(data.videoUrl).trim() : '',
                  duracao: String(data?.duracao || '0'),
                  ordem: modulo.aulas.length + 1,
                  materiais: [],
                  questoes: []
                };
                modulo.aulas.push(novaAula);
              }
              break;
            }

            case 'updateAula': {
              for (const m of curso.modulos) {
                const a = (m.aulas || []).find(aula => String(aula.id) === String(data?.aulaId));
                if (a) {
                  if (data.titulo) a.titulo = String(data.titulo).trim();
                  if (data.descricao !== undefined) a.descricao = String(data.descricao).trim();
                  if (data.videoUrl !== undefined) a.videoUrl = String(data.videoUrl).trim();
                  if (data.duracao !== undefined) a.duracao = String(data.duracao).trim();
                  break;
                }
              }
              break;
            }

            case 'deleteAula': {
              for (const m of curso.modulos) {
                const totalAntes = (m.aulas || []).length;
                m.aulas = (m.aulas || []).filter(a => String(a.id) !== String(data?.aulaId));
                if (m.aulas.length !== totalAntes) {
                  m.aulas.forEach((a, idx) => { a.ordem = idx + 1; });
                  break;
                }
              }
              break;
            }

            case 'reorderAulas': {
              const modulo = curso.modulos.find(m => String(m.id) === String(data?.moduloId));
              if (modulo && Array.isArray(data?.aulas)) {
                modulo.aulas = data.aulas.map((a, idx) => ({ ...a, ordem: idx + 1 }));
              }
              break;
            }

            case 'addMaterial': {
              for (const m of curso.modulos) {
                const a = (m.aulas || []).find(aula => String(aula.id) === String(data?.aulaId));
                if (a) {
                  if (!a.materiais) a.materiais = [];
                  a.materiais.push({
                    id: Date.now(),
                    titulo: String(data.titulo).trim(),
                    tipo: data.tipo ? String(data.tipo).trim() : 'pdf',
                    url: String(data.url).trim()
                  });
                  break;
                }
              }
              break;
            }

            case 'deleteMaterial': {
              for (const m of curso.modulos) {
                const a = (m.aulas || []).find(aula => String(aula.id) === String(data?.aulaId));
                if (a && a.materiais) {
                  a.materiais = a.materiais.filter(mat => String(mat.id) !== String(data?.materialId));
                  break;
                }
              }
              break;
            }
          }

          salvarCursosLocal(cursos);
        }

        // Se o Supabase foi atualizado com sucesso, recarregar a árvore oficial atualizada do banco
        if (supabaseSucesso) {
          const dbCursos = await lerCursosSupabase(instituicaoId);
          const cursoDbAtualizado = dbCursos?.find(c => String(c.id) === String(id));
          if (cursoDbAtualizado) {
            return res.status(200).json(cursoDbAtualizado);
          }
        }

        if (cursoIndex !== -1) {
          return res.status(200).json(cursos[cursoIndex]);
        }

        return res.status(404).json({ error: 'Curso EAD não encontrado' });
      }

      case 'DELETE': {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'ID do curso é obrigatório' });
        }

        if (supabaseAdmin) {
          try {
            await supabaseAdmin.from('ead_cursos').delete().eq('id', id);
          } catch (e) {}
        }

        const cursos = lerCursosLocal();
        const novosCursos = cursos.filter(c => String(c.id) !== String(id));
        salvarCursosLocal(novosCursos);

        return res.status(200).json({ success: true, message: 'Curso excluído com sucesso' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error('Erro na API administrativa de cursos EAD:', error);
    return res.status(500).json({ error: 'Erro interno ao processar requisição de cursos EAD' });
  }
}
