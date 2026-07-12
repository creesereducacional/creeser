import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';
import ModalBaixaManual from '@/components/AdminFinanceiro/ModalBaixaManual';
import BarraFiltros from '@/components/AdminFinanceiro/BarraFiltros';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState   from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';

export default function OrdensPage() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroAnoLetivo, setFiltroAnoLetivo] = useState('');
  const [unidades, setUnidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [todasTurmas, setTodasTurmas] = useState([]);
  const [modalBaixaManual, setModalBaixaManual] = useState(null); // { parcela_id, valor, efi_charge_id, label }
  const [baixandoParcela, setBaixandoParcela] = useState(false);

  useEffect(() => {
    carregarOrdens();
    // Carregar opções de filtros
    Promise.all([
      fetch('/api/turmas/opcoes'),
      fetch('/api/turmas')
    ]).then(async ([resOpcoes, resTurmas]) => {
      if (resOpcoes.ok) {
        const dataOpcoes = await resOpcoes.json();
        if (dataOpcoes.unidades) setUnidades(dataOpcoes.unidades);
        if (dataOpcoes.cursos) setCursos(dataOpcoes.cursos);
      }
      if (resTurmas.ok) {
        const dataTurmas = await resTurmas.json();
        setTodasTurmas(Array.isArray(dataTurmas) ? dataTurmas : dataTurmas.turmas || []);
      }
    }).catch(console.error);
  }, []);

  const turmasFiltradasOpcoes = useMemo(() => {
    let list = todasTurmas;
    if (filtroCurso) list = list.filter(t => t.curso_id === Number(filtroCurso));
    if (filtroUnidade) list = list.filter(t => t.unidade_id === filtroUnidade);
    return list;
  }, [todasTurmas, filtroCurso, filtroUnidade]);

  const carregarOrdens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-financeiro/ordens');
      if (response.ok) {
        const data = await response.json();
        setOrdens(Array.isArray(data.ordens) ? data.ordens : []);
      }
    } catch (error) {
      console.error('Erro ao carregar boletos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarManual = async (formData) => {
    const { parcela_id } = modalBaixaManual;
    setBaixandoParcela(true);
    try {
      const res = await fetch(`/api/admin-financeiro/parcelas/${parcela_id}/pagar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao registrar baixa');
      setModalBaixaManual(null);
      if (data.aviso) alert('⚠️ ' + data.aviso);
      await carregarOrdens();
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setBaixandoParcela(false);
    }
  };

  const ordensFiltradas = useMemo(() => {
    let resultado = ordens;

    if (filtroStatus) {
      resultado = resultado.filter(o => o.status === filtroStatus);
    }

    if (filtroAluno) {
      const termo = filtroAluno.toLowerCase();
      resultado = resultado.filter(o =>
        (o.aluno_nome || '').toLowerCase().includes(termo) ||
        (o.aluno_cpf || '').includes(termo)
      );
    }

    if (filtroUnidade) {
      resultado = resultado.filter(o => {
        const turma = todasTurmas.find(t => t.id === o.aluno_turma_id);
        return turma && String(turma.unidade_id) === String(filtroUnidade);
      });
    }

    if (filtroCurso) {
      resultado = resultado.filter(o => o.aluno_curso_id === Number(filtroCurso));
    }

    if (filtroTurma) {
      resultado = resultado.filter(o => o.aluno_turma_id === Number(filtroTurma));
    }

    if (filtroAnoLetivo) {
      resultado = resultado.filter(o => o.aluno_ano_letivo === filtroAnoLetivo);
    }

    return resultado;
  }, [ordens, filtroStatus, filtroAluno, filtroUnidade, filtroCurso, filtroTurma, filtroAnoLetivo, todasTurmas]);

  const resumo = useMemo(() => {
    return {
      total: ordensFiltradas.length,
      ativas: ordensFiltradas.filter(o => o.status === 'ativo').length,
      canceladas: ordensFiltradas.filter(o => o.status === 'cancelado').length,
      valor_total: ordensFiltradas.reduce((acc, o) => acc + (Number(o.valor_total) || 0), 0)
    };
  }, [ordensFiltradas]);

  const formataValor = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formataData = (data) => {
    if (!data) return '-';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  // Mapeamento status → variante global do StatusBadge
  const STATUS_VARIANTE = {
    ativo:     { variant: 'info',    label: 'Ativo'      },
    pendente:  { variant: 'warning', label: 'Pendente'   },
    pago:      { variant: 'success', label: 'Pago'       },
    vencido:   { variant: 'orange',  label: 'Vencido'    },
    cancelado: { variant: 'danger',  label: 'Cancelado'  },
    encerrado: { variant: 'neutral', label: 'Encerrado'  },
  };

  const BadgeBoleto = ({ status }) => {
    const cfg = STATUS_VARIANTE[status] || { variant: 'neutral', label: status };
    return <StatusBadge variant={cfg.variant} label={cfg.label} dot />;
  };

  if (loading) {
    return (
      <AdminFinanceiroLayout>
        <div className="space-y-6">
          <SkeletonTable rows={6} cols={7} />
        </div>
      </AdminFinanceiroLayout>
    );
  }

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Boletos</h2>
            <p className="text-gray-600">Gestão de boletos simples e únicos</p>
          </div>
          <Link
            href="/admin-financeiro/alunos"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
          >
            ➕ Novo Boleto
          </Link>
        </div>

        {/* RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-semibold">Total de Boletos</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{resumo.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-semibold">Ativos</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{resumo.ativas}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-700 font-semibold">Valor Total</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{formataValor(resumo.valor_total)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-semibold">Cancelados</p>
            <p className="text-3xl font-bold text-red-900 mt-1">{resumo.canceladas}</p>
          </div>
        </div>

        <BarraFiltros
          searchPlaceholder="🔍 Nome ou CPF do aluno..."
          searchValue={filtroAluno}
          onSearchChange={setFiltroAluno}
          statusValue={filtroStatus}
          onStatusChange={setFiltroStatus}
          statusOptions={[
            { value: "ativo", label: "Ativo" },
            { value: "cancelado", label: "Cancelado" },
            { value: "encerrado", label: "Encerrado" }
          ]}
          unidadeValue={filtroUnidade}
          onUnidadeChange={setFiltroUnidade}
          unidades={unidades}
          cursoValue={filtroCurso}
          onCursoChange={setFiltroCurso}
          cursos={cursos}
          turmaValue={filtroTurma}
          onTurmaChange={setFiltroTurma}
          turmas={turmasFiltradasOpcoes}
          anoLetivoValue={filtroAnoLetivo}
          onAnoLetivoChange={setFiltroAnoLetivo}
          anosLetivos={['2024', '2025', '2026', '2027']}
          onClear={() => {
            setFiltroAluno('');
            setFiltroStatus('');
            setFiltroUnidade('');
            setFiltroCurso('');
            setFiltroTurma('');
            setFiltroAnoLetivo('');
          }}
        />

        {/* TABELA */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {ordensFiltradas.length === 0 ? (
            <EmptyState
              icon="📄"
              title="Nenhum boleto encontrado"
              description="Ajuste os filtros ou crie um novo boleto."
              compact
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Aluno</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Emissão</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Cobrança</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ordensFiltradas.map(ordem => (
                    <tr key={ordem.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {ordem.aluno_nome}
                      </td>
                      <td className="px-4 py-4 text-sm">
                          <BadgeBoleto status={ordem.status_parcela || ordem.status} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-650">
                        {formataData(ordem.data_vencimento)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-650">
                        {formataData(ordem.created_at)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-semibold">
                        {formataValor(ordem.valor_total)}
                      </td>
                      <td className="px-4 py-4 text-sm text-blue-600 font-mono">
                        {ordem.cobranca}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin-financeiro/ordem/${ordem.id}`}
                            className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition text-xs font-semibold"
                          >
                            Ver
                          </Link>
                          {ordem.parcela_id && ordem.status_parcela !== 'pago' && ordem.status_parcela !== 'cancelado' && (
                            <button
                              onClick={() => setModalBaixaManual({
                                parcela_id: ordem.parcela_id,
                                valor: null,
                                efi_charge_id: ordem.parcela_efi_charge_id || null,
                              })}
                              title="Baixar manualmente"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-xs font-semibold"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Baixar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {modalBaixaManual && (
        <ModalBaixaManual
          parcela={{ id: modalBaixaManual.parcela_id, valor: modalBaixaManual.valor, efi_charge_id: modalBaixaManual.efi_charge_id }}
          onConfirm={handleBaixarManual}
          onClose={() => setModalBaixaManual(null)}
          loading={baixandoParcela}
        />
      )}
    </AdminFinanceiroLayout>
  );
}
