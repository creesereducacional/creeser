import { getStatus } from './StatusBadge';

const STEPS = [
  { key: 'PRE_CADASTRO',                   label: 'Pré-Cadastro',       icon: '📋' },
  { key: 'AGUARDANDO_PAGAMENTO_MATRICULA', label: 'Aguard. Pagamento',  icon: '💳' },
  { key: 'AGUARDANDO_FORMACAO_TURMA',      label: 'Aguard. Turma',      icon: '🏫' },
  { key: 'ATIVO',                          label: 'Ativo',              icon: '✅' },
];

export default function TimelineStatus({ status }) {
  const cfg   = getStatus(status);
  const step  = cfg.step ?? 0;
  const isOut = step < 0; // Desistente / Cancelado

  return (
    <div className="w-full">
      {isOut ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-xl">{cfg.icon}</span>
          <div>
            <p className="text-sm font-semibold text-red-700">{cfg.label}</p>
            <p className="text-xs text-red-500">Matrícula encerrada</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done    = i < step;
            const current = i === step;
            const future  = i > step;
            return (
              <div key={s.key} className="flex items-center flex-1 min-w-0">
                {/* Nó */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                      ${done    ? 'bg-green-500 border-green-500 text-white' : ''}
                      ${current ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-4 ring-blue-100' : ''}
                      ${future  ? 'bg-gray-100 border-gray-200 text-gray-400' : ''}
                    `}
                  >
                    {done ? '✓' : s.icon}
                  </div>
                  <span
                    className={`text-xs mt-1 text-center leading-tight max-w-[60px] hidden sm:block
                      ${done    ? 'text-green-600 font-medium' : ''}
                      ${current ? 'text-blue-700 font-semibold' : ''}
                      ${future  ? 'text-gray-400' : ''}
                    `}
                  >
                    {s.label}
                  </span>
                </div>
                {/* Conector */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mt-[-1rem] sm:mt-[-1.25rem]
                      ${i < step ? 'bg-green-400' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
