import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Timeline from '@/components/ui/Timeline';

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
          {!loading && !error && (() => {
            const s = assinaturaStatus?.status || '';
            const hasError = s === 'failed' || s === 'cancelled';
            const steps = [
              { key: 'gerado',      label: 'Gerado',      icon: '📝', done: true },
              { key: 'enviado',     label: 'Enviado',     icon: '✉️',  done: ['pending_signature','signed','failed','cancelled'].includes(s) },
              { key: 'visualizado', label: 'Visualizado', icon: '👁',  done: ['signed'].includes(s) },
              { key: 'assinado',    label: 'Assinado',    icon: '✅',  done: s === 'signed', error: hasError },
            ];
            return (
              <div className="print:hidden bg-white rounded-xl border border-gray-200 px-5 py-4 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Timeline do Contrato</p>
                <Timeline steps={steps} />
                {assinaturaStatus?.errorMessage && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    ⚡ Erro: {assinaturaStatus.errorMessage}
                  </p>
                )}
              </div>
            );
          })()}

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
            <article className="contrato-paper bg-white rounded-lg shadow px-10 py-10 print:shadow-none print:rounded-none print:px-0 print:py-0">
              <section
                className="contrato-html text-[14px] leading-relaxed text-slate-900"
                dangerouslySetInnerHTML={{ __html: payload?.contrato?.html || '<p>Modelo sem conteúdo.</p>' }}
              />

              <footer className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 print:hidden">
                Documento gerado em {new Date(payload?.generatedAt || Date.now()).toLocaleString('pt-BR')}.
                {' '}Imprima em PDF para assinatura manual.
              </footer>
            </article>
          )}
        </div>
      </div>

      <style jsx global>{`
        .contrato-html {
          font-family: Arial, Helvetica, sans-serif;
          color: #1a1a1a;
          line-height: 1.5;
        }

        .contrato-html ul {
          list-style: disc;
          margin: 0.4rem 0;
          padding-left: 1.5rem;
        }

        .contrato-html ol {
          list-style: decimal;
          margin: 0.4rem 0;
          padding-left: 1.5rem;
        }

        .contrato-html h1,
        .contrato-html h2,
        .contrato-html h3,
        .contrato-html h4 {
          margin-top: 0.8rem;
          margin-bottom: 0.4rem;
          font-weight: 700;
          break-after: avoid;
          page-break-after: avoid;
        }

        .contrato-html p {
          margin-bottom: 0.5rem;
          orphans: 3;
          widows: 3;
        }

        .contrato-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5rem 0;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .contrato-html tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        @page {
          size: A4;
          margin: 12mm 15mm 12mm 15mm;
        }

        @media print {
          html,
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 13px !important;
          }

          .contrato-paper {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .contrato-html {
            font-size: 12.5px !important;
            line-height: 1.45 !important;
          }

          .contrato-html p {
            margin-bottom: 0.4rem !important;
          }

          .contrato-html div,
          .contrato-html section,
          .contrato-html table {
            break-inside: auto;
          }
        }
      `}</style>
    </>
  );
}
