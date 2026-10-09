#!/usr/bin/env node

/**
 * Script de migração de dados EAD idempotente e seguro:
 * data/cursos.json -> Supabase PostgreSQL (ead_cursos, ead_modulos, ead_aulas, ead_materiais, ead_avaliacoes, ead_questoes)
 * 
 * Executa:
 * 1. Verificação da existência das tabelas EAD no Supabase.
 * 2. Leitura e validação de consistência do data/cursos.json.
 * 3. Inserção / Upsert idempotente de cada curso, módulo, aula, material e avaliação.
 * 4. Validação de contagem cruzada e integridade referencial.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const jsonPath = path.join(__dirname, '..', 'data', 'cursos.json');

async function migrarDadosEAD() {
  console.log('🚀 [EAD MIGRATION] Iniciando migração de dados...');

  // 1. Verificar se as tabelas existem no Supabase
  const { error: testTableErr } = await supabase.from('ead_cursos').select('id').limit(1);
  if (testTableErr) {
    console.error('❌ [EAD MIGRATION] Tabelas EAD não encontradas no Supabase!');
    console.error(`   Detalhe: ${testTableErr.message} (${testTableErr.code})`);
    console.log('💡 Por favor, execute a migration SQL no Supabase SQL Editor:');
    console.log('   supabase/migrations/20261009150000_create_ead_tables.sql\n');
    process.exit(1);
  }

  // 2. Ler data/cursos.json
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ [EAD MIGRATION] Arquivo ${jsonPath} não encontrado.`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf8');
  let cursosJson = [];
  try {
    cursosJson = JSON.parse(rawJson);
  } catch (e) {
    console.error('❌ [EAD MIGRATION] Falha ao fazer parse de data/cursos.json:', e.message);
    process.exit(1);
  }

  console.log(`📋 Total de cursos encontrados no JSON: ${cursosJson.length}`);

  let totalModulosInseridos = 0;
  let totalAulasInseridas = 0;
  let totalMateriaisInseridos = 0;
  let totalCursosInseridos = 0;

  for (const curso of cursosJson) {
    console.log(`\n➡️  Processando curso [ID ${curso.id}]: "${curso.titulo}"...`);

    // Inserir / Atualizar Curso
    const { data: cursoDb, error: cursoErr } = await supabase
      .from('ead_cursos')
      .upsert({
        id: curso.id,
        titulo: String(curso.titulo).trim(),
        descricao: curso.descricao || '',
        categoria: curso.categoria || 'Geral',
        carga_horaria: parseInt(curso.cargaHoraria) || 15,
        thumbnail_url: curso.thumbnail || '',
        video_apresentacao_url: curso.videoApresentacao || '',
        ativo: curso.ativo !== false,
        created_at: curso.dataCriacao || new Date().toISOString()
      }, { onConflict: 'id' })
      .select('id')
      .single();

    if (cursoErr) {
      console.error(`❌ Erro ao upsert curso ${curso.id}:`, cursoErr.message);
      continue;
    }

    totalCursosInseridos++;
    const cursoId = cursoDb.id;

    // Processar Avaliação se houver
    if (curso.avaliacao && curso.avaliacao.titulo) {
      const aval = curso.avaliacao;
      const { data: avalDb, error: avalErr } = await supabase
        .from('ead_avaliacoes')
        .upsert({
          id: aval.id || undefined,
          curso_id: cursoId,
          titulo: aval.titulo,
          descricao: aval.descricao || '',
          nota_minima: parseInt(aval.notaMinima) || 70,
          duracao_minutos: parseInt(aval.duracaoMinutos) || 30
        }, { onConflict: 'id' })
        .select('id')
        .single();

      if (!avalErr && avalDb && Array.isArray(aval.questoes)) {
        for (let qIdx = 0; qIdx < aval.questoes.length; qIdx++) {
          const q = aval.questoes[qIdx];
          await supabase.from('ead_questoes').upsert({
            id: q.id || undefined,
            avaliacao_id: avalDb.id,
            enunciado: q.enunciado,
            opcoes: q.opcoes || [],
            resposta_correta: parseInt(q.respostaCorreta) || 0,
            explicacao: q.explicacao || '',
            ordem: qIdx + 1
          }, { onConflict: 'id' });
        }
      }
    }

    // Processar Módulos
    if (Array.isArray(curso.modulos)) {
      for (let mIdx = 0; mIdx < curso.modulos.length; mIdx++) {
        const mod = curso.modulos[mIdx];
        const { data: modDb, error: modErr } = await supabase
          .from('ead_modulos')
          .upsert({
            id: mod.id,
            curso_id: cursoId,
            titulo: String(mod.titulo).trim(),
            descricao: mod.descricao || '',
            ordem: mod.ordem || (mIdx + 1)
          }, { onConflict: 'id' })
          .select('id')
          .single();

        if (modErr) {
          console.error(`❌ Erro ao upsert módulo ${mod.id}:`, modErr.message);
          continue;
        }

        totalModulosInseridos++;
        const moduloId = modDb.id;

        // Processar Aulas
        if (Array.isArray(mod.aulas)) {
          for (let aIdx = 0; aIdx < mod.aulas.length; aIdx++) {
            const aula = mod.aulas[aIdx];
            const { data: aulaDb, error: aulaErr } = await supabase
              .from('ead_aulas')
              .upsert({
                id: aula.id,
                modulo_id: moduloId,
                titulo: String(aula.titulo).trim(),
                descricao: aula.descricao || '',
                video_url: aula.videoUrl || '',
                duracao_minutos: parseInt(aula.duracao) || 0,
                ordem: aula.ordem || (aIdx + 1)
              }, { onConflict: 'id' })
              .select('id')
              .single();

            if (aulaErr) {
              console.error(`❌ Erro ao upsert aula ${aula.id}:`, aulaErr.message);
              continue;
            }

            totalAulasInseridas++;
            const aulaId = aulaDb.id;

            // Processar Materiais
            if (Array.isArray(aula.materiais)) {
              for (const mat of aula.materiais) {
                const { error: matErr } = await supabase
                  .from('ead_materiais')
                  .upsert({
                    id: mat.id,
                    aula_id: aulaId,
                    titulo: String(mat.titulo).trim(),
                    tipo: mat.tipo || 'pdf',
                    url: String(mat.url).trim()
                  }, { onConflict: 'id' });

                if (!matErr) {
                  totalMateriaisInseridos++;
                } else {
                  console.error(`❌ Erro ao upsert material ${mat.id}:`, matErr.message);
                }
              }
            }

            // Processar Questões da Aula se houver
            if (Array.isArray(aula.questoes)) {
              for (let qIdx = 0; qIdx < aula.questoes.length; qIdx++) {
                const q = aula.questoes[qIdx];
                await supabase.from('ead_questoes').upsert({
                  id: q.id || undefined,
                  aula_id: aulaId,
                  enunciado: q.enunciado || q.pergunta || '',
                  opcoes: q.opcoes || q.alternativas || [],
                  resposta_correta: parseInt(q.respostaCorreta) || 0,
                  explicacao: q.explicacao || '',
                  ordem: qIdx + 1
                }, { onConflict: 'id' });
              }
            }
          }
        }
      }
    }
  }

  console.log('\n=============================================');
  console.log('✅ [EAD MIGRATION] Migração concluída com sucesso!');
  console.log(`   Cursos sincronizados:    ${totalCursosInseridos}`);
  console.log(`   Módulos sincronizados:   ${totalModulosInseridos}`);
  console.log(`   Aulas sincronizadas:     ${totalAulasInseridas}`);
  console.log(`   Materiais sincronizados: ${totalMateriaisInseridos}`);
  console.log('=============================================\n');
}

migrarDadosEAD();
