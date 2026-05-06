import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Car, CarPayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const Cars = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [toDelete, setToDelete] = useState<Car | null>(null);

  const { data: cars = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

  const reset = () => {
    setEditing(null);
    setName("");
    setPrice("");
    setImageUrl("");
  };

  const openNew = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (car: Car) => {
    setEditing(car);
    setName(car.name);
    setPrice(String(car.price));
    setImageUrl(car.image ?? "");
    setOpen(true);
  };

  const invalidateCars = () => {
    qc.invalidateQueries({ queryKey: ["admin-cars"] });
    qc.invalidateQueries({ queryKey: ["admin-cars-count"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const dailyPrice = Number(price);
      if (!name.trim()) throw new Error("Le nom est obligatoire");
      if (!Number.isFinite(dailyPrice) || dailyPrice <= 0) throw new Error("Le prix doit etre superieur a 0");

      const payload: CarPayload = {
        name: name.trim(),
        price: dailyPrice,
        image: imageUrl.trim() || null,
      };

      if (editing) {
        return api.put<Car>(`/cars/${editing.id}`, payload);
      }

      return api.post<Car>("/cars", payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Voiture mise a jour" : "Voiture ajoutee");
      invalidateCars();
      setOpen(false);
      reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Operation echouee"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete<{ message: string }>(`/cars/${id}`),
    onSuccess: () => {
      toast.success("Voiture supprimee");
      invalidateCars();
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Suppression echouee"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Voitures</h1>
          <p className="text-muted-foreground text-sm">Gerez votre flotte</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Ajouter</Button>
      </div>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Impossible de charger les voitures."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)
        ) : cars.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">Aucune voiture pour le moment.</CardContent>
          </Card>
        ) : (
          cars.map((car) => (
            <Card key={car.id} className="overflow-hidden shadow-card border-border/60">
              <div className="aspect-[4/3] bg-secondary">
                {car.image ? (
                  <img src={car.image} alt={car.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Aucune image</div>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold truncate">{car.name}</h3>
                  <span className="font-bold text-primary whitespace-nowrap">{car.price} DH</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(car)}>
                    <Pencil className="h-4 w-4 mr-1" /> Modifier
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setToDelete(car)} aria-label={`Supprimer ${car.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier la voiture" : "Nouvelle voiture"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="car-name">Nom</Label>
              <Input id="car-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dacia Logan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="car-price">Prix par jour (DH)</Label>
              <Input id="car-price" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="car-image">Image (URL)</Label>
              <Input id="car-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="http://localhost:3000/uploads/clio.jpg" />
              {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full rounded-md object-cover" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(isOpen) => !isOpen && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette voiture ?</AlertDialogTitle>
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

export default Cars;
