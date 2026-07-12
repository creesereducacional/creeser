import React from 'react';

export default function BarraFiltros({
  searchPlaceholder = "🔍 Buscar...",
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  statusOptions = [],
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
  const showUnidade = onUnidadeChange !== undefined;
  const showCurso = onCursoChange !== undefined;
  const showTurma = onTurmaChange !== undefined;
  const showAnoLetivo = onAnoLetivoChange !== undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {showSearch && (
          <div className="flex flex-col col-span-1 md:col-span-2 relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
            />
          </div>
        )}

        {showStatus && (
          <select
            value={statusValue || ''}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white"
          >
            <option value="">Todos os Status</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {showUnidade && (
          <select
            value={unidadeValue || ''}
            onChange={(e) => onUnidadeChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white"
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
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white"
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
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white"
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

      {(showAnoLetivo || onClear) && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {showAnoLetivo && (
              <select
                value={anoLetivoValue || ''}
                onChange={(e) => onAnoLetivoChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white"
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
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-teal-600 border border-gray-300 rounded-lg hover:border-teal-500 transition-colors bg-white cursor-pointer"
            >
              🧹 Limpar Filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
