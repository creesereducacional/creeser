import React from 'react';

/**
 * Componente visual de campo de e-mail com validação em tempo real e feedback de unicidade.
 */
export default function CampoEmailValidado({
  email,
  onChange,
  onBlur,
  status,
  mensagemErro,
  disabled = false,
  required = false,
  placeholder = 'email@exemplo.com',
  className = '',
  label = 'E-mail',
  labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'
}) {
  const estaVerificando = status === 'checking';
  const estaDisponivel = status === 'available';
  const ehDuplicado = status === 'duplicate';
  const ehInvalido = status === 'invalid';
  const ehErroConsulta = status === 'error';

  // Classes de borda e fundo dinâmicas
  let inputBorderClass = 'border-slate-200 hover:border-slate-300 focus:border-[#009688] focus:ring-[#009688]/20';
  if (ehDuplicado || ehInvalido || ehErroConsulta) {
    inputBorderClass = 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-rose-200';
  } else if (estaDisponivel && email && email.trim()) {
    inputBorderClass = 'border-emerald-400 bg-emerald-50/30 text-emerald-950 focus:border-emerald-500 focus:ring-emerald-200';
  } else if (estaVerificando) {
    inputBorderClass = 'border-amber-300 bg-amber-50/20 focus:border-amber-400 focus:ring-amber-200';
  }

  const baseInputCls = 'w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 bg-white transition-all text-slate-800 placeholder:text-slate-400 pr-10';

  return (
    <div className="w-full">
      {label && (
        <label className={labelCls}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="email"
          name="email"
          value={email}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseInputCls} ${inputBorderClass} ${className}`}
        />

        {/* Ícone de status dentro do input */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm">
          {estaVerificando && (
            <svg
              className="animate-spin h-4 w-4 text-amber-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          )}

          {!estaVerificando && estaDisponivel && email && email.trim() && (
            <span className="text-emerald-600 font-bold text-sm" title="E-mail disponível">
              ✓
            </span>
          )}

          {!estaVerificando && (ehDuplicado || ehInvalido || ehErroConsulta) && (
            <span className="text-rose-500 font-bold text-sm" title="Erro no e-mail">
              ⚠️
            </span>
          )}
        </div>
      </div>

      {/* Mensagens de feedback imediato */}
      {estaVerificando && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 animate-pulse">
          <span>🔍</span>
          <span>Verificando disponibilidade do e-mail...</span>
        </p>
      )}

      {ehDuplicado && (
        <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
          <span>❌</span>
          <span>Este e-mail já está cadastrado. Informe outro e-mail.</span>
        </p>
      )}

      {ehInvalido && mensagemErro && (
        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
          <span>⚠️</span>
          <span>{mensagemErro}</span>
        </p>
      )}

      {ehErroConsulta && mensagemErro && (
        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
          <span>⚠️</span>
          <span>{mensagemErro}</span>
        </p>
      )}

      {!estaVerificando && estaDisponivel && email && email.trim() && (
        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
          <span>✅</span>
          <span>E-mail disponível para cadastro.</span>
        </p>
      )}
    </div>
  );
}
