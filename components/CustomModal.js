export default function CustomModal({ isOpen, title, message, type = 'success', onClose }) {
  if (!isOpen) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          gradient: 'from-emerald-500 to-teal-600',
          badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          titleColor: 'text-emerald-950',
          buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20',
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'error':
        return {
          gradient: 'from-rose-500 to-red-600',
          badgeBg: 'bg-rose-50 text-rose-600 border-rose-200',
          titleColor: 'text-rose-950',
          buttonBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-500/20',
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      case 'warning':
        return {
          gradient: 'from-amber-400 to-orange-500',
          badgeBg: 'bg-amber-50 text-amber-600 border-amber-200',
          titleColor: 'text-amber-950',
          buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20',
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'info':
      default:
        return {
          gradient: 'from-blue-500 to-teal-600',
          badgeBg: 'bg-blue-50 text-teal-600 border-blue-200',
          titleColor: 'text-slate-900',
          buttonBg: 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-teal-500/20',
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden transform transition-all animate-modal-scale relative">
        {/* Top Accent Line */}
        <div className={`h-2 bg-gradient-to-r ${config.gradient} w-full`} />

        <div className="p-6 text-center flex flex-col items-center">
          {/* Badge Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${config.badgeBg} mb-4 shadow-sm animate-bounce-subtle`}>
            {config.icon}
          </div>

          {/* Title */}
          {title && (
            <h3 className={`text-xl font-extrabold ${config.titleColor} mb-2 tracking-tight`}>
              {title}
            </h3>
          )}

          {/* Message */}
          <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
            {message}
          </p>

          {/* Action Button */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 px-6 ${config.buttonBg} font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
          >
            OK
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalScale {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-modal-scale {
          animation: modalScale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
