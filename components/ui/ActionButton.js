/**
 * ActionButton — Design System CREESER
 * Botão padronizado com variantes, tamanhos, ícone, loading e disabled.
 */

import Link from 'next/link';

const VARIANTS = {
  primary:   'bg-teal-600   hover:bg-teal-700   text-white   border-transparent    focus:ring-teal-500',
  secondary: 'bg-gray-100   hover:bg-gray-200   text-gray-700 border-gray-300      focus:ring-gray-400',
  outline:   'bg-transparent hover:bg-gray-50   text-gray-700 border-gray-300      focus:ring-gray-400',
  success:   'bg-green-600  hover:bg-green-700  text-white   border-transparent    focus:ring-green-500',
  danger:    'bg-red-600    hover:bg-red-700    text-white   border-transparent    focus:ring-red-500',
  warning:   'bg-amber-500  hover:bg-amber-600  text-white   border-transparent    focus:ring-amber-400',
  ghost:     'bg-transparent hover:bg-gray-100  text-gray-600 border-transparent   focus:ring-gray-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2   text-sm rounded-xl gap-2',
  lg: 'px-6 py-3   text-base rounded-xl gap-2.5',
};

export default function ActionButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  href,
  children,
  className = '',
  type = 'button',
  target,
  rel,
}) {
  const variantCls = VARIANTS[variant] || VARIANTS.primary;
  const sizeCls    = SIZES[size]    || SIZES.md;

  const baseCls = `
    inline-flex items-center justify-center font-semibold border transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variantCls} ${sizeCls} ${className}
  `.trim();

  const content = loading ? (
    <>
      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      <span>Aguarde...</span>
    </>
  ) : (
    <>
      {icon && iconPosition === 'left'  && <span className="flex-shrink-0 leading-none">{icon}</span>}
      {children && <span>{children}</span>}
      {icon && iconPosition === 'right' && <span className="flex-shrink-0 leading-none">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseCls} target={target} rel={rel}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled || loading} onClick={onClick} className={baseCls}>
      {content}
    </button>
  );
}
