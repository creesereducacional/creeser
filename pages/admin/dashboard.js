import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/LoadingSkeleton";

export default function AdminDashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [podeAcessarFinanceiro, setPodeAcessarFinanceiro] = useState(false);
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalCursos: 0,
    totalTopicos: 0,
    totalNoticias: 0,
    cursosAtivos: 0,
    alunosAtivos: 0,
    topicosPorCurso: [],
    cursosRecentes: [],
    atividadeRecente: [],
    evolucaoAlunos: [],
    distribuicaoCursos: [],
    ultimasMatriculas: [],
    alertasSistema: [],
    financeiro: null
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then(({ usuario: user }) => {
        const tipoUser   = (user.tipo   || '').toLowerCase();
        const perfilUser = (user.perfil || '').toLowerCase();
        // Redireciona perfis que não pertencem ao painel admin
        if (tipoUser === 'aluno')   { router.replace('/aluno/dashboard'); return; }
        if (tipoUser === 'professor') { router.replace('/professor/dashboard'); return; }
        if (perfilUser === 'comercial' || perfilUser === 'comercial_master') {
          router.replace('/comercial/dashboard'); return;
        }
        if (perfilUser === 'financeiro' || perfilUser === 'financeiro_admin') {
          router.replace('/admin-financeiro'); return;
        }
        if (perfilUser === 'recepcao' || tipoUser === 'recepcao') {
          router.replace('/recepcao/dashboard'); return;
        }

        const perfisAutorizadosFinanceiro = ['grupo_admin', 'instituicao_admin', 'admin', 'financeiro', 'financeiro_admin'];
        const temAcessoFin = perfisAutorizadosFinanceiro.includes(perfilUser);
        setPodeAcessarFinanceiro(temAcessoFin);

        setUsuario(user);
        carregarEstatisticas(temAcessoFin);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const carregarEstatisticas = async (temAcessoFin) => {
    setCarregando(true);
    try {
      // Buscar dados com timeout individual para cada requisição
      const fetchComTimeout = async (url, timeout = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          console.warn(`Timeout ou erro em ${url}:`, error);
          return null;
        }
      };

      // Buscar dados de todas as APIs com timeout
      const [alunosRes, professoresRes, cursosRes, forumRes, noticiasRes, turmasRes, financeiroRes] = await Promise.allSettled([
        fetchComTimeout('/api/alunos', 8000),
        fetchComTimeout('/api/professores', 8000),
        fetchComTimeout('/api/cursos', 8000),
        fetchComTimeout('/api/forum', 8000),
        fetchComTimeout('/api/noticias', 8000),
        fetchComTimeout('/api/turmas', 8000),
        temAcessoFin ? fetchComTimeout('/api/admin-financeiro/dashboard', 8000) : Promise.resolve(null)
      ]);

      // Processar respostas com fallback para dados vazios
      const parseResponse = async (result) => {
        try {
          if (result.status === 'fulfilled' && result.value && result.value.ok) {
            return await result.value.json();
          }
          return [];
        } catch (error) {
          console.error('Erro ao processar resposta:', error);
          return [];
        }
      };

      const parseFinanceiro = async (result) => {
        try {
          if (result.status === 'fulfilled' && result.value && result.value.ok) {
            return await result.value.json();
          }
          return null;
        } catch (error) {
          console.error('Erro ao processar resposta do financeiro:', error);
          return null;
        }
      };

      const alunos = await parseResponse(alunosRes);
      const professores = await parseResponse(professoresRes);
      const cursos = await parseResponse(cursosRes);
      const topicos = await parseResponse(forumRes);
      const noticias = await parseResponse(noticiasRes);
      const turmas = await parseResponse(turmasRes);
      const financeiro = temAcessoFin ? await parseFinanceiro(financeiroRes) : null;

      // Calcular estatísticas
      const cursosAtivos = cursos.filter(c => c.ativo).length;
      
      // Tópicos por curso
      const topicosPorCurso = cursos.map(curso => ({
        titulo: curso.titulo,
        total: topicos.filter(t => t.cursoId === curso.id).length
      })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

      // Cursos mais recentes
      const cursosRecentes = cursos
        .sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0))
        .slice(0, 5);

      // Atividade recente (últimos tópicos)
      const atividadeRecente = topicos
        .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao))
        .slice(0, 10)
        .map(topico => {
          const curso = cursos.find(c => c.id === topico.cursoId);
          return {
            ...topico,
            cursoTitulo: curso?.titulo || 'Curso não encontrado'
          };
        });

      // Calcular evolução dos alunos nos últimos 12 meses
      const evolucaoAlunos = (() => {
        const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const hoje = new Date();
        const ultimos12Meses = [];

        for (let i = 11; i >= 0; i--) {
          const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
          ultimos12Meses.push({
            ano: d.getFullYear(),
            mes: d.getMonth(),
            rotulo: `${mesesNomes[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`,
            total: 0
          });
        }

        alunos.forEach(aluno => {
          const dataMatr = aluno.datamatricula || aluno.dataCriacao || aluno.createdAt;
          if (!dataMatr) return;
          const dt = new Date(dataMatr);
          if (isNaN(dt.getTime())) return;
          
          ultimos12Meses.forEach(m => {
            if (dt.getFullYear() === m.ano && dt.getMonth() === m.mes) {
              m.total++;
            }
          });
        });

        return ultimos12Meses;
      })();

      // Calcular distribuição de alunos por curso (5 principais + Outros)
      const distribuicaoCursos = (() => {
        if (!alunos.length || !cursos.length) return [];
        const contagem = {};
        
        alunos.forEach(aluno => {
          const cid = aluno.cursoid || aluno.cursoId;
          if (!cid) return;
          contagem[cid] = (contagem[cid] || 0) + 1;
        });

        const listaCursos = Object.keys(contagem).map(cid => {
          const curso = cursos.find(c => String(c.id) === String(cid));
          return {
            titulo: curso ? curso.titulo : `Curso ID ${cid}`,
            total: contagem[cid]
          };
        }).sort((a, b) => b.total - a.total);

        const totalComCurso = listaCursos.reduce((sum, item) => sum + item.total, 0);

        if (listaCursos.length <= 5) {
          return listaCursos.map(item => ({
            ...item,
            percentual: totalComCurso > 0 ? Math.round((item.total / totalComCurso) * 100) : 0
          }));
        }

        const principais = listaCursos.slice(0, 5);
        const totalPrincipais = principais.reduce((sum, item) => sum + item.total, 0);
        const totalOutros = totalComCurso - totalPrincipais;

        const resultado = principais.map(item => ({
          ...item,
          percentual: totalComCurso > 0 ? Math.round((item.total / totalComCurso) * 100) : 0
        }));

        if (totalOutros > 0) {
          resultado.push({
            titulo: 'Outros',
            total: totalOutros,
            percentual: totalComCurso > 0 ? Math.round((totalOutros / totalComCurso) * 100) : 0
          });
        }

        return resultado;
      })();

      // Calcular Últimas Matrículas
      const ultimasMatriculas = [...alunos]
        .filter(aluno => aluno.datamatricula || aluno.dataCriacao || aluno.createdAt)
        .sort((a, b) => {
          const dataA = new Date(a.datamatricula || a.dataCriacao || a.createdAt);
          const dataB = new Date(b.datamatricula || b.dataCriacao || b.createdAt);
          return dataB - dataA;
        })
        .slice(0, 5)
        .map(aluno => {
          const curso = cursos.find(c => c.id === aluno.cursoid || c.id === aluno.cursoId);
          return {
            id: aluno.id,
            nome: aluno.nome,
            curso: curso ? curso.titulo : 'Não informado',
            data: aluno.datamatricula || aluno.dataCriacao || aluno.createdAt
          };
        });

      // Gerar Alertas do Sistema
      const alertasSistema = [];

      // Alertas 1: Alunos com status de débito ou trancado com débito
      if (temAcessoFin) {
        const alunosComDebito = alunos.filter(aluno => {
          const status = String(aluno.statusmatricula || '').toUpperCase();
          return status.includes('DEBITO') || status.includes('DÉBITO');
        });
        if (alunosComDebito.length > 0) {
          alertasSistema.push({
            tipo: 'financeiro',
            mensagem: `${alunosComDebito.length} alunos com pendência financeira ou status trancado com débito.`
          });
        }
      }

      // Alertas 2: Turmas em formação
      const turmasEmFormacao = turmas.filter(t => String(t.situacao || '').toUpperCase() === 'EM_FORMACAO' || String(t.situacao || '').toUpperCase() === 'EM FORMACAO');
      if (turmasEmFormacao.length > 0) {
        alertasSistema.push({
          tipo: 'academico',
          mensagem: `${turmasEmFormacao.length} ${turmasEmFormacao.length === 1 ? 'turma está' : 'turmas estão'} em processo de formação.`
        });
      }

      // Alertas 3: Alunos sem CPF cadastrado
      const alunosSemCpf = alunos.filter(a => !a.cpf);
      if (alunosSemCpf.length > 0) {
        alertasSistema.push({
          tipo: 'cadastro',
          mensagem: `${alunosSemCpf.length} alunos cadastrados sem CPF informado.`
        });
      }

      setStats({
        totalAlunos: alunos.length,
        totalProfessores: professores.length,
        totalCursos: cursos.length,
        totalTopicos: topicos.length,
        totalNoticias: noticias.length,
        cursosAtivos,
        alunosAtivos: alunos.filter(a => a.ativo !== false).length,
        topicosPorCurso,
        cursosRecentes,
        atividadeRecente,
        evolucaoAlunos,
        distribuicaoCursos,
        ultimasMatriculas,
        alertasSistema,
        financeiro
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
    setCarregando(false);
  };

  const fmtValor = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!usuario) return <div className="flex items-center justify-center h-screen">Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <PageHeader
          icon="🏠"
          title="Painel Administrativo"
          subtitle={usuario?.nomecompleto ? `Bem-vindo, ${usuario.nomecompleto}` : 'Visão geral do sistema'}
        />
        
        {carregando ? (
          <div className="space-y-6">
            <SkeletonCard count={4} cols="grid-cols-1 md:grid-cols-2 lg:grid-cols-4" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Alunos */}
              <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-32 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alunos</h4>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalAlunos}</p>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {stats.alunosAtivos} ativos no sistema
                </div>
              </div>

              {/* Professores */}
              <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-32 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Professores</h4>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalProfessores}</p>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  Corpo docente cadastrado
                </div>
              </div>

              {/* Cursos */}
              <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-32 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cursos</h4>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalCursos}</p>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {stats.cursosAtivos} cursos publicados/ativos
                </div>
              </div>

              {/* Fórum */}
              <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-32 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fórum</h4>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalTopicos}</p>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  Discussões acadêmicas abertas
                </div>
              </div>
            </div>

            {/* Resumo Financeiro (Seção Condicional) */}
            {podeAcessarFinanceiro && stats.financeiro && (
              <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span>💵</span> Resumo Financeiro
                  </h3>
                  <Link href="/admin-financeiro" className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline">
                    Ver financeiro →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Total Recebido</p>
                    <p className="text-lg font-bold text-green-600 mt-1">{fmtValor(stats.financeiro.totalRecebido)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">A Receber</p>
                    <p className="text-lg font-bold text-cyan-600 mt-1">{fmtValor(stats.financeiro.totalAReceber)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Valor em Atraso</p>
                    <p className="text-lg font-bold text-red-600 mt-1">{fmtValor(stats.financeiro.valorVencido)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Taxa de Recebimento</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{stats.financeiro.taxaRecebimento || 0}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Evolução de Alunos (12 meses) */}
              <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[360px] flex flex-col">
                <h3 className="text-base font-bold text-gray-900 mb-1">Evolução Mensal de Alunos</h3>
                <p className="text-xs text-gray-500 mb-4">Novas matrículas nos últimos 12 meses</p>
                <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 px-2 pt-4 relative">
                  {stats.evolucaoAlunos.map((mesStats, idx) => {
                    const maxAlunos = Math.max(...stats.evolucaoAlunos.map(m => m.total), 1);
                    const alturaPorc = Math.max((mesStats.total / maxAlunos) * 80, 4); // Altura mínima de 4% para barras vazias parecerem ativas
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip flutuante */}
                        <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-sm">
                          {mesStats.total} aluno{mesStats.total !== 1 ? 's' : ''}
                        </div>
                        {/* Barra */}
                        <div 
                          className="w-full bg-teal-500 hover:bg-teal-600 rounded-t transition-all duration-300 cursor-pointer"
                          style={{ height: `${alturaPorc}%` }}
                        ></div>
                        {/* Rótulo */}
                        <span className="text-[10px] text-gray-500 mt-2 font-medium truncate w-full text-center">
                          {mesStats.rotulo}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico de Distribuição por Curso */}
              <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[360px] flex flex-col">
                <h3 className="text-base font-bold text-gray-900 mb-1">Alunos por Curso</h3>
                <p className="text-xs text-gray-500 mb-4">Proporção e quantidade absoluta de matrículas</p>
                <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                  {stats.distribuicaoCursos.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      Nenhum aluno vinculado a curso
                    </div>
                  ) : (
                    stats.distribuicaoCursos.map((cursoStats, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <span className="truncate mr-4 flex-1">{cursoStats.titulo}</span>
                          <span className="text-gray-400 font-medium">
                            {cursoStats.total} ({cursoStats.percentual}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-teal-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${cursoStats.percentual}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Listagens Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Últimas Matrículas */}
              <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[340px] flex flex-col">
                <h3 className="text-base font-bold text-gray-900 mb-1">Últimas Matrículas</h3>
                <p className="text-xs text-gray-500 mb-4">Alunos integrados recentemente à plataforma</p>
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                  {stats.ultimasMatriculas.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      Nenhuma matrícula registrada
                    </div>
                  ) : (
                    stats.ultimasMatriculas.map((aluno) => (
                      <div key={aluno.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition shadow-2xs">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-800 truncate">{aluno.nome}</p>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">{aluno.curso}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-150 px-2 py-1 rounded-lg ml-3 whitespace-nowrap">
                          {new Date(aluno.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Últimos Pagamentos ou Alertas do Sistema */}
              {podeAcessarFinanceiro && stats.financeiro?.ultimosPagamentos?.length > 0 ? (
                /* Últimos Pagamentos (Para quem tem privilégio financeiro) */
                <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[340px] flex flex-col">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Últimos Pagamentos</h3>
                  <p className="text-xs text-gray-500 mb-4">Últimas baixas registradas na plataforma</p>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                    {stats.financeiro.ultimosPagamentos.map((pagto) => (
                      <div key={pagto.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition shadow-2xs">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-800 truncate">{pagto.aluno_nome}</p>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">Método: {pagto.metodo}</p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-xs font-extrabold text-green-600">{fmtValor(pagto.valor)}</p>
                          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                            {new Date(pagto.data).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Alertas do Sistema (Visualização padrão ou quando não há dados financeiros) */
                <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs h-[340px] flex flex-col">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Alertas do Sistema</h3>
                  <p className="text-xs text-gray-500 mb-4">Notificações operacionais e pendências cadastrais</p>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                    {stats.alertasSistema.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">
                        Nenhum alerta ativo
                      </div>
                    ) : (
                      stats.alertasSistema.map((alerta, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition shadow-2xs">
                          <span className="text-base leading-none">
                            {alerta.tipo === 'financeiro' ? '🚨' : alerta.tipo === 'academico' ? '📚' : '⚠️'}
                          </span>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">
                            {alerta.mensagem}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
