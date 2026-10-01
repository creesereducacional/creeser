import PortalLayout from "./portal/PortalLayout";

/**
 * ProfessorLayout adaptado para usar PortalLayout nativo do CREESER.
 * Mantém compatibilidade total com páginas existentes garantindo
 * segurança, useAuth, design acadêmico institucional e responsividade.
 */
export default function ProfessorLayout({ children, title = "Painel do Professor" }) {
  return (
    <PortalLayout title={title} tipoRequerido="professor">
      {children}
    </PortalLayout>
  );
}
