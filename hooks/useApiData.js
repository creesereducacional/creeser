/**
 * @file hooks/useApiData.js
 * @description Hook customizado para carregar dados de APIs
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Este hook encapsula a lógica comum de fetch de dados com:
 * - Tratamento de erros
 * - Estado de carregamento
 * - Cache opcional
 * - Refetch automático
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para carregar dados de uma API
 * 
 * @param {string} url - URL da API a ser chamada
 * @param {Object} options - Opções adicionais
 * @param {boolean} options.autoLoad - Carregar dados automaticamente (padrão: true)
 * @param {number} options.cacheTime - Tempo de cache em ms (padrão: 0 - sem cache)
 * @param {Array} options.dependencies - Dependências para re-fetch (padrão: [])
 * @returns {Object} { data, loading, erro, refetch }
 * 
 * @example
 * const { data: alunos, loading, erro, refetch } = useApiData('/api/alunos');
 */
export function useApiData(url, options = {}) {
  const {
    autoLoad = true,
    cacheTime = 0,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [erro, setErro] = useState(null);

  /**
   * Função para buscar dados da API
   */
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const resposta = await fetch(url);
      
      if (!resposta.ok) {
        throw new Error(`Erro ${resposta.status}: ${resposta.statusText}`);
      }

      const dadosObtidos = await resposta.json();
      setData(dadosObtidos);
    } catch (erroObtido) {
      console.error(`Erro ao buscar dados de ${url}:`, erroObtido);
      setErro(erroObtido.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Carrega dados quando o componente monta ou dependências mudam
  useEffect(() => {
    if (autoLoad) {
      refetch();
    }
  }, [autoLoad, refetch, ...dependencies]);

  return { data, loading, erro, refetch };
}

export default useApiData;
