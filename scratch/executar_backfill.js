import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usar ANON_KEY garantida para conexões do cliente Supabase
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Script de Execução Transacional PostgreSQL via RPC e Idempotente da FASE 2B — Backfill de Matrículas
 */
export async function executarBackfillMatriculas({ dryRun = true } = {}) {
  console.log(`\n🚀 Iniciar Processamento de Backfill (Modo: ${dryRun ? 'DRY-RUN / APENAS SIMULAÇÃO' : 'EXECUÇÃO REAL NO BANCO'})...\n`);

  // 1. Carregar todos os alunos
  const { data: alunos, error: alunosErr } = await supabase
    .from('alunos')
    .select('*')
    .order('id', { ascending: true });

  if (alunosErr) {
    console.error('❌ Erro ao carregar alunos:', alunosErr.message);
    throw alunosErr;
  }

  // 2. Carregar todas as matrículas existentes (completas) para auditoria refinada de idempotência
  const { data: matriculasExistentes } = await supabase
    .from('matriculas')
    .select('id, aluno_id, curso_id, turma_id, ano_letivo, semestre, status_administrativo, is_principal');

  // Mapa de matrículas existentes por aluno_id
  const mapaMatriculasPorAluno = new Map();
  (matriculasExistentes || []).forEach(m => {
    const aId = Number(m.aluno_id);
    if (!mapaMatriculasPorAluno.has(aId)) {
      mapaMatriculasPorAluno.set(aId, []);
    }
    mapaMatriculasPorAluno.get(aId).push(m);
  });

  // Mapa de alunos que já possuem qualquer matrícula com is_principal = true
  const mapaAlunosComPrincipal = new Set(
    (matriculasExistentes || []).filter(m => m.is_principal).map(m => Number(m.aluno_id))
  );

  // 3. Carregar turmas para validação de consistência
  const { data: turmas } = await supabase.from('turmas').select('id, instituicao_id, cursoid');
  const mapaTurmas = new Map((turmas || []).map(t => [Number(t.id), t]));

  let totalProcessado = 0;
  let matriculasACriar = 0;
  let movimentacoesACriar = 0;
  let jaExistentesCompativeis = 0;
  let registrosAmbiguos = 0;
  let erros = 0;
  const pendenciasSemCurso = [];
  const pendenciasAmbiguas = [];
  const errosDetalhados = [];

  for (const aluno of alunos) {
    totalProcessado++;

    const alunoId = Number(aluno.id);
    const cursoId = aluno.cursoid ? Number(aluno.cursoid) : null;
    const turmaId = aluno.turmaid ? Number(aluno.turmaid) : null;
    const instId = aluno.instituicao_id ? String(aluno.instituicao_id) : null;

    // Regra 1: Alunos sem cursoid NÃO são migrados e viram pendência sem curso
    if (!cursoId) {
      pendenciasSemCurso.push({
        aluno_id: aluno.id,
        nome: aluno.nome,
        motivo: 'cursoid ausente no cadastro do aluno'
      });
      continue;
    }

    // Regra 2: Classificação Refinada de Idempotência contra matrículas pré-existentes
    const matriculasDoAluno = mapaMatriculasPorAluno.get(alunoId) || [];
    
    if (matriculasDoAluno.length > 0) {
      // Procurar se existe alguma matrícula exatamente compatível com o curso e turma/ano do legado
      const matriculaCompativel = matriculasDoAluno.find(m => 
        Number(m.curso_id) === cursoId &&
        (!turmaId || Number(m.turma_id) === turmaId)
      );

      if (matriculaCompativel) {
        // Aluno com matrícula já existente compatível → Classificar e não duplicar
        jaExistentesCompativeis++;
        continue;
      } else {
        // Aluno com matrícula existente, mas em curso/turma diferente do legado → Ambiguidade
        // Não inserir automaticamente para evitar duplicação ou sobposição indevida
        registrosAmbiguos++;
        pendenciasAmbiguas.push({
          aluno_id: aluno.id,
          nome: aluno.nome,
          curso_legado: cursoId,
          matriculas_existentes: matriculasDoAluno.map(m => ({ id: m.id, curso_id: m.curso_id, turma_id: m.turma_id }))
        });
        continue;
      }
    }

    // Mapeamento de Status
    let statusAdmin = (aluno.statusmatricula || 'ATIVO').toUpperCase();
    if (statusAdmin === 'AGUARDANDO_PAGAMENTO_MATRICULA') statusAdmin = 'AGUARDANDO_PAGAMENTO';
    if (statusAdmin === 'AGUARDANDO_FORMACAO_TURMA') statusAdmin = 'AGUARDANDO_TURMA';

    // Ajuste fino para constraint chk_turma_obrigatoria_quando_ativo
    if (statusAdmin === 'ATIVO' && !turmaId) {
      statusAdmin = 'AGUARDANDO_TURMA';
    }

    // Validação de divergência com a turma
    let turmaValidaId = turmaId;
    if (turmaId && mapaTurmas.has(turmaId)) {
      const t = mapaTurmas.get(turmaId);
      if (t.cursoid && Number(t.cursoid) !== cursoId) {
        turmaValidaId = null;
        if (statusAdmin === 'ATIVO') statusAdmin = 'AGUARDANDO_TURMA';
      }
    }

    const anoLetivo = aluno.ano_letivo ? Number(aluno.ano_letivo) : new Date().getFullYear();
    const semestre = aluno.semestre || '1';
    
    // Se o aluno já tiver outra matrícula principal, esta nova será criada com is_principal = false
    const defineComoPrincipal = !mapaAlunosComPrincipal.has(alunoId);

    // Se estiver em modo DRY-RUN, apenas contabiliza a intenção
    if (dryRun) {
      matriculasACriar++;
      movimentacoesACriar++;
      continue;
    }

    // EXECUÇÃO REAL VIA RPC TRANSACIONAL NO POSTGRESQL
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('fn_backfill_processar_aluno_transacional', {
        p_aluno_id: alunoId,
        p_instituicao_id: instId,
        p_curso_id: cursoId,
        p_turma_id: turmaValidaId,
        p_ano_letivo: anoLetivo,
        p_semestre: semestre,
        p_status_administrativo: statusAdmin,
        p_is_principal: defineComoPrincipal,
        p_data_matricula: aluno.datamatricula || new Date().toISOString().split('T')[0],
        p_plano_financeiro: aluno.plano_financeiro || null,
        p_valor_matricula: aluno.valor_matricula ? Number(aluno.valor_matricula) : null,
        p_valor_mensalidade: aluno.valor_mensalidade ? Number(aluno.valor_mensalidade) : null,
        p_percentual_desconto: aluno.percentual_desconto ? Number(aluno.percentual_desconto) : null,
        p_qtd_parcelas: aluno.qtd_parcelas ? Number(aluno.qtd_parcelas) : null,
        p_dia_pagamento: aluno.dia_pagamento ? Number(aluno.dia_pagamento) : null,
        p_aluno_bolsista: Boolean(aluno.aluno_bolsista),
        p_percentual_bolsa: aluno.percentual_bolsa ? Number(aluno.percentual_bolsa) : null
      });

      if (rpcErr) {
        throw new Error(`Erro na transação PostgreSQL RPC: ${rpcErr.message}`);
      }

      matriculasACriar++;
      movimentacoesACriar++;
      mapaAlunosComPrincipal.add(alunoId);
    } catch (err) {
      erros++;
      errosDetalhados.push({
        aluno_id: aluno.id,
        nome: aluno.nome,
        erro: err.message
      });
    }
  }

  const relatorio = {
    modo: dryRun ? 'DRY-RUN / APENAS SIMULAÇÃO' : 'EXECUÇÃO REAL',
    totalProcessado,
    matriculasACriar,
    movimentacoesACriar,
    jaExistentesCompativeis,
    registrosAmbiguos,
    pendenciasSemCursoCount: pendenciasSemCurso.length,
    pendenciasSemCurso,
    pendenciasAmbiguas,
    erros,
    errosDetalhados
  };

  console.log('--------------------------------------------------');
  console.log(`📊 RELATÓRIO REFINADO DO BACKFILL FASE 2B (${relatorio.modo}):`);
  console.log('--------------------------------------------------');
  console.log(`📋 Total de alunos analisados: ${relatorio.totalProcessado}`);
  console.log(`✅ Matrículas a serem criadas / criadas: ${relatorio.matriculasACriar}`);
  console.log(`✅ Movimentações MATRÍCULA_INICIAL a serem criadas / criadas: ${relatorio.movimentacoesACriar}`);
  console.log(`⏩ Já existentes compatíveis (idempotência): ${relatorio.jaExistentesCompativeis}`);
  console.log(`⚠️  Registros ambíguos/divergentes retidos: ${relatorio.registrosAmbiguos}`);
  console.log(`⚠️  Pendências sem curso (fora do INSERT): ${relatorio.pendenciasSemCursoCount}`);
  console.log(`❌ Erros na execução: ${relatorio.erros}`);
  if (relatorio.errosDetalhados.length > 0) {
    console.log('  Detalhes dos Erros:');
    relatorio.errosDetalhados.forEach(e => console.log(`  - Aluno #${e.aluno_id} (${e.nome}): ${e.erro}`));
  }
  console.log('--------------------------------------------------\n');

  return relatorio;
}

// Executar em modo real no banco (DRY-RUN = false)
executarBackfillMatriculas({ dryRun: false }).catch(console.error);
