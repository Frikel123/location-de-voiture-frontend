import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, LoginResponse } from "@/lib/api";
import { AUTH_BYPASS } from "@/lib/demo";
import { BrandLogo } from "@/components/BrandLogo";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("123456");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (AUTH_BYPASS) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      const data = await api.post<LoginResponse>("/auth/login", { email, password });

      if (!data.accessToken || !data.refreshToken) {
        throw new Error("Token manquant");
      }

      login(data);
      toast.success("Connecte");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.22),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.08),transparent_24%)]" />
      <Card className="relative w-full max-w-md border-white/10 bg-white/[0.08] text-white shadow-elegant backdrop-blur-2xl">
        <CardHeader className="text-center">
          <BrandLogo className="mx-auto mb-3 justify-center" markClassName="h-20 w-20" textClassName="text-white text-left" />
          <CardTitle className="font-serif text-2xl gold-text">N1 Lux Cars Admin</CardTitle>
          <CardDescription className="text-white/65">Connectez-vous a votre compte premium</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full shadow-elegant" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
                className="border-white/10 bg-white/10 text-white"
                className="border-white/10 bg-white/10 text-white"
