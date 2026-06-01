import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isAfter, isBefore, parseISO } from "date-fns";
import { api, Car as CarType, Booking } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CalendarDays, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";

const computeMaintenance = (cars: CarType[]) =>
  cars.map((car, index) => {
    const base = index % 5;
    const dueInDays = (5 - base) * 3;
    const date = addDays(new Date(), dueInDays);
    const status = base <= 1 ? "Urgent" : base <= 2 ? "Planifie" : "OK";
    const service = base === 0 ? "Vidange" : base === 1 ? "Assurance" : base === 2 ? "Controle technique" : "Revision generale";
    return {
      id: car.id,
      name: car.name,
      service,
      dueDate: format(date, "dd/MM/yyyy"),
      status,
      nextCheck: date,
      notes: base === 0 ? "Freinage prioritaire" : base === 1 ? "Verif. doc" : "Points de controle standard",
    };
  });

const Maintenance = () => {
  const { data: cars = [], isLoading: carsLoading } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: () => api.get<CarType[]>("/cars"),
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => api.get<Booking[]>("/bookings"),
  });

  const maintenance = useMemo(() => computeMaintenance(cars), [cars]);
  const urgentTasks = maintenance.filter((task) => task.status === "Urgent");
  const upcomingTasks = maintenance.filter((task) => task.status !== "OK");
  const calendarDays = useMemo(
    () => Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(new Date(), index);
      return {
        label: format(date, "EEE dd/MM"),
        cars: maintenance.filter((task) => format(task.nextCheck, "dd/MM/yyyy") === format(date, "dd/MM/yyyy")),
      };
    }),
    [maintenance],
  );

  const activeReservations = bookings.filter((booking) => {
    const now = new Date();
    const start = parseISO(booking.startDate);
    const end = parseISO(booking.endDate);
    return isBefore(start, now) && isAfter(end, now);
  }).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-4 rounded-full bg-primary/10 text-primary">Maintenance premium</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Gestion maintenance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Planifiez l'entretien, suivez les alertes urgentes et visualisez la disponibilité de vos voitures en direct.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Button variant="secondary" className="rounded-2xl px-5 py-3">Exporter PDF</Button>
            <Button variant="outline" className="rounded-2xl px-5 py-3">Exporter Excel</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-border/70 shadow-card">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Fiabilite</p>
            </div>
            <p className="text-4xl font-semibold">{cars.length}</p>
            <p className="text-sm leading-6 text-muted-foreground">Voitures dans la flotte suivies pour maintenance.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Urgence</p>
            </div>
            <p className="text-4xl font-semibold">{urgentTasks.length}</p>
            <p className="text-sm leading-6 text-muted-foreground">Interventions urgentes ce mois-ci.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3 text-cyan-500">
              <CalendarDays className="h-5 w-5" />
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Disponibilite</p>
            </div>
            <p className="text-4xl font-semibold">{cars.length - activeReservations}</p>
            <p className="text-sm leading-6 text-muted-foreground">Voitures disponibles while maintenance planifiee.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Status de maintenance</CardTitle>
              <p className="text-sm text-muted-foreground">Securite et conformité par voiture.</p>
            </div>
            <Badge className="rounded-full bg-emerald-500/10 text-emerald-300">{upcomingTasks.length} interventions</Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-4">
            {carsLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-3xl" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Voiture</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.map((task) => (
                    <TableRow key={task.id} className="border-b transition hover:bg-muted/40">
                      <TableCell>{task.name}</TableCell>
                      <TableCell>{task.service}</TableCell>
                      <TableCell>{task.dueDate}</TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full ${
                            task.status === "Urgent"
                              ? "bg-rose-500/10 text-rose-500"
                              : task.status === "Planifie"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle>Calendrier maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-3">
              {calendarDays.map((day) => (
                <div key={day.label} className="rounded-3xl border border-white/10 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{day.label}</p>
                    <Badge className="rounded-full bg-slate-800/80 text-slate-200">{day.cars.length} taches</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {day.cars.length > 0 ? (
                      day.cars.map((task) => (
                        <div key={task.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm">
                          <p className="font-semibold">{task.name}</p>
                          <p className="text-xs text-muted-foreground">{task.service}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-3 text-sm text-muted-foreground">Aucune maintenance programmee.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full rounded-2xl">Voir planning detaille <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Maintenance;
