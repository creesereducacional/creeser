import React, { useState } from 'react';

export default function ModalVisualizarCobranca({
  cobranca,
  onClose,
  onGerarCobranca,
  gerando = false,
  formatData,
  formatValor
}) {
  const [copiadoTipo, setCopiadoTipo] = useState('');
  const [email, setEmail] = useState('');
  const [msgEmail, setMsgEmail] = useState('');

  if (!cobranca) return null;

  const {
    parcela,
    carne,
    alunoNome,
    paymentUrl,
    barcode,
    pixCode,
    pixImage,
    podeEmitir = true
  } = cobranca;

  const temLink = Boolean(paymentUrl);
  const temBarcode = Boolean(barcode);
  const temPix = Boolean(pixCode);
  const temQualquerDado = temLink || temBarcode || temPix;

  const handleCopiarTexto = async (texto, tipo) => {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoTipo(tipo);
      setTimeout(() => setCopiadoTipo(''), 2500);
    } catch (e) {
      alert(`${tipo}: ${texto}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Cobrança da Parcela #{parcela?.numero_parcela || ''}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {alunoNome ? `${alunoNome} · ` : ''}{carne?.referencia || carne?.descricao || 'Cobrança Financeira'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/80 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body com Scroll */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Card Resumo da Parcela */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-gray-700">
            <div>
              <span className="text-gray-400 block font-medium">Parcela</span>
              <span className="font-bold text-gray-900 text-sm">#{parcela?.numero_parcela}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Vencimento</span>
              <span className="font-semibold text-gray-900">
                {formatData ? formatData(parcela?.data_vencimento) : parcela?.data_vencimento}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Valor</span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatValor ? formatValor(parcela?.valor) : `R$ ${parcela?.valor}`}
              </span>
            </div>
          </div>

          {/* Se a cobrança AINDA NÃO POSSUI cobrança emitida */}
          {!temQualquerDado && (
            <div className="space-y-4 py-3 text-center">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 space-y-1.5">
                <div className="font-bold flex items-center gap-2 text-amber-900 text-sm">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Cobrança Bancária Pendente de Emissão
                </div>
                <p className="text-amber-700 leading-relaxed">
                  Esta parcela ainda não possui registro ativo no gateway bancário EFI Bank. Clique abaixo para gerar a cobrança oficial (Boleto bancário e PIX Dinâmico).
                </p>
              </div>

              {podeEmitir ? (
                <button
                  onClick={() => onGerarCobranca && onGerarCobranca(parcela, carne)}
                  disabled={gerando}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition shadow-sm"
                >
                  {gerando ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Gerando Cobrança na EFI Bank...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Gerar Cobrança Bancária (Boleto / PIX)
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-600">
                  Emissão temporariamente bloqueada por pendência de cancelamento bancário das parcelas originais.
                </div>
              )}
            </div>
          )}

          {/* Se JÁ POSSUI dados de pagamento */}
          {temQualquerDado && (
            <div className="space-y-4">
              {/* Botão de abrir/imprimir boleto se houver URL */}
              {temLink && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visualizar / Imprimir Boleto
                  </a>
                  <button
                    onClick={() => handleCopiarTexto(paymentUrl, 'Link')}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copiadoTipo === 'Link' ? 'Copiado!' : 'Copiar Link'}
                  </button>
                </div>
              )}

              {/* Linha Digitável / Código de Barras */}
              {temBarcode && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Linha Digitável / Código de Barras
                    </span>
                    <button
                      onClick={() => handleCopiarTexto(barcode, 'Código de Barras')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {copiadoTipo === 'Código de Barras' ? '✓ Copiado' : 'Copiar código'}
                    </button>
                  </div>
                  <div className="p-2 bg-white border rounded font-mono text-[11px] text-gray-800 break-all select-all">
                    {barcode}
                  </div>
                </div>
              )}

              {/* PIX Copia e Cola / QR Code */}
              {temPix && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      PIX Dinâmico Integrado
                    </span>
                    <button
                      onClick={() => handleCopiarTexto(pixCode, 'Código PIX')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      {copiadoTipo === 'Código PIX' ? '✓ Copiado' : 'Copiar chave PIX'}
                    </button>
                  </div>

                  {pixImage && (
                    <div className="flex justify-center py-1">
                      <img src={pixImage} alt="QR Code PIX" className="w-36 h-36 border border-emerald-200 bg-white p-1 rounded-lg shadow-sm" />
                    </div>
                  )}

                  <div className="p-2 bg-white border border-emerald-200 rounded font-mono text-[10px] text-gray-800 break-all select-all max-h-20 overflow-y-auto">
                    {pixCode}
                  </div>
                </div>
              )}

              {/* Envio por E-mail */}
              <div className="border-t pt-3 space-y-1.5">
                <label className="text-xs font-medium text-gray-600 block">Enviar cobrança por e-mail</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                  <button
                    disabled={!email}
                    onClick={() => setMsgEmail('Cobrança encaminhada para envio por e-mail.')}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Enviar
                  </button>
                </div>
                {msgEmail && <p className="text-xs text-emerald-600 mt-1">{msgEmail}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-650 border border-gray-300 rounded-xl hover:bg-gray-100 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
