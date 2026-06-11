import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { parseISO, format } from "date-fns";
import { useNavigate } from "react-router-dom";

type Booking = any;

export const RecentReservations: React.FC<{ bookings: Booking[] }> = ({ bookings = [] }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "past">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    const now = new Date();
    return bookings.filter((b) => {
      try {
        const start = parseISO(b.startDate);
        const end = parseISO(b.endDate);
        if (filter === "active") return now >= start && now <= end;
        if (filter === "upcoming") return start > now;
        return end < now;
      } catch (e) {
        return false;
      }
    });
  }, [bookings, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const formatDate = (d?: string) => (d ? format(parseISO(d), "dd MMM yyyy") : "-");

  return (
    <div className="rounded-lg border border-white/10 bg-card/90 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Filtrer :</span>
          <div className="flex gap-2">
            <Button size="sm" variant={filter === "all" ? "secondary" : "ghost"} onClick={() => { setFilter("all"); setPage(1); }}>Tous</Button>
            <Button size="sm" variant={filter === "active" ? "secondary" : "ghost"} onClick={() => { setFilter("active"); setPage(1); }}>Actifs</Button>
            <Button size="sm" variant={filter === "upcoming" ? "secondary" : "ghost"} onClick={() => { setFilter("upcoming"); setPage(1); }}>A venir</Button>
            <Button size="sm" variant={filter === "past" ? "secondary" : "ghost"} onClick={() => { setFilter("past"); setPage(1); }}>Terminés</Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} résultats</div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Prise en charge</TableHead>
              <TableHead>Retour</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((b) => (
              <TableRow key={b.id} className="hover:!bg-[#07142a]">
                <TableCell>
                  <div className="text-sm font-semibold">{b.customerName ?? b.customer?.name ?? b.phone}</div>
                  <div className="text-xs text-muted-foreground">{b.phone ?? b.email}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{b.car?.name ?? b.car?.model ?? "Véhicule"}</div>
                  <div className="text-xs text-muted-foreground">{b.car?.brand}</div>
                </TableCell>
                <TableCell>{formatDate(b.startDate)}</TableCell>
                <TableCell>{formatDate(b.endDate)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isWithin(b) ? "bg-emerald-600/80 text-white" : isUpcoming(b) ? "bg-amber-500/80 text-white" : "bg-slate-700/80 text-white"}`}>
                    {statusLabel(b)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/bookings`)}>Voir</Button>
                    <Button size="sm" onClick={() => navigate(`/admin/bookings/${b.id}`)}>Modifier</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Aucune réservation trouvée.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Préc</Button>
          <Button size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Suiv</Button>
        </div>
      </div>
    </div>
  );
};

const isWithin = (b: any) => {
  try {
    const now = new Date();
    const start = parseISO(b.startDate);
    const end = parseISO(b.endDate);
    return now >= start && now <= end;
  } catch (e) {
    return false;
  }
};

const isUpcoming = (b: any) => {
  try {
    const now = new Date();
    const start = parseISO(b.startDate);
    return start > now;
  } catch (e) {
    return false;
  }
};

const statusLabel = (b: any) => {
  if (isWithin(b)) return "Confirmée";
  if (isUpcoming(b)) return "En attente";
  return "Terminée";
};

export default RecentReservations;
