import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  LoginResponse,
  refreshAuthSession,
  saveAuthSession,
  UNAUTHORIZED_EVENT,
} from "@/lib/api";
import { AUTH_BYPASS, DEMO_MODE, DEMO_USER } from "@/lib/demo";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (session: LoginResponse) => void;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, isAdmin: false, loading: true, login: () => {}, signOut: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
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

  const isExpired = (decoded: { exp?: number } | null) => {
    if (!decoded?.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  };

  const buildUser = (token: string): User | null => {
    const decoded = parseToken(token);
    if (!decoded || isExpired(decoded)) return null;

    return {
      id: decoded?.sub || decoded?.id || "admin",
      email: decoded?.email || "admin@test.com",
      role: decoded?.role || "admin",
    };
  };

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (AUTH_BYPASS) {
        setUser(DEMO_USER);
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      const token = getStoredAccessToken();
      const restoredUser = token ? buildUser(token) : null;

      if (restoredUser) {
        if (!active) return;
        setUser(restoredUser);
        setIsAdmin(restoredUser.role === "admin");
        setLoading(false);
        return;
      }

      if (getStoredRefreshToken()) {
        try {
          const refreshedToken = await refreshAuthSession();
          const refreshedUser = buildUser(refreshedToken);

          if (refreshedUser) {
            if (!active) return;
            setUser(refreshedUser);
            setIsAdmin(refreshedUser.role === "admin");
            setLoading(false);
            return;
          }
        } catch {
          // Invalid refresh sessions are cleared below.
        }
      }

      clearAuthSession();
      if (!active) return;
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (AUTH_BYPASS) return;

      clearAuthSession();
      setUser(null);
      setIsAdmin(false);
      navigate("/admin/login", { replace: true });
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate]);

  const login = (session: LoginResponse, remember: boolean = true) => {
    if (AUTH_BYPASS) {
      setUser(DEMO_USER);
      setIsAdmin(true);
      return;
    }

    const accessToken = session.accessToken ?? session.token;

    if (!accessToken || !session.refreshToken) {
      clearAuthSession();
      throw new Error("Session invalide");
    }

    saveAuthSession({ accessToken, refreshToken: session.refreshToken }, remember);
    const loggedUser = buildUser(accessToken);
    if (!loggedUser) {
      clearAuthSession();
      throw new Error("Token invalide ou expire");
    }

    setUser(loggedUser);
    setIsAdmin(loggedUser.role === "admin");
  };

  const signOut = async () => {
    if (AUTH_BYPASS) {
      setUser(DEMO_USER);
      setIsAdmin(true);
      return;
    }

    try {
      await api.logout();
    } catch {
      // ignore logout errors; clear session locally anyway
    }

    clearAuthSession();
    setUser(null);
    setIsAdmin(false);
  };

  return <Ctx.Provider value={{ user, isAdmin, loading, login, signOut }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
