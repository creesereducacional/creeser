/**
 * @file components/ui/Tabela.js
 * @description Componente reutilizável para tabelas com dados
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Componente profissional de tabela que encapsula:
 * - Estrutura HTML semântica
 * - Estilos Tailwind consistentes
 * - Responsividade
 * - Integração com dados dinâmicos
 */

import React from 'react';

/**
 * Componente Tabela
 * 
 * @param {Array} colunas - Array com definição das colunas
 *   @example [
 *     { chave: 'id', titulo: 'ID', largura: '10%' },
 *     { chave: 'nome', titulo: 'Nome', largura: '30%' },
 *     { chave: 'email', titulo: 'Email', largura: '40%' },
 *     { chave: 'acoes', titulo: 'Ações', largura: '20%', renderizador: customFunc }
 *   ]
 * @param {Array} dados - Array com dados a exibir
 * @param {Function} renderizadorAcoes - Função para renderizar coluna de ações
 * @param {boolean} carregando - Se está carregando
 * @param {boolean} semDados - Se deve exibir mensagem de sem dados
 * @returns {JSX.Element}
 * 
 * @example
 * <Tabela
 *   colunas={colunas}
 *   dados={alunos}
 *   carregando={loading}
 * />
 */
export function Tabela({
  colunas = [],
  dados = [],
  carregando = false,
  semDados = false,
  onLinhaClicada = null,
}) {
  // Estado de carregamento
  if (carregando) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-gray-500">Carregando dados...</p>
      </div>
    );
  }

  // Sem dados
  if (semDados || dados.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-gray-500">Nenhum registro encontrado.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse">
        {/* Cabeçalho da tabela */}
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {colunas.map((coluna) => (
              <th
                key={coluna.chave}
                style={{ width: coluna.largura || 'auto' }}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>

        {/* Corpo da tabela */}
        <tbody>
          {dados.map((linha, indice) => (
            <tr
              key={linha.id || indice}
              onClick={() => onLinhaClicada?.(linha)}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ cursor: onLinhaClicada ? 'pointer' : 'default' }}
            >
              {colunas.map((coluna) => (
                <td
                  key={`${linha.id || indice}-${coluna.chave}`}
                  className="px-6 py-4 text-sm text-gray-700"
                >
                  {/* Se houver renderizador customizado */}
                  {coluna.renderizador
                    ? coluna.renderizador(linha[coluna.chave], linha)
                    : linha[coluna.chave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Tabela;
