import { useState, useEffect } from 'react';
import ComercialLayout from '@/components/ComercialLayout';

const BADGES_MATRICULA = {
  AGUARDANDO_PAGAMENTO: 'bg-yellow-100 text-yellow-700',
  PRE_MATRICULA:        'bg-purple-100 text-purple-700',
  MATRICULADO:          'bg-green-100 text-green-700',
  ATIVO:                'bg-green-100 text-green-700',
  TRANCADO:             'bg-gray-100 text-gray-600',
  CANCELADO:            'bg-red-100 text-red-700',
};

const LABELS_MATRICULA = {
  AGUARDANDO_PAGAMENTO: 'Aguard. Pagamento',
  PRE_MATRICULA:        'Pré-Matrícula',
  MATRICULADO:          'Matriculado',
  ATIVO:                'Ativo',
  TRANCADO:             'Trancado',
  CANCELADO:            'Cancelado',
};

export default function MinhasMatriculas() {
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    fetch('/api/comercial/matriculas', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setAlunos(Array.isArray(data) ? data : []))
      .finally(() => setCarregando(false));
  }, []);

  const filtrados = alunos.filter(a => {
    const matchBusca = !busca ||
      a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(busca.toLowerCase()) ||
      (a.curso_interesse || '').toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || a.statusmatricula === filtroStatus;
    return matchBusca && matchStatus;
  });

  const statusUnicos = [...new Set(alunos.map(a => a.statusmatricula).filter(Boolean))];

  return (
    <ComercialLayout titulo="Minhas Matrículas">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Minhas Matrículas</h2>
        <span className="text-sm text-gray-500">
          {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou curso..."
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
          {statusUnicos.map(s => (
            <option key={s} value={s}>{LABELS_MATRICULA[s] || s}</option>
          ))}
        </select>
      </div>

      {/* Legenda do funil */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-xs text-gray-400 mr-1 self-center">Etapas:</span>
        {[
          { key: 'AGUARDANDO_PAGAMENTO', label: 'Aguard. Pagamento' },
          { key: 'PRE_MATRICULA',        label: 'Pré-Matrícula' },
          { key: 'MATRICULADO',          label: 'Matriculado' },
        ].map(({ key, label }) => (
          <span key={key} className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGES_MATRICULA[key]}`}>
            {label}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {carregando ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {alunos.length === 0
              ? 'Nenhuma pré-matrícula captada ainda. Converta um lead para começar.'
              : 'Nenhum registro encontrado com esse filtro.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Aluno</th>
                <th className="px-4 py-3 text-left">Curso de Interesse</th>
                <th className="px-4 py-3 text-left">Status Matrícula</th>
                <th className="px-4 py-3 text-left">Pagamento</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(aluno => {
                const statusLabel  = LABELS_MATRICULA[aluno.statusmatricula] || aluno.statusmatricula || '—';
                const statusClass  = BADGES_MATRICULA[aluno.statusmatricula] || 'bg-gray-100 text-gray-600';
                const pago         = aluno.statusmatricula === 'MATRICULADO' || aluno.statusmatricula === 'ATIVO';
                const semCobranca  = !aluno.statusmatricula || aluno.statusmatricula === 'PRE_MATRICULA';

                return (
                  <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{aluno.nome}</div>
                      <div className="text-xs text-gray-400">{aluno.email || '—'}</div>
                      {/* WhatsApp link */}
                      {aluno.telefone_celular && (
                        <a
                          href={`https://wa.me/55${aluno.telefone_celular.replace(/\D/g,'')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline"
                        >
                          📲 WhatsApp
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{aluno.curso_interesse || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {semCobranca ? (
                        <span className="text-xs text-gray-400">Não gerado</span>
                      ) : pago ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Pago</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pendente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {aluno.created_at ? new Date(aluno.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/comercial/leads`}
                        className="text-xs text-teal-600 hover:underline">
                        Ver Lead
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </ComercialLayout>
  );
}
