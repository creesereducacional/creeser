import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const CATEGORIA_ORDER = ['Instituição', 'Usuários', 'Comercial', 'Acadêmico', 'Financeiro', 'Contratos', 'Segurança'];

const STATUS_CONFIG = {
  ok:         { icon: '✅', label: 'OK',         cor: 'text-green-700 bg-green-50 border-green-200' },
  aviso:      { icon: '⚠️', label: 'Atenção',    cor: 'text-amber-700 bg-amber-50 border-amber-200' },
  bloqueante: { icon: '❌', label: 'Bloqueante', cor: 'text-red-700 bg-red-50 border-red-200' },
};

const RESULTADO_CONFIG = {
  VERDE:    { cor: 'bg-green-600', label: 'Pronto para operar', icon: '🟢' },
  AMARELO:  { cor: 'bg-amber-500', label: 'Requer atenção',     icon: '🟡' },
  VERMELHO: { cor: 'bg-red-600',   label: 'Bloqueante — não lançar', icon: '🔴' },
};

export default function GoLiveChecklist() {
  const [dados, setDados]           = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]             = useState(null);

  function carregar() {
    setCarregando(true);
    setErro(null);
    fetch('/api/go-live/checklist', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setDados(d))
      .catch(() => setErro('Erro ao carregar checklist. Verifique se você tem permissão (grupo_admin ou instituicao_admin).'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => { carregar(); }, []);

  const resultado = dados ? RESULTADO_CONFIG[dados.resultado] : null;
  const checks    = dados?.checks || [];

  const checksPorCategoria = CATEGORIA_ORDER.reduce((acc, cat) => {
    acc[cat] = checks.filter(c => c.categoria === cat);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Checklist Go-Live</h1>
              <p className="text-sm text-gray-500">Validação pré-operação — Inove Técnico</p>
            </div>
          </div>
          <button onClick={carregar}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            🔄 Atualizar
          </button>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>
        )}

        {carregando && (
          <div className="text-center py-16 text-gray-400">Executando verificações...</div>
        )}

        {!carregando && dados && (
          <>
            {/* Score + Resultado */}
            <div className={`rounded-2xl p-6 text-white ${resultado?.cor || 'bg-gray-600'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-black mb-1">{dados.score}%</div>
                  <div className="text-lg font-semibold opacity-90">{resultado?.icon} {resultado?.label}</div>
                  <div className="text-sm opacity-70 mt-1">
                    {dados.resumo.ok} ok · {dados.resumo.avisos} avisos · {dados.resumo.bloqueantes} bloqueante(s)
                  </div>
                </div>
                <div className="text-7xl opacity-20 font-black select-none">{dados.score}%</div>
              </div>
            </div>

            {/* Checks por categoria */}
            {CATEGORIA_ORDER.map(cat => {
              const items = checksPorCategoria[cat] || [];
              if (items.length === 0) return null;
              const qtdOk  = items.filter(c => c.status === 'ok').length;
              return (
                <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-800">{cat}</h2>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      qtdOk === items.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {qtdOk}/{items.length}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map(item => {
                      const cfg = STATUS_CONFIG[item.status];
                      return (
                        <div key={item.id} className={`flex items-start gap-3 px-5 py-3.5 border-l-4 ${
                          item.status === 'ok'         ? 'border-l-green-400' :
                          item.status === 'aviso'      ? 'border-l-amber-400' :
                                                         'border-l-red-400'
                        }`}>
                          <span className="text-base mt-0.5">{cfg.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                            {item.detalhe && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.detalhe}</p>
                            )}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cfg.cor}`}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Recomendações */}
            {dados.resumo.bloqueantes > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                <p className="font-semibold text-red-800 mb-2">Itens bloqueantes devem ser corrigidos antes do lançamento:</p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {checks.filter(c => c.status === 'bloqueante').map(c => (
                    <li key={c.id}>{c.label} — {c.detalhe}</li>
                  ))}
                </ul>
              </div>
            )}
            {dados.resumo.avisos > 0 && dados.resumo.bloqueantes === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                <p className="font-semibold text-amber-800 mb-2">Atenção — itens recomendados antes da operação:</p>
                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                  {checks.filter(c => c.status === 'aviso').map(c => (
                    <li key={c.id}>{c.label} — {c.detalhe}</li>
                  ))}
                </ul>
              </div>
            )}
            {dados.resultado === 'VERDE' && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-green-800 font-semibold text-sm">
                ✅ Instituição pronta para receber alunos reais. Todos os checks passaram.
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
