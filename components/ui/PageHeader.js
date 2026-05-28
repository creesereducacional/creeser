/**
 * PageHeader — Design System CREESER
 * Cabeçalho de página padronizado com título, subtítulo, ações e breadcrumbs.
 */

import Link from 'next/link';

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,       // JSX ou array de JSX
  breadcrumbs,   // [{ label, href }]
  className = '',
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-gray-400">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-teal-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-600 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: icon + title */}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-xl text-white flex-shrink-0 shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {Array.isArray(actions) ? actions.map((a, i) => <span key={i}>{a}</span>) : actions}
          </div>
        )}
      </div>
    </div>
  );
}
