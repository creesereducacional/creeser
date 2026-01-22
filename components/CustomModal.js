export default function CustomModal({ isOpen, title, message, type = 'success', onClose }) {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          titleColor: 'text-green-800',
          iconColor: 'text-green-600',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          icon: '✅'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          titleColor: 'text-red-800',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          icon: '❌'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          titleColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          icon: '⚠️'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          titleColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          icon: 'ℹ️'
        };
      default:
        return {
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-300',
          titleColor: 'text-teal-800',
          iconColor: 'text-teal-600',
          buttonColor: 'bg-teal-600 hover:bg-teal-700',
          icon: '💬'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${styles.bgColor} border-l-4 ${styles.borderColor} rounded-lg shadow-2xl p-6 max-w-md w-full animate-slide-in`}>
        {/* Header com ícone */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`text-4xl ${styles.iconColor}`}>
            {styles.icon}
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${styles.titleColor}`}>
              {title}
            </h2>
          </div>
        </div>

        {/* Mensagem */}
        <p className="text-gray-700 text-sm mb-6 leading-relaxed">
          {message}
        </p>

        {/* Linha divisória */}
        <div className="h-px bg-gray-300 mb-6"></div>

        {/* Botão */}
        <button
          onClick={onClose}
          className={`w-full py-3 ${styles.buttonColor} text-white rounded-lg font-semibold transition duration-300 flex items-center justify-center gap-2`}
        >
          OK
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
