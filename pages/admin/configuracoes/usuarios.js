import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';

export default function GerenciarUsuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    tipo: 'PROFESSOR',
    ativo: true
  });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const res = await fetch('/api/configuracoes/usuarios');
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarUsuario = async (e) => {
    e.preventDefault();
    
    if (!novoUsuario.nome || !novoUsuario.email) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch('/api/configuracoes/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUsuario)
      });

      if (res.ok) {
        alert('Usuário adicionado com sucesso');
        setNovoUsuario({ nome: '', email: '', tipo: 'PROFESSOR', ativo: true });
        carregarUsuarios();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar usuário');
    }
  };

  const handleDeletarUsuario = async (email) => {
    if (!confirm(`Deseja deletar o usuário ${email}?`)) return;

    try {
      const res = await fetch(`/api/configuracoes/usuarios?email=${email}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Usuário deletado com sucesso');
        carregarUsuarios();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao deletar usuário');
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 text-center">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Gerenciar Usuários</h1>

        {/* Formulário Novo Usuário */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h3 className="text-sm font-bold text-teal-600 mb-4">➕ Novo Usuário</h3>
          
          <form onSubmit={handleAdicionarUsuario} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME *</label>
                <input
                  type="text"
                  value={novoUsuario.nome}
                  onChange={(e) => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">EMAIL *</label>
                <input
                  type="email"
                  value={novoUsuario.email}
                  onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TIPO *</label>
                <select
                  value={novoUsuario.tipo}
                  onChange={(e) => setNovoUsuario({...novoUsuario, tipo: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="PROFESSOR">Professor</option>
                  <option value="ALUNO">Aluno</option>
                  <option value="ADMIN">Admin</option>
                  <option value="COORDENADOR">Coordenador</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                >
                  ➕ Adicionar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            />
            <button
              onClick={() => setFiltro('')}
              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
            >
              🔍
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-teal-100 border-b border-teal-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Email</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-teal-800">Status</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-teal-800">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-teal-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-800">{usuario.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{usuario.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                      {usuario.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      usuario.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeletarUsuario(usuario.email)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuariosFiltrados.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </div>

        {/* Voltar */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/admin/configuracoes')}
            className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
