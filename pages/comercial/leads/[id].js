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

export default function DetalharLead() {
  const router = useRouter();
  const { id } = router.query;

  const [lead, setLead] = useState(null);
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [convertendo, setConvertendo] = useState(false);
  const [confirmarConversao, setConfirmarConversao] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [carregando, setCarregando] = useState(true);

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

  const handleConverter = async () => {
    setConvertendo(true);
    setErro(null);

    try {
      const res = await fetch(`/api/comercial/leads/${id}/converter`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro na conversão.'); return; }

      setSucesso(data.mensagem);
      setLead(l => ({ ...l, status: 'pre_matricula', aluno_convertido_id: data.aluno_id }));
      setForm(f => ({ ...f, status: 'pre_matricula' }));
      setConfirmarConversao(false);
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setConvertendo(false);
    }
  };

  return (
    <ComercialLayout titulo="Detalhar Lead">
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/comercial/leads">
            <span className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm">← Meus Leads</span>
          </Link>
        </div>

        {carregando && (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{erro}</div>
        )}
        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-4">{sucesso}</div>
        )}

        {lead && (
          <>
            {/* Cabeçalho do lead */}
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
                      <button
                        onClick={() => setEditando(true)}
                        className="text-sm border border-teal-300 text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmarConversao(true)}
                      className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      🎓 Criar Pré-Matrícula
                    </button>
                  </div>
                )}
                {lead.status === 'pre_matricula' && !editando && (
                  <button
                    onClick={() => setEditando(true)}
                    className="text-sm border border-teal-300 text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Card de Pré-Matrícula */}
            {lead.status === 'pre_matricula' && lead.aluno_convertido_id && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎓</div>
                  <div>
                    <h3 className="font-semibold text-purple-800 mb-1">Pré-Matrícula Criada</h3>
                    <p className="text-sm text-purple-700 mb-2">
                      A matrícula será confirmada somente após complementação cadastral e confirmação de pagamento pela secretaria/financeiro.
                    </p>
                    <p className="text-xs text-purple-500">Cód. aluno: {lead.aluno_convertido_id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de confirmação de conversão */}
            {confirmarConversao && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                  <h3 className="font-bold text-gray-800 mb-2">Converter em Aluno</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    O lead <strong>{lead.nome}</strong> será cadastrado como pré-matrícula. A matrícula só será confirmada após complementação cadastral e pagamento.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleConverter}
                      disabled={convertendo}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      {convertendo ? 'Criando...' : 'Confirmar Pré-Matrícula'}
                    </button>
                    <button
                      onClick={() => setConfirmarConversao(false)}
                      className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm"
                    >
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
