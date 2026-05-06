import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Car, CarPayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { removeStoredCarImage, resolveCarImage, setStoredCarImage } from "@/lib/car-images";

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

  const { data: cars = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

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
  };

  const save = useMutation({
    mutationFn: async () => {
      const dailyPrice = Number(price);
      if (!name.trim()) throw new Error("Le nom est obligatoire");
      if (!Number.isFinite(dailyPrice) || dailyPrice <= 0) throw new Error("Le prix doit etre superieur a 0");

      const payload: CarPayload = {
        name: name.trim(),
        price: dailyPrice,
        image: uploadedImage ? null : imageUrl.trim() || null,
      };

      if (editing) {
        return api.put<Car>(`/cars/${editing.id}`, payload);
      }

      return api.post<Car>("/cars", payload);
    },
    onSuccess: (savedCar) => {
      if (uploadedImage) {
        setStoredCarImage(savedCar.id, uploadedImage);
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
      if (toDelete) {
        removeStoredCarImage(toDelete.id);
      }

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
          cars.map((car) => {
            const imageSrc = brokenImageIds.has(car.id) ? null : resolveCarImage(car);

            return (
              <Card key={car.id} className="overflow-hidden shadow-card border-border/60">
                <div className="aspect-[4/3] bg-secondary">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={car.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={() =>
                        setBrokenImageIds((ids) => {
                          const next = new Set(ids);
                          next.add(car.id);
                          return next;
                        })
                      }
                    />
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
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la voiture" : "Nouvelle voiture"}</DialogTitle>
            <DialogDescription>Ajoutez le nom, le prix et une image de la voiture.</DialogDescription>
          </DialogHeader>
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
              <Label htmlFor="car-image">Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  key={imageInputKey}
                  id="car-image"
                  type="file"
                  accept="image/*"
                  disabled={isImageProcessing}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
                {isImageProcessing ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
              </div>
              {imageUrl && (
                <div className="space-y-2">
                  <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full rounded-md object-cover" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || isImageProcessing}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isImageProcessing ? "Preparation..." : "Enregistrer"}
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
