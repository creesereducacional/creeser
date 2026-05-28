import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

const STATUS_CONFIG = {
  NAO_GERADO:         { label: 'Não Gerado',         bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300',   bar: 'bg-gray-400'   },
  GERADO:             { label: 'Gerado',             bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   bar: 'bg-blue-500'   },
  ENVIADO_ASSINATURA: { label: 'Env. Assinatura',    bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  bar: 'bg-amber-400'  },
  ASSINADO:           { label: 'Assinado',           bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  bar: 'bg-green-500'  },
  RECUSADO:           { label: 'Recusado',           bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    bar: 'bg-red-500'    },
  EXPIRADO:           { label: 'Vencido',            bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', bar: 'bg-orange-400' },
};

function KpiCard({ label, valor, sub, icon, textColor, borderColor, alerta }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 ${borderColor || 'border-gray-200'} p-3 sm:p-4 flex flex-col gap-1`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs font-semibold uppercase tracking-wide ${textColor || 'text-gray-600'}`}>{label}</p>
        <span className="text-base opacity-75">{icon}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${textColor || 'text-gray-800'}`}>{valor ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 leading-snug mt-0.5">{sub}</p>}
      {alerta && <p className="mt-1.5 text-xs font-semibold text-red-600">⚠ {alerta}</p>}
    </div>
  );
}

function ChecklistItem({ ok, label, sublabel, criticidade }) {
  const estado = ok ? 'ok' : (criticidade === 'critico' ? 'critico' : 'warn');
  const estilos = {
    ok:      { bg: 'bg-green-50',  border: 'border-green-200', dotBg: 'bg-green-500',  text: 'text-green-800'  },
    warn:    { bg: 'bg-amber-50',  border: 'border-amber-200', dotBg: 'bg-amber-400',  text: 'text-amber-800'  },
    critico: { bg: 'bg-red-50',    border: 'border-red-200',   dotBg: 'bg-red-500',    text: 'text-red-800'    },
  }[estado];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${estilos.bg} ${estilos.border}`}>
      <span className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 ${estilos.dotBg} flex items-center justify-center text-white text-[10px] font-bold`}>
        {ok ? '✓' : '!'}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${estilos.text}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function DashboardContratos() {
  const [stats, setStats]           = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]             = useState(null);

  useEffect(() => {
    setCarregando(true);
    fetch('/api/contratos/stats', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setStats(d))
      .catch(() => setErro('Erro ao carregar estatísticas de contratos.'))
      .finally(() => setCarregando(false));
  }, []);

  const c     = stats?.counts || {};
  const total = stats?.total  || 0;
  const pendentes      = (c.NAO_GERADO || 0) + (c.GERADO || 0);
  const taxaAssinatura = total > 0 ? Math.round(((c.ASSINADO || 0) / total) * 100) : 0;

  const checks = stats ? [
    {
      categoria: 'Emissão',
      items: [
        {
          ok: (stats.ativosSemContrato || 0) === 0,
          label: 'Todos os alunos ativos têm contrato',
          sublabel: (stats.ativosSemContrato || 0) === 0
            ? 'Nenhum aluno ativo sem contrato assinado'
            : `${stats.ativosSemContrato} aluno(s) ativo(s) sem contrato assinado`,
          criticidade: 'critico',
        },
      ],
    },
    {
      categoria: 'Assinatura',
      items: [
        {
          ok: (c.ENVIADO_ASSINATURA || 0) === 0,
          label: 'Nenhum contrato aguardando assinatura',
          sublabel: `${c.ENVIADO_ASSINATURA || 0} contrato(s) enviado(s) sem retorno`,
          criticidade: 'warn',
        },
        {
          ok: (c.RECUSADO || 0) === 0,
          label: 'Nenhum contrato recusado',
          sublabel: `${c.RECUSADO || 0} contrato(s) recusado(s) pelo signatário`,
          criticidade: 'critico',
        },
        {
          ok: (c.EXPIRADO || 0) === 0,
          label: 'Nenhum contrato vencido',
          sublabel: `${c.EXPIRADO || 0} contrato(s) com prazo expirado`,
          criticidade: 'critico',
        },
      ],
    },
    {
      categoria: 'Conformidade',
      items: [
        {
          ok: taxaAssinatura >= 80,
          label: 'Taxa de assinatura acima de 80%',
          sublabel: `Taxa atual: ${taxaAssinatura}%`,
          criticidade: 'warn',
        },
      ],
    },
  ] : [];

  const allItems   = checks.flatMap(g => g.items);
  const scoreOk    = allItems.filter(i => i.ok).length;
  const scorePct   = allItems.length > 0 ? Math.round((scoreOk / allItems.length) * 100) : 0;
  const scoreColor = scorePct === 100 ? 'text-green-600' : scorePct >= 60 ? 'text-amber-600' : 'text-red-600';
  const scoreBar   = scorePct === 100 ? 'bg-green-500'  : scorePct >= 60 ? 'bg-amber-400'  : 'bg-red-500';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-xl text-white flex-shrink-0">📄</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard de Contratos</h1>
              <p className="text-sm text-gray-500">Painel jurídico-operacional de contratos dos alunos</p>
            </div>
          </div>
          <Link href="/admin/contratos/relatorio">
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors">
              📋 Lista de Contratos
            </button>
          </Link>
        </div>

        {/* Alertas críticos */}
        {stats && (stats.ativosSemContrato > 0 || c.RECUSADO > 0 || c.EXPIRADO > 0) && (
          <div className="space-y-2">
            {stats.ativosSemContrato > 0 && (
              <div className="bg-red-50 border border-red-300 rounded-xl px-5 py-4 flex items-start gap-3">
                <span className="text-xl mt-0.5 flex-shrink-0">🚨</span>
                <div>
                  <p className="font-semibold text-red-800">Alerta Crítico — Alunos sem contrato assinado</p>
                  <p className="text-sm text-red-700 mt-0.5">
                    <strong>{stats.ativosSemContrato}</strong> aluno(s) com matrícula ATIVA sem contrato assinado.{' '}
                    <Link href="/admin/contratos/relatorio" className="underline font-medium">Ver lista →</Link>
                  </p>
                </div>
              </div>
            )}
            {(c.RECUSADO > 0 || c.EXPIRADO > 0) && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 flex items-start gap-3">
                <span className="text-xl mt-0.5 flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-800">Contratos que precisam de ação</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {c.RECUSADO > 0 && <span><strong>{c.RECUSADO}</strong> recusado(s) · </span>}
                    {c.EXPIRADO > 0 && <span><strong>{c.EXPIRADO}</strong> vencido(s)</span>}
                    {' '}— reenvie ou gere novos contratos.{' '}
                    <Link href="/admin/contratos/relatorio" className="underline font-medium">Ver relatório →</Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>}

        {carregando ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando estatísticas...
          </div>
        ) : (
          <>
            {/* 6 KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              <KpiCard label="Pendentes"        valor={pendentes}              sub="Sem contrato ou gerado"       icon="📋" textColor="text-gray-700"   borderColor="border-gray-200"   />
              <KpiCard label="Env. Assinatura"  valor={c.ENVIADO_ASSINATURA||0} sub="Aguardando retorno"           icon="✉️" textColor="text-amber-700"  borderColor="border-amber-300"  />
              <KpiCard label="Assinados"        valor={c.ASSINADO||0}          sub="Concluídos"                  icon="✅" textColor="text-green-700"  borderColor="border-green-300"  />
              <KpiCard label="Recusados"        valor={c.RECUSADO||0}          sub="Signatário recusou"           icon="❌" textColor="text-red-700"    borderColor="border-red-300"    alerta={c.RECUSADO   > 0 ? 'Requer ação'     : null} />
              <KpiCard label="Vencidos"         valor={c.EXPIRADO||0}          sub="Prazo expirado"              icon="⏰" textColor="text-orange-700" borderColor="border-orange-300" alerta={c.EXPIRADO   > 0 ? 'Requer renovação': null} />
              <KpiCard label="Erro Assinatura"  valor={c.ERRO||0}              sub="Falha no envio digital"       icon="⚡" textColor="text-purple-700" borderColor="border-purple-200" alerta={c.ERRO       > 0 ? 'Verificar'       : null} />
            </div>

            {/* Métricas globais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Taxa de assinatura */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Taxa de Assinatura</p>
                  <span className={`text-2xl font-bold ${
                    taxaAssinatura >= 80 ? 'text-green-600' : taxaAssinatura >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>{taxaAssinatura}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${
                      taxaAssinatura >= 80 ? 'bg-green-500' : taxaAssinatura >= 50 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${taxaAssinatura}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">{c.ASSINADO || 0} de {total} contratos assinados</p>
              </div>

              {/* Total */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Total de Alunos</p>
                <p className="text-3xl font-bold text-gray-800">{total}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {stats?.ativosSemContrato || 0} sem contrato · {stats?.pendentesAssinatura || 0} pendentes assinatura
                </p>
              </div>

              {/* Tempo médio */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tempo Médio Assinatura</p>
                <p className="text-3xl font-bold text-gray-300">—</p>
                <p className="text-xs text-gray-400 mt-2">Indisponível nesta versão</p>
              </div>
            </div>

            {/* Gráfico de distribuição */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Distribuição por Status</h2>
              <div className="space-y-3.5">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const val = c[key] || 0;
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-700">{val}</span>
                          <span className="text-gray-400 w-9 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${cfg.bar}`}
                          style={{ width: pct > 0 ? `${Math.max(pct, 1)}%` : '0%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checklist Operacional */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Checklist Operacional</h2>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${scoreColor}`}>{scorePct}%</p>
                    <p className="text-xs text-gray-400">{scoreOk}/{allItems.length} OK</p>
                  </div>
                  <div className={`w-11 h-11 rounded-full border-4 border-gray-100 flex items-center justify-center text-sm font-bold ${scoreColor}`}>
                    {scorePct === 100 ? '✓' : scorePct}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div className={`h-2 rounded-full transition-all duration-700 ${scoreBar}`} style={{ width: `${scorePct}%` }} />
              </div>
              <div className="space-y-5">
                {checks.map(grupo => (
                  <div key={grupo.categoria}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{grupo.categoria}</p>
                    <div className="space-y-2">
                      {grupo.items.map((item, i) => <ChecklistItem key={i} {...item} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
