/**
 * SectionCard — Design System CREESER
 * Container de seção padronizado com título, subtítulo e ações.
 */

const PADDING = {
  sm:   'p-4',
  md:   'p-5 sm:p-6',
  lg:   'p-6 sm:p-8',
  none: '',
};

export default function SectionCard({
  title,
  subtitle,
  actions,
  children,
  padding = 'md',
  className = '',
  headerClassName = '',
}) {
  const pd = PADDING[padding] || PADDING.md;
  const hasHeader = title || subtitle || actions;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {hasHeader && (
        <div className={`flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 ${headerClassName}`}>
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
          )}
        </div>
      )}
      <div className={pd}>{children}</div>
    </div>
  );
}
