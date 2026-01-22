import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    console.log('[INDEX] Redirecionando para /login');
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-600 to-teal-800">
      <div className="text-center">
        <div className="mb-4 text-4xl animate-bounce">⏳</div>
        <p className="text-white text-lg">Carregando...</p>
      </div>
    </div>
  );
}
