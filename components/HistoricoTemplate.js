export default function HistoricoTemplate({ data }) {
  if (!data) return <p className="text-gray-500 text-center py-8">Sem dados de histórico para exibir.</p>;

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:mx-0 print:w-full">
      {/* Cabeçalho Oficial */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-teal-800 pb-6 mb-6 gap-4 print:flex-row print:justify-between print:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-teal-800 uppercase tracking-tight">{data.instituicao?.nome || 'CREESER Educacional'}</h2>
          <p className="text-xs text-gray-500 mt-1">CNPJ: {data.instituicao?.cnpj || '00.000.000/0001-00'}</p>
          <p className="text-xs text-gray-500">{data.instituicao?.endereco || 'Endereço da Instituição'}</p>
        </div>
        <div className="text-right md:text-right print:text-right">
          <span className="px-4 py-1.5 bg-teal-50 text-teal-800 font-bold rounded-full text-xs uppercase tracking-wider print:bg-none print:border print:border-teal-800">
            Histórico Escolar Oficial
          </span>
          <p className="text-xs text-gray-400 mt-2">Ano Letivo: {data.anoLetivo}</p>
        </div>
      </div>

      {/* Dados Pessoais do Aluno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-teal-50/40 p-5 rounded-2xl mb-8 print:grid-cols-3 print:p-4 print:bg-slate-50 print:border print:border-gray-200">
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">Nome do Aluno</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.aluno?.nome}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">Matrícula</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.aluno?.matricula}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">CPF</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.aluno?.cpf || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">RG</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.aluno?.rg || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">Data de Nascimento</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.aluno?.dataNascimento ? new Date(data.aluno.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-teal-600 uppercase">Curso</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.curso}</p>
        </div>
      </div>

      {/* Tabela de Disciplinas */}
      <div className="overflow-x-auto rounded-2xl border border-gray-150 mb-8">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-teal-800 text-white font-semibold print:bg-teal-900">
              <th className="p-4">Componente Curricular (Disciplina)</th>
              <th className="p-4 text-center">Período</th>
              <th className="p-4 text-center">Carga Horária</th>
              <th className="p-4 text-center">Média Final</th>
              <th className="p-4 text-center">Freq. (%)</th>
              <th className="p-4 text-center">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.disciplinas?.map((disc) => (
              <tr key={disc.id} className="hover:bg-gray-55/30 transition print:hover:bg-none">
                <td className="p-4 font-bold text-gray-800">{disc.nome}</td>
                <td className="p-4 text-center text-gray-650">{disc.periodo}</td>
                <td className="p-4 text-center text-gray-650">{disc.cargaHoraria}h</td>
                <td className="p-4 text-center font-bold text-teal-800">{disc.mediaFinal ?? '-'}</td>
                <td className="p-4 text-center">{disc.frequencia}</td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${
                    disc.situacao === 'APROVADO' ? 'bg-green-50 text-green-700 border border-green-200' :
                    disc.situacao === 'EXAME_FINAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    disc.situacao === 'NÃO INICIADO' ? 'bg-gray-50 text-gray-500 border border-gray-200' :
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

      {/* Registro de Registro / Registro em Livro */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-150 mb-12 print:grid-cols-4 print:p-4">
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase">Livro de Registro</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.livroRegistro?.livro}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase">Folha</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.livroRegistro?.folha}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase">No. do Registro</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.livroRegistro?.numeroRegistro}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase">Data do Registro</p>
          <p className="font-bold text-gray-800 text-sm mt-0.5">{data.livroRegistro?.dataConclusao ? new Date(data.livroRegistro.dataConclusao).toLocaleDateString('pt-BR') : 'N/A'}</p>
        </div>
      </div>

      {/* Campo de Assinatura */}
      <div className="flex flex-col items-center justify-center pt-8 border-t border-gray-200 print:pt-6">
        <div className="w-64 border-b border-gray-400 text-center pb-2">
          {/* Assinatura em Branco */}
        </div>
        <p className="text-xs font-bold text-gray-700 mt-2 uppercase tracking-wide">Secretaria Acadêmica</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{data.instituicao?.nome}</p>
      </div>
    </div>
  );
}
