/**
 * @file components/ui/Botao.js
 * @description Componente padronizado de botão
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Botão reutilizável com estilos consistentes
 * Suporta múltiplas variantes de estilo
 */

import React from 'react';

/**
 * Componente Botão padronizado
 * 
 * @param {string} tipo - Tipo do botão: 'button', 'submit', 'reset'
 * @param {string} variante - Variante visual: 'primario', 'secundario', 'perigo', 'sucesso'
 * @param {string} tamanho - Tamanho: 'pequeno', 'medio', 'grande'
 * @param {boolean} desabilitado - Se botão está desabilitado
 * @param {Function} onClick - Handler de clique
 * @param {string} classe - Classes CSS adicionais
 * @param {React.ReactNode} filhos - Conteúdo do botão
 * @param {boolean} carregando - Se está carregando
 * @returns {JSX.Element}
 */
export function Botao({
  tipo = 'button',
  variante = 'primario',
  tamanho = 'medio',
  desabilitado = false,
  onClick,
  classe = '',
  filhos,
  carregando = false,
  largura = 'auto',
}) {
  // Define estilos base
  const estilosBase = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Define estilos por tamanho
  const estlosTamanho = {
    pequeno: 'px-3 py-1 text-sm',
    medio: 'px-4 py-2 text-base',
    grande: 'px-6 py-3 text-lg',
  };

  // Define estilos por variante
  const estilosVariante = {
    primario: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500 disabled:bg-gray-400',
    secundario: 'bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500 disabled:bg-gray-200',
    perigo: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-400',
    sucesso: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-gray-400',
  };

  const estiloFinal = `${estilosBase} ${estlosTamanho[tamanho]} ${estilosVariante[variante]} ${classe}`;

  return (
    <button
      type={tipo}
      disabled={desabilitado || carregando}
      onClick={onClick}
      className={estiloFinal}
      style={{ width: largura }}
    >
      {carregando ? '⏳ Processando...' : filhos}
    </button>
  );
}

export default Botao;
