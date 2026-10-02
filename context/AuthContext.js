import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";

const AuthContext = createContext({
  usuario: null,
  carregando: true,
  atualizarUsuario: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const uStr = localStorage.getItem("usuario");
        if (uStr) return JSON.parse(uStr);
      } catch (e) {}
    }
    return null;
  });
  const [carregando, setCarregando] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const uStr = localStorage.getItem("usuario");
        if (uStr) return false;
      } catch (e) {}
    }
    return true;
  });

  // Revalida em background com /api/auth/me uma única vez
  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("não autenticado");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const user = data.usuario || data;
        setUsuario(user);
        try {
          localStorage.setItem("usuario", JSON.stringify(user));
        } catch (e) {}
        setCarregando(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Se a rota não for pública e falhou a autenticação
        setCarregando(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const atualizarUsuario = (novoUsuario) => {
    setUsuario(novoUsuario);
    if (novoUsuario) {
      try {
        localStorage.setItem("usuario", JSON.stringify(novoUsuario));
      } catch (e) {}
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    } finally {
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
      setUsuario(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, atualizarUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
