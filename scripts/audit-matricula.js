const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const INOVE_ID = '1f140f5f-cf75-489d-8ab3-d99cf28d1414';

async function go() {
  // Usuários Inove
  const { data: usrAll } = await supabase.from('usuarios').select('id,email,tipo,perfil').eq('instituicao_id', INOVE_ID);
  console.log('Usuarios Inove (' + (usrAll?.length || 0) + '):');
  usrAll?.forEach(u => console.log('  ' + u.id + ' | ' + u.email + ' | tipo=' + u.tipo + ' | perfil=' + u.perfil));

  // Instituicao
  const { data: inst } = await supabase.from('instituicoes').select('id,nome,cnpj,endereco').eq('id', INOVE_ID).maybeSingle();
  console.log('\nInove:', inst?.nome, '| CNPJ:', inst?.cnpj, '| Endereco:', inst?.endereco ? 'SIM' : 'NAO');

  // Curso id=1
  const { data: curso } = await supabase.from('cursos').select('id,nome').eq('id', 1).maybeSingle();
  console.log('Curso id=1:', JSON.stringify(curso));

  // Parcelas carne
  const { data: parcelas } = await supabase.from('financeiro_parcelas').select('id,numero_parcela,valor,status,data_vencimento,boleto_url').eq('ordem_id','6a281019-6fce-48c7-996a-8083f567f243').order('numero_parcela');
  console.log('\nParcelas carne ativo aluno 16 (' + (parcelas?.length||0) + '):');
  (parcelas||[]).slice(0,4).forEach(p => console.log('  Parcela ' + p.numero_parcela + ' | ' + p.status + ' | R$' + p.valor + ' | venc=' + p.data_vencimento + ' | boleto=' + (p.boleto_url?'SIM':'NAO')));
}

go().catch(e => console.error('ERRO:', e.message));
