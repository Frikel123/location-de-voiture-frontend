import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { addDays, eachMonthOfInterval, format, isAfter, isBefore, isWithinInterval, parseISO, startOfMonth, subMonths } from "date-fns";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, Booking, Car as CarType, Contract } from "@/lib/api";
import { normalizeContractStatus } from "@/types/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Car, Shield, Sparkles, TrendingUp, Users, Wallet, Zap } from "lucide-react";

const statusForBooking = (booking: Booking) => {
  const today = new Date();
  const start = parseISO(booking.startDate);
  const end = parseISO(booking.endDate);
  if (isAfter(start, today)) return "En attente";
  if (isBefore(end, today)) return "Terminee";
  return "Confirmee";
};

const money = (value: number) => new Intl.NumberFormat("fr-MA").format(value);

const Dashboard = () => {
  const { data: cars = [], isLoading: carsLoading, isError: carsError } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: () => api.get<CarType[]>("/cars"),
  });

  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => api.get<Booking[]>("/bookings"),
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["admin-contracts"],
    queryFn: () => api.get<Contract[]>("/contracts"),
  });

  const analytics = useMemo(() => {
    const now = new Date();
    const activeBookings = bookings.filter((booking) =>
      isWithinInterval(now, { start: parseISO(booking.startDate), end: parseISO(booking.endDate) })
    );
    const currentMonth = now.getMonth();
    const monthlyBookings = bookings.filter((booking) => parseISO(booking.startDate).getMonth() === currentMonth);
    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
    const customers = new Set(bookings.map((booking) => booking.phone)).size;
    const occupiedCarIds = new Set(activeBookings.map((booking) => booking.car?.id).filter(Boolean));
    const availableCars = Math.max(cars.length - occupiedCarIds.size, 0);
    const occupancy = cars.length > 0 ? Math.round((occupiedCarIds.size / cars.length) * 100) : 0;

    const activeContracts = contracts.filter((contract) => normalizeContractStatus(contract.status) === "Confirmé");
    const expiredContracts = contracts.filter(
      (contract) => normalizeContractStatus(contract.status) === "Terminé" || (new Date(contract.reservationEndDate) < now && normalizeContractStatus(contract.status) !== "Annulé")
    );
    const contractRevenue = contracts.reduce((sum, contract) => sum + Number(contract.reservationTotalTTC || 0), 0);

    const revenueMonths = eachMonthOfInterval({ start: startOfMonth(subMonths(now, 5)), end: startOfMonth(now) }).map((month) => {
      const revenue = bookings
        .filter((booking) => {
          const date = parseISO(booking.startDate);
          return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
        })
        .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

      return { month: format(month, "MMM"), revenue };
    });

    const bookingDays = Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(now, i);
      const key = format(date, "yyyy-MM-dd");
      return {
        day: format(date, "dd/MM"),
        reservations: bookings.filter((booking) => booking.startDate === key).length,
      };
    });

    return {
      activeBookings,
      monthlyRevenue,
      customers,
      availableCars,
      occupancy,
      revenueMonths,
      bookingDays,
      activeContracts: activeContracts.length,
      expiredContracts: expiredContracts.length,
      contractRevenue,
    };
  }, [bookings, cars, contracts]);

  const latest = [...bookings]
    .sort((a, b) => new Date(b.createdAt ?? b.startDate).getTime() - new Date(a.createdAt ?? a.startDate).getTime())
    .slice(0, 6);

  const stats = [
    { label: "Total voitures", value: cars.length, icon: Car, trend: "+12%", tone: "from-emerald-500 to-cyan-500" },
    { label: "Reservations actives", value: analytics.activeBookings.length, icon: CalendarDays, trend: "+8%", tone: "from-sky-500 to-indigo-500" },
    { label: "Contrats actifs", value: analytics.activeContracts, icon: Shield, trend: "+9%", tone: "from-cyan-500 to-sky-500" },
    { label: "Contrats expirés", value: analytics.expiredContracts, icon: Sparkles, trend: "+4%", tone: "from-violet-500 to-fuchsia-500" },
    { label: "Revenus contrats", value: `${money(analytics.contractRevenue)} DH`, icon: Wallet, trend: "+18%", tone: "from-amber-500 to-orange-500" },
    { label: "Taux occupation", value: `${analytics.occupancy}%`, icon: Zap, trend: "+11%", tone: "from-rose-500 to-pink-500" },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-white premium-ring lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 rounded-full bg-white/10 text-white hover:bg-white/15">Dashboard premium</Badge>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight lg:text-4xl">Pilotage complet des locations NAYS CAR</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Suivez la flotte, les reservations et les revenus avec une lecture claire et rapide.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-white/60">CA mensuel</p>
              <p className="mt-1 text-2xl font-bold">{money(analytics.monthlyRevenue)} DH</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-white/60">Occupation</p>
              <p className="mt-1 text-2xl font-bold">{analytics.occupancy}%</p>
            </div>
          </div>
        </div>
      </section>

      {(isError || carsError) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Impossible de charger les donnees du dashboard."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Card className="group overflow-hidden border-border/70 bg-card/90 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
              <CardContent className="p-5">
                {isLoading || carsLoading ? (
                  <Skeleton className="h-24 rounded-2xl" />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="mt-2 truncate text-3xl font-bold tracking-tight">{stat.value}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {stat.trend} ce mois
                      </div>
                    </div>
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${stat.tone} text-white shadow-lg`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Revenus</CardTitle>
              <p className="text-sm text-muted-foreground">Evolution par mois et comparaison avancee.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "7 jours", active: false },
                { label: "30 jours", active: false },
                { label: "6 mois", active: true },
              ].map((option) => (
                <Button key={option.label} variant={option.active ? "secondary" : "outline"} size="sm" className="rounded-full">
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenueMonths} margin={{ top: 12, right: 18, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(value) => [`${value} DH`, "Revenus"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Reservation rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <p className="text-sm text-muted-foreground">Nombres de reservations confirmées</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{analytics.activeBookings.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <p className="text-sm text-muted-foreground">Voitures disponibles</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{analytics.availableCars}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Evolution clients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <p className="text-sm text-muted-foreground">Clients total</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{analytics.customers}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <p className="text-sm text-muted-foreground">Croissance mensuelle</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">+14%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Alertes maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <p className="font-medium text-foreground">Controle des freins</p>
              <p>1 voiture nécessite une revision.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <p className="font-medium text-foreground">Vidange a planifier</p>
              <p>2 Logan a verifier cette semaine.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Reservations 7 jours</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.bookingDays} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="reservations" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} minPointSize={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Dernieres reservations</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Voiture</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latest.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.customerName}</TableCell>
                    <TableCell>{booking.car?.name ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{booking.startDate} - {booking.endDate}</TableCell>
                    <TableCell><StatusBadge status={statusForBooking(booking)} /></TableCell>
                    <TableCell className="text-right font-semibold">{money(booking.totalPrice)} DH</TableCell>
                  </TableRow>
                ))}
                {!isLoading && latest.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Aucune reservation pour le moment.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const className =
    status === "Confirmee"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : status === "En attente"
        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
        : "bg-slate-500/10 text-slate-600 border-slate-500/20";

  return <Badge variant="outline" className={`rounded-full ${className}`}>{status}</Badge>;
};

export default Dashboard;
