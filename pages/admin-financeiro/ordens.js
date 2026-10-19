import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';
import ModalBaixaManual from '@/components/AdminFinanceiro/ModalBaixaManual';
import BarraFiltros from '@/components/AdminFinanceiro/BarraFiltros';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState   from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import { FinanceEngine } from '../../lib/financeiro/FinanceEngine';

export default function OrdensPage() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('');
  const [filtroInstituicao, setFiltroInstituicao] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroAnoLetivo, setFiltroAnoLetivo] = useState('');

  const [instituicoes, setInstituicoes] = useState([]);
  const [todasUnidades, setTodasUnidades] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [todasTurmas, setTodasTurmas] = useState([]);

  const [modalBaixaManual, setModalBaixaManual] = useState(null); // { parcela_id, valor, efi_charge_id, label }
  const [baixandoParcela, setBaixandoParcela] = useState(false);
  const [modalVerOrdem, setModalVerOrdem] = useState(null); // ordem selecionada para visualização

  useEffect(() => {
    carregarOrdens();
    // Carregar opções de filtros
    Promise.all([
      fetch('/api/turmas/opcoes'),
      fetch('/api/comercial/instituicoes'),
      fetch('/api/unidades'),
      fetch('/api/cursos'),
      fetch('/api/turmas')
    ]).then(async ([resOpcoes, resInst, resUnids, resCursos, resTurmas]) => {
      let instList = [];
      if (resInst.ok) {
        const d = await resInst.json();
        if (Array.isArray(d)) instList = d;
      }

      if (resOpcoes.ok) {
        const dataOpcoes = await resOpcoes.json();
        if (instList.length === 0 && Array.isArray(dataOpcoes.instituicoes)) {
          instList = dataOpcoes.instituicoes;
        }
        if (Array.isArray(dataOpcoes.unidades)) setTodasUnidades(dataOpcoes.unidades);
        if (Array.isArray(dataOpcoes.cursos)) setTodosCursos(dataOpcoes.cursos);
      }

      if (resUnids.ok) {
        const dataUnids = await resUnids.json();
        if (Array.isArray(dataUnids) && dataUnids.length > 0) {
          const formatadas = dataUnids.map(u => ({
            id: u.id,
            nome: u.nome,
            instituicao_id: u.instituicaoId || u.instituicao_id,
            situacao: u.situacao,
          }));
          setTodasUnidades(formatadas);
        }
      }

      if (resCursos.ok) {
        const dataCursos = await resCursos.json();
        if (Array.isArray(dataCursos) && dataCursos.length > 0) {
          setTodosCursos(dataCursos);
        }
      }

      if (resTurmas.ok) {
        const dataTurmas = await resTurmas.json();
        setTodasTurmas(Array.isArray(dataTurmas) ? dataTurmas : dataTurmas.turmas || []);
      }

      setInstituicoes(instList);
    }).catch(console.error);
  }, []);

  // ── Cascatas Institucionais de Opções ──────────────────────────────────────
  // 1. Unidades filtradas pela Instituição selecionada
  const unidadesFiltradasOpcoes = useMemo(() => {
    if (!filtroInstituicao) return todasUnidades;
    return todasUnidades.filter(u => String(u.instituicao_id) === String(filtroInstituicao));
  }, [todasUnidades, filtroInstituicao]);

  // 2. Cursos filtrados por Instituição e Unidade
  const cursosFiltradosOpcoes = useMemo(() => {
    let list = todosCursos;
    if (filtroInstituicao) {
      list = list.filter(c => {
        const instId = c.instituicaoId || c.instituicao_id;
        return !instId || String(instId) === String(filtroInstituicao);
      });
    }
    if (filtroUnidade) {
      const uIdNum = Number(filtroUnidade);
      list = list.filter(c => {
        const unids = c.unidadeIds || c.unidade_ids || [];
        if (Array.isArray(unids) && unids.length > 0) {
          return unids.some(x => Number(x) === uIdNum);
        }
        return true;
      });
    }
    return list;
  }, [todosCursos, filtroInstituicao, filtroUnidade]);

  // 3. Turmas filtradas por Instituição, Unidade e Curso
  const turmasFiltradasOpcoes = useMemo(() => {
    let list = todasTurmas;
    if (filtroInstituicao) {
      list = list.filter(t => {
        const instId = t.instituicaoId || t.instituicao_id;
        return !instId || String(instId) === String(filtroInstituicao);
      });
    }
    if (filtroUnidade) {
      const uIdNum = Number(filtroUnidade);
      list = list.filter(t => {
        const tUnidId = t.unidade_id ?? t.unidadeId ?? t.unidadeid;
        return tUnidId == null || Number(tUnidId) === uIdNum;
      });
    }
    if (filtroCurso) {
      const cIdNum = Number(filtroCurso);
      list = list.filter(t => {
        const tCursoId = t.curso_id ?? t.cursoId ?? t.cursoid;
        return Number(tCursoId) === cIdNum;
      });
    }
    return list;
  }, [todasTurmas, filtroInstituicao, filtroUnidade, filtroCurso]);

  // ── Limpeza em Cascata de Filtros Incompatíveis ────────────────────────────
  const handleInstituicaoChange = (novaInst) => {
    setFiltroInstituicao(novaInst);
    if (novaInst) {
      // Se unidade não pertencer à nova instituição, limpa dependentes
      if (filtroUnidade) {
        const valida = todasUnidades.some(
          u => String(u.id) === String(filtroUnidade) && String(u.instituicao_id) === String(novaInst)
        );
        if (!valida) {
          setFiltroUnidade('');
          setFiltroCurso('');
          setFiltroTurma('');
        }
      }
      if (filtroCurso) {
        const validaCurso = todosCursos.some(
          c => String(c.id) === String(filtroCurso) && (!c.instituicaoId || String(c.instituicaoId) === String(novaInst))
        );
        if (!validaCurso) {
          setFiltroCurso('');
          setFiltroTurma('');
        }
      }
      if (filtroTurma) {
        const validaTurma = todasTurmas.some(
          t => String(t.id) === String(filtroTurma) && (!t.instituicao_id || String(t.instituicao_id) === String(novaInst))
        );
        if (!validaTurma) {
          setFiltroTurma('');
        }
      }
    }
  };

  const handleUnidadeChange = (novaUnidade) => {
    setFiltroUnidade(novaUnidade);
    if (novaUnidade) {
      if (filtroCurso) {
        const uIdNum = Number(novaUnidade);
        const validaCurso = todosCursos.some(c => {
          if (String(c.id) !== String(filtroCurso)) return false;
          const unids = c.unidadeIds || c.unidade_ids || [];
          return unids.length === 0 || unids.some(x => Number(x) === uIdNum);
        });
        if (!validaCurso) {
          setFiltroCurso('');
          setFiltroTurma('');
        }
      }
      if (filtroTurma) {
        const uIdNum = Number(novaUnidade);
        const validaTurma = todasTurmas.some(t => {
          if (String(t.id) !== String(filtroTurma)) return false;
          const tUnidId = t.unidade_id ?? t.unidadeId ?? t.unidadeid;
          return tUnidId == null || Number(tUnidId) === uIdNum;
        });
        if (!validaTurma) {
          setFiltroTurma('');
        }
      }
    }
  };

  const handleCursoChange = (novoCurso) => {
    setFiltroCurso(novoCurso);
    if (novoCurso && filtroTurma) {
      const cIdNum = Number(novoCurso);
      const validaTurma = todasTurmas.some(t => {
        if (String(t.id) !== String(filtroTurma)) return false;
        const tCursoId = t.curso_id ?? t.cursoId ?? t.cursoid;
        return Number(tCursoId) === cIdNum;
      });
      if (!validaTurma) {
        setFiltroTurma('');
      }
    }
  };

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

  const handleAbrirBaixaManual = async (ordem) => {
    if (!ordem) return;

    const pDet = ordem.parcela_detalhes || {};
    const valorBase = Number(pDet.valor_final ?? pDet.valor ?? ordem.valor_total ?? 0);

    setModalBaixaManual({
      ordem_id: ordem.id,
      parcela_id: ordem.parcela_id,
      aluno_nome: ordem.aluno_nome || 'N/A',
      descricao: ordem.descricao || 'Ordem de Cobrança',
      data_vencimento: ordem.data_vencimento,
      status: ordem.status_parcela || ordem.status,
      efi_charge_id: ordem.parcela_efi_charge_id || null,
      parcela: {
        id: ordem.parcela_id,
        valor: valorBase,
        valor_final: pDet.valor_final ?? valorBase,
        valor_nominal: pDet.valor_nominal ?? valorBase,
        valor_desconto: pDet.valor_desconto ?? 0,
        status: ordem.status_parcela || ordem.status,
      },
      carregando: true,
      erro: null,
    });

    try {
      const res = await fetch(`/api/admin-financeiro/ordens?id=${ordem.id}`);
      if (!res.ok) throw new Error('Não foi possível verificar os dados atualizados no servidor');
      const data = await res.json();
      const ordemAtualizada = Array.isArray(data.ordens) ? data.ordens[0] : null;

      if (!ordemAtualizada) {
        throw new Error('Cobrança não encontrada no servidor');
      }

      const pAtualizada = ordemAtualizada.parcela_detalhes || {};
      const valorReal = Number(pAtualizada.valor_final ?? pAtualizada.valor ?? ordemAtualizada.valor_total ?? 0);

      setModalBaixaManual(prev => prev && prev.ordem_id === ordem.id ? {
        ...prev,
        aluno_nome: ordemAtualizada.aluno_nome || prev.aluno_nome,
        descricao: ordemAtualizada.descricao || prev.descricao,
        data_vencimento: ordemAtualizada.data_vencimento || prev.data_vencimento,
        status: ordemAtualizada.status_parcela || ordemAtualizada.status,
        efi_charge_id: ordemAtualizada.parcela_efi_charge_id || prev.efi_charge_id,
        parcela: {
          id: ordemAtualizada.parcela_id || prev.parcela_id,
          valor: valorReal,
          valor_final: pAtualizada.valor_final ?? valorReal,
          valor_nominal: pAtualizada.valor_nominal ?? valorReal,
          valor_desconto: pAtualizada.valor_desconto ?? 0,
          status: ordemAtualizada.status_parcela || ordemAtualizada.status,
        },
        carregando: false,
        erro: null,
      } : prev);
    } catch (err) {
      console.error('Erro ao carregar dados atualizados da ordem:', err);
      setModalBaixaManual(prev => prev && prev.ordem_id === ordem.id ? {
        ...prev,
        carregando: false,
        erro: err.message,
      } : prev);
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

    if (filtroInstituicao) {
      resultado = resultado.filter(o => {
        const instId = o.instituicao_id || o.instituicaoId;
        return String(instId) === String(filtroInstituicao);
      });
    }

    if (filtroUnidade) {
      resultado = resultado.filter(o => {
        if (o.aluno_unidade_id != null) {
          return String(o.aluno_unidade_id) === String(filtroUnidade);
        }
        const turma = todasTurmas.find(t => t.id === o.aluno_turma_id);
        const tUnid = turma?.unidade_id ?? turma?.unidadeId ?? turma?.unidadeid;
        return tUnid != null && String(tUnid) === String(filtroUnidade);
      });
    }

    if (filtroCurso) {
      resultado = resultado.filter(o => {
        if (o.aluno_curso_id != null) {
          return Number(o.aluno_curso_id) === Number(filtroCurso);
        }
        const turma = todasTurmas.find(t => t.id === o.aluno_turma_id);
        const tCurso = turma?.curso_id ?? turma?.cursoId ?? turma?.cursoid;
        return tCurso != null && Number(tCurso) === Number(filtroCurso);
      });
    }

    if (filtroTurma) {
      resultado = resultado.filter(o => Number(o.aluno_turma_id) === Number(filtroTurma));
    }

    if (filtroAnoLetivo) {
      resultado = resultado.filter(o => String(o.aluno_ano_letivo) === String(filtroAnoLetivo));
    }

    return resultado;
  }, [ordens, filtroStatus, filtroAluno, filtroInstituicao, filtroUnidade, filtroCurso, filtroTurma, filtroAnoLetivo, todasTurmas]);

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
          instituicaoValue={filtroInstituicao}
          onInstituicaoChange={handleInstituicaoChange}
          instituicoes={instituicoes}
          unidadeValue={filtroUnidade}
          onUnidadeChange={handleUnidadeChange}
          unidades={unidadesFiltradasOpcoes}
          cursoValue={filtroCurso}
          onCursoChange={handleCursoChange}
          cursos={cursosFiltradosOpcoes}
          turmaValue={filtroTurma}
          onTurmaChange={setFiltroTurma}
          turmas={turmasFiltradasOpcoes}
          anoLetivoValue={filtroAnoLetivo}
          onAnoLetivoChange={setFiltroAnoLetivo}
          anosLetivos={['2024', '2025', '2026', '2027']}
          onClear={() => {
            setFiltroAluno('');
            setFiltroStatus('');
            setFiltroInstituicao('');
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
                          <button
                            type="button"
                            onClick={() => setModalVerOrdem(ordem)}
                            className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition text-xs font-semibold cursor-pointer"
                          >
                            Ver
                          </button>
                          {ordem.parcela_id && ordem.status_parcela !== 'pago' && ordem.status_parcela !== 'cancelado' && ordem.status !== 'pago' && ordem.status !== 'cancelado' && (
                            <button
                              type="button"
                              onClick={() => handleAbrirBaixaManual(ordem)}
                              title="Baixar manualmente"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-xs font-semibold cursor-pointer"
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

      {/* MODAL DETALHES DA ORDEM (Substitui link que dava 404) */}
      {modalVerOrdem && (
        <ModalDetalhesOrdem
          ordem={modalVerOrdem}
          onClose={() => setModalVerOrdem(null)}
          formataValor={formataValor}
          formataData={formataData}
          BadgeBoleto={BadgeBoleto}
        />
      )}

      {modalBaixaManual && (
        <ModalBaixaManual
          parcela={modalBaixaManual.parcela}
          alunoNome={modalBaixaManual.aluno_nome}
          descricao={modalBaixaManual.descricao}
          dataVencimento={modalBaixaManual.data_vencimento}
          statusOrdem={modalBaixaManual.status}
          permitirMultiplos={false}
          carregandoDados={modalBaixaManual.carregando}
          erroCarregamento={modalBaixaManual.erro}
          onConfirm={handleBaixarManual}
          onClose={() => setModalBaixaManual(null)}
          loading={baixandoParcela}
        />
      )}
    </AdminFinanceiroLayout>
  );
}

// ── Componente de Modal com Detalhes da Ordem ─────────────────────────────────
function ModalDetalhesOrdem({ ordem, onClose, formataValor, formataData, BadgeBoleto }) {
  const [copiado, setCopiado] = useState(false);

  const p = ordem.parcela_detalhes || {};
  const boletoUrl = p.boleto_url || ordem.boleto_url;
  const codigoBarras = p.boleto_barcode || ordem.boleto_barcode;

  const handleCopiarCodigo = () => {
    if (!codigoBarras) return;
    navigator.clipboard.writeText(codigoBarras);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Topo / Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📄</span>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Detalhes do Boleto / Ordem
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                ID: {ordem.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-gray-700">
          {/* Status e Valores */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-teal-50/60 border border-teal-100 rounded-xl">
            <div>
              <span className="text-xs text-teal-800 font-medium block">Status da Cobrança</span>
              <div className="mt-1">
                <BadgeBoleto status={ordem.status_parcela || ordem.status} />
              </div>
            </div>
            <div>
              <span className="text-xs text-teal-800 font-medium block">Valor Total</span>
              <span className="text-xl font-bold text-teal-900">
                {formataValor(ordem.valor_total)}
              </span>
            </div>
            <div>
              <span className="text-xs text-teal-800 font-medium block">Vencimento</span>
              <span className="text-sm font-semibold text-gray-800">
                {formataData(ordem.data_vencimento)}
              </span>
            </div>
          </div>

          {/* Dados do Aluno e Vínculo Institucional */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎓</span> Dados Acadêmicos & Institucionais
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500 font-medium block text-xs">Aluno:</span>
                <span className="font-semibold text-gray-900">{ordem.aluno_nome}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block text-xs">CPF:</span>
                <span className="font-mono text-gray-800">{ordem.aluno_cpf || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block text-xs">Instituição:</span>
                <span className="text-gray-800 font-medium">{ordem.instituicao_nome || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block text-xs">Unidade:</span>
                <span className="text-gray-800 font-medium">{ordem.aluno_unidade_nome || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block text-xs">Curso:</span>
                <span className="text-gray-800 font-medium">{ordem.aluno_curso_nome || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block text-xs">Turma:</span>
                <span className="text-gray-800 font-medium">{ordem.aluno_turma_nome || '—'}</span>
              </div>
            </div>
          </div>

          {/* Dados da Cobrança */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>💳</span> Dados da Cobrança & Integração
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500 font-medium block text-xs">Descrição:</span>
                <span className="font-medium text-gray-900">{ordem.descricao || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block text-xs">Referência / Item:</span>
                <span className="text-gray-800">{ordem.referencia || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block text-xs">Identificador / Nosso Número:</span>
                <span className="font-mono text-blue-700 font-semibold">{ordem.cobranca || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block text-xs">Criado em:</span>
                <span className="text-gray-700">{formataData(ordem.created_at)}</span>
              </div>
              {p.valor_desconto > 0 && (
                <div>
                  <span className="text-gray-500 font-medium block text-xs">Desconto Concedido:</span>
                  <span className="text-emerald-700 font-medium">{formataValor(p.valor_desconto)}</span>
                </div>
              )}
              {p.data_pagamento && (
                <div>
                  <span className="text-gray-500 font-medium block text-xs">Pago em:</span>
                  <span className="text-emerald-800 font-bold">{formataData(p.data_pagamento)} {p.valor_pago ? `(${formataValor(p.valor_pago)})` : ''}</span>
                </div>
              )}
            </div>

            {/* Código de barras se disponível */}
            {codigoBarras && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium block mb-1">Linha Digitável / Código de Barras:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={codigoBarras}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopiarCodigo}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition shrink-0 cursor-pointer"
                  >
                    {copiado ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Histórico / Observações */}
          {(ordem.observacoes || p.observacao_baixa) && (
            <div className="border border-amber-100 bg-amber-50/50 rounded-xl p-3.5 text-xs space-y-1">
              <span className="font-bold text-amber-900 block">Observações / Histórico:</span>
              {ordem.observacoes && <p className="text-amber-800">{ordem.observacoes}</p>}
              {p.observacao_baixa && <p className="text-amber-800"><strong>Baixa:</strong> {p.observacao_baixa}</p>}
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/90 rounded-b-2xl">
          <div>
            {boletoUrl ? (
              <a
                href={boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <span>🖨️</span>
                <span>Imprimir / Abrir Boleto</span>
              </a>
            ) : (
              <span className="text-xs text-gray-400 italic">
                Nenhum documento/URL de boleto disponível
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
