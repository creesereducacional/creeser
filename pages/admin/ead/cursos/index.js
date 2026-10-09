import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import RichTextEditor from '@/components/RichTextEditor';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';

export default function AdminCursosEADPage() {
  const { usuario, carregando: carregandoAuth } = useAuth({
    tiposPermitidos: ['grupo_admin', 'instituicao_admin', 'coordenador', 'admin'],
    redirectTo: '/login'
  });

  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('TODOS'); // 'TODOS' | 'ATIVO' | 'RASCUNHO'

  // Navegação hierárquica: lista -> curso -> modulo -> aula
  const [visualizacao, setVisualizacao] = useState('lista');
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [moduloSelecionado, setModuloSelecionado] = useState(null);
  const [aulaSelecionada, setAulaSelecionada] = useState(null);

  // Controle de formulários modais
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoForm, setTipoForm] = useState(''); // 'curso' | 'modulo' | 'aula' | 'material'
  const [modoEdicao, setModoEdicao] = useState(false);
  const [formData, setFormData] = useState({});

  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // Modal de confirmação / feedback
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: null
  });

  useEffect(() => {
    if (!carregandoAuth && usuario) {
      carregarCursos();
    }
  }, [carregandoAuth, usuario]);

  const carregarCursos = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/admin/ead/cursos');
      if (res.ok) {
        const data = await res.json();
        setCursos(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json().catch(() => ({}));
        mostrarFeedback('Erro', err.error || 'Erro ao carregar cursos EAD', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar cursos EAD:', error);
      mostrarFeedback('Erro', 'Falha na comunicação com o servidor', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const mostrarFeedback = (title, message, type = 'success', onConfirm = null) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  // KPIs
  const indicadores = useMemo(() => {
    const total = cursos.length;
    const publicados = cursos.filter(c => c.ativo !== false).length;
    const rascunhos = total - publicados;
    return { total, publicados, rascunhos };
  }, [cursos]);

  // Cursos filtrados
  const cursosFiltrados = useMemo(() => {
    return cursos.filter(c => {
      const matchBusca = (c.titulo || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.categoria || '').toLowerCase().includes(busca.toLowerCase());
      
      const isPublicado = c.ativo !== false;
      const matchSituacao =
        filtroSituacao === 'TODOS' ||
        (filtroSituacao === 'ATIVO' && isPublicado) ||
        (filtroSituacao === 'RASCUNHO' && !isPublicado);

      return matchBusca && matchSituacao;
    });
  }, [cursos, busca, filtroSituacao]);

  const abrirFormulario = (tipo, dadosExistentes = null) => {
    setTipoForm(tipo);
    if (dadosExistentes) {
      setFormData({ ...dadosExistentes });
      setModoEdicao(true);
    } else {
      setFormData({});
      setModoEdicao(false);
    }
    setMostrarForm(true);
  };

  // 1. Submit Curso
  const handleSubmitCurso = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicao) {
        const res = await fetch('/api/admin/ead/cursos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: formData.id,
            action: 'updateCurso',
            data: formData
          })
        });
        if (res.ok) {
          const cursoAtualizado = await res.json();
          await carregarCursos();
          if (cursoSelecionado && String(cursoSelecionado.id) === String(formData.id)) {
            setCursoSelecionado(cursoAtualizado);
          }
          setMostrarForm(false);
          mostrarFeedback('Sucesso!', 'Curso EAD atualizado com sucesso!', 'success');
        } else {
          const err = await res.json().catch(() => ({}));
          mostrarFeedback('Erro', err.error || 'Erro ao atualizar curso', 'error');
        }
      } else {
        const res = await fetch('/api/admin/ead/cursos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          await carregarCursos();
          setMostrarForm(false);
          mostrarFeedback('Sucesso!', 'Curso EAD criado com sucesso!', 'success');
        } else {
          const err = await res.json().catch(() => ({}));
          mostrarFeedback('Erro', err.error || 'Erro ao criar curso', 'error');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      mostrarFeedback('Erro', 'Falha ao salvar curso. Tente novamente.', 'error');
    }
  };

  // 2. Submit Módulo
  const handleSubmitModulo = async (e) => {
    e.preventDefault();
    try {
      const action = modoEdicao ? 'updateModulo' : 'addModulo';
      const targetModuloId = formData.id || (moduloSelecionado ? moduloSelecionado.id : null);
      const payloadData = modoEdicao
        ? { moduloId: targetModuloId, updates: { titulo: formData.titulo, descricao: formData.descricao } }
        : { titulo: formData.titulo, descricao: formData.descricao };

      const res = await fetch('/api/admin/ead/cursos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cursoSelecionado.id,
          action,
          data: payloadData
        })
      });

      if (res.ok) {
        const cursoAtualizado = await res.json();
        setCursoSelecionado(cursoAtualizado);
        if (moduloSelecionado) {
          const modAtualizado = cursoAtualizado.modulos?.find(m => String(m.id) === String(targetModuloId));
          if (modAtualizado) setModuloSelecionado(modAtualizado);
        }
        await carregarCursos();
        setMostrarForm(false);
        mostrarFeedback('Sucesso!', modoEdicao ? 'Módulo atualizado!' : 'Módulo adicionado!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        mostrarFeedback('Erro', err.error || 'Erro ao salvar módulo', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      mostrarFeedback('Erro', 'Erro ao salvar módulo.', 'error');
    }
  };

  // 3. Submit Aula
  const handleSubmitAula = async (e) => {
    e.preventDefault();
    try {
      const action = modoEdicao ? 'updateAula' : 'addAula';
      const targetAulaId = formData.id || (aulaSelecionada ? aulaSelecionada.id : null);
      const payloadData = modoEdicao
        ? {
            moduloId: moduloSelecionado.id,
            aulaId: targetAulaId,
            ...formData
          }
        : {
            moduloId: moduloSelecionado.id,
            ...formData
          };

      const res = await fetch('/api/admin/ead/cursos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cursoSelecionado.id,
          action,
          data: payloadData
        })
      });

      if (res.ok) {
        const cursoAtualizado = await res.json();
        setCursoSelecionado(cursoAtualizado);
        const moduloAtualizado = cursoAtualizado.modulos?.find(m => String(m.id) === String(moduloSelecionado.id));
        if (moduloAtualizado) setModuloSelecionado(moduloAtualizado);

        if (modoEdicao) {
          const aulaAtualizada = moduloAtualizado?.aulas?.find(a => String(a.id) === String(targetAulaId));
          if (aulaAtualizada) setAulaSelecionada(aulaAtualizada);
        }

        await carregarCursos();
        setMostrarForm(false);
        mostrarFeedback('Sucesso!', modoEdicao ? 'Aula atualizada!' : 'Aula criada com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        mostrarFeedback('Erro', err.error || 'Erro ao salvar aula', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      mostrarFeedback('Erro', 'Erro ao salvar aula.', 'error');
    }
  };

  // 4. Submit Material
  const handleSubmitMaterial = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ead/cursos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cursoSelecionado.id,
          action: 'addMaterial',
          data: {
            aulaId: aulaSelecionada.id,
            titulo: formData.titulo,
            tipo: formData.tipo || 'pdf',
            url: formData.url
          }
        })
      });

      if (res.ok) {
        const cursoAtualizado = await res.json();
        setCursoSelecionado(cursoAtualizado);
        const moduloAtualizado = cursoAtualizado.modulos?.find(m => String(m.id) === String(moduloSelecionado.id));
        const aulaAtualizada = moduloAtualizado?.aulas?.find(a => String(a.id) === String(aulaSelecionada.id));
        if (moduloAtualizado) setModuloSelecionado(moduloAtualizado);
        if (aulaAtualizada) setAulaSelecionada(aulaAtualizada);

        await carregarCursos();
        setMostrarForm(false);
        mostrarFeedback('Sucesso!', 'Material anexado com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        mostrarFeedback('Erro', err.error || 'Erro ao anexar material', 'error');
      }
    } catch (error) {
      console.error('Erro ao adicionar material:', error);
      mostrarFeedback('Erro', 'Erro ao anexar material.', 'error');
    }
  };

  // Exclusões e status
  const handleTogglePublicacao = (curso) => {
    const novoStatus = curso.ativo === false;
    mostrarFeedback(
      novoStatus ? 'Publicar Curso' : 'Mudar para Rascunho',
      `Deseja ${novoStatus ? 'publicar' : 'despublicar'} o curso "${curso.titulo}" para os alunos?`,
      'confirm',
      async () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch('/api/admin/ead/cursos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: curso.id,
              action: 'updateCurso',
              data: { ativo: novoStatus }
            })
          });
          if (res.ok) {
            await carregarCursos();
            mostrarFeedback('Sucesso!', `Curso ${novoStatus ? 'publicado' : 'definido como rascunho'} com sucesso!`, 'success');
          }
        } catch (e) {
          mostrarFeedback('Erro', 'Falha ao alterar publicação.', 'error');
        }
      }
    );
  };

  const handleDeleteCurso = (id, titulo) => {
    mostrarFeedback(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o curso "${titulo}"? Todos os módulos e aulas serão removidos.`,
      'delete',
      async () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/ead/cursos?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            await carregarCursos();
            mostrarFeedback('Sucesso!', 'Curso excluído com sucesso!', 'success');
          }
        } catch (e) {
          mostrarFeedback('Erro', 'Falha ao excluir curso.', 'error');
        }
      }
    );
  };

  const handleDeleteModulo = (moduloId) => {
    mostrarFeedback(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este módulo e todas as suas aulas?',
      'delete',
      async () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch('/api/admin/ead/cursos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: cursoSelecionado.id,
              action: 'deleteModulo',
              data: { moduloId }
            })
          });
          if (res.ok) {
            const cursoAtualizado = await res.json();
            setCursoSelecionado(cursoAtualizado);
            await carregarCursos();
            mostrarFeedback('Sucesso!', 'Módulo excluído com sucesso!', 'success');
          }
        } catch (e) {
          mostrarFeedback('Erro', 'Falha ao excluir módulo.', 'error');
        }
      }
    );
  };

  const handleDeleteAula = (aulaId) => {
    mostrarFeedback(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta aula?',
      'delete',
      async () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch('/api/admin/ead/cursos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: cursoSelecionado.id,
              action: 'deleteAula',
              data: { moduloId: moduloSelecionado.id, aulaId }
            })
          });
          if (res.ok) {
            const cursoAtualizado = await res.json();
            setCursoSelecionado(cursoAtualizado);
            const moduloAtualizado = cursoAtualizado.modulos?.find(m => String(m.id) === String(moduloSelecionado.id));
            if (moduloAtualizado) setModuloSelecionado(moduloAtualizado);
            await carregarCursos();
            setVisualizacao('modulo');
            mostrarFeedback('Sucesso!', 'Aula excluída com sucesso!', 'success');
          }
        } catch (e) {
          mostrarFeedback('Erro', 'Falha ao excluir aula.', 'error');
        }
      }
    );
  };

  const handleDeleteMaterial = (materialId) => {
    mostrarFeedback(
      'Confirmar Exclusão',
      'Deseja remover este material complementar?',
      'delete',
      async () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch('/api/admin/ead/cursos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: cursoSelecionado.id,
              action: 'deleteMaterial',
              data: {
                aulaId: aulaSelecionada.id,
                materialId
              }
            })
          });
          if (res.ok) {
            const cursoAtualizado = await res.json();
            setCursoSelecionado(cursoAtualizado);
            const moduloAtualizado = cursoAtualizado.modulos?.find(m => String(m.id) === String(moduloSelecionado.id));
            const aulaAtualizada = moduloAtualizado?.aulas?.find(a => String(a.id) === String(aulaSelecionada.id));
            if (moduloAtualizado) setModuloSelecionado(moduloAtualizado);
            if (aulaAtualizada) setAulaSelecionada(aulaAtualizada);
            await carregarCursos();
            mostrarFeedback('Sucesso!', 'Material removido com sucesso!', 'success');
          }
        } catch (e) {
          mostrarFeedback('Erro', 'Falha ao excluir material.', 'error');
        }
      }
    );
  };

  // Upload Thumbnail
  const handleUploadThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas arquivos de imagem');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const dataUpload = new FormData();
      dataUpload.append('file', file);
      const res = await fetch('/api/upload-thumbnail', {
        method: 'POST',
        body: dataUpload
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, thumbnail: data.url }));
      } else {
        alert('Erro ao enviar imagem.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar imagem de capa.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Upload Material
  const handleUploadMaterial = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMaterial(true);
    try {
      const dataUpload = new FormData();
      dataUpload.append('material', file);
      const res = await fetch('/api/upload-material', {
        method: 'POST',
        body: dataUpload
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          url: data.url,
          tipo: data.tipo || 'pdf',
          titulo: prev.titulo || data.nome || file.name
        }));
      } else {
        alert('Erro no envio do arquivo.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha ao enviar arquivo.');
    } finally {
      setUploadingMaterial(false);
    }
  };

  if (carregandoAuth || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-teal-700 font-semibold animate-pulse">Carregando área administrativa...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Gerenciar Cursos EAD | CREESER</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========================================================= */}
        {/* VIEW: LISTAGEM DE CURSOS */}
        {/* ========================================================= */}
        {visualizacao === 'lista' && (
          <div>
            {/* Header com título e CTA */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📖</span> Gerenciar Cursos EAD
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Administre cursos, módulos, videoaulas e materiais da plataforma EAD.
                </p>
              </div>

              <button
                onClick={() => abrirFormulario('curso')}
                className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition"
              >
                <span>+</span> Novo Curso
              </button>
            </div>

            {/* Indicadores / KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total de Cursos</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{indicadores.total}</p>
                </div>
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center text-xl font-bold">
                  📚
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Publicados / Ativos</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{indicadores.publicados}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center text-xl font-bold">
                  ✅
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rascunhos</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{indicadores.rascunhos}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-xl font-bold">
                  📝
                </div>
              </div>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="w-full md:w-96 relative">
                <input
                  type="text"
                  placeholder="Buscar curso por título ou categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Situação:</span>
                <select
                  value={filtroSituacao}
                  onChange={(e) => setFiltroSituacao(e.target.value)}
                  className="border border-gray-300 rounded-lg text-sm py-2 px-3 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="TODOS">Todos os status</option>
                  <option value="ATIVO">Publicados (Ativos)</option>
                  <option value="RASCUNHO">Rascunhos (Inativos)</option>
                </select>
              </div>
            </div>

            {/* Listagem em Cards */}
            {carregando ? (
              <div className="text-center py-16 text-gray-500">Carregando catálogo de cursos...</div>
            ) : cursosFiltrados.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <span className="text-4xl">📂</span>
                <h3 className="text-base font-semibold text-gray-700 mt-2">Nenhum curso encontrado</h3>
                <p className="text-sm text-gray-500 mt-1">Crie um novo curso EAD ou ajuste os filtros de pesquisa.</p>
                <button
                  onClick={() => abrirFormulario('curso')}
                  className="mt-4 inline-flex items-center gap-2 bg-teal-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                >
                  + Novo Curso
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursosFiltrados.map((curso) => {
                  const isPublicado = curso.ativo !== false;
                  const totalModulos = curso.modulos?.length || 0;
                  const totalAulas = (curso.modulos || []).reduce((acc, m) => acc + (m.aulas?.length || 0), 0);

                  return (
                    <div
                      key={curso.id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 overflow-hidden flex flex-col"
                    >
                      {/* Thumbnail Cover */}
                      <div className="relative h-44 bg-slate-800">
                        {curso.thumbnail ? (
                          <img
                            src={curso.thumbnail}
                            alt={curso.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-slate-900">
                            <span className="text-5xl mb-1">🎓</span>
                            <span className="text-xs uppercase tracking-wider font-semibold">Sem Imagem</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                              isPublicado ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'
                            }`}
                          >
                            {isPublicado ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                      </div>

                      {/* Info Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold mb-1">
                            <span>🏷️ {curso.categoria || 'Geral'}</span>
                            <span>•</span>
                            <span>⏱️ {curso.cargaHoraria || 15}h</span>
                          </div>

                          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                            {curso.titulo}
                          </h3>

                          <div
                            className="text-xs text-gray-600 line-clamp-3 mb-4"
                            dangerouslySetInnerHTML={{ __html: curso.descricao || 'Sem descrição cadastrada.' }}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3 mb-4">
                            <span>📦 {totalModulos} módulos</span>
                            <span>📹 {totalAulas} aulas</span>
                          </div>

                          {/* Ações */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setCursoSelecionado(curso);
                                setVisualizacao('curso');
                              }}
                              className="col-span-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center transition"
                            >
                              Organizar Conteúdo →
                            </button>

                            <button
                              onClick={() => abrirFormulario('curso', curso)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-1.5 px-3 rounded-lg transition"
                            >
                              ✏️ Editar
                            </button>

                            <button
                              onClick={() => handleTogglePublicacao(curso)}
                              className={`text-xs font-medium py-1.5 px-3 rounded-lg transition ${
                                isPublicado
                                  ? 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                                  : 'bg-green-50 hover:bg-green-100 text-green-700'
                              }`}
                            >
                              {isPublicado ? 'Mudar p/ Rascunho' : 'Publicar'}
                            </button>

                            <a
                              href={`/curso/${curso.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium py-1.5 px-3 rounded-lg text-center transition"
                            >
                              👁️ Visualizar
                            </a>

                            <button
                              onClick={() => handleDeleteCurso(curso.id, curso.titulo)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium py-1.5 px-3 rounded-lg transition"
                            >
                              🗑️ Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: GESTÃO DE MÓDULOS DE UM CURSO */}
        {/* ========================================================= */}
        {visualizacao === 'curso' && cursoSelecionado && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setVisualizacao('lista');
                  setCursoSelecionado(null);
                }}
                className="text-sm font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                ← Voltar para Todos os Cursos
              </button>
            </div>

            {/* Cabeçalho do Curso */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
                    {cursoSelecionado.categoria || 'Geral'}
                  </span>
                  <span className="text-xs text-gray-500">Carga: {cursoSelecionado.cargaHoraria || 15}h</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    cursoSelecionado.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {cursoSelecionado.ativo !== false ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{cursoSelecionado.titulo}</h2>
                <div
                  className="text-sm text-gray-600 mt-2 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: cursoSelecionado.descricao || '' }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => abrirFormulario('curso', cursoSelecionado)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition"
                >
                  Editar Dados Gerais
                </button>
                <a
                  href={`/assistir/${cursoSelecionado.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-lg font-medium transition"
                >
                  Abrir Player ↗
                </a>
              </div>
            </div>

            {/* Header de Módulos */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Módulos do Curso</h3>
                <p className="text-xs text-gray-500">Organize a sequência pedagógica de aprendizagem.</p>
              </div>

              <button
                onClick={() => abrirFormulario('modulo')}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
              >
                + Novo Módulo
              </button>
            </div>

            {/* Lista de Módulos */}
            <div className="space-y-4">
              {cursoSelecionado.modulos?.map((modulo, index) => {
                const totalAulasModulo = modulo.aulas?.length || 0;
                return (
                  <div
                    key={modulo.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-teal-300 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            Módulo {index + 1}
                          </span>
                          <h4 className="text-base font-bold text-gray-900">{modulo.titulo}</h4>
                        </div>
                        {modulo.descricao && (
                          <p className="text-sm text-gray-600 mt-1">{modulo.descricao}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          📹 {totalAulasModulo} aula(s) cadastrada(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setModuloSelecionado(modulo);
                            setVisualizacao('modulo');
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                        >
                          Gerenciar Aulas ({totalAulasModulo}) →
                        </button>
                        <button
                          onClick={() => abrirFormulario('modulo', modulo)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteModulo(modulo.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-3 py-2 rounded-lg transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!cursoSelecionado.modulos || cursoSelecionado.modulos.length === 0) && (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                  <p className="text-sm">Nenhum módulo cadastrado neste curso.</p>
                  <button
                    onClick={() => abrirFormulario('modulo')}
                    className="mt-3 bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                  >
                    + Adicionar Primeiro Módulo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: GESTÃO DE AULAS DE UM MÓDULO */}
        {/* ========================================================= */}
        {visualizacao === 'modulo' && moduloSelecionado && cursoSelecionado && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setVisualizacao('curso');
                  setModuloSelecionado(null);
                }}
                className="text-sm font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                ← Voltar para Módulos de "{cursoSelecionado.titulo}"
              </button>
            </div>

            {/* Cabeçalho do Módulo */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                  Módulo Selecionado
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{moduloSelecionado.titulo}</h2>
                {moduloSelecionado.descricao && (
                  <p className="text-sm text-gray-600 mt-1">{moduloSelecionado.descricao}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => abrirFormulario('modulo', moduloSelecionado)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition"
                >
                  Editar Módulo
                </button>
                <button
                  onClick={() => abrirFormulario('aula')}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition"
                >
                  + Nova Aula
                </button>
              </div>
            </div>

            {/* Lista de Aulas */}
            <div className="space-y-4">
              {moduloSelecionado.aulas?.map((aula, index) => {
                const totalMateriais = aula.materiais?.length || 0;
                return (
                  <div
                    key={aula.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-teal-300 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            Aula {index + 1}
                          </span>
                          <h4 className="text-base font-bold text-gray-900">{aula.titulo}</h4>
                        </div>

                        {aula.descricao && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{aula.descricao}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-3">
                          <span>⏱️ {aula.duracao || 0} min</span>
                          <span>📎 {totalMateriais} anexo(s)</span>
                          {aula.videoUrl && (
                            <a
                              href={aula.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:underline flex items-center gap-1"
                            >
                              <span>▶️</span> Ver vídeo
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAulaSelecionada(aula);
                            setVisualizacao('aula');
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                        >
                          Materiais ({totalMateriais}) →
                        </button>
                        <button
                          onClick={() => abrirFormulario('aula', aula)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteAula(aula.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-3 py-2 rounded-lg transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!moduloSelecionado.aulas || moduloSelecionado.aulas.length === 0) && (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                  <p className="text-sm">Nenhuma aula cadastrada neste módulo.</p>
                  <button
                    onClick={() => abrirFormulario('aula')}
                    className="mt-3 bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                  >
                    + Criar Primeira Aula
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: GESTÃO DE MATERIAIS DE UMA AULA */}
        {/* ========================================================= */}
        {visualizacao === 'aula' && aulaSelecionada && moduloSelecionado && cursoSelecionado && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setVisualizacao('modulo');
                  setAulaSelecionada(null);
                }}
                className="text-sm font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                ← Voltar para Aulas de "{moduloSelecionado.titulo}"
              </button>
            </div>

            {/* Resumo da Aula */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                  Aula Selecionada
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{aulaSelecionada.titulo}</h2>
                <p className="text-sm text-gray-600 mt-1">{aulaSelecionada.descricao}</p>
                {aulaSelecionada.videoUrl && (
                  <p className="text-xs text-gray-500 mt-2">
                    Vídeo: <a href={aulaSelecionada.videoUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">{aulaSelecionada.videoUrl}</a>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => abrirFormulario('aula', aulaSelecionada)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition"
                >
                  Editar Aula
                </button>
                <button
                  onClick={() => abrirFormulario('material')}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition"
                >
                  + Anexar Material
                </button>
              </div>
            </div>

            {/* Materiais Complementares */}
            <h3 className="text-lg font-bold text-gray-900 mb-3">Materiais Complementares</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aulaSelecionada.materiais?.map((mat) => (
                <div key={mat.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-gray-800">{mat.titulo}</h5>
                    <p className="text-xs text-gray-500 uppercase mt-0.5">Tipo: {mat.tipo || 'pdf'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      Visualizar
                    </a>
                    <button
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {(!aulaSelecionada.materiais || aulaSelecionada.materiais.length === 0) && (
                <div className="col-span-2 bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                  <p className="text-sm">Nenhum material complementar anexado a esta aula.</p>
                  <button
                    onClick={() => abrirFormulario('material')}
                    className="mt-3 bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                  >
                    + Anexar PDF / Arquivo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: FORMULÁRIO DE CURSO */}
      {/* ========================================================= */}
      {mostrarForm && tipoForm === 'curso' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {modoEdicao ? 'Editar Curso EAD' : 'Novo Curso EAD'}
            </h3>

            <form onSubmit={handleSubmitCurso} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Título do Curso *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Ex: Gestão de Políticas Públicas e Previdência"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição do Curso</label>
                <RichTextEditor
                  value={formData.descricao || ''}
                  onChange={(content) => setFormData({ ...formData, descricao: content })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Categoria *</label>
                  <input
                    type="text"
                    required
                    value={formData.categoria || ''}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Ex: Psicossocial, Gestão, Jurídico"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Carga Horária (horas) *</label>
                  <input
                    type="number"
                    required
                    value={formData.cargaHoraria || ''}
                    onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Ex: 40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Vídeo de Apresentação (YouTube / Vimeo)
                </label>
                <input
                  type="url"
                  value={formData.videoApresentacao || ''}
                  onChange={(e) => setFormData({ ...formData, videoApresentacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Capa do Curso (Thumbnail)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadThumbnail}
                  disabled={uploadingThumbnail}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                {uploadingThumbnail && (
                  <p className="text-xs text-teal-600 mt-1">Enviando imagem...</p>
                )}
                {formData.thumbnail && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                    <img src={formData.thumbnail} alt="Thumbnail preview" className="h-16 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnail: '' })}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remover imagem
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ativoCheckbox"
                  checked={formData.ativo !== false}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="ativoCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Publicar curso imediatamente no Portal Acadêmico
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {modoEdicao ? 'Salvar Alterações' : 'Criar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FORMULÁRIO DE MÓDULO */}
      {/* ========================================================= */}
      {mostrarForm && tipoForm === 'modulo' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {modoEdicao ? 'Editar Módulo' : 'Novo Módulo'}
            </h3>

            <form onSubmit={handleSubmitModulo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Título do Módulo *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Ex: Módulo 01 - Fundamentos"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição / Objetivos</label>
                <textarea
                  rows="3"
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Breve descrição dos tópicos abordados neste módulo..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {modoEdicao ? 'Atualizar Módulo' : 'Salvar Módulo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FORMULÁRIO DE AULA */}
      {/* ========================================================= */}
      {mostrarForm && tipoForm === 'aula' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {modoEdicao ? 'Editar Aula' : 'Nova Aula'}
            </h3>

            <form onSubmit={handleSubmitAula} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Título da Aula *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Ex: Aula 01 - Introdução aos Conceitos Gerais"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição da Aula</label>
                <textarea
                  rows="3"
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Detalhamento sobre o conteúdo abordado no vídeo..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">URL do Vídeo (YouTube / Vimeo / MP4)</label>
                <input
                  type="url"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Duração Estimada (minutos)</label>
                <input
                  type="number"
                  value={formData.duracao || ''}
                  onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Ex: 15"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {modoEdicao ? 'Salvar Alterações' : 'Adicionar Aula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FORMULÁRIO DE MATERIAL */}
      {/* ========================================================= */}
      {mostrarForm && tipoForm === 'material' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Anexar Material Complementar
            </h3>

            <form onSubmit={handleSubmitMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Título do Material *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Ex: Apostila de Apoio - Aula 01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Material</label>
                <select
                  value={formData.tipo || 'pdf'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="pdf">Documento PDF</option>
                  <option value="documento">Documento Word / Outro</option>
                  <option value="imagem">Imagem / Infográfico</option>
                  <option value="link">Link Externo</option>
                </select>
              </div>

              {/* Opção 1: Upload */}
              <div className="p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  📁 Fazer Upload de Arquivo
                </label>
                <input
                  type="file"
                  onChange={handleUploadMaterial}
                  disabled={uploadingMaterial}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                {uploadingMaterial && (
                  <p className="text-xs text-teal-600 mt-1">Enviando material...</p>
                )}
              </div>

              {/* Opção 2: URL direta */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ou URL do Arquivo / Link *
                </label>
                <input
                  type="text"
                  required
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500 font-mono text-xs"
                  placeholder="/uploads/materiais/... ou https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  Anexar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Global */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </DashboardLayout>
  );
}
