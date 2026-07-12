import { useState, useEffect } from "react";
import ProfessorLayout from "../../components/ProfessorLayout";

export default function ProfessorFrequencia() {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFrequencia, setModalFrequencia] = useState(null); // { aulaId, alunos: [] }
  const [freqLoading, setFreqLoading] = useState(false);
  const [salvandoFreq, setSalvandoFreq] = useState(false);

  useEffect(() => {
    carregarAulas();
  }, []);

  const carregarAulas = async () => {
    try {
      const res = await fetch('/api/planejamento-diario');
      if (res.ok) {
        const data = await res.json();
        setAulas(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const abrirFrequencia = async (aulaId) => {
    try {
      setFreqLoading(true);
      setModalFrequencia({ aulaId, alunos: [] });
      const res = await fetch(`/api/planejamento-diario/${aulaId}/frequencia`);
      if (res.ok) {
        const data = await res.json();
        setModalFrequencia({ aulaId, alunos: data });
      } else {
        alert('Erro ao carregar chamada.');
        setModalFrequencia(null);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar estudantes.');
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
        alert('Erro ao salvar frequência.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar chamada.');
    } finally {
      setSalvandoFreq(false);
    }
  };

  return (
    <ProfessorLayout title="Frequência (Chamada)">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Controle de Presença</h1>
          <p className="text-sm text-gray-500">Selecione uma aula ministrada abaixo para realizar a chamada.</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Carregando aulas...</p>
        ) : aulas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">Nenhuma aula registrada para realizar chamada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {aulas.map(aula => (
              <div key={aula.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition">
                <div>
                  <h3 className="font-bold text-teal-800 text-lg">
                    {aula.conteudoVivenciado || 'Aula Pedagógica'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    📅 Data: {new Date(aula.data).toLocaleDateString('pt-BR')} | 🏫 Local: {aula.local || 'Sala de Aula'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Turma: {aula.turma} | Disciplina: {aula.disciplina}
                  </p>
                </div>
                <button
                  onClick={() => abrirFrequencia(aula.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition cursor-pointer"
                >
                  📋 Chamada
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Chamada */}
        {modalFrequencia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-teal-800">
                  📋 Chamada da Aula
                </h3>
                <button 
                  onClick={() => setModalFrequencia(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-semibold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {freqLoading ? (
                <p className="text-center py-8 text-gray-500">Carregando chamada...</p>
              ) : modalFrequencia.alunos.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Nenhum aluno ativo encontrado nesta turma.</p>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                  {modalFrequencia.alunos.map(aluno => (
                    <div key={aluno.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition gap-4">
                      <div>
                        <p className="font-semibold text-gray-800">{aluno.nome}</p>
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
      </div>
    </ProfessorLayout>
  );
}
