import { validarEmailUnico, normalizeEmail, MSG_EMAIL_DUPLICADO, isDuplicateEmailError } from '../lib/api-helpers.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runTests() {
  console.log('====================================================');
  console.log(' INICIANDO SUÍTE DE TESTES: UNICIDADE DE E-MAIL');
  console.log('====================================================\n');
  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log('✅ PASS:', name);
      passed++;
    } else {
      console.error('❌ FAIL:', name, details);
      failed++;
    }
  }

  // 1. Verificar registros de teste saneados
  const { data: saneados } = await supabase.from('alunos').select('id, email, statusmatricula').in('id', [1, 2, 27, 28]);
  const emailsSaneados = saneados ? saneados.map(s => s.email) : [];
  assert('1. Saneamento ID 1, 2, 27, 28 únicos', 
    emailsSaneados.includes('teste.aluno01@creeser.test') &&
    emailsSaneados.includes('teste.aluno02@creeser.test') &&
    emailsSaneados.includes('teste.aluno27@creeser.test') &&
    emailsSaneados.includes('teste.aluno28@creeser.test'),
    JSON.stringify(saneados)
  );

  // 2. Normalização de e-mail
  assert('2. Normalização trim e lower', normalizeEmail('  JoAo@GmAil.COM  ') === 'joao@gmail.com');
  assert('3. Normalização null', normalizeEmail(null) === null);
  assert('4. Normalização undefined', normalizeEmail(undefined) === null);
  assert('5. Normalização string vazia', normalizeEmail('   ') === null);

  // 3. Validação com e-mail novo (inexistente)
  const novoEmail = 'email_novo_' + Date.now() + '@teste.com';
  const rNovo = await validarEmailUnico({ email: novoEmail, supabaseClient: supabase });
  assert('6. E-mail novo é válido (permite cadastro)', rNovo.valid === true && rNovo.normalizedEmail === novoEmail);

  // 4. Validação com e-mail existente em ALUNOS (ex: teste.aluno01@creeser.test)
  const rExistAluno = await validarEmailUnico({ email: 'teste.aluno01@creeser.test', supabaseClient: supabase });
  assert('7. Bloqueia e-mail existente em ALUNOS', rExistAluno.valid === false && rExistAluno.error === MSG_EMAIL_DUPLICADO);

  // 5. Case-insensitivity no bloqueio
  const rCase = await validarEmailUnico({ email: '  TESTE.ALUNO01@CREESER.TEST  ', supabaseClient: supabase });
  assert('8. Bloqueia case-insensitive e com espaços', rCase.valid === false && rCase.error === MSG_EMAIL_DUPLICADO);

  // 6. Bloqueio de e-mail de Pré-Cadastro (ex: teste.aluno27@creeser.test)
  const rPre = await validarEmailUnico({ email: 'teste.aluno27@creeser.test', supabaseClient: supabase });
  assert('9. Bloqueia e-mail pertencente a Pré-Cadastro', rPre.valid === false && rPre.error === MSG_EMAIL_DUPLICADO);

  // 7. Edição do mesmo aluno (não deve bloquear a si mesmo)
  const rSelfAluno = await validarEmailUnico({ email: 'teste.aluno01@creeser.test', currentAlunoId: 1, supabaseClient: supabase });
  assert('10. Permite o próprio aluno manter seu e-mail na edição', rSelfAluno.valid === true);

  // 8. Edição tentando assumir e-mail de outro aluno
  const rOtherAluno = await validarEmailUnico({ email: 'teste.aluno02@creeser.test', currentAlunoId: 1, supabaseClient: supabase });
  assert('11. Bloqueia aluno tentando assumir e-mail de outro aluno', rOtherAluno.valid === false && rOtherAluno.error === MSG_EMAIL_DUPLICADO);

  // 9. Bloqueio de e-mail existente em USUARIOS
  const { data: usuarioExist } = await supabase.from('usuarios').select('id, email').not('email', 'is', null).limit(1);
  if (usuarioExist && usuarioExist[0]) {
    const rExistUser = await validarEmailUnico({ email: usuarioExist[0].email, supabaseClient: supabase });
    assert('12. Bloqueia e-mail existente em USUARIOS ao tentar cadastrar aluno', rExistUser.valid === false && rExistUser.error === MSG_EMAIL_DUPLICADO);

    const rSelfUser = await validarEmailUnico({ email: usuarioExist[0].email, currentUsuarioId: usuarioExist[0].id, supabaseClient: supabase });
    assert('13. Permite o próprio usuário manter seu e-mail na edição', rSelfUser.valid === true);
  }

  // 10. E-mail null / vazio não gera conflito
  const rNull = await validarEmailUnico({ email: null, supabaseClient: supabase });
  assert('14. E-mail null é ignorado (permite múltiplos)', rNull.valid === true);
  const rEmpty = await validarEmailUnico({ email: '   ', supabaseClient: supabase });
  assert('15. E-mail vazio é ignorado (permite múltiplos)', rEmpty.valid === true);

  // 11. Helper de detecção de erro PostgreSQL 23505
  assert('16. isDuplicateEmailError com código 23505 e email', isDuplicateEmailError({ code: '23505', message: 'duplicate key value violates unique constraint idx_alunos_unique_normalized_email' }) === true);
  assert('17. isDuplicateEmailError com CPF não confunde', isDuplicateEmailError({ code: '23505', message: 'duplicate key value violates unique constraint alunos_cpf_key' }) === false);

  // 12. Mensagem padrão uniforme
  assert('18. Mensagem padrão uniforme exata', MSG_EMAIL_DUPLICADO === 'Este e-mail já está cadastrado no sistema. Utilize outro e-mail ou acesse a recuperação de senha.');

  console.log('\n====================================================');
  console.log(` RESULTADO FINAL: ${passed} PASSADOS / ${failed} FALHAS`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

runTests();
