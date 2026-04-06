import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import CustomModal from '../../../components/CustomModal';
import ConfirmModal from '../../../components/ConfirmModal';
import { v4 as uuidv4 } from 'uuid';

export default function GerenciarGrades() {
  const [grades, setGrades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchNome, setSearchNome] = useState('');
  const [searchSituacao, setSearchSituacao] = useState('ATIVO');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [instituicoes, setInstituicoes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loadingOpcoes, setLoadingOpcoes] = useState(false);

  const [formData, setFormData] = useState({
    instituicaoId: '',
    cursoId: '',
    ano: '',
    nome: '',
    situacao: 'ATIVO'
  });

  useEffect(() => {
    carregarGrades();
    carregarOpcoesFormulario();
  }, []);

  const getValue = (obj, key) => obj?.[key] ?? obj?.[key.toLowerCase()];

  const carregarOpcoesFormulario = async () => {
    try {
      setLoadingOpcoes(true);

      const [instituicoesRes, cursosRes, unidadesRes] = await Promise.all([
        fetch('/api/instituicoes'),
        fetch('/api/cursos'),
        fetch('/api/unidades')
      ]);

      if (instituicoesRes.ok) {
        const data = await instituicoesRes.json();
        setInstituicoes(Array.isArray(data) ? data : []);
      }

      if (cursosRes.ok) {
        const data = await cursosRes.json();
        setCursos(Array.isArray(data) ? data : []);
      }

      if (unidadesRes.ok) {
        const data = await unidadesRes.json();
        setUnidades(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar opções do formulário de grades:', error);
    } finally {
      setLoadingOpcoes(false);
    }
  };

  const unidadesById = useMemo(() => {
    const map = new Map();
    unidades.forEach((unidade) => {
      const unidadeId = String(getValue(unidade, 'id') || '');
      if (!unidadeId) return;

      const instituicaoId = String(
        getValue(unidade, 'instituicaoId') || getValue(unidade, 'instituicao_id') || ''
      );

      map.set(unidadeId, instituicaoId);
    });
    return map;
  }, [unidades]);

  const cursosFiltradosPorInstituicao = useMemo(() => {
    const instituicaoSelecionada = String(formData.instituicaoId || '');
    if (!instituicaoSelecionada) return [];

    return cursos.filter((curso) => {
      const cursoInstituicaoId = String(
        getValue(curso, 'instituicaoId') || getValue(curso, 'instituicao_id') || ''
      );

      if (cursoInstituicaoId) {
        return cursoInstituicaoId === instituicaoSelecionada;
      }

      const unidadeIdsRaw = getValue(curso, 'unidadeIds') || getValue(curso, 'unidadeids') || [];
      const unidadeIds = Array.isArray(unidadeIdsRaw)
        ? unidadeIdsRaw.map((id) => String(id))
        : [];

      if (unidadeIds.length === 0) {
        return false;
      }

      return unidadeIds.some((unidadeId) => unidadesById.get(unidadeId) === instituicaoSelecionada);
    });
  }, [cursos, formData.instituicaoId, unidadesById]);

  const carregarGrades = async () => {
    try {
      const res = await fetch('/api/grades');
      if (res.ok) {
        const data = await res.json();
        setGrades(data);
      }
    } catch (error) {
      console.error('Erro ao carregar grades:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao carregar grades.',
        type: 'error'
      });
    }
  };

  const filtrarGrades = () => {
    return grades.filter(grade => {
      const nomeMatch = grade.nome.toLowerCase().includes(searchNome.toLowerCase());
      const situacaoMatch = searchSituacao === '' || grade.situacao === searchSituacao;
      return nomeMatch && situacaoMatch;
    });
  };

  const gradesFiltradas = filtrarGrades();
  const totalPages = Math.ceil(gradesFiltradas.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const gradesExibidas = gradesFiltradas.slice(startIndex, startIndex + recordsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'instituicaoId') {
      setFormData(prev => ({
        ...prev,
        instituicaoId: value,
        cursoId: ''
      }));
      return;
    }

    if (name === 'ano') {
      setFormData(prev => ({
        ...prev,
        ano: value.replace(/\D/g, '').slice(0, 4)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    if (!formData.nome.trim()) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Preencha o nome da grade.',
        type: 'warning'
      });
      return;
    }

    if (!formData.instituicaoId) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Selecione a instituição.',
        type: 'warning'
      });
      return;
    }

    if (!formData.cursoId) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Selecione o curso.',
        type: 'warning'
      });
      return;
    }

    if (!/^\d{4}$/.test(String(formData.ano || ''))) {
      setModal({
        isOpen: true,
        title: 'Aviso!',
        message: 'Informe um ano válido com 4 dígitos (ex.: 2026).',
        type: 'warning'
      });
      return;
    }

    const instituicaoSelecionada = instituicoes.find((inst) => String(getValue(inst, 'id')) === String(formData.instituicaoId));
    const cursoSelecionado = cursos.find((curso) => String(getValue(curso, 'id')) === String(formData.cursoId));

    const payload = {
      ...formData,
      instituicaoId: String(formData.instituicaoId),
      instituicaoNome: getValue(instituicaoSelecionada, 'nome') || '',
      cursoId: String(formData.cursoId),
      cursoNome: getValue(cursoSelecionado, 'nome') || '',
      ano: Number.parseInt(formData.ano, 10)
    };

    try {
      if (editingId) {
        console.log('Updating grade:', editingId);
        const res = await fetch(`/api/grades/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            id: editingId
          })
        });

        console.log('Update response:', res.status);

        if (res.ok) {
          await carregarGrades();
          setModal({
            isOpen: true,
            title: 'Sucesso!',
            message: 'Grade atualizada com sucesso!',
            type: 'success'
          });
          resetForm();
        } else {
          const error = await res.text();
          console.error('Update error:', error);
          setModal({
            isOpen: true,
            title: 'Erro!',
            message: 'Erro ao atualizar grade.',
            type: 'error'
          });
        }
      } else {
        console.log('Creating new grade');
        const res = await fetch('/api/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            id: uuidv4()
          })
        });

        console.log('Create response:', res.status);

        if (res.ok) {
          await carregarGrades();
          setModal({
            isOpen: true,
            title: 'Sucesso!',
            message: 'Grade criada com sucesso!',
            type: 'success'
          });
          resetForm();
        } else {
          const error = await res.text();
          console.error('Create error:', error);
          setModal({
            isOpen: true,
            title: 'Erro!',
            message: 'Erro ao criar grade.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar grade:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao salvar grade: ' + error.message,
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({ instituicaoId: '', cursoId: '', ano: '', nome: '', situacao: 'ATIVO' });
    setEditingId(null);
    setCurrentPage(1);
  };

  const handleEdit = (grade) => {
    const instituicaoId = String(getValue(grade, 'instituicaoId') || getValue(grade, 'instituicaoid') || '');
    const cursoId = String(getValue(grade, 'cursoId') || getValue(grade, 'cursoid') || '');
    const ano = String(getValue(grade, 'ano') || '');

    setFormData({
      instituicaoId,
      cursoId,
      ano,
      nome: grade.nome,
      situacao: grade.situacao
    });
    setEditingId(grade.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });

    try {
      const res = await fetch(`/api/grades/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await carregarGrades();
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Grade deletada com sucesso!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao deletar grade.',
        type: 'error'
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4">
        {/* Header com Voltar */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/disciplinas">
            <button type="button" className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition text-sm flex items-center gap-2">
              ← Voltar
            </button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-teal-600 flex items-center gap-2">
            ⚙️ Gerenciar Grades
          </h1>
        </div>

        {/* Abas - Listar e Inserir */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowForm(false)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              !showForm
                ? 'bg-teal-600 text-white'
                : 'bg-white text-teal-600 border-2 border-teal-600 hover:bg-teal-50'
            }`}
          >
            <span className="text-lg">📋</span> Listar
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              resetForm();
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              showForm
                ? 'bg-teal-600 text-white'
                : 'bg-white text-teal-600 border-2 border-teal-600 hover:bg-teal-50'
            }`}
          >
            <span className="text-lg">➕</span> Inserir
          </button>
        </div>

        {/* ABA LISTAR */}
        {!showForm && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 md:p-6">
              <h3 className="text-sm font-semibold text-teal-800 mb-4 flex items-center gap-2">
                🔍 Filtros de Busca
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nome da Grade"
                  value={searchNome}
                  onChange={(e) => {
                    setSearchNome(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                />
                <select
                  value={searchSituacao}
                  onChange={(e) => {
                    setSearchSituacao(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                >
                  <option value="">Todas</option>
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
                <button
                  onClick={() => {
                    setSearchNome('');
                    setSearchSituacao('ATIVO');
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
                >
                  🔄 Limpar Filtros
                </button>
              </div>
            </div>

            {/* Listagem */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-teal-800 flex items-center gap-2">
                  📋 Listagem das Grades
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={recordsPerPage}
                    onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <span className="text-xs text-gray-600">Registros por página</span>
                </div>
              </div>

              {gradesFiltradas.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-teal-100 border-b border-teal-300">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800">#</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800">Nome</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800">Ano</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800">Situação</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-teal-800">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradesExibidas.map((grade, index) => (
                          <tr key={grade.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                            <td className="px-4 py-3 text-sm text-gray-700">{startIndex + index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{grade.nome}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{getValue(grade, 'ano') || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  grade.situacao === 'ATIVO'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {grade.situacao}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center space-x-2">
                              <button
                                onClick={() => handleEdit(grade)}
                                className="text-orange-600 hover:text-orange-800 text-lg"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(grade.id)}
                                className="text-red-600 hover:text-red-800 text-lg"
                                title="Deletar"
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-xs text-gray-600">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + recordsPerPage, gradesFiltradas.length)} de {gradesFiltradas.length} resultados
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        ← Anterior
                      </button>
                      <span className="px-3 py-1 text-sm font-semibold text-white bg-teal-600 rounded">
                        {currentPage}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Próximo →
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 text-sm">Nenhuma grade encontrada</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA INSERIR */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-6 flex items-center gap-2">
              {editingId ? '✏️ Editar Grade' : '➕ Inserir Grade'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-teal-600 mb-2">Instituição *</label>
                <select
                  name="instituicaoId"
                  value={formData.instituicaoId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                  disabled={loadingOpcoes}
                >
                  <option value="">Selecione a instituição</option>
                  {instituicoes.map((instituicao) => (
                    <option key={getValue(instituicao, 'id')} value={getValue(instituicao, 'id')}>
                      {getValue(instituicao, 'nome')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal-600 mb-2">Curso *</label>
                <select
                  name="cursoId"
                  value={formData.cursoId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                  disabled={!formData.instituicaoId || loadingOpcoes}
                >
                  <option value="">{formData.instituicaoId ? 'Selecione o curso' : 'Selecione a instituição primeiro'}</option>
                  {cursosFiltradosPorInstituicao.map((curso) => (
                    <option key={getValue(curso, 'id')} value={getValue(curso, 'id')}>
                      {getValue(curso, 'nome')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal-600 mb-2">Nome *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Nome da Grade"
                  className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal-600 mb-2">Ano *</label>
                <input
                  type="text"
                  name="ano"
                  value={formData.ano}
                  onChange={handleInputChange}
                  placeholder="Ex.: 2026"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal-600 mb-2">Status</label>
                <select
                  name="situacao"
                  value={formData.situacao}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
                >
                  💾 Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition text-sm"
                >
                  ✕ Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modais */}
      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ isOpen: false, title: '', message: '', type: 'success' })}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja deletar esta grade? Esta ação não pode ser desfeita."
        type="delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </DashboardLayout>
  );
}
