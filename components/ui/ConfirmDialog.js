/**
 * ConfirmDialog — Design System CREESER
 * Diálogo de confirmação padronizado com variante semântica.
 */

import ModalLayout from './ModalLayout';
import ActionButton from './ActionButton';

const VARIANT_CONFIG = {
  danger:  { icon: '🗑️', headerVariant: 'danger',  confirmVariant: 'danger',  confirmLabel: 'Excluir' },
  warning: { icon: '⚠️',  headerVariant: 'warning', confirmVariant: 'warning', confirmLabel: 'Continuar' },
  success: { icon: '✅',  headerVariant: 'success', confirmVariant: 'success', confirmLabel: 'Confirmar' },
  info:    { icon: 'ℹ️',  headerVariant: 'info',    confirmVariant: 'primary', confirmLabel: 'Ok' },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  icon,
}) {
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;

  return (
    <ModalLayout
      open={open}
      onClose={onClose}
      title={title}
      icon={icon || cfg.icon}
      headerVariant={cfg.headerVariant}
      size="sm"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </ActionButton>
          <ActionButton
            variant={cfg.confirmVariant}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel || cfg.confirmLabel}
          </ActionButton>
        </>
      }
    >
      {description && (
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      )}
    </ModalLayout>
  );
}
