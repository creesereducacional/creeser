const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl = 'https://wjcbobcqyqdkludsbqgf.supabase.co';
let supabaseKey = 'sb_publishable_EpWHRpMB_HxVI0Afb6SnXw_M48qjBxY';

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine && !cleanLine.startsWith('#')) {
      const match = cleanLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
        if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTurmasMesmoCurso() {
  const { data: turmas, error } = await supabase
    .from('turmas')
    .select('id, nome, cursoid, gradeid, instituicao_id');

  if (error) {
    console.error('❌ Erro ao buscar turmas:', error.message);
    return;
  }

  console.log('📌 Turmas encontradas no banco:', turmas.length);
  const porCurso = {};
  turmas.forEach(t => {
    if (!porCurso[t.cursoid]) porCurso[t.cursoid] = [];
    porCurso[t.cursoid].push(t);
  });

  Object.entries(porCurso).forEach(([cursoId, lista]) => {
    console.log(`\n📚 Curso ID: ${cursoId} (${lista.length} turmas)`);
    lista.forEach(t => console.log(`   - Turma ID: ${t.id} | Nome: ${t.nome} | GradeID: ${t.gradeid} | InstID: ${t.instituicao_id}`));
  });
}

findTurmasMesmoCurso().catch(console.error);
