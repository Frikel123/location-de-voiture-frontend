import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Armchair, CalendarDays, Eye, Fuel, Gauge, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { api, Car } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";
import { resolveCarImages } from "@/lib/car-images";
import { CarImageSlider } from "@/components/CarImageSlider";
import logan from "@/assets/car-logan.jpg";
import clio from "@/assets/car-clio.jpg";
import i10 from "@/assets/car-i10.jpg";

const fallbackImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("logan")) return logan;
  if (n.includes("clio")) return clio;
  if (n.includes("i10")) return i10;
  return logan;
};

const daysBetween = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(diff, 1);
};

export const CarsSection = () => {
  const { language, t } = useI18n();
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const isFr = language === "fr";
  const { data: cars, isLoading } = useQuery({
    queryKey: ["public-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

  const rentalDays = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const totalPrice = selectedCar ? Number(selectedCar.price) * rentalDays : 0;

  const labels = {
    eyebrow: isFr ? "Flotte premium" : "Premium fleet",
    automatic: isFr ? "Automatique" : "Automatic",
    diesel: "Diesel",
    available: isFr ? "Disponible" : "Available",
    seats: isFr ? "5 places" : "5 seats",
    quickView: isFr ? "Voir details" : "Quick view",
    pickup: isFr ? "Date depart" : "Pickup date",
    return: isFr ? "Date retour" : "Return date",
    total: isFr ? "Prix estime" : "Estimated price",
    confirm: isFr ? "Confirmer via WhatsApp" : "Confirm on WhatsApp",
    modalDesc: isFr
      ? "Choisis tes dates pour calculer le prix instantanement."
      : "Choose dates to calculate your price instantly.",
  };

  return (
    <section id="voitures" className="relative overflow-hidden bg-secondary/45 py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            {labels.eyebrow}
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">{t("cars.title")}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">{t("cars.subtitle")}</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[430px] rounded-3xl" />)
            : cars?.map((car, index) => {
                const carImages = resolveCarImages(car);
                const mainImage = carImages[0] || fallbackImage(car.name);

                return (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, y: 26 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <Card className="group overflow-hidden rounded-3xl border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
                      <div className="relative">
                        <CarImageSlider
                          images={carImages.length > 0 ? carImages : [mainImage]}
                          alt={car.name}
                          fallbackImage={fallbackImage(car.name)}
                          className="aspect-[4/3]"
                        />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <Badge className="rounded-full bg-background/90 text-foreground backdrop-blur">{labels.available}</Badge>
                          <Badge variant="outline" className="rounded-full border-white/30 bg-black/30 text-white backdrop-blur">
                            {labels.automatic}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-semibold tracking-tight">{car.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {isFr ? "Compacte, propre, prete a partir" : "Clean, compact, ready to drive"}
                            </p>
                          </div>
                          <span className="rounded-2xl bg-primary/10 px-3 py-2 text-right text-primary">
                            <span className="text-xl font-bold">{Number(car.price)} DH</span>
                            <span className="block text-xs text-muted-foreground">{t("cars.perDay")}</span>
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center justify-center gap-1.5 rounded-2xl bg-secondary px-2 py-2"><Gauge className="h-4 w-4" />Auto</span>
                          <span className="flex items-center justify-center gap-1.5 rounded-2xl bg-secondary px-2 py-2"><Fuel className="h-4 w-4" />{labels.diesel}</span>
                          <span className="flex items-center justify-center gap-1.5 rounded-2xl bg-secondary px-2 py-2"><Armchair className="h-4 w-4" />{labels.seats}</span>
                        </div>

                        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                          <Button asChild className="rounded-2xl">
                            <a
                              href={waLink(t("wa.reserveCar", { car: car.name, price: car.price }))}
                              target="_blank"
                              rel="noopener"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              {t("cars.book")}
                            </a>
                          </Button>
                          <Button type="button" variant="outline" size="icon" className="rounded-2xl" onClick={() => setSelectedCar(car)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">{labels.quickView}</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
        </div>
      </div>

      <Dialog open={Boolean(selectedCar)} onOpenChange={(open) => !open && setSelectedCar(null)}>
        {selectedCar && (
          <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border-border/70 p-0">
            <div className="grid md:grid-cols-[1fr_0.9fr]">
              <CarImageSlider
                images={resolveCarImages(selectedCar).length ? resolveCarImages(selectedCar) : [fallbackImage(selectedCar.name)]}
                alt={selectedCar.name}
                fallbackImage={fallbackImage(selectedCar.name)}
                className="h-full min-h-[320px]"
              />
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedCar.name}</DialogTitle>
                  <DialogDescription>{labels.modalDesc}</DialogDescription>
                </DialogHeader>

                <div className="mt-6 grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium">
                      <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{labels.pickup}</span>
                      <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{labels.return}</span>
                      <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                    </label>
                  </div>

                  <div className="rounded-3xl border border-primary/15 bg-primary/10 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{labels.total}</p>
                        <p className="mt-1 text-3xl font-bold text-primary">{totalPrice} DH</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{rentalDays} {isFr ? "jour(s)" : "day(s)"}</p>
                        <p>{Number(selectedCar.price)} DH{t("cars.perDay")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {isFr ? "Verification de disponibilite et assurance incluses dans la confirmation." : "Availability check and insurance included in confirmation."}
                  </div>

                  <Button asChild size="lg" className="rounded-2xl">
                    <a
                      href={waLink(
                        `${t("wa.reserveCar", { car: selectedCar.name, price: selectedCar.price })} ${isFr ? "Dates" : "Dates"}: ${startDate} - ${endDate}. ${labels.total}: ${totalPrice} DH.`,
                      )}
                      target="_blank"
                      rel="noopener"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      {labels.confirm}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
};
