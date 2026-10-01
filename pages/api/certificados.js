import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

const dataDir = path.join(process.cwd(), 'data');
const certificadosFile = path.join(dataDir, 'certificados.json');

const lerCertificadosLocal = () => {
  try {
    if (fs.existsSync(certificadosFile)) {
      const data = fs.readFileSync(certificadosFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao ler certificados locais:', err);
  }
  return [];
};

const salvarCertificadosLocal = (certificados) => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(certificadosFile, JSON.stringify(certificados, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar certificados locais:', err);
  }
};

const gerarCodigoValidacao = () => {
  const ano = new Date().getFullYear();
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = '';
  for (let i = 0; i < 6; i++) {
    hash += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return `CREESER-${ano}-${hash}`;
};

export default async function handler(req, res) {
  const { method, query } = req;

  // ── GET: Validar por código de autenticidade ou listar certificados do aluno ─
  if (method === 'GET') {
    const { codigo, alunoId, cursoId } = query;

    try {
      // 1. Busca por Código de Autenticidade (Público)
      if (codigo) {
        const codigoFormatado = String(codigo).trim().toUpperCase();

        if (supabase) {
          try {
            const { data: certDb } = await supabase
              .from('certificados')
              .select('*')
              .ilike('codigo_validacao', codigoFormatado)
              .maybeSingle();

            if (certDb) {
              return res.status(200).json({
                id: certDb.id,
                codigoValidacao: certDb.codigo_validacao,
                alunoId: certDb.aluno_id,
                alunoNome: certDb.nome_aluno_snapshot || certDb.aluno_nome,
                cursoId: certDb.curso_id,
                cursoTitulo: certDb.titulo_curso_snapshot || certDb.curso_titulo,
                cargaHoraria: String(certDb.carga_horaria || 40),
                dataEmissao: certDb.emitido_em || certDb.created_at,
                emissor: 'Grupo Educacional CREESER — Portal Acadêmico',
              });
            }
          } catch (e) {}
        }

        // Fallback local
        const certsLocal = lerCertificadosLocal();
        const certLocal = certsLocal.find(
          (c) => String(c.codigoValidacao).toUpperCase() === codigoFormatado
        );
        if (certLocal) {
          return res.status(200).json(certLocal);
        }

        return res.status(404).json({ error: 'Certificado não encontrado ou código de validação inválido.' });
      }

      // 2. Busca por alunoId e cursoId
      if (alunoId && cursoId) {
        if (supabase) {
          try {
            const { data: certDb } = await supabase
              .from('certificados')
              .select('*')
              .eq('aluno_id', alunoId)
              .eq('curso_id', cursoId)
              .maybeSingle();

            if (certDb) {
              return res.status(200).json({
                id: certDb.id,
                codigoValidacao: certDb.codigo_validacao,
                alunoId: certDb.aluno_id,
                alunoNome: certDb.nome_aluno_snapshot || certDb.aluno_nome,
                cursoId: certDb.curso_id,
                cursoTitulo: certDb.titulo_curso_snapshot || certDb.curso_titulo,
                cargaHoraria: String(certDb.carga_horaria || 40),
                dataEmissao: certDb.emitido_em || certDb.created_at,
                emissor: 'Grupo Educacional CREESER — Portal Acadêmico',
              });
            }
          } catch (e) {}
        }

        const certsLocal = lerCertificadosLocal();
        const certLocal = certsLocal.find(
          (c) => String(c.alunoId) === String(alunoId) && String(c.cursoId) === String(cursoId)
        );
        return res.status(200).json(certLocal || null);
      }

      // 3. Busca por alunoId (todos os certificados do aluno)
      if (alunoId) {
        if (supabase) {
          try {
            const { data: certsDb } = await supabase
              .from('certificados')
              .select('*')
              .eq('aluno_id', alunoId)
              .order('emitido_em', { ascending: false });

            if (certsDb && certsDb.length > 0) {
              const formatados = certsDb.map((c) => ({
                id: c.id,
                codigoValidacao: c.codigo_validacao,
                alunoId: c.aluno_id,
                alunoNome: c.nome_aluno_snapshot || c.aluno_nome,
                cursoId: c.curso_id,
                cursoTitulo: c.titulo_curso_snapshot || c.curso_titulo,
                cargaHoraria: String(c.carga_horaria || 40),
                dataEmissao: c.emitido_em || c.created_at,
                emissor: 'Grupo Educacional CREESER — Portal Acadêmico',
              }));
              return res.status(200).json(formatados);
            }
          } catch (e) {}
        }

        const certsLocal = lerCertificadosLocal();
        const filtrados = certsLocal.filter((c) => String(c.alunoId) === String(alunoId));
        return res.status(200).json(filtrados);
      }
    } catch (err) {
      console.error('Erro na consulta de certificados:', err);
    }

    const certsLocal = lerCertificadosLocal();
    return res.status(200).json(certsLocal);
  }

  // ── POST: Emitir / Registrar Certificado Digital ───────────────────────────
  if (method === 'POST') {
    const { alunoId, alunoNome, cursoId, cursoTitulo, cargaHoraria } = req.body || {};

    if (!alunoId || !alunoNome || !cursoId || !cursoTitulo) {
      return res.status(400).json({ error: 'Dados incompletos para emissão do certificado.' });
    }

    try {
      // 1. Verificar se já existe certificado emitido no Supabase
      if (supabase) {
        try {
          const { data: certExistente } = await supabase
            .from('certificados')
            .select('*')
            .eq('aluno_id', alunoId)
            .eq('curso_id', cursoId)
            .maybeSingle();

          if (certExistente) {
            return res.status(200).json({
              id: certExistente.id,
              codigoValidacao: certExistente.codigo_validacao,
              alunoId: certExistente.aluno_id,
              alunoNome: certExistente.nome_aluno_snapshot || certExistente.aluno_nome,
              cursoId: certExistente.curso_id,
              cursoTitulo: certExistente.titulo_curso_snapshot || certExistente.curso_titulo,
              cargaHoraria: String(certExistente.carga_horaria || cargaHoraria || 40),
              dataEmissao: certExistente.emitido_em || certExistente.created_at,
              emissor: 'Grupo Educacional CREESER — Portal Acadêmico',
            });
          }
        } catch (e) {}
      }

      // Verificar no fallback local
      const certsLocal = lerCertificadosLocal();
      const existenteLocal = certsLocal.find(
        (c) => String(c.alunoId) === String(alunoId) && String(c.cursoId) === String(cursoId)
      );
      if (existenteLocal) {
        return res.status(200).json(existenteLocal);
      }

      // 2. Gerar novo certificado
      const novoCodigo = gerarCodigoValidacao();
      const dataEmissao = new Date().toISOString();
      const novoCertificado = {
        id: Date.now(),
        codigoValidacao: novoCodigo,
        alunoId: String(alunoId),
        alunoNome: String(alunoNome),
        cursoId: String(cursoId),
        cursoTitulo: String(cursoTitulo),
        cargaHoraria: String(cargaHoraria || 40),
        dataEmissao,
        emissor: 'Grupo Educacional CREESER — Portal Acadêmico',
      };

      // Tentar salvar no Supabase
      if (supabase) {
        try {
          await supabase.from('certificados').insert({
            codigo_validacao: novoCodigo,
            aluno_id: alunoId,
            curso_id: cursoId,
            nome_aluno_snapshot: alunoNome,
            titulo_curso_snapshot: cursoTitulo,
            carga_horaria: Number(cargaHoraria || 40),
            emitido_em: dataEmissao,
          });
        } catch (err) {
          console.error('Erro ao registrar certificado no Supabase:', err);
        }
      }

      // Salvar no fallback local
      certsLocal.push(novoCertificado);
      salvarCertificadosLocal(certsLocal);

      return res.status(201).json(novoCertificado);
    } catch (err) {
      console.error('Erro ao emitir certificado:', err);
      return res.status(500).json({ error: 'Erro interno ao processar a emissão do certificado.' });
    }
  }

  return res.status(405).json({ error: `Método ${method} não permitido.` });
}
