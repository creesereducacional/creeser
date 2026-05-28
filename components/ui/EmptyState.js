/**
 * EmptyState — Design System CREESER
 * Estado vazio padronizado com ícone, título, descrição e CTA.
 */

import ActionButton from './ActionButton';

export default function EmptyState({
  icon = '📭',
  title = 'Nenhum resultado encontrado',
  description,
  action,   // { label, onClick, href, variant }
  compact = false,
  className = '',
}) {
  return (
    <div className={`
      flex flex-col items-center justify-center text-center
      ${compact ? 'py-8 px-4' : 'py-16 px-6'}
      ${className}
    `.trim()}>
      <div className={`${compact ? 'text-4xl mb-2' : 'text-5xl mb-4'}`}>{icon}</div>

      <p className={`font-semibold text-gray-600 ${compact ? 'text-sm' : 'text-base'}`}>
        {title}
      </p>

      {description && (
        <p className={`text-gray-400 mt-1 max-w-xs leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          <ActionButton
            variant={action.variant || 'primary'}
            href={action.href}
            onClick={action.onClick}
            size={compact ? 'sm' : 'md'}
          >
            {action.label}
          </ActionButton>
        </div>
      )}
    </div>
  );
}
