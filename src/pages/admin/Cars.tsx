import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isWithinInterval, parseISO } from "date-fns";
import { api, Booking, Car, CarPayload } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Fuel, Gauge, ImagePlus, Loader2, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeStoredCarImage, resolveCarImage, setStoredCarImages } from "@/lib/car-images";

type FleetStatus = "Disponible" | "Louee";

type CarSpecs = {
  transmission: string;
  fuel: string;
  status: FleetStatus;
};

const inferCarSpecs = (car: Car, occupiedCarIds: Set<number>): CarSpecs => {
  const normalized = car.name.toLowerCase();
  const transmission = normalized.includes("auto") || normalized.includes("automatic") || normalized.includes("bmw") || normalized.includes("mercedes") || normalized.includes("range")
    ? "Automatique"
    : "Manuelle";
  const fuel = normalized.includes("diesel") || normalized.includes("dci") || normalized.includes("logan") || normalized.includes("dacia")
    ? "Diesel"
    : normalized.includes("hybride") || normalized.includes("hybrid")
      ? "Hybride"
      : "Essence";

  return {
    transmission,
    fuel,
    status: occupiedCarIds.has(car.id) ? "Louee" : "Disponible",
  };
};

const statusClassName = (status: FleetStatus) =>
  status === "Disponible"
    ? "border-primary/40 bg-primary/10 text-primary"
    : "border-slate-400/30 bg-slate-950/10 text-slate-600 dark:text-slate-300";

const compressImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Impossible de preparer l'image"));
        return;
      }

      let maxSize = 900;
      let quality = 0.75;
      let dataUrl = "";

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= 90000) break;
        maxSize = Math.max(360, Math.round(maxSize * 0.8));
        quality = Math.max(0.45, quality - 0.08);
      }

      resolve(dataUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de charger l'image"));
    };

    image.src = objectUrl;
  });

