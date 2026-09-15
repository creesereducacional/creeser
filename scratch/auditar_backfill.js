import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Carregar .env.local manualmente para evitar dependências externas
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditarAlunos() {
  console.log('🔍 Iniciando Auditoria de Alunos para Migração de Matrículas...\n');

  // 1. Carregar todos os alunos
  const { data: alunos, error: alunosErr } = await supabase
    .from('alunos')
    .select('id, nome, cpf, cursoid, turmaid, instituicao_id, statusmatricula');

  if (alunosErr) {
    console.error('❌ Erro ao buscar alunos:', alunosErr.message);
    process.exit(1);
  }

  console.log(`📋 Total de registros na tabela 'alunos': ${alunos.length}\n`);

  // 2. Carregar turmas e cursos para validações
  const { data: turmas } = await supabase.from('turmas').select('id, nome, cursoid, instituicao_id');
  const { data: cursos } = await supabase.from('cursos').select('id, nome, instituicao_id');

  const mapaTurmas = new Map((turmas || []).map(t => [Number(t.id), t]));
  const mapaCursos = new Map((cursos || []).map(c => [Number(c.id), c]));

  let semCurso = 0;
  let semTurma = 0;
  let cursoDivergente = 0;
  let instDivergente = 0;
  let statusNaoMapeados = 0;
  let aptos = 0;

  const inconsistencias = [];
  const statusMapeadosValidos = new Set([
    'PRE_CADASTRO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_PAGAMENTO_MATRICULA',
    'AGUARDANDO_FORMACAO_TURMA', 'AGUARDANDO_TURMA', 'ATIVO', 'TRANCADO', 
    'CANCELADO', 'DESISTENTE', 'CONCLUIDO'
  ]);

  for (const aluno of alunos) {
    const problemas = [];
    const cursoId = aluno.cursoid ? Number(aluno.cursoid) : null;
    const turmaId = aluno.turmaid ? Number(aluno.turmaid) : null;
    const instId = aluno.instituicao_id ? String(aluno.instituicao_id) : null;
    const status = (aluno.statusmatricula || 'ATIVO').toUpperCase();

    if (!cursoId) {
      semCurso++;
      problemas.push('Sem curso_id');
    }

    if (!turmaId) {
      semTurma++;
      problemas.push('Sem turma_id');
    }

    if (!statusMapeadosValidos.has(status)) {
      statusNaoMapeados++;
      problemas.push(`Status não mapeado: "${aluno.statusmatricula}"`);
    }

    // Validação de divergência com Turma
    if (turmaId && mapaTurmas.has(turmaId)) {
      const t = mapaTurmas.get(turmaId);
      if (cursoId && t.cursoid && Number(t.cursoid) !== cursoId) {
        cursoDivergente++;
        problemas.push(`Curso do aluno (${cursoId}) diverge do curso da turma (${t.cursoid})`);
      }
      if (instId && t.instituicao_id && String(t.instituicao_id) !== instId) {
        instDivergente++;
        problemas.push(`Instituição do aluno (${instId}) diverge da instituição da turma (${t.instituicao_id})`);
      }
    }

    if (problemas.length > 0) {
      inconsistencias.push({
        id: aluno.id,
        nome: aluno.nome,
        cpf: aluno.cpf,
        problemas
      });
    } else {
      aptos++;
    }
  }

  console.log('--------------------------------------------------');
  console.log('📊 RESUMO DA AUDITORIA DE BACKFILL:');
  console.log('--------------------------------------------------');
  console.log(`✅ Total de alunos analisados: ${alunos.length}`);
  console.log(`✅ Alunos 100% aptos para migração direta: ${aptos}`);
  console.log(`⚠️  Alunos sem curso_id: ${semCurso}`);
  console.log(`⚠️  Alunos sem turma_id: ${semTurma}`);
  console.log(`⚠️  Divergências Curso Aluno vs Curso Turma: ${cursoDivergente}`);
  console.log(`⚠️  Divergências Instituição Aluno vs Instituição Turma: ${instDivergente}`);
  console.log(`⚠️  Status não padronizados: ${statusNaoMapeados}`);
  console.log('--------------------------------------------------\n');

  if (inconsistencias.length > 0) {
    console.log('🚨 DETALHAMENTO DE ALGUNS CASOS COM INCONSISTÊNCIA:');
    inconsistencias.slice(0, 10).forEach(inc => {
      console.log(`- Aluno #${inc.id} (${inc.nome}): ${inc.problemas.join('; ')}`);
    });
    if (inconsistencias.length > 10) {
      console.log(`... e mais ${inconsistencias.length - 10} caso(s).`);
    }
  }
}

auditarAlunos().catch(console.error);
