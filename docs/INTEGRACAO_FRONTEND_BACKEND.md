# 🔗 GUIA DE INTEGRAÇÃO: FRONTEND NEXT.JS + BACKEND API

## 1. MUDANÇAS NECESSÁRIAS NO FRONTEND (Next.js Atual)

O Next.js atual precisa de ajustes MÍNIMOS para funcionar com a nova API multi-tenant.

---

## 2. ATUALIZAR CONTEXTO DE AUTENTICAÇÃO

### Novo: `context/AuthContext.js`

```javascript
import { createContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Carregar dados do localStorage ao montar
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('auth');
    if (dadosSalvos) {
      try {
        const { usuario, empresaId, token } = JSON.parse(dadosSalvos);
        setUsuario(usuario);
        setEmpresaId(empresaId);
        setToken(token);
      } catch (e) {
        console.error('Erro ao carregar auth do localStorage:', e);
      }
    }
    setCarregando(false);
  }, []);

  const login = useCallback(async (email, senha, empresaId) => {
    try {
      setCarregando(true);
      setErro(null);

      // Chamar API do backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha, empresaId }),
        }
      );

      if (!response.ok) {
        throw new Error('Falha na autenticação');
      }

      const dados = await response.json();
      const { token, usuario } = dados.data;

      // Salvar no contexto e localStorage
      setToken(token);
      setUsuario(usuario);
      setEmpresaId(empresaId);

      localStorage.setItem(
        'auth',
        JSON.stringify({
          token,
          usuario,
          empresaId,
          timestamp: Date.now(),
        })
      );

      return { sucesso: true, usuario, empresaId };
    } catch (err) {
      setErro(err.message);
      return { sucesso: false, erro: err.message };
    } finally {
      setCarregando(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Chamar endpoint de logout (opcional)
      if (token) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } catch (err) {
      console.error('Erro ao fazer logout na API:', err);
    } finally {
      setToken(null);
      setUsuario(null);
      setEmpresaId(null);
      localStorage.removeItem('auth');
      router.push('/login');
    }
  }, [token, router]);

  const isAutenticado = !!token && !!usuario;

  return (
    <AuthContext.Provider
      value={{
        usuario,
        empresaId,
        token,
        carregando,
        erro,
        login,
        logout,
        isAutenticado,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar contexto
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
```

---

## 3. ATUALIZAR PAGES/_APP.JS

```javascript
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SidebarProvider } from '../context/SidebarContext';
import CookieBanner from '../components/CookieBanner';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Component {...pageProps} />
        <CookieBanner />
      </SidebarProvider>
    </AuthProvider>
  );
}

export default MyApp;
```

---

## 4. ATUALIZAR PAGES/LOGIN.JS

