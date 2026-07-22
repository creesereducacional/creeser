import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';
import ModalBaixaManual from '@/components/AdminFinanceiro/ModalBaixaManual';
import BarraFiltros from '@/components/AdminFinanceiro/BarraFiltros';
import { FinanceEngine } from '../../lib/financeiro/FinanceEngine';

export default function CarnesPage() {
  const [carnes, setCarnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [expandidoId, setExpandidoId] = useState(null);
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroAnoLetivo, setFiltroAnoLetivo] = useState('');
  const [unidades, setUnidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [todasTurmas, setTodasTurmas] = useState([]);
  const [gerandoId, setGerandoId] = useState(null);
  const [selectedParcelas, setSelectedParcelas] = useState({});
  const [cancelandoParcela, setCancelandoParcela] = useState(false);
  const [filtroAluno, setFiltroAluno] = useState('');
  const [modalConfirmar, setModalConfirmar] = useState(null); // { titulo, mensagem, onConfirm }
  const [modalCancelarParcela, setModalCancelarParcela] = useState(null);
  const [modalRecibo, setModalRecibo] = useState(null); // ordemId
  const [modalBaixaManual, setModalBaixaManual] = useState(null); // { parcela, carne }
  const [baixandoParcela, setBaixandoParcela] = useState(false);
  const [modalWhatsapp, setModalWhatsapp] = useState(null);

  const toggleParcela = (carneId, parcelaId) => {
    setSelectedParcelas(prev => {
      const set = new Set(prev[carneId] || []);
      set.has(parcelaId) ? set.delete(parcelaId) : set.add(parcelaId);
      return { ...prev, [carneId]: set };
    });
  };

  const toggleTodasParcelas = (carneId, parcelas, selecionar) => {
    const cancelaveis = parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado');
    setSelectedParcelas(prev => ({
      ...prev,
      [carneId]: selecionar ? new Set(cancelaveis.map(p => p.id)) : new Set(),
    }));
  };

  const handleCancelarSelecionadas = (carne) => {
    const ids = [...(selectedParcelas[carne.id] || [])];
    if (!ids.length) return;
    setModalCancelarParcela({
      type: 'multiple',
      carne,
      ids,
    });
  };

  const handleBaixarManual = async (formData) => {
    const { parcela } = modalBaixaManual;
    setBaixandoParcela(true);
    try {
      const res = await fetch(`/api/admin-financeiro/parcelas/${parcela.id}/pagar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao registrar baixa');
      setModalBaixaManual(null);
      if (data.aviso) alert('⚠️ ' + data.aviso);
      await carregarCarnes();
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setBaixandoParcela(false);
    }
  };

  const handleCancelarParcela = (carne, parcela) => {
    setModalCancelarParcela({
      type: 'single',
      carne,
      parcela,
    });
  };

  const handleConfirmarCancelarParcela = async (observacao) => {
    if (!modalCancelarParcela) return;
    setCancelandoParcela(true);
    const { type, carne, parcela, ids } = modalCancelarParcela;
    try {
      if (type === 'single') {
        await fetch('/api/admin-financeiro/efi/carne', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem_id: carne.id, parcela_id: parcela.id, observacao }),
        });
      } else if (type === 'multiple') {
        for (const parcela_id of ids) {
          await fetch('/api/admin-financeiro/efi/carne', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordem_id: carne.id, parcela_id, observacao }),
          });
        }
        setSelectedParcelas(prev => ({ ...prev, [carne.id]: new Set() }));
      }
      await carregarCarnes();
      setModalCancelarParcela(null);
    } catch (e) {
      console.error(e);
    } finally {
      setCancelandoParcela(false);
    }
  };

  const handleEnviarWhatsApp = async (parcelaId, fastSend = false) => {
    try {
      const res = await fetch(`/api/admin-financeiro/parcelas/${parcelaId}/whatsapp-info`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erro ao buscar dados do WhatsApp');
      }
      const data = await res.json();
      const { aluno_nome, responsavel_telefone, numero_parcela, valor, data_vencimento, payment_url } = data;

      if (!responsavel_telefone) {
        console.warn('WhatsApp/telefone não encontrado para o responsável ou aluno no banco de dados.');
        alert('Responsável sem telefone cadastrado.');
        return;
      }

      let telefoneLimpo = responsavel_telefone.replace(/\D/g, '');
      if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) {
        telefoneLimpo = '55' + telefoneLimpo;
      }

      if (telefoneLimpo.length < 10) {
        console.error('Número de telefone inválido ou incompleto:', responsavel_telefone);
        alert('Responsável sem telefone cadastrado.');
        return;
      }

      if (!payment_url) {
        console.warn('payment_url/boleto_url não encontrado para a parcela:', parcelaId);
        alert('A cobrança não possui link disponível para envio.');
        return;
      }

      const dataFormatada = data_vencimento ? new Date(data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '';
      const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

      const msg = `Olá, tudo bem?\n\nSegue a 2ª via da parcela *#${numero_parcela}* do aluno *${aluno_nome}*.\n\n*Vencimento:* ${dataFormatada}\n*Valor:* ${valorFormatado}\n\nVocê pode efetuar o pagamento pelo link a seguir:\n${payment_url}\n\nQualquer dúvida, estamos à disposição!`;

      if (fastSend) {
        try {
          await fetch(`/api/admin-financeiro/parcelas/${parcelaId}/log-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefone: telefoneLimpo })
          });
        } catch (err) {
          console.error('Falha ao registrar log de auditoria:', err);
        }
        const url = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      } else {
        setModalWhatsapp({
          id: parcelaId,
          aluno_nome,
          responsavel_telefone: telefoneLimpo,
          numero_parcela,
          valor,
          data_vencimento,
          payment_url,
          valorFormatado,
          dataFormatada,
          mensagemPadrao: msg
        });
      }
    } catch (err) {
      console.error('Erro ao processar envio para o WhatsApp:', err);
      alert('Erro ao processar envio: ' + err.message);
    }
  };

  useEffect(() => {
    carregarCarnes();
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

  const carregarCarnes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-financeiro/carnes');
      if (response.ok) {
        const data = await response.json();
        setCarnes(Array.isArray(data.carnes) ? data.carnes : []);
      }
    } catch (error) {
      console.error('Erro ao carregar carnês:', error);
    } finally {
      setLoading(false);
    }
  };

  const carnesFiltrados = useMemo(() => {
    let resultado = carnes;

    if (filtroStatus) {
      resultado = resultado.filter(c => c.status === filtroStatus);
    }

    if (filtroAluno) {
      const termo = filtroAluno.toLowerCase();
      resultado = resultado.filter(c =>
        (c.aluno_nome || '').toLowerCase().includes(termo) ||
        (c.aluno_cpf || '').includes(termo)
      );
    }

    if (filtroUnidade) {
      resultado = resultado.filter(c => {
        const turma = todasTurmas.find(t => t.id === c.aluno_turma_id);
        return turma && String(turma.unidade_id) === String(filtroUnidade);
      });
    }

    if (filtroCurso) {
      resultado = resultado.filter(c => c.aluno_curso_id === Number(filtroCurso));
    }

    if (filtroTurma) {
      resultado = resultado.filter(c => c.aluno_turma_id === Number(filtroTurma));
    }

    if (filtroAnoLetivo) {
      resultado = resultado.filter(c => c.aluno_ano_letivo === filtroAnoLetivo);
    }

    return resultado;
  }, [carnes, filtroStatus, filtroAluno, filtroUnidade, filtroCurso, filtroTurma, filtroAnoLetivo, todasTurmas]);

  const resumo = useMemo(() => {
    return {
      total: carnesFiltrados.length,
      ativas: carnesFiltrados.filter(c => c.status === 'ativo').length,
      canceladas: carnesFiltrados.filter(c => c.status === 'cancelado').length,
      valor_total: carnesFiltrados.reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0)
    };
  }, [carnesFiltrados]);

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

  const StatusBadge = ({ status }) => {
    const cfg = {
      ativo:     { cls: 'bg-green-100 text-green-800 border border-green-200',  dot: 'bg-green-500',  label: 'Ativo' },
      cancelado: { cls: 'bg-red-100 text-red-700 border border-red-200',         dot: 'bg-red-500',    label: 'Cancelado' },
      encerrado: { cls: 'bg-gray-100 text-gray-700 border border-gray-200',      dot: 'bg-gray-400',   label: 'Encerrado' },
      pago:      { cls: 'bg-blue-100 text-blue-800 border border-blue-200',      dot: 'bg-blue-500',   label: 'Pago' },
      parcial:   { cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200', dot: 'bg-yellow-500', label: 'Parcial' },
    };
    const c = cfg[status] || { cls: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400', label: status };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
        {c.label}
      </span>
    );
  };

  const today = new Date().toISOString().slice(0, 10);

  const StatusParcelaBadge = ({ status, dataVencimento }) => {
    const venceHoje = status === 'pendente' && dataVencimento && dataVencimento.slice(0, 10) === today;
    const cfg = {
      pago:      { cls: 'bg-green-100 text-green-800 border border-green-200',   label: 'Pago' },
      pendente:  venceHoje
               ? { cls: 'bg-yellow-100 text-yellow-800 border border-yellow-300', label: 'Vence hoje' }
               : { cls: 'bg-blue-50 text-blue-700 border border-blue-200',        label: 'Pendente' },
      vencido:   { cls: 'bg-red-100 text-red-700 border border-red-200',          label: 'Vencido' },
      cancelado: { cls: 'bg-gray-100 text-gray-500 border border-gray-200',       label: 'Cancelado' },
    };
    const c = cfg[status] || { cls: 'bg-gray-100 text-gray-600 border border-gray-200', label: status };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${c.cls}`}>
        {c.label}
      </span>
    );
  };

  const handleGerarBoletos = async (carne) => {
    setGerandoId(carne.id);
    try {
      if (!carne.efi_carnet_id) {
        // Carnê ainda não gerado na EFI — criar agora
        const res = await fetch('/api/admin-financeiro/efi/carne', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem_id: carne.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao gerar carnê');
        if (data.link) window.open(data.link, '_blank');
        await carregarCarnes();
      } else {
        // Já gerado — buscar link atual na EFI
        const res = await fetch(`/api/admin-financeiro/efi/carne?ordem_id=${carne.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao buscar carnê');
        if (data.link) {
          window.open(data.link, '_blank');
        } else {
          alert('Link do carnê não disponível na EFI.');
        }
      }
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setGerandoId(null);
    }
  };

  if (loading) {
    return (
      <AdminFinanceiroLayout>
        <div className="space-y-3 p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-16" />
              </div>
            </div>
          ))}
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
            <h2 className="text-xl font-bold text-gray-900">Carnês de Pagamento</h2>
            <p className="text-sm text-gray-500 mt-0.5">Gestão de múltiplas parcelas por aluno</p>
          </div>
          <Link
            href="/admin-financeiro/alunos"
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition text-sm shadow-sm"
          >
            ➕ Novo Carnê
          </Link>
        </div>

        {/* RESUMO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-l-4 border-l-blue-500 rounded-2xl shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total de Carnês</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{resumo.total}</p>
          </div>
          <div className="bg-white border border-l-4 border-l-green-500 rounded-2xl shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ativos</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{resumo.ativas}</p>
          </div>
          <div className="bg-white border border-l-4 border-l-teal-500 rounded-2xl shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Valor Total</p>
            <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">{formataValor(resumo.valor_total)}</p>
          </div>
          <div className="bg-white border border-l-4 border-l-red-500 rounded-2xl shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Cancelados</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{resumo.canceladas}</p>
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

        {/* LISTA DE CARNÊS */}
        <div className="space-y-3">
          {carnesFiltrados.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-semibold text-gray-600">Nenhum carnê encontrado</p>
              <p className="text-sm mt-1">{filtroAluno || filtroStatus ? 'Tente ajustar os filtros.' : 'Crie o primeiro carnê para um aluno.'}</p>
            </div>
          ) : (
            carnesFiltrados.map((carne) => {
              const parcelasTotal   = carne.parcelas?.length || carne.quantidade_parcelas || 0;
              const parcelasPagas   = carne.parcelas?.filter(p => p.status === 'pago').length || 0;
              const parcelasVencidas = carne.parcelas?.filter(p => p.status === 'vencido').length || 0;
              const parcelasPendentes = parcelasTotal - parcelasPagas - (carne.parcelas?.filter(p => p.status === 'cancelado').length || 0);
              const progresso = parcelasTotal > 0 ? Math.round((parcelasPagas / parcelasTotal) * 100) : 0;

              return (
                <div key={carne.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* ── Cabeçalho clicável */}
                  <button
                    onClick={() => setExpandidoId(expandidoId === carne.id ? null : carne.id)}
                    className="w-full px-5 py-4 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                        {(carne.aluno_nome || '?')[0].toUpperCase()}
                      </div>

                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{carne.aluno_nome}</p>
                          <StatusBadge status={carne.status} />
                          {parcelasVencidas > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                              ⚠️ {parcelasVencidas} vencida{parcelasVencidas > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          {carne.aluno_cpf && <span>CPF {carne.aluno_cpf}</span>}
                          {carne.descricao && <span className="truncate max-w-[200px]">{carne.descricao}</span>}
                          {carne.referencia && <span>📅 {carne.referencia}</span>}
                        </div>
                      </div>

                      {/* Métricas de parcelas */}
                      <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">{parcelasPagas} pagas</span>
                          <span className="text-gray-300">/</span>
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">{parcelasPendentes > 0 ? parcelasPendentes + ' pend.' : ''}</span>
                          <span className="text-gray-500 font-semibold">{parcelasTotal}x</span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progresso === 100 ? 'bg-green-500' : 'bg-teal-500'}`}
                            style={{ width: `${progresso}%` }}
                          />
                        </div>
                        <p className="font-bold text-gray-800 text-sm">{formataValor(carne.valor_total)}</p>
                      </div>

                      <span className={`text-gray-400 transition-transform ${expandidoId === carne.id ? 'rotate-90' : ''}`}>›</span>
                    </div>
                  </button>

                  {/* ── Detalhes expandidos */}
                  {expandidoId === carne.id && (
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">CPF</p>
                          <p className="font-semibold text-gray-900">{carne.aluno_cpf || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Período</p>
                          <p className="font-semibold text-gray-900">{carne.referencia || 'Período Único'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Valor/Parcela</p>
                          <p className="font-semibold text-gray-900">{formataValor((carne.valor_total || 0) / (carne.quantidade_parcelas || 1))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Criado em</p>
                          <p className="font-semibold text-gray-900">{formataData(carne.created_at)}</p>
                        </div>
                      </div>

                      {/* TABELA DE PARCELAS */}
                      {carne.parcelas && carne.parcelas.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Parcelas:</h4>
                            {(selectedParcelas[carne.id]?.size > 0) && (
                              <div className="flex items-center gap-3 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                                <span className="text-sm text-red-700 font-medium">{selectedParcelas[carne.id].size} selecionada(s)</span>
                                <button onClick={() => handleCancelarSelecionadas(carne)} disabled={cancelandoParcela}
                                  className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                                  {cancelandoParcela ? 'Cancelando...' : 'Cancelar selecionadas'}
                                </button>
                                <button onClick={() => setSelectedParcelas(p => ({ ...p, [carne.id]: new Set() }))}
                                  className="text-xs text-gray-400 hover:text-gray-600">Limpar</button>
                              </div>
                            )}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                  <th className="px-3 py-2 w-8">
                                    <input type="checkbox"
                                      className="rounded border-gray-300 text-red-600 cursor-pointer"
                                      checked={carne.parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado').length > 0 &&
                                        carne.parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado').every(p => selectedParcelas[carne.id]?.has(p.id))}
                                      onChange={e => toggleTodasParcelas(carne.id, carne.parcelas, e.target.checked)}
                                    />
                                  </th>
                                  <th className="text-left px-2 py-2">Parcela</th>
                                  <th className="text-left px-2 py-2">Vencimento</th>
                                  <th className="text-right px-2 py-2">Valor</th>
                                  <th className="text-left px-2 py-2">Status</th>
                                  <th className="text-center px-2 py-2">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {carne.parcelas.map((parcela) => {
                                  const cancelavel = parcela.status !== 'pago' && parcela.status !== 'cancelado';
                                  return (
                                    <tr key={parcela.id} className={`border-b border-gray-100 ${selectedParcelas[carne.id]?.has(parcela.id) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                      <td className="px-3 py-2">
                                        <input type="checkbox"
                                          disabled={!cancelavel}
                                          checked={selectedParcelas[carne.id]?.has(parcela.id) || false}
                                          onChange={() => toggleParcela(carne.id, parcela.id)}
                                          className="rounded border-gray-300 text-red-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="px-2 py-2 text-gray-900 font-semibold">{parcela.numero_parcela}</td>
                                      <td className="px-2 py-2 text-gray-600">{formataData(parcela.data_vencimento)}</td>
                                      <td className="px-2 py-2 text-gray-900 font-semibold text-right">{formataValor(FinanceEngine.obterValorVigente(parcela))}</td>
                                      <td className="px-2 py-2.5"><StatusParcelaBadge status={parcela.status} dataVencimento={parcela.data_vencimento} /></td>
                                      <td className="px-2 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {parcela.status === 'pago' && (
                                            <button onClick={() => setModalRecibo({ id: carne.id, parcelaId: parcela.id })}
                                              title="Imprimir Recibo"
                                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            </button>
                                          )}
                                          {(parcela.status === 'pendente' || parcela.status === 'vencido') && (
                                            <div className="flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:shadow-sm transition-all duration-200 divide-x divide-emerald-250">
                                              <button
                                                onClick={() => handleEnviarWhatsApp(parcela.id, true)}
                                                onContextMenu={(e) => { e.preventDefault(); handleEnviarWhatsApp(parcela.id, false); }}
                                                title="Enviar 2ª via rápida por WhatsApp (Clique com botão direito para editar)"
                                                className="w-9 h-9 flex items-center justify-center rounded-l-full hover:scale-105 transition-all duration-200 cursor-pointer">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.48-.002 9.932-4.453 9.935-9.934.002-2.657-1.03-5.155-2.905-7.03C16.426 1.768 13.932.735 11.28.735 5.798.735 1.346 5.188 1.343 10.669c-.001 1.554.415 3.076 1.203 4.437l-.988 3.606 3.693-.97c1.37.747 2.808 1.134 4.396 1.14l.003-.008zm10.153-6.885c-.29-.145-1.722-.85-1.99-.947-.267-.097-.463-.146-.658.145-.195.29-.757.947-.928 1.142-.17.195-.34.22-.63.075-.29-.145-1.228-.453-2.338-1.444-.864-.77-1.448-1.721-1.618-2.011-.17-.29-.018-.447.127-.592.13-.13.29-.34.436-.509.145-.17.195-.29.29-.485.097-.195.048-.364-.025-.509-.073-.145-.658-1.587-.9-2.17-.236-.569-.475-.491-.657-.5l-.558-.01c-.195 0-.51.072-.777.363-.267.29-1.02 1.02-1.02 2.485s1.07 2.871 1.218 3.064c.146.195 2.105 3.2 5.1 4.499.712.309 1.268.494 1.7.632.715.228 1.364.195 1.878.118.571-.085 1.722-.704 1.965-1.385.243-.68.243-1.261.17-1.385-.073-.122-.268-.195-.559-.34z"/>
                                                </svg>
                                              </button>
                                              <button
                                                onClick={() => handleEnviarWhatsApp(parcela.id, false)}
                                                title="Personalizar mensagem antes de enviar"
                                                className="w-5 h-9 flex items-center justify-center rounded-r-full hover:bg-emerald-100/50 hover:scale-105 transition-all duration-200 cursor-pointer">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                              </button>
                                            </div>
                                          )}
                                          {cancelavel && (
                                            <>
                                              <button
                                                onClick={() => setModalBaixaManual({ parcela, carne })}
                                                title="Registrar Baixa"
                                                className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 hover:scale-105 hover:shadow-sm transition-all duration-200 cursor-pointer">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                              </button>
                                              <button onClick={() => handleCancelarParcela(carne, parcela)} disabled={cancelandoParcela}
                                                title="Cancelar Parcela"
                                                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:scale-105 hover:shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* BOTÕES DE AÇÃO DO CARNÊ */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleGerarBoletos(carne)}
                          disabled={gerandoId === carne.id}
                          className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 font-semibold transition text-sm disabled:opacity-50"
                        >
                          {gerandoId === carne.id
                            ? '⏳ Aguarde...'
                            : carne.efi_carnet_id ? '📄 Abrir Carnê PDF' : '📄 Gerar Boletos'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {modalConfirmar && (
        <ModalConfirmar
          titulo={modalConfirmar.titulo}
          mensagem={modalConfirmar.mensagem}
          onConfirm={async () => { setModalConfirmar(null); await modalConfirmar.onConfirm(); }}
          onClose={() => setModalConfirmar(null)}
        />
      )}
      {modalCancelarParcela && modalCancelarParcela.type === 'single' && (
        <ModalCancelarParcela
          carne={modalCancelarParcela.carne}
          parcela={modalCancelarParcela.parcela}
          onConfirm={handleConfirmarCancelarParcela}
          onClose={() => setModalCancelarParcela(null)}
          loading={cancelandoParcela}
          formatData={formataData}
          formatValor={formataValor}
        />
      )}
      {modalCancelarParcela && modalCancelarParcela.type === 'multiple' && (
        <ModalCancelarParcelasMultiplas
          quantidade={modalCancelarParcela.ids.length}
          onConfirm={handleConfirmarCancelarParcela}
          onClose={() => setModalCancelarParcela(null)}
          loading={cancelandoParcela}
        />
      )}
      {modalRecibo && (
        <ModalRecibo ordemId={modalRecibo} onClose={() => setModalRecibo(null)} />
      )}
      {modalBaixaManual && (
        <ModalBaixaManual
          parcela={modalBaixaManual.parcela}
          numeroParcela={modalBaixaManual.parcela?.numero_parcela}
          alunoNome={modalBaixaManual.carne?.aluno_nome}
          onConfirm={handleBaixarManual}
          onClose={() => setModalBaixaManual(null)}
          loading={baixandoParcela}
        />
      )}
      {modalWhatsapp && (
        <ModalWhatsapp
          data={modalWhatsapp}
          onConfirm={async (editedText) => {
            try {
              await fetch(`/api/admin-financeiro/parcelas/${modalWhatsapp.id}/log-whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telefone: modalWhatsapp.responsavel_telefone })
              });
            } catch (err) {
              console.error('Falha ao registrar log de auditoria:', err);
            }
            const url = `https://wa.me/${modalWhatsapp.responsavel_telefone}?text=${encodeURIComponent(editedText)}`;
            window.open(url, '_blank');
            setModalWhatsapp(null);
          }}
          onClose={() => setModalWhatsapp(null)}
        />
      )}
    </AdminFinanceiroLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de Confirmação
// ─────────────────────────────────────────────────────────────────────────────
function ModalConfirmar({ titulo, mensagem, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-bold text-gray-800">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">{mensagem}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recibo HTML (para impressão)
// ─────────────────────────────────────────────────────────────────────────────
function gerarHTMLRecibo(dados) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const valorFmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
  const numero = dados.boleto_numero || dados.ordem_id?.slice(-8).toUpperCase() || '';

  const MAPA_METODOS = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
    transferencia: 'Transferência',
    boleto: 'Boleto'
  };

  const isMultiplo = dados.metodo_pagamento === 'multiplo' && Array.isArray(dados.detalhes_baixa_multipla) && dados.detalhes_baixa_multipla.length > 1;

  let formaPagamentoHTML = '';
  if (isMultiplo) {
    const listItems = dados.detalhes_baixa_multipla.map(item => {
      const label = MAPA_METODOS[String(item.metodo).toLowerCase()] || String(item.metodo).toUpperCase();
      const valor = valorFmt(item.valor);
      return `<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-family:monospace; font-size:12px;"><span>${label.padEnd(20, '.')}</span> <span>${valor}</span></div>`;
    }).join('');

    formaPagamentoHTML = `
      <div style="margin-top:16px; border-top:1px dashed #ccc; padding-top:10px; max-width:280px; margin-left:auto; margin-right:auto; text-align:left;">
        <label style="font-size:10px; font-weight:bold; text-transform:uppercase; color:#888; display:block; margin-bottom:6px;">Forma de pagamento:</label>
        ${listItems}
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:12px; margin-top:8px; border-top:1px solid #eee; padding-top:4px;">
          <span>Total pago</span>
          <span>${valorFmt(dados.valor)}</span>
        </div>
      </div>
    `;
  } else {
    const labelMetodo = MAPA_METODOS[String(dados.metodo_pagamento || '').toLowerCase()] || String(dados.metodo_pagamento || 'PIX').toUpperCase();
    formaPagamentoHTML = `<div style="margin-top:10px; font-size:12px; color:#333; text-align:center;"><strong>Forma de pagamento:</strong> ${labelMetodo}</div>`;
  }

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;padding:40px;font-size:13px;color:#222}
  .header{text-align:center;border-bottom:2px solid #1a5c3a;padding-bottom:14px;margin-bottom:18px}
  .header img{max-height:75px;max-width:180px;object-fit:contain;margin-bottom:8px}
  .header h1{font-size:20px;font-weight:bold;color:#1a5c3a}
  .header p{font-size:11px;color:#555;margin-top:3px}
  h2{text-align:center;font-size:15px;letter-spacing:3px;text-transform:uppercase;margin-bottom:18px;color:#333}
  .numero{text-align:right;font-size:11px;color:#888;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;margin-bottom:20px}
  .item label{font-size:10px;font-weight:bold;text-transform:uppercase;color:#888;display:block}
  .item span{font-size:13px}
  .full{grid-column:1/-1}
  .valor-box{border:2px solid #1a5c3a;border-radius:6px;padding:18px;text-align:center;margin:18px 0;background:#f0faf5}
  .valor-box label{font-size:11px;text-transform:uppercase;color:#555;display:block;margin-bottom:4px}
  .valor-box span{font-size:30px;font-weight:bold;color:#1a5c3a}
  .footer{margin-top:48px;text-align:center}
  .assinatura{display:inline-block;border-top:1px solid #333;margin-top:56px;padding-top:4px;min-width:240px;font-size:11px;color:#555}
  .rodape{font-size:10px;color:#bbb;margin-top:20px}
  @media print{body{padding:20px}}
</style></head><body>
<div class="header">
  ${dados.instituicao.logo ? `<img src="${dados.instituicao.logo}" alt="Logo" />` : ''}
  <h1>${dados.instituicao.nome}</h1>
  ${dados.instituicao.cnpj ? `<p>CNPJ: ${dados.instituicao.cnpj}</p>` : ''}
  ${dados.instituicao.endereco ? `<p>${dados.instituicao.endereco}${dados.instituicao.cidade ? `, ${dados.instituicao.cidade}` : ''}${dados.instituicao.estado ? `/${dados.instituicao.estado}` : ''}</p>` : ''}
  ${dados.instituicao.telefone ? `<p>Tel: ${dados.instituicao.telefone}</p>` : ''}
</div>
<h2>Recibo de Pagamento</h2>
<div class="numero">${numero ? `Nº ${numero} &nbsp;|&nbsp;` : ''}Emitido em: ${hoje}</div>
<div class="grid">
  <div class="item"><label>Aluno</label><span>${dados.aluno.nome}</span></div>
  <div class="item"><label>CPF</label><span>${dados.aluno.cpf}</span></div>
  <div class="item"><label>Curso</label><span>${dados.curso.nome}</span></div>
  <div class="item"><label>Turma</label><span>${dados.turma.nome}</span></div>
  <div class="item full"><label>Descrição</label><span>${dados.descricao}</span></div>
  <div class="item"><label>Período</label><span>${dados.referencia || 'Período Único'}</span></div>
  <div class="item"><label>Vencimento</label><span>${fmtData(dados.data_vencimento)}</span></div>
</div>
<div class="valor-box">
  <label>Valor Pago</label>
  <span>${valorFmt(dados.valor)}</span>
  ${formaPagamentoHTML}
</div>
<div class="footer">
  <div class="assinatura">${dados.instituicao.nome}<br>Responsável pela Instituição</div>
  <p class="rodape">Recibo gerado em ${hoje} &nbsp;|&nbsp; Sistema Creeser Educacional</p>
</div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Recibo
// ─────────────────────────────────────────────────────────────────────────────
function ModalRecibo({ ordemId, onClose }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const targetOrdemId = typeof ordemId === 'object' && ordemId !== null ? ordemId.id : ordemId;
  const targetParcelaId = typeof ordemId === 'object' && ordemId !== null ? ordemId.parcelaId : null;

  useEffect(() => {
    if (!targetOrdemId) return;
    const url = targetParcelaId
      ? `/api/admin-financeiro/recibo/${targetOrdemId}?parcelaId=${targetParcelaId}`
      : `/api/admin-financeiro/recibo/${targetOrdemId}`;

    fetch(url)
      .then(r => r.ok ? r.json() : r.json().then(b => { throw new Error(b.message); }))
      .then(d => { setDados(d); setLoading(false); })
      .catch(e => { setErro(e.message); setLoading(false); });
  }, [targetOrdemId, targetParcelaId]);

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=820,height=700');
    w.document.write(gerarHTMLRecibo(dados));
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  const fmtValor = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-emerald-700">Recibo de Pagamento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">Carregando dados...</div>
        ) : erro ? (
          <div className="px-6 py-10 text-center text-red-500 text-sm">{erro}</div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-3">
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50 space-y-3">
                <div className="text-center border-b border-emerald-200 pb-3">
                  {dados.instituicao.logo && (
                    <img src={dados.instituicao.logo} alt="Logo" className="h-12 w-auto object-contain mx-auto mb-2" />
                  )}
                  <p className="font-bold text-emerald-800">{dados.instituicao.nome}</p>
                  {dados.instituicao.cnpj && <p className="text-xs text-gray-500">CNPJ: {dados.instituicao.cnpj}</p>}
                  {dados.instituicao.cidade && (
                    <p className="text-xs text-gray-500">
                      {dados.instituicao.cidade}{dados.instituicao.estado ? `/${dados.instituicao.estado}` : ''}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><span className="font-semibold text-gray-500">Aluno:</span> <span className="text-gray-800">{dados.aluno.nome}</span></div>
                  <div><span className="font-semibold text-gray-500">CPF:</span> <span className="text-gray-800">{dados.aluno.cpf}</span></div>
                  <div><span className="font-semibold text-gray-500">Curso:</span> <span className="text-gray-800">{dados.curso.nome}</span></div>
                  <div><span className="font-semibold text-gray-500">Turma:</span> <span className="text-gray-800">{dados.turma.nome}</span></div>
                  <div className="col-span-2"><span className="font-semibold text-gray-500">Descrição:</span> <span className="text-gray-800">{dados.descricao}</span></div>
                  <div><span className="font-semibold text-gray-500">Período:</span> <span className="text-gray-800">{dados.referencia || 'Período Único'}</span></div>
                  <div><span className="font-semibold text-gray-500">Vencimento:</span> <span className="text-gray-800">{fmtData(dados.data_vencimento)}</span></div>
                </div>
                <div className="text-center pt-2 border-t border-emerald-200">
                  <p className="text-xs text-gray-500 mb-1">Valor pago</p>
                  <p className="text-2xl font-bold text-emerald-700">{fmtValor(dados.valor)}</p>
                  
                  {dados.metodo_pagamento === 'multiplo' && Array.isArray(dados.detalhes_baixa_multipla) && dados.detalhes_baixa_multipla.length > 1 ? (
                    <div className="mt-3 border-t border-emerald-200/50 pt-2 text-left text-xs space-y-1 text-gray-700 max-w-[280px] mx-auto font-sans">
                      <p className="font-bold text-gray-500 uppercase tracking-wide text-[9px] mb-1">Forma de pagamento:</p>
                      {dados.detalhes_baixa_multipla.map((item, idx) => {
                        const MAPA_METODOS = {
                          pix: 'PIX',
                          dinheiro: 'Dinheiro',
                          cartao: 'Cartão',
                          transferencia: 'Transferência',
                          boleto: 'Boleto'
                        };
                        const label = MAPA_METODOS[String(item.metodo).toLowerCase()] || String(item.metodo).toUpperCase();
                        return (
                          <div key={idx} className="flex justify-between font-mono">
                            <span>{label.padEnd(20, '.')}</span>
                            <span>{fmtValor(item.valor)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                        <span>Total pago</span>
                        <span>{fmtValor(dados.valor)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-center text-xs text-gray-650">
                      <strong>Forma de pagamento:</strong> {
                        (() => {
                          const MAPA_METODOS = {
                            pix: 'PIX',
                            dinheiro: 'Dinheiro',
                            cartao: 'Cartão',
                            transferencia: 'Transferência',
                            boleto: 'Boleto'
                          };
                          return MAPA_METODOS[String(dados.metodo_pagamento || '').toLowerCase()] || String(dados.metodo_pagamento || 'PIX').toUpperCase();
                        })()
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
                Fechar
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir Recibo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModalCancelarParcela({ carne, parcela, onConfirm, onClose, loading, formatData, formatValor }) {
  const [observacao, setObservacao] = useState('');
  const isValid = observacao.trim().length >= 10 && observacao.trim().length <= 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Cancelar Parcela</h3>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-5 space-y-4 text-left">
          <p className="text-sm text-gray-650">Tem certeza que deseja cancelar esta parcela?</p>
          
          <div className="bg-gray-50 border border-gray-150 rounded-lg p-3 text-sm space-y-1 text-gray-700">
            <div><span className="font-semibold text-gray-900">Parcela:</span> #{parcela.numero_parcela}</div>
            <div><span className="font-semibold text-gray-900">Vencimento:</span> {formatData(parcela.data_vencimento)}</div>
            <div><span className="font-semibold text-gray-900">Valor:</span> {formatValor(parcela.valor)}</div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Observação *</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={loading}
              placeholder="Informe o motivo do cancelamento..."
              rows={4}
              maxLength={500}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-400 focus:outline-none transition disabled:bg-gray-50 text-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Mínimo 10 caracteres</span>
              <span className={observacao.trim().length >= 10 ? 'text-green-600 font-semibold' : 'text-red-500'}>
                {observacao.length} / 500
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-650 border border-gray-300 rounded-lg hover:bg-gray-150/60 bg-white transition disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={() => onConfirm(observacao)}
            disabled={!isValid || loading}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-350 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳ Processando...' : 'Confirmar Cancelamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCancelarParcelasMultiplas({ quantidade, onConfirm, onClose, loading }) {
  const [observacao, setObservacao] = useState('');
  const isValid = observacao.trim().length >= 10 && observacao.trim().length <= 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Cancelar Parcelas</h3>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-5 space-y-4 text-left">
          <p className="text-sm text-gray-650">Tem certeza que deseja cancelar estas parcelas?</p>
          
          <div className="bg-gray-50 border border-gray-150 rounded-lg p-3 text-sm space-y-1 text-gray-700">
            <div><span className="font-semibold text-gray-900">Quantidade de Parcelas:</span> {quantidade}</div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Observação *</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={loading}
              placeholder="Informe o motivo do cancelamento..."
              rows={4}
              maxLength={500}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-400 focus:outline-none transition disabled:bg-gray-50 text-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Mínimo 10 caracteres</span>
              <span className={observacao.trim().length >= 10 ? 'text-green-600 font-semibold' : 'text-red-500'}>
                {observacao.length} / 500
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-650 border border-gray-300 rounded-lg hover:bg-gray-150/60 bg-white transition disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={() => onConfirm(observacao)}
            disabled={!isValid || loading}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-350 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳ Processando...' : 'Confirmar Cancelamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Whatsapp
function ModalWhatsapp({ data, onConfirm, onClose }) {
  const [text, setText] = useState(data.mensagemPadrao || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            💬 Enviar 2ª Via por WhatsApp
          </h3>
          <div className="mt-3 text-xs bg-white bg-opacity-15 p-3 rounded-lg flex flex-col gap-1 text-emerald-50">
            <div><span className="font-semibold">Aluno:</span> {data.aluno_nome}</div>
            <div className="flex justify-between">
              <div><span className="font-semibold">Parcela:</span> #{data.numero_parcela}</div>
              <div><span className="font-semibold">Valor:</span> {data.valorFormatado}</div>
              <div><span className="font-semibold">Vencimento:</span> {data.dataFormatada}</div>
            </div>
          </div>
        </div>

        {/* Corpo / Edição */}
        <div className="p-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Mensagem a ser enviada:
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none font-sans"
            placeholder="Digite a mensagem..."
          />
        </div>

        {/* Rodapé / Ações */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-100 transition text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(text)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-semibold shadow-sm hover:shadow flex items-center gap-1.5"
          >
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
