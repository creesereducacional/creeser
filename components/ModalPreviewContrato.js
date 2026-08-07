import { useEffect, useState } from 'react';

export default function ModalPreviewContrato({ isOpen, onClose, contratoId, instituicaoNome }) {
  const [loading, setLoading] = useState(false);
  const [contrato, setContrato] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (!contratoId) {
      setContrato(null);
      setErro('Selecione um modelo de contrato para visualizar.');
      return;
    }

    const carregarContrato = async () => {
      setLoading(true);
      setErro('');
      setContrato(null);

      try {
        const response = await fetch(`/api/contratos/${contratoId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar o modelo de contrato.');
        }

        setContrato(data);
      } catch (err) {
        setErro(err.message || 'Erro ao carregar modelo de contrato.');
      } finally {
        setLoading(false);
      }
    };

    carregarContrato();
  }, [isOpen, contratoId]);

  if (!isOpen) return null;

  const handleAbrirImpressao = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-fadeIn print:shadow-none print:border-none print:max-h-none print:w-full">
        {/* Cabeçalho */}
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl print:hidden">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              📄 {contrato?.nome || 'Modelo de Contrato'}
            </h3>
            {instituicaoNome && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Instituição: <span className="text-slate-700 font-semibold">{instituicaoNome}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {contrato && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  contrato.padrao
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                {contrato.padrao ? 'Contrato Padrão' : 'Contrato da Turma'}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg hover:bg-slate-200/60 transition"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Corpo do Preview */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100 print:bg-white print:p-0">
          {loading ? (
            <div className="py-20 text-center text-slate-500 font-medium animate-pulse">
              Carregando preview do modelo de contrato...
            </div>
          ) : erro ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-amber-800 text-sm font-semibold">{erro}</p>
            </div>
          ) : (
            <article className="contrato-paper bg-white rounded-xl shadow-md p-8 md:p-12 border border-slate-200/80 max-w-3xl mx-auto print:shadow-none print:border-none print:p-0">
              <div
                className="contrato-html text-sm leading-relaxed text-slate-900"
                dangerouslySetInnerHTML={{ __html: contrato?.conteudoHtml || '<p className="text-slate-400">Modelo sem conteúdo visual.</p>' }}
              />
            </article>
          )}
        </main>

        {/* Rodapé */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleAbrirImpressao}
            disabled={!contrato || loading}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🖨️</span> Abrir Impressão
          </button>
        </footer>
      </div>

      <style jsx global>{`
        .contrato-html ul {
          list-style: disc;
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .contrato-html ol {
          list-style: decimal;
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .contrato-html h1,
        .contrato-html h2,
        .contrato-html h3,
        .contrato-html h4 {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .contrato-html p {
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
}
