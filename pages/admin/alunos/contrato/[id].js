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
              {/* Se o cabeçalho for configurado para aparecer APENAS na primeira página (não repetir nas demais), ele é inserido diretamente no fluxo normal fora de thead para nunca se repetir nas demais páginas */}
              {Boolean(
                payload?.contrato?.cabecalhoAtivo &&
                payload?.contrato?.cabecalhoHtml &&
                payload?.contrato?.cabecalhoPrimeiraPagina &&
                !payload?.contrato?.cabecalhoRepetirDemais
              ) && (
                <div
                  className="contrato-cabecalho-container mb-4 pb-3 border-b border-slate-200 text-sm text-slate-700"
                  dangerouslySetInnerHTML={{ __html: payload.contrato.cabecalhoHtml }}
                />
              )}

              <table className="contrato-print-table w-full border-collapse">
                {/* Cabeçalho Repetível via thead: usado quando deve se repetir nas demais páginas */}
                {Boolean(
                  payload?.contrato?.cabecalhoAtivo &&
                  payload?.contrato?.cabecalhoHtml &&
                  payload?.contrato?.cabecalhoRepetirDemais
                ) && (
                  <thead className={`contrato-table-header ${!payload?.contrato?.cabecalhoPrimeiraPagina ? 'cabecalho-ocultar-primeira' : ''}`}>
                    <tr>
                      <td className="p-0 border-none">
                        <div
                          className="contrato-cabecalho-container mb-4 pb-3 border-b border-slate-200 text-sm text-slate-700"
                          dangerouslySetInnerHTML={{ __html: payload.contrato.cabecalhoHtml }}
                        />
                      </td>
                    </tr>
                  </thead>
                )}

                {/* Corpo do Contrato */}
                <tbody>
                  <tr>
                    <td className="p-0 border-none">
                      <section
                        className="contrato-html text-[14px] leading-relaxed text-slate-900"
                        dangerouslySetInnerHTML={{ __html: payload?.contrato?.html || '<p>Modelo sem conteúdo.</p>' }}
                      />
                    </td>
                  </tr>
                </tbody>

                {/* Rodapé Repetível via tfoot: usado quando deve se repetir nas demais páginas */}
                {Boolean(
                  payload?.contrato?.rodapeAtivo &&
                  payload?.contrato?.rodapeHtml &&
                  payload?.contrato?.rodapeRepetirDemais
                ) && (
                  <tfoot className={`contrato-table-footer ${!payload?.contrato?.rodapePrimeiraPagina ? 'rodape-ocultar-primeira' : ''}`}>
                    <tr>
                      <td className="p-0 border-none">
                        <div
                          className="contrato-rodape-container mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600"
                          dangerouslySetInnerHTML={{ __html: payload.contrato.rodapeHtml }}
                        />
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {/* Se o rodapé for configurado para aparecer APENAS na primeira página (não repetir nas demais), ele é posicionado ao final do bloco */}
              {Boolean(
                payload?.contrato?.rodapeAtivo &&
                payload?.contrato?.rodapeHtml &&
                payload?.contrato?.rodapePrimeiraPagina &&
                !payload?.contrato?.rodapeRepetirDemais
              ) && (
                <div
                  className="contrato-rodape-container mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600"
                  dangerouslySetInnerHTML={{ __html: payload.contrato.rodapeHtml }}
                />
              )}

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
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
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
          margin-bottom: 0.45rem;
          orphans: 2;
          widows: 2;
        }

        .contrato-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.4rem 0;
        }

        .contrato-cabecalho-container img,
        .contrato-rodape-container img {
          max-height: 70px;
          object-fit: contain;
          display: inline-block;
        }

        .contrato-print-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
        }

        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }

        @media print {
          html,
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11.5pt !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .contrato-print-table {
            page-break-inside: auto;
          }

          .contrato-table-header {
            display: table-header-group;
          }

          .contrato-table-footer {
            display: table-footer-group;
          }

          /* Controles de Visibilidade de Cabeçalho e Rodapé */
          /* 1. Ocultar Cabeçalho na Primeira Página:
                Como thead repete por padrão do navegador, se NÃO deve exibir na primeira página,
                usamos um overlay branco posicionado no topo da folha 1 para cobrir o thead sem afetar o fluxo */
          .cabecalho-ocultar-primeira {
            /* Na impressão o Chrome renderiza thead em todas as folhas. Quando desmarcado para folha 1,
               um elemento invisível ocupa o espaço no thead para não quebrar a diagramação */
          }

          /* 2. Cabeçalho Apenas na Primeira Página (não repetir nas demais páginas): */
          .cabecalho-apenas-primeira {
            /* Para que o cabeçalho não repita nas demais páginas no Chrome, o thead pode atuar como display: contents ou o container fica no topo do tbody */
          }

          .contrato-paper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .contrato-html {
            font-size: 10pt !important;
            line-height: 1.35 !important;
            color: #000 !important;
          }

          /* Fluididade de containers: permite que quebrem naturalmente */
          .contrato-html div,
          .contrato-html section,
          .contrato-html article,
          .contrato-html span {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          /* Neutraliza alturas fixas herdadas de Google Docs / Word */
          .contrato-html div,
          .contrato-html section {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
          }

          /* Tabelas: quebra fluida entre linhas, sem forçar página em branco */
          .contrato-html table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse !important;
            margin: 0.25rem 0 !important;
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          /* Linhas: nunca cortam a esmo no meio do texto, mas permitem divisão natural */
          .contrato-html tr {
            break-inside: auto !important;
            page-break-inside: auto !important;
            height: auto !important;
            min-height: 0 !important;
          }

          /* Células: remove limites rígidos de altura que estouram a folha */
          .contrato-html td,
          .contrato-html th {
            break-inside: auto !important;
            page-break-inside: auto !important;
            height: auto !important;
            min-height: 0 !important;
            padding: 2px 4px !important;
          }

          /* Parágrafos e cabeçalhos */
          .contrato-html p {
            margin-top: 0 !important;
            margin-bottom: 0.35rem !important;
            orphans: 2 !important;
            widows: 2 !important;
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          .contrato-html h1,
          .contrato-html h2,
          .contrato-html h3,
          .contrato-html h4 {
            break-after: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-top: 0.6rem !important;
            margin-bottom: 0.25rem !important;
          }

          /* Neutraliza quebras artificiais de linhas vazias e <br> múltiplos gerados por editores */
          .contrato-html br + br {
            display: none !important;
          }

          /* Linhas de tabela vazias (resíduos de Word) não ocupam espaço na impressão */
          .contrato-html tr:empty {
            display: none !important;
          }

          /* Bloco de assinaturas: mantém agrupado para não separar linhas de assinatura */
          .contrato-html .bloco-assinaturas,
          .contrato-html .assinaturas,
          .contrato-html .assinatura,
          .contrato-html [data-assinatura],
          .contrato-html [class*="assinatura"] {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-top: 1.5rem !important;
          }
        }
      `}</style>
    </>
  );
}
