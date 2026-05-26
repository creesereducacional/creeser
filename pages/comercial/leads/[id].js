import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';

const ORIGENS = ['', 'Instagram', 'Facebook', 'WhatsApp', 'Indicação', 'Site', 'Evento', 'Outros'];

const BADGES = {
  novo:          'bg-blue-100 text-blue-700',
  contatado:     'bg-yellow-100 text-yellow-700',
  interessado:   'bg-orange-100 text-orange-700',
  pre_matricula: 'bg-purple-100 text-purple-700',
  matriculado:   'bg-green-100 text-green-700',
  perdido:       'bg-red-100 text-red-700',
};

const LABELS_STATUS = {
  novo:          'Novo',
  contatado:     'Contatado',
  interessado:   'Interessado',
  pre_matricula: 'Pré-Matrícula',
  matriculado:   'Matriculado',
  perdido:       'Perdido',
};

const fmtMoeda = (v) =>
  v ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

export default function DetalharLead() {
  const router = useRouter();
  const { id } = router.query;

  const [lead, setLead]               = useState(null);
  const [form, setForm]               = useState(null);
  const [editando, setEditando]       = useState(false);
  const [salvando, setSalvando]       = useState(false);
  const [erro, setErro]               = useState(null);
  const [sucesso, setSucesso]         = useState(null);
  const [carregando, setCarregando]   = useState(true);
  const [wizardAberto, setWizardAberto] = useState(false);

  // Cobrança após conversão
  const [gerandoOrdem, setGerandoOrdem]     = useState(false);
  const [ordemGerada, setOrdemGerada]       = useState(null);
  const [mostrarCobranca, setMostrarCobranca] = useState(false);
  const [dataVenc, setDataVenc]             = useState('');
  // Dados extras vindos do wizard após conversão
  const [dadosConvertido, setDadosConvertido] = useState(null);

  // Carregar lead
  useEffect(() => {
    if (!id) return;
    fetch(`/api/comercial/leads/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErro(data.error); return; }
        setLead(data);
        setForm({ ...data });
      })
      .catch(() => setErro('Não foi possível carregar o lead.'))
      .finally(() => setCarregando(false));
  }, [id]);

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.nome?.trim()) { setErro('Nome é obrigatório.'); return; }

    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch(`/api/comercial/leads/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          telefone: form.telefone,
          whatsapp: form.whatsapp,
          email: form.email,
          curso_interesse: form.curso_interesse,
          origem: form.origem,
          observacoes: form.observacoes,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return; }
      setLead(data);
      setForm({ ...data });
      setEditando(false);
      setSucesso('Lead atualizado com sucesso.');
      setTimeout(() => setSucesso(null), 3000);
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSalvando(false);
    }
  };

  const handleGerarOrdem = async () => {
    if (!lead?.aluno_convertido_id) return;
    const d = dadosConvertido || {};
    setGerandoOrdem(true);
    setErro(null);
    try {
      const res = await fetch('/api/comercial/ordens', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: lead.aluno_convertido_id,
          valor_total: d._valor_matricula || lead._valor_matricula || 0,
          quantidade_parcelas: 1,
          data_vencimento: dataVenc || undefined,
          curso_nome: d._curso_nome || lead._curso_nome || lead.curso_interesse || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao gerar cobrança.'); return; }
      setOrdemGerada(data);
      setSucesso('Ordem de matrícula gerada!');
    } catch { setErro('Erro de conexão.'); }
    finally { setGerandoOrdem(false); }
  };

  return (
    <ComercialLayout titulo="Detalhar Lead">
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/comercial/leads">
            <span className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm">← Meus Leads</span>
          </Link>
        </div>

        {carregando && <div className="py-16 text-center text-gray-400">Carregando...</div>}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{erro}</div>
        )}
        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-4">{sucesso}</div>
        )}

        {lead && (
          <>
            {/* Cabeçalho */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{lead.nome}</h2>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${BADGES[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                    {LABELS_STATUS[lead.status] || lead.status}
                  </span>
                </div>
                {lead.status !== 'pre_matricula' && lead.status !== 'matriculado' && (
                  <div className="flex gap-2">
                    {!editando && (
                      <button onClick={() => setEditando(true)}
                        className="text-sm border border-teal-300 text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-lg">
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => setWizardAberto(true)}
                      className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg">
                      🎓 Criar Pré-Matrícula
                    </button>
                  </div>
                )}
                {lead.status === 'pre_matricula' && !editando && (
                  <button onClick={() => setEditando(true)}
                    className="text-sm border border-teal-300 text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-lg">
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Card pós-conversão */}
            {lead.status === 'pre_matricula' && lead.aluno_convertido_id && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎓</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-800 mb-1">Pré-Matrícula Criada</h3>
                    {(dadosConvertido?._curso_nome || lead._curso_nome) && <p className="text-sm text-purple-700">Curso: <strong>{dadosConvertido?._curso_nome || lead._curso_nome}</strong></p>}
                    {(dadosConvertido?._turma_nome || lead._turma_nome) && <p className="text-sm text-purple-700">Turma: <strong>{dadosConvertido?._turma_nome || lead._turma_nome}</strong></p>}
                    {(dadosConvertido?._inst_nome) && <p className="text-sm text-purple-700">Instituição: <strong>{dadosConvertido._inst_nome}</strong></p>}
                    {(dadosConvertido?._valor_matricula || lead._valor_matricula) && (
                      <p className="text-sm text-purple-700">
                        Matrícula: <strong>{fmtMoeda(dadosConvertido?._valor_matricula || lead._valor_matricula)}</strong>
                        {(dadosConvertido?._valor_mensalidade || lead._valor_mensalidade) && ` · Mensalidade: ${fmtMoeda(dadosConvertido?._valor_mensalidade || lead._valor_mensalidade)}`}
                      </p>
                    )}
                    <p className="text-xs text-purple-500 mt-1">Cód. aluno: {lead.aluno_convertido_id}</p>
                    <p className="text-xs text-purple-600 mt-1">Aguardando pagamento para confirmação de matrícula.</p>
                  </div>
                </div>

                {/* Gerar cobrança */}
                {!ordemGerada && (
                  <div className="border-t border-purple-200 pt-3">
                    {!mostrarCobranca ? (
                      <button onClick={() => setMostrarCobranca(true)}
                        className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium">
                        💳 Gerar Cobrança de Matrícula
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-purple-800">Gerar Ordem de Matrícula</p>
                        {!lead._valor_matricula && (
                          <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                            Nenhum valor definido para este aluno. A ordem será gerada com valor R$ 0,00 — atualize pelo financeiro.
                          </p>
                        )}
                        <div>
                          <label className="block text-xs text-purple-700 mb-1">Data de Vencimento</label>
                          <input type="date" value={dataVenc} onChange={e => setDataVenc(e.target.value)}
                            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleGerarOrdem} disabled={gerandoOrdem}
                            className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            {gerandoOrdem ? 'Gerando...' : 'Confirmar Ordem'}
                          </button>
                          <button onClick={() => setMostrarCobranca(false)}
                            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cobrança gerada */}
                {ordemGerada && (
                  <div className="border-t border-purple-200 pt-3 space-y-2">
                    <p className="text-green-700 font-medium text-sm">✅ Cobrança gerada com sucesso!</p>
                    <p className="text-xs text-gray-600">
                      Ordem: <strong>#{ordemGerada.ordem?.id?.slice(0, 8)}…</strong> · Status: Pendente
                    </p>
                    {ordemGerada.whatsapp_link ? (
                      <a href={ordemGerada.whatsapp_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        📲 Enviar por WhatsApp
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400">Telefone não cadastrado — WhatsApp indisponível.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Wizard: criar pré-matrícula */}
            {wizardAberto && (
              <WizardPreMatricula
                lead={lead}
                leadId={id}
                onClose={() => setWizardAberto(false)}
                onConvertida={(d) => {
                  setDadosConvertido(d._extra);
                  setLead(l => ({ ...l, status: 'pre_matricula', aluno_convertido_id: d.aluno_id }));
                  setForm(f => ({ ...f, status: 'pre_matricula' }));
                  setWizardAberto(false);
                  setSucesso(d.mensagem || 'Pré-matrícula criada com sucesso!');
                  setTimeout(() => setSucesso(null), 4000);
                }}
              />
            )}

            {/* Formulário */}
            {form && (
              <form onSubmit={handleSalvar} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={form.nome || ''}
                    onChange={set('nome')}
                    disabled={!editando}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input type="tel" value={form.telefone || ''} onChange={set('telefone')} disabled={!editando}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input type="tel" value={form.whatsapp || ''} onChange={set('whatsapp')} disabled={!editando}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" value={form.email || ''} onChange={set('email')} disabled={!editando}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curso de Interesse</label>
                  <input type="text" value={form.curso_interesse || ''} onChange={set('curso_interesse')} disabled={!editando}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                    {editando ? (
                      <select value={form.origem || ''} onChange={set('origem')}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                        {ORIGENS.map(o => <option key={o} value={o}>{o || 'Não informado'}</option>)}
                      </select>
                    ) : (
                      <input value={form.origem || '—'} disabled
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {editando ? (
                      <select value={form.status || 'novo'} onChange={set('status')}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                        <option value="novo">Novo</option>
                        <option value="contatado">Contatado</option>
                        <option value="interessado">Interessado</option>
                        <option value="perdido">Perdido</option>
                      </select>
                    ) : (
                      <input value={form.status || ''} disabled
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea value={form.observacoes || ''} onChange={set('observacoes')} disabled={!editando}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 resize-none" />
                </div>

                {editando && (
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={salvando}
                      className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-5 py-2 rounded-lg text-sm font-medium">
                      {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button type="button" onClick={() => { setEditando(false); setForm({ ...lead }); }}
                      className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-5 py-2 rounded-lg text-sm">
                      Cancelar
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Datas */}
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <div>Criado: {lead.created_at ? new Date(lead.created_at).toLocaleString('pt-BR') : '—'}</div>
              <div>Atualizado: {lead.updated_at ? new Date(lead.updated_at).toLocaleString('pt-BR') : '—'}</div>
            </div>
          </>
        )}
      </div>
    </ComercialLayout>
  );
}

// ─── Helper Row ────────────────────────────────────────────────────────────────
function Row({ label, value, bold }) {
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-semibold text-purple-800' : 'text-gray-800'}`}>{value || '—'}</span>
    </div>
  );
}

// ─── Wizard: Criar Pré-Matrícula ───────────────────────────────────────────────
const STEP_LABELS = ['Instituição', 'Curso', 'Turma', 'Plano', 'Resumo'];

function WizardPreMatricula({ lead, leadId, onClose, onConvertida }) {
  const [step, setStep] = useState(1);

  // Instituição
  const [instituicoes, setInstituicoes] = useState([]);
  const [instSel, setInstSel]           = useState('');
  const [instObj, setInstObj]           = useState(null);
  const [carregandoInsts, setCarregandoInsts] = useState(true);

  // Curso
  const [cursos, setCursos]             = useState([]);
  const [cursoSel, setCursoSel]         = useState('');
  const [cursoObj, setCursoObj]         = useState(null);
  const [carregandoCursos, setCarregandoCursos] = useState(false);

  // Turma
  const [turmas, setTurmas]             = useState([]);
  const [turmaSel, setTurmaSel]         = useState('');
  const [turmaObj, setTurmaObj]         = useState(null);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  // Ação
  const [convertendo, setConvertendo]   = useState(false);
  const [erroWiz, setErroWiz]           = useState(null);

  // Carregar instituições ao montar
  useEffect(() => {
    fetch('/api/comercial/instituicoes', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setInstituicoes(list);
        // Se usuário tem apenas 1 instituição, pula step 1
        if (list.length === 1) {
          setInstSel(list[0].id);
          setInstObj(list[0]);
          setStep(2);
        }
      })
      .catch(() => {})
      .finally(() => setCarregandoInsts(false));
  }, []);

  // Carregar cursos ao selecionar instituição
  useEffect(() => {
    if (!instSel) { setCursos([]); setCursoSel(''); setCursoObj(null); return; }
    setCarregandoCursos(true);
    fetch(`/api/comercial/cursos?instituicao_id=${instSel}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregandoCursos(false));
  }, [instSel]);

  // Carregar turmas ao selecionar curso
  useEffect(() => {
    if (!cursoSel) { setTurmas([]); setTurmaSel(''); setTurmaObj(null); return; }
    setCarregandoTurmas(true);
    fetch(`/api/comercial/turmas?cursoid=${cursoSel}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTurmas(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregandoTurmas(false));
  }, [cursoSel]);

  // Sincronizar turmaObj
  useEffect(() => {
    setTurmaObj(turmas.find(t => String(t.id) === String(turmaSel)) || null);
  }, [turmaSel, turmas]);

  const temPlano = !!(turmaObj && (turmaObj.matricula || turmaObj.mensalidade || turmaObj.mesescontrato));

  const canNext =
    (step === 1 && !!instSel) ||
    (step === 2 && !!cursoSel) ||
    (step === 3 && !!turmaSel) ||
    (step === 4 && temPlano) ||
    step === 5;

  const handleConverter = async () => {
    setConvertendo(true);
    setErroWiz(null);
    try {
      const res = await fetch(`/api/comercial/leads/${leadId}/converter`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoid:           cursoSel  || undefined,
          turmaid:           turmaSel  || undefined,
          valor_matricula:   turmaObj?.matricula    || undefined,
          valor_mensalidade: turmaObj?.mensalidade  || undefined,
          qtd_parcelas:      turmaObj?.mesescontrato || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErroWiz(data.error || 'Erro na conversão.'); return; }
      onConvertida({
        aluno_id: data.aluno_id,
        mensagem: data.mensagem,
        _extra: {
          _inst_nome:         instObj?.nome,
          _curso_nome:        cursoObj?.nome,
          _turma_nome:        turmaObj?.nome,
          _valor_matricula:   turmaObj?.matricula,
          _valor_mensalidade: turmaObj?.mensalidade,
        },
      });
    } catch { setErroWiz('Erro de conexão.'); }
    finally { setConvertendo(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-base">Criar Pré-Matrícula</h2>
            <p className="text-xs text-gray-500 mt-0.5">{lead.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4 flex-shrink-0 mt-0.5">×</button>
        </div>

        {/* Indicador de passos */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center">
            {STEP_LABELS.map((label, i) => {
              const s = i + 1;
              const done = step > s, active = step === s;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      ${done ? 'bg-green-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? '✓' : s}
                    </div>
                    <span className={`text-[9px] mt-1 text-center leading-tight
                      ${active ? 'text-purple-600 font-semibold' : done ? 'text-green-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {s < STEP_LABELS.length && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {erroWiz && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{erroWiz}</div>
          )}

          {/* Etapa 1 – Instituição */}
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm">Selecione a Instituição</h3>
              {carregandoInsts ? (
                <div className="text-sm text-gray-400 py-6 text-center">Carregando...</div>
              ) : instituicoes.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">Nenhuma instituição disponível.</p>
              ) : (
                <div className="space-y-2">
                  {instituicoes.map(inst => (
                    <button key={inst.id} type="button"
                      onClick={() => { setInstSel(inst.id); setInstObj(inst); }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all
                        ${instSel === inst.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}`}>
                      <span className="font-medium text-sm text-gray-800">{inst.nome}</span>
                      {inst.tipo_instituicao && (
                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{inst.tipo_instituicao}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Etapa 2 – Curso */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Selecione o Curso</h3>
                <p className="text-xs text-gray-400 mt-0.5">{instObj?.nome}</p>
              </div>
              {carregandoCursos ? (
                <div className="text-sm text-gray-400 py-6 text-center">Carregando cursos…</div>
              ) : cursos.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">Nenhum curso ativo para esta instituição.</p>
              ) : (
                <select value={cursoSel}
                  onChange={e => {
                    setCursoSel(e.target.value);
                    setCursoObj(cursos.find(c => String(c.id) === e.target.value) || null);
                    setTurmaSel('');
                  }}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                  <option value="">— Selecione o curso —</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Etapa 3 – Turma */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Selecione a Turma</h3>
                <p className="text-xs text-gray-400 mt-0.5">{cursoObj?.nome}</p>
              </div>
              {carregandoTurmas ? (
                <div className="text-sm text-gray-400 py-6 text-center">Carregando turmas…</div>
              ) : turmas.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">Nenhuma turma ativa para este curso.</p>
              ) : (
                <div className="space-y-2">
                  {turmas.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => setTurmaSel(String(t.id))}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all
                        ${String(turmaSel) === String(t.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}`}>
                      <div className="font-medium text-sm text-gray-800">{t.nome}</div>
                      <div className="text-xs text-gray-400 mt-0.5 flex gap-3 flex-wrap">
                        {t.turno      && <span>Turno: {t.turno}</span>}
                        {t.vagas      && <span>Vagas: {t.vagas}</span>}
                        {t.datainicio && <span>Início: {t.datainicio}</span>}
                        {t.situacao   && <span className="capitalize">{t.situacao.toLowerCase()}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Etapa 4 – Plano Financeiro */}
          {step === 4 && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Plano Financeiro</h3>
                <p className="text-xs text-gray-400 mt-0.5">{turmaObj?.nome}</p>
              </div>
              {!temPlano ? (
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800 space-y-1">
                  <p className="font-semibold">⚠️ Plano financeiro não configurado.</p>
                  <p className="text-xs text-yellow-600">
                    Configure os valores de matrícula e mensalidade no módulo de turmas antes de continuar.
                    Volte e selecione outra turma.
                  </p>
                </div>
              ) : (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-1.5 text-sm">
                  <p className="font-semibold text-teal-800 mb-2">Resumo do Plano</p>
                  <Row label="Matrícula"    value={turmaObj.matricula    ? fmtMoeda(turmaObj.matricula)    : '—'} />
                  <Row label="Mensalidade"  value={turmaObj.mensalidade  ? fmtMoeda(turmaObj.mensalidade)  : '—'} />
                  <Row label="Parcelas"     value={turmaObj.mesescontrato ? `${turmaObj.mesescontrato}×`   : '—'} />
                  {turmaObj.bolsa_pct && <Row label="Bolsa"   value={`${turmaObj.bolsa_pct}%`} />}
                  {turmaObj.convenio  && <Row label="Convênio" value={turmaObj.convenio} />}
                </div>
              )}
            </div>
          )}

          {/* Etapa 5 – Resumo + Confirmar */}
          {step === 5 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm">Confirmar Pré-Matrícula</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-1.5 text-sm">
                <Row label="Aluno"        value={lead.nome}             bold />
                <div className="border-t border-purple-200 my-2" />
                <Row label="Instituição"  value={instObj?.nome} />
                <Row label="Curso"        value={cursoObj?.nome} />
                <Row label="Turma"        value={turmaObj?.nome} />
                <div className="border-t border-purple-200 my-2" />
                <Row label="Matrícula"    value={turmaObj?.matricula    ? fmtMoeda(turmaObj.matricula)    : '—'} />
                <Row label="Mensalidade"  value={turmaObj?.mensalidade  ? fmtMoeda(turmaObj.mensalidade)  : '—'} />
                <Row label="Parcelas"     value={turmaObj?.mesescontrato ? `${turmaObj.mesescontrato}×`   : '—'} />
              </div>
              <p className="text-xs text-gray-400">
                O aluno será criado com status <strong>AGUARDANDO_PAGAMENTO</strong>.
                A matrícula só será confirmada após o pagamento.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé de navegação */}
        <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button type="button"
            onClick={() => step === 1 ? onClose() : setStep(s => s - 1)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
            {step === 1 ? 'Cancelar' : '← Voltar'}
          </button>

          {step < 5 ? (
            <button type="button"
              disabled={!canNext}
              onClick={() => setStep(s => s + 1)}
              className="px-5 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors">
              Próximo →
            </button>
          ) : (
            <button type="button"
              disabled={convertendo}
              onClick={handleConverter}
              className="px-5 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {convertendo ? 'Criando…' : '✅ Confirmar Pré-Matrícula'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
