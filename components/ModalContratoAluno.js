import { useEffect, useState } from 'react';

export default function ModalContratoAluno({ isOpen, onClose, alunoId, alunoNome }) {
  const [loadingContrato, setLoadingContrato] = useState(false);
  const [contratoInfo, setContratoInfo] = useState(null);
  const [erroContrato, setErroContrato] = useState('');
  const [enviandoAssinafy, setEnviandoAssinafy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!isOpen || !alunoId) return;

    const carregarInformacoesContrato = async () => {
      setLoadingContrato(true);
      setErroContrato('');
      setContratoInfo(null);

      try {
        const response = await fetch(`/api/contratos/aluno/${alunoId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || 'Nenhum modelo de contrato foi encontrado para esta turma.');
        }

        setContratoInfo(data);
      } catch (err) {
        setErroContrato(err.message || 'Nenhum modelo de contrato foi encontrado para esta turma.');
      } finally {
        setLoadingContrato(false);
      }
    };

    carregarInformacoesContrato();
  }, [isOpen, alunoId]);

  if (!isOpen) return null;

  const handleImprimir = () => {
    window.open(`/admin/alunos/contrato/${alunoId}?autoprint=1`, '_blank');
  };

  const handleEnviarAssinafy = async () => {
    if (enviandoAssinafy) return;
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

  const isTurmaContrato = contratoInfo?.contrato?.origem === 'turma';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-100 transform transition-all animate-fadeIn">
        {/* Ícone Grande no Topo */}
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border border-teal-100/80">
          📄
        </div>

        {/* Título e Aluno */}
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1">
          Contrato do Aluno
        </h3>

        {alunoNome && (
          <div className="inline-block px-3 py-1 bg-teal-50 border border-teal-200/60 rounded-full mb-3">
            <p className="text-xs font-bold text-teal-800 uppercase tracking-wide">
              {alunoNome}
            </p>
          </div>
        )}

        {/* Card Informativo do Modelo do Contrato */}
        <div className="my-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-left shadow-inner">
          {loadingContrato ? (
            <p className="text-xs text-slate-500 text-center animate-pulse py-2">
              Carregando detalhes do contrato...
            </p>
          ) : erroContrato ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium text-center">
              ⚠️ {erroContrato}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Modelo:</span>
                <span className="text-xs font-bold text-slate-800 truncate">
                  📌 {contratoInfo?.contrato?.nome || '-'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Origem:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isTurmaContrato
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  {isTurmaContrato ? 'Contrato específico da Turma' : 'Contrato padrão da Instituição'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Instituição:</span>
                <span className="text-xs font-semibold text-slate-700 truncate">
                  🏢 {contratoInfo?.instituicao?.nome || '-'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Texto Orientado à Ação */}
        <p className="text-xs text-slate-500 mb-5">
          Você pode imprimir este modelo ou enviá-lo para assinatura digital.
        </p>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 text-xs rounded-xl mb-4 text-left font-medium shadow-sm transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="space-y-3">
          {/* Botão Principal: Imprimir */}
          <button
            type="button"
            onClick={handleImprimir}
            disabled={enviandoAssinafy || loadingContrato || Boolean(erroContrato)}
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <span>🖨️</span> Imprimir Contrato
          </button>

          {/* Botão Secundário: Assinar Digitalmente */}
          <button
            type="button"
            onClick={handleEnviarAssinafy}
            disabled={enviandoAssinafy || loadingContrato || Boolean(erroContrato)}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            {enviandoAssinafy ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <span>✍️</span> Enviar para Assinatura Digital
              </>
            )}
          </button>

          {/* Botão Discreto Fechar */}
          <button
            type="button"
            onClick={onClose}
            disabled={enviandoAssinafy}
            className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-100 disabled:opacity-40 text-slate-500 hover:text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
