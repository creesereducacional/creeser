import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';

/**
 * Hook de autenticação que verifica a sessão via cookie (creeser_token)
 * e compartilha o estado globalmente via AuthContext.
 *
 * @param {object} options
 * @param {string[]} [options.tiposPermitidos]  - Tipos de usuário permitidos (ex: ['admin'])
 * @param {string}  [options.redirectTo]        - Para onde redirecionar se não autorizado (padrão: '/login')
 * @param {string}  [options.redirectIfUnauthorized]   - Para onde redirecionar se não autorizado
 *
 * @returns {{ usuario: object|null, carregando: boolean }}
 */
export function useAuth({ tiposPermitidos = [], redirectTo = '/login', redirectIfUnauthorized = '/dashboard' } = {}) {
  const router = useRouter();
  const context = useAuthContext();
  const [localUser, setLocalUser] = useState(context?.usuario || null);
  const [localCarregando, setLocalCarregando] = useState(context ? context.carregando : true);

  const usuario = context?.usuario !== undefined ? context.usuario : localUser;
  const carregando = context ? context.carregando : localCarregando;

  useEffect(() => {
    if (!usuario) {
      try {
        const uStr = localStorage.getItem('usuario');
        if (uStr) {
          const u = JSON.parse(uStr);
          setLocalUser(u);
        }
      } catch (e) {}
    }
  }, [usuario]);

  const tiposPermitidosKey = Array.isArray(tiposPermitidos) ? tiposPermitidos.join(',') : '';

  useEffect(() => {
    if (!carregando) {
      if (!usuario) {
        router.replace(redirectTo);
        return;
      }
      const allowed = tiposPermitidosKey ? tiposPermitidosKey.split(',') : [];
      if (allowed.length > 0 && !allowed.includes(usuario.tipo)) {
        router.replace(redirectIfUnauthorized);
      }
    }
  }, [carregando, usuario, redirectTo, redirectIfUnauthorized, tiposPermitidosKey]);

  return { usuario, carregando };
}

