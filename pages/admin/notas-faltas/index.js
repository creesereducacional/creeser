import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';
import CustomModal from '../../../components/CustomModal';
import ConfirmModal from '../../../components/ConfirmModal';

export default function NotasFaltas() {
  const router = useRouter();
  const [registros, setRegistros] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [filtros, setFiltros] = useState({
    turma: '',
    disciplina: '',
    apenasAnoLetivo: false,
    listarDispensados: false,
    nome: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    try {
      const res = await fetch('/api/notas-faltas');
      if (res.ok) {
        const data = await res.json();
        setRegistros(data);
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const registrosFiltrados = registros.filter(reg => {
    if (filtros.turma && reg.turma !== filtros.turma) return false;
    if (filtros.disciplina && reg.disciplina !== filtros.disciplina) return false;
    if (filtros.nome && !reg.nomeAluno.toLowerCase().includes(filtros.nome.toLowerCase())) return false;
    return true;
  });

  const handleLimpar = () => {
    setFiltros({
      turma: '',
      disciplina: '',
      apenasAnoLetivo: false,
      listarDispensados: false,
      nome: ''
    });
  };

  const handleEdit = (reg) => {
    setEditingId(reg.id);
    setEditingData({
      ap1: reg.ap1,
      ap2: reg.ap2,
      ap3: reg.ap3,
      mediaProva: reg.mediaProva,
      exameFinal: reg.exameFinal || '',
      frequencia: reg.frequencia,
      mediaFinal: reg.mediaFinal,
      situacao: reg.situacao
    });
  };

  const handleInputChange = (field, value) => {
    setEditingData({
      ...editingData,
      [field]: value
    });
  };

  const handleSaveRow = async (id) => {
    try {
      const res = await fetch(`/api/notas-faltas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData)
      });
      if (res.ok) {
        await carregarRegistros();
        setEditingId(null);
        setEditingData({});
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Nota/Falta atualizada com sucesso!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao salvar a nota/falta. Tente novamente.',
        type: 'error'
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });
    try {
      const res = await fetch(`/api/notas-faltas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        carregarRegistros();
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: 'Registro deletado com sucesso!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Erro ao deletar registro.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 text-center">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-full">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📊</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Notas e Faltas</h1>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <details open>
            <summary className="cursor-pointer text-lg font-bold text-teal-600 mb-4">▼ Filtros de Busca</summary>
            
            <div className="space-y-4">
              {/* Primeira linha: Turma e Disciplina */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">SELECIONAR TURMA *</label>
                  <select
                    value={filtros.turma}
                    onChange={(e) => setFiltros({...filtros, turma: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- ESCOLHA UMA TURMA -</option>
                    <option value="ADM EAD 01 - ADMINISTRAÇÃO EAD - ONLINE (PedagogiaEAD)">ADM EAD 01 - ADMINISTRAÇÃO EAD - ONLINE (PedagogiaEAD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">SELECIONAR DISCIPLINA *</label>
                  <select
                    value={filtros.disciplina}
                    onChange={(e) => setFiltros({...filtros, disciplina: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- ESCOLHA UMA DISCIPLINA -</option>
                    <option value="1 - Comunicação Contemporânea">1 - Comunicação Contemporânea</option>
                  </select>
                </div>
              </div>

              {/* Segunda linha: Checkboxes e Busca */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">APENAS ALUNOS NO ANO LETIVO CORRENTE?</label>
                  <input
                    type="checkbox"
                    checked={filtros.apenasAnoLetivo}
                    onChange={(e) => setFiltros({...filtros, apenasAnoLetivo: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">LISTAR DISPENSADOS?</label>
                  <input
                    type="checkbox"
                    checked={filtros.listarDispensados}
                    onChange={(e) => setFiltros({...filtros, listarDispensados: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar por nome"
                    value={filtros.nome}
                    onChange={(e) => setFiltros({...filtros, nome: e.target.value})}
                    className="flex-1 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  />
                  <button
                    onClick={handleLimpar}
                    className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition text-sm"
                  >
                    LIMPAR
                  </button>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Listagem */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-lg font-bold text-teal-600 mb-4">📋 Listagem dos alunos</h3>
          
          <div className="flex gap-2 mb-4">
            <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg">
              <option>Todos</option>
              <option>10 registros por página</option>
            </select>
            <input
              type="text"
              placeholder="Pesquisar na listagem"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <button className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg">🔍</button>
          </div>

          {/* Tabela Responsiva */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-teal-100 border-b border-teal-300 text-teal-800">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Nome</th>
                  <th className="px-4 py-2 text-center font-semibold">AP1</th>
                  <th className="px-4 py-2 text-center font-semibold">AP2</th>
                  <th className="px-4 py-2 text-center font-semibold">AP3</th>
                  <th className="px-4 py-2 text-center font-semibold">M.P.</th>
                  <th className="px-4 py-2 text-center font-semibold">E.F.</th>
                  <th className="px-4 py-2 text-center font-semibold">%FREQ.</th>
                  <th className="px-4 py-2 text-center font-semibold">M.FINAL</th>
                  <th className="px-4 py-2 text-center font-semibold">SITUAÇÃO</th>
                  <th className="px-4 py-2 text-center font-semibold">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length > 0 ? (
                  registrosFiltrados.map((reg) => (
                    <tr key={reg.id} className={`border-b border-gray-200 transition ${editingId === reg.id ? 'bg-yellow-50' : 'hover:bg-teal-50'}`}>
                      <td className="px-4 py-2">{reg.nomeAluno}</td>
                      <td className="px-4 py-2 text-center">
                        {editingId === reg.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingData.ap1}
                            onChange={(e) => handleInputChange('ap1', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          reg.ap1
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {editingId === reg.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingData.ap2}
                            onChange={(e) => handleInputChange('ap2', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          reg.ap2
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {editingId === reg.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingData.ap3}
                            onChange={(e) => handleInputChange('ap3', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          reg.ap3
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {editingId === reg.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingData.mediaProva}
                            onChange={(e) => handleInputChange('mediaProva', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          reg.mediaProva
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {editingId === reg.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingData.exameFinal}
                            onChange={(e) => handleInputChange('exameFinal', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          reg.exameFinal || '-'
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {editingId === reg.id ? (
                          <input
                            type="number"
                            step="1"
                            value={editingData.frequencia}
                            onChange={(e) => handleInputChange('frequencia', e.target.value)}
                            className="w-16 px-2 py-1 text-center border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          `${reg.frequencia}%`
                        )}
                      </td>
                      <td className="px-4 py-2 text-center font-semibold">
                        {editingId === reg.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingData.mediaFinal}
                            onChange={(e) => handleInputChange('mediaFinal', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          reg.mediaFinal
                        )}
                      </td>
                      <td className="px-4 py-2 text-center text-xs">
                        {editingId === reg.id ? (
                          <select
                            value={editingData.situacao}
                            onChange={(e) => handleInputChange('situacao', e.target.value)}
                            className="px-2 py-1 rounded text-xs border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="CURSANDO">CURSANDO</option>
                            <option value="APROVADO">APROVADO</option>
                            <option value="REPROVADO">REPROVADO</option>
                          </select>
                        ) : (
                          <select
                            defaultValue={reg.situacao}
                            onChange={(e) => {}}
                            className="px-2 py-1 rounded text-xs border border-gray-300"
                          >
                            <option value="CURSANDO">CURSANDO</option>
                            <option value="APROVADO">APROVADO</option>
                            <option value="REPROVADO">REPROVADO</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center space-x-2 flex justify-center items-center gap-2">
                        {editingId === reg.id ? (
                          <>
                            <button
                              onClick={() => handleSaveRow(reg.id)}
                              className="text-green-600 hover:text-green-800 text-lg font-bold"
                              title="Salvar"
                            >
                              ✅
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-gray-600 hover:text-gray-800 text-lg"
                              title="Cancelar"
                            >
                              ❌
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(reg)}
                              className="text-orange-600 hover:text-orange-800 text-lg"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(reg.id)}
                              className="text-red-600 hover:text-red-800 text-lg"
                              title="Deletar"
                            >
                              ❌
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Mostrando 1 a {registrosFiltrados.length} de {registrosFiltrados.length} resultados
          </div>
        </div>
      </div>

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
        message="Tem certeza que deseja deletar este registro? Esta ação não pode ser desfeita."
        type="delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </DashboardLayout>
  );
}
