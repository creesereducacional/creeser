export default function BoletimTemplate({ data }) {
  if (!data) return <p className="text-gray-500 text-center py-8">Sem dados para exibir.</p>;

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:mx-0 print:w-full">
      {/* Cabeçalho da Instituição */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-teal-800 pb-6 mb-6 gap-4 print:flex-row print:justify-between print:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-teal-800 uppercase tracking-tight">{data.instituicao?.nome || 'CREESER Educacional'}</h2>
          <p className="text-xs text-gray-500 mt-1">CNPJ: {data.instituicao?.cnpj || '00.000.000/0001-00'}</p>
          <p className="text-xs text-gray-500">{data.instituicao?.endereco || 'Endereço da Instituição'}</p>
        </div>
        <div className="text-right md:text-right print:text-right">
          <span className="px-4 py-1.5 bg-teal-50 text-teal-800 font-bold rounded-full text-xs uppercase tracking-wider print:bg-none print:border print:border-teal-800">
            Boletim Escolar Oficial
          </span>
          <p className="text-xs text-gray-400 mt-2">Ano Letivo: {data.anoLetivo}</p>
        </div>
      </div>

      {/* Dados do Aluno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-teal-50/40 p-5 rounded-2xl mb-8 print:grid-cols-4 print:p-4 print:bg-slate-50 print:border print:border-gray-200">
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">Estudante</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.aluno?.nome}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">Matrícula</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.aluno?.matricula}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">Curso</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.curso}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">Turma</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.turma}</p>
        </div>
      </div>

      {/* Tabela de Notas */}
      <div className="overflow-x-auto rounded-2xl border border-gray-150">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-teal-800 text-white font-semibold print:bg-teal-900">
              <th className="p-4">Componente Curricular (Disciplina)</th>
              <th className="p-4">Docente</th>
              <th className="p-4 text-center">AP1</th>
              <th className="p-4 text-center">AP2</th>
              <th className="p-4 text-center">AP3</th>
              <th className="p-4 text-center">Média</th>
              <th className="p-4 text-center">Freq. (%)</th>
              <th className="p-4 text-center">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.disciplinas?.map((disc) => (
              <tr key={disc.id} className="hover:bg-gray-50/50 transition print:hover:bg-none">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{disc.nome}</p>
                  <p className="text-[10px] text-gray-400">CH: {disc.cargaHoraria} horas</p>
                </td>
                <td className="p-4 text-gray-650 text-xs">{disc.professor}</td>
                <td className="p-4 text-center font-medium">{disc.notas?.AP1 ?? '-'}</td>
                <td className="p-4 text-center font-medium">{disc.notas?.AP2 ?? '-'}</td>
                <td className="p-4 text-center font-medium">{disc.notas?.AP3 ?? '-'}</td>
                <td className="p-4 text-center font-bold text-teal-800">{disc.mediaFinal ?? '-'}</td>
                <td className="p-4 text-center">{disc.frequencia !== null ? `${disc.frequencia}%` : '100%'}</td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${
                    disc.situacao === 'APROVADO' ? 'bg-green-50 text-green-700 border border-green-200' :
                    disc.situacao === 'EXAME_FINAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  } print:bg-none print:border print:text-black`}>
                    {disc.situacao}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
