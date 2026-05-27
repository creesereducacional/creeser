/**
 * /comercial/equipe — Gestão de Operadores Comerciais
 *
 * Acessível por: comercial_master, grupo_admin, instituicao_admin, admin
 * Bloqueado para: comercial_operador
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import ComercialLayout from '@/components/ComercialLayout';

// ── Helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    ativo:   { cls: 'bg-green-100 text-green-800', label: 'Ativo' },
    inativo: { cls: 'bg-red-100 text-red-800',     label: 'Inativo' },
  }[status?.toLowerCase()] || { cls: 'bg-gray-100 text-gray-600', label: status || '—' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Modal: Criar Operador ──────────────────────────────────────────────────

function ModalCriar({ onClose, onSalvo }) {
  const [form, setForm] = useState({ nomeCompleto: '', email: '', whatsapp: '', senha_inicial: '', confirmar_senha: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    if (!form.nomeCompleto.trim() || !form.email.trim() || !form.senha_inicial.trim()) {
      setErro('Nome, email e senha são obrigatórios.');
      return;
    }
    if (form.senha_inicial !== form.confirmar_senha) {
      setErro('As senhas não coincidem.');
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch('/api/comercial/equipe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error || 'Erro ao criar operador.'); return; }
      onSalvo(json.operador);
      onClose();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-bold text-gray-800">Novo Operador Comercial</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {erro && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{erro}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
              <input type="text" value={form.nomeCompleto} onChange={e => setForm(f => ({ ...f, nomeCompleto: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                placeholder="Nome do operador" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input type="text" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                placeholder="(99) 99999-9999" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial *</label>
              <input type="password" value={form.senha_inicial} onChange={e => setForm(f => ({ ...f, senha_inicial: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                placeholder="Senha que o operador usará no primeiro acesso" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repetir Senha *</label>
              <input type="password" value={form.confirmar_senha} onChange={e => setForm(f => ({ ...f, confirmar_senha: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-500 ${
                  form.confirmar_senha && form.confirmar_senha !== form.senha_inicial
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Repita a senha" />
              {form.confirmar_senha && form.confirmar_senha !== form.senha_inicial && (
                <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Compartilhe esta senha com o operador após criar.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="px-5 py-2 text-sm bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-60">
              {salvando ? 'Criando...' : 'Criar Operador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Editar Operador ─────────────────────────────────────────────────

function ModalEditar({ operador, onClose, onSalvo }) {
  const [form, setForm] = useState({
    nomeCompleto: operador.nomecompleto || '',
    email:        operador.email || '',
    whatsapp:     operador.whatsapp || '',
  });
  const [novaSenha, setNovaSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);
    try {
      const body = {
        nomeCompleto: form.nomeCompleto,
        email:        form.email,
        whatsapp:     form.whatsapp,
      };
      if (novaSenha.trim()) body.nova_senha = novaSenha.trim();

      const res = await fetch(`/api/comercial/equipe/${operador.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error || 'Erro ao atualizar.'); return; }
      setSucesso('Operador atualizado com sucesso.');
      onSalvo(json.operador);
      setTimeout(onClose, 1200);
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-bold text-gray-800">Editar Operador</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {erro    && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{erro}</div>}
            {sucesso && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">{sucesso}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" value={form.nomeCompleto} onChange={e => setForm(f => ({ ...f, nomeCompleto: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input type="text" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha (opcional)</label>
              <input type="text" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                placeholder="Deixe em branco para manter a senha atual" />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="px-5 py-2 text-sm bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-60">
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página Principal ───────────────────────────────────────────────────────

export default function EquipeComericalPage() {
  const router = useRouter();
  const [operadores, setOperadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [msg, setMsg] = useState(null);
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [aguardando, setAguardando] = useState({});

  // Verificar perfil — operador deve ser redirecionado
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.usuario) { router.replace('/login'); return; }
        const p = String(data.usuario.perfil || data.usuario.tipo || '').toLowerCase();
        if (p === 'comercial_operador') {
          router.replace('/comercial/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  const carregar = useCallback(() => {
    setCarregando(true);
    fetch('/api/comercial/equipe', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setOperadores(data);
        else setErro(data.error || 'Erro ao carregar.');
      })
      .catch(() => setErro('Erro de conexão.'))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleToggleStatus = async (op) => {
    const novoStatus = op.status === 'ativo' ? 'inativo' : 'ativo';
    setAguardando(a => ({ ...a, [op.id]: true }));
    try {
      const res = await fetch(`/api/comercial/equipe/${op.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json();
      if (!res.ok) { setMsg({ tipo: 'erro', texto: json.error || 'Erro.' }); return; }
      setOperadores(prev => prev.map(o => o.id === op.id ? { ...o, status: novoStatus } : o));
      setMsg({ tipo: 'ok', texto: `${op.nomecompleto} ${novoStatus === 'ativo' ? 'ativado' : 'desativado'}.` });
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro de conexão.' });
    } finally {
      setAguardando(a => ({ ...a, [op.id]: false }));
    }
  };

  const handleSalvo = (atualizado) => {
    setOperadores(prev => prev.map(o => o.id === atualizado.id ? atualizado : o));
    setMsg({ tipo: 'ok', texto: 'Operador atualizado.' });
  };

  const handleCriado = (novo) => {
    setOperadores(prev => [...prev, novo]);
    setMsg({ tipo: 'ok', texto: `Operador "${novo.nomecompleto}" criado com sucesso.` });
  };

  return (
    <ComercialLayout titulo="Equipe Comercial">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Equipe Comercial</h2>
            <p className="text-sm text-gray-500 mt-0.5">Gerencie seus operadores comerciais</p>
          </div>
          <button onClick={() => setModalCriar(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2.5 rounded-lg font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Operador
          </button>
        </div>

        {/* Mensagem de feedback */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
            msg.tipo === 'ok'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {msg.texto}
            <button onClick={() => setMsg(null)} className="ml-3 text-current opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {erro && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{erro}</div>
        )}

        {/* Cards de operadores */}
        <div>
          {carregando ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Carregando...</div>
          ) : operadores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <div className="text-sm font-medium">Nenhum operador cadastrado ainda</div>
              <button onClick={() => setModalCriar(true)}
                className="mt-3 text-teal-600 hover:text-teal-800 text-sm font-medium hover:underline">
                Criar primeiro operador →
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {operadores.map(op => (
              <div key={op.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                    op.status === 'ativo' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {(op.nomecompleto || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 truncate text-sm">{op.nomecompleto}</p>
                      <StatusBadge status={op.status} />
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{op.email || '—'}</p>
                    {op.whatsapp && <p className="text-xs text-gray-400">{op.whatsapp}</p>}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setModalEditar(op)}
                      title="Editar"
                      className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(op)}
                      disabled={aguardando[op.id]}
                      title={op.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      className={`p-2 rounded-xl transition disabled:opacity-50 ${
                        op.status === 'ativo' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                      }`}>
                      {op.status === 'ativo' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats do operador se disponíveis */}
                {(op.totalLeads != null || op.matriculados != null) && (
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-800">{op.totalLeads ?? '—'}</p>
                      <p className="text-xs text-gray-400">Leads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-700">{op.matriculados ?? '—'}</p>
                      <p className="text-xs text-gray-400">Matrículas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-teal-700">{op.taxaConversao != null ? `${op.taxaConversao}%` : '—'}</p>
                      <p className="text-xs text-gray-400">Conversão</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          {operadores.length} operador{operadores.length !== 1 ? 'es' : ''} cadastrado{operadores.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Modais */}
      {modalCriar && (
        <ModalCriar onClose={() => setModalCriar(false)} onSalvo={handleCriado} />
      )}
      {modalEditar && (
        <ModalEditar
          operador={modalEditar}
          onClose={() => setModalEditar(null)}
          onSalvo={handleSalvo}
        />
      )}
    </ComercialLayout>
  );
}
