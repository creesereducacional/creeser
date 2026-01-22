/**
 * @file components/ui/Cartao.js
 * @description Componente reutilizável de cartão (card)
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Componente para exibir conteúdo em cards
 * com estilos consistentes e profissionais
 */

import React from 'react';

/**
 * Componente Cartão
 * 
 * @param {string} titulo - Título do cartão
 * @param {React.ReactNode} filhos - Conteúdo do cartão
 * @param {React.ReactNode} rodape - Conteúdo do rodapé (opcional)
 * @param {string} classe - Classes CSS adicionais
 * @param {boolean} sombra - Se mostra sombra (padrão: true)
 * @returns {JSX.Element}
 */
export function Cartao({
  titulo,
  filhos,
  rodape,
  classe = '',
  sombra = true,
}) {
  return (
    <div
      className={`bg-white rounded-lg p-6 border border-gray-200 ${
        sombra ? 'shadow-sm' : ''
      } ${classe}`}
    >
      {/* Título */}
      {titulo && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">
          {titulo}
        </h3>
      )}

      {/* Conteúdo */}
      <div className="text-gray-700">
        {filhos}
      </div>

      {/* Rodapé */}
      {rodape && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {rodape}
        </div>
      )}
    </div>
  );
}

/**
 * Componente CartãoGrade - exibe múltiplos cartões em grid
 * 
 * @param {Array} cartoes - Array com dados dos cartões
 *   @example [
 *     { titulo: 'Alunos', valor: 150 },
 *     { titulo: 'Professores', valor: 25 }
 *   ]
 * @param {number} colunas - Número de colunas (padrão: 3)
 * @returns {JSX.Element}
 */
export function CartaoGrade({
  cartoes = [],
  colunas = 3,
}) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridClass[colunas] || 'grid-cols-3'} gap-4`}>
      {cartoes.map((cartao, indice) => (
        <Cartao
          key={indice}
          titulo={cartao.titulo}
          filhos={
            <div className="text-4xl font-bold text-teal-600">
              {cartao.valor}
            </div>
          }
        />
      ))}
    </div>
  );
}

export default Cartao;
