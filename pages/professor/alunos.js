import { useState, useEffect } from "react";
import ProfessorLayout from "../../components/ProfessorLayout";

export default function ProfessorAlunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opcoes, setOpcoes] = useState({ turmas: [], disciplinas: [], vinculos: [] });

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

  return (
    <ProfessorLayout title="Meus Alunos">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Alunos Matriculados</h1>
          <p className="text-sm text-gray-500">Lista de estudantes ativos pertencentes às suas turmas.</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Carregando lista de alunos...</p>
        ) : alunos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">Nenhum aluno ativo vinculado às suas turmas.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-teal-50 border-b border-teal-100 text-teal-800 font-semibold">
                    <th className="p-4">Estudante</th>
                    <th className="p-4">Matrícula</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Telefone</th>
                    <th className="p-4">Turma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alunos.map(aluno => {
                    const turmaObj = opcoes.turmas.find(t => String(t.id) === String(aluno.turmaid));
                    return (
                      <tr key={aluno.id} className="hover:bg-gray-55/30 transition">
                        <td className="p-4 font-semibold text-gray-800">{aluno.nome}</td>
                        <td className="p-4 text-gray-500">{aluno.matricula || 'Sem Matrícula'}</td>
                        <td className="p-4 text-gray-650">{aluno.email || 'N/A'}</td>
                        <td className="p-4 text-gray-650">{aluno.telefone_celular || 'N/A'}</td>
                        <td className="p-4 font-medium text-teal-800">{turmaObj ? turmaObj.nome : `Turma ID ${aluno.turmaid}`}</td>
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
