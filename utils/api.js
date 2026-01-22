/**
 * @file utils/api.js
 * @description Cliente HTTP customizado para fazer requisições à API
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Centraliza toda a comunicação com a API backend
 * com tratamento de erros, retry, e autenticação
 */

import { API_CONFIG } from './constantes';

/**
 * Classe para fazer requisições HTTP à API
 * 
 * @class ClienteAPI
 * 
 * @example
 * // Usar método estático simples
 * const dados = await ClienteAPI.get('/api/alunos');
 * 
 * // Ou criar instância para operações em lote
 * const cliente = new ClienteAPI();
 * const resultado = await cliente.post('/api/usuarios', { nome: 'João' });
 */
class ClienteAPI {
  /**
   * Cria uma nova instância do cliente
   * 
   * @param {Object} opcoes - Opções de configuração
   * @param {string} opcoes.baseURL - URL base da API
   * @param {Object} opcoes.headers - Headers padrões
   * @param {number} opcoes.timeout - Timeout em ms
   */
  constructor(opcoes = {}) {
    this.baseURL = opcoes.baseURL || process.env.NEXT_PUBLIC_API_URL || '';
    this.headers = opcoes.headers || {
      'Content-Type': 'application/json',
    };
    this.timeout = opcoes.timeout || API_CONFIG.TIMEOUT;
  }

