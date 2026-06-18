import React, { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Booking = any;
type BookingFilter = "all" | "active" | "upcoming" | "past";
type ReservationStatus = "confirmed" | "pending" | "cancelled" | "completed";

const statusStyles: Record<ReservationStatus, string> = {
  confirmed: "admin-status-confirmed",
  pending: "admin-status-pending",
  cancelled: "admin-status-cancelled",
  completed: "admin-status-completed",
};

const statusLabels: Record<ReservationStatus, string> = {
  confirmed: "Confirmée",
  pending: "En attente",
  cancelled: "Annulée",
  completed: "Terminée",
};

const filters: Array<{ value: BookingFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Confirmées" },
  { value: "upcoming", label: "En attente" },
  { value: "past", label: "Terminées" },
];

export const RecentReservations: React.FC<{ bookings: Booking[] }> = ({ bookings = [] }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<BookingFilter>("all");
  const pageSize = 6;

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;

    return bookings.filter((booking) => {
      const status = getReservationStatus(booking);
      if (filter === "active") return status === "confirmed";
      if (filter === "upcoming") return status === "pending";
      return status === "completed" || status === "cancelled";
    });
  }, [bookings, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const formatDate = (date?: string) => (date ? format(parseISO(date), "dd MMM yyyy") : "-");

  return (
    <div className="admin-surface rounded-xl border p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Réservations</p>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={filter === item.value ? "secondary" : "ghost"}
              className="rounded-full px-4"
              onClick={() => {
                setFilter(item.value);
                setPage(1);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow className="admin-table-header">
              <TableHead className="w-[24%]">Client</TableHead>
              <TableHead className="w-[20%]">Véhicule</TableHead>
              <TableHead>Prise en charge</TableHead>
              <TableHead>Retour</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((booking) => {
              const status = getReservationStatus(booking);

              return (
                <TableRow key={booking.id} className="admin-reservation-row">
                  <TableCell>
                    <div className="text-sm font-semibold text-foreground">{booking.customerName ?? booking.customer?.name ?? booking.phone}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{booking.phone ?? booking.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">{booking.car?.name ?? booking.car?.model ?? "Véhicule"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{booking.car?.brand ?? "N1 Lux Cars"}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(booking.startDate)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(booking.endDate)}</TableCell>
                  <TableCell>
                    <Badge className={`admin-status-badge ${statusStyles[status]}`}>{statusLabels[status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="rounded-full" onClick={() => navigate("/admin/bookings")}>
                        Voir
                      </Button>
                      <Button size="sm" className="rounded-full" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                        Modifier
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-44 text-center">
                  <div className="admin-empty-state mx-auto max-w-sm">
                    <div className="admin-empty-state-visual" />
                    <p className="text-sm font-semibold text-foreground">Aucune réservation trouvée</p>
                    <p className="mt-1 text-xs text-muted-foreground">Essayez un autre filtre ou créez une nouvelle réservation.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Page <span className="font-semibold text-foreground">{page}</span> sur {totalPages}
        </div>
        <div className="admin-pagination">
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Préc.
          </Button>
          <span className="admin-pagination-count">{page}</span>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
            Suiv.
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const getReservationStatus = (booking: any): ReservationStatus => {
  const rawStatus = String(booking.status ?? booking.bookingStatus ?? "").toLowerCase();
  if (rawStatus.includes("cancel") || rawStatus.includes("annul")) return "cancelled";
  if (rawStatus.includes("complete") || rawStatus.includes("termin")) return "completed";
  if (rawStatus.includes("pending") || rawStatus.includes("attente")) return "pending";
  if (rawStatus.includes("confirm")) return "confirmed";

  try {
    const now = new Date();
    const start = parseISO(booking.startDate);
    const end = parseISO(booking.endDate);
    if (now >= start && now <= end) return "confirmed";
    if (start > now) return "pending";
    return "completed";
  } catch (error) {
    return "pending";
  }
};

export default RecentReservations;
