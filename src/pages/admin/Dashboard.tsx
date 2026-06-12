import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  addDays,
  eachMonthOfInterval,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import RevenueChart from "@/components/admin/RevenueChart";
import { jsPDF } from "jspdf";
import { utils, writeFile } from "xlsx";
import { api, Booking, Car as CarType, Contract } from "@/lib/api";
import { normalizeContractStatus } from "@/types/contracts";
import {
  buildAlerts,
  buildCustomerRows,
  buildRevenueMonths,
  buildVehicleRevenue,
  money,
} from "@/lib/admin-analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrandLogo } from "@/components/BrandLogo";
import FleetOverview from "@/components/admin/FleetOverview";
import KpiCard from "@/components/admin/KpiCard";
import RecentReservations from "@/components/admin/RecentReservations";
import {
  CalendarDays,
  Car,
  Plus,
  RefreshCcw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

const rangeOptions = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "12m", label: "12 mois" },
] as const;

type RangeKey = (typeof rangeOptions)[number]["value"];

const formatMoney = (value: number) => money(value) + " DH";

const rangeLabels: Record<RangeKey, string> = {
  today: "Aujourd'hui",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "12m": "12 derniers mois",
};

const statusForBooking = (booking: Booking) => {
  const today = new Date();
  const start = parseISO(booking.startDate);
  const end = parseISO(booking.endDate);
  if (isWithinInterval(today, { start, end })) return "Confirmée";
  if (isAfter(start, today)) return "En attente";
  return "Terminée";
};

const filterBookingsByRange = (bookings: Booking[], range: RangeKey) => {
  const today = new Date();
  const rangeStart =
    range === "today"
      ? startOfDay(today)
      : range === "7d"
      ? subDays(startOfDay(today), 6)
      : range === "30d"
      ? subDays(startOfDay(today), 29)
      : subYears(startOfDay(today), 1);
  const rangeEnd = endOfDay(today);

  return bookings.filter((booking) => {
    const start = parseISO(booking.startDate);
    const end = parseISO(booking.endDate);
    return (
      isWithinInterval(start, { start: rangeStart, end: rangeEnd }) ||
      isWithinInterval(end, { start: rangeStart, end: rangeEnd }) ||
      (isBefore(start, rangeStart) && isAfter(end, rangeEnd))
    );
  });
};

const buildReservationTrend = (bookings: Booking[]) => {
  const now = new Date();
  return Array.from({ length: 14 }).map((_, index) => {
    const date = addDays(now, -13 + index);
    const key = format(date, "yyyy-MM-dd");
    return {
      date: format(date, "dd MMM"),
      count: bookings.filter((booking) => booking.startDate === key).length,
    };
  });
};

const buildCustomerGrowth = (bookings: Booking[]) => {
  const now = new Date();
  return eachMonthOfInterval({ start: startOfMonth(subMonths(now, 5)), end: startOfMonth(now) }).map((month) => {
    const count = new Set(
      bookings
        .filter((booking) => {
          const start = parseISO(booking.startDate);
          return start.getMonth() === month.getMonth() && start.getFullYear() === month.getFullYear();
        })
        .map((booking) => booking.phone)
    ).size;
    return { month: format(month, "MMM"), customers: count };
  });
};

