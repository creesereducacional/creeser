import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';

const STATUS_OPCOES = ['', 'novo', 'contatado', 'interessado', 'pre_matricula', 'matriculado', 'desistente'];

const BADGES = {
  novo:          'bg-blue-100 text-blue-700',
  contatado:     'bg-yellow-100 text-yellow-700',
  interessado:   'bg-orange-100 text-orange-700',
  pre_matricula: 'bg-purple-100 text-purple-700',
  matriculado:   'bg-green-100 text-green-700',
  desistente:    'bg-red-100 text-red-700',
  perdido:       'bg-red-100 text-red-700',
};

const LABELS_STATUS = {
  novo:          'Novo',
  contatado:     'Contatado',
  interessado:   'Interessado',
  pre_matricula: 'Pré-Matrícula',
  matriculado:   'Matriculado',
  desistente:    'Desistente',
  perdido:       'Perdido',
};

// Statuses que o operador/master pode definir manualmente
const STATUS_MANUAIS = ['novo', 'contatado', 'interessado', 'pre_matricula', 'desistente'];

function limparNumero(n) {
  return (n || '').replace(/\D/g, '');
}

function gerarLinkWhatsApp(lead) {
  let numero = limparNumero(lead.whatsapp) || limparNumero(lead.telefone);
  if (!numero) return null;
  // Adiciona código do país se necessário (<=11 dígitos = sem DDI)
  if (numero.length <= 11) numero = '55' + numero;
  const curso = lead.curso_interesse
    ? `no curso ${lead.curso_interesse}`
    : 'em nossos cursos';
  const msg = encodeURIComponent(
    `Olá, ${lead.nome}! Tudo bem? Aqui é da equipe comercial do Grupo Creeser Educacional. Vi seu interesse ${curso}. Posso te passar mais informações e ajudar com sua pré-matrícula?`
  );
  return `https://wa.me/${numero}?text=${msg}`;
}

