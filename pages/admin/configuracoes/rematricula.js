import { useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';

export default function Rematricula() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dataInicio: '',
    dataFim: '',
    desconto: 0,
    ativa: true,
    observacoes: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/configuracoes/rematricula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Configurações de rematrícula salvas com sucesso');
      } else {
        alert('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Configuração de Rematrícula</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datas */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-sm font-bold text-teal-600 mb-4">📅 Período de Rematrícula</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DATA DE INÍCIO *</label>
                <input
                  type="date"
                  name="dataInicio"
                  value={formData.dataInicio}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DATA DE FIM *</label>
                <input
                  type="date"
                  name="dataFim"
                  value={formData.dataFim}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Desconto */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-sm font-bold text-teal-600 mb-4">💰 Desconto para Rematrícula</h3>
            
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">PERCENTUAL DE DESCONTO (%)</label>
              <input
                type="number"
                name="desconto"
                value={formData.desconto}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="ativa"
                checked={formData.ativa}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-800">Rematrícula está ATIVA?</span>
            </label>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="text-xs font-medium text-teal-600 mb-2 block">OBSERVAÇÕES</label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/admin/configuracoes')}
              className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              💾 Salvar
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
