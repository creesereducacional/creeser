export default function ExecutiveMetricCard({ title, value, icon, trend, color = 'bg-teal-500', trendColor = 'text-green-600', loading = false }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-32 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-2 h-full ${color}`}></div>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{title}</span>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-extrabold text-gray-900 leading-none">
          {loading ? '...' : value}
        </span>
        <span className="text-lg flex-shrink-0">{icon}</span>
      </div>
      {trend && (
        <div className={`text-[10px] font-bold ${trendColor} mt-1`}>
          {trend}
        </div>
      )}
    </div>
  );
}
