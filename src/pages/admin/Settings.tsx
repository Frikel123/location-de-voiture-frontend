import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getStoredAccessToken } from "@/lib/api";
import { Bell, Building2, CheckCircle2, Globe2, LogOut, Moon, Save, ShieldCheck, Sun, UserRound } from "lucide-react";
import { toast } from "sonner";

type SettingsState = {
  companyName: string;
  phone: string;
  whatsapp: string;
  address: string;
  currency: string;
  language: string;
  emailNotifications: boolean;
  bookingAlerts: boolean;
  weeklyReport: boolean;
};

const storageKey = "nays-car-admin-settings";

const defaultSettings: SettingsState = {
  companyName: "NAYS CAR",
  phone: "+212 6 00 00 00 00",
  whatsapp: "+212 6 00 00 00 00",
  address: "Casablanca, Maroc",
  currency: "MAD",
  language: "fr",
  emailNotifications: true,
  bookingAlerts: true,
  weeklyReport: false,
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      setSettings({ ...defaultSettings, ...JSON.parse(saved) });
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, []);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem(storageKey, JSON.stringify(settings));
    toast.success("Parametres enregistres");
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
    toast.success("Parametres reinitialises");
  };

  const logout = () => {
    signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 rounded-full">Administration</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">Parametres</h2>
          <p className="mt-1 text-sm text-muted-foreground">Configurez l'identite, les preferences et la securite de l'espace admin.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings} className="rounded-2xl">Reset</Button>
          <Button onClick={saveSettings} className="rounded-2xl"><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1">
            <TabsTrigger value="company" className="rounded-xl">Societe</TabsTrigger>
            <TabsTrigger value="interface" className="rounded-xl">Interface</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-xl">Notifications</TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl">Securite</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Informations societe</CardTitle>
                  <CardDescription>Ces informations servent de reference pour l'administration.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nom societe" value={settings.companyName} onChange={(value) => update("companyName", value)} />
                    <Field label="Telephone" value={settings.phone} onChange={(value) => update("phone", value)} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="WhatsApp" value={settings.whatsapp} onChange={(value) => update("whatsapp", value)} />
                    <div className="space-y-2">
                      <Label>Devise</Label>
                      <Select value={settings.currency} onValueChange={(value) => update("currency", value)}>
                        <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MAD">MAD - Dirham</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="USD">USD - Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Adresse</Label>
                    <Textarea value={settings.address} onChange={(e) => update("address", e.target.value)} className="min-h-28 rounded-2xl" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="interface">
            <Card className="border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-primary" /> Preferences interface</CardTitle>
                <CardDescription>Theme, langue et confort visuel de l'admin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <button onClick={() => setTheme("light")} className={`rounded-3xl border p-5 text-left transition hover:bg-muted/50 ${theme === "light" ? "border-primary bg-primary/5" : ""}`}>
                    <Sun className="mb-4 h-6 w-6 text-primary" />
                    <p className="font-semibold">Light mode</p>
                    <p className="text-sm text-muted-foreground">Interface claire et lisible.</p>
                  </button>
                  <button onClick={() => setTheme("dark")} className={`rounded-3xl border p-5 text-left transition hover:bg-muted/50 ${theme === "dark" ? "border-primary bg-primary/5" : ""}`}>
                    <Moon className="mb-4 h-6 w-6 text-primary" />
                    <p className="font-semibold">Dark mode</p>
                    <p className="text-sm text-muted-foreground">Interface sombre premium.</p>
                  </button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Langue dashboard</Label>
                  <Select value={settings.language} onValueChange={(value) => update("language", value)}>
                    <SelectTrigger className="max-w-xs rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Francais</SelectItem>
                      <SelectItem value="ar">Arabe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notifications</CardTitle>
                <CardDescription>Choisissez les alertes utiles pour la gestion quotidienne.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow title="Notifications email" description="Recevoir les alertes importantes par email." checked={settings.emailNotifications} onCheckedChange={(value) => update("emailNotifications", value)} />
                <ToggleRow title="Nouvelles reservations" description="Afficher une alerte pour chaque nouvelle demande." checked={settings.bookingAlerts} onCheckedChange={(value) => update("bookingAlerts", value)} />
                <ToggleRow title="Rapport hebdomadaire" description="Recevoir un resume revenus/flotte chaque semaine." checked={settings.weeklyReport} onCheckedChange={(value) => update("weeklyReport", value)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Securite</CardTitle>
                <CardDescription>Etat du compte admin et session actuelle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Compte" value={user?.email ?? "admin@test.com"} />
                <InfoRow label="Role" value={user?.role ?? "admin"} />
                <InfoRow label="Token" value={getStoredAccessToken() ? "Session active" : "Aucune session"} />
                <Separator />
                <Button variant="destructive" onClick={logout} className="rounded-2xl"><LogOut className="mr-2 h-4 w-4" /> Deconnexion</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /> Profil admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-lg font-bold text-white">
                  {(user?.email ?? "AD").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user?.email ?? "Admin"}</p>
                  <p className="text-sm text-muted-foreground">Administrateur</p>
                </div>
              </div>
              <Separator />
              <InfoRow label="API" value={apiUrl} />
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Parametres locaux actifs
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-gradient-hero text-white shadow-card">
            <CardContent className="p-6">
              <p className="text-sm text-white/60">Identite active</p>
              <p className="mt-2 text-2xl font-semibold">{settings.companyName}</p>
              <p className="mt-3 text-sm text-white/70">{settings.address}</p>
              <p className="mt-6 text-sm font-medium">{settings.phone}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl" />
  </div>
);

const ToggleRow = ({ title, description, checked, onCheckedChange }: { title: string; description: string; checked: boolean; onCheckedChange: (value: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/25 p-4">
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="truncate font-medium">{value}</span>
  </div>
);

export default Settings;
