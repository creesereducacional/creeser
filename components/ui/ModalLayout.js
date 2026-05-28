/**
 * ModalLayout — Design System CREESER
 * Modal padronizado com overlay, header semântico, footer, animação e responsividade.
 */

import { useEffect } from 'react';

const SIZES = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl':'max-w-2xl',
  full: 'max-w-full mx-4',
};

const HEADER_VARIANTS = {
  default: 'bg-gray-50  border-b border-gray-200',
  success: 'bg-green-600 text-white',
  danger:  'bg-red-600   text-white',
  warning: 'bg-amber-500 text-white',
  info:    'bg-blue-600  text-white',
  teal:    'bg-teal-600  text-white',
};

export default function ModalLayout({
  open,
  onClose,
  title,
  subtitle,
  icon,
  headerVariant = 'default',
  size = 'md',
  footer,
  children,
  closeOnOverlay = true,
}) {
  // Fecha com Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Trava scroll do body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const isColoredHeader = headerVariant !== 'default';
  const headerCls = HEADER_VARIANTS[headerVariant] || HEADER_VARIANTS.default;
  const sizeCls   = SIZES[size] || SIZES.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-2xl w-full ${sizeCls}
          flex flex-col max-h-[90vh] overflow-hidden
          animate-in fade-in zoom-in-95 duration-150
        `.trim()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-3 px-6 py-4 flex-shrink-0 ${headerCls}`}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className={`text-2xl flex-shrink-0 ${isColoredHeader ? 'text-white/90' : ''}`}>
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className={`font-bold text-base leading-tight ${isColoredHeader ? 'text-white' : 'text-gray-800'}`}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className={`text-sm mt-0.5 ${isColoredHeader ? 'text-white/80' : 'text-gray-500'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg
              transition-colors
              ${isColoredHeader
                ? 'text-white/80 hover:bg-white/20 hover:text-white'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}
            `.trim()}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
