/**
 * context/ToastContext.js
 * Infraestrutura global de notificações toast.
 *
 * Uso:
 *   import { useToast } from '@/context/ToastContext';
 *   const toast = useToast();
 *   toast.success('Salvo com sucesso!');
 *   toast.error('Erro ao salvar.', { duration: 6000 });
 *   toast.warning('Atenção: campo obrigatório.');
 *   toast.info('Processando...');
 */

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let _id = 0;

/**
 * @param {number} duration - ms até auto-dismiss (0 = permanente)
 */
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type, message, options = {}) => {
    const id = ++_id;
    const duration = options.duration ?? DEFAULT_DURATION;

    setToasts((prev) => [
      { id, type, message, duration },
      ...prev.slice(0, 4), // máximo 5 toasts simultâneos
    ]);

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  const api = {
    success: (msg, opts) => show('success', msg, opts),
    error:   (msg, opts) => show('error',   msg, opts),
    warning: (msg, opts) => show('warning', msg, opts),
    info:    (msg, opts) => show('info',    msg, opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

// ─── Toast Container (renderizado no body via Portal) ──────────────────────

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

const STYLES = {
  success: {
    bar:  'bg-green-500',
    icon: 'bg-green-100 text-green-700',
    bg:   'bg-white border-green-200',
    text: 'text-gray-800',
  },
  error: {
    bar:  'bg-red-500',
    icon: 'bg-red-100 text-red-700',
    bg:   'bg-white border-red-200',
    text: 'text-gray-800',
  },
  warning: {
    bar:  'bg-amber-500',
    icon: 'bg-amber-100 text-amber-700',
    bg:   'bg-white border-amber-200',
    text: 'text-gray-800',
  },
  info: {
    bar:  'bg-blue-500',
    icon: 'bg-blue-100 text-blue-700',
    bg:   'bg-white border-blue-200',
    text: 'text-gray-800',
  },
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="region"
      aria-label="Notificações"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((t) => {
        const s = STYLES[t.type] || STYLES.info;
        return (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-3.5 pr-4
              rounded-xl border shadow-lg ${s.bg}
              animate-in slide-in-from-right-5 fade-in duration-200
            `}
          >
            {/* Barra lateral colorida */}
            <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${s.bar}`} />

            {/* Ícone */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${s.icon}`}>
              {ICONS[t.type]}
            </div>

            {/* Mensagem */}
            <p className={`flex-1 text-sm leading-snug pt-0.5 ${s.text}`}>{t.message}</p>

            {/* Botão fechar */}
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Fechar notificação"
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5 transition-colors"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
