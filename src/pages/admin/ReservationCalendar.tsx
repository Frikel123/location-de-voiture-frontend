import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isWithinInterval, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { api, Booking, Car } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReservationCalendar = () => {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [moved, setMoved] = useState<Record<number, string>>({});
  const { data: bookings = [] } = useQuery({ queryKey: ["admin-bookings"], queryFn: () => api.get<Booking[]>("/bookings") });
  const { data: cars = [] } = useQuery({ queryKey: ["admin-cars"], queryFn: () => api.get<Car[]>("/cars") });

  const days = useMemo(() => {
    if (view === "week") return eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) });
    return eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) });
  }, [cursor, view]);

  const shiftedBookings = useMemo(
    () => bookings.map((booking) => ({ ...booking, startDate: moved[booking.id] ?? booking.startDate })),
    [bookings, moved],
  );

  const bookingsForDay = (day: Date) =>
    shiftedBookings.filter((booking) => {
      const start = parseISO(booking.startDate);
      const end = parseISO(booking.endDate);
      return isWithinInterval(day, { start, end });
    });

  const move = (direction: number) => setCursor((date) => view === "week" ? addDays(date, direction * 7) : new Date(date.getFullYear(), date.getMonth() + direction, 1));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 rounded-full">Reservation calendar</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">{format(cursor, view === "week" ? "'Week of' dd MMM yyyy" : "MMMM yyyy")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Monthly and weekly availability with draggable reservation blocks.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={view} onValueChange={(value) => setView(value as "month" | "week")}>
              <TabsList className="rounded-2xl">
                <TabsTrigger value="month" className="rounded-xl">Monthly</TabsTrigger>
                <TabsTrigger value="week" className="rounded-xl">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" className="rounded-2xl" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-2xl" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      <Card className="border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Availability board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-3 ${view === "week" ? "grid-cols-1 md:grid-cols-7" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"}`}>
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsForDay(day);
              const occupied = new Set(dayBookings.map((booking) => booking.car?.id).filter(Boolean));
              return (
                <div
                  key={dayKey}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    const id = Number(event.dataTransfer.getData("booking-id"));
                    if (id) setMoved((current) => ({ ...current, [id]: dayKey }));
                  }}
                  className="min-h-[14rem] rounded-2xl border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{format(day, "EEE dd")}</p>
                      <p className="text-xs text-muted-foreground">{cars.length - occupied.size}/{cars.length} available</p>
                    </div>
                    <Badge variant="outline" className={occupied.size === cars.length && cars.length > 0 ? "rounded-full border-rose-500/20 bg-rose-500/10 text-rose-500" : "rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-600"}>
                      {occupied.size === cars.length && cars.length > 0 ? "Full" : "Open"}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayBookings.map((booking) => (
                      <div
                        key={`${booking.id}-${dayKey}`}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData("booking-id", String(booking.id))}
                        className="cursor-grab rounded-xl border bg-card p-3 shadow-sm active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{booking.customerName}</p>
                            <p className="truncate text-xs text-muted-foreground">{booking.car?.name ?? "Vehicle"} - {booking.totalPrice} DH</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-card">
        <CardHeader><CardTitle>Vehicle availability visualization</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {cars.map((car) => {
            const bookedDays = days.filter((day) => bookingsForDay(day).some((booking) => booking.car?.id === car.id)).length;
            const percent = days.length ? Math.round((bookedDays / days.length) * 100) : 0;
            return (
              <div key={car.id} className="grid gap-2 rounded-2xl border bg-muted/20 p-3 md:grid-cols-[220px_1fr_70px] md:items-center">
                <p className="truncate font-medium">{car.name}</p>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-right text-sm text-muted-foreground">{100 - percent}% free</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationCalendar;
