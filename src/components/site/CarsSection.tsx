import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Armchair, CalendarDays, Eye, Fuel, Gauge, MessageCircle, Sparkles, SlidersHorizontal } from "lucide-react";
import { api, Car } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const getCategory = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("suv") || lower.includes("cross") || lower.includes("cargo")) return "SUV";
  if (lower.includes("logan") || lower.includes("clio") || lower.includes("i10") || lower.includes("compact")) return "Compact";
  return "Sedan";
};

const getTransmission = (name: string) => (name.toLowerCase().includes("manual") ? "Manual" : "Automatic");

const getFuel = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("diesel")) return "Diesel";
  if (lower.includes("hybrid")) return "Hybrid";
  return "Petrol";
};

const daysBetween = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  return diff;
};

export const CarsSection = () => {
  const { language, t } = useI18n();
  const isFr = language === "fr";
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [brandFilter, setBrandFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [transmissionFilter, setTransmissionFilter] = useState("All");
  const [sortBy, setSortBy] = useState("priceAsc");
  const [priceMax, setPriceMax] = useState(1200);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  const { data: cars, isLoading } = useQuery({
    queryKey: ["public-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

  const brands = useMemo(() => {
    if (!cars) return ["All"];
    return ["All", ...Array.from(new Set(cars.map((car) => car.name.split(" ")[0])))];
  }, [cars]);

  const categories = useMemo(() => ["All", "Compact", "Sedan", "SUV"], []);
  const transmissions = useMemo(() => ["All", "Automatic", "Manual"], []);

  const maxPrice = useMemo(() => {
    if (!cars) return 1200;
    return Math.max(...cars.map((car) => car.price), 1200);
  }, [cars]);

  const filteredCars = useMemo(() => {
    if (!cars) return [];
    return cars
      .filter((car) => brandFilter === "All" || car.name.startsWith(brandFilter))
      .filter((car) => categoryFilter === "All" || getCategory(car.name) === categoryFilter)
      .filter((car) => transmissionFilter === "All" || getTransmission(car.name) === transmissionFilter)
      .filter((car) => car.price <= priceMax)
      .sort((a, b) => {
        if (sortBy === "priceAsc") return a.price - b.price;
        if (sortBy === "priceDesc") return b.price - a.price;
        return a.name.localeCompare(b.name);
      });
  }, [cars, brandFilter, categoryFilter, transmissionFilter, priceMax, sortBy]);

  const rentalDays = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const totalPrice = selectedCar ? Number(selectedCar.price) * rentalDays : 0;

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
            {isFr ? "Flotte premium" : language === "de" ? "Premium-Flotte" : "Premium fleet"}
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">{t("cars.title")}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">{t("cars.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-background/70 p-5 shadow-card backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{isFr ? "Filtrer votre recherche" : language === "de" ? "Suche filtern" : "Filter your search"}</p>
              <p>{isFr ? "Choisissez marque, prix, transmission et style premium." : language === "de" ? "Wählen Sie Marke, Preis, Getriebe und Premium-Stil." : "Choose brand, price, transmission and premium style."}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {filteredCars.length} {isFr ? "voitures" : language === "de" ? "Fahrzeuge" : "cars"}
              </span>
              <span className="rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                {isFr ? "Prix max" : language === "de" ? "Max-Preis" : "Max price"}: {priceMax} DH
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>{isFr ? "Marque" : language === "de" ? "Marke" : "Brand"}</span>
                <select
                  className="h-12 w-full rounded-2xl border border-border/80 bg-background px-4 text-foreground outline-none"
                  value={brandFilter}
                  onChange={(event) => setBrandFilter(event.target.value)}
                >
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>{isFr ? "Catégorie" : language === "de" ? "Kategorie" : "Category"}</span>
                <select
                  className="h-12 w-full rounded-2xl border border-border/80 bg-background px-4 text-foreground outline-none"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>{isFr ? "Transmission" : language === "de" ? "Getriebe" : "Transmission"}</span>
                <select
                  className="h-12 w-full rounded-2xl border border-border/80 bg-background px-4 text-foreground outline-none"
                  value={transmissionFilter}
                  onChange={(event) => setTransmissionFilter(event.target.value)}
                >
                  {transmissions.map((transmission) => (
                    <option key={transmission} value={transmission}>
                      {transmission}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>{isFr ? "Trier par" : language === "de" ? "Sortieren nach" : "Sort by"}</span>
                <select
                  className="h-12 w-full rounded-2xl border border-border/80 bg-background px-4 text-foreground outline-none"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="priceAsc">{isFr ? "Prix croissant" : language === "de" ? "Preis aufsteigend" : "Price ascending"}</option>
                  <option value="priceDesc">{isFr ? "Prix décroissant" : language === "de" ? "Preis absteigend" : "Price descending"}</option>
                  <option value="name">{isFr ? "Nom" : language === "de" ? "Name" : "Name"}</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>{isFr ? "Prix maximum" : language === "de" ? "Maximaler Preis" : "Maximum price"}</span>
                <input
                  type="range"
                  min={100}
                  max={maxPrice}
                  step={50}
                  value={priceMax}
                  onChange={(event) => setPriceMax(Number(event.target.value))}
                  className="h-2 w-full accent-primary"
                />
                <div className="text-xs text-white/70">{priceMax} DH</div>
              </label>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[450px] rounded-3xl" />)
            : filteredCars.map((car, index) => {
                const carImages = resolveCarImages(car);
                const mainImage = carImages[0] || fallbackImage(car.name);
                const fuel = getFuel(car.name);
                const transmission = getTransmission(car.name);
                const category = getCategory(car.name);

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
                          <Badge className="rounded-full bg-background/90 text-foreground backdrop-blur">{isFr ? "Disponible" : language === "de" ? "Verfügbar" : "Available"}</Badge>
                          <Badge variant="outline" className="rounded-full border-white/30 bg-black/30 text-white backdrop-blur">
                            {transmission}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-semibold tracking-tight">{car.name}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {category} • {fuel} • {isFr ? "Climatisation" : language === "de" ? "Klimaanlage" : "Air conditioning"}
                            </p>
                          </div>
                          <span className="rounded-3xl bg-primary/10 px-4 py-3 text-right text-primary">
                            <span className="block text-2xl font-bold">{Number(car.price)}</span>
                            <span className="text-xs text-muted-foreground">{t("cars.perDay")}</span>
                          </span>
                        </div>

                        <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                          <div className="rounded-2xl bg-secondary/70 px-3 py-3 text-center">
                            <Gauge className="mx-auto mb-2 h-4 w-4" />
                            {transmission}
                          </div>
                          <div className="rounded-2xl bg-secondary/70 px-3 py-3 text-center">
                            <Fuel className="mx-auto mb-2 h-4 w-4" />
                            {fuel}
                          </div>
                          <div className="rounded-2xl bg-secondary/70 px-3 py-3 text-center">
                            <Armchair className="mx-auto mb-2 h-4 w-4" />
                            {isFr ? "5 places" : language === "de" ? "5 Sitze" : "5 seats"}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                          <Button asChild className="rounded-2xl">
                            <a href={waLink(t("wa.reserveCar", { car: car.name, price: car.price }))} target="_blank" rel="noopener">
                              <MessageCircle className="mr-2 h-4 w-4" />
                              {t("cars.book")}
                            </a>
                          </Button>
                          <Button type="button" variant="outline" size="icon" className="rounded-2xl" onClick={() => setSelectedCar(car)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">{isFr ? "Voir détails" : language === "de" ? "Details ansehen" : "View details"}</span>
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
          <DialogContent className="max-w-5xl overflow-hidden rounded-3xl border-border/70 p-0">
            <div className="grid min-w-0 md:grid-cols-[1fr_0.9fr]">
              <CarImageSlider
                images={resolveCarImages(selectedCar).length ? resolveCarImages(selectedCar) : [fallbackImage(selectedCar.name)]}
                alt={selectedCar.name}
                fallbackImage={fallbackImage(selectedCar.name)}
                className="w-full min-h-[320px] max-h-[520px] md:max-h-[620px]"
              />
              <div className="p-6 min-w-0">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedCar.name}</DialogTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isFr ? "Choisissez les dates pour estimer le prix instantanément." : language === "de" ? "Wählen Sie die Daten, um den Preis sofort zu schätzen." : "Choose dates to estimate the price instantly."}
                  </p>
                </DialogHeader>

                <div className="mt-6 grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium">
                      <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{isFr ? "Date départ" : language === "de" ? "Abholdatum" : "Pickup date"}</span>
                      <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{isFr ? "Date retour" : language === "de" ? "Rückgabedatum" : "Return date"}</span>
                      <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                    </label>
                  </div>

                  <div className="rounded-3xl border border-primary/15 bg-primary/10 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{isFr ? "Prix estimé" : language === "de" ? "Geschätzter Preis" : "Estimated price"}</p>
                        <p className="mt-1 text-3xl font-bold text-primary">{totalPrice} DH</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{rentalDays} {isFr ? "jour(s)" : language === "de" ? "Tag(e)" : "day(s)"}</p>
                        <p>{selectedCar.price} DH{t("cars.perDay")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {isFr
                      ? "Pack premium : assistance, assurance et vérification disponibles."
                      : language === "de"
                      ? "Premium-Paket: Unterstützung, Versicherung und Überprüfung verfügbar."
                      : "Premium package: support, insurance and verification available."}
                  </div>

                  <Button asChild size="lg" className="rounded-2xl">
                    <a
                      href={waLink(
                        `${isFr ? "Bonjour Atlas Cars, je souhaite réserver" : language === "de" ? "Hallo Atlas Cars, ich möchte buchen" : "Hello Atlas Cars, I would like to book"} ${selectedCar.name}. ${isFr ? "Dates" : language === "de" ? "Daten" : "Dates"}: ${startDate} - ${endDate}. ${isFr ? "Prix estimé" : language === "de" ? "Geschätzter Preis" : "Estimated price"}: ${totalPrice} DH.`,
                      )}
                      target="_blank"
                      rel="noopener"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      {isFr ? "Réserver via WhatsApp" : language === "de" ? "Per WhatsApp buchen" : "Book via WhatsApp"}
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
