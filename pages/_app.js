import '../styles/globals.css';
import CookieBanner from '../components/CookieBanner';
import { SidebarProvider } from '../context/SidebarContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { PortalLayoutProvider } from '../context/PortalLayoutContext';
import { useRouter } from 'next/router';
import PortalLayout from '../components/portal/PortalLayout';
import DashboardLayout from '../components/DashboardLayout';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Identifica rotas do Portal Acadêmico (Aluno / Professor)
  const isPortalAluno = router.pathname.startsWith('/aluno/') || router.pathname === '/enviar-documentos';
  const isPortalProfessor = router.pathname.startsWith('/professor/');
  const isPortal = isPortalAluno || isPortalProfessor;
  const tipoRequerido = isPortalProfessor ? 'professor' : 'aluno';

  // Identifica rotas administrativas do Dashboard (excluindo páginas avulsas de impressão/documento se houver)
  const isExcludedAdminDoc = 
    router.pathname.startsWith('/admin/alunos/contrato/') ||
    router.pathname === '/admin/alunos/declaracao' ||
    router.pathname === '/admin/alunos/ficha' ||
    router.pathname === '/admin/alunos/historico';
  const isAdmin = router.pathname.startsWith('/admin') && !isExcludedAdminDoc;

  return (
    <AuthProvider>
      <PortalLayoutProvider>
        <SidebarProvider>
          <ToastProvider>
            {isPortal ? (
              <PortalLayout tipoRequerido={tipoRequerido}>
                <Component {...pageProps} />
              </PortalLayout>
            ) : isAdmin ? (
              <DashboardLayout>
                <Component {...pageProps} />
              </DashboardLayout>
            ) : Component.getLayout ? (
              Component.getLayout(<Component {...pageProps} />)
            ) : (
              <Component {...pageProps} />
            )}
            <CookieBanner />
          </ToastProvider>
        </SidebarProvider>
      </PortalLayoutProvider>
    </AuthProvider>
  );
}

export default MyApp;


