/**
 * Timeline — Design System CREESER
 * Timeline horizontal ou vertical de eventos/etapas.
 */

export default function Timeline({
  steps,
  // steps: [{ key, label, icon, done, error, date, description }]
  orientation = 'horizontal',
  className = '',
}) {
  if (!steps || steps.length === 0) return null;

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-0 ${className}`}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={step.key || i} className="flex gap-3">
              {/* Connector */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0
                  ${step.error ? 'bg-red-100 border-red-400 text-red-700' :
                    step.done  ? 'bg-green-100 border-green-400 text-green-700' :
                    'bg-gray-100 border-gray-300 text-gray-400'}
                `}>
                  {step.error ? '✗' : step.done ? '✓' : (step.icon || '·')}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 rounded-full ${step.done ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
              {/* Content */}
              <div className={`pb-5 min-w-0 ${isLast ? '' : ''}`}>
                <p className={`text-sm font-semibold leading-tight ${
                  step.error ? 'text-red-700' : step.done ? 'text-green-700' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
                )}
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className={`flex items-start ${className}`}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const nextDone = !isLast && steps[i + 1]?.done;
        return (
          <div key={step.key || i} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all
                ${step.error ? 'bg-red-100 border-red-400 text-red-700' :
                  step.done  ? 'bg-green-100 border-green-400 text-green-700' :
                  'bg-gray-100 border-gray-300 text-gray-400'}
              `}>
                {step.error ? '✗' : step.done ? '✓' : (step.icon || String(i + 1))}
              </div>
              <p className={`text-[10px] font-semibold mt-1 text-center leading-tight max-w-[60px] ${
                step.error ? 'text-red-600' : step.done ? 'text-green-700' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-[9px] text-gray-400 text-center mt-0.5">{step.date}</p>
              )}
            </div>
            {!isLast && (
              <div className={`
                h-0.5 flex-1 mx-1 mb-5 rounded-full
                ${(step.done && nextDone) ? 'bg-green-400' : step.done ? 'bg-green-200' : 'bg-gray-200'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}
