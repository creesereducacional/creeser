import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function FichaAlunoPage() {
  const router = useRouter();
  const { id } = router.query;

  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (id) {
      fetch(`/api/alunos/${id}`, { credentials: 'include' })
        .then((r) => {
          if (!r.ok) throw new Error('Falha ao carregar dados do aluno.');
          return r.json();
        })
        .then((data) => setAluno(data))
        .catch((err) => setErro(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Carregando Ficha do Aluno...</div>;
  }

  if (erro || !aluno) {
    return <div className="p-8 text-center text-red-500 font-bold">⚠️ Erro: {erro || 'Aluno não encontrado.'}</div>;
  }

  const dataImpressao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatData = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      return isNaN(date.getTime()) ? d : date.toLocaleDateString('pt-BR');
    } catch (_) {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col print:bg-white print:p-0">
      {/* Topo Administrativo (Ocultado no Print) */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin/alunos">
            <button className="text-slate-600 hover:text-teal-700 font-semibold text-xs flex items-center gap-1 cursor-pointer">
              <span>⬅️</span> Voltar para Listagem de Alunos
            </button>
          </Link>
          <span className="text-slate-300">|</span>
          <h2 className="text-sm font-bold text-slate-800">
            Ficha Cadastral · {aluno.nome}
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-2 cursor-pointer"
          >
            <span>🖨️</span> Imprimir / Salvar PDF
          </button>
        </div>
      </header>

      {/* Papel Timbrado / Documento Oficial */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-10 bg-white my-6 shadow-md border border-slate-200 print:border-0 print:shadow-none print:my-0 print:p-0">
        
        {/* Cabeçalho Oficial com Logo */}
        <div className="flex justify-between items-center pb-6 mb-6 border-b-2 border-teal-800">
          <div className="flex items-center gap-4">
            <div className="w-40 h-16 flex items-center justify-center">
              <img
                src="/images/logo_creeser.png"
                alt="CREESER"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-teal-900 tracking-tight">
                GRUPO CREESER EDUCACIONAL
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Ficha Individual de Cadastro de Aluno
              </p>
              <p className="text-[10px] text-slate-400">
                Emitido em: {dataImpressao}
              </p>
            </div>
          </div>

          {/* Foto do Aluno */}
          <div className="w-28 h-36 border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex flex-col items-center justify-center shadow-inner text-slate-400 flex-shrink-0">
            {aluno.foto ? (
              <img
                src={aluno.foto}
                alt={aluno.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2">
                <span className="text-3xl block mb-1">👤</span>
                <span className="text-[9px] font-semibold uppercase text-slate-400">Foto 3x4</span>
              </div>
            )}
          </div>
        </div>

        {/* Resumo do Aluno */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase block text-[10px]">Matrícula</span>
            <span className="font-bold text-teal-800 text-sm">{aluno.matricula || aluno.numero_id || `#${aluno.id}`}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase block text-[10px]">Status</span>
            <span className="font-bold text-slate-800">{aluno.statusmatricula || aluno.status || 'ATIVO'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase block text-[10px]">Ano Letivo</span>
            <span className="font-bold text-slate-800">{aluno.ano_letivo || aluno.anoLetivo || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase block text-[10px]">Turma / Curso</span>
            <span className="font-bold text-slate-800 truncate block">{aluno.turma || aluno.turmaid || '—'}</span>
          </div>
        </div>

        {/* Seção 1: Dados Pessoais */}
        <div className="mb-6">
          <h3 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1.5 rounded-md border-l-4 border-teal-600 mb-3">
            1. Dados Pessoais do Estudante
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5 text-xs text-slate-700">
            <div className="col-span-2 md:col-span-3">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Nome Completo</span>
              <span className="font-bold text-slate-900 text-sm">{aluno.nome}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">CPF</span>
              <span className="font-semibold">{aluno.cpf || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">RG / UF</span>
              <span className="font-semibold">{aluno.rg ? `${aluno.rg} ${aluno.uf_rg ? `/ ${aluno.uf_rg}` : ''}` : '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Data de Nascimento</span>
              <span className="font-semibold">{formatData(aluno.data_nascimento)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Sexo</span>
              <span className="font-semibold">{aluno.sexo || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Estado Civil</span>
              <span className="font-semibold">{aluno.estadocivil || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Telefone / Celular</span>
              <span className="font-semibold">{aluno.telefone_celular || aluno.telefone || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">E-mail</span>
              <span className="font-semibold">{aluno.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Naturalidade / UF</span>
              <span className="font-semibold">{aluno.naturalidade ? `${aluno.naturalidade} ${aluno.uf_naturalidade ? `/ ${aluno.uf_naturalidade}` : ''}` : '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Nacionalidade</span>
              <span className="font-semibold">{aluno.nacionalidade || 'Brasileira'}</span>
            </div>
          </div>
        </div>

        {/* Seção 2: Filiação */}
        <div className="mb-6">
          <h3 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1.5 rounded-md border-l-4 border-teal-600 mb-3">
            2. Filiação e Responsáveis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Nome da Mãe</span>
              <span className="font-bold text-slate-800">{aluno.mae || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Nome do Pai</span>
              <span className="font-bold text-slate-800">{aluno.pai || '—'}</span>
            </div>
          </div>
        </div>

        {/* Seção 3: Endereço Residencial */}
        <div className="mb-6">
          <h3 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1.5 rounded-md border-l-4 border-teal-600 mb-3">
            3. Endereço Residencial
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2.5 text-xs text-slate-700">
            <div className="col-span-2">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Logradouro</span>
              <span className="font-semibold">{aluno.endereco ? `${aluno.endereco}, ${aluno.numeroendereco || 'S/N'}` : '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Bairro</span>
              <span className="font-semibold">{aluno.bairro || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">CEP</span>
              <span className="font-semibold">{aluno.cep || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Cidade / UF</span>
              <span className="font-semibold">{aluno.cidade ? `${aluno.cidade} / ${aluno.estado || ''}` : '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Complemento</span>
              <span className="font-semibold">{aluno.complemento || '—'}</span>
            </div>
          </div>
        </div>

        {/* Seção 4: Dados Financeiros & Adicionais */}
        <div className="mb-6">
          <h3 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1.5 rounded-md border-l-4 border-teal-600 mb-3">
            4. Dados Financeiros & Adicionais
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2.5 text-xs text-slate-700">
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Plano Financeiro</span>
              <span className="font-semibold">{aluno.plano_financeiro || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Valor Mensalidade</span>
              <span className="font-semibold">{aluno.valor_mensalidade ? `R$ ${Number(aluno.valor_mensalidade).toFixed(2)}` : '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Pessoa com Deficiência</span>
              <span className="font-semibold">{aluno.pessoa_com_deficiencia ? `Sim (${aluno.tipo_deficiencia || 'Não especificada'})` : 'Não'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Título Eleitoral</span>
              <span className="font-semibold">{aluno.titulo_eleitoral || '—'}</span>
            </div>
          </div>
        </div>

        {/* Assinatura / Validação */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-6">
          <div className="text-center md:text-left">
            <p className="font-semibold text-slate-700">CREESER Educacional</p>
            <p className="text-[10px]">Documento gerado eletronicamente pelo Sistema de Gestão Escolar.</p>
          </div>
          <div className="w-64 border-t border-slate-400 pt-1 text-center text-[11px]">
            <span>Assinatura do Responsável / Secretaria</span>
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
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
