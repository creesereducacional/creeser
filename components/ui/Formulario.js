/**
 * @file components/ui/Formulario.js
 * @description Componente reutilizável para formulários
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Componente profissional de formulário que encapsula:
 * - Estrutura semântica HTML
 * - Estilos Tailwind consistentes
 * - Validação visual
 * - Acessibilidade
 * - Responsividade
 */

import React from 'react';

/**
 * Componente Campo de Formulário
 * Renderiza um campo com label, input e mensagem de erro
 */
export function CampoFormulario({
  nome,
  tipo = 'text',
  label,
  placeholder,
  valor,
  erro,
  desabilitado = false,
  requerido = false,
  onChange,
  opcoes = [], // Para selects
  linhas, // Para textarea
}) {
  const temErro = erro && erro.trim() !== '';

  return (
    <div className="mb-4">
      {/* Label */}
      {label && (
        <label
          htmlFor={nome}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {requerido && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select */}
      {tipo === 'select' ? (
        <select
          id={nome}
          name={nome}
          value={valor}
          onChange={onChange}
          disabled={desabilitado}
          className={`w-full px-4 py-2 border rounded-lg font-medium transition-colors ${
            temErro
              ? 'border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:ring-teal-200'
          } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed`}
        >
          <option value="">-- Selecione --</option>
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
            </option>
          ))}
        </select>
      ) : /* Textarea */ tipo === 'textarea' ? (
        <textarea
          id={nome}
          name={nome}
          value={valor}
          onChange={onChange}
          disabled={desabilitado}
          rows={linhas || 4}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg font-medium transition-colors ${
            temErro
              ? 'border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:ring-teal-200'
          } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none`}
        />
      ) : /* Input padrão */ (
        <input
          id={nome}
          type={tipo}
          name={nome}
          value={valor}
          onChange={onChange}
          disabled={desabilitado}
          placeholder={placeholder}
          required={requerido}
          className={`w-full px-4 py-2 border rounded-lg font-medium transition-colors ${
            temErro
              ? 'border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:ring-teal-200'
          } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />
      )}

      {/* Mensagem de erro */}
      {temErro && (
        <p className="text-red-500 text-sm mt-1">{erro}</p>
      )}
    </div>
  );
}

/**
 * Componente Formulário wrapper
 * Encapsula múltiplos campos de formulário
 */
export function Formulario({
  campos = [],
  valores,
  erros = {},
  carregando = false,
  aoSubmeter,
  aoReset,
  labelBotaoSubmit = 'Salvar',
  mostrarBotaoReset = true,
  labelBotaoReset = 'Limpar',
  filhos,
}) {
  return (
    <form onSubmit={aoSubmeter} className="space-y-4">
      {/* Renderiza campos do array */}
      {campos.map((campo) => (
        <CampoFormulario
          key={campo.nome}
          nome={campo.nome}
          tipo={campo.tipo}
          label={campo.label}
          placeholder={campo.placeholder}
          valor={valores[campo.nome] || ''}
          erro={erros[campo.nome] || ''}
          desabilitado={carregando || campo.desabilitado}
          requerido={campo.requerido}
          onChange={campo.onChange}
          opcoes={campo.opcoes}
          linhas={campo.linhas}
        />
      ))}

      {/* Filhos customizados */}
      {filhos}

      {/* Erro geral */}
      {erros.geral && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {erros.geral}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={carregando}
          className="flex-1 px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
        >
          {carregando ? 'Processando...' : labelBotaoSubmit}
        </button>

        {mostrarBotaoReset && (
          <button
            type="button"
            onClick={aoReset}
            disabled={carregando}
            className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-colors"
          >
            {labelBotaoReset}
          </button>
        )}
      </div>
    </form>
  );
}

export default Formulario;