  /**
   * Obter token de autenticação do localStorage
   * 
   * @private
   * @returns {string|null} Token JWT ou null
   */
  _obterToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || null;
  }

  /**
   * Preparar headers com autenticação
   * 
   * @private
   * @returns {Object} Headers com autorização
   */
  _prepararHeaders() {
    const headers = { ...this.headers };
    const token = this._obterToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Construir URL completa
   * 
   * @private
   * @param {string} endpoint - Endpoint da API
   * @returns {string} URL completa
   */
  _construirURL(endpoint) {
    return this.baseURL ? `${this.baseURL}${endpoint}` : endpoint;
  }

  /**
   * Fazer requisição com tratamento de erros
   * 
   * @private
   * @param {string} url - URL completa
   * @param {Object} opcoes - Opções fetch
   * @returns {Promise<Object>} Resposta JSON
   * @throws {Error} Se houver erro na requisição
   */
  async _fazerRequisicao(url, opcoes = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resposta = await fetch(url, {
        ...opcoes,
        signal: controller.signal,
        headers: this._prepararHeaders(),
      });

      clearTimeout(timeoutId);

      // Tentar parsear JSON se houver conteúdo
      let dados = null;
      const contentType = resposta.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        dados = await resposta.json();
      }

      // Se resposta não foi OK, lançar erro
      if (!resposta.ok) {
        const mensagem = dados?.mensagem || `Erro ${resposta.status}`;
        const erro = new Error(mensagem);
        erro.status = resposta.status;
        erro.dados = dados;
        throw erro;
      }

      return dados;
    } catch (erro) {
      clearTimeout(timeoutId);

      // Erros de rede ou timeout
      if (erro.name === 'AbortError') {
        throw new Error('Requisição expirou. Tente novamente.');
      }

      // Se erro é autenticação (401), limpar token
      if (erro.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }

      throw erro;
    }
  }

  /**
   * Fazer requisição GET
   * 
   * @param {string} endpoint - Endpoint da API
   * @param {Object} opcoes - Opções adicionais
   * @param {Object} opcoes.parametros - Query parameters
   * @param {number} opcoes.tentativa - Tentativa atual para retry
   * @returns {Promise<Object>} Resposta JSON
   * 
   * @example
   * const alunos = await ClienteAPI.get('/api/alunos');
   * const filtrado = await ClienteAPI.get('/api/alunos', { 
   *   parametros: { status: 'ativo', pagina: 1 } 
   * });
   */
  async get(endpoint, opcoes = {}) {
    let url = this._construirURL(endpoint);

    // Adicionar query parameters
    if (opcoes.parametros && Object.keys(opcoes.parametros).length > 0) {
      const params = new URLSearchParams();
      Object.entries(opcoes.parametros).forEach(([chave, valor]) => {
        if (valor !== null && valor !== undefined) {
          params.append(chave, valor);
        }
      });
      url += `?${params.toString()}`;
    }

    try {
      return await this._fazerRequisicao(url, {
        method: 'GET',
      });
    } catch (erro) {
      // Tentar retry em caso de erro de rede
      if (opcoes.tentativa < API_CONFIG.RETRY_TENTATIVAS) {
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY * (opcoes.tentativa + 1))
        );
        return this.get(endpoint, {
          ...opcoes,
          tentativa: (opcoes.tentativa || 0) + 1,
        });
      }
      throw erro;
    }
  }

  /**
   * Fazer requisição POST
   * 
   * @param {string} endpoint - Endpoint da API
   * @param {Object} corpo - Dados a enviar
   * @param {Object} opcoes - Opções adicionais
   * @returns {Promise<Object>} Resposta JSON
   * 
   * @example
   * const novo = await ClienteAPI.post('/api/alunos', {
   *   nome: 'João Silva',
   *   email: 'joao@email.com'
   * });
   */
  async post(endpoint, corpo = {}, opcoes = {}) {
    const url = this._construirURL(endpoint);

    try {
      return await this._fazerRequisicao(url, {
        method: 'POST',
        body: JSON.stringify(corpo),
      });
    } catch (erro) {
      // Não fazer retry em POST (operação não idempotente)
      throw erro;
    }
  }

  /**
   * Fazer requisição PUT (atualizar completo)
   * 
   * @param {string} endpoint - Endpoint da API
   * @param {Object} corpo - Dados a enviar
   * @param {Object} opcoes - Opções adicionais
   * @returns {Promise<Object>} Resposta JSON
   * 
   * @example
   * const atualizado = await ClienteAPI.put('/api/alunos/123', {
   *   nome: 'João Santos'
   * });
   */
  async put(endpoint, corpo = {}, opcoes = {}) {
    const url = this._construirURL(endpoint);

    return this._fazerRequisicao(url, {
      method: 'PUT',
      body: JSON.stringify(corpo),
    });
  }

  /**
   * Fazer requisição PATCH (atualizar parcial)
   * 
   * @param {string} endpoint - Endpoint da API
   * @param {Object} corpo - Dados a enviar
   * @param {Object} opcoes - Opções adicionais
   * @returns {Promise<Object>} Resposta JSON
   * 
   * @example
   * const atualizado = await ClienteAPI.patch('/api/alunos/123', {
   *   status: 'ativo'
   * });
   */
  async patch(endpoint, corpo = {}, opcoes = {}) {
    const url = this._construirURL(endpoint);

    return this._fazerRequisicao(url, {
      method: 'PATCH',
      body: JSON.stringify(corpo),
    });
  }

  /**
   * Fazer requisição DELETE
   * 
   * @param {string} endpoint - Endpoint da API
   * @param {Object} opcoes - Opções adicionais
   * @returns {Promise<Object>} Resposta JSON
   * 
   * @example
   * await ClienteAPI.delete('/api/alunos/123');
   */
  async delete(endpoint, opcoes = {}) {
    const url = this._construirURL(endpoint);

    return this._fazerRequisicao(url, {
      method: 'DELETE',
    });
  }

  /**
   * Fazer upload de arquivo
   * 
   * @param {string} endpoint - Endpoint da API
   * @param {File} arquivo - Arquivo a fazer upload
   * @param {Object} dadosAdicionais - Dados adicionais junto com arquivo
   * @returns {Promise<Object>} Resposta JSON
   * 
   * @example
   * const resultado = await ClienteAPI.upload(
   *   '/api/documentos/upload',
   *   arquivoInput.files[0],
   *   { aluno_id: 123 }
   * );
   */
  async upload(endpoint, arquivo, dadosAdicionais = {}) {
    const url = this._construirURL(endpoint);
    const formData = new FormData();

    formData.append('arquivo', arquivo);

    Object.entries(dadosAdicionais).forEach(([chave, valor]) => {
      formData.append(chave, valor);
    });

    // Não usar headers padrão para upload (deixar browser definir multipart)
    const headers = this._prepararHeaders();
    delete headers['Content-Type'];

    const resposta = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      const erro = new Error(dados.mensagem || `Erro ${resposta.status}`);
      erro.status = resposta.status;
      erro.dados = dados;
      throw erro;
    }

    return dados;
  }
}

// Criar instância padrão e exportar métodos estáticos
const clientePadrao = new ClienteAPI();

/**
 * Cliente API com métodos estáticos para uso simples
 * 
 * @example
 * const usuarios = await ClienteAPI.get('/api/usuarios');
 */
export const ClienteAPIPadrao = {
  get: clientePadrao.get.bind(clientePadrao),
  post: clientePadrao.post.bind(clientePadrao),
  put: clientePadrao.put.bind(clientePadrao),
  patch: clientePadrao.patch.bind(clientePadrao),
  delete: clientePadrao.delete.bind(clientePadrao),
  upload: clientePadrao.upload.bind(clientePadrao),
  criar: (opcoes) => new ClienteAPI(opcoes),
};

// Exportar como default e nomeado
export default ClienteAPIPadrao;
export { ClienteAPI };
