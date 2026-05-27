import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

const STATUS_CONFIG = {
  NAO_GERADO:         { label: 'Não Gerado',        cor: 'bg-gray-100 text-gray-600 border-gray-300' },
  GERADO:             { label: 'Gerado',             cor: 'bg-blue-100 text-blue-700 border-blue-300' },
  ENVIADO_ASSINATURA: { label: 'Enviado',            cor: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  ASSINADO:           { label: 'Assinado',           cor: 'bg-green-100 text-green-700 border-green-300' },
  RECUSADO:           { label: 'Recusado',           cor: 'bg-red-100 text-red-700 border-red-300' },
  EXPIRADO:           { label: 'Expirado',           cor: 'bg-orange-100 text-orange-700 border-orange-300' },
};

function Card({ label, valor, sub, cor }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 flex flex-col gap-1 ${cor}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold">{valor ?? '—'}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  );
}

export default function DashboardContratos() {
  const [stats, setStats]       = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]         = useState(null);

  useEffect(() => {
    setCarregando(true);
    fetch('/api/contratos/stats', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setStats(d))
      .catch(() => setErro('Erro ao carregar estatísticas de contratos.'))
      .finally(() => setCarregando(false));
  }, []);

  const c = stats?.counts || {};

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📄</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard de Contratos</h1>
              <p className="text-sm text-gray-500">Visão geral do status contratual dos alunos</p>
            </div>
          </div>
          <Link href="/admin/contratos/relatorio">
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors">
              📊 Relatório Detalhado
            </button>
          </Link>
        </div>

        {/* Alerta ATIVO sem contrato */}
        {stats?.ativosSemContrato > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">Alunos ativos sem contrato assinado</p>
              <p className="text-sm text-amber-700 mt-0.5">
                <strong>{stats.ativosSemContrato}</strong> aluno(s) com status ATIVO não possuem contrato assinado.{' '}
                <Link href="/admin/contratos/relatorio" className="underline font-medium">Ver relatório →</Link>
              </p>
            </div>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>
        )}

        {/* Cards */}
        {carregando ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card
                label="Não Gerados"
                valor={c.NAO_GERADO}
                sub="Sem contrato gerado"
                cor="border-gray-200 text-gray-700"
              />
              <Card
                label="Gerados"
                valor={c.GERADO}
                sub="Contrato gerado, aguardando envio"
                cor="border-blue-200 text-blue-700"
              />
              <Card
                label="Enviados p/ Assinatura"
                valor={c.ENVIADO_ASSINATURA}
                sub="Aguardando assinatura dos signatários"
                cor="border-yellow-200 text-yellow-700"
              />
              <Card
                label="Assinados"
                valor={c.ASSINADO}
                sub="Contrato concluído"
                cor="border-green-200 text-green-700"
              />
              <Card
                label="Recusados"
                valor={c.RECUSADO}
                sub="Signatário recusou"
                cor="border-red-200 text-red-700"
              />
              <Card
                label="Expirados"
                valor={c.EXPIRADO}
                sub="Prazo de assinatura vencido"
                cor="border-orange-200 text-orange-700"
              />
            </div>

            {/* Linha de totais */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card
                label="Pendentes Assinatura"
                valor={stats?.pendentesAssinatura}
                sub="Gerados + Enviados"
                cor="border-indigo-200 text-indigo-700"
              />
              <Card
                label="Total de Alunos"
                valor={stats?.total}
                sub="Em todas as turmas"
                cor="border-gray-200 text-gray-700"
              />
              <Card
                label="Ativos Sem Contrato"
                valor={stats?.ativosSemContrato}
                sub={stats?.ativosSemContrato > 0 ? 'Requer atenção' : 'Tudo em ordem'}
                cor={stats?.ativosSemContrato > 0 ? 'border-amber-300 text-amber-700' : 'border-green-200 text-green-700'}
              />
            </div>

            {/* Gráfico de barras simples */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Distribuição por Status</h2>
              <div className="space-y-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const val   = c[key] || 0;
                  const total = stats?.total || 1;
                  const pct   = Math.round((val / total) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{cfg.label}</span>
                        <span className="text-gray-400">{val} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            key === 'ASSINADO'           ? 'bg-green-500'  :
                            key === 'ENVIADO_ASSINATURA' ? 'bg-yellow-400' :
                            key === 'GERADO'             ? 'bg-blue-400'   :
                            key === 'RECUSADO'           ? 'bg-red-400'    :
                            key === 'EXPIRADO'           ? 'bg-orange-400' :
                                                           'bg-gray-300'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
