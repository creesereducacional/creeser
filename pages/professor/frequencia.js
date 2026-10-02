import { useState, useEffect } from "react";

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

  const marcarTodos = (status) => {
    setModalFrequencia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        alunos: prev.alunos.map(a => ({ ...a, presenca: status }))
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
    <>
      <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
        
        {/* Top Header Card */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-xs">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Controle de Presença (Chamada)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selecione uma aula ministrada abaixo para registrar ou atualizar as presenças dos estudantes.
          </p>
        </div>

        {/* Lista de Aulas para Chamada */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-500">Carregando aulas...</p>
          </div>
        ) : aulas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <span className="text-4xl block mb-3">📋</span>
            <h3 className="text-base font-bold text-slate-800 mb-1">Nenhuma aula registrada</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Cadastre um planejamento de aula no Diário de Classe para poder realizar a chamada.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {aulas.map(aula => (
              <div
                key={aula.id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Turma: {aula.turma}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                      {aula.disciplina}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {aula.conteudoVivenciado || "Aula Pedagógica"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span>📅</span>
                      <span>Data: {new Date(aula.data).toLocaleDateString('pt-BR')}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span>🏫</span>
                      <span>Local: {aula.local || 'Sala de Aula'}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => abrirFrequencia(aula.id)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <span>📋</span>
                  <span>Fazer Chamada</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Chamada */}
        {modalFrequencia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>📋</span>
                    <span>Chamada da Turma</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Marque presença ou falta e registre justificativas se necessário.</p>
                </div>
                <button 
                  onClick={() => setModalFrequencia(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition"
                >
                  &times;
                </button>
              </div>

              {/* Botões rápidos Marcar Todos */}
              {modalFrequencia.alunos.length > 0 && !freqLoading && (
                <div className="flex items-center justify-between gap-2 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                  <span className="font-semibold text-slate-600">Ações em massa:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => marcarTodos(true)}
                      className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg font-bold transition text-[11px]"
                    >
                      ✓ Todos Presentes
                    </button>
                    <button
                      type="button"
                      onClick={() => marcarTodos(false)}
                      className="px-2.5 py-1 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-lg font-bold transition text-[11px]"
                    >
                      ✕ Todos Ausentes
                    </button>
                  </div>
                </div>
              )}

              {freqLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Carregando lista de alunos...</p>
                </div>
              ) : modalFrequencia.alunos.length === 0 ? (
                <p className="text-center py-12 text-sm text-slate-500">Nenhum aluno ativo encontrado nesta turma.</p>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-2.5 pr-2 divide-y divide-slate-100">
                  {modalFrequencia.alunos.map(aluno => (
                    <div key={aluno.id} className="flex flex-col sm:flex-row sm:items-center justify-between pt-2.5 first:pt-0 gap-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{aluno.nome}</p>
                        <p className="text-[11px] text-slate-400">Matrícula: {aluno.matricula || 'N/A'}</p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        {!aluno.presenca && (
                          <input
                            type="text"
                            placeholder="Justificativa da falta..."
                            value={aluno.justificativa || ''}
                            onChange={(e) => alterarJustificativa(aluno.id, e.target.value)}
                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 max-w-[180px]"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => alternarPresenca(aluno.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide transition cursor-pointer border ${
                            aluno.presenca 
                              ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-xs' 
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {aluno.presenca ? '✓ PRESENTE' : '✕ FALTA'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setModalFrequencia(null)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarFrequencia}
                  disabled={salvandoFreq || freqLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {salvandoFreq ? 'Salvando...' : 'Salvar Chamada'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
