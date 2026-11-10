import { useState, useEffect, useRef } from 'react';

const MESES = [
  { valor: 1, nome: 'Janeiro' },
  { valor: 2, nome: 'Fevereiro' },
  { valor: 3, nome: 'Março' },
  { valor: 4, nome: 'Abril' },
  { valor: 5, nome: 'Maio' },
  { valor: 6, nome: 'Junho' },
  { valor: 7, nome: 'Julho' },
  { valor: 8, nome: 'Agosto' },
  { valor: 9, nome: 'Setembro' },
  { valor: 10, nome: 'Outubro' },
  { valor: 11, nome: 'Novembro' },
  { valor: 12, nome: 'Dezembro' },
];

export default function ModalFrequenciaMensal({ isOpen, onClose, turma }) {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState('');
  const [professorManual, setProfessorManual] = useState('');

  const [loadingDados, setLoadingDados] = useState(false);
  const [erro, setErro] = useState('');
  const [dadosTurma, setDadosTurma] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('config'); // 'config' | 'preview'
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const printAreaRef = useRef(null);

  useEffect(() => {
    if (isOpen && turma?.id) {
      carregarDadosTurma(turma.id);
      setAbaAtiva('config');
      setErro('');
    }
  }, [isOpen, turma?.id]);

  const carregarDadosTurma = async (id) => {
    try {
      setLoadingDados(true);
      setErro('');
      const res = await fetch(`/api/turmas/${id}/frequencia-mensal`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao carregar dados da turma');
      }
      const data = await res.json();
      setDadosTurma(data);
      if (data.disciplinas && data.disciplinas.length > 0) {
        setDisciplinaSelecionada(data.disciplinas[0].nome);
      } else {
        setDisciplinaSelecionada('');
      }
    } catch (err) {
      console.error(err);
      setErro(err.message || 'Erro ao carregar dados');
    } finally {
      setLoadingDados(false);
    }
  };

  if (!isOpen || !turma) return null;

  // Dias do mês
  const qtdDiasNoMes = new Date(ano, mes, 0).getDate();
  const diasArray = Array.from({ length: qtdDiasNoMes }, (_, i) => i + 1);

  // Instituição Vinculada
  const instituicao = dadosTurma?.instituicao || null;
  const alunos = dadosTurma?.alunos || [];

  // Dividir alunos em páginas (18 alunos por página no A4 paisagem)
  const ALUNOS_POR_PAGINA = 16;
  const paginasAlunos = [];
  if (alunos.length === 0) {
    paginasAlunos.push([]);
  } else {
    for (let i = 0; i < alunos.length; i += ALUNOS_POR_PAGINA) {
      paginasAlunos.push(alunos.slice(i, i + ALUNOS_POR_PAGINA));
    }
  }

  // Dividir alunos para a Página 3 (Controle de Notas - 16 por página para acomodar linha de reposição e assinaturas)
  const ALUNOS_POR_PAGINA_NOTAS = 15;
  const paginasAlunosNotas = [];
  if (alunos.length === 0) {
    paginasAlunosNotas.push([]);
  } else {
    for (let i = 0; i < alunos.length; i += ALUNOS_POR_PAGINA_NOTAS) {
      paginasAlunosNotas.push(alunos.slice(i, i + ALUNOS_POR_PAGINA_NOTAS));
    }
  }

  const nomeMesExtenso = MESES.find((m) => m.valor === Number(mes))?.nome || mes;

  const handleBaixarPdf = async () => {
    if (!printAreaRef.current || gerandoPdf) return;
    setGerandoPdf(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printAreaRef.current;
      const opt = {
        // Margens padrão A4 Paisagem requeridas: [superior, esquerda, inferior, direita] = 15mm, 12mm, 15mm, 12mm
        margin: [15, 12, 15, 12],
        filename: `frequencia_${turma.nome?.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${nomeMesExtenso.toLowerCase()}_${ano}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css'], avoid: ['.pagina-frequencia'] },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Erro ao gerar PDF via html2pdf:', err);
      window.print();
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in-50 duration-200">
        
        {/* Topo do Modal */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-800 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner">
              📋
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Ficha de Frequência Mensal
                </h3>
              </div>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Turma: <strong className="text-white">{turma.nome}</strong> • {turma.curso || dadosTurma?.turma?.curso || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setAbaAtiva('config')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  abaAtiva === 'config'
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-teal-100 hover:text-white'
                }`}
              >
                ⚙️ Configurações
              </button>
              <button
                type="button"
                onClick={() => setAbaAtiva('preview')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  abaAtiva === 'preview'
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-teal-100 hover:text-white'
                }`}
              >
                👁️ Pré-visualização A4
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition ml-2 cursor-pointer"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50">
          {loadingDados ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin text-3xl mb-3 text-teal-600">⏳</div>
              <div className="text-sm font-semibold text-slate-700">Carregando dados da turma e matrículas ativas...</div>
              <div className="text-xs text-slate-400 mt-1">Verificando isolamento institucional e alunos matriculados</div>
            </div>
          ) : erro ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <strong>⚠️ Não foi possível carregar os dados:</strong> {erro}
            </div>
          ) : abaAtiva === 'config' ? (
            <div className="max-w-3xl mx-auto space-y-5">
              
              {/* Card de Identificação Institucional Resolvida */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="w-20 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                  {instituicao?.logo ? (
                    <img src={instituicao.logo} alt={instituicao.nome} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-2xl font-bold text-teal-700">
                      {instituicao?.nome ? instituicao.nome.charAt(0) : '🏛️'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Instituição Vinculada à Turma
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-800 truncate">
                    {instituicao?.nome || 'Instituição Vinculada à Turma'}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                    {instituicao?.cnpj && <span>CNPJ: {instituicao.cnpj}</span>}
                    {instituicao?.email && <span>Email: {instituicao.email}</span>}
                    {instituicao?.cidade && <span>Local: {instituicao.cidade} - {instituicao.estado}</span>}
                    {instituicao?.pendenciaLogo && (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ⚠️ Logomarca não cadastrada no perfil desta instituição (identificação textual preservada)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {alunos.length} Aluno(s) Ativo(s)
                  </span>
                </div>
              </div>

              {/* Formulário de Parâmetros */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span>📅</span> Parâmetros da Ficha de Frequência
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mês de Referência *</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                    >
                      {MESES.map((m) => (
                        <option key={m.valor} value={m.valor}>
                          {m.nome} ({String(m.valor).padStart(2, '0')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ano *</label>
                    <input
                      type="number"
                      value={ano}
                      onChange={(e) => setAno(Number(e.target.value))}
                      min="2020"
                      max="2035"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Disciplina *</label>
                    {dadosTurma?.disciplinas && dadosTurma.disciplinas.length > 0 ? (
                      <div className="space-y-1.5">
                        <select
                          value={disciplinaSelecionada}
                          onChange={(e) => setDisciplinaSelecionada(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                        >
                          {dadosTurma.disciplinas.map((d) => (
                            <option key={d.id} value={d.nome}>
                              {d.nome} {d.cargahoraria ? `(${d.cargahoraria}h)` : ''}
                            </option>
                          ))}
                          <option value="__OUTRA__">Digitar outra disciplina...</option>
                        </select>
                        {disciplinaSelecionada === '__OUTRA__' && (
                          <input
                            type="text"
                            placeholder="Nome da disciplina..."
                            onChange={(e) => setDisciplinaSelecionada(e.target.value)}
                            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            autoFocus
                          />
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Ex: Anatomia Humana, Administração Básica..."
                        value={disciplinaSelecionada}
                        onChange={(e) => setDisciplinaSelecionada(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Professor(a) <span className="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Deixe em branco para preenchimento manual"
                      value={professorManual}
                      onChange={(e) => setProfessorManual(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Resumo de Alunos com Matrícula Ativa */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>👥</span> Alunos Matriculados Ativos na Turma
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Total: <strong className="text-teal-700">{alunos.length}</strong>
                  </span>
                </div>

                {alunos.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Nenhum aluno com status ATIVO encontrado nesta turma.
                  </div>
                ) : (
                  <div className="mt-3 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {alunos.map((a, idx) => (
                      <div key={a.id} className="py-2 px-1 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-right font-mono text-slate-400 text-[11px]">{idx + 1}.</span>
                          <span className="font-semibold text-slate-800">{a.nome}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Matrícula: <strong className="text-slate-700">{a.matricula}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Avançar para o Preview */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAbaAtiva('preview')}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <span>👁️</span> Visualizar Ficha A4 e Salvar PDF
                </button>
              </div>

            </div>
          ) : (
            /* ── ABA DE PRÉ-VISUALIZAÇÃO A4 PAISAGEM ── */
            <div className="space-y-4">
              
              {/* Barra de Ações do Preview */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Exibindo pré-visualização em formato <strong>A4 Paisagem (Landscape)</strong> • {paginasAlunos.length + 1 + paginasAlunosNotas.length} páginas (Frequência, Conteúdo e Atividades, Controle de Notas)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBaixarPdf}
                    disabled={gerandoPdf}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    {gerandoPdf ? (
                      <>
                        <span className="animate-spin text-sm">⏳</span> Gerando PDF...
                      </>
                    ) : (
                      <>
                        <span>📥</span> Salvar PDF
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Área Imprimível (A4 Paisagem: largura útil de 273mm após margens de 12mm) */}
              <div className="overflow-x-auto pb-6">
                <div
                  ref={printAreaRef}
                  className="bg-white mx-auto shadow-md border border-slate-300 print:shadow-none print:border-0 print:m-0"
                  style={{ width: '273mm', minHeight: '180mm', height: '180mm', maxHeight: '180mm', boxSizing: 'border-box' }}
                >
                  <style orientation="landscape">{`
                    @media print {
                      @page {
                        size: A4 landscape;
                        margin: 15mm 12mm 15mm 12mm;
                      }
                      body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0 !important;
                        padding: 0 !important;
                      }
                      .pagina-frequencia {
                        page-break-after: always !important;
                        break-after: page !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        height: 180mm !important;
                        max-height: 180mm !important;
                        box-sizing: border-box !important;
                      }
                      .pagina-frequencia:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                      }
                    }
                  `}</style>

                  {paginasAlunos.map((grupoAlunos, pagIndex) => (
                    <div
                      key={`freq-${pagIndex}`}
                      className="pagina-frequencia p-3 sm:p-4 text-slate-900 flex flex-col justify-between"
                      style={{
                        minHeight: '180mm', height: '180mm', maxHeight: '180mm',
                        pageBreakAfter: 'always',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* Topo Oficial Timbrado */}
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800 gap-4">
                          {/* Logo e Nome da Instituição */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-28 h-14 flex items-center justify-center border border-slate-200 rounded p-1 bg-white shrink-0">
                              {instituicao?.logo ? (
                                <img
                                  src={instituicao.logo}
                                  alt={instituicao.nome}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <div className="text-center px-1">
                                  <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase block leading-tight">
                                    {instituicao?.nome ? instituicao.nome.slice(0, 18) : 'INSTITUIÇÃO'}
                                  </span>
                                  <span className="text-[7.5px] text-amber-700 font-bold block mt-0.5">
                                    [Sem logo oficial]
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                                {instituicao?.nome || 'GRUPO CREESER EDUCACIONAL'}
                              </h1>
                              <p className="text-[9.5px] text-slate-600 font-medium leading-normal mt-0.5">
                                {instituicao?.cnpj ? `CNPJ: ${instituicao.cnpj}` : ''}
                                {instituicao?.cidade ? ` • ${instituicao.cidade} - ${instituicao.estado}` : ''}
                                {instituicao?.telefone ? ` • Tel: ${instituicao.telefone}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Título do Documento */}
                          <div className="text-right shrink-0">
                            <div className="text-base font-black text-slate-900 tracking-wider uppercase">
                              FREQUÊNCIA
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase">
                              Ficha de Frequência
                            </div>
                            <div className="text-[8.5px] text-slate-400 mt-0.5">
                              {paginasAlunos.length > 1
                                ? `Página 1.${pagIndex + 1} de 1.${paginasAlunos.length}`
                                : 'Página 1 de 3'}
                            </div>
                          </div>
                        </div>

                        {/* Grade de Metadados da Turma e Disciplina (sem corte de texto) */}
                        <div className="grid grid-cols-4 gap-2 my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                          <div>
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Curso:</span>
                            <span className="font-bold text-slate-900 leading-snug break-words block">
                              {turma.curso || dadosTurma?.turma?.curso || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Turma:</span>
                            <span className="font-bold text-slate-900 leading-snug break-words block">
                              {turma.nome} {turma.turno ? `(${turma.turno})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Disciplina:</span>
                            <span className="font-bold text-slate-900 leading-snug break-words block">
                              {disciplinaSelecionada || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Mês / Ano:</span>
                            <span className="font-bold text-teal-800 uppercase block leading-snug">
                              {nomeMesExtenso} / {ano}
                            </span>
                          </div>

                          <div className="col-span-2 pt-1.5 border-t border-slate-200/60 mt-1">
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Professor(a):</span>
                            <span className="font-medium text-slate-800 leading-snug block">
                              {professorManual.trim() || '__________________________________________________'}
                            </span>
                          </div>
                          <div className="col-span-2 pt-1.5 border-t border-slate-200/60 mt-1">
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Horário / Carga Horária:</span>
                            <span className="font-medium text-slate-800 leading-snug block">
                              Turno {turma.turno || 'Regular'} • Conforme cronograma pedagógico
                            </span>
                          </div>
                        </div>

                        {/* Tabela de Frequência Mensal */}
                        <div className="overflow-hidden border border-slate-300 rounded">
                          <table className="w-full border-collapse text-[9px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                                <th className="p-1 border-r border-slate-300 w-6 text-center">Nº</th>
                                <th className="p-1 border-r border-slate-300 text-left min-w-[150px] max-w-[200px]">
                                    Nome do Aluno
                                </th>
                                <th className="p-1 border-r border-slate-300 text-center w-20">
                                  Matrícula
                                </th>
                                
                                {/* Colunas dos Dias do Mês */}
                                {diasArray.map((dia) => (
                                  <th
                                    key={dia}
                                    className="p-0.5 border-r border-slate-300 text-center font-bold text-[8px] bg-slate-50"
                                    style={{ width: '18px' }}
                                  >
                                    {dia}
                                  </th>
                                ))}

                                {/* Colunas Finais P e F */}
                                <th className="p-1 border-r border-slate-300 text-center w-7 bg-emerald-50 text-emerald-800 font-bold">
                                  P
                                </th>
                                <th className="p-1 text-center w-7 bg-rose-50 text-rose-800 font-bold">
                                  F
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {grupoAlunos.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={3 + diasArray.length + 2}
                                    className="p-6 text-center text-slate-400 italic text-xs"
                                  >
                                    Nenhum aluno com matrícula ativa nesta turma.
                                  </td>
                                </tr>
                              ) : (
                                grupoAlunos.map((aluno, idxAluno) => {
                                  const numGlobal = pagIndex * ALUNOS_POR_PAGINA + idxAluno + 1;
                                  return (
                                    <tr
                                      key={aluno.id}
                                      className={`border-b border-slate-200 ${
                                        idxAluno % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                                      }`}
                                      style={{ height: '24px' }}
                                    >
                                      <td className="p-1 border-r border-slate-300 text-center font-bold text-slate-500">
                                        {numGlobal}
                                      </td>
                                      <td className="p-1 border-r border-slate-300 font-bold text-slate-800 uppercase truncate">
                                        {aluno.nome}
                                      </td>
                                      <td className="p-1 border-r border-slate-300 text-center font-mono text-[8px] text-slate-600">
                                        {aluno.matricula}
                                      </td>

                                      {/* Células vazias para coleta manual */}
                                      {diasArray.map((dia) => (
                                        <td
                                          key={dia}
                                          className="border-r border-slate-200 text-center"
                                          style={{ width: '18px' }}
                                        >
                                          &nbsp;
                                        </td>
                                      ))}

                                      {/* Totais P / F para preenchimento manual */}
                                      <td className="border-r border-slate-300 text-center bg-emerald-50/30">
                                        &nbsp;
                                      </td>
                                      <td className="text-center bg-rose-50/30">
                                        &nbsp;
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Rodapé da Página 1: Assinaturas e Legenda */}
                      <div className="pt-3 border-t border-slate-300 mt-2 text-[9px] text-slate-600">
                        <div className="grid grid-cols-3 gap-6 items-end pb-2">
                          <div className="text-center">
                            <div className="border-b border-slate-400 mb-1 h-6"></div>
                            <span className="font-semibold text-slate-700 block">Assinatura do(a) Professor(a)</span>
                          </div>
                          <div className="text-center">
                            <div className="border-b border-slate-400 mb-1 h-6"></div>
                            <span className="font-semibold text-slate-700 block">Coordenação Pedagógica / Secretaria</span>
                          </div>
                          <div className="text-right text-[8px] text-slate-400">
                            <div><strong>Legenda:</strong> P = Presença • F = Falta • J = Justificada</div>
                            <div className="mt-0.5">Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}

                  {/* ══════════════════════════════════════════════════════════════════ */}
                  {/* PÁGINA 2 — CONTEÚDO E ATIVIDADES                                    */}
                  {/* ══════════════════════════════════════════════════════════════════ */}
                  <div
                    className="pagina-frequencia p-3 sm:p-4 text-slate-900 flex flex-col justify-between"
                    style={{
                      minHeight: '180mm', height: '180mm', maxHeight: '180mm',
                      pageBreakAfter: 'always',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div>
                      {/* Topo Oficial Timbrado */}
                      <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800 gap-4">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-28 h-14 flex items-center justify-center border border-slate-200 rounded p-1 bg-white shrink-0">
                            {instituicao?.logo ? (
                              <img
                                src={instituicao.logo}
                                alt={instituicao.nome}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-center px-1">
                                <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase block leading-tight">
                                  {instituicao?.nome ? instituicao.nome.slice(0, 18) : 'INSTITUIÇÃO'}
                                </span>
                                <span className="text-[7.5px] text-amber-700 font-bold block mt-0.5">
                                  [Sem logo oficial]
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                              {instituicao?.nome || 'GRUPO CREESER EDUCACIONAL'}
                            </h1>
                            <p className="text-[9.5px] text-slate-600 font-medium leading-normal mt-0.5">
                              {instituicao?.cnpj ? `CNPJ: ${instituicao.cnpj}` : ''}
                              {instituicao?.cidade ? ` • ${instituicao.cidade} - ${instituicao.estado}` : ''}
                              {instituicao?.telefone ? ` • Tel: ${instituicao.telefone}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Título do Documento */}
                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-slate-900 tracking-wider uppercase">
                            CONTEÚDO E ATIVIDADES
                          </div>
                          <div className="text-[10px] font-bold text-slate-600 uppercase">
                            Registro Pedagógico
                          </div>
                          <div className="text-[8.5px] text-slate-400 mt-0.5">
                            Página 2 de 3
                          </div>
                        </div>
                      </div>

                      {/* Metadados: Turma, Disciplina e Professor(a) */}
                      <div className="grid grid-cols-4 gap-2 my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                        <div>
                          <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Curso:</span>
                          <span className="font-bold text-slate-900 leading-snug break-words block">
                            {turma.curso || dadosTurma?.turma?.curso || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Turma:</span>
                          <span className="font-bold text-slate-900 leading-snug break-words block">
                            {turma.nome} {turma.turno ? `(${turma.turno})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Disciplina:</span>
                          <span className="font-bold text-slate-900 leading-snug break-words block">
                            {disciplinaSelecionada || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Mês / Ano:</span>
                          <span className="font-bold text-teal-800 uppercase block leading-snug">
                            {nomeMesExtenso} / {ano}
                          </span>
                        </div>

                        <div className="col-span-4 pt-1.5 border-t border-slate-200/60 mt-1">
                          <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Professor(a):</span>
                          <span className="font-medium text-slate-800 leading-snug block">
                            {professorManual.trim() || '__________________________________________________'}
                          </span>
                        </div>
                      </div>

                      {/* Tabela de Conteúdo e Atividades */}
                      <div className="overflow-hidden border border-slate-300 rounded">
                        <table className="w-full border-collapse text-[9px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                              <th className="p-1.5 border-r border-slate-300 w-20 text-center uppercase">
                                DATA
                              </th>
                              <th className="p-1.5 border-r border-slate-300 w-14 text-center uppercase">
                                CH
                              </th>
                              <th className="p-1.5 border-r border-slate-300 text-left uppercase">
                                REGISTRO DO CONTEÚDO E ATIVIDADES PEDAGÓGICAS DESENVOLVIDAS
                              </th>
                              <th className="p-1.5 text-center w-52 uppercase">
                                ASSINATURA DO PROFESSOR(A)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 11 }).map((_, idx) => (
                              <tr
                                key={`conteudo-row-${idx}`}
                                className={`border-b border-slate-200 ${
                                  idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                                }`}
                                style={{ height: '24px' }}
                              >
                                <td className="p-1 border-r border-slate-300 text-center text-slate-400">
                                  &nbsp;
                                </td>
                                <td className="p-1 border-r border-slate-300 text-center text-slate-400">
                                  &nbsp;
                                </td>
                                <td className="p-1 border-r border-slate-300 text-left">
                                  &nbsp;
                                </td>
                                <td className="p-1 text-center">
                                  &nbsp;
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Rodapé da Página 2: Observações e Assinaturas */}
                    <div className="pt-3 border-t border-slate-300 mt-2 text-[9px] text-slate-600">
                      <div className="grid grid-cols-3 gap-6 items-end pb-2">
                        <div className="text-center">
                          <div className="border-b border-slate-400 mb-1 h-6"></div>
                          <span className="font-semibold text-slate-700 block">Assinatura do(a) Professor(a)</span>
                        </div>
                        <div className="text-center">
                          <div className="border-b border-slate-400 mb-1 h-6"></div>
                          <span className="font-semibold text-slate-700 block">Visto da Coordenação Pedagógica</span>
                        </div>
                        <div className="text-right text-[8px] text-slate-400">
                          <div>Registro oficial de cumprimento de conteúdo e carga horária</div>
                          <div className="mt-0.5">Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ══════════════════════════════════════════════════════════════════ */}
                  {/* PÁGINA 3 — CONTROLE DE NOTAS DA DISCIPLINA                          */}
                  {/* ══════════════════════════════════════════════════════════════════ */}
                  {paginasAlunosNotas.map((grupoAlunosNotas, pagNotasIndex) => (
                    <div
                      key={`notas-${pagNotasIndex}`}
                      className="pagina-frequencia p-3 sm:p-4 text-slate-900 flex flex-col justify-between"
                      style={{
                        minHeight: '180mm', height: '180mm', maxHeight: '180mm',
                        pageBreakAfter: pagNotasIndex < paginasAlunosNotas.length - 1 ? 'always' : 'avoid',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div>
                        {/* Topo Oficial Timbrado */}
                        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800 gap-4">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-28 h-14 flex items-center justify-center border border-slate-200 rounded p-1 bg-white shrink-0">
                              {instituicao?.logo ? (
                                <img
                                  src={instituicao.logo}
                                  alt={instituicao.nome}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <div className="text-center px-1">
                                  <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase block leading-tight">
                                    {instituicao?.nome ? instituicao.nome.slice(0, 18) : 'INSTITUIÇÃO'}
                                  </span>
                                  <span className="text-[7.5px] text-amber-700 font-bold block mt-0.5">
                                    [Sem logo oficial]
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                                {instituicao?.nome || 'GRUPO CREESER EDUCACIONAL'}
                              </h1>
                              <p className="text-[9.5px] text-slate-600 font-medium leading-normal mt-0.5">
                                {instituicao?.cnpj ? `CNPJ: ${instituicao.cnpj}` : ''}
                                {instituicao?.cidade ? ` • ${instituicao.cidade} - ${instituicao.estado}` : ''}
                                {instituicao?.telefone ? ` • Tel: ${instituicao.telefone}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Título do Documento */}
                          <div className="text-right shrink-0">
                            <div className="text-base font-black text-slate-900 tracking-wider uppercase">
                              CONTROLE DE NOTAS
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase">
                              Controle de Notas da Disciplina
                            </div>
                            <div className="text-[8.5px] text-slate-400 mt-0.5">
                              {paginasAlunosNotas.length > 1
                                ? `Página 3.${pagNotasIndex + 1} de 3.${paginasAlunosNotas.length}`
                                : 'Página 3 de 3'}
                            </div>
                          </div>
                        </div>

                        {/* Metadados: Turma, Disciplina e Professor(a) */}
                        <div className="grid grid-cols-4 gap-2 my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
                          <div>
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Curso:</span>
                            <span className="font-bold text-slate-900 leading-snug break-words block">
                              {turma.curso || dadosTurma?.turma?.curso || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Turma:</span>
                            <span className="font-bold text-slate-900 leading-snug break-words block">
                              {turma.nome} {turma.turno ? `(${turma.turno})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Disciplina:</span>
                            <span className="font-bold text-slate-900 leading-snug break-words block">
                              {disciplinaSelecionada || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Mês / Ano:</span>
                            <span className="font-bold text-teal-800 uppercase block leading-snug">
                              {nomeMesExtenso} / {ano}
                            </span>
                          </div>

                          <div className="col-span-4 pt-1.5 border-t border-slate-200/60 mt-1">
                            <span className="font-bold text-slate-500 uppercase block text-[8px] mb-0.5">Professor(a):</span>
                            <span className="font-medium text-slate-800 leading-snug block">
                              {professorManual.trim() || '__________________________________________________'}
                            </span>
                          </div>
                        </div>

                        {/* Tabela de Notas */}
                        <div className="overflow-hidden border border-slate-300 rounded">
                          <table className="w-full border-collapse text-[9px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                                <th className="p-1 border-r border-slate-300 w-7 text-center">Nº</th>
                                <th className="p-1 border-r border-slate-300 text-left min-w-[220px]">
                                  ALUNO
                                </th>
                                <th className="p-1 border-r border-slate-300 text-center w-28 uppercase text-[8px]">
                                  TRABALHO INDIVIDUAL
                                </th>
                                <th className="p-1 border-r border-slate-300 text-center w-28 uppercase text-[8px]">
                                  TRABALHO EM GRUPO
                                </th>
                                <th className="p-1 border-r border-slate-300 text-center w-24 uppercase text-[8px]">
                                  1ª AVALIAÇÃO
                                </th>
                                <th className="p-1 border-r border-slate-300 text-center w-24 uppercase text-[8px]">
                                  2ª AVALIAÇÃO
                                </th>
                                <th className="p-1 border-r border-slate-300 text-center w-24 uppercase text-[8px]">
                                  RECUPERAÇÃO
                                </th>
                                <th className="p-1 text-center w-24 uppercase text-[8px] bg-slate-200/60 font-black">
                                  NOTA FINAL
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {grupoAlunosNotas.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-6 text-center text-slate-400 italic text-xs">
                                    Nenhum aluno com matrícula ativa nesta turma.
                                  </td>
                                </tr>
                              ) : (
                                grupoAlunosNotas.map((aluno, idxAluno) => {
                                  const numGlobal = pagNotasIndex * ALUNOS_POR_PAGINA_NOTAS + idxAluno + 1;
                                  return (
                                    <tr
                                      key={`nota-aluno-${aluno.id}`}
                                      className={`border-b border-slate-200 ${
                                        idxAluno % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                                      }`}
                                      style={{ height: '24px' }}
                                    >
                                      <td className="p-1 border-r border-slate-300 text-center font-bold text-slate-500">
                                        {numGlobal}
                                      </td>
                                      <td className="p-1 border-r border-slate-300 font-bold text-slate-800 uppercase truncate">
                                        {aluno.nome}
                                      </td>
                                      <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                      <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                      <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                      <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                      <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                      <td className="text-center bg-slate-50 font-bold">&nbsp;</td>
                                    </tr>
                                  );
                                })
                              )}

                              {/* Linha de Reposição / Reoferta na última página de notas */}
                              {pagNotasIndex === paginasAlunosNotas.length - 1 && (
                                <tr className="border-b border-slate-300 bg-amber-50/40" style={{ height: '24px' }}>
                                  <td className="p-1 border-r border-slate-300 text-center font-bold text-amber-900">
                                    ★
                                  </td>
                                  <td className="p-1 border-r border-slate-300 font-black text-amber-900 uppercase">
                                    REPOSIÇÃO / REOFERTA
                                  </td>
                                  <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                  <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                  <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                  <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                  <td className="border-r border-slate-200 text-center">&nbsp;</td>
                                  <td className="text-center bg-amber-100/30 font-bold">&nbsp;</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Rodapé da Página 3: Três Blocos de Entrega / Assinatura */}
                      <div className="pt-3 border-t border-slate-300 mt-2 text-[9px] text-slate-700">
                        <div className="grid grid-cols-3 gap-6 items-end pb-2">
                          {/* Bloco 1: ENTREGUE EM / ASS. PROFESSOR */}
                          <div className="text-center p-2 bg-slate-50 border border-slate-200 rounded">
                            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-600 mb-2">
                              <span>ENTREGUE EM:</span>
                              <span className="font-mono">___/___/______</span>
                            </div>
                            <div className="border-b border-slate-400 mb-1 h-6"></div>
                            <span className="font-bold text-slate-800 block text-[8.5px] uppercase">
                              Assinatura do(a) Professor(a)
                            </span>
                          </div>

                          {/* Bloco 2: RECEBIDO EM / ASS. COORDENAÇÃO */}
                          <div className="text-center p-2 bg-slate-50 border border-slate-200 rounded">
                            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-600 mb-2">
                              <span>RECEBIDO EM:</span>
                              <span className="font-mono">___/___/______</span>
                            </div>
                            <div className="border-b border-slate-400 mb-1 h-6"></div>
                            <span className="font-bold text-slate-800 block text-[8.5px] uppercase">
                              Assinatura da Coordenação
                            </span>
                          </div>

                          {/* Bloco 3: LANÇADO EM / ASS. COORDENAÇÃO */}
                          <div className="text-center p-2 bg-slate-50 border border-slate-200 rounded">
                            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-600 mb-2">
                              <span>LANÇADO EM:</span>
                              <span className="font-mono">___/___/______</span>
                            </div>
                            <div className="border-b border-slate-400 mb-1 h-6"></div>
                            <span className="font-bold text-slate-800 block text-[8.5px] uppercase">
                              Assinatura da Coordenação
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Rodapé da Janela Modal */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {dadosTurma && (
              <span>
                Turma: <strong className="text-slate-700">{turma.nome}</strong> • {alunos.length} alunos ativos
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
