import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function AssistirCurso() {
  const router = useRouter();
  const { cursoId } = router.query;

  // 1. Autenticação oficial CREESER
  const { usuario, carregando: carregandoAuth } = useAuth({
    tiposPermitidos: ['aluno', 'professor', 'admin', 'grupo_admin', 'instituicao_admin'],
    redirectTo: '/login',
    redirectIfUnauthorized: '/login',
  });

  const [curso, setCurso] = useState(null);
  const [moduloAtual, setModuloAtual] = useState(null);
  const [aulaAtual, setAulaAtual] = useState(null);
  const [progresso, setProgresso] = useState({});
  const [matriculaId, setMatriculaId] = useState(null);
  const [showRespostas, setShowRespostas] = useState({});
  const [respostasUsuario, setRespostasUsuario] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('visao-geral'); // 'visao-geral' | 'materiais' | 'avaliacao'
  const [avaliacaoEstrelas, setAvaliacaoEstrelas] = useState(0);
  const [hoverEstrela, setHoverEstrela] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [modulosAbertos, setModulosAbertos] = useState({});

  const toggleModulo = (moduloId) => {
    setModulosAbertos((prev) => ({
      ...prev,
      [moduloId]: !prev[moduloId],
    }));
  };

  useEffect(() => {
    if (!carregandoAuth && usuario && cursoId) {
      carregarCursoEProgresso(usuario.id);
    }
  }, [cursoId, carregandoAuth, usuario]);

  const carregarCursoEProgresso = async (alunoId) => {
    setCarregando(true);
    try {
      // 1. Carregar curso via API EAD ou CREESER
      let cursoEncontrado = null;
      try {
        const resEadSingle = await fetch(`/api/ead/cursos/${cursoId}`);
        if (resEadSingle.ok) {
          cursoEncontrado = await resEadSingle.json();
        }
      } catch (e) {}

      if (!cursoEncontrado) {
        const res = await fetch('/api/cursos', { credentials: 'include' });
        if (res.ok) {
          const cursos = await res.json();
          if (Array.isArray(cursos)) {
            cursoEncontrado = cursos.find((c) => String(c.id) === String(cursoId));
          }
        }
      }

      // Fallback para endpoint individual tradicional se necessário
      if (!cursoEncontrado) {
        const resSingle = await fetch(`/api/cursos/${cursoId}`, { credentials: 'include' });
        if (resSingle.ok) {
          cursoEncontrado = await resSingle.json();
        }
      }

      if (cursoEncontrado) {
        // Se o curso for rascunho e o usuário logado for aluno, impedir acesso
        const isStaff = ['admin', 'grupo_admin', 'instituicao_admin', 'coordenador', 'professor'].includes(usuario.perfil || usuario.tipo);
        if (cursoEncontrado.ativo === false && !isStaff) {
          alert('Este curso encontra-se em modo rascunho e não está disponível no momento.');
          router.push('/dashboard_ead');
          return;
        }

        setCurso(cursoEncontrado);

        let progressoMap = {};

        // 2. Tentar buscar progresso no Supabase (se a tabela estiver configurada)
        if (supabase && alunoId) {
          try {
            const { data: matriculaDb } = await supabase
              .from('matriculas')
              .select('id')
              .eq('aluno_id', alunoId)
              .eq('curso_id', cursoEncontrado.id)
              .maybeSingle();

            if (matriculaDb) {
              setMatriculaId(matriculaDb.id);
              const { data: progressoDb } = await supabase
                .from('progresso_aulas')
                .select('aula_id')
                .eq('matricula_id', matriculaDb.id);

              if (progressoDb && progressoDb.length > 0) {
                progressoDb.forEach((item) => {
                  progressoMap[item.aula_id] = true;
                });
              }
            }
          } catch (e) {
            // Silencioso se a tabela de matrícula EAD ainda não estiver populada
          }
        }

        // 3. Fallback seguro no localStorage
        if (Object.keys(progressoMap).length === 0 && typeof window !== 'undefined') {
          try {
            const progressoSalvo = localStorage.getItem(`progresso_${cursoId}_${alunoId}`);
            if (progressoSalvo) {
              progressoMap = JSON.parse(progressoSalvo);
            }
          } catch (e) {}
        }

        setProgresso(progressoMap);

        // 4. Selecionar primeira aula pendente ou a primeira do curso
        if (cursoEncontrado.modulos && cursoEncontrado.modulos.length > 0) {
          let moduloAlvo = cursoEncontrado.modulos[0];
          let aulaAlvo = cursoEncontrado.modulos[0].aulas?.[0] || null;
          let achouPendente = false;

          for (const modulo of cursoEncontrado.modulos) {
            if (modulo.aulas) {
              for (const aula of modulo.aulas) {
                if (!progressoMap[aula.id]) {
                  moduloAlvo = modulo;
                  aulaAlvo = aula;
                  achouPendente = true;
                  break;
                }
              }
            }
            if (achouPendente) break;
          }

          setModuloAtual(moduloAlvo);
          setModulosAbertos({ [moduloAlvo.id]: true });
          if (aulaAlvo) {
            setAulaAtual(aulaAlvo);
          }
        }
      } else {
        router.push(usuario?.tipo === 'professor' ? '/professor/dashboard' : '/aluno/dashboard');
      }
    } catch (error) {
      console.error('Erro ao carregar curso no player:', error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarVideoUrl = (url) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (trimmed.includes('youtube.com/watch?v=')) {
      const videoId = trimmed.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    } else if (trimmed.includes('youtu.be/')) {
      const videoId = trimmed.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    } else if (trimmed.includes('vimeo.com/')) {
      const videoId = trimmed.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    return trimmed;
  };

  const isDirectVideo = (url) => {
    if (!url) return false;
    const lower = String(url).toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg');
  };

  const marcarAulaConcluida = async (aulaId) => {
    if (!aulaId) return;

    const jaConcluido = Boolean(progresso[aulaId]);
    const novoStatus = !jaConcluido;
    const novoProgresso = { ...progresso, [aulaId]: novoStatus };
    setProgresso(novoProgresso);

    // Salvar localmente
    if (typeof window !== 'undefined' && usuario?.id) {
      localStorage.setItem(`progresso_${cursoId}_${usuario.id}`, JSON.stringify(novoProgresso));
    }

    // Atualizar no Supabase se disponível
    if (supabase && matriculaId) {
      try {
        if (novoStatus) {
          await supabase
            .from('progresso_aulas')
            .upsert(
              { matricula_id: matriculaId, aula_id: aulaId, concluido_em: new Date().toISOString() },
              { onConflict: 'matricula_id,aula_id' }
            );
        } else {
          await supabase
            .from('progresso_aulas')
            .delete()
            .eq('matricula_id', matriculaId)
            .eq('aula_id', aulaId);
        }

        // Atualizar percentual na matrícula
        if (curso && curso.modulos) {
          let total = 0;
          let concluidas = 0;
          curso.modulos.forEach((m) => {
            (m.aulas || []).forEach((a) => {
              total++;
              if (novoProgresso[a.id]) concluidas++;
            });
          });
          const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
          await supabase
            .from('matriculas')
            .update({ progresso_percentual: pct })
            .eq('id', matriculaId);
        }
      } catch (err) {
        console.error('Erro ao sincronizar progresso no banco:', err);
      }
    }
  };

  const selecionarAula = (modulo, aula) => {
    setModuloAtual(modulo);
    setAulaAtual(aula);
    setModulosAbertos((prev) => ({ ...prev, [modulo.id]: true }));
    setAbaAtiva('visao-geral');
    setSidebarAberta(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const proximaAula = () => {
    if (!moduloAtual || !aulaAtual || !curso) return;

    const aulasDoModulo = moduloAtual.aulas || [];
    const indiceAtual = aulasDoModulo.findIndex((a) => a.id === aulaAtual.id);

    if (indiceAtual < aulasDoModulo.length - 1) {
      setAulaAtual(aulasDoModulo[indiceAtual + 1]);
    } else {
      const indiceModulo = curso.modulos.findIndex((m) => m.id === moduloAtual.id);
      if (indiceModulo < curso.modulos.length - 1) {
        const proximoModulo = curso.modulos[indiceModulo + 1];
        setModuloAtual(proximoModulo);
        setModulosAbertos((prev) => ({ ...prev, [proximoModulo.id]: true }));
        if (proximoModulo.aulas && proximoModulo.aulas.length > 0) {
          setAulaAtual(proximoModulo.aulas[0]);
        }
      }
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const calcularProgressoCurso = () => {
    if (!curso || !curso.modulos) return 0;
    let totalAulas = 0;
    let aulasConcluidas = 0;

    curso.modulos.forEach((modulo) => {
      if (modulo.aulas) {
        totalAulas += modulo.aulas.length;
        modulo.aulas.forEach((aula) => {
          if (progresso[aula.id]) {
            aulasConcluidas++;
          }
        });
      }
    });

    return totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;
  };

  const handleResposta = (questaoId, opcao) => {
    setRespostasUsuario((prev) => ({ ...prev, [questaoId]: opcao }));
  };

  const salvarAvaliacao = async () => {
    if (avaliacaoEstrelas === 0) {
      alert('Por favor, selecione ao menos 1 estrela para avaliar.');
      return;
    }

    setEnviandoAvaliacao(true);
    try {
      const response = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cursoId,
          aulaId: aulaAtual?.id || 'aula-1',
          alunoId: usuario?.id || 1,
          alunoNome: usuario?.nomeCompleto || usuario?.nome || 'Aluno',
          estrelas: avaliacaoEstrelas,
          comentario: comentarioAvaliacao,
        }),
      });

      if (response.ok) {
        alert('⭐ Avaliação enviada com sucesso! Obrigado pelo seu feedback.');
        setAvaliacaoEstrelas(0);
        setComentarioAvaliacao('');
      } else {
        alert('Erro ao enviar avaliação. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro de conexão ao enviar avaliação.');
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  if (carregandoAuth || carregando || !curso) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-teal-400 font-semibold text-sm">Carregando Sala Virtual CREESER...</p>
        </div>
      </div>
    );
  }

  const progressoPercent = calcularProgressoCurso();
  const totalAulasGeral = curso.modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0) || 0;
  const aulaConcluida = Boolean(progresso[aulaAtual?.id]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* ── Overlay Mobile ─────────────────────────────────────────────── */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* ── TopBar / Header da Sala Virtual ───────────────────────────── */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          
          {/* Botão Voltar */}
          <div className="flex items-center gap-3">
            <Link
              href={usuario?.tipo === 'professor' ? '/professor/dashboard' : '/aluno/dashboard'}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-teal-400 bg-slate-800 hover:bg-slate-750 px-3.5 py-2 rounded-xl transition border border-slate-700/60"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="hidden sm:inline">Voltar ao Painel</span>
              <span className="sm:hidden">Voltar</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-teal-400">CREESER EAD</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium truncate max-w-xs">{curso.titulo}</span>
            </div>
          </div>

          {/* Botão Mobile Conteúdo & Barra de Progresso Desktop */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarAberta(!sidebarAberta)}
              className="lg:hidden bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-sm"
            >
              <span>📚</span>
              <span>Conteúdo ({progressoPercent}%)</span>
            </button>

            <div className="hidden lg:flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-4 py-1.5 rounded-xl">
              <div className="text-xs text-slate-400">
                Progresso: <span className="text-teal-400 font-black">{progressoPercent}%</span>
              </div>
              <div className="w-28 bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-[#00d09c] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressoPercent}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* ── Estrutura Principal (Player + Sidebar) ─────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Conteúdo Principal (Vídeo e Abas) */}
        <main className="flex-1 overflow-y-auto">
          
          {/* Player de Vídeo */}
          <div className="bg-black w-full relative flex items-center justify-center border-b border-slate-800/80">
            {aulaAtual?.videoUrl ? (
              <div className="w-full aspect-video max-h-[72vh] mx-auto bg-black flex items-center justify-center">
                {isDirectVideo(aulaAtual.videoUrl) ? (
                  <video
                    src={aulaAtual.videoUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                    poster={curso?.thumbnail || "/images/cursos/digital.png"}
                  />
                ) : (
                  <iframe
                    src={formatarVideoUrl(aulaAtual.videoUrl)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={aulaAtual.titulo}
                  />
                )}
              </div>
            ) : (
              <div className="w-full aspect-video max-h-[72vh] flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                <span className="text-4xl mb-2">📹</span>
                <p className="text-sm font-medium">Videoaula não disponível ou em processamento.</p>
              </div>
            )}
          </div>

          {/* Informações da Aula e Ações */}
          <div className="p-5 sm:p-7 lg:p-8 max-w-5xl mx-auto space-y-6">
            
            {/* Header da Aula Atual */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                      aulaConcluida
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {aulaConcluida ? '✓ Concluída' : '⏱️ Em andamento'}
                  </span>
                  {moduloAtual && (
                    <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                      {moduloAtual.titulo}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {aulaAtual?.titulo || 'Selecione uma aula'}
                </h1>
                {aulaAtual?.descricao && (
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
                    {aulaAtual.descricao}
                  </p>
                )}
              </div>

              {/* Botão Marcar como Concluído */}
              <button
                onClick={() => marcarAulaConcluida(aulaAtual?.id)}
                className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 flex-shrink-0 whitespace-nowrap border cursor-pointer ${
                  aulaConcluida
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-400 font-extrabold'
                    : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white border-teal-500 shadow-teal-900/30'
                }`}
              >
                {aulaConcluida ? (
                  <>
                    <span>✓</span>
                    <span>Aula Concluída</span>
                  </>
                ) : (
                  <>
                    <span>✔</span>
                    <span>Marcar como Concluído</span>
                  </>
                )}
              </button>
            </div>

            {/* Abas de Conteúdo */}
            <div className="border-b border-slate-800">
              <div className="flex gap-6">
                <button
                  onClick={() => setAbaAtiva('visao-geral')}
                  className={`pb-3 border-b-2 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                    abaAtiva === 'visao-geral'
                      ? 'border-teal-400 text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📖</span>
                  <span>Visão Geral</span>
                </button>
                <button
                  onClick={() => setAbaAtiva('materiais')}
                  className={`pb-3 border-b-2 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                    abaAtiva === 'materiais'
                      ? 'border-teal-400 text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📎</span>
                  <span>Materiais de Apoio {aulaAtual?.materiais?.length > 0 && `(${aulaAtual.materiais.length})`}</span>
                </button>
                <button
                  onClick={() => setAbaAtiva('avaliacao')}
                  className={`pb-3 border-b-2 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                    abaAtiva === 'avaliacao'
                      ? 'border-teal-400 text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>⭐</span>
                  <span>Avaliar Aula</span>
                </button>
              </div>
            </div>

            {/* Aba: Visão Geral */}
            {abaAtiva === 'visao-geral' && (
              <div className="space-y-6">
                <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/80">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span>💡</span>
                    <span>Sobre esta aula</span>
                  </h3>
                  <div
                    className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-2 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        aulaAtual?.conteudo ||
                        aulaAtual?.descricao ||
                        'Acompanhe a videoaula e utilize os materiais complementares para fixar o aprendizado.',
                    }}
                  />
                </div>

                {/* Questões de Fixação */}
                {aulaAtual?.questoes && aulaAtual.questoes.length > 0 && (
                  <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/80 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span>📝</span>
                        <span>Questões de Fixação</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-semibold">
                        {aulaAtual.questoes.length} questão(ões)
                      </span>
                    </div>

                    <div className="space-y-6">
                      {aulaAtual.questoes.map((questao, idx) => (
                        <div key={idx} className="bg-slate-800/70 rounded-xl p-5 border border-slate-700/60">
                          <p className="font-bold text-sm text-white mb-4">
                            {idx + 1}. {questao.pergunta}
                          </p>
                          <div className="space-y-2">
                            {questao.opcoes?.map((opcao, opcaoIdx) => {
                              const letra = String.fromCharCode(65 + opcaoIdx);
                              const isRespondida = showRespostas[questao.id];
                              const isCorreta = letra === questao.respostaCorreta;
                              const isSelecionada = respostasUsuario[questao.id] === letra;

                              return (
                                <button
                                  key={opcaoIdx}
                                  onClick={() => handleResposta(questao.id, letra)}
                                  disabled={isRespondida}
                                  className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm transition font-medium border ${
                                    isRespondida
                                      ? isCorreta
                                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                        : isSelecionada
                                        ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                                        : 'bg-slate-800 border-slate-700 text-slate-400'
                                      : isSelecionada
                                      ? 'bg-teal-900/60 border-teal-500 text-teal-200'
                                      : 'bg-slate-850 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <span className="font-bold mr-2 text-teal-400">{letra}.</span>
                                  <span>{opcao}</span>
                                </button>
                              );
                            })}
                          </div>

                          {!showRespostas[questao.id] && respostasUsuario[questao.id] && (
                            <button
                              onClick={() => setShowRespostas({ ...showRespostas, [questao.id]: true })}
                              className="mt-4 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition shadow-md"
                            >
                              Verificar Resposta
                            </button>
                          )}

                          {showRespostas[questao.id] && (
                            <div
                              className={`mt-4 p-4 rounded-xl border ${
                                respostasUsuario[questao.id] === questao.respostaCorreta
                                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                                  : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                              }`}
                            >
                              <p className="font-bold text-xs sm:text-sm mb-1">
                                {respostasUsuario[questao.id] === questao.respostaCorreta
                                  ? '✓ Resposta Correta!'
                                  : '✗ Resposta Incorreta'}
                              </p>
                              {questao.explicacao && (
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                  {questao.explicacao}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba: Materiais de Apoio */}
            {abaAtiva === 'materiais' && (
              <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/80">
                {aulaAtual?.materiais && aulaAtual.materiais.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">📎 Materiais Complementares</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Faça o download dos arquivos em PDF e materiais de estudo</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {aulaAtual.materiais.map((material, idx) => (
                        <a
                          key={idx}
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xl flex-shrink-0">
                              📄
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-bold text-white group-hover:text-teal-400 transition truncate">
                                {material.titulo || `Material de Apoio ${idx + 1}`}
                              </p>
                              <p className="text-[11px] text-slate-400">{material.tipo || 'Documento PDF'}</p>
                            </div>
                          </div>

                          <div className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs transition flex items-center gap-1.5 flex-shrink-0">
                            <span>↓</span>
                            <span>Download</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-3 opacity-60">📎</div>
                    <p className="text-sm font-bold text-slate-300">Nenhum material anexado a esta aula</p>
                    <p className="text-xs text-slate-500 mt-1">Todos os tópicos essenciais foram abordados no vídeo.</p>
                  </div>
                )}
              </div>
            )}

            {/* Aba: Avaliar Aula */}
            {abaAtiva === 'avaliacao' && (
              <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800/80 text-center">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">⭐ Avalie a qualidade desta aula</h3>
                <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
                  Sua avaliação ajuda nossos professores a aprimorarem continuamente os conteúdos do CREESER.
                </p>

                <div className="bg-slate-800/60 rounded-2xl p-6 max-w-lg mx-auto border border-slate-700/50">
                  <div className="flex justify-center gap-3 mb-6">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <button
                        key={estrela}
                        onClick={() => setAvaliacaoEstrelas(estrela)}
                        onMouseEnter={() => setHoverEstrela(estrela)}
                        onMouseLeave={() => setHoverEstrela(0)}
                        className="transition-transform hover:scale-125 focus:outline-none p-1 cursor-pointer"
                      >
                        <span
                          className={`text-4xl sm:text-5xl ${
                            estrela <= (hoverEstrela || avaliacaoEstrelas)
                              ? 'text-yellow-400'
                              : 'text-slate-600'
                          }`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>

                  {avaliacaoEstrelas > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs sm:text-sm text-slate-300">
                        Você selecionou: <span className="text-yellow-400 font-black">{avaliacaoEstrelas} estrela{avaliacaoEstrelas > 1 ? 's' : ''}</span>
                      </p>

                      <textarea
                        value={comentarioAvaliacao}
                        onChange={(e) => setComentarioAvaliacao(e.target.value)}
                        placeholder="Deixe uma observação ou sugestão (opcional)..."
                        className="w-full bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-700 focus:border-teal-500 focus:outline-none text-xs sm:text-sm resize-none"
                        rows="3"
                      />

                      <button
                        onClick={salvarAvaliacao}
                        disabled={enviandoAvaliacao}
                        className="w-full bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2"
                      >
                        {enviandoAvaliacao ? 'Enviando avaliação...' : 'Enviar Avaliação'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Clique nas estrelas para registrar sua nota.</p>
                  )}
                </div>
              </div>
            )}

            {/* Botão de Avanço Inferior */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={proximaAula}
                className="w-full bg-slate-900 hover:bg-teal-700 active:bg-teal-800 text-white font-bold py-4 rounded-2xl transition shadow-md border border-slate-800 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer group"
              >
                <span>Próxima Aula / Módulo</span>
                <span className="group-hover:translate-x-1 transition">→</span>
              </button>
            </div>

          </div>
        </main>

        {/* ── Sidebar Direita (Grade de Aulas e Módulos) ──────────────── */}
        <aside
          className={`w-full lg:w-88 xl:w-96 bg-slate-900 border-l border-slate-800 overflow-y-auto h-screen fixed lg:sticky top-0 right-0 z-50 transition-transform duration-300 ${
            sidebarAberta ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Topo da Sidebar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-white line-clamp-1">{curso.titulo}</h2>
              <p className="text-xs text-teal-400 font-semibold mt-0.5">
                {totalAulasGeral} aula(s) • {progressoPercent}% concluído
              </p>
            </div>

            <button
              onClick={() => setSidebarAberta(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Lista de Módulos (Accordion) */}
          <div className="p-3 sm:p-4 space-y-3">
            {curso.modulos?.map((modulo, index) => {
              const isExpandido = Boolean(modulosAbertos[modulo.id]);
              const isModuloAtivo = moduloAtual?.id === modulo.id;
              const numeroModulo = String(modulo.ordem || index + 1).padStart(2, '0');

              return (
                <div
                  key={modulo.id}
                  className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 transition"
                >
                  {/* Cabeçalho do Módulo */}
                  <button
                    onClick={() => toggleModulo(modulo.id)}
                    className={`w-full text-left p-3.5 flex items-center justify-between transition ${
                      isModuloAtivo
                        ? 'bg-slate-850 border-l-4 border-teal-500'
                        : 'bg-slate-900/90 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <span className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider block mb-0.5">
                        Módulo {numeroModulo}
                      </span>
                      <h3
                        className={`font-bold text-xs sm:text-sm leading-snug line-clamp-1 ${
                          isModuloAtivo ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {modulo.titulo}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {modulo.aulas?.length || 0} aula{(modulo.aulas?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <span
                      className={`text-xs text-slate-400 transition-transform duration-300 ${
                        isExpandido ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Lista de Aulas do Módulo */}
                  {isExpandido && (
                    <div className="p-2 space-y-1.5 bg-slate-950/90 border-t border-slate-800">
                      {modulo.aulas?.map((aula, aulaIdx) => {
                        const isAtiva = aulaAtual?.id === aula.id;
                        const concluida = Boolean(progresso[aula.id]);

                        return (
                          <button
                            key={aula.id}
                            onClick={() => selecionarAula(modulo, aula)}
                            className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-3 cursor-pointer ${
                              isAtiva
                                ? 'bg-teal-950/80 text-white border border-teal-500/60 shadow-xs'
                                : 'bg-slate-900/60 hover:bg-slate-850 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                                concluida
                                  ? 'bg-emerald-500 text-slate-950'
                                  : isAtiva
                                  ? 'bg-teal-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {concluida ? '✓' : aulaIdx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-snug truncate ${isAtiva ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                                {aula.titulo}
                              </p>
                              {aula.duracao && (
                                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                                  ⏱️ {aula.duracao} min
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Card de Avaliação do Curso / Certificado */}
            {(() => {
              const cursoConcluido = progressoPercent === 100;

              return (
                <div
                  className={`mt-6 rounded-2xl p-4 border transition ${
                    cursoConcluido
                      ? 'bg-gradient-to-br from-teal-950 via-slate-900 to-slate-900 border-teal-400 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                        cursoConcluido ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      🏆
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white">Avaliação & Certificado</h4>
                      <p className="text-[11px] text-slate-400">
                        {cursoConcluido ? 'Parabéns! Todas as aulas concluídas.' : 'Bloqueado até concluir 100%'}
                      </p>
                    </div>
                  </div>

                  {cursoConcluido ? (
                    <Link href={`/avaliacao/${cursoId}`}>
                      <button className="w-full mt-3 bg-gradient-to-r from-teal-500 to-[#00d09c] hover:opacity-95 text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs">
                        <span>⭐</span>
                        <span>Iniciar Avaliação do Curso</span>
                      </button>
                    </Link>
                  ) : (
                    <div className="mt-3 flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium">Progresso:</span>
                      <span className="text-xs font-black text-teal-400">{progressoPercent}%</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </aside>

      </div>
    </div>
  );
}
