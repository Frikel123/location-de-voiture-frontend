import { useQuery } from "@tanstack/react-query";
import { api, Booking, Car as CarType } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, CalendarDays, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addDays, format, startOfDay } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const Dashboard = () => {
  const { data: carsCount = 0, isError: carsError } = useQuery({
    queryKey: ["admin-cars-count"],
    queryFn: async () => {
      const data = await api.get<CarType[]>("/cars");
      return data.length;
    },
  });

  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => api.get<Booking[]>("/bookings"),
  });

  const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
  const latest = [...bookings]
    .sort((a, b) => new Date(b.createdAt ?? b.startDate).getTime() - new Date(a.createdAt ?? a.startDate).getTime())
    .slice(0, 5);

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = startOfDay(addDays(new Date(), i));
    const key = format(d, "yyyy-MM-dd");
    const count = bookings.filter((booking) => booking.startDate === key).length;
    return { day: format(d, "dd/MM"), count };
  });
  const hasChartData = chartData.some((item) => item.count > 0);

  const stats = [
    { label: "Voitures", value: carsCount, icon: Car, color: "bg-accent text-accent-foreground" },
    { label: "Reservations", value: bookings.length, icon: CalendarDays, color: "bg-accent text-accent-foreground" },
    { label: "Revenu total", value: `${totalRevenue} DH`, icon: Wallet, color: "bg-primary text-primary-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de votre activite</p>
      </div>

      {(isError || carsError) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Impossible de charger les donnees du dashboard."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card border-border/60">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card border-border/60">
          <CardHeader><CardTitle>Reservations (7 prochains jours)</CardTitle></CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="relative h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value} reservation(s)`, "Total"]}
                      contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} minPointSize={3} />
                  </BarChart>
                </ResponsiveContainer>
                {!hasChartData && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
                    Aucune reservation prevue sur cette periode.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader><CardTitle>Dernieres reservations</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : latest.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune reservation.</p>
            ) : (
              <div className="space-y-3">
                {latest.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground">{booking.phone}</p>
                    </div>
                    <span className="font-semibold text-primary">{booking.totalPrice} DH</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader><CardTitle>Toutes les dernieres reservations</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Telephone</TableHead>
                <TableHead>Du</TableHead>
                <TableHead>Au</TableHead>
                <TableHead className="text-right">Prix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latest.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.customerName}</TableCell>
                  <TableCell>{booking.phone}</TableCell>
                  <TableCell>{booking.startDate}</TableCell>
                  <TableCell>{booking.endDate}</TableCell>
                  <TableCell className="text-right font-semibold">{booking.totalPrice} DH</TableCell>
                </TableRow>
              ))}
              {latest.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune reservation.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
