// ============================================================================
// SUPABASE SCHEMA SYNC - Sincronizar schema via API
// ============================================================================
// Uso: node scripts/sync-schema.js
// Propósito: Obter schema remoto do Supabase sem Docker
// ============================================================================

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuração
const PROJECT_ID = 'wjcbobcqyqdkludsbqgf';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function getSupabaseSchema() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║  SUPABASE SCHEMA SYNC - VIA API       ║', 'cyan');
  log('╚════════════════════════════════════════╝\n', 'cyan');

  try {
    log('🔍 Conectando ao Supabase...', 'cyan');

    // 1. Obter informações do projeto
    const infoUrl = `${SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
    const info = await fetchJSON(infoUrl);
    
    log('✅ Conexão estabelecida!', 'green');
    log(`📊 Project: ${PROJECT_ID}`, 'cyan');

    // 2. Obter schema via GraphQL Introspection (se disponível)
    const schemaUrl = `${SUPABASE_URL}/graphql/v1`;
    
    const introspectionQuery = JSON.stringify({
      operationName: 'IntrospectionQuery',
      query: `query IntrospectionQuery {
        __schema {
          types {
            kind
            name
            description
            fields {
              name
              type { kind name }
            }
          }
        }
      }`
    });

    log('📥 Puxando schema remoto...', 'cyan');
    
    // Usar REST API para obter tabelas
    const tablesUrl = `${SUPABASE_URL}/rest/v1/information_schema.tables?select=*`;
    const tables = await fetchJSON(tablesUrl, {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    log(`✅ ${tables.length} tabelas encontradas!`, 'green');

    // 3. Salvar informações
    const outputDir = path.join(__dirname, '..', 'supabase');
    const infoFile = path.join(outputDir, 'schema-info.json');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(infoFile, JSON.stringify({
      projectId: PROJECT_ID,
      url: SUPABASE_URL,
      syncedAt: new Date().toISOString(),
      tablesCount: tables.length,
      tables: tables.map(t => ({
        name: t.table_name,
        schema: t.table_schema,
        type: t.table_type
      }))
    }, null, 2));

    log(`\n📁 Informações salvas em: ${infoFile}`, 'green');

    // 4. Exibir resumo
    log('\n📊 TABELAS SINCRONIZADAS:', 'cyan');
    tables.forEach((t, i) => {
      if (t.table_schema === 'public') {
        log(`   ${i + 1}. ${t.table_name}`, 'yellow');
      }
    });

    log('\n✅ Sincronização completa!', 'green');
    log('\n💡 Próximas ações:', 'cyan');
    log('   1. Verifique supabase/schema-info.json', 'cyan');
    log('   2. Para criar migrations: npx supabase migration new <nome>', 'cyan');
    log('   3. Edite supabase/migrations/<arquivo>.sql', 'cyan');
    log('   4. Faça: git add && git commit && git push', 'cyan');

  } catch (error) {
    log(`\n❌ Erro: ${error.message}`, 'red');
    log('\nVerifique:', 'yellow');
    log('   1. .env.local está configurado?', 'yellow');
    log('   2. NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão válidos?', 'yellow');
    log('   3. Projeto Supabase está acessível?', 'yellow');
    process.exit(1);
  }
}

// Executar
getSupabaseSchema();
