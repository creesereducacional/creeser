export const STATUS_CONFIG = {
  PRE_CADASTRO: {
    label: 'Pré-Cadastro',
    short: 'Pré-Cadastro',
    cor: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
    icon: '📋',
    step: 0,
  },
  AGUARDANDO_PAGAMENTO_MATRICULA: {
    label: 'Aguardando Pagamento',
    short: 'Ag. Pagamento',
    cor: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    dot: 'bg-yellow-500',
    icon: '💳',
    step: 1,
  },
  AGUARDANDO_FORMACAO_TURMA: {
    label: 'Aguardando Formação',
    short: 'Ag. Turma',
    cor: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    icon: '🏫',
    step: 2,
  },
  ATIVO: {
    label: 'Ativo',
    short: 'Ativo',
    cor: 'bg-green-50 text-green-800 border-green-200',
    dot: 'bg-green-500',
    icon: '✅',
    step: 3,
  },
  DESISTENTE: {
    label: 'Desistente',
    short: 'Desistente',
    cor: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    icon: '❌',
    step: -1,
  },
  CANCELADO: {
    label: 'Cancelado',
    short: 'Cancelado',
    cor: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-400',
    icon: '🚫',
    step: -1,
  },
};

export function getStatus(status) {
  return (
    STATUS_CONFIG[status] || {
      label: status || '—',
      short: status || '—',
      cor: 'bg-gray-100 text-gray-600 border-gray-200',
      dot: 'bg-gray-300',
      icon: '?',
      step: 0,
    }
  );
}

export default function StatusBadge({ status, size = 'md' }) {
  const cfg = getStatus(status);
  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-1.5',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${cfg.cor} ${sizes[size] || sizes.md}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {size === 'sm' ? cfg.short : cfg.label}
    </span>
  );
}
