import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  LoginResponse,
  refreshAuthSession,
  saveAuthSession,
  UNAUTHORIZED_EVENT,
} from "@/lib/api";
import { AUTH_BYPASS, DEMO_USER } from "@/lib/demo";

interface User {
  id: string;
  email: string;
  role: string;
}

type TokenPayload = {
  sub?: string | number;
  id?: string | number;
  email?: string;
  role?: string;
  exp?: number;
};

interface AuthCtx {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (session: LoginResponse, remember?: boolean) => void;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  token: null,
  isAdmin: false,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: async () => {},
  signOut: async () => {},
});

const parseToken = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(""),
    );
    return JSON.parse(jsonPayload) as TokenPayload;
  } catch {
    return null;
  }
};

const isExpired = (decoded: TokenPayload | null) => {
  if (!decoded?.exp) return false;
  return decoded.exp * 1000 <= Date.now();
};

const buildUser = (token: string): User | null => {
  const decoded = parseToken(token);
  if (!decoded || isExpired(decoded)) return null;

  return {
    id: String(decoded.sub || decoded.id || "admin"),
    email: decoded.email || "admin@test.com",
    role: decoded.role || "admin",
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (AUTH_BYPASS) {
        setUser(DEMO_USER);
        setToken("demo-token");
        setIsAdmin(true);
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
            setToken(refreshedToken);
            setIsAdmin(refreshedUser.role === "admin");
            setLoading(false);
            return;
          }
        } catch {
          // Invalid refresh sessions are cleared below.
        }
      }

      const token = getStoredAccessToken();
      const restoredUser = token ? buildUser(token) : null;

      if (restoredUser) {
        if (!active) return;
        setUser(restoredUser);
        setToken(token);
        setIsAdmin(restoredUser.role === "admin");
        setLoading(false);
        return;
      }

      clearAuthSession();
      if (!active) return;
      setUser(null);
      setToken(null);
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
      setToken(null);
      setIsAdmin(false);
      navigate("/admin/login", { replace: true });
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate]);

  const login = (session: LoginResponse, remember: boolean = true) => {
    if (AUTH_BYPASS) {
      setUser(DEMO_USER);
      setToken("demo-token");
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
    setToken(accessToken);
    setIsAdmin(loggedUser.role === "admin");
  };

  const logout = async () => {
    if (AUTH_BYPASS) {
      setUser(DEMO_USER);
      setToken("demo-token");
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
    setToken(null);
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        token,
        isAdmin,
        isAuthenticated: Boolean(user && token),
        loading,
        login,
        logout,
        signOut: logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
