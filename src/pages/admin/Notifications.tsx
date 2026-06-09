import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, CalendarClock, Car, FileWarning, ShieldAlert, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, Booking, Car as CarType, Contract } from "@/lib/api";
import { buildAlerts } from "@/lib/admin-analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Notifications = () => {
  const navigate = useNavigate();
  const { data: cars = [] } = useQuery({ queryKey: ["admin-cars"], queryFn: () => api.get<CarType[]>("/cars") });
  const { data: bookings = [] } = useQuery({ queryKey: ["admin-bookings"], queryFn: () => api.get<Booking[]>("/bookings") });
  const { data: contracts = [] } = useQuery({ queryKey: ["admin-contracts"], queryFn: () => api.get<Contract[]>("/contracts") });

  const alerts = useMemo(() => buildAlerts(cars, bookings, contracts), [cars, bookings, contracts]);
  const groups = [
    { label: "Expiring contracts", type: "contract", icon: FileWarning },
    { label: "Insurance expiration", type: "insurance", icon: ShieldAlert },
    { label: "Maintenance reminders", type: "maintenance", icon: Wrench },
    { label: "Overdue reservations", type: "reservation", icon: CalendarClock },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-card">
        <Badge variant="outline" className="mb-3 rounded-full">Notification center</Badge>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Operational alerts</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Contracts, insurance, maintenance and overdue returns in one action queue.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {groups.map((group) => {
              const count = alerts.filter((alert) => alert.type === group.type).length;
              return (
                <div key={group.type} className="rounded-2xl border bg-muted/25 p-3">
                  <group.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{group.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {groups.map((group) => {
          const groupAlerts = alerts.filter((alert) => alert.type === group.type);
          return (
            <Card key={group.type} className="border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><group.icon className="h-5 w-5 text-primary" /> {group.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupAlerts.length > 0 ? groupAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => navigate(alert.actionPath)}
                    className="flex w-full items-start gap-4 rounded-2xl border bg-muted/20 p-4 text-left transition hover:-translate-y-0.5 hover:bg-muted/45 hover:shadow-sm"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Bell className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{alert.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{alert.description}</span>
                      <span className="mt-2 block text-xs text-muted-foreground">Due {alert.dueDate}</span>
                    </span>
                    <Priority priority={alert.priority} />
                  </button>
                )) : (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No alerts in this category.</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>High priority alerts should be handled before opening the daily rental desk.</span>
          </div>
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/admin/calendar")}>
            <Car className="mr-2 h-4 w-4" /> Check availability
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const Priority = ({ priority }: { priority: "high" | "medium" | "low" }) => {
  const className = priority === "high" ? "bg-rose-500/10 text-rose-500" : priority === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-slate-500/10 text-slate-500";
  return <Badge className={`rounded-full ${className}`}>{priority}</Badge>;
};

export default Notifications;
