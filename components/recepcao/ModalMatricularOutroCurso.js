import { useState, useEffect } from 'react';

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1';

export default function ModalMatricularOutroCurso({ isOpen, onClose, aluno, onSuccess }) {
  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [cursoId, setCursoId] = useState('');

  const [turmas, setTurmas] = useState([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [turmaId, setTurmaId] = useState('');

  const [anosLetivos, setAnosLetivos] = useState([]);
  const [loadingAnos, setLoadingAnos] = useState(false);
  const [anoLetivo, setAnoLetivo] = useState(String(new Date().getFullYear()));
  const [semestre, setSemestre] = useState('1');

  const [planoFinanceiro, setPlanoFinanceiro] = useState('');
  const [valorMensalidade, setValorMensalidade] = useState('');
  const [observacao, setObservacao] = useState('');

  // Tratamento de débitos operacionais
  const [alertaDebitos, setAlertaDebitos] = useState(null);
  const [justificativaDebito, setJustificativaDebito] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // 1. Carregar cursos e anos letivos ao abrir modal
  useEffect(() => {
    if (!isOpen) return;

    // Reset de estados
    setCursoId('');
    setTurmaId('');
    setTurmas([]);
    setPlanoFinanceiro('');
    setValorMensalidade('');
    setObservacao('');
    setAlertaDebitos(null);
    setJustificativaDebito('');
    setFeedback(null);
    setAnoLetivo(String(new Date().getFullYear()));
    setSemestre('1');

    carregarCursosEAnos();
  }, [isOpen]);

  const carregarCursosEAnos = async () => {
    setLoadingCursos(true);
    setLoadingAnos(true);

    try {
      const [resCursos, resAnos] = await Promise.all([
        fetch('/api/comercial/cursos', { credentials: 'include' }),
        fetch('/api/configuracoes/anos-letivos', { credentials: 'include' }).catch(() => null),
      ]);

      if (resCursos && resCursos.ok) {
        const data = await resCursos.json();
        setCursos(Array.isArray(data) ? data : []);
      }

      if (resAnos && resAnos.ok) {
        const data = await resAnos.json();
        const anosLista = Array.isArray(data)
          ? data.map((item) => Number.parseInt(item.nome || item.ano, 10)).filter((n) => !Number.isNaN(n))
          : [];
        const anosUnicos = [...new Set(anosLista)].sort((a, b) => a - b);
        if (anosUnicos.length > 0) {
          setAnosLetivos(anosUnicos);
          const anoAtual = new Date().getFullYear();
          if (anosUnicos.includes(anoAtual)) {
            setAnoLetivo(String(anoAtual));
          } else {
            setAnoLetivo(String(anosUnicos[anosUnicos.length - 1]));
          }
        } else {
          setAnosLetivos([new Date().getFullYear(), new Date().getFullYear() + 1]);
        }
      } else {
        setAnosLetivos([new Date().getFullYear(), new Date().getFullYear() + 1]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
    } finally {
      setLoadingCursos(false);
      setLoadingAnos(false);
    }
  };

  // 2. Carregar turmas quando o curso for selecionado
  useEffect(() => {
    if (!cursoId) {
      setTurmas([]);
      setTurmaId('');
      return;
    }

    const carregarTurmasDoCurso = async () => {
      setLoadingTurmas(true);
      setTurmaId('');
      try {
        const res = await fetch(`/api/comercial/turmas?cursoid=${cursoId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setTurmas(Array.isArray(data) ? data : []);
        } else {
          setTurmas([]);
        }
      } catch (err) {
        console.error('Erro ao buscar turmas:', err);
        setTurmas([]);
      } finally {
        setLoadingTurmas(false);
      }
    };

    carregarTurmasDoCurso();
  }, [cursoId]);

  // Ao selecionar uma turma, sugerir mensalidade caso a turma possua
  const handleTurmaChange = (tId) => {
    setTurmaId(tId);
    const turmaObj = turmas.find((t) => String(t.id) === String(tId));
    if (turmaObj && turmaObj.mensalidade) {
      setValorMensalidade(String(turmaObj.mensalidade));
    }
  };

  const handleSubmeter = async (e) => {
    if (e) e.preventDefault();
    if (!turmaId) {
      setFeedback({ type: 'error', message: 'Por favor, selecione uma turma.' });
      return;
    }
    if (!anoLetivo) {
      setFeedback({ type: 'error', message: 'Por favor, selecione o ano letivo.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const isConfirmandoDebito = Boolean(alertaDebitos);
    let obsPayload = observacao ? observacao.trim() : '';

    if (isConfirmandoDebito) {
      if (!justificativaDebito.trim()) {
        setSubmitting(false);
        setFeedback({
          type: 'error',
          message: 'É obrigatório informar uma justificativa para matricular aluno com débitos em aberto.',
        });
        return;
      }
      obsPayload = justificativaDebito.trim();
    }

    const payload = {
      turma_id: Number(turmaId),
      ano_letivo: Number(anoLetivo),
      semestre: String(semestre || '1'),
      plano_financeiro: planoFinanceiro || null,
      valor_mensalidade: valorMensalidade ? Number(valorMensalidade) : null,
      observacao: obsPayload || null,
      confirmar_debito: isConfirmandoDebito,
    };

    try {
      const res = await fetch(`/api/alunos/${aluno.id}/nova-matricula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.message || data.error || 'Erro ao processar matrícula em novo curso.',
        });
        return;
      }

      // Se a API detectar débitos e exigir confirmação
      if (data.requer_confirmacao_debito) {
        setAlertaDebitos(data);
        return;
      }

      // Sucesso
      setAlertaDebitos(null);
      setFeedback({
        type: 'success',
        message: `✅ Matrícula em novo curso realizada com sucesso para ${aluno.nome}!`,
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erro de requisição:', err);
      setFeedback({ type: 'error', message: 'Erro de comunicação com o servidor.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !aluno) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">

        {/* ── Topo do Modal ────────────────────────────────────────── */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-blue-800 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>➕</span> Matricular em Outro Curso
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Aluno: <strong className="text-white">{aluno.nome}</strong> (CPF: {aluno.cpf || '—'})
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition disabled:opacity-50"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* ── Mensagem de Feedback ─────────────────────────────────── */}
        {feedback && (
          <div
            className={`px-5 py-3 text-xs font-semibold border-b ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* ── Conteúdo / Formulário ────────────────────────────────── */}
        <form onSubmit={handleSubmeter} className="p-5 overflow-y-auto flex-1 space-y-4">

          {/* ALERTA DE DÉBITOS FINANCEIROS */}
          {alertaDebitos && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase">
                    Atenção: Débitos Financeiros em Aberto
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    O aluno possui <strong>{alertaDebitos.quantidade_parcelas} parcela(s)</strong> em aberto totalizando{' '}
                    <strong className="text-amber-900">
                      R$ {Number(alertaDebitos.valor_total_em_aberto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Justificativa / Motivo da Liberação *
                </label>
                <textarea
                  required
                  rows={2}
                  value={justificativaDebito}
                  onChange={(e) => setJustificativaDebito(e.target.value)}
                  placeholder="Ex.: Acordo financeiro em andamento / Autorizado pela diretoria…"
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </div>
            </div>
          )}

          {/* 1. SELEÇÃO DE CURSO */}
          <div>
            <label className={labelCls}>
              1. Selecione o Novo Curso *
              {loadingCursos && <span className="ml-1 text-gray-400 normal-case font-normal">(carregando…)</span>}
            </label>
            <select
              required
              disabled={loadingCursos || submitting || !!alertaDebitos}
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className={inputCls}
            >
              <option value="">— Selecione o curso de destino —</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.nivelensino ? `(${c.nivelensino})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. SELEÇÃO DE TURMA */}
          {cursoId && (
            <div>
              <label className={labelCls}>
                2. Selecione a Turma *
                {loadingTurmas && <span className="ml-1 text-gray-400 normal-case font-normal">(carregando…)</span>}
                {!loadingTurmas && turmas.length === 0 && (
                  <span className="ml-1 text-amber-600 normal-case font-normal">(nenhuma turma ativa encontrada)</span>
                )}
              </label>
              <select
                required
                disabled={loadingTurmas || turmas.length === 0 || submitting || !!alertaDebitos}
                value={turmaId}
                onChange={(e) => handleTurmaChange(e.target.value)}
                className={inputCls}
              >
                <option value="">— Selecione a turma —</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} {t.turno ? `— ${t.turno}` : ''} {t.matricula ? `(Matrícula: R$ ${t.matricula})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. ANO LETIVO E SEMESTRE */}
          {turmaId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className={labelCls}>Ano Letivo *</label>
                <select
                  required
                  disabled={loadingAnos || submitting || !!alertaDebitos}
                  value={anoLetivo}
                  onChange={(e) => setAnoLetivo(e.target.value)}
                  className={inputCls}
                >
                  {anosLetivos.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Semestre / Período</label>
                <select
                  disabled={submitting || !!alertaDebitos}
                  value={semestre}
                  onChange={(e) => setSemestre(e.target.value)}
                  className={inputCls}
                >
                  <option value="1">1º Semestre</option>
                  <option value="2">2º Semestre</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </div>
            </div>
          )}

          {/* 4. CONDIÇÕES FINANCEIRAS */}
          {turmaId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className={labelCls}>Plano Financeiro</label>
                <input
                  type="text"
                  disabled={submitting || !!alertaDebitos}
                  value={planoFinanceiro}
                  onChange={(e) => setPlanoFinanceiro(e.target.value)}
                  placeholder="Ex: Padrão, Boleto Bancário…"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Valor Mensalidade (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={submitting || !!alertaDebitos}
                  value={valorMensalidade}
                  onChange={(e) => setValorMensalidade(e.target.value)}
                  placeholder="0,00"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* 5. OBSERVAÇÃO ADICIONAL */}
          {turmaId && !alertaDebitos && (
            <div>
              <label className={labelCls}>Observações da Matrícula (Opcional)</label>
              <textarea
                rows={2}
                disabled={submitting}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações administrativas ou comerciais adicionais…"
                className={inputCls + ' resize-none'}
              />
            </div>
          )}

          {/* ── Botões de Ação ─────────────────────────────────────── */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              Cancelar
            </button>

            {alertaDebitos ? (
              <button
                type="button"
                onClick={handleSubmeter}
                disabled={submitting || !justificativaDebito.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Confirmando com Débitos…' : '⚠️ Confirmar Matrícula com Débito'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !cursoId || !turmaId}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Processando Matrícula…' : '✅ Confirmar Nova Matrícula'}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
