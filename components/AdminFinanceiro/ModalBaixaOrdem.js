import { useState } from 'react';

const METODOS = [
  { value: 'pix',           label: 'PIX' },
  { value: 'dinheiro',      label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'cartao',        label: 'Cartão' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'outro',         label: 'Outro' },
];

const METODO_LABEL = Object.fromEntries(METODOS.map(m => [m.value, m.label]));

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const today = () => new Date().toISOString().split('T')[0];

export default function ModalBaixaOrdem({ ordem, onConfirm, onClose, loading }) {
  const [form, setForm] = useState({
    metodo_pagamento: 'pix',
    data_pagamento: today(),
    observacao: '',
  });

  const [mostrarResumo, setMostrarResumo] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Valor da fatura estritamente derivado da ordem selecionada
  const valorFaturaNum = Number(ordem?.valor_total);
  const valorValido = Number.isFinite(valorFaturaNum) && valorFaturaNum > 0;

  const statusAtual = ordem?.status_parcela || ordem?.status || 'ativo';
  const isBloqueado = statusAtual === 'pago' || statusAtual === 'cancelado';

  const podeAvancar = valorValido && !isBloqueado && !loading && Boolean(form.data_pagamento);

  const handleAvancar = (e) => {
    e.preventDefault();
    if (!podeAvancar) return;
    setMostrarResumo(true);
  };

  const handleConfirmar = () => {
    if (!podeAvancar) return;
    onConfirm({
      metodo_pagamento: form.metodo_pagamento,
      data_pagamento: form.data_pagamento,
      observacao: form.observacao,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between px-6 py-4 border-b bg-gray-50/70">
          <div>
            <h3 className="text-base font-bold text-gray-800">Baixar Manualmente</h3>
            <div className="mt-1 space-y-0.5 text-xs text-gray-600">
              <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                <span className="text-gray-400 font-normal">Aluno:</span> {ordem?.aluno_nome || 'N/A'}
              </p>
              {ordem?.descricao && (
                <p className="flex items-center gap-1.5">
                  <span className="text-gray-400">Descrição:</span> {ordem.descricao}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                {ordem?.data_vencimento && (
                  <p>
                    <span className="text-gray-400">Vencimento:</span>{' '}
                    <span className="font-medium text-gray-700">
                      {ordem.data_vencimento.includes('T') || ordem.data_vencimento.includes('-')
                        ? new Date(ordem.data_vencimento.split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR')
                        : ordem.data_vencimento}
                    </span>
                  </p>
                )}
                <p className="flex items-center gap-1">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    statusAtual === 'pago' ? 'bg-green-100 text-green-700' :
                    statusAtual === 'cancelado' ? 'bg-red-100 text-red-700' :
                    statusAtual === 'atrasado' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {statusAtual}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-650 disabled:opacity-40 text-2xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Avisos */}
        <div className="px-6 pt-3 space-y-2">
          {/* Aviso de Integração EFI */}
          {(ordem?.tem_efi || ordem?.efi_charge_id || ordem?.parcela_efi_charge_id || ordem?.efi_carnet_id || (ordem?.cobranca && ordem?.cobranca !== '-')) ? (
            <div className="flex gap-2.5 items-start p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <span className="text-base leading-none flex-shrink-0">🏦</span>
              <div>
                <strong className="block font-bold text-blue-950 mb-0.5">Sincronização Automática EFI Bank</strong>
                <span>Esta ordem possui cobrança bancária ativa. Ao confirmar a baixa manual, o sistema solicitará <strong>automaticamente o cancelamento e encerramento oficial da cobrança na EFI</strong> para impedir pagamentos duplicados.</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-start p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700">
              <span className="text-base leading-none flex-shrink-0">📄</span>
              <span>Quitação manual de lançamento interno sem cobrança bancária EFI associada.</span>
            </div>
          )}

          {/* Bloqueio se cancelado ou já pago */}
          {isBloqueado && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
              <span className="text-base">🚫</span>
              <span>Esta ordem já se encontra com status <strong>{statusAtual}</strong>. A baixa manual está bloqueada.</span>
            </div>
          )}

          {/* Erro explícito se o valor não puder ser recuperado */}
          {!valorValido && !isBloqueado && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
              <span className="text-base">❌</span>
              <span>Erro: Não foi possível recuperar o valor devido desta fatura. A baixa está bloqueada.</span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1">
          {!mostrarResumo ? (
            /* ── Formulário de Baixa ────────────────── */
            <form onSubmit={handleAvancar} className="px-6 py-4 space-y-4">
              {/* CAMPO ÚNICO SOMENTE LEITURA: VALOR DA FATURA */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  VALOR DA FATURA
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl flex items-center justify-between">
                  <span className="text-xl font-extrabold text-gray-900 font-mono">
                    {valorValido ? fmtBRL(valorFaturaNum) : 'Valor indisponível'}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                    Quitação Integral
                  </span>
                </div>
              </div>

              {/* Método de pagamento */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Método de pagamento <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.metodo_pagamento}
                  onChange={e => set('metodo_pagamento', e.target.value)}
                  required
                  disabled={!podeAvancar}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white disabled:bg-gray-100"
                >
                  {METODOS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Data do pagamento */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Data do pagamento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.data_pagamento}
                  onChange={e => set('data_pagamento', e.target.value)}
                  required
                  disabled={!podeAvancar}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium disabled:bg-gray-100"
                />
              </div>

              {/* Observação */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Observação <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={form.observacao}
                  onChange={e => set('observacao', e.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={!podeAvancar}
                  placeholder="Ex: Baixa presencial confirmada no financeiro"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none disabled:bg-gray-100"
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-650 border border-gray-300 rounded-xl hover:bg-gray-100 transition disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!podeAvancar}
                  className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Revisar →
                </button>
              </div>
            </form>
          ) : (
            /* ── Resumo Financeiro da Baixa ────────── */
            <div className="px-6 py-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Resumo da Quitação Integral
              </h4>

              <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-100 text-sm overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-gray-500 text-xs">VALOR DA FATURA</span>
                  <span className="text-gray-900 font-bold font-mono text-base">
                    {fmtBRL(valorFaturaNum)}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-gray-500 text-xs">Método Escolhido</span>
                  <span className="text-gray-800 font-semibold text-xs">
                    {METODO_LABEL[form.metodo_pagamento] || form.metodo_pagamento}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-gray-500 text-xs">Data do Pagamento</span>
                  <span className="text-gray-800 font-mono text-xs">
                    {form.data_pagamento
                      ? new Date(form.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')
                      : '-'}
                  </span>
                </div>
                {form.observacao && (
                  <div className="px-4 py-2.5 text-xs text-gray-600 bg-white">
                    <span className="text-gray-400 block mb-0.5">Observação:</span>
                    <p className="italic">{form.observacao}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarResumo(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-650 border border-gray-300 rounded-xl hover:bg-gray-100 transition disabled:opacity-40"
                >
                  ← Editar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={loading || !podeAvancar}
                  className="flex-1 px-5 py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? '⏳ Registrando...' : '✅ Confirmar Baixa'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
