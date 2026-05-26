import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Hook de autenticação que verifica a sessão via cookie (creeser_token).
 *
 * @param {object} options
 * @param {string[]} [options.tiposPermitidos]  - Tipos de usuário permitidos (ex: ['admin'])
 * @param {string}  [options.redirectTo]        - Para onde redirecionar se não autorizado (padrão: '/login')
 * @param {string}  [options.redirectIfAdmin]   - Para onde redirecionar se não for admin (padrão: '/dashboard')
 *
 * @returns {{ usuario: object|null, carregando: boolean }}
 */
export function useAuth({ tiposPermitidos = [], redirectTo = '/login', redirectIfUnauthorized = '/dashboard' } = {}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('não autenticado');
        return res.json();
      })
      .then(({ usuario: user }) => {
        if (cancelled) return;

        if (tiposPermitidos.length > 0 && !tiposPermitidos.includes(user.tipo)) {
          router.replace(redirectIfUnauthorized);
          return;
        }

        setUsuario(user);
        setCarregando(false);
      })
      .catch(() => {
        if (cancelled) return;
        router.replace(redirectTo);
      });

    return () => { cancelled = true; };
  }, []);

  return { usuario, carregando };
}
