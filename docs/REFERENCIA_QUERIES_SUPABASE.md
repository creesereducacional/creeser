# 📚 Referência de Queries Supabase - CREESER

## Quick Reference para operações comuns

### 📌 Como Usar Este Guia

Todas as funções estão em `lib/supabase-queries.js`. Importe e use:

```javascript
import { buscarAlunosPorCurso, registrarNota } from '@/lib/supabase-queries';
```

---

## 👥 Operações com Usuários

### Buscar usuário por email
```javascript
const { data, error } = await buscarUsuarioPorEmail('admin@creeser.com');
```

### Buscar todos os usuários do tipo específico
```javascript
const { data, error } = await buscarTodosDosUsuarios({ tipo: 'aluno' });
```

### Criar novo usuário
```javascript
const { data, error } = await criarUsuario({
  nomeCompleto: 'João Silva',
  email: 'joao@creeser.com',
  cpf: '123.456.789-00',
  tipo: 'professor',
  status: 'ativo'
});
```

### Atualizar usuário
```javascript
const { data, error } = await atualizarUsuario(usuarioId, {
  status: 'inativo'
});
```

---

## 🎓 Operações com Alunos

### Buscar alunos por curso
```javascript
const { data, error } = await buscarAlunosPorCurso(1);
// Retorna: alunos com dados completos (usuarios, cursos, turmas)
```

### Buscar alunos por turma
```javascript
const { data, error } = await buscarAlunosPorTurma(5);
```

### Buscar aluno pelo ID do usuário
```javascript
const { data, error } = await buscarAlunoPorUsuarioId(123);
```

### Criar novo aluno
```javascript
const { data, error } = await criarAluno({
  usuarioId: 123,
  matricula: 'MAT2025001',
  cursoId: 1,
  turmaId: 5,
  statusMatricula: 'ativa',
  dataMatricula: new Date().toISOString(),
  endereco: 'Rua ABC, 123',
  cidade: 'Belém',
  estado: 'PA'
});
```

### Atualizar aluno
```javascript
const { data, error } = await atualizarAluno(alunoId, {
  statusMatricula: 'cancelada'
});
```

---

## 👨‍🏫 Operações com Professores

### Buscar professores por turma
```javascript
const { data, error } = await buscarProfessoresPorTurma(5);
// Retorna: relacionamento professor-disciplina-turma
```

### Buscar turmas de um professor
```javascript
const { data, error } = await buscarTurmasDoProfessor(professorId);
```

### Buscar professor pelo ID do usuário
```javascript
const { data, error } = await buscarProfessorPorUsuarioId(123);
```

### Criar professor
```javascript
const { data, error } = await criarProfessor({
  usuarioId: 123,
  matricula: 'PROF2025001',
  especialidade: 'Pedagogia',
  titulacao: 'Mestrado',
  dataPrimeiraContratacao: '2020-01-15'
});
```

---

## 🏫 Operações com Turmas

### Buscar todas as turmas
```javascript
const { data, error } = await buscarTodasAsTurmas();
// Retorna com dados de cursos e unidades
```

### Buscar turmas por curso
```javascript
const { data, error } = await buscarTurmasPorCurso(cursoId);
```

### Criar turma
```javascript
const { data, error } = await criarTurma({
  nome: 'TURMA A - PEDAGOGIA 2025',
  unidadeId: 1,
  cursoId: 1,
  situacao: 'ATIVO',
  dataInicio: '2025-02-01',
  dataFim: '2025-12-15',
  capacidadeMaxima: 40
});
```

### Atualizar turma
```javascript
const { data, error } = await atualizarTurma(turmaId, {
  situacao: 'ENCERRADO'
});
```

---

## 📊 Operações com Notas e Avaliações

### Buscar notas de alunos por disciplina
```javascript
const { data, error } = await buscarNotasAlunosPorDisciplina(
  disciplinaId,
  turmaId
);
// Retorna: notas, faltas e dados dos alunos
```

### Buscar boletim completo do aluno
```javascript
const { data, error } = await buscarBoletimAluno(alunoId, turmaId);
// Retorna: todas as disciplinas, avaliações, notas e faltas
```

