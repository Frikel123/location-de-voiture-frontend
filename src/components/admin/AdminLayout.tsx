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
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import "@/styles/admin.css";
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
import { BrandLogo } from "@/components/BrandLogo";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/cars", label: "Voitures", icon: Car },
  { to: "/admin/bookings", label: "Reservations", icon: CalendarDays },
  { to: "/admin/contracts", label: "Contrats", icon: FileText },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/admin/revenue", label: "Revenus", icon: CreditCard },
  { to: "/admin/settings", label: "Parametres", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Vue d'ensemble",
  "/admin/cars": "Gestion de flotte",
  "/admin/bookings": "Reservations",
  "/admin/contracts": "Contrats",
  "/admin/clients": "Clients",
  "/admin/maintenance": "Maintenance",
  "/admin/revenue": "Revenus",
  "/admin/settings": "Parametres",
};

export const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { query, setQuery, clearQuery } = useAdminSearch();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(new Date());
  const [notificationsState, setNotificationsState] = useState([
    { id: "1", title: "Nouvelle reservation", description: "Un client a reserve une voiture ce matin.", time: "2 min", unread: true },
    { id: "2", title: "Contrat signe", description: "Contrat #C-204 a ete signe.", time: "14 min", unread: true },
    { id: "3", title: "Paiement recu", description: "Paiement confirme pour la reservation du 20 juin.", time: "1h", unread: false },
  ]);
  const [focusedResult, setFocusedResult] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];

    const safeQueryData = (key: string) => {
      const data = queryClient.getQueryData<any[]>([key]);
      return Array.isArray(data) ? data : [];
    };

    const cars = safeQueryData("admin-cars").filter((car) => car.name?.toLowerCase().includes(term));
    const bookings = safeQueryData("admin-bookings").filter((booking) => booking.customerName?.toLowerCase().includes(term) || booking.phone?.includes(term));
    const contracts = safeQueryData("admin-contracts").filter((contract) => contract.contractNumber?.toLowerCase().includes(term) || contract.clientFullName?.toLowerCase().includes(term));
    const clients = safeQueryData("admin-clients").filter((client) => client.name?.toLowerCase().includes(term) || client.phone?.includes(term) || client.email?.toLowerCase().includes(term));

    const results = [
      ...cars.slice(0, 2).map((car) => ({ type: "Voiture", label: car.name, path: "/admin/cars", detail: car.category || car.model || "Fleet" })),
      ...bookings.slice(0, 2).map((booking) => ({ type: "Reservation", label: booking.customerName, path: "/admin/bookings", detail: booking.car?.name ?? booking.phone })),
      ...contracts.slice(0, 2).map((contract) => ({ type: "Contrat", label: contract.contractNumber, path: `/admin/contracts/${contract.id}`, detail: contract.clientFullName })),
      ...clients.slice(0, 2).map((client) => ({ type: "Client", label: client.name, path: "/admin/clients", detail: client.phone })),
    ];

    return results.slice(0, 5);
  }, [query, queryClient]);

  const unreadCount = notificationsState.filter((item) => item.unread).length;

  const initials = useMemo(() => {
    const email = user?.email ?? "admin@n1-lux-cars.ma";
    return email.slice(0, 2).toUpperCase();
  }, [user?.email]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const isLightTheme = theme === "light";

  const currentTitle =
    pageTitles[location.pathname] ??
    (location.pathname.startsWith("/admin/contracts") ? "Contrats" : "N1 Lux Cars Admin");

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
    <div className={`admin-root ${isLightTheme ? "admin-theme-light" : ""} min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.14)_0,_transparent_32%),radial-gradient(circle_at_top_right,_rgba(255,242,183,0.12)_0,_transparent_28%),hsl(var(--background))] text-foreground`}>
      {open && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-[#0A1225]/95 bg-[length:200%] bg-[top] p-3 shadow-2xl backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-20" : "w-[16rem]"} ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <BrandLogo showText={false} markClassName="h-12 w-12" />
            {!collapsed ? (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">N1 Lux Cars</p>
                <p className="text-xs text-slate-400">Luxury administration</p>
              </div>
            ) : (
              <span className="sr-only">N1 Lux Cars admin</span>
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
                        ? "bg-gradient-to-r from-[#d4af37] to-[#fff2b7] text-[#0B1F3A] shadow-[0_16px_36px_-24px_rgba(212,175,55,0.65)]"
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
              <Badge className="rounded-full bg-primary/10 text-primary">75%</Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-[#fff2b7] transition-all duration-500" />
            </div>
          </div>
        )}
      </aside>

      <div className="min-h-screen lg:pl-[18rem]">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex flex-col gap-2 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="lg:hidden" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </Button>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-primary">N1 Lux Cars</p>
                <h1 className="truncate text-xl font-semibold md:text-2xl">{currentTitle}</h1>
              </div>

              <div className="relative hidden flex-1 items-center md:flex">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setFocusedResult(0);
                  }}
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
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-3xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-2xl">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.label}-${index}`}
                        type="button"
                        onClick={() => {
                          setQuery(result.label);
                          navigate(result.path);
                        }}
                        className={`flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${index === focusedResult ? "bg-white/5" : ""}`}
                      >
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{result.type}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{result.label}</p>
                          <p className="truncate text-xs text-slate-400">{result.detail}</p>
                        </div>
                      </button>
                    ))}
                  </div>
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
                <DropdownMenu onOpenChange={(open) => {
                    if (open) {
                      setNotificationsState((items) => items.map((item) => ({ ...item, unread: false })));
                    }
                  }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative rounded-2xl" aria-label="Notifications du systeme">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white shadow-md">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 rounded-3xl border border-white/10 bg-card/95 shadow-2xl">
                    <DropdownMenuLabel className="flex items-center justify-between gap-3">
                      <span>Notifications</span>
                      {unreadCount > 0 ? <Badge className="rounded-full bg-rose-500/10 text-rose-400">{unreadCount} non lues</Badge> : <span className="text-xs text-muted-foreground">Toutes lues</span>}
                    </DropdownMenuLabel>
                    {notificationsState.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col gap-1 ${notification.unread ? "bg-white/5" : ""}`}
                        onClick={() => setNotificationsState((items) => items.map((item) => (item.id === notification.id ? { ...item, unread: false } : item)))}
                      >
                        <span className="text-sm font-semibold">{notification.title}</span>
                        <span className="text-xs text-muted-foreground">{notification.description}</span>
                        <span className="text-[11px] text-slate-500">{notification.time}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin/settings")}>Voir tout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-2xl"
                  aria-label={isLightTheme ? "Activer le mode sombre" : "Activer le mode clair"}
                  onClick={() => setTheme(isLightTheme ? "dark" : "light")}
                >
                  {isLightTheme ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 gap-2 rounded-2xl px-2">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-[#fff2b7] text-xs font-bold text-[#0B1F3A]">{initials}</AvatarFallback>
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
