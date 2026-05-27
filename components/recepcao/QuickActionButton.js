import Link from 'next/link';

export default function QuickActionButton({
  icon,
  label,
  href,
  onClick,
  variant = 'default',
  disabled = false,
  size = 'md',
}) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
    danger:  'bg-red-500 hover:bg-red-600 text-white shadow-sm',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost:   'text-gray-600 hover:bg-gray-100',
    whatsapp:'bg-green-500 hover:bg-green-600 text-white shadow-sm',
    default: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
  };

  const cls = `inline-flex items-center rounded-xl font-medium transition-all duration-150
    ${variants[variant] || variants.default}
    ${sizes[size] || sizes.md}
    ${disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}`;

  if (href && !disabled)
    return (
      <Link href={href} className={cls}>
        {icon && <span>{icon}</span>}
        {label}
      </Link>
    );

  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
