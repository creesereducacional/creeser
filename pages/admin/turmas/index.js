import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState   from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import ConfirmModal from '@/components/ConfirmModal';

export default function ListagemTurmas() {
  const [turmas, setTurmas] = useState([]);
  const [instituicoes, setInstituicoes] = useState([]);
  const [todasUnidades, setTodasUnidades] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroInstituicao, setFiltroInstituicao] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroNome, setFiltroNome] = useState('');

  const [modalConfirm, setModalConfirm] = useState({
    isOpen: false,
    idTurma: null,
    nomeTurma: '',
  });

  useEffect(() => {
    inicializar();
  }, []);

  const inicializar = async () => {
    try {
      setLoading(true);
      const [resInst, resOpcoes, resCursos, resTurmas] = await Promise.all([
        fetch('/api/instituicoes'),
        fetch('/api/turmas/opcoes'),
        fetch('/api/cursos'),
        fetch('/api/turmas'),
      ]);

      let instList = [];
      if (resInst.ok) {
        const data = await resInst.json();
        instList = Array.isArray(data) ? data : [];
        setInstituicoes(instList);
      }

      if (resOpcoes.ok) {
        const data = await resOpcoes.json();
        if (Array.isArray(data.unidades)) setTodasUnidades(data.unidades);
      }

      if (resCursos.ok) {
        const data = await resCursos.json();
        setTodosCursos(Array.isArray(data) ? data : []);
      }

      if (resTurmas.ok) {
        const data = await resTurmas.json();
        setTurmas(Array.isArray(data) ? data : []);
      }

      // Se o usuário possuir exatamente 1 instituição, auto-seleciona
      if (instList.length === 1) {
        setFiltroInstituicao(String(instList[0].id));
      }
    } catch (error) {
      console.error('Erro ao inicializar dados de turmas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstituicaoChange = (novaInstituicaoId) => {
    setFiltroInstituicao(novaInstituicaoId);
    setFiltroUnidade('');
    setFiltroCurso('');
  };

  const handleUnidadeChange = (novaUnidadeId) => {
    setFiltroUnidade(novaUnidadeId);
    setFiltroCurso('');
  };

  // Unidades disponíveis baseadas na Instituição selecionada
  const unidadesDisponiveis = useMemo(() => {
    if (!filtroInstituicao) return todasUnidades;
    return todasUnidades.filter(
      (u) => String(u.instituicao_id || u.instituicaoid || '') === String(filtroInstituicao)
    );
  }, [todasUnidades, filtroInstituicao]);

  // Cursos disponíveis baseados na Instituição e Unidade selecionadas
  const cursosDisponiveis = useMemo(() => {
    let lista = todosCursos;

    if (filtroInstituicao) {
      lista = lista.filter(
        (c) => String(c.instituicaoId || c.instituicaoid || c.instituicao_id || '') === String(filtroInstituicao)
      );
    }

    if (filtroUnidade) {
      lista = lista.filter((c) => {
        if (Array.isArray(c.unidadeIds) && c.unidadeIds.length > 0) {
          return c.unidadeIds.some((uid) => String(uid) === String(filtroUnidade));
        }
        return true;
      });
    }

    return lista;
  }, [todosCursos, filtroInstituicao, filtroUnidade]);

  // Filtragem das turmas
  const filtradas = useMemo(() => {
    return turmas.filter((turma) => {
      // Filtro Instituição
      if (filtroInstituicao) {
        const turmaInstId = String(turma.instituicaoId || turma.instituicaoid || turma.instituicao_id || '');
        if (turmaInstId && turmaInstId !== String(filtroInstituicao)) {
          return false;
        }
      }

      // Filtro Unidade
      if (filtroUnidade) {
        const turmaUnidadeId = String(turma.unidadeId || turma.unidadeid || turma.unidade_id || '');
        if (turmaUnidadeId !== String(filtroUnidade)) {
          return false;
        }
      }

      // Filtro Curso
      if (filtroCurso) {
        const turmaCursoId = String(turma.cursoId || turma.cursoid || turma.curso_id || '');
        if (turmaCursoId !== String(filtroCurso)) {
          return false;
        }
      }

      // Filtro Status
      if (filtroStatus) {
        const statusTurma = String(turma.situacao || 'ATIVO').toUpperCase();
        if (statusTurma !== filtroStatus.toUpperCase()) {
          return false;
        }
      }

      // Filtro Busca por Nome
      if (filtroNome.trim()) {
        const termo = filtroNome.toLowerCase().trim();
        const nomeTurma = (turma.nome || '').toLowerCase();
        if (!nomeTurma.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [turmas, filtroInstituicao, filtroUnidade, filtroCurso, filtroStatus, filtroNome]);

  const limparFiltros = () => {
    if (instituicoes.length === 1) {
      setFiltroInstituicao(String(instituicoes[0].id));
    } else {
      setFiltroInstituicao('');
    }
    setFiltroUnidade('');
    setFiltroCurso('');
    setFiltroStatus('');
    setFiltroNome('');
  };

  const solicitarDeletar = (turma) => {
    setModalConfirm({
      isOpen: true,
      idTurma: turma.id,
      nomeTurma: turma.nome,
    });
  };

  const executarDeletar = async () => {
    const id = modalConfirm.idTurma;
    setModalConfirm({ isOpen: false, idTurma: null, nomeTurma: '' });

    if (!id) return;

    try {
      const res = await fetch(`/api/turmas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTurmas(turmas.filter(turma => turma.id !== id));
      }
    } catch (error) {
      console.error('Erro ao deletar turma:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <PageHeader
          icon="📚"
          title="Gerenciar Turmas"
          subtitle={`${filtradas.length} turma${filtradas.length !== 1 ? 's' : ''} encontrada${filtradas.length !== 1 ? 's' : ''}`}
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Turmas' }]}
          actions={
            <Link href="/admin/turmas/novo">
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors">
                + Nova Turma
              </button>
            </Link>
          }
        />

        {/* Abas - Listar e Inserir */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button className="px-6 py-3 text-teal-600 border-b-2 border-teal-600 font-semibold flex items-center gap-2">
            📋 Listar
          </button>
          <Link href="/admin/turmas/novo">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold flex items-center gap-2 transition">
              ➕ Inserir
            </button>
          </Link>
        </div>

        {/* Barra de Filtros Avançados */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 1. Instituição */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Instituição</label>
              <select
                value={filtroInstituicao}
                onChange={(e) => handleInstituicaoChange(e.target.value)}
                disabled={instituicoes.length === 1}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                {instituicoes.length > 1 && <option value="">Todas as Instituições</option>}
                {instituicoes.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Unidade */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Unidade</label>
              <select
                value={filtroUnidade}
                onChange={(e) => handleUnidadeChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white"
              >
                <option value="">Todas as Unidades</option>
                {unidadesDisponiveis.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Curso */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Curso</label>
              <select
                value={filtroCurso}
                onChange={(e) => setFiltroCurso(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white"
              >
                <option value="">Todos os Cursos</option>
                {cursosDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Status */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm bg-white"
              >
                <option value="">Todos os Status</option>
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>

            {/* 5. Busca por nome da turma */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Busca por nome</label>
              <input
                type="text"
                placeholder="🔍 Nome da turma..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={limparFiltros}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-teal-600 border border-gray-300 rounded-lg hover:border-teal-500 transition-colors bg-white cursor-pointer flex items-center gap-1.5"
            >
              🧹 Limpar Filtros
            </button>
          </div>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              📚 Listagem de Turmas
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Quantidade de Turmas: <strong>{filtradas.length}</strong>
              </span>
              <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition text-sm">
                IMPRIMIR
              </button>
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={5} cols={6} />
          ) : filtradas.length === 0 ? (
            <EmptyState
              icon="📚"
              title="Nenhuma turma encontrada"
              description="Ajuste os filtros ou crie uma nova turma."
              action={{ label: '+ Nova Turma', href: '/admin/turmas/novo', variant: 'primary' }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-teal-100 border-b border-teal-300">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Unidade</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Curso</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Grade</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-teal-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((turma) => (
                    <tr key={turma.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{turma.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-semibold border-r border-gray-200">{turma.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{turma.unidade}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{turma.curso}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{turma.grade}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.print()}
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Imprimir"
                          >
                            🖨️
                          </button>
                          <Link href={`/admin/turmas/${turma.id}`}>
                            <button
                              className="p-2 text-blue-600 hover:text-blue-800 transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          </Link>
                          <button
                            onClick={() => solicitarDeletar(turma)}
                            className="p-2 text-red-600 hover:text-red-800 transition"
                            title="Deletar"
                          >
                            ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmModal
          isOpen={modalConfirm.isOpen}
          onClose={() => setModalConfirm({ isOpen: false, idTurma: null, nomeTurma: '' })}
          onConfirm={executarDeletar}
          title="Excluir Turma"
          message={`Tem certeza que deseja deletar a turma "${modalConfirm.nomeTurma}"? Esta ação não poderá ser desfeita.`}
          type="delete"
        />
      </div>
    </DashboardLayout>
  );
}
