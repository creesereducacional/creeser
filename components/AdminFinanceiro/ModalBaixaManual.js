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
  
  const [usarMultiplosMetodos, setUsarMultiplosMetodos] = useState(false);
  const [listaPagamentos, setListaPagamentos] = useState([
    { metodo: 'pix', valor: '' }
  ]);
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const [erroSoma, setErroSoma] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const somaMultiplosValores = listaPagamentos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  const handleAddMetodo = () => {
    setListaPagamentos(prev => [...prev, { metodo: 'pix', valor: '' }]);
  };

  const handleRemoveMetodo = (idx) => {
    setListaPagamentos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleChangeMetodo = (idx, field, val) => {
    setListaPagamentos(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      valor_pago: usarMultiplosMetodos ? Number(somaMultiplosValores.toFixed(2)) : Number(form.valor_pago),
      data_pagamento: form.data_pagamento,
      observacao: form.observacao,
    };

    if (usarMultiplosMetodos) {
      payload.pagamentos = listaPagamentos.map(p => ({
        metodo: p.metodo,
        valor: Number(Number(p.valor).toFixed(2))
      }));
      payload.metodo_pagamento = 'multiplo';
    } else {
      payload.metodo_pagamento = form.metodo_pagamento;
    }

    onConfirm(payload);
  };

  const handleAvancar = (e) => {
    e.preventDefault();
    
    if (usarMultiplosMetodos) {
      const valorTotalEsperado = Number(form.valor_pago);
      if (Math.abs(somaMultiplosValores - valorTotalEsperado) > 0.01) {
        setErroSoma(`A soma dos métodos (${fmtBRL(somaMultiplosValores)}) não fecha com o valor total informado (${fmtBRL(valorTotalEsperado)})`);
        return;
      }
    }
    
    setErroSoma('');
    setMostrarResumo(true);
  };

  const valorInformado = usarMultiplosMetodos ? somaMultiplosValores : Number(form.valor_pago);
  const diferenca = Number((valorInformado - Number(parcela?.valor || 0)).toFixed(2));

  const getValorMetodo = (metodo) => {
    if (usarMultiplosMetodos) {
      return listaPagamentos
        .filter(p => p.metodo === metodo)
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    } else {
      return form.metodo_pagamento === metodo ? Number(form.valor_pago) : 0;
    }
  };

  const metodosExibir = [
    { label: 'PIX', val: getValorMetodo('pix') },
    { label: 'Dinheiro', val: getValorMetodo('dinheiro') },
    { label: 'Cartão', val: getValorMetodo('cartao') },
    { label: 'Transferência', val: getValorMetodo('transferencia') },
    { label: 'Cheque', val: getValorMetodo('cheque') },
    { label: 'Outro', val: getValorMetodo('outro') }
  ];

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
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-650 disabled:opacity-40 text-xl leading-none">&times;</button>
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
            
            {/* Toggle divido */}
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <input type="checkbox" id="split-payment" checked={usarMultiplosMetodos} onChange={e => {
                setUsarMultiplosMetodos(e.target.checked);
                if (e.target.checked && listaPagamentos.length === 1 && listaPagamentos[0].valor === '') {
                  setListaPagamentos([{ metodo: 'pix', valor: form.valor_pago }]);
                }
              }} className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer" />
              <label htmlFor="split-payment" className="text-xs font-semibold text-gray-700 select-none cursor-pointer">
                Dividir pagamento (Múltiplos métodos)
              </label>
            </div>

            {!usarMultiplosMetodos && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Método de pagamento <span className="text-red-500">*</span>
                </label>
                <select value={form.metodo_pagamento} onChange={e => set('metodo_pagamento', e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm bg-white">
                  {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Valor esperado
                </label>
                <p className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                  {fmtBRL(parcela?.valor)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Valor recebido (R$) <span className="text-red-500">*</span>
                </label>
                <input type="number" min="0.01" step="0.01" value={form.valor_pago}
                  onChange={e => set('valor_pago', e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm font-medium" />
              </div>
            </div>

            {/* Split payments section */}
            {usarMultiplosMetodos && (
              <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-250">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Métodos e Valores</span>
                  <button type="button" onClick={handleAddMetodo} className="text-xs text-teal-600 hover:text-teal-700 font-bold">
                    ➕ Adicionar método
                  </button>
                </div>
                
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {listaPagamentos.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select value={item.metodo} onChange={e => handleChangeMetodo(idx, 'metodo', e.target.value)}
                        className="flex-grow px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none">
                        {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <input type="number" min="0.01" step="0.01" placeholder="Valor" value={item.valor}
                        onChange={e => handleChangeMetodo(idx, 'valor', e.target.value)} required
                        className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none" />
                      {listaPagamentos.length > 1 && (
                        <button type="button" onClick={() => handleRemoveMetodo(idx)} className="text-red-500 hover:text-red-700 text-lg font-bold px-1.5">
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-xs font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-550">Soma: {fmtBRL(somaMultiplosValores)}</span>
                  <span className={Math.abs(somaMultiplosValores - Number(form.valor_pago)) <= 0.01 ? 'text-green-700' : 'text-red-600'}>
                    Total esperado: {fmtBRL(form.valor_pago)}
                  </span>
                </div>
                {erroSoma && <p className="text-xs text-red-500 font-semibold">{erroSoma}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Data do pagamento <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.data_pagamento} onChange={e => set('data_pagamento', e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm font-medium" />
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
              <button type="submit" disabled={!form.valor_pago || !form.data_pagamento || (usarMultiplosMetodos && Math.abs(somaMultiplosValores - Number(form.valor_pago)) > 0.01)}
                className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition disabled:opacity-50">
                Revisar →
              </button>
            </div>
          </form>
        ) : (
          /* ── Resumo de confirmação ──────────────── */
          <div className="px-6 py-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Resumo Financeiro da Baixa</h4>
            
            <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-100 text-sm overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-gray-400 text-xs">Valor da Parcela</span>
                <span className="text-gray-800 font-bold font-mono">{fmtBRL(parcela?.valor)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-gray-400 text-xs">Valor Informado</span>
                <span className="text-gray-800 font-bold font-mono">{fmtBRL(valorInformado)}</span>
              </div>
              
              <div className="px-4 py-2.5 bg-white space-y-1">
                <span className="text-gray-450 text-[10px] uppercase font-bold tracking-wide block mb-1">Métodos Lançados</span>
                {metodosExibir.map((m, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600 font-mono">
                    <span>{m.label}</span>
                    <span>{fmtBRL(m.val)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-gray-400 text-xs">Total Informado</span>
                <span className="text-gray-800 font-bold font-mono">{fmtBRL(valorInformado)}</span>
              </div>

              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-gray-400 text-xs">Diferença</span>
                <span className={`font-bold font-mono ${diferenca !== 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {fmtBRL(diferenca)}
                </span>
              </div>

              <div className="flex items-baseline gap-2 px-4 py-2.5 text-xs text-gray-500">
                <span className="text-gray-400">Data e Obs.</span>
                <span className="font-medium truncate">
                  {new Date(form.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')}
                  {form.observacao ? ` · ${form.observacao}` : ''}
                </span>
              </div>
            </div>

            {diferenca !== 0 && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                ⚠️ A diferença deve ser exatamente R$ 0,00 para confirmar. Ajuste o valor recebido ou os métodos de pagamento.
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setMostrarResumo(false)} disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm text-gray-650 border border-gray-300 rounded-xl hover:bg-gray-100 transition disabled:opacity-40">
                ← Editar
              </button>
              <button onClick={handleSubmit} disabled={loading || diferenca !== 0}
                className="flex-1 px-5 py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? '⏳ Registrando...' : '✅ Confirmar Baixa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
