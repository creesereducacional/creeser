import Link from 'next/link';

export default function DashboardCard({
  icon,
  label,
  valor,
  cor = 'border-blue-500',
  bgIcon,
  loading = false,
  href,
  onClick,
  sub,
}) {
  const inner = (
    <div
      className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${cor} hover:shadow-md transition-all duration-200 h-full`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-2xl p-2 rounded-xl ${bgIcon || 'bg-gray-50'}`}>{icon}</span>
        <span
          className={`text-3xl font-bold text-gray-800 tabular-nums leading-none mt-1 ${
            loading ? 'opacity-30' : ''
          }`}
        >
          {loading ? '…' : valor ?? 0}
        </span>
      </div>
      <p className="text-xs text-gray-500 font-medium leading-snug">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );

  if (href)
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button onClick={onClick} className="w-full text-left h-full">
        {inner}
      </button>
    );
  return inner;
}