```javascript
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/login.module.css';

export default function Login() {
  const router = useRouter();
  const { login, carregando } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [erro, setErro] = useState('');
  const [empresas, setEmpresas] = useState([]);

  // Carregar lista de empresas ao montar
  React.useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/empresas`
      );
      if (response.ok) {
        const dados = await response.json();
        setEmpresas(dados.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!email || !senha || !empresaId) {
      setErro('Preencha todos os campos');
      return;
    }

    const { sucesso, usuario, erro: erroLogin } = await login(
      email,
      senha,
      empresaId
    );

    if (sucesso) {
      // Redirecionar conforme tipo
      if (usuario.tipo === 'admin') {
        router.push('/admin/dashboard');
      } else if (usuario.tipo === 'professor') {
        router.push('/professor/dashboard');
      } else if (usuario.tipo === 'aluno') {
        router.push('/aluno/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErro(erroLogin || 'Falha na autenticação');
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>CREESER - Login</h1>

        {erro && <div className={styles.erro}>{erro}</div>}

        <div className={styles.formGroup}>
          <label>Selecione a Empresa</label>
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            required
          >
            <option value="">-- Selecione uma empresa --</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={carregando}>
          {carregando ? 'Autenticando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
```

---

## 5. CRIAR SERVICE PARA REQUISIÇÕES COM TOKEN

### Novo: `lib/apiClient.js`

```javascript
/**
 * Cliente HTTP para a API
 * Automaticamente inclui token e empresaId em todas requisições
 */

export class APIClient {
  constructor(baseURL, getAuthToken, getEmpresaId) {
    this.baseURL = baseURL;
    this.getAuthToken = getAuthToken;
    this.getEmpresaId = getEmpresaId;
  }

  private getHeaders(customHeaders = {}) {
    const token = this.getAuthToken();
    const empresaId = this.getEmpresaId();

    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (empresaId) {
      headers['X-Empresa-Id'] = empresaId;
    }

    return headers;
  }

  private getUrl(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseURL}${endpoint}`;
  }

  async request(
    endpoint,
    options = {}
  ) {
    const url = this.getUrl(endpoint);
    const config = {
      ...options,
      headers: this.getHeaders(options.headers),
    };

    try {
      const response = await fetch(url, config);

      // Tratamento de erro 401 (token expirado)
      if (response.status === 401) {
        // Tentar refresh do token
        const novoToken = await this.refreshToken();
        if (novoToken) {
          // Repetir requisição com novo token
          config.headers['Authorization'] = `Bearer ${novoToken}`;
          return fetch(url, config);
        }
      }

      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        throw new Error(erro.erro || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (erro) {
      console.error(`API Error [${endpoint}]:`, erro);
      throw erro;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  private async refreshToken() {
    try {
      const response = await fetch(
        `${this.baseURL}/api/v1/auth/refresh`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );

      if (response.ok) {
        const dados = await response.json();
        return dados.data?.token;
      }
    } catch (erro) {
      console.error('Erro ao renovar token:', erro);
    }

    return null;
  }
}

// Singleton instance
let apiClient = null;

export function initializeAPIClient(token, empresaId) {
  if (!apiClient) {
    apiClient = new APIClient(
      process.env.NEXT_PUBLIC_API_URL,
      () => token,
      () => empresaId
    );
  }
  return apiClient;
}

export function getApiClient() {
  if (!apiClient) {
    throw new Error('APIClient não foi inicializado');
  }
  return apiClient;
}
```

### Usar no Componente:

```javascript
import { useAuth } from '../context/AuthContext';
import { getApiClient } from '../lib/apiClient';

export default function ListaAlunos() {
  const { token, empresaId } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const api = getApiClient();

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      const response = await api.get('/api/v1/alunos');
      setAlunos(response.data);
    } catch (erro) {
      console.error('Erro ao carregar alunos:', erro);
    }
  };

  return (
    <div>
      {alunos.map((aluno) => (
        <div key={aluno.id}>{aluno.nomeCompleto}</div>
      ))}
    </div>
  );
}
```

---

## 6. PROTEGER ROTAS COM AUTENTICAÇÃO

### Novo: `components/ProtectedRoute.js`

```javascript
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({
  children,
  requiredTipos = [],
  fallback = null,
}) {
  const router = useRouter();
  const { isAutenticado, usuario, carregando } = useAuth();

  useEffect(() => {
    if (!carregando && !isAutenticado) {
      router.push('/login');
      return;
    }

    if (
      !carregando &&
      requiredTipos.length > 0 &&
      !requiredTipos.includes(usuario?.tipo)
    ) {
      router.push('/dashboard');
    }
  }, [isAutenticado, carregando, usuario, router, requiredTipos]);

  if (carregando) {
    return fallback || <div>Carregando...</div>;
  }

  if (!isAutenticado) {
    return null;
  }

  if (requiredTipos.length > 0 && !requiredTipos.includes(usuario?.tipo)) {
    return null;
  }

  return children;
}
```

### Usar:

```javascript
// pages/admin/dashboard.js
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredTipos={['admin']}>
      <DashboardLayout>
        {/* Conteúdo do admin */}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

## 7. VARIÁVEIS DE AMBIENTE FRONTEND

### `.env.local`

```env
# API Backend
NEXT_PUBLIC_API_URL=https://api.creeser.com

# Ou para desenvolvimento:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Features
NEXT_PUBLIC_FEATURE_DARK_MODE=true
NEXT_PUBLIC_FEATURE_NOTIFICATIONS=true

# Analytics (opcional)
NEXT_PUBLIC_GOOGLE_ANALYTICS=UA-XXXXXX-X
```

---

## 8. EXEMPLO: CRUD DE ALUNOS

### `pages/alunos/index.js`

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';

export default function ListaAlunos() {
  const { token, empresaId } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      setCarregando(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/alunos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Empresa-Id': empresaId,
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao carregar alunos');

      const dados = await response.json();
      setAlunos(dados.data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const deletarAluno = async (alunoId) => {
    if (!confirm('Tem certeza?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/alunos/${alunoId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Empresa-Id': empresaId,
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao deletar aluno');

      setAlunos((prev) => prev.filter((a) => a.id !== alunoId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (carregando) return <DashboardLayout>Carregando...</DashboardLayout>;
  if (erro) return <DashboardLayout>Erro: {erro}</DashboardLayout>;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container">
          <h1>Lista de Alunos</h1>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td>{aluno.nomeCompleto}</td>
                  <td>{aluno.email}</td>
                  <td>{aluno.cpf}</td>
                  <td>{aluno.statusAcademico}</td>
                  <td>
                    <button
                      onClick={() => deletarAluno(aluno.id)}
                      className="btn-danger"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

---

## 9. MIGRAÇÃO DE DADOS: JSON → POSTGRESQL

### Script: `scripts/migrateData.js` (rodar no backend)

```javascript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrar() {
  try {
    console.log('Iniciando migração de dados...');

    // 1. Criar empresa padrão
    const empresa = await prisma.empresa.create({
      data: {
        nome: 'Creeser Educacional',
        nomeFantasia: 'CREESER',
        cnpj: '00.000.000/0000-00',
        razaoSocial: 'Creeser Educacional LTDA',
        email: 'contato@creeser.com',
        status: 'ativo',
      },
    });

    console.log('✅ Empresa criada:', empresa.id);

    // 2. Migrar usuários
    const usuariosJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/usuarios-sistema.json'), 'utf-8')
    );

    for (const usuario of usuariosJson) {
      await prisma.usuario.create({
        data: {
          empresaId: empresa.id,
          nomeCompleto: usuario.nome,
          email: usuario.email,
          senha: usuario.senha || 'hash_aqui', // Usar bcrypt!
          tipo: usuario.tipo.toLowerCase(),
          ativo: usuario.ativo ?? true,
        },
      });
    }

    console.log(`✅ ${usuariosJson.length} usuários migrados`);

    // 3. Migrar alunos
    const alunosJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/alunos.json'), 'utf-8')
    );

    for (const aluno of alunosJson) {
      await prisma.aluno.create({
        data: {
          empresaId: empresa.id,
          nomeCompleto: aluno.nomeCompleto,
          email: aluno.email,
          cpf: aluno.cpf,
          dataNascimento: aluno.dataNascimento
            ? new Date(aluno.dataNascimento)
            : null,
          statusAcademico: aluno.status || 'ativo',
          ativo: aluno.ativo ?? true,
        },
      });
    }

    console.log(`✅ ${alunosJson.length} alunos migrados`);

    console.log('✅ Migração concluída!');
  } catch (erro) {
    console.error('❌ Erro na migração:', erro);
  } finally {
    await prisma.$disconnect();
  }
}

migrar();
```

---

## 10. CHECKLIST DE INTEGRAÇÃO

### Frontend
- [ ] Instalar dependências (se necessário)
- [ ] Criar `context/AuthContext.js` com novo provider
- [ ] Atualizar `pages/_app.js` para usar AuthProvider
- [ ] Reescrever `pages/login.js` para chamar API
- [ ] Criar `lib/apiClient.js` para requisições com token
- [ ] Criar `components/ProtectedRoute.js`
- [ ] Atualizar exemplo de página (alunos, turmas, etc)
- [ ] Configurar `.env.local` com URL da API
- [ ] Testar login → redirect → alunos
- [ ] Testar isolamento (empresa 1 vs empresa 2)

### Backend (ChatGPT vai fazer)
- [ ] Criar API completa
- [ ] Implementar middleware de tenant
- [ ] Testar endpoints com Postman
- [ ] Fazer deploy na VPS

---

## 11. FLUXO COMPLETO DE INTEGRAÇÃO

```
┌─────────────────────────────────────┐
│  Frontend (Next.js) - localhost:3000│
├─────────────────────────────────────┤
│ 1. Usuario vai para /login          │
│ 2. Seleciona empresa + email + senha│
│ 3. POST /api/v1/auth/login          │
│    com empresaId no body            │
└────────────────┬────────────────────┘
                 │
                 │ HTTP Request
                 ▼
┌─────────────────────────────────────┐
│ Backend (Express) - api.creeser.com │
├─────────────────────────────────────┤
│ 1. Recebe login request             │
│ 2. Valida email/senha               │
│ 3. Gera JWT com empresaId no payload│
│ 4. Retorna token                    │
└────────────────┬────────────────────┘
                 │
                 │ Response com token
                 ▼
┌─────────────────────────────────────┐
│ Frontend Armazena                   │
│ localStorage: {                     │
│   token: "eyJ...",                  │
│   empresaId: "emp_123",             │
│   usuario: {...}                    │
│ }                                   │
│ Redirect para /admin/dashboard      │
└─────────────────────────────────────┘
                 │
                 │ Próxima requisição
                 ▼
┌─────────────────────────────────────┐
│ GET /api/v1/alunos                  │
│ Headers:                            │
│ - Authorization: Bearer eyJ...      │
│ - X-Empresa-Id: emp_123            │
└────────────────┬────────────────────┘
                 │
                 │ Middleware: authenticate()
                 │ - Valida token
                 │ - Extrai empresaId
                 ▼
┌─────────────────────────────────────┐
│ SELECT * FROM Aluno                 │
│ WHERE empresaId = 'emp_123'         │
│ (ISOLAMENTO SEGURO)                 │
└────────────────┬────────────────────┘
                 │
                 │ Response com alunos filtrados
                 ▼
┌─────────────────────────────────────┐
│ Frontend Renderiza Lista de Alunos  │
│ (apenas da empresa do usuário)      │
└─────────────────────────────────────┘
```

---

**Próximo passo: Chamar ChatGPT para criar o backend!** 🚀
