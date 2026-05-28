/**
 * LoadingSkeleton — Design System CREESER
 * Skeletons padronizados: cards, tabela, texto, modal.
 */

function SkeletonBox({ className = '' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard({ count = 1, cols = 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6' }) {
  return (
    <div className={`grid ${cols} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <SkeletonBox className="w-9 h-9 rounded-xl" />
            <SkeletonBox className="w-16 h-7 rounded" />
          </div>
          <SkeletonBox className="w-24 h-3 mt-1" />
          <SkeletonBox className="w-16 h-2.5 mt-1.5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox className={`h-4 ${i === 0 ? 'w-8' : i === 1 ? 'w-32' : 'w-20'} rounded`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} className={`h-3 rounded ${i === 1 ? 'w-28' : 'w-16'}`} />
        ))}
      </div>
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'];
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} className={`h-4 ${widths[i % widths.length]} rounded`} />
      ))}
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-10 h-10 rounded-xl" />
        <div>
          <SkeletonBox className="w-48 h-6 rounded mb-1.5" />
          <SkeletonBox className="w-32 h-3.5 rounded" />
        </div>
      </div>
      <SkeletonBox className="w-32 h-9 rounded-xl" />
    </div>
  );
}

export default function LoadingSkeleton({ type = 'card', ...props }) {
  if (type === 'table')  return <SkeletonTable {...props} />;
  if (type === 'text')   return <SkeletonText  {...props} />;
  if (type === 'header') return <SkeletonPageHeader {...props} />;
  return <SkeletonCard {...props} />;
}
