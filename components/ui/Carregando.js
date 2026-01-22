/**
 * @file components/ui/Carregando.js
 * @description Componentes de carregamento (spinners, skeletons)
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Componentes para indicar estado de carregamento
 */

import React from 'react';

/**
 * Spinner de carregamento simples
 * 
 * @param {string} tamanho - Tamanho: 'pequeno', 'medio', 'grande'
 * @param {string} texto - Texto a exibir (opcional)
 * @returns {JSX.Element}
 */
export function Carregando({
  tamanho = 'medio',
  texto = 'Carregando...',
}) {
  const tamanhoDots = {
    pequeno: 'w-8 h-8 border-2',
    medio: 'w-12 h-12 border-4',
    grande: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* Spinner animado */}
      <div
        className={`${tamanhoDots[tamanho]} border-gray-300 border-t-teal-600 rounded-full animate-spin`}
      />

      {/* Texto */}
      {texto && (
        <p className="text-gray-600 font-medium">{texto}</p>
      )}
    </div>
  );
}

/**
 * Skeleton loader - placeholder enquanto carrega dados
 * Útil para tabelas e listas
 * 
 * @param {number} linhas - Número de linhas a mostrar
 * @param {number} colunas - Número de colunas por linha
 * @returns {JSX.Element}
 */
export function SkeletonTabela({
  linhas = 5,
  colunas = 4,
}) {
  return (
    <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
      {/* Cabeçalho skeleton */}
      <div className="bg-gray-100 p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }}>
        {Array.from({ length: colunas }).map((_, i) => (
          <div key={`header-${i}`} className="h-4 bg-gray-300 rounded w-full animate-pulse" />
        ))}
      </div>

      {/* Linhas skeleton */}
      {Array.from({ length: linhas }).map((_, linha) => (
        <div
          key={`linha-${linha}`}
          className="border-t border-gray-200 p-4 grid gap-4 bg-white"
          style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }}
        >
          {Array.from({ length: colunas }).map((_, col) => (
            <div
              key={`cel-${linha}-${col}`}
              className="h-4 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader para formulário
 * 
 * @param {number} campos - Número de campos a mostrar
 * @returns {JSX.Element}
 */
export function SkeletonFormulario({
  campos = 4,
}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: campos }).map((_, i) => (
        <div key={`campo-${i}`}>
          {/* Label skeleton */}
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />

          {/* Input skeleton */}
          <div className="h-10 bg-gray-100 rounded border border-gray-200 animate-pulse" />
        </div>
      ))}

      {/* Botões skeleton */}
      <div className="flex gap-4 pt-4">
        <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
        <div className="flex-1 h-10 bg-gray-300 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader para cartão
 * 
 * @param {number} numero - Número de cartões a mostrar
 * @returns {JSX.Element}
 */
export function SkeletonCartao({
  numero = 3,
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: numero }).map((_, i) => (
        <div
          key={`cartao-${i}`}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          {/* Título skeleton */}
          <div className="h-4 bg-gray-200 rounded w-24 mb-4 animate-pulse" />

          {/* Conteúdo skeleton */}
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default Carregando;
