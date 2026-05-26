import { useState } from 'react';

const METODOS = [
  { value: 'pix',          label: 'PIX' },
  { value: 'dinheiro',     label: 'Dinheiro' },
  { value: 'transferencia',label: 'Transferência Bancária' },
  { value: 'cartao',       label: 'Cartão' },
  { value: 'cheque',       label: 'Cheque' },
  { value: 'outro',        label: 'Outro' },
];

const today = () => new Date().toISOString().split('T')[0];

export default function ModalBaixaManual({ parcela, numeroParcela, onConfirm, onClose, loading }) {
  const [form, setForm] = useState({
    metodo_pagamento: 'pix',
    valor_pago: parcela?.valor != null ? String(parcela.valor) : '',
    data_pagamento: today(),
    observacao: '',
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      metodo_pagamento: form.metodo_pagamento,
      valor_pago: Number(form.valor_pago),
      data_pagamento: form.data_pagamento,
      observacao: form.observacao,
    });
  };

  const temBoletoEfi = Boolean(parcela?.efi_charge_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-base font-bold text-gray-800">Baixar Manualmente</h3>
            {numeroParcela != null && (
              <p className="text-xs text-gray-500 mt-0.5">Parcela {numeroParcela}</p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Aviso EFI */}
          {temBoletoEfi && (
            <div className="flex gap-2 items-start p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <span className="text-lg leading-none">⚠️</span>
              <span>Esta baixa <strong>não cancela automaticamente o boleto EFI.</strong> Cancele o boleto no painel EFI separadamente, se necessário.</span>
            </div>
          )}

          {/* Método */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Método de pagamento <span className="text-red-500">*</span>
            </label>
            <select
              value={form.metodo_pagamento}
              onChange={e => set('metodo_pagamento', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
            >
              {METODOS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Valor recebido (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.valor_pago}
              onChange={e => set('valor_pago', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Data do pagamento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.data_pagamento}
              onChange={e => set('data_pagamento', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
            />
          </div>

          {/* Observação */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Observação <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.observacao}
              onChange={e => set('observacao', e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Ex: Pago via PIX no dia 25/05 — comprovante em anexo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.valor_pago || !form.data_pagamento}
            className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? '⏳ Registrando...' : '✅ Confirmar Baixa'}
          </button>
        </div>
      </div>
    </div>
  );
}
