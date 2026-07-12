export default function DashboardContainer({ children, className = '' }) {
  return (
    <div className={`space-y-6 max-w-7xl mx-auto ${className}`}>
      {children}
    </div>
  );
}
