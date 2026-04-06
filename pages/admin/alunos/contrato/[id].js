import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function ContratoAlunoImpressao() {
  const router = useRouter();
  const { id, autoprint } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [printed, setPrinted] = useState(false);

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
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            >
              Voltar
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
            >
              Imprimir / Salvar PDF
            </button>
          </div>

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
