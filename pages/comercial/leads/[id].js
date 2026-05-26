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
  const [convertendo, setConvertendo] = useState(false);
  const [confirmarConversao, setConfirmarConversao] = useState(false);
  const [erro, setErro]               = useState(null);
  const [sucesso, setSucesso]         = useState(null);
  const [carregando, setCarregando]   = useState(true);

  // Seleção curso/turma no modal de conversão
  const [cursos, setCursos]                         = useState([]);
  const [turmas, setTurmas]                         = useState([]);
  const [cursoSel, setCursoSel]                     = useState('');
  const [turmaSel, setTurmaSel]                     = useState('');
  const [turmaObj, setTurmaObj]                     = useState(null);
  const [carregandoCursos, setCarregandoCursos]     = useState(false);
  const [carregandoTurmas, setCarregandoTurmas]     = useState(false);

  // Cobrança após conversão
  const [gerandoOrdem, setGerandoOrdem]     = useState(false);
  const [ordemGerada, setOrdemGerada]       = useState(null);
  const [mostrarCobranca, setMostrarCobranca] = useState(false);
  const [dataVenc, setDataVenc]             = useState('');

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

  // Carregar cursos quando modal de conversão abre
  useEffect(() => {
    if (!confirmarConversao) return;
    setCarregandoCursos(true);
    fetch('/api/comercial/cursos', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregandoCursos(false));
  }, [confirmarConversao]);

  // Carregar turmas quando curso muda
  useEffect(() => {
    if (!cursoSel) { setTurmas([]); setTurmaSel(''); setTurmaObj(null); return; }
    setCarregandoTurmas(true);
    fetch(`/api/comercial/turmas?cursoid=${cursoSel}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTurmas(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregandoTurmas(false));
  }, [cursoSel]);

  // Popular turmaObj quando turma muda
  useEffect(() => {
    if (!turmaSel) { setTurmaObj(null); return; }
    setTurmaObj(turmas.find(t => String(t.id) === String(turmaSel)) || null);
  }, [turmaSel, turmas]);

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

  const handleConverter = async () => {
    setConvertendo(true);
    setErro(null);
    try {
      const curso = cursos.find(c => String(c.id) === String(cursoSel));
      const res = await fetch(`/api/comercial/leads/${id}/converter`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoid: cursoSel || undefined,
          turmaid: turmaSel || undefined,
          valor_matricula:   turmaObj?.matricula   || undefined,
          valor_mensalidade: turmaObj?.mensalidade  || undefined,
          qtd_parcelas:      turmaObj?.mesescontrato || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro na conversão.'); return; }
      setSucesso(data.mensagem);
      setLead(l => ({
        ...l,
        status: 'pre_matricula',
        aluno_convertido_id: data.aluno_id,
        _curso_nome:        curso?.nome,
        _turma_nome:        turmaObj?.nome,
        _valor_matricula:   turmaObj?.matricula,
        _valor_mensalidade: turmaObj?.mensalidade,
      }));
      setForm(f => ({ ...f, status: 'pre_matricula' }));
      setConfirmarConversao(false);
    } catch { setErro('Erro de conexão.'); }
    finally { setConvertendo(false); }
  };

  const handleGerarOrdem = async () => {
    if (!lead?.aluno_convertido_id) return;
    setGerandoOrdem(true);
    setErro(null);
    try {
      const res = await fetch('/api/comercial/ordens', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: lead.aluno_convertido_id,
          valor_total: lead._valor_matricula || 0,
          quantidade_parcelas: 1,
          data_vencimento: dataVenc || undefined,
          curso_nome: lead._curso_nome || lead.curso_interesse || '',
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
                      onClick={() => { setConfirmarConversao(true); setCursoSel(''); setTurmaSel(''); setTurmaObj(null); }}
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
                    {lead._curso_nome && <p className="text-sm text-purple-700">Curso: <strong>{lead._curso_nome}</strong></p>}
                    {lead._turma_nome && <p className="text-sm text-purple-700">Turma: <strong>{lead._turma_nome}</strong></p>}
                    {lead._valor_matricula && (
                      <p className="text-sm text-purple-700">
                        Matrícula: <strong>{fmtMoeda(lead._valor_matricula)}</strong>
                        {lead._valor_mensalidade && ` · Mensalidade: ${fmtMoeda(lead._valor_mensalidade)}`}
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

            {/* Modal: conversão com curso/turma/plano */}
            {confirmarConversao && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-gray-800 mb-1">Criar Pré-Matrícula</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    <strong>{lead.nome}</strong> · Selecione o curso e turma desejados.
                  </p>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Curso</label>
                    {carregandoCursos ? (
                      <div className="text-sm text-gray-400 py-2">Carregando cursos…</div>
                    ) : (
                      <select value={cursoSel} onChange={e => { setCursoSel(e.target.value); setTurmaSel(''); }}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                        <option value="">— Selecione o curso —</option>
                        {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    )}
                  </div>

                  {cursoSel && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Turma</label>
                      {carregandoTurmas ? (
                        <div className="text-sm text-gray-400 py-2">Carregando turmas…</div>
                      ) : turmas.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">Nenhuma turma ativa para este curso.</p>
                      ) : (
                        <select value={turmaSel} onChange={e => setTurmaSel(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                          <option value="">— Selecione a turma —</option>
                          {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  {turmaObj && (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-sm space-y-1">
                      <p className="font-medium text-teal-800">Plano financeiro da turma</p>
                      {turmaObj.matricula    && <p className="text-teal-700">Matrícula: <strong>{fmtMoeda(turmaObj.matricula)}</strong></p>}
                      {turmaObj.mensalidade  && <p className="text-teal-700">Mensalidade: <strong>{fmtMoeda(turmaObj.mensalidade)}</strong></p>}
                      {turmaObj.mesescontrato && <p className="text-teal-700">Parcelas: <strong>{turmaObj.mesescontrato}×</strong></p>}
                      {turmaObj.datainicio   && <p className="text-teal-700">Início: <strong>{turmaObj.datainicio}</strong></p>}
                    </div>
                  )}

                  {!cursoSel && (
                    <p className="text-xs text-gray-400 mb-4">Pode confirmar sem selecionar curso — dados podem ser complementados depois.</p>
                  )}

                  <div className="flex gap-3">
                    <button onClick={handleConverter} disabled={convertendo}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-2 rounded-lg text-sm font-medium">
                      {convertendo ? 'Criando…' : '✅ Confirmar Pré-Matrícula'}
                    </button>
                    <button onClick={() => setConfirmarConversao(false)}
                      className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
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
