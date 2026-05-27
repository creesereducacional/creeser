import { useState, useCallback, useEffect } from 'react';

const PERFIS = [
  { value: 'grupo_admin',       label: 'Admin Geral (Grupo)' },
  { value: 'instituicao_admin', label: 'Admin Instituicao' },
  { value: 'financeiro',        label: 'Financeiro' },
  { value: 'secretaria',        label: 'Secretaria' },
  { value: 'recepcao',          label: 'Recepcao' },
  { value: 'comercial',         label: 'Comercial' },
  { value: 'professor',         label: 'Professor' },
  { value: 'aluno',             label: 'Aluno' },
];

const TIPOS = [
  { value: 'admin',     label: 'Admin' },
  { value: 'usuario',   label: 'Usuario' },
  { value: 'professor', label: 'Professor' },
  { value: 'aluno',     label: 'Aluno' },
];

const FORM_INICIAL = {
  nomeCompleto: '',
  email: '',
  senha: '',
  tipo: 'usuario',
  perfil: 'secretaria',
  status: 'ativo',
  whatsapp: '',
};

function labelPerfil(perfil) {
  return PERFIS.find(p => p.value === perfil)?.label || perfil || '-';
}

function labelTipo(tipo) {
  if (!tipo) return '-';
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [confirmacao, setConfirmacao] = useState(null);

  const buscarUsuarios = useCallback(async () => {
    try {
      setCarregando(true);
      setErro('');
      const res = await fetch('/api/usuarios', { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erro ${res.status}`);
      }
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { buscarUsuarios(); }, [buscarUsuarios]);

  const abrirNovo = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setErroForm('');
    setMostrarForm(true);
  };

  const abrirEditar = (u) => {
    setForm({
      nomeCompleto: u.nomecompleto || u.nomeCompleto || '',
      email:        u.email || '',
      senha:        '',
      tipo:         u.tipo || 'usuario',
      perfil:       u.perfil || 'secretaria',
      status:       u.status || 'ativo',
      whatsapp:     u.whatsapp || '',
    });
    setEditandoId(u.id);
    setErroForm('');
    setMostrarForm(true);
  };

  const fecharForm = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setErroForm('');
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroForm('');
    if (!form.nomeCompleto.trim()) return setErroForm('Nome e obrigatorio');
    if (!form.email.trim()) return setErroForm('Email e obrigatorio');
    if (!editandoId && !form.senha.trim()) return setErroForm('Senha e obrigatoria para novo usuario');

    setSalvando(true);
    try {
      const payload = {
        nomeCompleto: form.nomeCompleto.trim(),
        email:        form.email.trim(),
        tipo:         form.tipo,
        perfil:       form.perfil,
        status:       form.status,
        whatsapp:     form.whatsapp || '',
      };
      if (form.senha.trim()) payload.senha = form.senha.trim();

      const url    = editandoId ? `/api/usuarios?id=${editandoId}` : '/api/usuarios';
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status}`);

      fecharForm();
      buscarUsuarios();
    } catch (e) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (u) => {
    const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    try {
      const res = await fetch(`/api/usuarios?id=${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Erro ${res.status}`);
      }
      buscarUsuarios();
    } catch (e) {
      alert('Erro ao alterar status: ' + e.message);
    }
  };

  const excluirUsuario = (u) => {
    setConfirmacao({
      mensagem: `Excluir "${u.nomecompleto || u.email}"? Esta acao nao pode ser desfeita.`,
      onConfirmar: async () => {
        setConfirmacao(null);
        try {
          const res = await fetch(`/api/usuarios?id=${u.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.error || `Erro ${res.status}`);
          }
          buscarUsuarios();
        } catch (e) {
          alert('Erro ao excluir: ' + e.message);
        }
      },
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={mostrarForm ? fecharForm : abrirNovo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
        >
          {mostrarForm ? 'x Cancelar' : '+ Novo Usuario'}
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {erro}
        </div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            {editandoId ? 'Editar Usuario' : 'Novo Usuario'}
          </h2>

          {erroForm && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {erroForm}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo *</label>
              <input
                name="nomeCompleto"
                value={form.nomeCompleto}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {editandoId ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial *'}
              </label>
              <input
                name="senha"
                type="password"
                value={form.senha}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder={editandoId ? 'Deixe em branco para nao alterar' : 'Senha inicial'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Perfil de Acesso</label>
              <select
                name="perfil"
                value={form.perfil}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {PERFIS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp</label>
              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={salvando}
                className="px-5 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Criar Usuario'}
              </button>
              <button
                type="button"
                onClick={fecharForm}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {carregando ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">Carregando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">Nenhum usuario cadastrado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 hidden md:table-cell">Perfil</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 hidden sm:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.nomecompleto || u.nomeCompleto || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{labelPerfil(u.perfil)}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{labelTipo(u.tipo)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${u.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => abrirEditar(u)}
                          className="px-3 py-1 bg-teal-600 text-white rounded text-xs font-semibold hover:bg-teal-700 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => alternarStatus(u)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${u.status === 'ativo' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                        >
                          {u.status === 'ativo' ? 'Inativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => excluirUsuario(u)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Confirmar exclusao</h3>
            <p className="text-gray-600 mb-6">{confirmacao.mensagem}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmacao(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmacao.onConfirmar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
