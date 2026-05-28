import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const TIMELINE_STEPS = [
  { key: 'gerado',      label: 'Gerado',     icon: '📝' },
  { key: 'enviado',     label: 'Enviado',    icon: '✉️'  },
  { key: 'visualizado', label: 'Visualizado',icon: '👁'  },
  { key: 'assinado',    label: 'Assinado',   icon: '✅'  },
];

function Timeline({ assinaturaStatus }) {
  const status = assinaturaStatus?.status || '';
  const passedSteps = {
    gerado:      true,
    enviado:     ['pending_signature', 'signed', 'failed', 'cancelled'].includes(status),
    visualizado: ['signed'].includes(status),
    assinado:    status === 'signed',
  };
  const hasError = status === 'failed' || status === 'cancelled';

  return (
    <div className="print:hidden bg-white rounded-xl border border-gray-200 px-5 py-4 mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Timeline do Contrato</p>
      <div className="flex items-center gap-0">
        {TIMELINE_STEPS.map((step, i) => {
          const done = passedSteps[step.key];
          const isLast = i === TIMELINE_STEPS.length - 1;
          const isError = isLast && hasError;
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                  isError ? 'bg-red-100 border-red-400 text-red-600' :
                  done ? 'bg-green-100 border-green-400 text-green-700' :
                  'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isError ? '✗' : done ? '✓' : step.icon}
                </div>
                <p className={`text-[10px] font-semibold mt-1 text-center leading-tight ${
                  isError ? 'text-red-600' : done ? 'text-green-700' : 'text-gray-400'
                }`}>{step.label}</p>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 rounded-full ${done && passedSteps[TIMELINE_STEPS[i + 1].key] ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {assinaturaStatus?.errorMessage && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚡ Erro: {assinaturaStatus.errorMessage}
        </p>
      )}
    </div>
  );
}

export default function ContratoAlunoImpressao() {
  const router = useRouter();
  const { id, autoprint } = router.query;

  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [payload, setPayload]                 = useState(null);
  const [printed, setPrinted]                 = useState(false);
  const [assinaturaStatus, setAssinaturaStatus] = useState(null);

  useEffect(() => {
    if (!id) return;

    const carregarContrato = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/contratos/aluno/${id}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar o contrato');
        }

        setPayload(data);
      } catch (err) {
        setError(err.message || 'Erro ao carregar contrato');
      } finally {
        setLoading(false);
      }
    };

    carregarContrato();

    // Carrega status de assinatura para timeline
    fetch(`/api/contratos/aluno/${id}/assinatura-status`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => setAssinaturaStatus(d))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!payload || printed || autoprint !== '1') return;

    const timeout = setTimeout(() => {
      window.print();
      setPrinted(true);
    }, 350);

    return () => clearTimeout(timeout);
  }, [payload, printed, autoprint]);

  const titulo = useMemo(() => {
    if (!payload?.aluno?.nome) return 'Contrato do Aluno';
    return `Contrato - ${payload.aluno.nome}`;
  }, [payload]);

  return (
    <>
      <Head>
        <title>{titulo}</title>
      </Head>

      <div className="min-h-screen bg-slate-100 print:bg-white">
        <div className="max-w-4xl mx-auto p-4 md:p-6 print:p-0">
          <div className="flex items-center justify-between gap-3 mb-4 print:hidden">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm"
            >
              ← Voltar
            </button>

            <div className="flex gap-2">
              <a
                href={`/admin/alunos/${id}`}
                className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors"
              >
                👤 Ver Aluno
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
              >
                🖨️ Imprimir / Salvar PDF
              </button>
            </div>
          </div>

          {/* Timeline */}
          {!loading && !error && <Timeline assinaturaStatus={assinaturaStatus} />}

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-slate-600">
              Carregando contrato...
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow p-8">
              <h1 className="text-xl font-bold text-red-600 mb-2">Não foi possível gerar o contrato</h1>
              <p className="text-slate-700">{error}</p>
            </div>
          ) : (
            <article className="contrato-paper bg-white rounded-lg shadow px-10 py-10 print:shadow-none print:rounded-none print:px-8 print:py-8">
              <header className="mb-8 border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-800">{payload?.contrato?.nome || 'Contrato'}</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Aluno: {payload?.aluno?.nome || '-'}
                </p>
                <p className="text-sm text-slate-600">
                  Instituição: {payload?.instituicao?.nome || '-'}
                </p>
              </header>

              <section
                className="contrato-html text-[15px] leading-7 text-slate-900"
                dangerouslySetInnerHTML={{ __html: payload?.contrato?.html || '<p>Modelo sem conteúdo.</p>' }}
              />

              <footer className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-500">
                Documento gerado em {new Date(payload?.generatedAt || Date.now()).toLocaleString('pt-BR')}.
                {' '}Imprima em PDF para assinatura manual.
              </footer>
            </article>
          )}
        </div>
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

        @page {
          size: A4;
          margin: 14mm;
        }

        @media print {
          html,
          body {
            background: #fff !important;
          }

          .contrato-paper {
            width: 100%;
            min-height: auto;
          }
        }
      `}</style>
    </>
  );
}
