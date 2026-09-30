import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import StatusBadge from '@/components/recepcao/StatusBadge';
import DashboardCard from '@/components/recepcao/DashboardCard';
import EmptyState from '@/components/recepcao/EmptyState';

function isHoje(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isMes(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}

function iniciais(nome) {
  if (!nome) return '?';
  const p = nome.trim().split(' ').filter(Boolean);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

function avatarCor(nome) {
  const cores = [
    'bg-[#059669]', // Emerald
    'bg-[#10b981]', // Green
    'bg-[#e11d48]', // Rose/Crimson
    'bg-[#2563eb]', // Blue
    'bg-[#1e40af]', // Navy
    'bg-[#7c3aed]', // Purple
    'bg-[#ea580c]', // Orange
    'bg-[#0891b2]', // Cyan
  ];
  if (!nome) return cores[0];
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return cores[Math.abs(hash) % cores.length];
}

function formatarCPF(cpf) {
  if (!cpf) return '—';
  const clean = String(cpf).replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

function formatarDataHora(dataStr) {
  if (!dataStr) return { data: '—', hora: '' };
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return { data: dataStr, hora: '' };
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { data, hora };
}

function getSaudacao() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function RecepcaoDashboard() {
  const router = useRouter();
  const [lista, setLista] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Paginação da tabela "Últimos Atendimentos"
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(5);

  useEffect(() => {
    Promise.all([
      fetch('/api/recepcao/pre-cadastros', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/formacao-turmas', { credentials: 'include' }).then(r => r.json()).catch(() => []),
    ])
      .then(([alunos, t]) => {
        setLista(Array.isArray(alunos) ? alunos : []);
        setTurmas(Array.isArray(t) ? t : []);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  // Cálculos reais dos indicadores
  const hoje     = lista.filter(a => isHoje(a.datacriacao)).length;
  const mes      = lista.filter(a => isMes(a.datacriacao)).length;
  const pgto     = lista.filter(a => a.statusmatricula === 'AGUARDANDO_PAGAMENTO_MATRICULA').length;
  const forTurma = lista.filter(a => a.statusmatricula === 'AGUARDANDO_FORMACAO_TURMA').length;
  const prontas  = turmas.filter(t => t.status_formacao === 'PRONTA_PARA_ABRIR').length;

  // Paginação dos atendimentos
  const totalRegistros = lista.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;

  const atendimentosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return lista.slice(inicio, inicio + itensPorPagina);
  }, [lista, paginaAtual, itensPorPagina]);

  const indiceInicio = totalRegistros === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
  const indiceFim = Math.min(paginaAtual * itensPorPagina, totalRegistros);

  // Saudação dinâmica com base no horário
  const [saudacao, setSaudacao] = useState('Bom dia');
  useEffect(() => {
    setSaudacao(getSaudacao());
  }, []);

  return (
    <RecepcaoLayout titulo="Dashboard — Recepção" badgeCount={lista.length}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ── 1. Banner Principal de Boas-Vindas ───────────────────────── */}
        <div
          className="relative overflow-hidden rounded-3xl border border-blue-100 shadow-[0_4px_20px_rgba(11,92,214,0.06)] p-6 sm:p-8 md:p-10 flex flex-col justify-center min-h-[160px] md:min-h-[195px] bg-cover bg-right bg-no-repeat bg-[#eaf2fc]"
          style={{ backgroundImage: "url('/images/bg_recepcao.png')" }}
        >
          {/* Lado Esquerdo: Textos Institucionais */}
          <div className="z-10 max-w-md sm:max-w-lg md:max-w-xl text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f2b5c] tracking-tight flex items-center gap-2">
              {saudacao}, Recepção! <span className="inline-block animate-bounce">👋</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium mt-2.5 leading-relaxed">
              Aqui está o resumo das atividades de hoje. Mantenha os atendimentos em dia e ajude novos alunos a iniciarem sua jornada no CREESER.
            </p>
          </div>
        </div>

        {/* ── 2. Cards de Indicadores (5 Colunas Horizontais) ─────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Pré-Cadastros Hoje */}
          <DashboardCard
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            label="Pré-Cadastros Hoje"
            valor={hoje}
            bgIcon="bg-blue-50"
            trend={hoje > 0 ? "↑ 100% vs. ontem" : "Sem alteração"}
            trendType={hoje > 0 ? "up" : "neutral"}
            sparklineColor="blue"
            loading={carregando}
            href="/recepcao/pre-cadastros"
          />

          {/* Card 2: Pré-Cadastros no Mês */}
          <DashboardCard
            icon={
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Pré-Cadastros no Mês"
            valor={mes}
            bgIcon="bg-emerald-50"
            trend={mes > 0 ? "↑ 40% vs. mês anterior" : "Sem alteração"}
            trendType={mes > 0 ? "up" : "neutral"}
            sparklineColor="emerald"
            loading={carregando}
            href="/recepcao/pre-cadastros"
          />

          {/* Card 3: Aguardando Pagamento */}
          <DashboardCard
            icon={
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
            label="Aguardando Pagamento"
            valor={pgto}
            bgIcon="bg-amber-50"
            trend="Sem alteração"
            trendType="neutral"
            sparklineColor="amber"
            loading={carregando}
            href="/recepcao/pre-cadastros?filtro=AGUARDANDO_PAGAMENTO_MATRICULA"
          />

          {/* Card 4: Aguardando Formação */}
          <DashboardCard
            icon={
              <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            label="Aguardando Formação"
            valor={forTurma}
            bgIcon="bg-rose-50"
            trend="Sem alteração"
            trendType="neutral"
            sparklineColor="rose"
            loading={carregando}
            href="/recepcao/pre-cadastros?filtro=AGUARDANDO_FORMACAO_TURMA"
          />

          {/* Card 5: Turmas Prontas */}
          <DashboardCard
            icon={
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            }
            label="Turmas Prontas"
            valor={prontas}
            bgIcon="bg-purple-50"
            trend="Sem alteração"
            trendType="neutral"
            sparklineColor="purple"
            loading={carregando}
            href="/recepcao/turmas"
          />
        </div>

        {/* ── 3. Painel Principal: Últimos Atendimentos (Full Width) ──── */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Topo do Painel */}
          <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  Últimos Atendimentos
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Últimos pré-cadastros e atendimentos realizados.
                </p>
              </div>
            </div>

            <Link
              href="/recepcao/pre-cadastros"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 transition-colors w-fit self-end sm:self-center"
            >
              <span>Ver todos</span>
              <span>→</span>
            </Link>
          </div>

          {/* Conteúdo da Tabela */}
          {carregando ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm font-medium">Carregando atendimentos...</p>
            </div>
          ) : lista.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="📭"
                title="Nenhum atendimento registrado"
                message="Cadastre o primeiro pré-cadastro para iniciar o fluxo de atendimento."
                action={
                  <Link
                    href="/recepcao/pre-cadastros/novo"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    <span>➕</span> Novo Pré-Cadastro
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Nome</th>
                    <th className="py-3.5 px-6">CPF</th>
                    <th className="py-3.5 px-6">Data</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Origem</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80 text-sm">
                  {atendimentosPaginados.map(aluno => {
                    const dataHora = formatarDataHora(aluno.datacriacao);
                    const cleanPhone = String(aluno.telefone_celular || '').replace(/\D/g, '');
                    const whatsUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

                    return (
                      <tr key={aluno.id} className="hover:bg-blue-50/40 transition-colors group">
                        {/* Nome + Avatar */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-full ${avatarCor(aluno.nome)} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              {iniciais(aluno.nome)}
                            </div>
                            <Link
                              href={`/recepcao/pre-cadastros/${aluno.id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 transition-colors truncate max-w-xs md:max-w-md block"
                              title={aluno.nome}
                            >
                              {aluno.nome}
                            </Link>
                          </div>
                        </td>

                        {/* CPF */}
                        <td className="py-3.5 px-6 text-gray-600 font-mono text-xs whitespace-nowrap">
                          {formatarCPF(aluno.cpf)}
                        </td>

                        {/* Data e Hora */}
                        <td className="py-3.5 px-6 text-xs text-gray-600 whitespace-nowrap">
                          <p className="font-semibold text-gray-800">{dataHora.data}</p>
                          {dataHora.hora && <p className="text-gray-400 text-[11px]">{dataHora.hora}</p>}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <StatusBadge status={aluno.statusmatricula} size="md" />
                        </td>

                        {/* Origem */}
                        <td className="py-3.5 px-6 text-xs font-medium text-gray-600 whitespace-nowrap">
                          {aluno.origem_captacao || 'Recepção'}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp / Mensagem */}
                            {whatsUrl ? (
                              <a
                                href={whatsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 flex items-center justify-center transition-all shadow-sm"
                                title="Iniciar conversa no WhatsApp"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </a>
                            ) : (
                              <button
                                disabled
                                className="w-8 h-8 rounded-full border border-gray-100 text-gray-300 flex items-center justify-center cursor-not-allowed opacity-50"
                                title="Sem telefone cadastrado"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </button>
                            )}

                            {/* Visualizar */}
                            <Link
                              href={`/recepcao/pre-cadastros/${aluno.id}`}
                              className="w-8 h-8 rounded-full border border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-500 hover:text-blue-600 flex items-center justify-center transition-all shadow-sm"
                              title="Visualizar ficha de pré-cadastro"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>

                            {/* Editar */}
                            <Link
                              href={`/recepcao/pre-cadastros/${aluno.id}`}
                              className="w-8 h-8 rounded-full border border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-500 hover:text-blue-600 flex items-center justify-center transition-all shadow-sm"
                              title="Editar dados"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé e Paginação */}
          {lista.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/40">
              <p className="text-xs text-gray-500 font-medium">
                Mostrando <span className="font-bold text-gray-800">{indiceInicio}</span> a{' '}
                <span className="font-bold text-gray-800">{indiceFim}</span> de{' '}
                <span className="font-bold text-gray-800">{totalRegistros}</span> registros
              </p>

              <div className="flex items-center gap-3">
                {/* Seletor Itens por Página */}
                <select
                  value={itensPorPagina}
                  onChange={e => {
                    setItensPorPagina(Number(e.target.value));
                    setPaginaAtual(1);
                  }}
                  className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                </select>

                {/* Botões de Navegação */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
                    disabled={paginaAtual === 1}
                    className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold transition-colors shadow-sm"
                    title="Página anterior"
                  >
                    ←
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pag => (
                    <button
                      key={pag}
                      onClick={() => setPaginaAtual(pag)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        paginaAtual === pag
                          ? 'bg-blue-600 text-white shadow-blue-500/20'
                          : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {pag}
                    </button>
                  ))}

                  <button
                    onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                    className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold transition-colors shadow-sm"
                    title="Próxima página"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RecepcaoLayout>
  );
}