const getTopVehicle = (cars: CarType[], bookings: Booking[], contracts: Contract[]) => {
  const vehicleRevenue = buildVehicleRevenue(cars, bookings, contracts);
  return vehicleRevenue[0] || { vehicle: "-", revenue: 0, rentals: 0 };
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<RangeKey>("30d");

  const {
    data: cars = [],
    isLoading: carsLoading,
    isError: carsError,
    refetch: refetchCars,
  } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: () => api.get<CarType[]>("/cars"),
  });

  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    isError: bookingsError,
    error,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => api.get<Booking[]>("/bookings"),
  });

  const {
    data: contracts = [],
    isLoading: contractsLoading,
    isError: contractsError,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ["admin-contracts"],
    queryFn: () => api.get<Contract[]>("/contracts"),
  });

  const isLoading = carsLoading || bookingsLoading || contractsLoading;
  const isError = carsError || bookingsError || contractsError;

  const filteredBookings = useMemo(() => filterBookingsByRange(bookings, range), [bookings, range]);

  const analytics = useMemo(() => {
    const now = new Date();
    const activeBookings = bookings.filter((booking) =>
      isWithinInterval(now, { start: parseISO(booking.startDate), end: parseISO(booking.endDate) })
    );
    const currentMonth = now.getMonth();
    const currentMonthBookings = bookings.filter((booking) => parseISO(booking.startDate).getMonth() === currentMonth);
    const currentMonthRevenue = currentMonthBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
    const previousMonthRevenue = bookings
      .filter((booking) => parseISO(booking.startDate).getMonth() === currentMonth - 1)
      .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
    const customers = new Set(bookings.map((booking) => booking.phone)).size;
    const occupiedCarIds = new Set(activeBookings.map((booking) => booking.car?.id).filter(Boolean));
    const availableCars = Math.max(cars.length - occupiedCarIds.size, 0);
    const occupancy = cars.length > 0 ? Math.round((occupiedCarIds.size / cars.length) * 100) : 0;
    const activeContracts = contracts.filter((contract) => normalizeContractStatus(contract.status) === "Confirmé");
    const signedContracts = contracts.filter(
      (contract) => contract.signatureStatus === "signed" || normalizeContractStatus(contract.status) === "Signé"
    );
    const expiredContracts = contracts.filter(
      (contract) => normalizeContractStatus(contract.status) === "Terminé" || (new Date(contract.reservationEndDate) < now && normalizeContractStatus(contract.status) !== "Annulé")
    );
    const contractRevenue = contracts.reduce((sum, contract) => sum + Number(contract.reservationTotalTTC || 0), 0);
    const revenueMonths = buildRevenueMonths(bookings, contracts);
    const reservationTrend = buildReservationTrend(filteredBookings);
    const customerGrowth = buildCustomerGrowth(bookings);
    const topVehicle = getTopVehicle(cars, bookings, contracts);
    const returningCustomers = bookings.filter((booking, index, arr) => arr.indexOf(booking.phone) !== index).length;

    return {
      activeBookings,
      currentMonthRevenue,
      previousMonthRevenue,
      customers,
      availableCars,
      occupancy,
      revenueMonths,
      reservationTrend,
      customerGrowth,
      topVehicle,
      signedContracts: signedContracts.length,
      activeContracts: activeContracts.length,
      expiredContracts: expiredContracts.length,
      contractRevenue,
      cancelledReservations: bookings.filter((booking) => isBefore(parseISO(booking.endDate), now) && !isWithinInterval(now, { start: parseISO(booking.startDate), end: parseISO(booking.endDate) })).length,
      pendingReservations: bookings.filter((booking) => isAfter(parseISO(booking.startDate), now)).length,
      returningCustomers,
      newCustomersThisMonth: new Set(currentMonthBookings.map((booking) => booking.phone)).size,
      growthPercentage:
        previousMonthRevenue > 0 ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) : currentMonthRevenue > 0 ? 100 : 0,
      forecastRevenue: Math.round(currentMonthRevenue * 1.08),
    };
  }, [bookings, cars, contracts, filteredBookings]);

  const topCustomers = useMemo(() => buildCustomerRows(bookings, contracts).slice(0, 6), [bookings, contracts]);
  const alerts = useMemo(() => buildAlerts(cars, bookings, contracts).slice(0, 5), [cars, bookings, contracts]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchCars(), refetchBookings(), refetchContracts()]);
    queryClient.invalidateQueries(["admin-cars"]);
    queryClient.invalidateQueries(["admin-bookings"]);
    queryClient.invalidateQueries(["admin-contracts"]);
  }, [queryClient, refetchCars, refetchBookings, refetchContracts]);

  const downloadDashboardPdf = useCallback(() => {
    const doc = new jsPDF({ format: "a4", unit: "pt" });
    doc.setFontSize(20);
    doc.text("N1 Lux Cars Dashboard Report", 40, 50);
    doc.setFontSize(12);
    doc.text(`Revenus mensuels: ${formatMoney(analytics.currentMonthRevenue)}`, 40, 90);
    doc.text(`Taux d'occupation: ${analytics.occupancy}%`, 40, 110);
    doc.text(`Clients: ${analytics.customers}`, 40, 130);
    doc.text(`Contrats signés: ${analytics.signedContracts}`, 40, 150);
    doc.save("n1-lux-cars_dashboard_report.pdf");
  }, [analytics]);

  const downloadDashboardExcel = useCallback(() => {
    const rows = analytics.revenueMonths.map((row) => ({ Mois: row.month, Revenus: row.revenue }));
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Revenus");
    writeFile(workbook, "n1-lux-cars_revenue_report.xlsx");
  }, [analytics.revenueMonths]);

  const downloadDashboardCsv = useCallback(() => {
    const rows = ["Mois,Revenus", ...analytics.revenueMonths.map((row) => `${row.month},${row.revenue}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "n1-lux-cars_revenue_report.csv");
    link.click();
  }, [analytics.revenueMonths]);

  const latest = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => new Date(b.createdAt ?? b.startDate).getTime() - new Date(a.createdAt ?? a.startDate).getTime())
        .slice(0, 6),
    [bookings]
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 compact-hero glass shadow-2xl shadow-slate-950/40 ring-1 ring-white/10 lg:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <BrandLogo className="mb-5" markClassName="h-16 w-16" textClassName="text-gray-900 dark:text-white" />
            <Badge className="mb-4 rounded-full bg-primary/10 text-primary">Luxury command center</Badge>
            <h1 className="brand-heading hero-title font-semibold tracking-tight text-gray-900 dark:text-white">Welcome to N1 Lux Cars Administration</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">
              Premium analytics for fleet performance, reservations, revenue, and client experience.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-2 gap-3">
              <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="admin-stat-label text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-slate-400">Revenu mensuel</p>
                <p className="admin-stat-value mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{formatMoney(analytics.currentMonthRevenue)}</p>
                <p className="mt-2 text-sm text-primary">{analytics.growthPercentage >= 0 ? `+${analytics.growthPercentage}%` : `${analytics.growthPercentage}%`} vs. mois précédent</p>
              </div>
              <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="admin-stat-label text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-slate-400">Taux d'occupation</p>
                <p className="admin-stat-value mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.occupancy}%</p>
                <p className="mt-2 text-sm text-slate-400">Prévision +6% sur 12 mois</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={handleRefresh} variant="secondary" size="sm" className="rounded-2xl px-5 py-3 text-sm btn-hero-action">
                <RefreshCcw className="mr-2 h-4 w-4" /> Rafraîchir
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-2xl px-5 py-3 text-sm btn-hero-action">
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-3xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-slate-950/95">
                  <DropdownMenuLabel>Exporter</DropdownMenuLabel>
                  <DropdownMenuItem onClick={downloadDashboardPdf}>Exporter PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadDashboardExcel}>Exporter Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadDashboardCsv}>Exporter CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="admin-surface mt-8 flex flex-col gap-4 rounded-[2rem] border border-gray-200 bg-white p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Période</p>
            <div className="flex flex-wrap gap-2">
              {rangeOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setRange(option.value)}
                  variant={option.value === range ? "secondary" : "outline"}
                  size="sm"
                  className="rounded-full px-4 py-2 text-sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Comparaison</p>
                <p className="admin-stat-value mt-2 text-xl font-semibold text-gray-900 dark:text-white">{analytics.growthPercentage >= 0 ? `+${analytics.growthPercentage}%` : `${analytics.growthPercentage}%`}</p>
              <p className="mt-1 text-sm text-slate-400">{rangeLabels[range]}</p>
            </div>
            <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Performance</p>
              <p className="admin-stat-value mt-2 text-xl font-semibold text-gray-900 dark:text-white">{filteredBookings.length} réservations</p>
              <p className="mt-1 text-sm text-slate-400">Filtrées sur la période</p>
            </div>
          </div>
        </div>
      </section>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Impossible de charger les données du dashboard."}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4">
        {[
          { label: "Total Vehicles", value: cars.length, icon: Car, spark: analytics.revenueMonths?.map((r) => ({ value: Math.max(0, Math.round(r.revenue / 1000)) })) ?? analytics.reservationTrend?.map((r) => ({ value: r.count })) ?? null },
          { label: "Available Vehicles", value: analytics.availableCars ?? cars.length, icon: Car, spark: analytics.revenueMonths?.map((r) => ({ value: Math.max(0, Math.round((r.revenue / 1000) * 0.6)) })) ?? analytics.reservationTrend?.map((r) => ({ value: Math.max(0, Math.round(r.count * 0.6)) })) ?? null },
          { label: "Active Reservations", value: analytics.activeBookings.length, icon: CalendarDays, spark: analytics.reservationTrend?.map((r) => ({ value: r.count })) ?? null },
          { label: "Monthly Revenue", value: formatMoney(analytics.currentMonthRevenue), icon: Wallet, spark: analytics.revenueMonths?.map((r) => ({ value: r.revenue })) ?? null },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="col-span-12 sm:col-span-6 xl:col-span-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            {isLoading ? (
              <Card className="overflow-hidden border-border/70 bg-card/90 shadow-card card-dense">
                <CardContent className="p-5">
                  <Skeleton className="h-24 rounded-2xl" />
                </CardContent>
              </Card>
            ) : (
              <KpiCard label={stat.label} value={stat.value} icon={stat.icon} sparkData={stat.spark} />
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Aperçu de la flotte</h2>
          <div className="text-sm text-muted-foreground">{cars.length} véhicules</div>
        </div>
        <FleetOverview cars={cars} loading={isLoading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/70 shadow-card">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Revenue par mois</CardTitle>
              <p className="text-sm text-muted-foreground">Évolution sur les derniers mois.</p>
            </div>
            <Badge className="rounded-full bg-primary/10 text-primary">12 mois</Badge>
          </CardHeader>
          <CardContent className="h-80">
                <div className="h-full">
                  <RevenueChart data={analytics.revenueMonths} />
                </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Réservation trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.reservationTrend} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--admin-chart-grid)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--admin-chart-axis)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--admin-chart-axis)" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--admin-tooltip-border)", background: "var(--admin-tooltip-bg)", color: "var(--admin-main-text)" }} />
                <Line type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
              <p className="text-sm text-muted-foreground">Nouveaux ce mois</p>
              <p className="admin-stat-value mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.newCustomersThisMonth}</p>
            </div>
            <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-muted-foreground">Retour clients</p>
              <p className="admin-stat-value mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.returningCustomers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Croissance clients</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.customerGrowth} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--admin-chart-grid)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--admin-chart-axis)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--admin-chart-axis)" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--admin-tooltip-border)", background: "var(--admin-tooltip-bg)", color: "var(--admin-main-text)" }} />
                <Area type="monotone" dataKey="customers" stroke="#D4AF37" strokeWidth={3} fill="url(#customerGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Contrats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
              <p className="text-sm text-muted-foreground">Actifs</p>
              <p className="admin-stat-value mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.activeContracts}</p>
            </div>
            <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-muted-foreground">Signés</p>
              <p className="admin-stat-value mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.signedContracts}</p>
            </div>
            <div className="admin-stat-card rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-muted-foreground">Expirés</p>
              <p className="admin-stat-value mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{analytics.expiredContracts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Revenu contrat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatMoney(analytics.contractRevenue)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Revenus prévisionnels de tous les contrats.</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Génération rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: "Créer un contrat", description: "Accès direct au module de contrat." },
              { title: "Ajouter une réservation", description: "Lancer une réservation en un clic." },
            ].map((item) => (
              <div key={item.title} className="admin-surface rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle>Réservations récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentReservations bookings={latest} />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 p-6 text-sm text-muted-foreground dark:border-white/10">Aucune alerte en attente.</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="admin-surface rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{alert.title}</p>
                    <Badge className="rounded-full bg-slate-800/70 text-slate-200">{alert.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{alert.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">Prévu le {format(parseISO(alert.dueDate), "dd MMM")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
