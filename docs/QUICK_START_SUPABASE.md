# ⚡ QUICK START - SUPABASE CREESER

**Tempo:** 30 minutos do setup até primeira query funcionando

---

## 🎯 O Que Você Precisa Fazer

### 1️⃣ Executar Schema SQL (10 min)

```sql
-- Acesse: https://app.supabase.com
-- Projeto: wjcbobcqyqdkludsbqgf
-- Menu: SQL Editor → New Query

-- Copie TUDO do arquivo: supabase/schema.sql
-- Cole aqui ↓
-- Clique: Run (botão preto ▶️)

-- Aguarde sucesso ✅
```

### 2️⃣ Instalar Dependências (5 min)

```bash
npm install
```

### 3️⃣ Migrar Dados (10 min)

```bash
node scripts/migrate-data.js
```

**Saída esperada:**
```
✅ usuarios: 15 registros inseridos
✅ alunos: 25 registros inseridos
...
✅ Migração concluída: 20 tabelas inseridas
```

### 4️⃣ Testar (5 min)

Crie arquivo: `pages/teste.js`

```javascript
import { buscarTodosCursos } from '@/lib/supabase-queries';

export default function Teste() {
  const [cursos, setCursos] = React.useState([]);

  React.useEffect(() => {
    async function carregar() {
      const { data } = await buscarTodosCursos();
      setCursos(data || []);
    }
    carregar();
  }, []);

  return (
    <div>
      <h1>Cursos: {cursos.length}</h1>
      <pre>{JSON.stringify(cursos, null, 2)}</pre>
    </div>
  );
}
```

Acesse: `http://localhost:3000/teste`

---

## 🔥 Operações Comuns (Copy & Paste)

### Buscar alunos
```javascript
const { data: alunos } = await buscarAlunosPorCurso(1);
```

### Registrar nota
```javascript
await registrarNota({
  alunoId: 1,
  disciplinaId: 1,
  turmaId: 1,
  nota: 8.5,
  faltas: 0
});
```

### Buscar boletim
```javascript
const { data: boletim } = await buscarBoletimAluno(alunoId, turmaId);
```

### Criar aluno
```javascript
await criarAluno({
  nomeCompleto: 'João Silva',
  email: 'joao@email.com',
  cursoId: 1,
  turmaId: 1
});
```

### Buscar notícias
```javascript
const { data: noticias } = await buscarTodasAsNoticias();
```

---

## 📁 Arquivos Criados

```
✅ .env.local                               (credenciais)
✅ lib/supabase.js                         (cliente)
✅ lib/supabase-queries.js                 (50+ funções)
✅ scripts/migrate-data.js                 (migração)
✅ supabase/schema.sql                     (banco de dados)
✅ GUIA_SUPABASE_SETUP.md                 (guia completo)
✅ REFERENCIA_QUERIES_SUPABASE.md          (referência)
✅ CHECKLIST_IMPLEMENTACAO_SUPABASE.md    (checklist)
✅ RESUMO_IMPLEMENTACAO_SUPABASE.md       (resumo)
✅ INDICE_SUPABASE.md                     (índice)
✅ components/ExemplosSupabase.js         (exemplos)
```

---

## ❓ Problemas?

| Erro | Solução |
|------|---------|
| Variáveis não configuradas | Rode `npm install` e reinicie terminal |
| SQL error | Copie TUDO do schema.sql, inclusive comentários |
| Migration falhou | Verifique se schema foi criado e `npm install` foi executado |
| 403 Forbidden | Não deixe errar a `Service Role Key` em `.env.local` |

---

## 📚 Próxima Leitura

Depois de fazer o quick start, leia:

1. **GUIA_SUPABASE_SETUP.md** (entender melhor)
2. **REFERENCIA_QUERIES_SUPABASE.md** (quando precisar de algo)
3. **CHECKLIST_IMPLEMENTACAO_SUPABASE.md** (acompanhar projeto)

---

## 💻 Código Mínimo para Começar

```javascript
// 1. Importar
import { buscarAlunosPorCurso } from '@/lib/supabase-queries';

// 2. Usar em um componente
export default function Alunos() {
  const [alunos, setAlunos] = React.useState([]);

  React.useEffect(() => {
    async function carregar() {
      const { data, error } = await buscarAlunosPorCurso(1);
      if (error) console.error(error);
      else setAlunos(data || []);
    }
    carregar();
  }, []);

  return (
    <ul>
      {alunos.map(a => (
        <li key={a.id}>{a.usuarios?.nomeCompleto}</li>
      ))}
    </ul>
  );
}
```

**Pronto!** Seu componente está integrado com Supabase.

---

## 🎯 Status

```
✅ Schema:        Pronto
✅ Client:        Pronto
✅ Funções:       Pronto
✅ Migração:      Pronta
✅ Exemplos:      Prontos
✅ Docs:          Prontas

🚀 PRONTO PARA USAR
```

---

*Quick start criado: 29 de dezembro de 2025*
