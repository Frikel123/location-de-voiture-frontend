"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: AuthUser;
};

type AuthUser = {
  id?: string | number;
  email?: string;
  role?: string;
};

type TokenPayload = {
  sub?: string | number;
  id?: string | number;
  email?: string;
  role?: string;
  exp?: number;
};

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const LEGACY_TOKEN_KEY = "token";
const AUTH_USER_KEY = "authUser";

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "");

const getApiBaseUrl = () =>
  trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "",
  );

const getLoginEndpoint = () => {
  const apiBaseUrl = getApiBaseUrl();
  return apiBaseUrl ? `${apiBaseUrl}/api/login` : "/api/login";
};

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

const isExpired = (payload: TokenPayload | null) => {
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
};

const getUserFromToken = (token: string): AuthUser | null => {
  const payload = parseToken(token);
  if (!payload || isExpired(payload)) return null;

  return {
    id: payload.sub || payload.id || "admin",
    email: payload.email || "admin@n1-lux-cars.ma",
    role: payload.role || "admin",
  };
};

const saveCookie = (name: string, value: string, remember: boolean) => {
  const maxAge = remember ? "; max-age=604800" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; sameSite=lax${maxAge}`;
};

const saveSession = (session: LoginResponse, remember: boolean) => {
  const accessToken = session.accessToken || session.token;

  if (!accessToken || !session.refreshToken) {
    throw new Error("Session invalide");
  }

  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  const user = session.user || getUserFromToken(accessToken);

  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  storage.setItem(LEGACY_TOKEN_KEY, accessToken);
  if (user) storage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  otherStorage.removeItem(ACCESS_TOKEN_KEY);
  otherStorage.removeItem(REFRESH_TOKEN_KEY);
  otherStorage.removeItem(LEGACY_TOKEN_KEY);
  otherStorage.removeItem(AUTH_USER_KEY);

  saveCookie(ACCESS_TOKEN_KEY, accessToken, remember);
  saveCookie(REFRESH_TOKEN_KEY, session.refreshToken, remember);
};

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/admin/dashboard",
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token =
      window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
      window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
      window.localStorage.getItem(LEGACY_TOKEN_KEY) ||
      window.sessionStorage.getItem(LEGACY_TOKEN_KEY);

    if (token && getUserFromToken(token)) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getLoginEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => null)) as LoginResponse | { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message || "Email ou mot de passe invalide");
      }

      saveSession(data as LoginResponse, rememberMe);
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="rounded-2xl bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20 dark:border dark:border-white/10 dark:bg-slate-900 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            Espace administrateur
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Connexion N1 Lux Cars
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Accedez au tableau de bord pour gerer les voitures, reservations,
            contrats, clients et parametres de votre agence.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Session securisee</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Persistance active</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Routes protegees</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900 sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
              Login
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Bienvenue</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Entrez vos identifiants administrateur.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@n1-lux-cars.ma"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/10 dark:bg-slate-950"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-600 dark:text-amber-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="************"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/10 dark:bg-slate-950"
                required
              />
            </div>

            <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                />
                Se souvenir de moi
              </label>
              <span>Connexion securisee</span>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
