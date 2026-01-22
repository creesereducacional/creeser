/**
 * @file hooks/useFormData.js
 * @description Hook customizado para gerenciar estado de formulários
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Este hook encapsula a lógica comum de formulários com:
 * - Gerenciamento de estado de campos
 * - Validação básica
 * - Reset de formulário
 * - Submit handler
 */

import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar dados de formulário
 * 
 * @param {Object} valoresIniciais - Valores iniciais dos campos
 * @param {Function} onSubmit - Função chamada ao submeter (obrigatório)
 * @returns {Object} { valores, erros, carregando, handleChange, handleSubmit, resetar }
 * 
 * @example
 * const { valores, erros, handleChange, handleSubmit } = useFormData(
 *   { nome: '', email: '' },
 *   async (dados) => { await salvarDados(dados); }
 * );
 */
export function useFormData(valoresIniciais, onSubmit) {
  const [valores, setValores] = useState(valoresIniciais);
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  /**
   * Atualiza um campo do formulário
   */
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const novoValor = type === 'checkbox' ? checked : value;

    setValores(estadoAnterior => ({
      ...estadoAnterior,
      [name]: novoValor,
    }));

    // Limpa erro do campo quando o usuário começa a digitar
    if (erros[name]) {
      setErros(estadoAnterior => ({
        ...estadoAnterior,
        [name]: '',
      }));
    }
  }, [erros]);

  /**
   * Submete o formulário
   */
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    try {
      setCarregando(true);
      setErros({});
      await onSubmit(valores);
    } catch (erro) {
      console.error('Erro ao submeter formulário:', erro);
      setErros({
        geral: erro.message || 'Erro ao processar formulário',
      });
    } finally {
      setCarregando(false);
    }
  }, [valores, onSubmit]);

  /**
   * Reseta o formulário aos valores iniciais
   */
  const resetar = useCallback(() => {
    setValores(valoresIniciais);
    setErros({});
  }, [valoresIniciais]);

  /**
   * Define erros manualmente (útil para validação do servidor)
   */
  const setarErros = useCallback((novosErros) => {
    setErros(novosErros);
  }, []);

  return {
    valores,
    erros,
    carregando,
    handleChange,
    handleSubmit,
    resetar,
    setarErros,
  };
}

export default useFormData;