### Registrar nota
```javascript
const { data, error } = await registrarNota({
  alunoId: 25,
  disciplinaId: 3,
  turmaId: 5,
  avaliacaoId: 12,
  nota: 8.5,
  faltas: 2,
  presencas: 18,
  semestre: '2025.1',
  ano: 2025
});
```

### Atualizar nota
```javascript
const { data, error } = await atualizarNota(notaId, {
  nota: 9.0,
  faltas: 1
});
```

---

## 📰 Operações com Noticias

### Buscar todas as notícias
```javascript
const { data, error } = await buscarTodasAsNoticias();
```

### Buscar notícias em destaque
```javascript
const { data, error } = await buscarNoticiasDestaque();
// Retorna: máximo 3 notícias marcadas como destaque
```

### Criar notícia
```javascript
const { data, error } = await criarNoticia({
  titulo: 'Recesso Escolar 2025',
  descricao: 'Informações sobre o recesso...',
  conteudo: 'Conteúdo completo...',
  imagem: '/images/noticia.jpg',
  autorId: userId,
  destaque: true,
  publica: true
});
```

---

## 📝 Operações com Blog

### Buscar posts do blog
```javascript
const { data, error } = await buscarPostsBlogs();
```

### Buscar post por slug
```javascript
const { data, error } = await buscarPostBlogPorSlug('primeiro-post');
```

---

## 💬 Operações com Fórum

### Buscar tópicos do fórum
```javascript
// Todos os tópicos
const { data, error } = await buscarTopicosForum();

// Tópicos de uma turma específica
const { data, error } = await buscarTopicosForum(turmaId);
```

### Buscar respostas de um tópico
```javascript
const { data, error } = await buscarRespostasForum(forumId);
```

### Criar novo tópico
```javascript
const { data, error } = await criarTopicoForum({
  titulo: 'Dúvida sobre atividade',
  descricao: 'Descrição breve',
  conteudo: 'Detalhes da dúvida',
  autorId: userId,
  disciplinaId: 5,
  turmaId: 10
});
```

### Criar resposta no fórum
```javascript
const { data, error } = await criarRespostaForum({
  forumId: topicId,
  autorId: userId,
  conteudo: 'Resposta do professor...'
});
```

---

## 📄 Operações com Documentos

### Buscar documentos por turma
```javascript
const { data, error } = await buscarDocumentosPorTurma(turmaId);
```

### Buscar documentos por disciplina
```javascript
const { data, error } = await buscarDocumentosPorDisciplina(disciplinaId);
```

### Criar documento
```javascript
const { data, error } = await criarDocumento({
  nome: 'Apostila de Metodologia',
  descricao: 'Apostila completa da disciplina',
  tipo: 'pdf',
  caminhoArquivo: '/uploads/documentos/apostila.pdf',
  tamanho: 2048000,
  uploadadoPor: userId,
  turmaId: 5,
  publica: true
});
```

---

## 📚 Operações com Cursos

### Buscar todos os cursos ativos
```javascript
const { data, error } = await buscarTodosCursos();
```

### Buscar curso por ID
```javascript
const { data, error } = await buscarCursoPorId(1);
```

---

## 🏢 Operações com Unidades

### Buscar todas as unidades
```javascript
const { data, error } = await buscarTodasAsUnidades();
```

---

## 👔 Operações com Funcionários

### Buscar todos os funcionários ativos
```javascript
const { data, error } = await buscarTodosFuncionarios();
// Retorna: dados do usuário inclusos
```

### Buscar funcionário pelo ID do usuário
```javascript
const { data, error } = await buscarFuncionarioPorUsuarioId(userId);
```

---

## 🔍 Queries Customizadas

Se precisar de uma query que não está nas funções auxiliares, use direto:

### Exemplo: Buscar alunos com nota acima de 7 em uma disciplina
```javascript
const { data, error } = await supabase
  .from('notas_faltas')
  .select(`
    *,
    alunos (
      id,
      usuarios (id, nomeCompleto, email)
    )
  `)
  .eq('disciplinaId', disciplinaId)
  .gt('nota', 7)
  .order('nota', { ascending: false });
```

### Exemplo: Buscar alunos com falta acima de 10
```javascript
const { data, error } = await supabase
  .from('notas_faltas')
  .select('*')
  .eq('disciplinaId', disciplinaId)
  .gt('faltas', 10);
```

