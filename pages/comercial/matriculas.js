import { useState, useEffect } from 'react';
import ComercialLayout from '@/components/ComercialLayout';

export default function MinhasMatriculas() {
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetch('/api/comercial/matriculas', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setAlunos(Array.isArray(data) ? data : []))
      .finally(() => setCarregando(false));
  }, []);

  const filtrados = alunos.filter(a =>
    !busca ||
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <ComercialLayout titulo="Minhas Matrículas">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Minhas Matrículas</h2>
        <span className="text-sm text-gray-500">
          {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} captado{alunos.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {carregando ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {alunos.length === 0
              ? 'Nenhuma matrícula captada ainda. Converta um lead em aluno para começar.'
              : 'Nenhum aluno encontrado com esse filtro.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">Data de Matrícula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(aluno => (
                <tr key={aluno.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{aluno.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{aluno.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{aluno.telefone_celular || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {aluno.created_at ? new Date(aluno.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ComercialLayout>
  );
}
