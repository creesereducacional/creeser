import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function AvaliacaoCurso() {
  const router = useRouter();
  const { cursoId } = router.query;

  // 1. Autenticação oficial CREESER
  const { usuario, carregando: carregandoAuth } = useAuth({
    tiposPermitidos: ['aluno', 'professor', 'admin', 'grupo_admin', 'instituicao_admin'],
    redirectTo: '/login',
    redirectIfUnauthorized: '/login',
  });

  const [curso, setCurso] = useState(null);
  const [avaliacao, setAvaliacao] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [gerandoCertificado, setGerandoCertificado] = useState(false);

  useEffect(() => {
    if (!carregandoAuth && usuario && cursoId) {
      carregarCursoEAvaliacao(usuario.id);
    }
  }, [cursoId, carregandoAuth, usuario]);

  const carregarCursoEAvaliacao = async (alunoId) => {
    setCarregando(true);
    try {
      let cursoEncontrado = null;
      const res = await fetch('/api/cursos', { credentials: 'include' });
      if (res.ok) {
        const cursos = await res.json();
        if (Array.isArray(cursos)) {
          cursoEncontrado = cursos.find((c) => String(c.id) === String(cursoId));
        }
      }

      if (!cursoEncontrado) {
        const resSingle = await fetch(`/api/cursos/${cursoId}`, { credentials: 'include' });
        if (resSingle.ok) {
          cursoEncontrado = await resSingle.json();
        }
      }

      if (cursoEncontrado) {
        setCurso(cursoEncontrado);

        // 2. Extrair ou estruturar avaliação do curso
        let avaliacaoObj = cursoEncontrado.avaliacao || null;

        // Se não houver objeto 'avaliacao' explícito, compilar questões a partir dos módulos ou criar avaliação padrão estruturada
        if (!avaliacaoObj || !avaliacaoObj.questoes || avaliacaoObj.questoes.length === 0) {
          const questoesAulas = [];
          cursoEncontrado.modulos?.forEach((m, mIdx) => {
            m.aulas?.forEach((a, aIdx) => {
              if (Array.isArray(a.questoes)) {
                a.questoes.forEach((q) => {
                  questoesAulas.push({
                    id: q.id || `q_${mIdx}_${aIdx}_${questoesAulas.length}`,
                    enunciado: q.enunciado || q.pergunta,
                    opcoes: q.opcoes || [],
                    respostaCorreta:
                      typeof q.respostaCorreta === 'number'
                        ? q.respostaCorreta
                        : typeof q.respostaCorreta === 'string'
                        ? q.respostaCorreta.charCodeAt(0) - 65
                        : 0,
                    explicacao: q.explicacao || '',
                  });
                });
              }
            });
          });

          if (questoesAulas.length > 0) {
            avaliacaoObj = {
              id: `aval_${cursoEncontrado.id}`,
              titulo: `Avaliação Final: ${cursoEncontrado.titulo}`,
              notaMinima: 70,
              duracaoMinutos: 40,
              questoes: questoesAulas,
            };
          } else {
            // Questões avaliativas padrão contextualizadas com o curso
            avaliacaoObj = {
              id: `aval_${cursoEncontrado.id}`,
              titulo: `Avaliação Final de Conclusão: ${cursoEncontrado.titulo}`,
              notaMinima: 70,
              duracaoMinutos: 30,
              questoes: [
                {
                  id: 1,
                  enunciado: `Considerando os módulos apresentados na disciplina "${cursoEncontrado.titulo}", qual é o principal objetivo dos conceitos fundamentais abordados?`,
                  opcoes: [
                    'Estabelecer uma base conceitual sólida para a aplicação prática no ambiente profissional e acadêmico.',
                    'Substituir integralmente os métodos tradicionais sem necessidade de embasamento regulatório.',
                    'Limitar a tomada de decisão a processos exclusivamente manuais e descentralizados.',
                    'Desconsiderar os indicadores de conformidade e boas práticas pedagógicas.',
                  ],
                  respostaCorreta: 0,
                  explicacao: 'O objetivo essencial é consolidar o domínio teórico-prático para aplicação nas rotinas acadêmicas e profissionais.',
                },
                {
                  id: 2,
                  enunciado: 'Em relação ao acompanhamento e à gestão dos conteúdos propostos nesta disciplina, é correto afirmar que:',
                  opcoes: [
                    'A análise contínua de métricas e o cumprimento do plano de ensino garantem a eficiência e a retenção do conhecimento.',
                    'O planejamento pedagógico não interfere nos resultados finais alcançados.',
                    'A avaliação de desempenho deve ser evitada em ambientes educacionais.',
                    'O conteúdo deve ser aplicado de forma isolada, sem correlação com as demais áreas da formação.',
                  ],
                  respostaCorreta: 0,
                  explicacao: 'O monitoramento sistemático e o alinhamento pedagógico asseguram o aproveitamento integral do curso.',
                },
                {
                  id: 3,
                  enunciado: 'Qual das alternativas abaixo representa uma boa prática recomendada para a fixação dos materiais de apoio e videoaulas?',
                  opcoes: [
                    'Revisar os tópicos-chave, realizar os exercícios propostos e participar ativamente das discussões no fórum acadêmico.',
                    'Apenas assistir aos vídeos sem realizar anotações ou resolver questões complementares.',
                    'Ignorar as diretrizes e cronogramas estipulados pela coordenação.',
                    'Não consultar os materiais complementares em PDF disponibilizados na sala virtual.',
                  ],
                  respostaCorreta: 0,
                  explicacao: 'A integração entre videoaulas, leitura de materiais e exercícios consolida a retenção do aprendizado.',
                },
                {
                  id: 4,
                  enunciado: 'Ao concluir uma unidade de estudo, qual procedimento assegura a comprovação do aproveitamento pelo estudante?',
                  opcoes: [
                    'A realização da avaliação oficial de aprendizagem com aproveitamento igual ou superior à nota de corte.',
                    'O simples login no sistema sem visualização dos conteúdos obrigatórios.',
                    'A solicitação verbal sem registro de notas ou frequência no portal.',
                    'A dispensa automática de todas as etapas avaliativas.',
                  ],
                  respostaCorreta: 0,
                  explicacao: 'A conclusão e aprovação na avaliação formal comprovam o alcance das competências exigidas.',
                },
                {
                  id: 5,
                  enunciado: 'Qual é o impacto da aplicação das diretrizes e normativas aprendidas ao longo desta formação?',
                  opcoes: [
                    'Promover a excelência educacional, segurança nos processos e conformidade institucional.',
                    'Gerar inconsistências documentais e atrasos nos processos organizacionais.',
                    'Reduzir o engajamento e a qualidade do atendimento aos alunos e colaboradores.',
                    'Tornar os fluxos operacionais lentos e sem transparência.',
                  ],
                  respostaCorreta: 0,
                  explicacao: 'A conformidade e o domínio das boas práticas impulsionam a excelência e a qualidade institucional.',
                },
              ],
            };
          }
        }

        setAvaliacao(avaliacaoObj);

        // 3. Tentar carregar última tentativa do Supabase
        if (supabase && alunoId && avaliacaoObj.id) {
          try {
            const { data: tentativasDb } = await supabase
              .from('tentativas_avaliacao')
              .select('*')
              .eq('aluno_id', alunoId)
              .eq('avaliacao_id', avaliacaoObj.id)
              .order('realizado_em', { ascending: false })
              .limit(1);

            if (tentativasDb && tentativasDb.length > 0) {
              const t = tentativasDb[0];
              const totalQ = avaliacaoObj.questoes.length;
              const resObj = {
                dataEnvio: t.realizado_em,
                acertos: Math.round((t.nota_obtida / 100) * totalQ),
                totalQuestoes: totalQ,
                notaFinal: t.nota_obtida,
                notaMinima: avaliacaoObj.notaMinima || 70,
                aprovado: t.aprovado,
                detalhamento: [],
              };
              setResultado(resObj);
              setCarregando(false);
              return;
            }
          } catch (e) {}
        }

        // 4. Fallback no localStorage
        if (typeof window !== 'undefined') {
          const resultadoSalvo = localStorage.getItem(`resultado_avaliacao_${cursoId}_${alunoId}`);
          if (resultadoSalvo) {
            try {
              setResultado(JSON.parse(resultadoSalvo));
            } catch (e) {}
          }
        }
      } else {
        router.push('/aluno/dashboard');
      }
    } catch (error) {
      console.error('Erro ao carregar avaliação:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSelecionarOpcao = (questaoId, opcaoIndex) => {
    if (resultado) return; // Não altera após submissão
    setRespostas((prev) => ({
      ...prev,
      [questaoId]: opcaoIndex,
    }));
  };

  const handleSubmeterAvaliacao = async (e) => {
    e.preventDefault();
    if (!avaliacao || !avaliacao.questoes) return;

    // Verificar se todas as questões foram respondidas
    const questoesNaoRespondidas = avaliacao.questoes.filter((q) => respostas[q.id] === undefined);
    if (questoesNaoRespondidas.length > 0) {
      alert(`Por favor, responda todas as questões antes de enviar. Faltam ${questoesNaoRespondidas.length} questão(ões).`);
      return;
    }

    setEnviando(true);

    // Calcular nota e detalhamento
    let acertos = 0;
    const detalhamento = avaliacao.questoes.map((q) => {
      const respostaDada = respostas[q.id];
      const correta = q.respostaCorreta === respostaDada;
      if (correta) acertos++;
      return {
        questaoId: q.id,
        enunciado: q.enunciado,
        respostaDada,
        respostaCorreta: q.respostaCorreta,
        correta,
        explicacao: q.explicacao || '',
      };
    });

    const totalQuestoes = avaliacao.questoes.length;
    const notaFinal = Math.round((acertos / totalQuestoes) * 100);
    const notaMinima = avaliacao.notaMinima || 70;
    const aprovado = notaFinal >= notaMinima;

    const resObj = {
      dataEnvio: new Date().toISOString(),
      acertos,
      totalQuestoes,
      notaFinal,
      notaMinima,
      aprovado,
      detalhamento,
    };

    setResultado(resObj);

    // Salvar localmente
    if (typeof window !== 'undefined' && usuario?.id) {
      localStorage.setItem(`resultado_avaliacao_${cursoId}_${usuario.id}`, JSON.stringify(resObj));
    }

    // Persistir no Supabase se disponível
    if (supabase && usuario?.id && avaliacao?.id) {
      try {
        await supabase.from('tentativas_avaliacao').insert({
          aluno_id: usuario.id,
          avaliacao_id: String(avaliacao.id),
          nota_obtida: notaFinal,
          aprovado,
          realizado_em: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Erro ao registrar tentativa no Supabase:', err);
      }
    }

    setEnviando(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRefazerAvaliacao = () => {
    setResultado(null);
    setRespostas({});
    if (typeof window !== 'undefined' && usuario?.id) {
      localStorage.removeItem(`resultado_avaliacao_${cursoId}_${usuario.id}`);
    }
  };

  const handleEmitirCertificado = async () => {
    setGerandoCertificado(true);
    try {
      const res = await fetch('/api/certificados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          alunoId: usuario?.id || 1,
          alunoNome: usuario?.nomeCompleto || usuario?.nome || 'Aluno(a)',
          cursoId: curso?.id || cursoId,
          cursoTitulo: curso?.titulo || 'Curso EAD',
          cargaHoraria: curso?.carga_horaria || curso?.cargaHoraria || 40,
        }),
      });

      const data = await res.json();
      if (res.ok && data.codigoValidacao) {
        router.push(`/certificado/${data.codigoValidacao}`);
      } else {
        alert(data.error || 'Erro ao emitir certificado digital.');
      }
    } catch (err) {
      console.error('Erro ao emitir certificado:', err);
      alert('Erro de conexão ao emitir certificado.');
    } finally {
      setGerandoCertificado(false);
    }
  };

  if (carregandoAuth || carregando || !curso) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-teal-400 font-semibold text-sm">Carregando Avaliação CREESER...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* ── Header Institucional CREESER ───────────────────────────────── */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/aluno/home" className="flex items-center">
              <img
                src="/images/logo_creeser.png"
                alt="CREESER"
                className="h-8 sm:h-9 w-auto object-contain brightness-110"
              />
            </Link>
            <div className="hidden sm:block border-l border-slate-800 pl-3">
              <h1 className="text-xs font-bold uppercase tracking-wider text-teal-400">Portal Acadêmico</h1>
              <p className="text-[11px] text-slate-400 font-medium">Avaliação Oficial de Aprendizagem</p>
            </div>
          </div>

          <Link
            href={`/assistir/${cursoId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-teal-400 bg-slate-800 hover:bg-slate-750 px-3.5 py-2 rounded-xl border border-slate-700/60 transition"
          >
            <span>←</span>
            <span>Voltar às Aulas</span>
          </Link>
        </div>
      </header>

      {/* ── Conteúdo Principal ─────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        
        {/* Banner de Informações da Prova */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-7 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-extrabold uppercase tracking-wider mb-2.5">
              <span>📝 Avaliação Oficial do Curso</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{avaliacao?.titulo}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">{curso.titulo}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 border-t border-slate-800/80 pt-4 mt-5">
              <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-slate-800">
                <span>📋</span>
                <span>Total de Questões: <strong className="text-white">{avaliacao?.questoes?.length || 0}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-slate-800">
                <span>🎯</span>
                <span>Nota Mínima: <strong className="text-teal-400">{avaliacao?.notaMinima || 70}%</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-slate-800">
                <span>⏱️</span>
                <span>Tempo Sugerido: <strong className="text-white">{avaliacao?.duracaoMinutos || 30} min</strong></span>
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 opacity-5 text-9xl font-black translate-x-8 translate-y-8 select-none pointer-events-none">
            CREESER
          </div>
        </div>

        {/* ── CARD DE RESULTADO (Exibido após submissão) ────────────────── */}
        {resultado && (
          <div
            className={`rounded-2xl p-6 sm:p-8 shadow-xl border text-white transition-all ${
              resultado.aprovado
                ? 'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 border-emerald-500/60'
                : 'bg-gradient-to-br from-rose-950 via-red-900 to-slate-900 border-rose-500/60'
            }`}
          >
            <div className="flex items-start sm:items-center gap-4 mb-6">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-md ${
                  resultado.aprovado ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}
              >
                {resultado.aprovado ? '🏆' : '⚠️'}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {resultado.aprovado
                    ? 'Parabéns! Você foi Aprovado(a)!'
                    : 'Aproveitamento Mínimo Não Atingido'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                  {resultado.aprovado
                    ? 'Seu rendimento acadêmico atendeu aos critérios de aprovação do Grupo Educacional CREESER.'
                    : `Sua nota final foi ${resultado.notaFinal}%. A nota mínima exigida para aprovação é de ${resultado.notaMinima}%.`}
                </p>
              </div>
            </div>

            {/* Métricas do Resultado */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-slate-950/60 rounded-xl p-4 sm:p-5 border border-white/10 text-center">
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400">Nota Final</p>
                <p className={`text-2xl sm:text-3xl font-black mt-1 ${resultado.aprovado ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resultado.notaFinal}%
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400">Acertos</p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {resultado.acertos} / {resultado.totalQuestoes}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400">Situação</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    resultado.aprovado
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                  }`}
                >
                  {resultado.aprovado ? 'Aprovado' : 'Reprovado'}
                </span>
              </div>
            </div>

            {/* Ações pós-resultado */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-white/10">
              {resultado.aprovado ? (
                <>
                  <button
                    onClick={handleEmitirCertificado}
                    disabled={gerandoCertificado}
                    className="bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <span>🏆</span>
                    <span>{gerandoCertificado ? 'Emitindo Certificado...' : 'Emitir Certificado Digital'}</span>
                  </button>
                  <Link
                    href={`/aluno/dashboard`}
                    className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition border border-slate-700 flex items-center gap-2"
                  >
                    <span>🎓</span>
                    <span>Voltar ao Painel</span>
                  </Link>
                  <Link
                    href={`/assistir/${cursoId}`}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition"
                  >
                    Revisar Videoaulas
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleRefazerAvaliacao}
                  className="bg-white text-slate-950 hover:bg-slate-100 font-black px-6 py-3 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>🔄</span>
                  <span>Tentar Novamente</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── FORMULÁRIO DE QUESTÕES ───────────────────────────────────── */}
        <form onSubmit={handleSubmeterAvaliacao} className="space-y-5">
          {avaliacao?.questoes?.map((q, idx) => {
            const detalhe = resultado?.detalhamento?.find((d) => d.questaoId === q.id);

            return (
              <div
                key={q.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-sm space-y-4"
              >
                {/* Enunciado */}
                <div className="flex items-start gap-3">
                  <span className="bg-teal-600 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg flex-shrink-0 mt-0.5">
                    Questão {idx + 1}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed flex-1">
                    {q.enunciado}
                  </h3>
                </div>

                {/* Opções de Resposta */}
                <div className="space-y-2.5 pt-1">
                  {q.opcoes?.map((opcao, opIdx) => {
                    const letra = String.fromCharCode(65 + opIdx);
                    const selecionado = respostas[q.id] === opIdx;

                    let estilos = 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700';

                    if (resultado) {
                      if (opIdx === q.respostaCorreta) {
                        estilos = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                      } else if (selecionado && !detalhe?.correta) {
                        estilos = 'bg-rose-950/60 border-rose-500 text-rose-200';
                      } else {
                        estilos = 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60';
                      }
                    } else if (selecionado) {
                      estilos = 'bg-teal-950/80 border-teal-500 text-teal-200 font-semibold shadow-xs';
                    }

                    return (
                      <label
                        key={opIdx}
                        onClick={() => handleSelecionarOpcao(q.id, opIdx)}
                        className={`flex items-start gap-3 p-3.5 sm:p-4 border-2 rounded-xl cursor-pointer transition text-xs sm:text-sm ${estilos}`}
                      >
                        <input
                          type="radio"
                          name={`questao_${q.id}`}
                          checked={selecionado}
                          onChange={() => {}}
                          disabled={Boolean(resultado)}
                          className="w-4 h-4 text-teal-500 focus:ring-teal-400 mt-0.5"
                        />
                        <span className="font-black text-teal-400 mr-1">{letra}.</span>
                        <span className="flex-1 leading-relaxed">{opcao}</span>

                        {resultado && opIdx === q.respostaCorreta && (
                          <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black uppercase flex-shrink-0">
                            Correta
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Feedback Explicativo pós-submissão */}
                {resultado && (
                  <div
                    className={`p-4 rounded-xl border text-xs leading-relaxed ${
                      detalhe?.correta
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <p className="font-bold mb-1">
                      {detalhe?.correta ? '✓ Resposta Correta' : '✗ Resposta Incorreta'}
                    </p>
                    {q.explicacao && <p className="text-slate-300">{q.explicacao}</p>}
                  </div>
                )}
              </div>
            );
          })}

          {/* Botão de Submissão */}
          {!resultado && (
            <div className="flex justify-end pt-4 pb-8">
              <button
                type="submit"
                disabled={enviando}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-[#00d09c] hover:opacity-95 text-slate-950 font-black px-8 py-4 rounded-2xl shadow-lg transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>📝</span>
                <span>{enviando ? 'Processando Correção...' : 'Submeter e Finalizar Avaliação'}</span>
              </button>
            </div>
          )}
        </form>

      </main>
    </div>
  );
}