### Exemplo: Deletar noticias antigas
```javascript
const { data, error } = await supabase
  .from('noticias')
  .delete()
  .lt('dataCriacao', '2024-12-31');
```

---

## ⚙️ Operadores Comuns

| Operador | Descrição |
|----------|-----------|
| `.eq()` | Igual a |
| `.neq()` | Não igual a |
| `.gt()` | Maior que |
| `.gte()` | Maior ou igual a |
| `.lt()` | Menor que |
| `.lte()` | Menor ou igual a |
| `.like()` | Busca parcial (case-insensitive) |
| `.ilike()` | Busca parcial (case-sensitive) |
| `.in()` | Em um array de valores |
| `.is()` | Comparar com null |

### Exemplo com LIKE
```javascript
const { data, error } = await supabase
  .from('usuarios')
  .select('*')
  .like('nomeCompleto', '%Silva%');
```

---

## 🎯 Exemplos Práticos

### Dashboard do Aluno
```javascript
// Buscar dados do aluno logado
const { data: usuario } = await buscarUsuarioPorId(userId);
const { data: aluno } = await buscarAlunoPorUsuarioId(userId);
const { data: boletim } = await buscarBoletimAluno(aluno.id, aluno.turmaId);

// Resultado: nome, turma, disciplinas, notas, faltas
```

### Lançar notas de uma avaliação
```javascript
// 1. Buscar alunos da turma
const { data: alunos } = await buscarAlunosPorTurma(turmaId);

// 2. Registrar nota para cada aluno
for (const aluno of alunos) {
  await registrarNota({
    alunoId: aluno.id,
    disciplinaId: disciplinaId,
    turmaId: turmaId,
    avaliacaoId: avaliacaoId,
    nota: notas[aluno.id], // mapa de notas
    presencas: presencas[aluno.id]
  });
}
```

### Filtrar alunos com baixo desempenho
```javascript
const { data: alunos } = await buscarAlunosPorTurma(turmaId);

// Buscar notas
const { data: notas } = await supabase
  .from('notas_faltas')
  .select('alunoId, AVG(nota) as media')
  .eq('turmaId', turmaId)
  .groupBy('alunoId');

// Filtrar com média < 6
const alunosBaixoDesempenho = notas
  .filter(n => n.media < 6)
  .map(n => alunos.find(a => a.id === n.alunoId));
```

---

## 🐛 Tratamento de Erros

### Padrão recomendado
```javascript
const { data, error } = await buscarAlunosPorCurso(1);

if (error) {
  console.error('Erro ao buscar alunos:', error.message);
  // Mostrar erro ao usuário
  return;
}

// Usar data aqui - seguro
console.log(data);
```

### Com Try-Catch
```javascript
try {
  const { data, error } = await criarAluno(dadosAluno);
  
  if (error) throw error;
  
  console.log('Aluno criado com sucesso:', data);
} catch (erro) {
  console.error('Erro:', erro.message);
}
```

---

## 🔐 Segurança

### ⚠️ Sempre respeite essas regras:

1. **Nunca exponha a Service Role Key** no navegador
2. **Operações sensíveis** no servidor (API routes)
3. **Filters RLS** para dados específicos do usuário
4. **Validar IDs** antes de consultar

### Exemplo seguro
```javascript
// API route: pages/api/aluno/boletim.js
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req, res) {
  const { alunoId } = req.query;
  const userId = req.user.id; // Do middleware de auth
  
  // Verificar se o aluno pertence ao usuário logado
  const { data: aluno } = await supabaseAdmin
    .from('alunos')
    .select('usuarioId')
    .eq('id', alunoId)
    .single();
  
  if (aluno.usuarioId !== userId) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  // Buscar boletim com segurança
  const { data } = await supabaseAdmin
    .from('notas_faltas')
    .select('*')
    .eq('alunoId', alunoId);
  
  return res.json(data);
}
```

---

## 📞 Precisa de Ajuda?

Se a query que precisa não está aqui:

1. Consulte a [documentação do Supabase](https://supabase.com/docs)
2. Adicione a função em `lib/supabase-queries.js`
3. Documente a função para próximas consultas

---

*Última atualização: 29 de dezembro de 2025*
