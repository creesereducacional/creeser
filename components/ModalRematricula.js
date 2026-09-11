import { useState, useEffect } from 'react';

export default function ModalRematricula({ isOpen, onClose, aluno, onSuccess }) {
  // Modalidade da operação: 'TRANSFERENCIA' | 'REMATRICULA' | 'NOVO_CURSO'
  const [tipoModalidade, setTipoModalidade] = useState('TRANSFERENCIA');

  // Estado dos campos do formulário
  const [anosLetivosOptions, setAnosLetivosOptions] = useState([]);
  const [loadingAnos, setLoadingAnos] = useState(false);
  const [novoAnoLetivo, setNovoAnoLetivo] = useState('');
  const [novoSemestre, setNovoSemestre] = useState('1');

  // Checkbox e seleção de turma
  const [trocarTurma, setTrocarTurma] = useState(true);
  const [novaTurmaId, setNovaTurmaId] = useState('');
  const [turmasOptions, setTurmasOptions] = useState([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);

  // Condições financeiras e observação
  const [planoFinanceiro, setPlanoFinanceiro] = useState('');
  const [valorMensalidade, setValorMensalidade] = useState('');
  const [observacao, setObservacao] = useState('');

  // Estado de confirmação financeira de débitos
  const [alertaDebitos, setAlertaDebitos] = useState(null);
  const [justificativaDebito, setJustificativaDebito] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Modal / Drawer de Cadastro Rápido de Ano Letivo Inline
  const [modalNovoAno, setModalNovoAno] = useState({
    isOpen: false,
    ano: '',
    dataInicio: '',
    dataFim: '',
    loading: false,
    erro: ''
  });

  // Função para carregar os anos letivos
  const fetchAnosLetivos = async () => {
    setLoadingAnos(true);
    try {
      const res = await fetch('/api/configuracoes/anos-letivos');
      if (res.ok) {
        const data = await res.json();
        const listaAnos = Array.isArray(data)
          ? data
              .map((item) => Number.parseInt(item.nome || item.ano, 10))
              .filter((num) => !Number.isNaN(num))
          : [];

        const anosUnicos = [...new Set(listaAnos)].sort((a, b) => a - b);
        setAnosLetivosOptions(anosUnicos);
        return anosUnicos;
      }
    } catch (err) {
      console.error('Erro ao carregar anos letivos:', err);
    } finally {
      setLoadingAnos(false);
    }
    return [];
  };

  // EFETUA A BUSCA DE ANOS LETIVOS CADASTRADOS E VÁLIDOS (EXCLUSIVAMENTE DO BANCO)
  useEffect(() => {
    if (!isOpen) return;
    fetchAnosLetivos();
  }, [isOpen]);

  // Abre o sub-modal de cadastro rápido preenchendo o ano e datas padrão
  const handleAbrirCadastroAno = (anoAlvo) => {
    const anoStr = String(anoAlvo || novoAnoLetivo || new Date().getFullYear());
    setModalNovoAno({
      isOpen: true,
      ano: anoStr,
      dataInicio: `${anoStr}-01-01`,
      dataFim: `${anoStr}-12-31`,
      loading: false,
      erro: ''
    });
  };

  const handleFecharCadastroAno = () => {
    if (modalNovoAno.loading) return;
    setModalNovoAno((prev) => ({ ...prev, isOpen: false, erro: '' }));
  };

  const handleSalvarNovoAno = async (e) => {
    e?.preventDefault?.();
    if (!modalNovoAno.ano || !modalNovoAno.dataInicio || !modalNovoAno.dataFim) {
      setModalNovoAno((prev) => ({ ...prev, erro: 'Preencha o ano e as datas de início e fim.' }));
      return;
    }

    setModalNovoAno((prev) => ({ ...prev, loading: true, erro: '' }));
    try {
      const res = await fetch('/api/configuracoes/anos-letivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ano: Number.parseInt(modalNovoAno.ano, 10),
          dataInicio: modalNovoAno.dataInicio,
          dataFim: modalNovoAno.dataFim,
          observacoes: 'Cadastrado rapidamente pelo fluxo de rematrícula'
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData?.error || resData?.detail || 'Erro ao cadastrar ano letivo');
      }

      // Atualiza lista de anos e seleciona o recém-criado
      const listaAtualizada = await fetchAnosLetivos();
      const anoCriado = String(resData.nome || modalNovoAno.ano);
      setNovoAnoLetivo(anoCriado);
      setModalNovoAno({ isOpen: false, ano: '', dataInicio: '', dataFim: '', loading: false, erro: '' });
    } catch (err) {
      console.error('Erro ao salvar ano letivo inline:', err);
      setModalNovoAno((prev) => ({
        ...prev,
        loading: false,
        erro: err.message || 'Falha ao salvar ano letivo.'
      }));
    }
  };

  // DEFINE OS VALORES INICIAIS AO ABRIR O MODAL OU ALTERAR O ALUNO
  useEffect(() => {
    if (!isOpen || !aluno) return;

    setTipoModalidade('TRANSFERENCIA');

    const anoAtualVal = Number(aluno.anoLetivo || aluno.ano_letivo || aluno.ano || new Date().getFullYear());
    const semestreAtualVal = String(aluno.semestre || '1').trim();

    setNovoAnoLetivo(anoAtualVal.toString());
    setNovoSemestre(semestreAtualVal || '1');
    setTrocarTurma(true);
    setNovaTurmaId('');
    setPlanoFinanceiro('');
    setValorMensalidade('');
    setObservacao('');
    setAlertaDebitos(null);
    setJustificativaDebito('');
    setFeedback(null);
  }, [isOpen, aluno]);

  // REAJUSTA O PERÍODO QUANDO O USUÁRIO ALTERNA ENTRE AS MODALIDADES
  const handleTrocarModalidade = (novaModalidade) => {
    setTipoModalidade(novaModalidade);
    setNovaTurmaId('');
    setFeedback(null);
    setAlertaDebitos(null);

    const anoAtualVal = Number(aluno.anoLetivo || aluno.ano_letivo || aluno.ano || new Date().getFullYear());
    const semestreAtualVal = String(aluno.semestre || '1').trim();

    if (novaModalidade === 'TRANSFERENCIA') {
      // TRANSFERÊNCIA: Mesmo ano letivo e mesmo semestre (sem progressão acadêmica)
      setNovoAnoLetivo(anoAtualVal.toString());
      setNovoSemestre(semestreAtualVal || '1');
      setTrocarTurma(true);
    } else if (novaModalidade === 'REMATRICULA') {
      // REMATRÍCULA: Período sequencial estritamente posterior
      let sugAno = anoAtualVal;
      let sugSem = '2';
      if (semestreAtualVal === '2' || semestreAtualVal === '2º' || semestreAtualVal === '2º Semestre') {
        sugAno = anoAtualVal + 1;
        sugSem = '1';
      }
      setNovoAnoLetivo(sugAno.toString());
      setNovoSemestre(sugSem);
      setTrocarTurma(false);
    } else {
      // NOVO CURSO: Padrão ano letivo corrente e 1º semestre (editável pelo operador)
      setNovoAnoLetivo(new Date().getFullYear().toString());
      setNovoSemestre('1');
      setTrocarTurma(true);
    }
  };

  // RECARREGA AS TURMAS DINAMICAMENTE
  useEffect(() => {
    if (!isOpen || !aluno) return;

    // Se for rematrícula e não estiver trocando de turma, não precisa carregar opções
    if (tipoModalidade === 'REMATRICULA' && !trocarTurma) {
      setTurmasOptions([]);
      setNovaTurmaId('');
      return;
    }

    const carregarTurmas = async () => {
      setLoadingTurmas(true);
      try {
        const res = await fetch('/api/turmas');
        if (res.ok) {
          const data = await res.json();
          let lista = Array.isArray(data) ? data : [];

          // Filtrar apenas turmas com situação ATIVO
          lista = lista.filter((t) => !t.situacao || t.situacao === 'ATIVO');

          const alunoTurmaId = aluno.turma_id || aluno.turmaid || aluno.turmaId || null;
          const alunoCursoId = aluno.cursoid || aluno.curso_id || aluno.cursoId || null;

          if (tipoModalidade === 'TRANSFERENCIA') {
            // TRANSFERÊNCIA DE TURMA: Deve ser do MESMO curso e EXCLUIR a turma atual do aluno
            lista = lista.filter((t) => String(t.id) !== String(alunoTurmaId));
            if (alunoCursoId) {
              lista = lista.filter((t) => {
                const turmaCursoId = t.cursoid || t.curso_id || t.cursoId || null;
                return turmaCursoId && String(turmaCursoId) === String(alunoCursoId);
              });
            }
          } else if (tipoModalidade === 'REMATRICULA') {
            // REMATRÍCULA COM TROCA: Deve ser do MESMO curso e EXCLUIR a turma atual do aluno
            lista = lista.filter((t) => String(t.id) !== String(alunoTurmaId));
            if (alunoCursoId) {
              lista = lista.filter((t) => {
                const turmaCursoId = t.cursoid || t.curso_id || t.cursoId || null;
                return turmaCursoId && String(turmaCursoId) === String(alunoCursoId);
              });
            }
          } else {
            // NOVO CURSO: Deve listar turmas de OUTROS cursos (diferentes do curso atual do aluno)
            if (alunoCursoId) {
              lista = lista.filter((t) => {
                const turmaCursoId = t.cursoid || t.curso_id || t.cursoId || null;
                return turmaCursoId && String(turmaCursoId) !== String(alunoCursoId);
              });
            }
          }

          setTurmasOptions(lista);
        }
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      } finally {
        setLoadingTurmas(false);
      }
    };

    carregarTurmas();
  }, [isOpen, tipoModalidade, trocarTurma, aluno]);

  if (!isOpen || !aluno) return null;

  const traduzirErroTecnico = (msg) => {
    if (!msg) return 'Ocorreu um erro inesperado ao processar a operação.';
    const low = msg.toLowerCase();
    if (low.includes('já possui uma matrícula') || low.includes('ja possui uma matricula')) {
      return msg;
    }
    if (
      low.includes('não pode ser inferior') ||
      low.includes('mesmo período') ||
      low.includes('não pode ser anterior') ||
      low.includes('estritamente posterior')
    ) {
      return msg;
    }
    if (low.includes('não possui uma matrícula principal') || low.includes('nao possui uma matricula principal') || low.includes('não foi encontrada') || low.includes('nao foi encontrada')) {
      return `O aluno ${aluno.nome || ''} não possui uma matrícula ativa/principal registrada para realizar a renovação de período.`;
    }
    if (low.includes('permissão') || low.includes('acesso negado')) {
      return 'Você não possui permissão para realizar esta operação.';
    }
    return msg;
  };

  const executarRequisicao = async (confirmarDebitoFlag = false) => {
    if (submitting) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const obsFinal = confirmarDebitoFlag ? justificativaDebito.trim() : observacao.trim();

      if (tipoModalidade === 'TRANSFERENCIA') {
        // FLUXO TRANSFERÊNCIA DE TURMA (MESMO PERÍODO / MESMO CURSO)
        const bodyPayload = {
          matricula_id: aluno.matricula_id || aluno.matriculaId || null,
          turma_id: Number(novaTurmaId),
          observacao: obsFinal || null,
        };

        const res = await fetch(`/api/alunos/${aluno.id}/transferir`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || data.error || 'Erro ao processar a transferência de turma.');
        }

        setAlertaDebitos(null);
        setFeedback({
          type: 'success',
          message: `✅ Aluno ${aluno.nome} transferido com sucesso para a turma "${data.turma_nome || 'selecionada'}"!`,
        });
      } else if (tipoModalidade === 'REMATRICULA') {
        // FLUXO REMATRÍCULA SEQUENCIAL
        const bodyPayload = {
          novo_ano_letivo: Number(novoAnoLetivo),
          novo_semestre: novoSemestre || '1',
          nova_turma_id: trocarTurma && novaTurmaId ? Number(novaTurmaId) : null,
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

        if (data.requer_confirmacao_debito) {
          setAlertaDebitos(data);
          return;
        }

        setAlertaDebitos(null);
        setFeedback({
          type: 'success',
          message: `✅ Rematrícula de ${aluno.nome} realizada com sucesso para o período ${novoAnoLetivo}/${novoSemestre}!`,
        });
      } else {
        // FLUXO NOVO CURSO SIMULTÂNEO
        const bodyPayload = {
          turma_id: Number(novaTurmaId),
          ano_letivo: Number(novoAnoLetivo),
          semestre: novoSemestre || '1',
          plano_financeiro: planoFinanceiro || null,
          valor_mensalidade: valorMensalidade !== '' && valorMensalidade !== null ? Number(valorMensalidade) : null,
          observacao: obsFinal || null,
          confirmar_debito: confirmarDebitoFlag,
        };

        const res = await fetch(`/api/alunos/${aluno.id}/nova-matricula`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || data.error || 'Erro ao processar a nova matrícula.');
        }

        if (data.requer_confirmacao_debito) {
          setAlertaDebitos(data);
          return;
        }

        setAlertaDebitos(null);
        setFeedback({
          type: 'success',
          message: `✅ Nova matrícula em curso simultâneo para ${aluno.nome} criada com sucesso!`,
        });
      }

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

    if (tipoModalidade === 'TRANSFERENCIA') {
      if (!novaTurmaId) {
        setFeedback({ type: 'error', message: 'Por favor, selecione a nova turma de destino para a transferência.' });
        return;
      }
      executarRequisicao(false);
      return;
    }

    if (!novoAnoLetivo) {
      setFeedback({ type: 'error', message: 'Por favor, informe o Ano Letivo.' });
      return;
    }

    const anoNovoNum = Number(novoAnoLetivo);

    if (anosLetivosOptions.length > 0 && !anosLetivosOptions.includes(anoNovoNum)) {
      setFeedback({
        type: 'error',
        message: `O ano letivo ${novoAnoLetivo} ainda não está cadastrado no sistema. Acesse Configurações > Anos Letivos para cadastrá-lo antes de prosseguir.`,
      });
      return;
    }

    if (tipoModalidade === 'REMATRICULA') {
      // Validação de período sequencial posterior (Ano/Semestre)
      const semAtualNum = (semestreAtual === '2' || semestreAtual === '2º' || semestreAtual === '2º Semestre') ? 2 : 1;
      const semNovoNum = Number(novoSemestre) || 1;

      if (anoNovoNum < anoAtual || (anoNovoNum === anoAtual && semNovoNum <= semAtualNum)) {
        setFeedback({
          type: 'error',
          message: `O novo período (${anoNovoNum}/${semNovoNum}) deve ser estritamente posterior ao período atual do aluno (${anoAtual}/${semAtualNum}).`,
        });
        return;
      }

      if (trocarTurma && !novaTurmaId) {
        setFeedback({ type: 'error', message: 'Como você optou por matricular em outra turma, por favor selecione a Turma de destino.' });
        return;
      }
    } else {
      // Validação para Novo Curso
      if (!novaTurmaId) {
        setFeedback({ type: 'error', message: 'Por favor, selecione a Turma do novo curso.' });
        return;
      }
    }

    executarRequisicao(false);
  };

  const handleConfirmarComDebitos = () => {
    if (!justificativaDebito.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, preencha a justificativa para autorizar a operação com débitos.' });
      return;
    }
    executarRequisicao(true);
  };

  const handleCancelarDebitos = () => {
    setAlertaDebitos(null);
    setJustificativaDebito('');
    setFeedback(null);
  };

  // Contexto visual do aluno e da matrícula específica
  const cursoNome = aluno.curso || aluno.curso_nome || aluno.nome_curso || null;
  const turmaNome = aluno.turma || aluno.turma_nome || null;
  const anoAtual = aluno.anoLetivo || aluno.ano_letivo || aluno.ano || new Date().getFullYear();
  const semestreAtual = aluno.semestre || '1';
  const matriculaNum = aluno.matricula_codigo || aluno.matricula || aluno.numero_id || null;
  const isPrincipal = aluno.is_principal !== undefined ? aluno.is_principal : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 transform transition-all max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho Visual */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-teal-100 flex-shrink-0">
            {tipoModalidade === 'TRANSFERENCIA' ? '🔀' : (tipoModalidade === 'REMATRICULA' ? '🔄' : '🎓')}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              {tipoModalidade === 'TRANSFERENCIA'
                ? 'Transferência de Turma'
                : (tipoModalidade === 'REMATRICULA' ? 'Rematrícula / Progressão' : 'Nova Matrícula em Outro Curso')}
            </h3>
            <p className="text-xs text-slate-500">
              {tipoModalidade === 'TRANSFERENCIA'
                ? 'Mudança de turma no mesmo período acadêmico e curso'
                : (tipoModalidade === 'REMATRICULA'
                    ? 'Renovação e progressão sequencial para o próximo período'
                    : 'Ingresso simultâneo em um curso adicional mantendo o atual ativo')}
            </p>
          </div>
        </div>

        {/* SELEÇÃO DE MODALIDADE (3 Modos Distintos) */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Tipo de Operação
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleTrocarModalidade('TRANSFERENCIA')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                tipoModalidade === 'TRANSFERENCIA'
                  ? 'bg-white text-teal-700 shadow-sm border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🔀</span> Transferir Turma
            </button>
            <button
              type="button"
              onClick={() => handleTrocarModalidade('REMATRICULA')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                tipoModalidade === 'REMATRICULA'
                  ? 'bg-white text-teal-700 shadow-sm border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🔄</span> Rematrícula
            </button>
            <button
              type="button"
              onClick={() => handleTrocarModalidade('NOVO_CURSO')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                tipoModalidade === 'NOVO_CURSO'
                  ? 'bg-white text-teal-700 shadow-sm border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🎓</span> Novo Curso
            </button>
          </div>
        </div>

        {/* Bloco DADOS DO ALUNO / Contexto do Aluno Selecionado */}
        <div className="p-4 bg-gradient-to-r from-teal-50/60 to-slate-50 border border-teal-100 rounded-xl mb-4 text-xs space-y-1.5 shadow-sm">
          <div className="flex justify-between items-center pb-1.5 border-b border-teal-100/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-teal-800 uppercase tracking-wider">Aluno Selecionado</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isPrincipal
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                {isPrincipal ? 'Principal' : 'Curso Simultâneo'}
              </span>
            </div>
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
                <span className="font-medium text-slate-400 block text-[10px] uppercase">Curso Atual</span>
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
                Existem débitos financeiros vinculados a este aluno. A operação pode ser cancelada ou autorizada mediante justificativa preenchida.
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
                Cancelar Operação
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
          /* FORMULÁRIO PRINCIPAL */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Mensagem Explicativa de Impacto Pedagógico */}
            <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-900 space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-base leading-none">ℹ️</span>
                <p className="leading-relaxed font-medium">
                  {tipoModalidade === 'TRANSFERENCIA'
                    ? `Transferência de turma no mesmo período acadêmico (${anoAtual}/${semestreAtual}). Mantém o curso atual e a mesma matrícula ativa.`
                    : (tipoModalidade === 'REMATRICULA'
                        ? `Você encerrará o ciclo acadêmico atual (${anoAtual}/${semestreAtual}) e iniciará uma nova matrícula para o período sequencial.`
                        : `Você criará uma matrícula adicional em um novo curso. O curso atual (${cursoNome || 'Curso Atual'}) permanecerá ativo e intocado.`)}
                </p>
              </div>
              <p className="pl-6 text-[11px] text-teal-700 italic">
                {tipoModalidade === 'TRANSFERENCIA'
                  ? 'O aluno pode ser transferido entre turmas quantas vezes forem necessárias sem avançar de semestre.'
                  : (tipoModalidade === 'REMATRICULA'
                      ? (!trocarTurma
                          ? 'O aluno permanecerá vinculado à turma atual.'
                          : 'O aluno será rematriculado para a turma de destino selecionada do mesmo curso.')
                      : 'O aluno passará a cursar dois cursos simultâneos com matrículas independentes.')}
              </p>
            </div>

            {/* Período Acadêmico (Exibido para Rematrícula e Novo Curso) */}
            {tipoModalidade !== 'TRANSFERENCIA' && (
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  {tipoModalidade === 'REMATRICULA' ? 'Novo período acadêmico (Sequencial)' : 'Período Inicial no Novo Curso'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Ano Letivo */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Ano Letivo <span className="text-red-500">*</span>
                    </label>
                    {tipoModalidade === 'REMATRICULA' ? (
                      <input
                        type="text"
                        readOnly
                        value={novoAnoLetivo}
                        className="w-full px-3 py-2 text-sm font-bold border border-teal-300 rounded-lg bg-teal-50/50 text-teal-900 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={novoAnoLetivo}
                        onChange={(e) => setNovoAnoLetivo(e.target.value)}
                        disabled={loadingAnos}
                        className="w-full px-3 py-2 text-sm font-medium border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        {novoAnoLetivo && !anosLetivosOptions.includes(Number(novoAnoLetivo)) && (
                          <option value={novoAnoLetivo}>{novoAnoLetivo} (Não cadastrado)</option>
                        )}
                        {anosLetivosOptions.map((ano) => (
                          <option key={ano} value={ano}>{ano}</option>
                        ))}
                      </select>
                    )}
                    {novoAnoLetivo && anosLetivosOptions.length > 0 && !anosLetivosOptions.includes(Number(novoAnoLetivo)) && (
                      <div className="mt-1.5 p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-[11px] text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">⚠️</span>
                          <span>
                            O ano letivo (<strong>{novoAnoLetivo}</strong>) ainda não está cadastrado.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAbrirCadastroAno(novoAnoLetivo)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md text-[11px] shadow-sm transition-colors cursor-pointer whitespace-nowrap self-end sm:self-auto"
                        >
                          + Cadastrar Ano Letivo
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Semestre */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Semestre <span className="text-red-500">*</span>
                    </label>
                    {tipoModalidade === 'REMATRICULA' ? (
                      <input
                        type="text"
                        readOnly
                        value={`${novoSemestre}º Semestre`}
                        className="w-full px-3 py-2 text-sm font-bold border border-teal-300 rounded-lg bg-teal-50/50 text-teal-900 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={novoSemestre}
                        onChange={(e) => setNovoSemestre(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-medium border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        <option value="1">1º Semestre</option>
                        <option value="2">2º Semestre</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SELEÇÃO DE TURMA */}
            {tipoModalidade === 'TRANSFERENCIA' ? (
              /* SEÇÃO TRANSFERÊNCIA: Seleção obrigatória de outra turma do mesmo curso */
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60 space-y-2">
                <label className="text-xs font-bold text-teal-800 block">
                  Nova Turma de Destino <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 pb-1">
                  Selecione para qual turma do curso ({cursoNome || 'Curso Atual'}) o aluno será transferido:
                </p>
                {turmasOptions.length === 0 && !loadingTurmas ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    ℹ️ Não foram encontradas outras turmas ativas para o curso deste aluno.
                  </div>
                ) : (
                  <select
                    value={novaTurmaId}
                    onChange={(e) => setNovaTurmaId(e.target.value)}
                    disabled={loadingTurmas}
                    required
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:opacity-50"
                  >
                    <option value="">-- Selecione a nova turma --</option>
                    {turmasOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} {t.codigo ? `(${t.codigo})` : ''} {t.curso ? `- ${t.curso}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : tipoModalidade === 'REMATRICULA' ? (
              /* SEÇÃO REMATRÍCULA: Checkbox de troca opcional */
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chkTrocarTurma"
                    checked={trocarTurma}
                    onChange={(e) => setTrocarTurma(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="chkTrocarTurma" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                    Matricular em outra turma do mesmo curso?
                  </label>
                </div>

                {!trocarTurma ? (
                  <p className="text-[11px] text-slate-500 pl-6 italic">
                    Manterá o aluno na turma atual ({turmaNome || 'Turma Ativa'}).
                  </p>
                ) : (
                  <div className="pl-6 pt-1 space-y-1 animate-fadeIn">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Turma de destino <span className="text-red-500">*</span>
                    </label>
                    {turmasOptions.length === 0 && !loadingTurmas ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        ℹ️ Nenhuma outra turma ativa encontrada para o curso deste aluno.
                      </div>
                    ) : (
                      <select
                        value={novaTurmaId}
                        onChange={(e) => setNovaTurmaId(e.target.value)}
                        disabled={loadingTurmas}
                        required={trocarTurma}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:opacity-50"
                      >
                        <option value="">-- Selecione a turma de destino --</option>
                        {turmasOptions.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome} {t.codigo ? `(${t.codigo})` : ''} {t.curso ? `- ${t.curso}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* SEÇÃO NOVO CURSO: Seleção de turma obrigatória de outros cursos */
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60 space-y-2">
                <label className="text-xs font-bold text-teal-800 block">
                  Turma do Novo Curso <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 pb-1">
                  Selecione a turma pertencente ao novo curso em que o aluno será matriculado:
                </p>
                {turmasOptions.length === 0 && !loadingTurmas ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    ℹ️ Não foram encontradas turmas ativas cadastradas para outros cursos.
                  </div>
                ) : (
                  <select
                    value={novaTurmaId}
                    onChange={(e) => setNovaTurmaId(e.target.value)}
                    disabled={loadingTurmas}
                    required
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:opacity-50"
                  >
                    <option value="">-- Selecione a turma do novo curso --</option>
                    {turmasOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.curso ? `[${t.curso}] ` : ''}{t.nome} {t.codigo ? `(${t.codigo})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Condições Financeiras (Opcionais - para Rematrícula e Novo Curso) */}
            {tipoModalidade !== 'TRANSFERENCIA' && (
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Condições financeiras</span>
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
            )}

            {/* Observações (opcional) */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center justify-between">
                <span>Observações</span>
                <span className="text-[10px] font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder={
                  tipoModalidade === 'TRANSFERENCIA'
                    ? "Motivo da transferência de turma..."
                    : (tipoModalidade === 'REMATRICULA'
                        ? "Anotações internas sobre a rematrícula..."
                        : "Anotações internas sobre a nova matrícula no curso...")
                }
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
                    <span>{tipoModalidade === 'TRANSFERENCIA' ? '🔀' : (tipoModalidade === 'REMATRICULA' ? '🔄' : '🎓')}</span>
                    {tipoModalidade === 'TRANSFERENCIA'
                      ? 'Confirmar Transferência'
                      : (tipoModalidade === 'REMATRICULA' ? 'Confirmar Rematrícula' : 'Confirmar Matrícula no Novo Curso')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SUB-MODAL / DRAWER: CADASTRO RÁPIDO DE ANO LETIVO INLINE */}
      {modalNovoAno.isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            handleFecharCadastroAno();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 transform transition-all animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="text-sm font-bold text-slate-800">Cadastrar Ano Letivo</h3>
              </div>
              <button
                type="button"
                onClick={handleFecharCadastroAno}
                disabled={modalNovoAno.loading}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg leading-none cursor-pointer disabled:opacity-40"
              >
                ✕
              </button>
            </div>

            {modalNovoAno.erro && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <span>⚠️</span>
                <span>{modalNovoAno.erro}</span>
              </div>
            )}

            <form onSubmit={handleSalvarNovoAno} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Ano Letivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  required
                  value={modalNovoAno.ano}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModalNovoAno((prev) => ({
                      ...prev,
                      ano: val,
                      dataInicio: val ? `${val}-01-01` : prev.dataInicio,
                      dataFim: val ? `${val}-12-31` : prev.dataFim
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  placeholder="Ex: 2027"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Data de Início <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={modalNovoAno.dataInicio}
                  onChange={(e) => setModalNovoAno((prev) => ({ ...prev, dataInicio: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Data de Fim <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={modalNovoAno.dataFim}
                  onChange={(e) => setModalNovoAno((prev) => ({ ...prev, dataFim: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleFecharCadastroAno}
                  disabled={modalNovoAno.loading}
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalNovoAno.loading || !modalNovoAno.ano || !modalNovoAno.dataInicio || !modalNovoAno.dataFim}
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {modalNovoAno.loading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Ano'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
