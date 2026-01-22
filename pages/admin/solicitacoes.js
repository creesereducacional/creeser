import DashboardLayout from '@/components/DashboardLayout';

export default function Solicitacoes() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <span>📋</span>
          <h1 className="text-3xl font-bold text-gray-800">Solicitações</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">Esta página está em desenvolvimento</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
