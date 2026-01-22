import { useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';

export default function CertificadoDigital() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ativo: true,
    instituicao: '',
    assinatura: '',
    tamanhoPagina: 'A4',
    margens: 20,
    corPrincipal: '#006B5C',
    tipoCertificado: 'CONCLUSAO',
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
      const res = await fetch('/api/configuracoes/certificado-digital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Configurações de certificado salvas com sucesso');
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Configuração de Certificado Digital</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-800">Certificado Digital ATIVO</span>
            </label>
          </div>

          {/* Informações */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-sm font-bold text-teal-600 mb-4">📋 Informações</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME DA INSTITUIÇÃO *</label>
                <input
                  type="text"
                  name="instituicao"
                  value={formData.instituicao}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">ASSINATURA DIGITAL</label>
                <input
                  type="text"
                  name="assinatura"
                  value={formData.assinatura}
                  onChange={handleChange}
                  placeholder="URL ou caminho da assinatura"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TIPO DE CERTIFICADO</label>
                <select
                  name="tipoCertificado"
                  value={formData.tipoCertificado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="CONCLUSAO">Conclusão</option>
                  <option value="PARTICIPACAO">Participação</option>
                  <option value="APROVACAO">Aprovação</option>
                  <option value="APRESENTACAO">Apresentação</option>
                </select>
              </div>
            </div>
          </div>

          {/* Formatação */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-sm font-bold text-teal-600 mb-4">🎨 Formatação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TAMANHO DA PÁGINA</label>
                <select
                  name="tamanhoPagina"
                  value={formData.tamanhoPagina}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="Landscape">Landscape</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MARGENS (mm)</label>
                <input
                  type="number"
                  name="margens"
                  value={formData.margens}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-teal-600 mb-1 block">COR PRINCIPAL</label>
                <input
                  type="color"
                  name="corPrincipal"
                  value={formData.corPrincipal}
                  onChange={handleChange}
                  className="w-full h-10 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="text-xs font-medium text-teal-600 mb-2 block">OBSERVAÇÕES</label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="3"
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
