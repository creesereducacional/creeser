import React from 'react';

export default function BarraFiltros({
  searchPlaceholder = "🔍 Buscar...",
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  statusOptions = [],
  instituicaoValue,
  onInstituicaoChange,
  instituicoes = [],
  unidadeValue,
  onUnidadeChange,
  unidades = [],
  cursoValue,
  onCursoChange,
  cursos = [],
  turmaValue,
  onTurmaChange,
  turmas = [],
  anoLetivoValue,
  onAnoLetivoChange,
  anosLetivos = [],
  onClear
}) {
  const showSearch = onSearchChange !== undefined;
  const showStatus = onStatusChange !== undefined;
  const showInstituicao = onInstituicaoChange !== undefined;
  const showUnidade = onUnidadeChange !== undefined;
  const showCurso = onCursoChange !== undefined;
  const showTurma = onTurmaChange !== undefined;
  const showAnoLetivo = onAnoLetivoChange !== undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      {/* Linha 1: Busca | Status | Instituição | Unidade | Curso | Turma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
        {showSearch && (
          <div className="relative w-full">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 px-3.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm placeholder-gray-400 bg-white"
            />
          </div>
        )}

        {showStatus && (
          <select
            value={statusValue || ''}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white text-gray-700 truncate"
          >
            <option value="">Todos os Status</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {showInstituicao && (
          <select
            value={instituicaoValue || ''}
            onChange={(e) => onInstituicaoChange(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white text-gray-700 truncate"
          >
            <option value="">Todas as Instituições</option>
            {instituicoes.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.nome}
              </option>
            ))}
          </select>
        )}

        {showUnidade && (
          <select
            value={unidadeValue || ''}
            onChange={(e) => onUnidadeChange(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white text-gray-700 truncate"
          >
            <option value="">Todas as Unidades</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        )}

        {showCurso && (
          <select
            value={cursoValue || ''}
            onChange={(e) => onCursoChange(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white text-gray-700 truncate"
          >
            <option value="">Todos os Cursos</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        )}

        {showTurma && (
          <select
            value={turmaValue || ''}
            onChange={(e) => onTurmaChange(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white text-gray-700 truncate"
          >
            <option value="">Todas as Turmas</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Linha 2: Ano Letivo à esquerda e Limpar Filtros à direita */}
      {(showAnoLetivo || onClear) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {showAnoLetivo && (
              <select
                value={anoLetivoValue || ''}
                onChange={(e) => onAnoLetivoChange(e.target.value)}
                className="h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white text-gray-700"
              >
                <option value="">Todos os Anos Letivos</option>
                {anosLetivos.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            )}
          </div>

          {onClear && (
            <button
              onClick={onClear}
              type="button"
              className="h-9 px-4 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-teal-700 border border-gray-300 rounded-lg hover:border-teal-500 transition-colors bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
            >
              <span>🧹</span>
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
