import { useState, useEffect } from "react";
import ProfessorLayout from "../../components/ProfessorLayout";

export default function ProfessorAlunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opcoes, setOpcoes] = useState({ turmas: [], disciplinas: [], vinculos: [] });
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // 1. Carregar vínculos do professor
      const resVts = await fetch('/api/professor/vinculos');
      let uniqueTurmaIds = [];
      if (resVts.ok) {
        const dVts = await resVts.json();
        setOpcoes(dVts);
        uniqueTurmaIds = Array.from(new Set((dVts.vinculos || []).map(v => v.turma_id)));
      }

      // 2. Carregar alunos gerais e filtrar pelas turmas do professor
      const resAlunos = await fetch('/api/alunos');
      if (resAlunos.ok) {
        const dAlunos = await resAlunos.json();
        const filtrados = dAlunos.filter(aluno => uniqueTurmaIds.includes(aluno.turmaid));
        setAlunos(filtrados);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const alunosFiltrados = alunos.filter(aluno => {
    const txt = `${aluno.nome || ''} ${aluno.matricula || ''} ${aluno.email || ''}`.toLowerCase();
    const matchBusca = txt.includes(busca.toLowerCase());
    const matchTurma = !filtroTurma || String(aluno.turmaid) === String(filtroTurma);
    return matchBusca && matchTurma;
  });

  return (
    <ProfessorLayout title="Meus Alunos & Turmas">
      <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
        
        {/* Header da Página */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-xs">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Meus Alunos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Relação completa de estudantes ativos matriculados nas turmas sob sua docência.
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar aluno por nome, matrícula ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="sm:w-64">
            <select
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white"
            >
              <option value="">Todas as Turmas</option>
              {opcoes.turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Estudantes */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-500">Carregando estudantes...</p>
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <span className="text-4xl block mb-3">👥</span>
            <h3 className="text-base font-bold text-slate-800 mb-1">Nenhum aluno encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {busca || filtroTurma ? "Nenhum estudante corresponde aos filtros aplicados." : "Nenhum aluno ativo vinculado às suas turmas."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 font-extrabold text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6">Estudante</th>
                    <th className="p-4">Matrícula</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Telefone</th>
                    <th className="p-4 pr-6">Turma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alunosFiltrados.map(aluno => {
                    const turmaObj = opcoes.turmas.find(t => String(t.id) === String(aluno.turmaid));
                    return (
                      <tr key={aluno.id} className="hover:bg-slate-50/60 transition duration-150">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 flex items-center justify-center font-bold text-xs">
                              {aluno.nome?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <span className="font-bold text-slate-900">{aluno.nome}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-500">{aluno.matricula || 'Sem Matrícula'}</td>
                        <td className="p-4 text-xs text-slate-600">{aluno.email || 'N/A'}</td>
                        <td className="p-4 text-xs text-slate-600">{aluno.telefone_celular || 'N/A'}</td>
                        <td className="p-4 pr-6">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200/60">
                            {turmaObj ? turmaObj.nome : `Turma ID ${aluno.turmaid}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </ProfessorLayout>
  );
}
