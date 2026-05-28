import '../styles/globals.css';
import CookieBanner from '../components/CookieBanner';
import { SidebarProvider } from '../context/SidebarContext';
import { ToastProvider } from '../context/ToastContext';

function MyApp({ Component, pageProps }) {
  return (
    <SidebarProvider>
      <ToastProvider>
        <Component {...pageProps} />
        <CookieBanner />
      </ToastProvider>
    </SidebarProvider>
  );
}

export default MyApp;
