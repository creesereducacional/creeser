import { useState, useCallback, useEffect } from 'react';

const formatarWhatsapp = (value) => {
  if (!value) return '';
  const limpo = String(value).replace(/\D/g, '');
  if (limpo.length <= 2) {
    return limpo;
  }
  if (limpo.length <= 6) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
  }
  if (limpo.length <= 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`;
};

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
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'professor',   label: 'Professor' },
  { value: 'aluno',       label: 'Aluno' },
];

const FORM_INICIAL = {
  nomeCompleto: '',
  email: '',
  senha: '',
  tipo: 'funcionario',
  perfil: 'secretaria',
  status: 'ativo',
  whatsapp: '',
  instituicao_id: '',
  unidade_id: '',
  vinculos: [],
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
  const [carregandoOperador, setCarregandoOperador] = useState(true);
  const [perfisFiltrados, setPerfisFiltrados] = useState([]);
  const [tiposFiltrados, setTiposFiltrados] = useState([]);

  const [operadorPerfil, setOperadorPerfil] = useState('');
  const [operadorInstituicaoId, setOperadorInstituicaoId] = useState(null);
  const [listaInstituicoes, setListaInstituicoes] = useState([]);
  const [todasUnidades, setTodasUnidades] = useState([]);
  const [carregandoUnidades, setCarregandoUnidades] = useState(false);

  // Estados locais para adicionar novo vínculo no formulário
  const [novoVincInstId, setNovoVincInstId] = useState('');
  const [novoVincUnidadeId, setNovoVincUnidadeId] = useState('');
  const [erroVinculo, setErroVinculo] = useState('');

  const buscarOperador = async () => {
    try {
      setCarregandoOperador(true);
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const rawP = String(data?.usuario?.perfil || data?.usuario?.tipo || '').toLowerCase();
        const mapP = (p) => {
          if (p === 'admin') return 'instituicao_admin';
          if (p === 'financeiro_admin') return 'financeiro';
          if (p === 'comercial_master') return 'comercial';
          return p;
        };
        const opPerfil = mapP(rawP);
        setOperadorPerfil(opPerfil);
        setOperadorInstituicaoId(data?.usuario?.instituicao_id || null);
        
        let pFiltrados = [];
        if (opPerfil === 'grupo_admin') {
          pFiltrados = PERFIS;
        } else if (opPerfil === 'instituicao_admin') {
          pFiltrados = PERFIS.filter(p => p.value !== 'grupo_admin' && p.value !== 'instituicao_admin');
        } else if (opPerfil === 'coordenador') {
          pFiltrados = PERFIS.filter(p => p.value === 'professor' || p.value === 'aluno');
        } else if (opPerfil === 'secretaria') {
          pFiltrados = PERFIS.filter(p => p.value === 'aluno');
        }
        
        setPerfisFiltrados(pFiltrados);

        const perfisPermitidosVal = pFiltrados.map(p => p.value);
        const tFiltrados = [];
        
        if (perfisPermitidosVal.some(p => p !== 'professor' && p !== 'aluno')) {
          tFiltrados.push({ value: 'funcionario', label: 'Funcionário' });
        }
        if (perfisPermitidosVal.includes('professor')) {
          tFiltrados.push({ value: 'professor', label: 'Professor' });
        }
        if (perfisPermitidosVal.includes('aluno')) {
          tFiltrados.push({ value: 'aluno', label: 'Aluno' });
        }

        setTiposFiltrados(tFiltrados);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoOperador(false);
    }
  };

  const carregarInstituicoes = async () => {
    try {
      const res = await fetch('/api/instituicoes', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setListaInstituicoes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar instituições:', err);
    }
  };

  const carregarTodasUnidades = async () => {
    try {
      setCarregandoUnidades(true);
      const res = await fetch('/api/unidades', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTodasUnidades(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar unidades:', err);
    } finally {
      setCarregandoUnidades(false);
    }
  };

  useEffect(() => {
    buscarOperador();
    carregarInstituicoes();
    carregarTodasUnidades();
  }, []);

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
    let initialVinculos = [];
    if (operadorInstituicaoId) {
      const instNome = listaInstituicoes.find(i => String(i.id) === String(operadorInstituicaoId))?.nome || 'Instituição Atual';
      initialVinculos = [{
        instituicao_id: operadorInstituicaoId,
        instituicao_nome: instNome,
        unidade_id: null,
        unidade_nome: null,
        is_matriz: false,
      }];
    }

    setForm({
      ...FORM_INICIAL,
      instituicao_id: operadorInstituicaoId || '',
      unidade_id: '',
      vinculos: initialVinculos,
    });
    setNovoVincInstId(operadorInstituicaoId ? '' : '');
    setNovoVincUnidadeId('');
    setErroVinculo('');
    setEditandoId(null);
    setErroForm('');
    setMostrarForm(true);
  };

  const abrirEditar = (u) => {
    let tipoResolvido = u.tipo || 'funcionario';
    if (tipoResolvido === 'admin' || tipoResolvido === 'usuario') {
      tipoResolvido = 'funcionario';
    }

    // Normalizar vínculos do usuário
    let vinculosResolvidos = [];
    if (Array.isArray(u.vinculos) && u.vinculos.length > 0) {
      vinculosResolvidos = u.vinculos.map(v => {
        const instId = v.instituicao_id;
        const instNome = listaInstituicoes.find(i => String(i.id) === String(instId))?.nome || `Instituição #${instId}`;
        const unid = todasUnidades.find(un => String(un.id) === String(v.unidade_id));
        const unidNome = v.unidade_nome || unid?.nome || null;
        const isMatriz = v.is_matriz !== undefined ? Boolean(v.is_matriz) : Boolean(unid?.isMatriz || unid?.is_matriz);
        return {
          instituicao_id: instId,
          instituicao_nome: instNome,
          unidade_id: v.unidade_id != null ? Number(v.unidade_id) : null,
          unidade_nome: unidNome,
          is_matriz: isMatriz,
        };
      });
    } else if (u.instituicao_id) {
      const instNome = listaInstituicoes.find(i => String(i.id) === String(u.instituicao_id))?.nome || `Instituição #${u.instituicao_id}`;
      const unid = todasUnidades.find(un => String(un.id) === String(u.unidade_id));
      vinculosResolvidos = [{
        instituicao_id: u.instituicao_id,
        instituicao_nome: instNome,
        unidade_id: u.unidade_id != null ? Number(u.unidade_id) : null,
        unidade_nome: unid?.nome || null,
        is_matriz: Boolean(unid?.isMatriz || unid?.is_matriz),
      }];
    }

    const primeiroVinculo = vinculosResolvidos[0] || null;
    const instIdResolvida = primeiroVinculo?.instituicao_id || u.instituicao_id || operadorInstituicaoId || '';
    const unidadeIdResolvida = primeiroVinculo?.unidade_id != null ? String(primeiroVinculo.unidade_id) : '';

    setForm({
      nomeCompleto:   u.nomecompleto || u.nomeCompleto || '',
      email:          u.email || '',
      senha:          '',
      tipo:           tipoResolvido,
      perfil:         u.perfil || 'secretaria',
      status:         u.status || 'ativo',
      whatsapp:       formatarWhatsapp(u.whatsapp || ''),
      instituicao_id: instIdResolvida,
      unidade_id:     unidadeIdResolvida,
      vinculos:       vinculosResolvidos,
    });
    setNovoVincInstId('');
    setNovoVincUnidadeId('');
    setErroVinculo('');
    setEditandoId(u.id);
    setErroForm('');
    setMostrarForm(true);
  };

  const fecharForm = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setErroForm('');
    setErroVinculo('');
    setNovoVincInstId('');
    setNovoVincUnidadeId('');
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'whatsapp') {
      value = formatarWhatsapp(value);
    }
    
    setForm(f => {
      const novoForm = { ...f, [name]: value };

      // Regra condicional: se alterar o Tipo, definir o perfil automaticamente
      if (name === 'tipo') {
        if (value === 'professor') {
          novoForm.perfil = 'professor';
        } else if (value === 'aluno') {
          novoForm.perfil = 'aluno';
        } else if (value === 'funcionario') {
          if (f.perfil === 'professor' || f.perfil === 'aluno') {
            const primeiroAdmin = perfisFiltrados.find(p => p.value !== 'professor' && p.value !== 'aluno');
            novoForm.perfil = primeiroAdmin ? primeiroAdmin.value : 'secretaria';
          }
        }
      }
      return novoForm;
    });
  };

  const handleAdicionarVinculo = () => {
    setErroVinculo('');
    const instId = operadorPerfil === 'grupo_admin' ? novoVincInstId : (operadorInstituicaoId || novoVincInstId);

    if (!instId) {
      setErroVinculo('Selecione uma instituição para vincular.');
      return;
    }

    // Regra 5: Uma mesma instituição não pode ser adicionada duas vezes ao mesmo usuário
    const jaExiste = (form.vinculos || []).some(v => String(v.instituicao_id) === String(instId));
    if (jaExiste) {
      setErroVinculo('Esta instituição já está vinculada a este usuário.');
      return;
    }

    const instObj = listaInstituicoes.find(i => String(i.id) === String(instId));
    const instNome = instObj?.nome || `Instituição #${instId}`;

    let unidObj = null;
    let unidIdNum = null;
    let unidNome = null;
    let isMatriz = false;

    if (novoVincUnidadeId) {
      unidObj = todasUnidades.find(u => String(u.id) === String(novoVincUnidadeId));
      if (unidObj) {
        unidIdNum = Number(unidObj.id);
        unidNome = unidObj.nome;
        isMatriz = Boolean(unidObj.isMatriz || unidObj.is_matriz);
      }
    }

    const novoVinculo = {
      instituicao_id: instId,
      instituicao_nome: instNome,
      unidade_id: unidIdNum,
      unidade_nome: unidNome,
      is_matriz: isMatriz,
    };

    setForm(f => {
      const novos = [...(f.vinculos || []), novoVinculo];
      return {
        ...f,
        vinculos: novos,
        instituicao_id: novos[0]?.instituicao_id || '',
        unidade_id: novos[0]?.unidade_id != null ? String(novos[0].unidade_id) : '',
      };
    });

    setNovoVincInstId('');
    setNovoVincUnidadeId('');
  };

  const handleRemoverVinculo = (indexParaRemover) => {
    setForm(f => {
      const novos = (f.vinculos || []).filter((_, idx) => idx !== indexParaRemover);
      return {
        ...f,
        vinculos: novos,
        instituicao_id: novos[0]?.instituicao_id || '',
        unidade_id: novos[0]?.unidade_id != null ? String(novos[0].unidade_id) : '',
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroForm('');
    if (!form.nomeCompleto.trim()) return setErroForm('Nome é obrigatório');
    if (!form.email.trim()) return setErroForm('Email é obrigatório');
    if (!editandoId && !form.senha.trim()) return setErroForm('Senha é obrigatória para novo usuário');

    // Validação de Vínculos
    const vinculosList = form.vinculos || [];
    if (vinculosList.length === 0 && !form.instituicao_id && !operadorInstituicaoId) {
      return setErroForm('É obrigatório adicionar ao menos um vínculo institucional.');
    }

    setSalvando(true);
    try {
      const primVinc = vinculosList[0] || null;
      const finalInstId = primVinc?.instituicao_id || form.instituicao_id || operadorInstituicaoId || null;
      const finalUnidadeId = primVinc ? (primVinc.unidade_id != null ? Number(primVinc.unidade_id) : null) : (form.unidade_id !== '' && form.unidade_id != null ? Number(form.unidade_id) : null);

      const payload = {
        nomeCompleto:   form.nomeCompleto.trim(),
        email:          form.email.trim(),
        tipo:           form.tipo,
        perfil:         form.perfil,
        status:         form.status,
        whatsapp:       (form.whatsapp || '').replace(/\D/g, ''),
        instituicao_id: finalInstId,
        unidade_id:     finalUnidadeId,
        vinculos:       vinculosList,
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
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error || `Erro ${res.status}`);
          buscarUsuarios();
        } catch (e) {
          alert('Erro ao excluir: ' + e.message);
        }
      },
    });
  };

  // Unidades disponíveis para a instituição selecionada no painel de novo vínculo
  const instSelecionadaParaNovoVinculo = operadorPerfil === 'grupo_admin' ? novoVincInstId : (operadorInstituicaoId || novoVincInstId);
  const unidadesFiltradasNovoVinculo = todasUnidades.filter(
    u => String(u.instituicaoId) === String(instSelecionadaParaNovoVinculo) || String(u.instituicao_id) === String(instSelecionadaParaNovoVinculo)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuarios</h1>
          <p className="text-sm text-gray-500">Cadastre e gerencie os acessos do sistema</p>
        </div>
        <button
          onClick={abrirNovo}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <span>+</span> Novo Usuario
        </button>
      </div>

      {erro && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {erro}
        </div>
      )}

      {mostrarForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {editandoId ? 'Editar Usuario' : 'Novo Usuario'}
            </h2>
            <button
              onClick={fecharForm}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>
          </div>

          {erroForm && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {erroForm}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nomeCompleto"
                value={form.nomeCompleto}
                onChange={handleChange}
                placeholder="Ex: Maria Silva"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Ex: maria@exemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Senha {editandoId ? '(deixe em branco para manter)' : '*'}
              </label>
              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                placeholder={editandoId ? 'Manter senha atual' : 'Senha de acesso'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tipo *
              </label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {tiposFiltrados.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Perfil de Acesso *
              </label>
              <select
                name="perfil"
                value={form.perfil}
                onChange={handleChange}
                disabled={form.tipo === 'professor' || form.tipo === 'aluno'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                {perfisFiltrados.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
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

            {/* SEÇÃO: VÍNCULOS INSTITUCIONAIS */}
            <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-gray-800">Vínculos Institucionais</h3>
                  <p className="text-xs text-gray-500">
                    Defina as instituições e unidades às quais o usuário tem acesso. Uma mesma instituição não pode ser adicionada duas vezes.
                  </p>
                </div>
              </div>

              {erroVinculo && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs">
                  {erroVinculo}
                </div>
              )}

              {/* Tabela de vínculos já cadastrados */}
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 bg-gray-50">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Instituição</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Unidade (Escopo)</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {(!form.vinculos || form.vinculos.length === 0) ? (
                      <tr>
                        <td colSpan="3" className="px-3 py-4 text-center text-xs text-gray-500 italic">
                          Nenhum vínculo configurado. Adicione ao menos um vínculo abaixo.
                        </td>
                      </tr>
                    ) : (
                      form.vinculos.map((v, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800 font-medium text-xs">
                            {v.instituicao_nome || `Instituição #${v.instituicao_id}`}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {v.unidade_nome ? (
                              <span className={v.is_matriz ? 'font-bold text-teal-700' : 'text-gray-700'}>
                                {v.is_matriz ? `⭐ ${v.unidade_nome} (Matriz - Acesso Total)` : `${v.unidade_nome} (Filial)`}
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium">Sem unidade (Pendente / Acesso Geral)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoverVinculo(idx)}
                              className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded text-xs font-semibold transition-colors"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Caixa para adicionar novo vínculo */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <h4 className="text-xs font-bold text-teal-900 mb-2 uppercase tracking-wide">
                  + Adicionar Vínculo Institucional
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Seletor de Instituição */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Instituição *
                    </label>
                    {operadorPerfil === 'grupo_admin' ? (
                      <select
                        value={novoVincInstId}
                        onChange={(e) => {
                          setNovoVincInstId(e.target.value);
                          setNovoVincUnidadeId('');
                          setErroVinculo('');
                        }}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        <option value="">Selecione uma instituição...</option>
                        {listaInstituicoes.map(inst => {
                          const jaVinculada = (form.vinculos || []).some(v => String(v.instituicao_id) === String(inst.id));
                          return (
                            <option key={inst.id} value={inst.id} disabled={jaVinculada}>
                              {inst.nome} {jaVinculada ? '(Já adicionada)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={listaInstituicoes.find(i => String(i.id) === String(operadorInstituicaoId))?.nome || 'Instituição Atual'}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded bg-gray-100 text-gray-700 text-sm"
                      />
                    )}
                  </div>

                  {/* Seletor de Unidade */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Unidade Vinculada (Escopo)
                    </label>
                    <select
                      value={novoVincUnidadeId}
                      onChange={(e) => setNovoVincUnidadeId(e.target.value)}
                      disabled={carregandoUnidades || (!instSelecionadaParaNovoVinculo)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-gray-100"
                    >
                      <option value="">-- Sem unidade (Pendente / Acesso Geral) --</option>
                      {unidadesFiltradasNovoVinculo.map(unid => (
                        <option key={unid.id} value={unid.id}>
                          {unid.isMatriz || unid.is_matriz ? `⭐ ${unid.nome} (MATRIZ - Acesso Total)` : `${unid.nome} (Filial)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botão de Adicionar */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAdicionarVinculo}
                      disabled={!instSelecionadaParaNovoVinculo}
                      className="w-full px-3 py-1.5 bg-teal-600 text-white rounded text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
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
        <div className="text-center py-12 text-gray-500">Carregando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          Nenhum usuario encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 hidden md:table-cell">Perfil</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 hidden sm:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 hidden lg:table-cell">Vínculos (Escopo)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => {
                  const vinculosUsuario = Array.isArray(u.vinculos) && u.vinculos.length > 0 ? u.vinculos : null;
                  return (
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
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">
                        {vinculosUsuario ? (
                          <div className="flex flex-col gap-1 max-w-xs">
                            {vinculosUsuario.map((v, vIdx) => (
                              <div key={vIdx} className="leading-tight">
                                {v.unidade_nome ? (
                                  <span className={v.is_matriz ? 'font-bold text-teal-700' : 'text-gray-700'}>
                                    {v.is_matriz ? `⭐ ${v.unidade_nome} (Matriz)` : v.unidade_nome}
                                  </span>
                                ) : (
                                  <span className="text-yellow-600 font-medium">⏳ Pendente</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Legado</span>
                        )}
                      </td>
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
                  );
                })}
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
