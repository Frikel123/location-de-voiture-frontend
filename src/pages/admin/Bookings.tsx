import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Booking, BookingPayload, Car } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Bookings = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
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

  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-bookings-list"],
    queryFn: () => api.get<Booking[]>("/bookings"),
  });

  const { data: cars = [], isLoading: carsLoading } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

  const invalidateBookings = () => {
    qc.invalidateQueries({ queryKey: ["admin-bookings-list"] });
    qc.invalidateQueries({ queryKey: ["admin-bookings"] });
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
      if (startDate < todayKey) throw new Error("La date de debut ne peut pas etre avant aujourd'hui");
      if (endDate <= startDate) throw new Error("La date de fin doit etre apres la date de debut");

      const payload: BookingPayload = {
        carId: selectedCarId,
        customerName: customerName.trim(),
        phone: phone.trim(),
        startDate,
        endDate,
      };

      if (editing) {
        return api.put<Booking>(`/bookings/${editing.id}`, payload);
      }

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
    const value = search.toLowerCase().trim();
    if (!value) return bookings;

    return bookings.filter((booking) =>
      booking.customerName.toLowerCase().includes(value) ||
      booking.phone.includes(value) ||
      booking.car?.name.toLowerCase().includes(value)
    );
  }, [bookings, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="text-muted-foreground text-sm">Gerez les demandes de location</p>
        </div>
        <Button onClick={openNew} disabled={carsLoading || cars.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter
        </Button>
      </div>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Impossible de charger les reservations."}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
            <span>Toutes les reservations</span>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher nom, telephone ou voiture..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Telephone</TableHead>
                  <TableHead>Voiture</TableHead>
                  <TableHead>Du</TableHead>
                  <TableHead>Au</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="w-[136px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.customerName}</TableCell>
                    <TableCell>{booking.phone}</TableCell>
                    <TableCell>{booking.car?.name ?? "-"}</TableCell>
                    <TableCell>{booking.startDate}</TableCell>
                    <TableCell>{booking.endDate}</TableCell>
                    <TableCell className="text-right font-semibold">{booking.totalPrice} DH</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelected(booking)} aria-label="Voir details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(booking)} aria-label="Modifier reservation">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setToDelete(booking)} aria-label="Supprimer reservation">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">Aucune reservation.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(isOpen) => {
        setFormOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier la reservation" : "Nouvelle reservation"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="booking-car">Voiture</Label>
              <select
                id="booking-car"
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>Choisir une voiture</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>{car.name} - {car.price} DH/jour</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-name">Client</Label>
              <Input id="booking-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Mostafa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-phone">Telephone</Label>
              <Input id="booking-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0612345678" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-start">Date debut</Label>
                <Input
                  id="booking-start"
                  type="date"
                  min={todayKey}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && endDate <= e.target.value) setEndDate("");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-end">Date fin</Label>
                <Input
                  id="booking-end"
                  type="date"
                  min={startDate || todayKey}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(isOpen) => !isOpen && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Details reservation</DialogTitle></DialogHeader>
          {selected && (
            <div className="grid gap-3 text-sm">
              <Detail label="Client" value={selected.customerName} />
              <Detail label="Telephone" value={selected.phone} />
              <Detail label="Voiture" value={selected.car?.name ?? "-"} />
              <Detail label="Date debut" value={selected.startDate} />
              <Detail label="Date fin" value={selected.endDate} />
              <Detail label="Prix total" value={`${selected.totalPrice} DH`} strong />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(isOpen) => !isOpen && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette reservation ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irreversible.</AlertDialogDescription>
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

const Detail = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
    <span className="text-muted-foreground">{label}</span>
    <span className={strong ? "font-semibold text-primary" : "font-medium"}>{value}</span>
  </div>
);

export default Bookings;
