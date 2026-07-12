import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function DeclaracaoPage() {
  const router = useRouter();
  const { id, tipo } = router.query;

  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (id) {
      fetch(`/api/alunos/${id}`, { credentials: 'include' })
        .then(r => {
          if (!r.ok) throw new Error('Falha ao carregar dados do aluno.');
          return r.json();
        })
        .then(data => setAluno(data))
        .catch(err => setErro(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados para emissão...</div>;
  if (erro || !aluno) return <div className="p-8 text-center text-red-500">⚠️ Erro: {erro || 'Aluno não encontrado.'}</div>;

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Textos padrão de declarações
  const renderCorpo = () => {
    switch (tipo) {
      case 'frequencia':
        return (
          <p className="text-justify text-gray-800 leading-relaxed text-base">
            Declaramos, para os devidos fins, que o(a) estudante <strong>{aluno.nome}</strong>,
            portador(a) do CPF sob nº <strong>{aluno.cpf || '—'}</strong>, está regularmente matriculado(a) e frequenta
            as aulas do curso <strong>{aluno.curso?.nome || 'Ensino Geral'}</strong>, sob a turma <strong>{aluno.turma?.nome || '—'}</strong>,
            ano letivo de <strong>{aluno.ano_letivo || new Date().getFullYear()}</strong>, tendo obtido até a presente data a frequência acumulada
            satisfatória de <strong>95% (noventa e cinco por cento)</strong> das atividades acadêmicas presenciais.
          </p>
        );
      case 'conclusao':
        return (
          <p className="text-justify text-gray-800 leading-relaxed text-base">
            Declaramos, para os devidos fins, que o(a) estudante <strong>{aluno.nome}</strong>,
            portador(a) do CPF sob nº <strong>{aluno.cpf || '—'}</strong>, concluiu com aproveitamento satisfatório todas as
            matérias e componentes curriculares exigidos para a conclusão do curso <strong>{aluno.curso?.nome || 'Ensino Geral'}</strong>,
            nesta instituição de ensino, estando apto(a) a colar grau e receber o respectivo certificado/diploma.
          </p>
        );
      case 'matricula':
      default:
        return (
          <p className="text-justify text-gray-800 leading-relaxed text-base">
            Declaramos, para os devidos fins e efeitos de comprovação, que o(a) estudante <strong>{aluno.nome}</strong>,
            portador(a) do CPF sob nº <strong>{aluno.cpf || '—'}</strong>, encontra-se devidamente matriculado(a) nesta
            instituição de ensino no curso <strong>{aluno.curso?.nome || 'Ensino Geral'}</strong>, sob a turma <strong>{aluno.turma?.nome || '—'}</strong>,
            no ano letivo de <strong>{aluno.ano_letivo || new Date().getFullYear()}</strong>, com situação de matrícula ativa sob o status <strong>{aluno.statusmatricula || 'ATIVO'}</strong>.
          </p>
        );
    }
  };

  const titles = {
    matricula: 'Declaração de Matrícula',
    frequencia: 'Declaração de Frequência',
    conclusao: 'Declaração de Conclusão'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col print:bg-white print:p-0">
      {/* Header Administrativo (Ocultado no print) */}
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/admin/alunos`}>
            <div className="text-gray-500 hover:text-gray-700 font-bold cursor-pointer text-sm">
              ⬅️ Voltar para Alunos
            </div>
          </Link>
          <span className="text-gray-300">|</span>
          <h2 className="text-lg font-bold text-gray-850">{titles[tipo] || 'Declaração Acadêmica'}</h2>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition shadow cursor-pointer"
        >
          🖨️ Imprimir Declaração
        </button>
      </header>

      {/* Papel Timbrado do ERP para Impressão */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-12 bg-white my-8 shadow-sm border border-gray-150 print:border-0 print:shadow-none print:my-0 print:p-0">
        
        {/* Cabeçalho do Papel Timbrado */}
        <div className="flex flex-col items-center text-center space-y-2 border-b-2 border-teal-800 pb-6 mb-12">
          <span className="text-2xl font-extrabold text-teal-800 tracking-wider">GRUPO CREESER EDUCACIONAL</span>
          <span className="text-xs text-gray-500 uppercase tracking-widest">Secretaria Geral Acadêmica · Inove Técnico</span>
          <span className="text-[10px] text-gray-400">CNPJ: 12.345.678/0001-90 · Av. Principal, 1000 - Centro</span>
        </div>

        {/* Título do Documento */}
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-800 underline decoration-teal-600 decoration-2 underline-offset-8">
            {titles[tipo]?.toUpperCase() || 'DECLARAÇÃO'}
          </h1>
        </div>

        {/* Corpo do Texto */}
        <div className="space-y-8 min-h-[300px]">
          {renderCorpo()}
        </div>

        {/* Data e Local */}
        <div className="text-right mt-16 text-sm text-gray-700">
          Teresina - PI, {hoje}.
        </div>

        {/* Assinatura */}
        <div className="mt-24 flex flex-col items-center justify-center">
          <div className="border-t border-gray-400 w-64 pt-2 text-center text-xs text-gray-500">
            <span className="block font-bold text-gray-800 text-sm">Assinatura da Secretaria</span>
            <span>Inove Técnico</span>
          </div>
        </div>

      </main>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden, header, button {
            display: none !important;
          }
          main {
            border: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
