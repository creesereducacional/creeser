/**
 * DashboardCard — Design System CREESER
 * KPI card padronizado com ícone, valor, tendência, alerta e skeleton.
 */

import Link from 'next/link';

const VARIANT_BORDER = {
  success: 'border-l-green-500',
  warning: 'border-l-amber-400',
  danger:  'border-l-red-500',
  info:    'border-l-blue-500',
  neutral: 'border-l-gray-300',
  teal:    'border-l-teal-500',
  purple:  'border-l-purple-500',
  orange:  'border-l-orange-400',
};

const VARIANT_ICON_BG = {
  success: 'bg-green-50',
  warning: 'bg-amber-50',
  danger:  'bg-red-50',
  info:    'bg-blue-50',
  neutral: 'bg-gray-50',
  teal:    'bg-teal-50',
  purple:  'bg-purple-50',
  orange:  'bg-orange-50',
};

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-9 h-9 bg-gray-200 rounded-xl" />
        <div className="w-16 h-7 bg-gray-200 rounded" />
      </div>
      <div className="w-24 h-3 bg-gray-200 rounded mt-2" />
    </div>
  );
}

export default function DashboardCard({
  icon,
  label,
  value,
  // Compat: aceita `valor` também (padrão existente)
  valor,
  subtitle,
  sub,
  variant = 'neutral',
  // Compat: aceita `cor` legado (border-l-*)
  cor,
  bgIcon,
  trend,       // { direction: 'up'|'down', value: '12%' }
  alert,       // string — inline alerta
  loading = false,
  href,
  onClick,
  className = '',
}) {
  const displayValue = value ?? valor;
  const displaySub   = subtitle ?? sub;

  const borderClass = cor
    ? `border-l-4 ${cor}`
    : `border-l-4 ${VARIANT_BORDER[variant] || VARIANT_BORDER.neutral}`;

  const iconBgClass = bgIcon || VARIANT_ICON_BG[variant] || 'bg-gray-50';

  const inner = (
    <div className={`
      bg-white rounded-2xl shadow-sm p-3 sm:p-4 h-full
      border ${borderClass} hover:shadow-md transition-all duration-200
      ${className}
    `.trim()}>
      {loading ? <Skeleton /> : (
        <>
          <div className="flex items-start justify-between gap-2 mb-2">
            {icon && (
              <span className={`text-xl p-1.5 rounded-xl ${iconBgClass} flex-shrink-0 leading-none`}>
                {icon}
              </span>
            )}
            <span className="text-lg sm:text-xl font-bold text-gray-800 tabular-nums leading-tight text-right break-all">
              {displayValue ?? '—'}
            </span>
          </div>

          <p className="text-xs text-gray-500 font-medium leading-snug">{label}</p>

          {displaySub && (
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{displaySub}</p>
          )}

          {trend && (
            <p className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-500'
            }`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </p>
          )}

          {alert && (
            <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {alert}</p>
          )}
        </>
      )}
    </div>
  );

  if (href)    return <Link href={href} className="block h-full">{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="w-full text-left h-full">{inner}</button>;
  return inner;
}
