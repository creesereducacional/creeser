import { useState, useEffect, useCallback } from 'react';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';
import DashboardCard from '@/components/recepcao/DashboardCard';

const STATUS_BADGE = {
  PENDENTE_REPASSE: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  REPASSADO:        'bg-green-100 text-green-800 border border-green-200',
  CANCELADO:        'bg-red-100 text-red-700 border border-red-200',
};
const STATUS_LABEL = {
  PENDENTE_REPASSE: 'Pendente',
  REPASSADO:        'Repassado',
  CANCELADO:        'Cancelado',
};

const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

function CardResumo({ label, valor, count, cor }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${cor}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{count}</p>
      <p className="text-sm font-semibold text-teal-700 mt-1">{fmtMoeda(valor)}</p>
    </div>
  );
}

function ModalRepassar({ comissao, onClose, onConfirm }) {
  const [dataRepasse, setDataRepasse]   = useState(new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao]     = useState('');
  const [salvando, setSalvando]         = useState(false);
  const [erro, setErro]                 = useState('');

  const handleConfirm = async () => {
    if (!dataRepasse) { setErro('Data de repasse obrigatória'); return; }
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch(`/api/admin-financeiro/comissoes/${comissao.id}/repassar`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ data_repasse: dataRepasse, observacao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao marcar repasse');
      onConfirm();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Confirmar Repasse</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600">Captador: <span className="font-medium">{comissao.captado_por?.nomecompleto || '—'}</span></p>
            <p className="text-gray-600">Aluno: <span className="font-medium">{comissao.aluno?.nome || '—'}</span></p>
            <p className="text-gray-600">Valor comissão: <span className="font-bold text-teal-700">{fmtMoeda(comissao.valor_comissao)}</span></p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data do Repasse *</label>
            <input
              type="date"
              value={dataRepasse}
              onChange={e => setDataRepasse(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observação (opcional)</label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={2}
              placeholder="Ex: Pix enviado, transferência #123..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={salvando}
            className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {salvando ? 'Confirmando...' : 'Confirmar Repasse'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConfig({ config, onClose, onSalvo }) {
  const [modo, setModo]           = useState(config?.modo || 'PERCENTUAL');
  const [percentual, setPercentual] = useState(config?.percentual || '');
  const [valorFixo, setValorFixo] = useState(config?.valor_fixo || '');
  const [ativo, setAtivo]         = useState(config?.ativo !== false);
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState('');

  const handleSalvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/admin-financeiro/comissoes/config', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ modo, percentual: Number(percentual), valor_fixo: Number(valorFixo), ativo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar');
      onSalvo(data.config);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Configurar Comissões</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Modo de cálculo</label>
            <select
              value={modo}
              onChange={e => setModo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            >
              <option value="PERCENTUAL">Percentual sobre matrícula</option>
              <option value="VALOR_FIXO">Valor fixo por matrícula</option>
            </select>
          </div>
          {modo === 'PERCENTUAL' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Percentual (%)</label>
              <input
                type="number" min="0.1" max="100" step="0.1"
                value={percentual}
                onChange={e => setPercentual(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                placeholder="Ex: 10"
              />
            </div>
          )}
          {modo === 'VALOR_FIXO' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor fixo (R$)</label>
              <input
                type="number" min="0.01" step="0.01"
                value={valorFixo}
                onChange={e => setValorFixo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                placeholder="Ex: 50"
              />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">Regra ativa (gerar comissões)</span>
          </label>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminComissoes() {
  const [comissoes, setComissoes]   = useState([]);
  const [resumo, setResumo]         = useState(null);
  const [config, setConfig]         = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso]           = useState(null);

  // Filtros
  const [filtroStatus, setFiltroStatus]   = useState('');
  const [filtroInicio, setFiltroInicio]   = useState('');
  const [filtroFim, setFiltroFim]         = useState('');
  const [filtroCaptador, setFiltroCaptador] = useState('');

  // Modais
  const [modalRepassar, setModalRepassar] = useState(null);
  const [modalConfig, setModalConfig]     = useState(false);

  const carregarComissoes = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus)   params.set('status', filtroStatus);
      if (filtroInicio)   params.set('data_inicio', filtroInicio);
      if (filtroFim)      params.set('data_fim', filtroFim);
      if (filtroCaptador) params.set('captado_por_id', filtroCaptador);

      const res  = await fetch(`/api/admin-financeiro/comissoes?${params}`, { credentials: 'include' });
      const data = await res.json();
      setComissoes(Array.isArray(data.comissoes) ? data.comissoes : []);
      setResumo(data.resumo || null);
      if (data.aviso) setAviso(data.aviso);
    } catch {
      setAviso('Erro ao carregar comissões.');
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, filtroInicio, filtroFim, filtroCaptador]);

  const carregarConfig = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin-financeiro/comissoes/config', { credentials: 'include' });
      const data = await res.json();
      setConfig(data.config || null);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    carregarComissoes();
    carregarConfig();
  }, [carregarComissoes, carregarConfig]);

  const handleRepassarConfirm = () => {
    setModalRepassar(null);
    carregarComissoes();
  };

  // Captadores únicos para filtro
  const captadoresUnicos = [
    ...new Map(
      comissoes
        .filter(c => c.captado_por?.id)
        .map(c => [c.captado_por.id, c.captado_por])
    ).values(),
  ];

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Comissões Comerciais</h2>
            <p className="text-sm text-gray-500 mt-0.5">Apuração e repasse de comissões por matrícula</p>
          </div>
          <button
            onClick={() => setModalConfig(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition"
          >
            ⚙️ Configurar Regra
            {config && (
              <span className="text-xs bg-teal-600 text-white rounded-full px-2 py-0.5">
                {config.modo === 'PERCENTUAL' ? `${config.percentual}%` : fmtMoeda(config.valor_fixo)}
              </span>
            )}
          </button>
        </div>

        {aviso && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
            ⚠️ {aviso}
          </div>
        )}

        {/* Cards de resumo */}
        {resumo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DashboardCard icon="⏳" label="Pend. de Repasse"   valor={resumo.pendentes}              cor="border-yellow-400" bgIcon="bg-yellow-50" loading={carregando} />
            <DashboardCard icon="💰" label="Valor Pendente"     valor={fmtMoeda(resumo.valorPendente)}  cor="border-yellow-500" bgIcon="bg-yellow-50" loading={carregando} />
            <DashboardCard icon="✅" label="Repassadas"         valor={resumo.repassadas}             cor="border-green-500"  bgIcon="bg-green-50"  loading={carregando} />
            <DashboardCard icon="💵" label="Valor Repassado"    valor={fmtMoeda(resumo.valorRepassado)} cor="border-green-600"  bgIcon="bg-green-50"  loading={carregando} />
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              >
                <option value="">Todos</option>
                <option value="PENDENTE_REPASSE">Pendente</option>
                <option value="REPASSADO">Repassado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">De</label>
              <input
                type="date"
                value={filtroInicio}
                onChange={e => setFiltroInicio(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Até</label>
              <input
                type="date"
                value={filtroFim}
                onChange={e => setFiltroFim(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            {captadoresUnicos.length > 1 && (
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-medium text-gray-600">Captador</label>
                <select
                  value={filtroCaptador}
                  onChange={e => setFiltroCaptador(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                >
                  <option value="">Todos</option>
                  {captadoresUnicos.map(c => (
                    <option key={c.id} value={c.id}>{c.nomecompleto}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <button
                onClick={carregarComissoes}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition"
              >
                Filtrar
              </button>
            </div>
            {(filtroStatus || filtroInicio || filtroFim || filtroCaptador) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFiltroStatus('');
                    setFiltroInicio('');
                    setFiltroFim('');
                    setFiltroCaptador('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {carregando ? (
            <div className="py-16 text-center text-gray-400">Carregando...</div>
          ) : comissoes.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-lg mb-2">Nenhuma comissão encontrada</p>
              <p className="text-sm">
                {config
                  ? 'As comissões são geradas automaticamente após confirmação de pagamento de matrícula.'
                  : 'Configure a regra de comissionamento clicando em "Configurar Regra".'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Captador</th>
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3 text-right">Vlr. Matrícula</th>
                    <th className="px-4 py-3 text-right">Comissão</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Crédito</th>
                    <th className="px-4 py-3">Repasse</th>
                    <th className="px-4 py-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comissoes.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 text-xs">
                          {c.captado_por?.nomecompleto || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{c.aluno?.nome || '—'}</div>
                        <div className="text-xs text-gray-400">{c.aluno?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {fmtMoeda(c.valor_base)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-teal-700">{fmtMoeda(c.valor_comissao)}</span>
                        {c.percentual != null && (
                          <div className="text-xs text-gray-400">{c.percentual}%</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtData(c.data_credito)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtData(c.data_repasse)}</td>
                      <td className="px-4 py-3 text-center">
                        {c.status === 'PENDENTE_REPASSE' && (
                          <button
                            onClick={() => setModalRepassar(c)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition"
                          >
                            Repassar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <strong>ℹ️ Sobre o módulo:</strong> Comissões são geradas automaticamente quando o pagamento
          de matrícula é confirmado (baixa manual ou webhook EFI) e o aluno possui captador.
          O repasse é manual — clique em "Repassar" após efetuar o pagamento ao captador.
        </div>
      </div>

      {/* Modais */}
      {modalRepassar && (
        <ModalRepassar
          comissao={modalRepassar}
          onClose={() => setModalRepassar(null)}
          onConfirm={handleRepassarConfirm}
        />
      )}
      {modalConfig && (
        <ModalConfig
          config={config}
          onClose={() => setModalConfig(false)}
          onSalvo={(novaConfig) => {
            setConfig(novaConfig);
            setModalConfig(false);
          }}
        />
      )}
    </AdminFinanceiroLayout>
  );
}
