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
  pre_matricula: 'PrÃ©-MatrÃ­cula',
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
  // Adiciona cÃ³digo do paÃ­s se necessÃ¡rio (<=11 dÃ­gitos = sem DDI)
  if (numero.length <= 11) numero = '55' + numero;
  const curso = lead.curso_interesse
    ? `no curso ${lead.curso_interesse}`
    : 'em nossos cursos';
  const msg = encodeURIComponent(
    `OlÃ¡, ${lead.nome}! Tudo bem? Aqui Ã© da equipe comercial do Grupo Creeser Educacional. Vi seu interesse ${curso}. Posso te passar mais informaÃ§Ãµes e ajudar com sua prÃ©-matrÃ­cula?`
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
      setErroStatus('Erro de conexÃ£o.');
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
      alert('Este lead nÃ£o possui nÃºmero de telefone ou WhatsApp cadastrado.');
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
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="contatado">Contatado</option>
          <option value="interessado">Interessado</option>
          <option value="pre_matricula">PrÃ©-MatrÃ­cula</option>
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
              ? 'Nenhum lead cadastrado ainda. Clique em "+ Novo Lead" para comeÃ§ar.'
              : 'Nenhum lead encontrado com esses filtros.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Contato</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">AÃ§Ãµes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leadsFiltrados.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{lead.nome}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead.whatsapp || lead.telefone || lead.email || 'â€”'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{lead.curso_interesse || 'â€”'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${BADGES[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                      {LABELS_STATUS[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : 'â€”'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Detalhes */}
                      <Link href={`/comercial/leads/${lead.id}`}>
                        <span className="inline-block px-2.5 py-1 rounded border border-teal-500 text-teal-700 hover:bg-teal-50 text-xs font-medium cursor-pointer transition-colors">
                          Detalhes
                        </span>
                      </Link>
                      {/* Status */}
                      <button
                        onClick={() => abrirModalStatus(lead)}
                        className="px-2.5 py-1 rounded border border-blue-400 text-blue-700 hover:bg-blue-50 text-xs font-medium transition-colors"
                      >
                        Status
                      </button>
                      {/* WhatsApp */}
                      <button
                        onClick={() => abrirWhatsApp(lead)}
                        className="px-2.5 py-1 rounded border border-green-500 text-green-700 hover:bg-green-50 text-xs font-medium transition-colors"
                      >
                        WhatsApp
                      </button>
                      {/* Desativar */}
                      {lead.status !== 'desistente' && (
                        <button
                          onClick={() => setModalDesativar(lead)}
                          className="px-2.5 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 text-xs font-medium transition-colors"
                        >
                          Desativar
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

      {/* â”€â”€ Modal: Alterar Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              <option value="matriculado" disabled>Matriculado (automÃ¡tico)</option>
            </select>

            <p className="text-xs text-amber-600 bg-amber-50 rounded p-2 mb-3">
              O status &quot;Matriculado&quot; Ã© definido automaticamente apÃ³s confirmaÃ§Ã£o do fluxo financeiro/acadÃªmico.
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

      {/* â”€â”€ Modal: Desativar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {modalDesativar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 mb-2">Desativar lead?</h3>
            <p className="text-sm text-gray-600 mb-4">
              O lead <strong>{modalDesativar.nome}</strong> serÃ¡ marcado como <em>Desistente</em>. Esta aÃ§Ã£o pode ser revertida alterando o status.
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
