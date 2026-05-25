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
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-elegant border-border/60">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xl">
            N
          </div>
          <CardTitle>NAYS CAR Admin</CardTitle>
          <CardDescription>Connectez-vous a votre compte</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
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