export default function MeusLeads() {
  const [leads, setLeads] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');

  // Modal: Alterar Status
  const [modalStatus, setModalStatus] = useState(null);
  const [novoStatus, setNovoStatus] = useState('');
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [erroStatus, setErroStatus] = useState('');

  // Modal: Desativar
  const [modalDesativar, setModalDesativar] = useState(null);
  const [desativando, setDesativando] = useState(false);

  const carregar = useCallback(() => {
    setCarregando(true);
    const qs = filtroStatus ? `?status=${filtroStatus}` : '';
    fetch(`/api/comercial/leads${qs}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .finally(() => setCarregando(false));
  }, [filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  const leadsFiltrados = leads.filter(l =>
    !busca || l.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (l.telefone || '').includes(busca) || (l.whatsapp || '').includes(busca)
  );

  function abrirModalStatus(lead) {
    setNovoStatus(STATUS_MANUAIS.includes(lead.status) ? lead.status : 'novo');
    setErroStatus('');
    setModalStatus(lead);
  }

  async function salvarStatus() {
    if (!modalStatus || novoStatus === 'matriculado') return;
    setSalvandoStatus(true);
    setErroStatus('');
    try {
      const res = await fetch(`/api/comercial/leads/${modalStatus.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok) { setErroStatus(data.error || 'Erro ao alterar status.'); return; }
      setLeads(prev => prev.map(l => l.id === modalStatus.id ? { ...l, status: novoStatus } : l));
      setModalStatus(null);
    } catch {
      setErroStatus('Erro de conexão.');
    } finally {
      setSalvandoStatus(false);
    }
  }

  async function confirmarDesativar() {
    if (!modalDesativar) return;
    setDesativando(true);
    try {
      const res = await fetch(`/api/comercial/leads/${modalDesativar.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'desistente' }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === modalDesativar.id ? { ...l, status: 'desistente' } : l));
      }
      setModalDesativar(null);
    } catch { /* ignore */ } finally {
      setDesativando(false);
    }
  }

  function abrirWhatsApp(lead) {
    const link = gerarLinkWhatsApp(lead);
    if (!link) {
      alert('Este lead não possui número de telefone ou WhatsApp cadastrado.');
      return;
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  return (
    <ComercialLayout titulo="Meus Leads">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Meus Leads</h2>
        <Link href="/comercial/leads/novo">
          <button className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            + Novo Lead
          </button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 border border-gray-300 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="contatado">Contatado</option>
          <option value="interessado">Interessado</option>
          <option value="pre_matricula">Pré-Matrícula</option>
          <option value="matriculado">Matriculado</option>
          <option value="desistente">Desistente</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {carregando ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : leadsFiltrados.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {leads.length === 0
              ? 'Nenhum lead cadastrado ainda. Clique em "+ Novo Lead" para começar.'
              : 'Nenhum lead encontrado com esses filtros.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Contato</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Data</th>
                {leadsFiltrados.some(l => l.captado_por) && <th className="px-4 py-3 text-left">Operador</th>}
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leadsFiltrados.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                        {(lead.nome || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{lead.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead.whatsapp || lead.telefone || lead.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{lead.curso_interesse || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      {
                        novo:          'bg-blue-50 text-blue-700 border-blue-200',
                        contatado:     'bg-yellow-50 text-yellow-700 border-yellow-200',
                        interessado:   'bg-orange-50 text-orange-700 border-orange-200',
                        pre_matricula: 'bg-purple-50 text-purple-700 border-purple-200',
                        matriculado:   'bg-green-50 text-green-700 border-green-200',
                        desistente:    'bg-red-50 text-red-600 border-red-200',
                        perdido:       'bg-red-50 text-red-600 border-red-200',
                      }[lead.status] || 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      {LABELS_STATUS[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  {leadsFiltrados.some(l => l.captado_por) && (
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {lead.captado_por?.nomecompleto || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Detalhes */}
                      <Link href={`/comercial/leads/${lead.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition" title="Detalhes">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </Link>
                      {/* Status */}
                      <button onClick={() => abrirModalStatus(lead)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition" title="Alterar Status">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {/* WhatsApp */}
                      <button onClick={() => abrirWhatsApp(lead)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition" title="Enviar WhatsApp">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </button>
                      {/* Desativar */}
                      {lead.status !== 'desistente' && (
                        <button onClick={() => setModalDesativar(lead)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition" title="Desativar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
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

      <div className="mt-3 text-xs text-gray-400 text-right">
        {leadsFiltrados.length} lead{leadsFiltrados.length !== 1 ? 's' : ''} exibido{leadsFiltrados.length !== 1 ? 's' : ''}
      </div>

      {/* Modal: Alterar Status */}
      {modalStatus && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Alterar Status</h3>
            <p className="text-sm text-gray-500 mb-4">{modalStatus.nome}</p>

            <label className="block text-xs font-medium text-gray-600 mb-1">Novo status</label>
            <select
              value={novoStatus}
              onChange={e => setNovoStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-2"
            >
              {STATUS_MANUAIS.map(s => (
                <option key={s} value={s}>{LABELS_STATUS[s]}</option>
              ))}
              <option value="matriculado" disabled>Matriculado (automático)</option>
            </select>

            <p className="text-xs text-amber-600 bg-amber-50 rounded p-2 mb-3">
              O status &quot;Matriculado&quot; é definido automaticamente após confirmação do fluxo financeiro/acadêmico.
            </p>

            {erroStatus && (
              <p className="text-xs text-red-600 bg-red-50 rounded p-2 mb-3">{erroStatus}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModalStatus(null)}
                disabled={salvandoStatus}
                className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarStatus}
                disabled={salvandoStatus}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                {salvandoStatus ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Desativar */}
      {modalDesativar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 mb-2">Desativar lead?</h3>
            <p className="text-sm text-gray-600 mb-4">
              O lead <strong>{modalDesativar.nome}</strong> será marcado como <em>Desistente</em>. Esta ação pode ser revertida alterando o status.
            </p>
            {desativando ? (
              <div className="text-center text-gray-400 text-sm py-2">Aguarde...</div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setModalDesativar(null)}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarDesativar}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  Desativar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ComercialLayout>
  );
}
