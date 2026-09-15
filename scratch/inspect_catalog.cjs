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

async function inspectPgCatalog() {
  console.log('====================================================');
  console.log(' INSPEÇÃO DIRETA DO CATÁLOGO POSTGRESQL');
  console.log('====================================================\n');

  // Testar chamada à RPC de informação do banco se existir, ou via RPC personalizada
  const { data: funcInfo, error: errFunc } = await supabase.rpc('fn_auto_criar_matricula_aluno');
  
  console.log('📌 Tentativa de chamada direta à função RPC:');
  console.log('  Message:', errFunc?.message);
  console.log('  Code:', errFunc?.code);
  console.log('  Details:', errFunc?.details);
  console.log('  Hint:', errFunc?.hint);
}

inspectPgCatalog().catch(console.error);
