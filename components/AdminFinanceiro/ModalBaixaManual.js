import { useState } from 'react';

const METODOS = [
  { value: 'pix',          label: 'PIX' },
  { value: 'dinheiro',     label: 'Dinheiro' },
  { value: 'transferencia',label: 'Transferência Bancária' },
  { value: 'cartao',       label: 'Cartão' },
  { value: 'cheque',       label: 'Cheque' },
  { value: 'outro',        label: 'Outro' },
];

const METODO_LABEL = Object.fromEntries(METODOS.map(m => [m.value, m.label]));

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const today = () => new Date().toISOString().split('T')[0];

export default function ModalBaixaManual({ parcela, numeroParcela, alunoNome, onConfirm, onClose, loading }) {
  const [form, setForm] = useState({
    metodo_pagamento: 'pix',
    valor_pago: parcela?.valor != null ? String(parcela.valor) : '',
    data_pagamento: today(),
    observacao: '',
  });
  const [mostrarResumo, setMostrarResumo] = useState(false);

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

  const handleAvancar = (e) => {
    e.preventDefault();
    setMostrarResumo(true);
  };

  const temBoletoEfi = Boolean(parcela?.efi_charge_id);
  const diffValor = Number(form.valor_pago) - Number(parcela?.valor || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-base font-bold text-gray-800">Baixar Manualmente</h3>
            {numeroParcela != null && (
              <p className="text-xs text-gray-500 mt-0.5">Parcela {numeroParcela}{alunoNome ? ` · ${alunoNome}` : ''}</p>
            )}
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 disabled:opacity-40 text-xl leading-none">&times;</button>
        </div>

        {/* ── Aviso EFI ─────────────────────────────── */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 items-start p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <span className="text-lg leading-none flex-shrink-0">⚠️</span>
            <span>Esta baixa <strong>não cancela automaticamente boleto EFI</strong> existente. Cancele o boleto no painel EFI separadamente, se necessário.</span>
          </div>
        </div>

        {!mostrarResumo ? (
          /* ── Formulário ──────────────────────────── */
          <form onSubmit={handleAvancar} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Método de pagamento <span className="text-red-500">*</span>
              </label>
              <select value={form.metodo_pagamento} onChange={e => set('metodo_pagamento', e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm">
                {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Valor esperado
                </label>
                <p className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
                  {fmtBRL(parcela?.valor)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Valor recebido (R$) <span className="text-red-500">*</span>
                </label>
                <input type="number" min="0.01" step="0.01" value={form.valor_pago}
                  onChange={e => set('valor_pago', e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Data do pagamento <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.data_pagamento} onChange={e => set('data_pagamento', e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Observação <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea value={form.observacao} onChange={e => set('observacao', e.target.value)} rows={2} maxLength={500}
                placeholder="Ex: Pago via PIX no dia 25/05 — comprovante em anexo"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={loading}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100 transition disabled:opacity-40">
                Cancelar
              </button>
              <button type="submit" disabled={!form.valor_pago || !form.data_pagamento}
                className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition disabled:opacity-50">
                Revisar →
              </button>
            </div>
          </form>
        ) : (
          /* ── Resumo de confirmação ──────────────── */
          <div className="px-6 py-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Resumo da Baixa</h4>
            <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-100 text-sm overflow-hidden">
              {[
                { label: 'Aluno',            val: alunoNome || '—' },
                { label: 'Parcela',          val: numeroParcela != null ? `Nº ${numeroParcela}` : '—' },
                { label: 'Valor esperado',   val: fmtBRL(parcela?.valor) },
                { label: 'Valor informado',  val: <span className={`font-bold ${diffValor < 0 ? 'text-red-600' : diffValor > 0 ? 'text-blue-600' : 'text-green-700'}`}>{fmtBRL(form.valor_pago)}{diffValor !== 0 && ` (${diffValor > 0 ? '+' : ''}${fmtBRL(diffValor)})`}</span> },
                { label: 'Método',           val: METODO_LABEL[form.metodo_pagamento] },
                { label: 'Data',             val: new Date(form.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR') },
                form.observacao ? { label: 'Obs.', val: form.observacao } : null,
              ].filter(Boolean).map(item => (
                <div key={item.label} className="flex items-baseline gap-2 px-4 py-2.5">
                  <span className="text-gray-400 w-28 flex-shrink-0 text-xs">{item.label}</span>
                  <span className="text-gray-800 font-medium">{item.val}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setMostrarResumo(false)} disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100 transition disabled:opacity-40">
                ← Editar
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 px-5 py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50">
                {loading ? '⏳ Registrando...' : '✅ Confirmar Baixa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
