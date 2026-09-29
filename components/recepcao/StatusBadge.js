export const STATUS_CONFIG = {
  PRE_CADASTRO: {
    label: 'Pré-Cadastro',
    short: 'Pré-Cadastro',
    cor: 'bg-blue-50 text-blue-700 border-blue-200/70',
    dot: 'bg-blue-600',
    icon: '📋',
    step: 0,
  },
  AGUARDANDO_PAGAMENTO_MATRICULA: {
    label: 'Aguardando Pagamento',
    short: 'Ag. Pagamento',
    cor: 'bg-amber-50 text-amber-700 border-amber-200/70',
    dot: 'bg-amber-500',
    icon: '💳',
    step: 1,
  },
  AGUARDANDO_FORMACAO_TURMA: {
    label: 'Aguardando Formação',
    short: 'Ag. Turma',
    cor: 'bg-rose-50 text-rose-700 border-rose-200/70',
    dot: 'bg-rose-500',
    icon: '🏫',
    step: 2,
  },
  ATIVO: {
    label: 'Ativo',
    short: 'Ativo',
    cor: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    dot: 'bg-emerald-500',
    icon: '✅',
    step: 3,
  },
  DESISTENTE: {
    label: 'Desistente',
    short: 'Desistente',
    cor: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-500',
    icon: '❌',
    step: -1,
  },
  CANCELADO: {
    label: 'Cancelado',
    short: 'Cancelado',
    cor: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
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
