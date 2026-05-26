# Relatório de Migração: JSON Local → Supabase

**Data de conclusão:** 2025  
**Status:** ✅ CONCLUÍDA

---

## Resumo Executivo

Todos os arquivos de API do ERP CREESER foram migrados de leitura/escrita em arquivos JSON locais para o Supabase. Nenhuma dependência de `data/*.json` permanece em `pages/api/`.

---

## APIs Refatoradas

| Arquivo | Tabela Supabase | Observações |
|---|---|---|
| `pages/api/alunos/index.js` | `alunos` | — |
| `pages/api/alunos/[id].js` | `alunos` | — |
| `pages/api/auth/login.js` | `usuarios` | Removida vulnerabilidade: senhas em texto plano no JSON |
| `pages/api/avaliacoes/index.js` | `avaliacoes` | — |
| `pages/api/avaliacoes/[id].js` | `avaliacoes` | — |
| `pages/api/configuracoes/solicitacoes.js` | `solicitacoes_tipos` | — |
| `pages/api/configuracoes/solicitacoes/[id].js` | `solicitacoes_tipos` | — |
| `pages/api/cursos/index.js` | `cursos` | — |
| `pages/api/cursos/[id].js` | `cursos` | — |
| `pages/api/disciplinas/index.js` | `disciplinas` | — |
| `pages/api/disciplinas/[id].js` | `disciplinas` | — |
| `pages/api/documentos.js` | `documentos` | Mantém `fs` para upload de arquivos físicos |
| `pages/api/enviar-email.js` | `emails_enviados`, `alunos` | Mantém nodemailer |
| `pages/api/forum.js` | `forum_topicos`, `forum_respostas` | Cascade delete manual |
| `pages/api/funcionarios/index.js` | `funcionarios` | — |
| `pages/api/funcionarios/[id].js` | `funcionarios` | — |
| `pages/api/grades/index.js` | `grades` | — |
| `pages/api/grades/[id].js` | `grades` | — |
| `pages/api/livro-registro/index.js` | `livro_registro` | — |
| `pages/api/livro-registro/[id].js` | `livro_registro` | — |
| `pages/api/noticias/index.js` | `noticias` | — |
| `pages/api/noticias/[id].js` | `noticias` | — |
| `pages/api/professores/index.js` | `professores` | — |
| `pages/api/professores/[id].js` | `professores` | — |
| `pages/api/responsaveis/index.js` | `responsaveis` | — |
| `pages/api/responsaveis/[id].js` | `responsaveis` | — |
| `pages/api/slider.js` | `slider` | Mantém `fs` para leitura de arquivos do disco |
| `pages/api/turmas/index.js` | `turmas` | — |
| `pages/api/turmas/[id].js` | `turmas` | — |
| `pages/api/usuarios.js` | `usuarios` | — |
| `pages/api/usuarios/alterar-senha.js` | `usuarios` | Removido crypto/SHA256 legado |
| `pages/api/usuarios/atualizar-perfil.js` | `usuarios` | Mantém `fs` + `formidable` para foto |

---

## Arquivos JSON Deletados (26 arquivos)

```
data/notas-faltas.json
data/livro-registro.json
data/funcionarios.json
data/disciplinas.json
data/grades.json
data/atividades-complementares.json
data/planejamento-diario.json
data/avaliacoes.json
data/documentos.json
data/emails-enviados.json
data/usuarios-sistema.json
data/matriculadores.json
data/solicitacoes.json
data/noticias.json
data/forum.json
data/campanhas-matriculas.json
data/slider.json
data/alunos.json
data/turmas.json
data/cursos.json
data/professores.json
data/responsaveis.json
data/unidades.json
data/anos-letivos.json
data/configuracoes-empresa.json
data/usuarios.json  ← CRÍTICO: continha senhas em texto plano
```

---

## Melhorias de Segurança

- **`data/usuarios.json`** continha senhas em texto plano de todos os usuários do sistema. Arquivo deletado.
- **`pages/api/auth/login.js`** foi refatorado para consultar diretamente o Supabase, eliminando a exposição de credenciais em arquivos locais.
- **`pages/api/usuarios/alterar-senha.js`** foi simplificado — removido uso desnecessário de `crypto.SHA256` que não correspondia ao armazenamento real de senhas.

---

## Padrão Adotado

Todas as APIs seguem o mesmo padrão:

```js
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePerfil, hasPerfil, resolveInstituicaoId, applyInstituicaoFilter } from '../../lib/auth-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

- Multi-tenant via `instituicao_id` em todas as tabelas
- `grupo_admin` tem acesso irrestrito (bypass de filtro)
- `applyInstituicaoFilter` aplica o isolamento de dados por instituição
