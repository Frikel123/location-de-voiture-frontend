import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAfter, isBefore, isWithinInterval, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { api, Booking, BookingPayload, Car, Contract } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarPlus, ChevronLeft, ChevronRight, Eye, Loader2, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStatus = (booking: Booking) => {
  const today = new Date();
  const start = parseISO(booking.startDate);
  const end = parseISO(booking.endDate);
  if (isBefore(end, today)) return "Terminee";
  if (isWithinInterval(today, { start, end })) return "Confirmee";
  if (isAfter(start, today)) return "En attente";
  return "Annulee";
};

type SortKey = "date" | "client" | "price";

const Bookings = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date");
  const { query: globalSearch } = useAdminSearch();
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Booking | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [carId, setCarId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const todayKey = getTodayKey();
  const pageSize = 8;

  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-bookings-list"],
    queryFn: () => api.get<Booking[]>("/bookings"),
  });

  const { data: cars = [], isLoading: carsLoading } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["admin-contracts-list"],
    queryFn: () => api.get<Contract[]>("/contracts"),
  });

  const invalidateBookings = () => {
    qc.invalidateQueries({ queryKey: ["admin-bookings-list"] });
    qc.invalidateQueries({ queryKey: ["admin-bookings"] });
  };

  const downloadCsv = (data: Booking[]) => {
    const headers = ["ID", "Client", "Telephone", "Voiture", "Date debut", "Date fin", "Prix", "Status"];
    const rows = data.map((booking) => [
      booking.id,
      booking.customerName,
      booking.phone,
      booking.car?.name ?? "-",
      booking.startDate,
      booking.endDate,
      booking.totalPrice,
      getStatus(booking),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nayscar_reservations_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setEditing(null);
    setCarId("");
    setCustomerName("");
    setPhone("");
    setStartDate("");
    setEndDate("");
  };

  const openNew = () => {
    resetForm();
    setCarId(cars[0]?.id ? String(cars[0].id) : "");
    setFormOpen(true);
  };

  const openEdit = (booking: Booking) => {
    setEditing(booking);
    setCarId(booking.car?.id ? String(booking.car.id) : "");
    setCustomerName(booking.customerName);
    setPhone(booking.phone);
    setStartDate(booking.startDate);
    setEndDate(booking.endDate);
    setFormOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const selectedCarId = Number(carId);
      if (!Number.isFinite(selectedCarId) || selectedCarId <= 0) throw new Error("Choisissez une voiture");
      if (!customerName.trim()) throw new Error("Le nom du client est obligatoire");
      if (!phone.trim()) throw new Error("Le telephone est obligatoire");
      if (!startDate || !endDate) throw new Error("Les dates sont obligatoires");
      if (!editing && startDate < todayKey) throw new Error("La date de debut ne peut pas etre avant aujourd'hui");
      if (endDate <= startDate) throw new Error("La date de fin doit etre apres la date de debut");

      const payload: BookingPayload = { carId: selectedCarId, customerName: customerName.trim(), phone: phone.trim(), startDate, endDate };
      if (editing) return api.put<Booking>(`/bookings/${editing.id}`, payload);
      return api.post<Booking>("/bookings", payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Reservation mise a jour" : "Reservation ajoutee");
      invalidateBookings();
      setFormOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Operation echouee"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete<{ message: string }>(`/bookings/${id}`),
    onSuccess: () => {
      toast.success("Reservation supprimee");
      invalidateBookings();
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Suppression echouee"),
  });

  const filtered = useMemo(() => {
    const combined = [search, globalSearch].filter(Boolean).join(" ").toLowerCase().trim();
    const result = bookings.filter((booking) => {
      const matchesSearch =
        !combined ||
        booking.customerName.toLowerCase().includes(combined) ||
        booking.phone.includes(combined) ||
        booking.car?.name.toLowerCase().includes(combined);
      const matchesStatus = statusFilter === "all" || getStatus(booking) === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sort === "client") return a.customerName.localeCompare(b.customerName);
      if (sort === "price") return Number(b.totalPrice) - Number(a.totalPrice);
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [bookings, search, sort, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedContract = selected ? contracts.find((contract) => Number(contract.bookingId) === selected.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 rounded-full">Operations</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">Reservations</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recherche, tri, filtres et gestion complete des demandes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => downloadCsv(filtered)} className="rounded-2xl">
            Exporter CSV
          </Button>
          <Button onClick={openNew} disabled={carsLoading || cars.length === 0} className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Impossible de charger les reservations."}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 shadow-card">
        <CardHeader className="gap-4">
          <CardTitle className="flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-primary" /> Table reservations</CardTitle>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher nom, telephone ou voiture..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-11 rounded-2xl pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les status</SelectItem>
                <SelectItem value="Confirmee">Confirmee</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="Terminee">Terminee</SelectItem>
                <SelectItem value="Annulee">Annulee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger className="h-11 rounded-2xl"><SlidersHorizontal className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Trier par date</SelectItem>
                <SelectItem value="client">Trier par client</SelectItem>
                <SelectItem value="price">Trier par prix</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border">
            {isLoading ? (
              <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Client</TableHead>
                    <TableHead>Voiture</TableHead>
                    <TableHead>Telephone</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((booking, index) => (
                    <motion.tr key={booking.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.025 }} className="border-b transition-colors hover:bg-muted/45">
                      <TableCell className="font-medium">{booking.customerName}</TableCell>
                      <TableCell>{booking.car?.name ?? "-"}</TableCell>
                      <TableCell>{booking.phone}</TableCell>
                      <TableCell className="min-w-[190px] text-muted-foreground">{booking.startDate} - {booking.endDate}</TableCell>
                      <TableCell className="font-semibold">{booking.totalPrice} DH</TableCell>
                      <TableCell><StatusBadge status={getStatus(booking)} /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelected(booking)} aria-label="Voir details"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(booking)} aria-label="Modifier reservation"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setToDelete(booking)} aria-label="Supprimer reservation"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center text-muted-foreground">Aucune reservation ne correspond aux filtres.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{filtered.length} reservation(s) trouvee(s)</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span>Page {currentPage} / {pageCount}</span>
              <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(isOpen) => { setFormOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? "Modifier la reservation" : "Nouvelle reservation"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="booking-car">Voiture</Label>
              <select id="booking-car" value={carId} onChange={(e) => setCarId(e.target.value)} className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm">
                <option value="" disabled>Choisir une voiture</option>
                {cars.map((car) => <option key={car.id} value={car.id}>{car.name} - {car.price} DH/jour</option>)}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="booking-name" label="Client" value={customerName} onChange={setCustomerName} placeholder="Mostafa" />
              <Field id="booking-phone" label="Telephone" value={phone} onChange={setPhone} placeholder="0612345678" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-start">Date debut</Label>
                <Input id="booking-start" type="date" min={editing ? undefined : todayKey} value={startDate} onChange={(e) => { setStartDate(e.target.value); if (endDate && endDate <= e.target.value) setEndDate(""); }} className="rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-end">Date fin</Label>
                <Input id="booking-end" type="date" min={startDate || todayKey} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-2xl">Annuler</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-2xl">
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(isOpen) => !isOpen && setSelected(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Details reservation</DialogTitle></DialogHeader>
          {selected && (
            <div className="grid gap-3 text-sm">
              <Detail label="Client" value={selected.customerName} />
              <Detail label="Telephone" value={selected.phone} />
              <Detail label="Voiture" value={selected.car?.name ?? "-"} />
              <Detail label="Dates" value={`${selected.startDate} - ${selected.endDate}`} />
              <Detail label="Status" value={getStatus(selected)} />
              <Detail label="Contrat" value={selectedContract?.contractNumber ?? "Non genere"} />
              <Detail
                label="Signature"
                value={selectedContract?.signatureStatus === "signed" || selectedContract?.status === "Signé" ? "Contrat signe" : "Non signe"}
              />
              {selectedContract?.signedAt && <Detail label="Date signature" value={selectedContract.signedAt} />}
              {selectedContract?.signatureIp && <Detail label="IP client" value={selectedContract.signatureIp} />}
              <Detail label="Prix total" value={`${selected.totalPrice} DH`} strong />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(isOpen) => !isOpen && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette reservation ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irreversible et retirera la reservation de la liste.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove.mutate(toDelete.id)} disabled={remove.isPending}>
              {remove.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Field = ({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-2xl" />
  </div>
);

const Detail = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/30 p-3">
    <span className="text-muted-foreground">{label}</span>
    <span className={strong ? "font-semibold text-primary" : "font-medium"}>{value}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const className =
    status === "Confirmee"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
      : status === "En attente"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
        : status === "Terminee"
          ? "border-slate-500/20 bg-slate-500/10 text-slate-600"
          : "border-red-500/20 bg-red-500/10 text-red-600";

  return <Badge variant="outline" className={`rounded-full ${className}`}>{status}</Badge>;
};

export default Bookings;
