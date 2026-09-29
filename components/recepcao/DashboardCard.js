import Link from 'next/link';

export default function DashboardCard({
  icon,
  label,
  valor,
  bgIcon = 'bg-blue-50 text-blue-600',
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  sparklineColor = 'blue', // 'blue' | 'emerald' | 'amber' | 'rose' | 'purple'
  loading = false,
  href,
  onClick,
  sub,
}) {
  // Sparkline wave paths por cor
  const sparklines = {
    blue: {
      stroke: '#3b82f6',
      fill: 'rgba(59, 130, 246, 0.08)',
      path: 'M0,22 C30,22 45,5 75,18 C105,30 120,8 150,15 C180,22 195,10 220,16 L220,35 L0,35 Z',
      line: 'M0,22 C30,22 45,5 75,18 C105,30 120,8 150,15 C180,22 195,10 220,16',
    },
    emerald: {
      stroke: '#10b981',
      fill: 'rgba(16, 185, 129, 0.08)',
      path: 'M0,24 C30,24 50,10 80,16 C110,22 130,6 160,12 C185,18 200,8 220,14 L220,35 L0,35 Z',
      line: 'M0,24 C30,24 50,10 80,16 C110,22 130,6 160,12 C185,18 200,8 220,14',
    },
    amber: {
      stroke: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.08)',
      path: 'M0,18 C35,18 55,26 90,20 C125,14 145,24 175,18 C195,14 205,20 220,17 L220,35 L0,35 Z',
      line: 'M0,18 C35,18 55,26 90,20 C125,14 145,24 175,18 C195,14 205,20 220,17',
    },
    rose: {
      stroke: '#f43f5e',
      fill: 'rgba(244, 63, 94, 0.08)',
      path: 'M0,20 C30,20 50,25 80,22 C110,18 135,28 165,22 C185,18 205,24 220,20 L220,35 L0,35 Z',
      line: 'M0,20 C30,20 50,25 80,22 C110,18 135,28 165,22 C185,18 205,24 220,20',
    },
    purple: {
      stroke: '#8b5cf6',
      fill: 'rgba(139, 92, 246, 0.08)',
      path: 'M0,22 C30,22 55,14 85,20 C115,26 140,12 170,18 C190,22 205,15 220,18 L220,35 L0,35 Z',
      line: 'M0,22 C30,22 55,14 85,20 C115,26 140,12 170,18 C190,22 205,15 220,18',
    },
  };

  const spark = sparklines[sparklineColor] || sparklines.blue;
  const textoSub = trend || sub;

  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 p-4 relative overflow-hidden flex flex-col justify-between h-full group">
      <div className="flex items-start gap-3.5 z-10">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold ${bgIcon} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-gray-500 leading-tight truncate" title={label}>
            {label}
          </p>
          <p className={`text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5 leading-none ${loading ? 'opacity-30' : ''}`}>
            {loading ? '…' : valor ?? 0}
          </p>
          {textoSub && (
            <p className="text-[11px] font-medium mt-1 flex items-center gap-1 truncate">
              {trendType === 'up' && <span className="text-emerald-600 font-semibold">{textoSub}</span>}
              {trendType === 'down' && <span className="text-rose-600 font-semibold">{textoSub}</span>}
              {trendType === 'neutral' && <span className="text-gray-400">{textoSub}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Onda Sparkline Decorativa de Fundo */}
      <div className="w-full h-8 mt-2 -mb-4 -mx-4 overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        <svg viewBox="0 0 220 35" className="w-full h-full" preserveAspectRatio="none">
          <path d={spark.path} fill={spark.fill} />
          <path d={spark.line} fill="none" stroke={spark.stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-2xl">
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-2xl">
        {inner}
      </button>
    );
  }

  return inner;
}
