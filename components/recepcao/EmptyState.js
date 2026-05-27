export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      {title && (
        <h3 className="text-base font-semibold text-gray-600 mb-1">{title}</h3>
      )}
      {message && (
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-4">{message}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
