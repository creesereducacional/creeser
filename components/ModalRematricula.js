import { useState, useEffect } from 'react';

export default function ModalRematricula({ isOpen, onClose, aluno, onSuccess }) {
  const [novoAnoLetivo, setNovoAnoLetivo] = useState('');
  const [novoSemestre, setNovoSemestre] = useState('1');
  const [novaTurmaId, setNovaTurmaId] = useState('');
  const [planoFinanceiro, setPlanoFinanceiro] = useState('');
  const [valorMensalidade, setValorMensalidade] = useState('');
  const [observacao, setObservacao] = useState('');

  // Estado de confirmação financeira
  const [alertaDebitos, setAlertaDebitos] = useState(null);
  const [justificativaDebito, setJustificativaDebito] = useState('');

  const [turmas, setTurmas] = useState([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!isOpen || !aluno) return;

    // Sugestão automática do próximo período sequencial:
    // 2026/1 -> 2026/2
    // 2026/2 -> 2027/1
    const anoAtualVal = Number(aluno.anoLetivo || aluno.ano_letivo || aluno.ano || new Date().getFullYear());
    const semestreAtualVal = String(aluno.semestre || '1').trim();

    let sugAno = anoAtualVal;
    let sugSem = '2';

    if (semestreAtualVal === '2' || semestreAtualVal === '2º' || semestreAtualVal === '2º Semestre') {
      sugAno = anoAtualVal + 1;
      sugSem = '1';
    }

    setNovoAnoLetivo(sugAno.toString());
    setNovoSemestre(sugSem);
    setNovaTurmaId('');
    setPlanoFinanceiro('');
    setValorMensalidade('');
    setObservacao('');
    setAlertaDebitos(null);
    setJustificativaDebito('');
    setFeedback(null);

    carregarTurmas();
  }, [isOpen, aluno]);

  const carregarTurmas = async () => {
    setLoadingTurmas(true);
    try {
      const res = await fetch('/api/turmas');
      if (res.ok) {
        const data = await res.json();
        setTurmas(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    } finally {
      setLoadingTurmas(false);
    }
  };

  if (!isOpen || !aluno) return null;

  const traduzirErroTecnico = (msg) => {
    if (!msg) return 'Ocorreu um erro inesperado ao processar a rematrícula.';
    const low = msg.toLowerCase();
    if (low.includes('já possui uma matrícula') || low.includes('ja possui uma matricula')) {
      return `O aluno ${aluno.nome || ''} já possui uma matrícula cadastrada para o período informado.`;
    }
    if (low.includes('não pode ser inferior') || low.includes('mesmo período') || low.includes('não pode ser anterior') || low.includes('estritamente posterior')) {
      return msg; // Retorna mensagem de regra de período explicativa
    }
    if (low.includes('não foi encontrada') || low.includes('nao foi encontrada')) {
      return 'Matrícula de origem ativa não encontrada para realizar a renovação.';
    }
    if (low.includes('permissão') || low.includes('acesso negado')) {
      return 'Você não possui permissão para rematricular alunos nesta instituição.';
    }
    return msg;
  };

  const executarRequisicaoRematricula = async (confirmarDebitoFlag = false) => {
    if (submitting) return; // Proteção contra duplo envio
    setSubmitting(true);
    setFeedback(null);

    try {
      const obsFinal = confirmarDebitoFlag
        ? justificativaDebito.trim()
        : observacao.trim();

      const bodyPayload = {
        novo_ano_letivo: Number(novoAnoLetivo),
        novo_semestre: novoSemestre || '1',
        nova_turma_id: novaTurmaId ? Number(novaTurmaId) : null,
        plano_financeiro: planoFinanceiro || null,
        valor_mensalidade: valorMensalidade !== '' && valorMensalidade !== null ? Number(valorMensalidade) : null,
        observacao: obsFinal || null,
        confirmar_debito: confirmarDebitoFlag,
      };

      const res = await fetch(`/api/alunos/${aluno.id}/rematricula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao processar a rematrícula.');
      }

      // Interceptação de Débitos Financeiros (Etapa de Alerta)
      if (data.requer_confirmacao_debito) {
        setAlertaDebitos(data);
        return;
      }

      // Sucesso real da RPC
      setAlertaDebitos(null);
      setFeedback({
        type: 'success',
        message: `✅ Rematrícula de ${aluno.nome} realizada com sucesso para o período ${novoAnoLetivo}/${novoSemestre}!`,
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1600);
    } catch (err) {
      setFeedback({ type: 'error', message: traduzirErroTecnico(err.message) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!novoAnoLetivo) {
      setFeedback({ type: 'error', message: 'Por favor, informe o Novo Ano Letivo.' });
      return;
    }
    executarRequisicaoRematricula(false);
  };

  const handleConfirmarComDebitos = () => {
    if (!justificativaDebito.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, preencha a justificativa para autorizar a rematrícula com débitos.' });
      return;
    }
    executarRequisicaoRematricula(true);
  };

  const handleCancelarDebitos = () => {
    setAlertaDebitos(null);
    setJustificativaDebito('');
    setFeedback(null);
  };

  // Contexto visual do aluno
  const cursoNome = aluno.curso || aluno.curso_nome || aluno.nome_curso || null;
  const turmaNome = aluno.turma || aluno.turma_nome || null;
  const anoAtual = aluno.anoLetivo || aluno.ano_letivo || aluno.ano || new Date().getFullYear();
  const semestreAtual = aluno.semestre || '1';
  const matriculaNum = aluno.matricula || aluno.numero_id || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 transform transition-all max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho Visual */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-teal-100 flex-shrink-0">
            🔄
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Rematrícula Individual
            </h3>
            <p className="text-xs text-slate-500">
              Renovação transacional de matrícula para o novo período escolar
            </p>
          </div>
        </div>

        {/* Bloco de Contexto do Aluno Selecionado */}
        <div className="p-4 bg-gradient-to-r from-teal-50/60 to-slate-50 border border-teal-100 rounded-xl mb-4 text-xs space-y-1.5 shadow-sm">
          <div className="flex justify-between items-center pb-1.5 border-b border-teal-100/60">
            <span className="font-semibold text-teal-800 uppercase tracking-wider">Aluno Selecionado</span>
            <span className="font-extrabold text-slate-800 text-sm">{aluno.nome}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
            {matriculaNum && (
              <div>
                <span className="font-medium text-slate-400 block text-[10px] uppercase">Matrícula</span>
                <span className="font-semibold text-slate-700">{matriculaNum}</span>
              </div>
            )}
            {cursoNome && (
              <div>
                <span className="font-medium text-slate-400 block text-[10px] uppercase">Curso</span>
                <span className="font-semibold text-slate-700">{cursoNome}</span>
              </div>
            )}
            {turmaNome && (
              <div>
                <span className="font-medium text-slate-400 block text-[10px] uppercase">Turma Atual</span>
                <span className="font-semibold text-slate-700">{turmaNome}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-slate-400 block text-[10px] uppercase">Período Atual</span>
              <span className="font-bold text-teal-700">{anoAtual}/{semestreAtual}</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert Global */}
        {feedback && (
          <div
            className={`p-3 text-xs rounded-xl mb-4 font-medium shadow-sm transition-all flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <span>{feedback.message}</span>
          </div>
        )}

        {/* ETAPA INTERCEPTADA: ALERTA E CONFIRMAÇÃO DE DÉBITOS FINANCEIROS */}
        {alertaDebitos ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm border-b border-amber-200/80 pb-2">
                <span className="text-xl">⚠️</span>
                <h4>Aluno possui débitos financeiros</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                  <span className="text-slate-500 text-[10px] uppercase block font-semibold">Parcelas em Aberto</span>
                  <span className="text-sm font-bold text-amber-900">{alertaDebitos.quantidade_parcelas} parcela(s)</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                  <span className="text-slate-500 text-[10px] uppercase block font-semibold">Valor Total em Aberto</span>
                  <span className="text-sm font-bold text-amber-900">
                    R$ {Number(alertaDebitos.valor_total_em_aberto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Tabela Resumida de Parcelas */}
              {Array.isArray(alertaDebitos.parcelas) && alertaDebitos.parcelas.length > 0 && (
                <div className="max-h-36 overflow-y-auto border border-amber-200 rounded-lg bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-amber-100/60 text-amber-900 font-bold sticky top-0">
                      <tr>
                        <th className="p-1.5">Parcela</th>
                        <th className="p-1.5">Vencimento</th>
                        <th className="p-1.5">Valor</th>
                        <th className="p-1.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 text-slate-700">
                      {alertaDebitos.parcelas.map((p) => (
                        <tr key={p.id}>
                          <td className="p-1.5 font-semibold">#{p.numero_parcela}</td>
                          <td className="p-1.5">{p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString('pt-BR') : '—'}</td>
                          <td className="p-1.5 font-bold">R$ {Number(p.valor || 0).toFixed(2)}</td>
                          <td className="p-1.5 uppercase font-semibold text-[10px]">
                            <span className={p.status === 'vencido' ? 'text-red-600' : 'text-amber-600'}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-xs text-amber-800 leading-relaxed font-medium pt-1">
                Existem débitos financeiros vinculados a este aluno. A rematrícula pode ser cancelada ou autorizada mediante justificativa obrigatoriamente preenchida.
              </p>

              {/* Campo Justificativa Obrigatório */}
              <div>
                <label className="text-xs font-bold text-amber-900 mb-1 block">
                  Justificativa / Autorização do Operador <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={justificativaDebito}
                  onChange={(e) => setJustificativaDebito(e.target.value)}
                  placeholder="Informe o motivo da liberação com pendência financeira..."
                  className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800 resize-none"
                />
              </div>
            </div>

            {/* Ações da Etapa de Débitos */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelarDebitos}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar Rematrícula
              </button>
              <button
                type="button"
                onClick={handleConfirmarComDebitos}
                disabled={submitting || !justificativaDebito.trim()}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando Autorização...
                  </>
                ) : (
                  <>
                    <span>⚠️</span> Continuar com Débitos
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO PRINCIPAL DE REMATRÍCULA */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Mensagem Explicativa de Impacto */}
            <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
              <span className="text-base leading-none">ℹ️</span>
              <p className="leading-relaxed">
                Esta ação encerrará o ciclo atual ({anoAtual}/{semestreAtual}) e iniciará a rematrícula ativa para o período sequencial selecionado.
              </p>
            </div>

            {/* Seção 1: Dados Acadêmicos Principais */}
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
              <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">1. Dados do Novo Período</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Novo Ano Letivo * */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Novo Ano Letivo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2100"
                    value={novoAnoLetivo}
                    onChange={(e) => setNovoAnoLetivo(e.target.value)}
                    placeholder="Ex: 2026"
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                {/* Novo Semestre */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Novo Semestre
                  </label>
                  <select
                    value={novoSemestre}
                    onChange={(e) => setNovoSemestre(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="1">1º Semestre</option>
                    <option value="2">2º Semestre</option>
                  </select>
                </div>
              </div>

              {/* Nova Turma (opcional) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block flex items-center justify-between">
                  <span>Nova Turma</span>
                  <span className="text-[10px] font-normal text-slate-400">(opcional)</span>
                </label>
                <select
                  value={novaTurmaId}
                  onChange={(e) => setNovaTurmaId(e.target.value)}
                  disabled={loadingTurmas}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:opacity-50"
                >
                  <option value="">Manter turma atual / Definir posteriormente</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} {t.codigo ? `(${t.codigo})` : ''} {t.ano_letivo ? `- Ano ${t.ano_letivo}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seção 2: Condições Financeiras (Opcionais) */}
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>2. Condições Financeiras</span>
                <span className="text-[10px] font-normal text-slate-400 lowercase">(opcional)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plano Financeiro */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Plano Financeiro
                  </label>
                  <input
                    type="text"
                    value={planoFinanceiro}
                    onChange={(e) => setPlanoFinanceiro(e.target.value)}
                    placeholder="Ex: Anual 12x"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                {/* Valor da Mensalidade */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Valor da Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorMensalidade}
                    onChange={(e) => setValorMensalidade(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Observação (opcional) */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center justify-between">
                <span>Observações</span>
                <span className="text-[10px] font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Anotações internas sobre a rematrícula..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white resize-none"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <span>🔄</span> Confirmar Rematrícula
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