const Cars = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<number>>(() => new Set());
  const [toDelete, setToDelete] = useState<Car | null>(null);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("all");
  const { query: globalSearch } = useAdminSearch();

  const { data: cars = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => api.get<Booking[]>("/bookings"),
  });

  const occupiedCarIds = useMemo(() => {
    const today = new Date();
    return new Set(
      bookings
        .filter((booking) => {
          if (!booking.car?.id) return false;
          return isWithinInterval(today, {
            start: parseISO(booking.startDate),
            end: parseISO(booking.endDate),
          });
        })
        .map((booking) => booking.car!.id)
    );
  }, [bookings]);

  const filteredCars = useMemo(() => {
    const combined = [search, globalSearch].filter(Boolean).join(" ").toLowerCase().trim();

    return cars.filter((car) => {
      const specs = inferCarSpecs(car, occupiedCarIds);
      const matchesSearch =
        !combined ||
        car.name.toLowerCase().includes(combined) ||
        specs.transmission.toLowerCase().includes(combined) ||
        specs.fuel.toLowerCase().includes(combined) ||
        specs.status.toLowerCase().includes(combined);
      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && specs.status === "Disponible") ||
        (availability === "rented" && specs.status === "Louee");

      return matchesSearch && matchesAvailability;
    });
  }, [availability, cars, occupiedCarIds, search, globalSearch]);

  const reset = () => {
    setEditing(null);
    setName("");
    setPrice("");
    setImageUrl("");
    setUploadedImage(null);
    setImageInputKey((key) => key + 1);
    setIsImageProcessing(false);
  };

  const openNew = () => {
    reset();
    setOpen(true);
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez un fichier image");
      return;
    }

    setIsImageProcessing(true);
    try {
      const compressedImage = await compressImage(file);
      setImageUrl(compressedImage);
      setUploadedImage(compressedImage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de charger l'image");
    } finally {
      setIsImageProcessing(false);
    }
  };

  const openEdit = (car: Car) => {
    setEditing(car);
    setName(car.name);
    setPrice(String(car.price));
    setImageUrl(resolveCarImage(car) ?? "");
    setUploadedImage(null);
    setOpen(true);
  };

  const invalidateCars = () => {
    qc.invalidateQueries({ queryKey: ["admin-cars"] });
    qc.invalidateQueries({ queryKey: ["admin-cars-count"] });
    qc.invalidateQueries({ queryKey: ["public-cars"] });
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
        images: imageUrl.trim() ? [imageUrl.trim()] : null,
      };

      if (editing) return api.put<Car>(`/cars/${editing.id}`, payload);
      return api.post<Car>("/cars", payload);
    },
    onSuccess: (savedCar) => {
      if (uploadedImage) {
        setStoredCarImages(savedCar.id, [uploadedImage]);
        setBrokenImageIds((ids) => {
          const next = new Set(ids);
          next.delete(savedCar.id);
          return next;
        });
      } else if (!imageUrl.trim()) {
        removeStoredCarImage(savedCar.id);
      }

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
      if (toDelete) removeStoredCarImage(toDelete.id);
      toast.success("Voiture supprimee");
      invalidateCars();
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Suppression echouee"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-gradient-to-br from-[#0B1F3A] to-[#061426] p-5 text-white shadow-elegant md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Fleet Management</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight">Luxury Vehicle Collection</h2>
          <p className="mt-1 text-sm text-white/65">Premium inventory, image previews, and live availability status.</p>
        </div>
        <Button onClick={openNew} className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" /> Ajouter une voiture
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une voiture..." className="h-11 rounded-2xl pl-9" />
        </div>
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger className="h-11 rounded-2xl">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les voitures</SelectItem>
            <SelectItem value="available">Disponibles</SelectItem>
            <SelectItem value="rented">Louees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Impossible de charger les voitures."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[23rem] rounded-3xl" />)
        ) : filteredCars.length === 0 ? (
          <Card className="border-dashed sm:col-span-2 xl:col-span-3">
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="font-medium">Aucune voiture trouvee</p>
              <p className="text-sm text-muted-foreground">Ajustez les filtres ou ajoutez une nouvelle voiture.</p>
            </CardContent>
          </Card>
        ) : (
          filteredCars.map((car) => {
            const imageSrc = brokenImageIds.has(car.id) ? null : resolveCarImage(car);
            const specs = inferCarSpecs(car, occupiedCarIds);

            return (
              <Card key={car.id} className="group overflow-hidden rounded-3xl border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
                <div className="relative aspect-[16/10] overflow-hidden bg-[#0B1F3A]">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={car.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={() =>
                        setBrokenImageIds((ids) => {
                          const next = new Set(ids);
                          next.add(car.id);
                          return next;
                        })
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Aucune image</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#061426]/85 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white backdrop-blur">N1 Lux Fleet</div>
                </div>

                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-lg font-semibold tracking-tight">{car.name}</h3>
                      <p className="mt-1 text-sm font-medium text-primary">{car.price} DH / jour</p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 rounded-full px-3 py-1 ${statusClassName(specs.status)}`}>
                      {specs.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Spec icon={Gauge} label={specs.transmission} />
                    <Spec icon={Fuel} label={specs.fuel} />
                  </div>

                  <div className="flex gap-2 border-t border-border/60 pt-4">
                    <Button variant="outline" size="sm" className="flex-1 rounded-2xl" onClick={() => openEdit(car)}>
                      <Pencil className="mr-1.5 h-4 w-4" /> Modifier
                    </Button>
                    <Button variant="destructive" size="icon" className="rounded-2xl" onClick={() => setToDelete(car)} aria-label={`Supprimer ${car.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la voiture" : "Nouvelle voiture"}</DialogTitle>
            <DialogDescription>Ajoutez le nom, le prix par jour et une image de la voiture.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="car-name">Nom</Label>
              <Input id="car-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dacia Logan" className="rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="car-price">Prix par jour (DH)</Label>
              <Input id="car-price" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" className="rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="car-image">Image</Label>
              <div className="flex items-center gap-3">
                <Input key={imageInputKey} id="car-image" type="file" accept="image/*" disabled={isImageProcessing} onChange={(e) => handleImageUpload(e.target.files?.[0])} className="rounded-2xl" />
                {isImageProcessing ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" /> : <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" />}
              </div>
              {imageUrl && (
                <div className="space-y-2">
                  <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full rounded-2xl object-cover" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => {
                      setImageUrl("");
                      setUploadedImage(null);
                    }}
                  >
                    Retirer l'image
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-2xl">Annuler</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || isImageProcessing} className="rounded-2xl">
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isImageProcessing ? "Preparation..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(isOpen) => !isOpen && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette voiture ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irreversible et retirera aussi son image locale.</AlertDialogDescription>
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

const Spec = ({ icon: Icon, label }: { icon: typeof Gauge; label: string }) => (
  <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border/70 bg-muted/45 px-3 py-2 text-muted-foreground">
    <Icon className="h-4 w-4 shrink-0 text-primary" />
    <span className="truncate">{label}</span>
  </div>
);

export default Cars;
