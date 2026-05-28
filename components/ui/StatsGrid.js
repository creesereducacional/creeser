/**
 * StatsGrid — Design System CREESER
 * Grid responsivo padronizado para KPI cards e seções de estatísticas.
 */

const GRID_PRESETS = {
  kpi:       'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6',
  cards4:    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  cards3:    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  cards2:    'grid-cols-1 sm:grid-cols-2',
  shortcuts: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

export default function StatsGrid({
  preset = 'kpi',
  cols,            // classe grid-cols-* customizada (override)
  gap = 'gap-3',
  children,
  className = '',
}) {
  const gridCls = cols || GRID_PRESETS[preset] || GRID_PRESETS.kpi;
  return (
    <div className={`grid ${gridCls} ${gap} ${className}`}>
      {children}
    </div>
  );
}

StatsGrid.presets = GRID_PRESETS;
