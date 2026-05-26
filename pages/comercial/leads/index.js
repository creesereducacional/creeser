import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';

const STATUS_OPCOES = ['', 'novo', 'contatado', 'interessado', 'matriculado', 'perdido'];

const BADGES = {
  novo:        'bg-blue-100 text-blue-700',
  contatado:   'bg-yellow-100 text-yellow-700',
  interessado: 'bg-orange-100 text-orange-700',
  matriculado: 'bg-green-100 text-green-700',
  perdido:     'bg-red-100 text-red-700',
};

export default function MeusLeads() {
  const [leads, setLeads] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');

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

  return (
    <ComercialLayout titulo="Meus Leads">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Meus Leads</h2>
        <Link href="/comercial/leads/novo">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
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
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="contatado">Contatado</option>
          <option value="interessado">Interessado</option>
          <option value="matriculado">Matriculado</option>
          <option value="perdido">Perdido</option>
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
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Contato</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leadsFiltrados.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{lead.nome}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead.whatsapp || lead.telefone || lead.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{lead.curso_interesse || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${BADGES[lead.status] || ''}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/comercial/leads/${lead.id}`}>
                      <span className="text-indigo-600 hover:underline cursor-pointer">Ver</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400 text-right">
        {leadsFiltrados.length} lead{leadsFiltrados.length !== 1 ? 's' : ''} exibido{leadsFiltrados.length !== 1 ? 's' : ''}
      </div>
    </ComercialLayout>
  );
}
