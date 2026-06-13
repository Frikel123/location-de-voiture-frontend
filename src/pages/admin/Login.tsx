import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, LoginResponse } from "@/lib/api";
import { AUTH_BYPASS } from "@/lib/demo";
import { BrandLogo } from "@/components/BrandLogo";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (AUTH_BYPASS) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const data = await api.post<LoginResponse>("/auth/login", { email, password });

      if (!data.accessToken || !data.refreshToken) {
        throw new Error("Token manquant");
      }

      login(data, rememberMe);
      toast.success("Connecté avec succès");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de connexion";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-b-3xl bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_28%)] p-10 sm:p-12 lg:p-14">
              <div className="mb-8 flex items-center gap-3">
                <BrandLogo markClassName="h-12 w-12" textClassName="text-white text-2xl font-bold" />
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300/80">Espace administrateur</p>
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">Connectez-vous à N1 Lux Cars</h1>
                <p className="max-w-md text-base text-slate-300">
                  Accédez à votre tableau de bord, gérez les réservations, contrats et clients en toute sécurité.
                </p>
              </div>
              <div className="mt-10 rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-400 shadow-inner">
                <p className="font-medium text-slate-100">Conseils de sécurité</p>
                <ul className="mt-4 space-y-3 list-disc pl-5">
                  <li>Utilisez un mot de passe fort.</li>
                  <li>Activez la persistance si vous utilisez un appareil privé.</li>
                  <li>Déconnectez-vous après usage sur un appareil partagé.</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-950/95 p-8 sm:p-10">
              <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm">
                <div className="mb-3 text-sm uppercase tracking-[0.24em] text-slate-500">Connexion</div>
                <CardTitle className="text-2xl font-semibold text-white">Bienvenue</CardTitle>
                <CardDescription className="mt-2 text-slate-400">Entrez vos identifiants pour continuer vers le panneau d’administration.</CardDescription>
              </div>

              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-slate-300">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@votreserveur.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800 text-white"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password" className="text-slate-300">Mot de passe</Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-sm font-medium text-sky-300 hover:text-sky-200"
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800 text-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <Checkbox checked={rememberMe} onCheckedChange={(value) => setRememberMe(Boolean(value))} />
                    Se souvenir de moi
                  </label>
                  <span className="text-sm text-slate-500">Connexion sécurisée</span>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                )}

                <Button type="submit" className="flex w-full items-center justify-center gap-2 rounded-3xl bg-sky-500 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 disabled:pointer-events-none disabled:opacity-60" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {busy ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
