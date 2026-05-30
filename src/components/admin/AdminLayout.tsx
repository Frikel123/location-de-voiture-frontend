import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { DEMO_MODE } from "@/lib/demo";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/cars", label: "Voitures", icon: Car },
  { to: "/admin/bookings", label: "Reservations", icon: CalendarDays },
  { to: "/admin/contracts", label: "Contrats", icon: FileText },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/revenue", label: "Revenus", icon: CreditCard },
  { to: "/admin/settings", label: "Parametres", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Vue d'ensemble",
  "/admin/cars": "Gestion de flotte",
  "/admin/bookings": "Reservations",
  "/admin/contracts": "Contrats",
  "/admin/clients": "Clients",
  "/admin/revenue": "Revenus",
  "/admin/settings": "Parametres",
};

const notifications = [
  { title: "Reservation urgente", description: "2 clients attendent confirmation", time: "1m" },
  { title: "Nouveau profil client", description: "Une nouvelle inscription sur le site", time: "12m" },
  { title: "Mise a jour vehicule", description: "Maintenance planifiee pour 4 voitures", time: "1h" },
];

export const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { query, setQuery, clearQuery } = useAdminSearch();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const initials = useMemo(() => {
    const email = user?.email ?? "admin@atlascars.ma";
    return email.slice(0, 2).toUpperCase();
  }, [user?.email]);

  const handleSignOut = () => {
    signOut();
    navigate("/admin/login", { replace: true });
  };

  const currentTitle =
    pageTitles[location.pathname] ??
    (location.pathname.startsWith("/admin/contracts") ? "Contrats" : "Atlas Cars Admin");

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.replace(/^\//, "").split("/").filter(Boolean);
    return segments
      .filter((segment) => segment !== "admin")
      .map((segment, index, arr) => {
        const path = "/admin/" + arr.slice(0, index + 1).join("/");
        return { label: pageTitles[path] ?? segment, path };
      });
  }, [location.pathname]);

  const formattedDate = new Intl.DateTimeFormat("fr-MA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14)_0,_transparent_32%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14)_0,_transparent_28%),hsl(var(--background))] text-foreground">
      {open && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-slate-950/80 bg-[length:200%] bg-[top] p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-20" : "w-[18rem]"} ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-white shadow-xl shadow-cyan-500/20">
              AC
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-slate-950" />
            </div>
            {!collapsed ? (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Atlas Cars</p>
                <p className="text-xs text-slate-400">Admin cockpit</p>
              </div>
            ) : (
              <span className="sr-only">Atlas Cars admin</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl border border-white/10 text-white/70 hover:bg-white/10"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Developper la barre laterale" : "Reduire la barre laterale"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_16px_36px_-24px_rgba(14,116,144,0.45)]"
                        : "text-slate-300/85 hover:bg-white/10 hover:text-white"
                    } ${collapsed ? "justify-center px-0" : ""}`
                  }
                  aria-label={label}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !collapsed && (
                        <motion.span
                          layoutId="admin-active-nav"
                          className="absolute inset-0 rounded-2xl bg-white/10"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <Icon className="relative h-5 w-5" />
                      {!collapsed && <span className="relative">{label}</span>}
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              {collapsed && <TooltipContent>{label}</TooltipContent>}
            </Tooltip>
          ))}
        </nav>

        {!collapsed && (
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Performance</p>
                <p className="mt-1 text-sm font-semibold text-white">Taux d'occupation</p>
              </div>
              <Badge className="rounded-full bg-emerald-400/10 text-emerald-300">75%</Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500" />
            </div>
          </div>
        )}
      </aside>

      <div className="min-h-screen lg:pl-[18rem]">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex flex-col gap-4 px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="lg:hidden" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </Button>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Administration</p>
                <h1 className="truncate text-xl font-semibold md:text-2xl">{currentTitle}</h1>
              </div>

              <div className="relative hidden flex-1 items-center md:flex">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher toute la plateforme..."
                  className="h-11 rounded-full border-border/70 bg-secondary/80 pl-12 pr-4 shadow-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearQuery}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-700/70 px-2 py-1 text-xs text-white transition hover:bg-slate-700"
                  >
                    Effacer
                  </button>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                {DEMO_MODE && (
                  <Badge className="hidden rounded-full border-amber-300/60 bg-amber-100 px-3 py-1 text-amber-800 hover:bg-amber-100 md:inline-flex">
                    Demo Mode
                  </Badge>
                )}
                <div className="hidden rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground xl:block">
                  {formattedDate}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-2xl" aria-label="Actions rapides">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-3xl border border-white/10 bg-card/95 shadow-2xl">
                    <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate("/admin/bookings")}>Voir reservations</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/cars")}>Gerir voitures</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/revenue")}>Analyser les revenus</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative rounded-2xl" aria-label="Notifications du systeme">
                      <Bell className="h-4 w-4" />
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-400 ring-2 ring-background" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 rounded-3xl border border-white/10 bg-card/95 shadow-2xl">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    {notifications.map((notification) => (
                      <DropdownMenuItem key={notification.title} className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">{notification.title}</span>
                        <span className="text-xs text-muted-foreground">{notification.description}</span>
                        <span className="text-[11px] text-slate-500">{notification.time}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin/settings")}>Voir tout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" className="rounded-2xl" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Changer de theme">
                  <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 gap-2 rounded-2xl px-2">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[150px] truncate text-sm md:inline">{user?.email ?? "Admin"}</span>
                      <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 rounded-3xl border border-white/10 bg-card/95 shadow-2xl">
                    <DropdownMenuLabel>
                      <span className="block text-sm">Administrateur</span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin/settings")}>Parametres</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      Deconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="hidden items-center justify-between gap-3 rounded-3xl border border-border/60 bg-card/70 px-4 py-3 shadow-sm md:flex">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                <span>Navigation</span>
                <span className="text-slate-500">/</span>
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.path} className={index === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "text-slate-500"}>
                    {crumb.label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-slate-900/70 px-3 py-1 text-slate-300">Mode {theme === "dark" ? "sombre" : "clair"}</span>
                <span className="rounded-full bg-slate-900/70 px-3 py-1 text-slate-300">{formattedDate}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
