import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api, LoginResponse } from "@/lib/api";
import { AUTH_BYPASS } from "@/lib/demo";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, login } = useAuth();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (AUTH_BYPASS || isAuthenticated)) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const data = await api.post<LoginResponse>("/api/login", { email, password });

      if (!(data.accessToken ?? data.token) || !data.refreshToken) {
        throw new Error("Session invalide");
      }

      login(data, rememberMe);
      toast.success("Connecte avec succes");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de connexion";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_hsl(var(--accent)/0.24),_transparent_30%),hsl(var(--background))] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[1.25rem] border border-border/80 bg-card/95 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:shadow-black/30">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-gradient-hero p-10 text-white sm:p-12 lg:p-14">
              <div className="mb-8 flex items-center gap-3">
                <BrandLogo markClassName="h-12 w-12" textClassName="text-white text-2xl font-bold" />
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300/80">Espace administrateur</p>
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">Connectez-vous a N1 Lux Cars</h1>
                <p className="max-w-md text-base text-slate-300">
                  Accedez a votre tableau de bord, gerez les reservations, contrats et clients en toute securite.
                </p>
              </div>
              <div className="mt-10 rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-400 shadow-inner">
                <p className="font-medium text-slate-100">Conseils de securite</p>
                <ul className="mt-4 list-disc space-y-3 pl-5">
                  <li>Utilisez un mot de passe fort.</li>
                  <li>Activez la persistance si vous utilisez un appareil prive.</li>
                  <li>Deconnectez-vous apres usage sur un appareil partage.</li>
                </ul>
              </div>
            </div>

            <div className="bg-card p-8 sm:p-10">
              <div className="mb-8 rounded-2xl border border-border bg-secondary/50 p-6 shadow-sm">
                <div className="mb-3 text-sm uppercase tracking-[0.24em] text-muted-foreground">Connexion</div>
                <CardTitle className="text-2xl font-semibold">Bienvenue</CardTitle>
                <CardDescription className="mt-2">
                  Entrez vos identifiants pour continuer vers le panneau d'administration.
                </CardDescription>
              </div>

              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@votreserveur.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-2xl bg-background"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Mot de passe</Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="************"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 rounded-2xl bg-background"
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox checked={rememberMe} onCheckedChange={(value) => setRememberMe(Boolean(value))} />
                    Se souvenir de moi
                  </label>
                  <span className="text-sm text-muted-foreground">Connexion securisee</span>
                </div>

                {error && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl disabled:pointer-events-none disabled:opacity-60"
                  disabled={busy}
                >
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
