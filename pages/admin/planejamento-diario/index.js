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
  const [modalFrequencia, setModalFrequencia] = useState(null); // { aulaId, alunos: [] }
  const [freqLoading, setFreqLoading] = useState(false);
  const [salvandoFreq, setSalvandoFreq] = useState(false);

  const abrirFrequencia = async (aulaId) => {
    try {
      setFreqLoading(true);
      setModalFrequencia({ aulaId, alunos: [] });
      const res = await fetch(`/api/planejamento-diario/${aulaId}/frequencia`);
      if (res.ok) {
        const data = await res.json();
        setModalFrequencia({ aulaId, alunos: data });
      } else {
        alert('Erro ao carregar a chamada.');
        setModalFrequencia(null);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar frequências');
      setModalFrequencia(null);
    } finally {
      setFreqLoading(false);
    }
  };

  const alternarPresenca = (alunoId) => {
    setModalFrequencia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        alunos: prev.alunos.map(a => a.id === alunoId ? { ...a, presenca: !a.presenca } : a)
      };
    });
  };

  const alterarJustificativa = (alunoId, justificativa) => {
    setModalFrequencia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        alunos: prev.alunos.map(a => a.id === alunoId ? { ...a, justificativa } : a)
      };
    });
  };

  const salvarFrequencia = async () => {
    if (!modalFrequencia) return;
    try {
      setSalvandoFreq(true);
      const payload = modalFrequencia.alunos.map(a => ({
        aluno_id: a.id,
        presenca: a.presenca,
        justificativa: a.justificativa
      }));
      const res = await fetch(`/api/planejamento-diario/${modalFrequencia.aulaId}/frequencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presencas: payload })
      });
      if (res.ok) {
        alert('Chamada salva com sucesso!');
        setModalFrequencia(null);
      } else {
        alert('Erro ao salvar chamada.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar chamada.');
    } finally {
      setSalvandoFreq(false);
    }
  };

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
                    <button
                      onClick={() => abrirFrequencia(reg.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition text-sm flex items-center gap-1.5"
                    >
                      📋 Chamada
                    </button>
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
      {modalFrequencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                📋 Chamada / Controle de Frequência
              </h3>
              <button 
                onClick={() => setModalFrequencia(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {freqLoading ? (
              <p className="text-center py-8 text-gray-500">Carregando alunos e chamadas...</p>
            ) : modalFrequencia.alunos.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Nenhum aluno ativo encontrado nesta turma.</p>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                {modalFrequencia.alunos.map(aluno => (
                  <div key={aluno.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{aluno.nome}</p>
                      <p className="text-xs text-gray-500">Matrícula: {aluno.matricula || 'N/A'}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 bg-white">
                      {!aluno.presenca && (
                        <input
                          type="text"
                          placeholder="Justificativa da falta..."
                          value={aluno.justificativa}
                          onChange={(e) => alterarJustificativa(aluno.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-teal-500 bg-white"
                        />
                      )}
                      <button
                        onClick={() => alternarPresenca(aluno.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          aluno.presenca 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {aluno.presenca ? '🟢 PRESENTE' : '🔴 AUSENTE'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-4">
              <button
                onClick={() => setModalFrequencia(null)}
                className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-lg text-sm transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvarFrequencia}
                disabled={salvandoFreq || freqLoading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
              >
                {salvandoFreq ? 'Salvando...' : 'Salvar Frequência'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
