import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';

export default function PlanejamentoDiario() {
  const router = useRouter();
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState({
    turma: '',
    disciplina: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    try {
      const res = await fetch('/api/planejamento-diario');
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
    return true;
  });

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este planejamento?')) {
      try {
        const res = await fetch(`/api/planejamento-diario/${id}`, { method: 'DELETE' });
        if (res.ok) {
          carregarRegistros();
          alert('Planejamento deletado com sucesso');
        }
      } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar planejamento');
      }
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Gerenciar Planos de Ensino.</h1>

        {/* Botões de Ação */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <Link href="/admin/planejamento-diario/novo">
            <button className="flex flex-col items-center gap-2 bg-white rounded-lg shadow-md px-6 py-4 text-teal-600 hover:text-teal-700 transition">
              <span className="text-3xl">📝</span>
              <span className="font-semibold text-sm">Registrar Plano de Ensino</span>
            </button>
          </Link>
          
          <button className="flex flex-col items-center gap-2 bg-white rounded-lg shadow-md px-6 py-4 text-gray-600 hover:text-gray-700 transition">
            <span className="text-3xl">📋</span>
            <span className="font-semibold text-sm">Listar Planos</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <details open>
            <summary className="cursor-pointer text-lg font-bold text-teal-600 mb-4">▼ Filtros de Busca</summary>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA *</label>
                  <select
                    value={filtros.turma}
                    onChange={(e) => setFiltros({...filtros, turma: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">- ESCOLHA UMA TURMA -</option>
                    <option value="ADM - TESTE MEC - ADMINISTRAÇÃO EAD - ONLINE (PedagogiaEAD)">ADM - TESTE MEC - ADMINISTRAÇÃO EAD - ONLINE (PedagogiaEAD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">DISCIPLINA *</label>
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

              <div className="flex justify-end">
                <button
                  onClick={() => setFiltros({turma: '', disciplina: ''})}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
                >
                  🔍
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* Seção Informações da Aula */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h3 className="text-sm font-bold text-teal-600 mb-4">ℹ️ Informações da Aula</h3>
          
          {registrosFiltrados.length > 0 ? (
            <div className="space-y-6">
              {registrosFiltrados.map((reg) => (
                <div key={reg.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 block">Data *</label>
                      <input
                        type="text"
                        value={new Date(reg.data).toLocaleDateString('pt-BR')}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-teal-600 block">Data Fim</label>
                      <input
                        type="text"
                        value={new Date(reg.dataFim).toLocaleDateString('pt-BR')}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 block">Local</label>
                      <input
                        type="text"
                        value={reg.local}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 block">Unidade Bimestral</label>
                      <select disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100">
                        <option>{reg.unidadeBimestral}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 block">Qtd. Aulas *</label>
                      <input
                        type="number"
                        value={reg.quantidadeAulas}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 block">Professor</label>
                      <select disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100">
                        <option>{reg.professor}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 block">Avaliação?</label>
                    <input
                      type="checkbox"
                      checked={reg.avaliacaoCheckbox}
                      disabled
                      className="w-5 h-5"
                    />
                  </div>

                  {/* Textareas */}
                  <div>
                    <label className="text-xs font-medium text-teal-600 block">Conteúdo a ser Vivenciado</label>
                    <textarea
                      value={reg.conteudoVivenciado}
                      disabled
                      rows="3"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 block">Objetivo da aula</label>
                    <textarea
                      value={reg.objetivoAula}
                      disabled
                      rows="3"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>

                  {/* Accordions */}
                  <details className="cursor-pointer">
                    <summary className="font-semibold text-teal-600 py-2">Metodologias</summary>
                    <textarea
                      value={reg.metodologias}
                      disabled
                      rows="2"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </details>

                  <details className="cursor-pointer">
                    <summary className="font-semibold text-teal-600 py-2">Recursos</summary>
                    <textarea
                      value={reg.recursos}
                      disabled
                      rows="2"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </details>

                  <details className="cursor-pointer">
                    <summary className="font-semibold text-teal-600 py-2">Avaliação</summary>
                    <textarea
                      value={reg.avaliacao}
                      disabled
                      rows="2"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </details>

                  {/* Ações */}
                  <div className="flex gap-2 pt-4">
                    <Link href={`/admin/planejamento-diario/${reg.id}`}>
                      <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm">
                        ✏️ Editar
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(reg.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-sm"
                    >
                      ❌ Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum planejamento encontrado para os filtros selecionados</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
