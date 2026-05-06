import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (token: string) => void;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, isAdmin: false, loading: true, login: () => {}, signOut: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const parseToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const buildUser = (token: string): User => {
    const decoded = parseToken(token);
    return {
      id: decoded?.sub || decoded?.id || "admin",
      email: decoded?.email || "admin@test.com",
      role: decoded?.role || "admin",
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const restoredUser = buildUser(token);
      setUser(restoredUser);
      setIsAdmin(restoredUser.role === "admin");
    }
    setLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const loggedUser = buildUser(token);
    setUser(loggedUser);
    setIsAdmin(loggedUser.role === "admin");
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAdmin(false);
  };

  return <Ctx.Provider value={{ user, isAdmin, loading, login, signOut }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
