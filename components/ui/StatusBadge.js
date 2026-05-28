/**
 * StatusBadge — Design System CREESER
 * Badge semântico unificado com dot, ícone e uppercase opcionais.
 */

export const BADGE_VARIANTS = {
  success: { dot: 'bg-green-500',  bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300'  },
  warning: { dot: 'bg-amber-400',  bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300'  },
  danger:  { dot: 'bg-red-500',    bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300'    },
  info:    { dot: 'bg-blue-500',   bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300'   },
  neutral: { dot: 'bg-gray-400',   bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300'   },
  purple:  { dot: 'bg-purple-500', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  orange:  { dot: 'bg-orange-400', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  teal:    { dot: 'bg-teal-500',   bg: 'bg-teal-100',   text: 'text-teal-800',   border: 'border-teal-300'   },
};

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-sm px-3 py-1 gap-1.5',
};

export default function StatusBadge({
  variant = 'neutral',
  label,
  icon,
  dot = false,
  uppercase = false,
  size = 'sm',
  className = '',
}) {
  const cfg = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral;
  const sz  = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold border select-none
        ${cfg.bg} ${cfg.text} ${cfg.border} ${sz}
        ${uppercase ? 'uppercase tracking-wide' : ''}
        ${className}
      `.trim()}
    >
      {dot  && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />}
      {icon && <span className="flex-shrink-0 leading-none">{icon}</span>}
      {label}
    </span>
  );
}
