# 🚀 Guia de Integração Supabase - CREESER Educacional

**Data:** 29 de dezembro de 2025  
**Status:** Pronto para implementação  

---

## 📋 Resumo do que foi preparado

✅ **Arquivo `.env.local`** - Configurado com suas credenciais  
✅ **Arquivo `lib/supabase.js`** - Cliente Supabase com funções auxiliares  
✅ **Arquivo `supabase/schema.sql`** - Schema completo com todas as tabelas  
✅ **Script `scripts/migrate-data.js`** - Migração automática de dados JSON  
✅ **Package.json** - Atualizado com dependência do Supabase  

---

## 🔧 Passo a Passo de Implementação

### **Passo 1: Executar o Schema SQL no Supabase**

1. Acesse o [Painel Supabase](https://app.supabase.com)
2. Selecione seu projeto: `wjcbobcqyqdkludsbqgf`
3. Vá para **SQL Editor** → **New Query**
4. Copie todo o conteúdo do arquivo `supabase/schema.sql`
5. Cole no editor SQL
6. Clique em **Run** (ícone ▶️ preto)
7. Aguarde até ver a mensagem de sucesso ✅

> ⚠️ **Nota:** O script criará todas as tabelas, índices e funções automaticamente.

---

### **Passo 2: Instalar Dependências do Supabase**

Execute no terminal do projeto:

```bash
npm install
```

Isso instalará o pacote `@supabase/supabase-js` necessário.

---

### **Passo 3: Executar Migração de Dados**

Após instalar as dependências, execute:

```bash
node scripts/migrate-data.js
```

**O que este script faz:**
- ✅ Lê todos os arquivos JSON da pasta `/data`
- ✅ Transforma os dados conforme necessário
- ✅ Insere os dados nas tabelas do Supabase
- ✅ Exibe relatório de sucesso/erro

**Saída esperada:**
```
🚀 Iniciando migração de dados para Supabase...

✅ unidades: 2 registros inseridos
✅ cursos: 1 registros inserido
✅ turmas: 1 registros inserido
✅ usuarios: 15 registros inseridos
✅ alunos: 25 registros inseridos
✅ funcionarios: 5 registros inseridos
...

==================================================
✅ Migração concluída: 20 tabelas inseridas
==================================================
```

---

### **Passo 4: Usar o Supabase no seu Código**

Exemplo de uso em uma página Next.js:

```javascript
import { supabase } from '@/lib/supabase';

export default function MinhaComponente() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    async function buscarUsuarios() {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tipo', 'aluno');

      if (error) console.error(error);
      else setUsuarios(data);
    }

    buscarUsuarios();
  }, []);

  return (
    // Seu JSX aqui
  );
}
```

---

## 📊 Estrutura de Tabelas Criadas

### **Tabelas Principais**
| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Usuários do sistema (admin, professor, aluno, etc) |
| `alunos` | Dados específicos de alunos |
| `professores` | Dados específicos de professores |
| `funcionarios` | Dados de funcionários |
| `responsaveis` | Responsáveis/pais dos alunos |
| `unidades` | Unidades/campi da instituição |
| `cursos` | Cursos ofertados |
| `turmas` | Turmas de cada curso |
| `disciplinas` | Disciplinas dos cursos |

### **Tabelas de Avaliação**
| Tabela | Descrição |
|--------|-----------|
| `avaliacoes` | Avaliações/provas |
| `notas_faltas` | Notas e faltas dos alunos |
| `livro_registro` | Registro de aulas |
| `planejamento_diario` | Planejamento de aulas |

### **Tabelas de Comunicação**
| Tabela | Descrição |
|--------|-----------|
| `noticias` | Notícias do sistema |
| `blog` | Posts do blog |
| `forum` | Tópicos de fórum |
| `respostas_forum` | Respostas no fórum |
| `documentos` | Documentos compartilhados |
| `emails_enviados` | Log de emails |

### **Tabelas de Suporte**
| Tabela | Descrição |
|--------|-----------|
| `campanhas_matriculas` | Campanhas de matrícula |
| `matriculadores` | Matriculadores |
| `solicitacoes` | Solicitações dos alunos |
| `atividades_complementares` | Atividades complementares |
| `anos_letivos` | Anos letivos disponíveis |
| `slider` | Itens do slider/carousel |
| `configuracoes_empresa` | Configurações do sistema |

---

## 🔑 Credenciais Configuradas

```
URL: https://wjcbobcqyqdkludsbqgf.supabase.co
Publishable Key: sb_publishable_EpWHRpMB_HxVI0Afb6SnXw_M48qjBxY
Service Role Key: sb_secret_WhbTxAHOrj498hD8sSeXaA_Nu4op2iQ
```

---

## 🛡️ Segurança

### ⚠️ **IMPORTANTE**

1. **Não compartilhe a `Service Role Key`** - ela tem acesso administrativo
2. **Apenas `Publishable Key` deve ser usada no cliente** (está no `.env.local`)
3. **Operações sensíveis devem usar `Service Role Key` do servidor**
4. **Configure RLS (Row Level Security)** no Supabase para produção

---

## 🔍 Próximos Passos Recomendados

1. ✅ **Implementar autenticação com Supabase Auth**
   - Preparar login/registro de usuários

2. ✅ **Configurar RLS (Row Level Security)**
   - Garantir que alunos apenas vejam seus dados
   - Professores vejam apenas suas turmas

3. ✅ **Criar API routes** que usem Supabase
   - Endpoints para CRUD de dados

4. ✅ **Testar em produção**
   - Validar todas as funcionalidades

5. ✅ **Backup e recuperação**
   - Configurar backups automáticos no Supabase

---

## 📞 Suporte

### Erros Comuns

**Erro: "Variáveis de ambiente não configuradas"**
- Certifique-se que `.env.local` existe e tem as variáveis

**Erro: "Permission denied" ao criar tabelas**
- Verifique que está usando a `Service Role Key` no Supabase SQL Editor

**Erro ao migrar dados**
- Verifique se os arquivos JSON existem em `/data`
- Veja o log de erros para identificar a tabela com problema

---

## 📱 Estrutura de Arquivos

```
creeser/
├── .env.local                 ✅ Configurações Supabase
├── lib/
│   └── supabase.js           ✅ Cliente Supabase
├── scripts/
│   └── migrate-data.js       ✅ Script de migração
├── supabase/
│   └── schema.sql            ✅ Schema do banco de dados
├── data/                     📁 Dados JSON originais
│   ├── usuarios.json
│   ├── alunos.json
│   └── ...
└── package.json              ✅ Dependências atualizadas
```

---

## ✨ Resumo Final

Você agora tem um **banco de dados completo** no Supabase configurado para:

- 🎓 Gerenciar alunos, professores, funcionários
- 📚 Administrar cursos, turmas, disciplinas
- 📊 Registrar notas, frequência, avaliações
- 💬 Facilitar comunicação via fórum, notícias, emails
- 📄 Compartilhar documentos e conteúdos
- 🔒 Controlar acesso com autenticação

**Está pronto para iniciar o desenvolvimento!** 🚀

---

*Próximo passo: Implementar componentes que consomem os dados do Supabase*
