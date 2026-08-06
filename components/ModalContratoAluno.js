import { useState } from 'react';

export default function ModalContratoAluno({ isOpen, onClose, alunoId, alunoNome, redirectPath = '/admin-financeiro/carnes' }) {
  const [enviandoAssinafy, setEnviandoAssinafy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleImprimir = () => {
    window.open(`/admin/alunos/contrato/${alunoId}?autoprint=1`, '_blank');
  };

  const handleEnviarAssinafy = async () => {
    setEnviandoAssinafy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/contratos/aluno/${alunoId}/assinar-digital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao enviar contrato para assinatura digital');
      }

      setFeedback({ type: 'success', message: '✅ Contrato enviado com sucesso para assinatura via Assinafy!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao enviar contrato' });
    } finally {
      setEnviandoAssinafy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-fadeIn">
        <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          📄
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">Contrato do Aluno</h3>
        {alunoNome && <p className="text-sm font-semibold text-teal-700 mb-2">{alunoNome}</p>}
        <p className="text-sm text-gray-600 mb-6">
          O carnê/ordem foi criado com sucesso! O contrato deste aluno já pode ser emitido.
        </p>

        {feedback && (
          <div
            className={`p-3 text-xs rounded-lg mb-4 text-left font-medium ${
              feedback.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleImprimir}
            disabled={enviandoAssinafy}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
          >
            🖨️ Imprimir Contrato
          </button>

          <button
            type="button"
            onClick={handleEnviarAssinafy}
            disabled={enviandoAssinafy}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
          >
            {enviandoAssinafy ? 'Enviando...' : '✍️ Enviar para Assinatura Digital'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={enviandoAssinafy}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
