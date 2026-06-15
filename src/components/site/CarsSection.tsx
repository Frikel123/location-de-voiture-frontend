import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDownUp, CarFront, Check, GitCompare, Grid2X2, Heart, List, MessageCircle, Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { api, type Car } from "@/lib/api";
import { buildFleet, type Vehicle } from "@/lib/fleet";
import { waLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

type SortKey = "priceAsc" | "priceDesc" | "popular" | "newest";
type ViewMode = "grid" | "list";

const getStoredList = (key: string) => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
};

export const CarsSection = () => {
  const { language } = useI18n();
  const isFr = language === "fr";
  const [brand, setBrand] = useState("All");
  const [category, setCategory] = useState("All");
  const [transmission, setTransmission] = useState("All");
  const [fuel, setFuel] = useState("All");
  const [seats, setSeats] = useState("All");
  const [priceMax, setPriceMax] = useState(1200);
  const [sortBy, setSortBy] = useState<SortKey>("popular");
  const [view, setView] = useState<ViewMode>("grid");
  const [favorites, setFavorites] = useState<string[]>(() => getStoredList("atlas:favorites"));
  const [compare, setCompare] = useState<string[]>(() => getStoredList("atlas:compare"));
  const [recent, setRecent] = useState<string[]>(() => getStoredList("atlas:recent"));

  const { data: cars, isLoading } = useQuery({ queryKey: ["public-cars"], queryFn: () => api.get<Car[]>("/cars") });
  const fleet = useMemo(() => buildFleet(cars), [cars]);
  const maxFleetPrice = useMemo(() => Math.max(...fleet.map((car) => car.price), 1200), [fleet]);

  useEffect(() => setPriceMax(maxFleetPrice), [maxFleetPrice]);
  useEffect(() => localStorage.setItem("atlas:favorites", JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem("atlas:compare", JSON.stringify(compare)), [compare]);
  useEffect(() => localStorage.setItem("atlas:recent", JSON.stringify(recent)), [recent]);

  const options = useMemo(
    () => ({
      brands: ["All", ...Array.from(new Set(fleet.map((car) => car.brand)))],
      categories: ["All", ...Array.from(new Set(fleet.map((car) => car.category)))],
      transmissions: ["All", ...Array.from(new Set(fleet.map((car) => car.transmission)))],
      fuels: ["All", ...Array.from(new Set(fleet.map((car) => car.fuel)))],
      seats: ["All", ...Array.from(new Set(fleet.map((car) => String(car.seats))))],
    }),
    [fleet],
  );

  const filtered = useMemo(() => {
    return fleet
      .filter((car) => brand === "All" || car.brand === brand)
      .filter((car) => category === "All" || car.category === category)
      .filter((car) => transmission === "All" || car.transmission === transmission)
      .filter((car) => fuel === "All" || car.fuel === fuel)
      .filter((car) => seats === "All" || String(car.seats) === seats)
      .filter((car) => car.price <= priceMax)
      .sort((a, b) => {
        if (sortBy === "priceAsc") return a.price - b.price;
        if (sortBy === "priceDesc") return b.price - a.price;
        if (sortBy === "newest") return Number(b.isNew) - Number(a.isNew) || b.year - a.year;
        return b.popularity - a.popularity;
      });
  }, [brand, category, fleet, fuel, priceMax, seats, sortBy, transmission]);

  const featured = filtered.slice(0, 3);
  const offers = fleet.filter((car) => car.offer).slice(0, 3);
  const recentlyViewed = fleet.filter((car) => recent.includes(car.slug)).slice(0, 3);
  const recommended = fleet.filter((car) => !favorites.includes(car.slug)).sort((a, b) => b.rating - a.rating).slice(0, 3);

  const remember = (vehicle: Vehicle) => {
    setRecent((current) => [vehicle.slug, ...current.filter((slug) => slug !== vehicle.slug)].slice(0, 5));
  };

  const toggleFavorite = (slug: string) => setFavorites((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  const toggleCompare = (slug: string) => setCompare((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current.slice(-2), slug]));

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => (
    <Card className={`group overflow-hidden rounded-3xl border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant ${view === "list" ? "md:grid md:grid-cols-[320px_1fr]" : ""}`}>
      <Link to={`/${language}/cars/${vehicle.slug}`} onClick={() => remember(vehicle)} className="relative block overflow-hidden">
        <img src={vehicle.gallery[0]} alt={vehicle.name} className={`w-full object-cover transition duration-500 group-hover:scale-105 ${view === "list" ? "h-full min-h-[280px]" : "aspect-[4/3]"}`} loading="lazy" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge className="rounded-full bg-background/90 text-foreground backdrop-blur">Available</Badge>
          {vehicle.offer && <Badge className="rounded-full">{vehicle.offer}</Badge>}
        </div>
      </Link>
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">{vehicle.brand} • {vehicle.category}</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight">{vehicle.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{vehicle.transmission} • {vehicle.fuel} • {vehicle.seats} seats • {vehicle.year}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{vehicle.price}</p>
            <p className="text-sm text-muted-foreground">€/day</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {vehicle.features.slice(0, 4).map((feature) => (
            <span key={feature} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"><Check className="h-3 w-3 text-primary" />{feature}</span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-primary text-primary" />{vehicle.rating} <span className="text-muted-foreground">({vehicle.trips} trips)</span></div>
          <div className="flex gap-2">
            <Button type="button" size="icon" variant={favorites.includes(vehicle.slug) ? "default" : "outline"} className="rounded-full" onClick={() => toggleFavorite(vehicle.slug)}><Heart className="h-4 w-4" /><span className="sr-only">Favorite</span></Button>
            <Button type="button" size="icon" variant={compare.includes(vehicle.slug) ? "default" : "outline"} className="rounded-full" onClick={() => toggleCompare(vehicle.slug)}><GitCompare className="h-4 w-4" /><span className="sr-only">Compare</span></Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button asChild className="rounded-2xl"><Link to={`/${language}/booking?vehicle=${vehicle.slug}`} onClick={() => remember(vehicle)}>Instant booking</Link></Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <a href={waLink(`Hello N1 Lux Cars, I want to reserve ${vehicle.name} at ${vehicle.price} �/day.`)} target="_blank" rel="noopener"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</a>
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <section id="voitures" className="relative overflow-hidden bg-secondary/45 py-24">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" /> {isFr ? "Flotte premium" : "Premium fleet"}
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">{isFr ? "Choisissez une voiture disponible maintenant" : "Choose a car available now"}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">{isFr ? "Filtres avances, recommandations, favoris et reservation instantanee." : "Advanced filters, recommendations, favorites and instant booking."}</p>
        </motion.div>

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          {featured.map((vehicle) => (
            <Link key={vehicle.id} to={`/${language}/cars/${vehicle.slug}`} onClick={() => remember(vehicle)} className="overflow-hidden rounded-3xl border bg-card shadow-card transition hover:-translate-y-1">
              <img src={vehicle.gallery[0]} alt={vehicle.name} className="aspect-[16/9] w-full object-cover" loading="lazy" />
              <div className="p-4"><p className="text-sm text-primary">Featured vehicle</p><h3 className="text-lg font-semibold">{vehicle.name}</h3></div>
            </Link>
          ))}
        </div>

        <div className="mb-8 rounded-3xl border bg-background/85 p-5 shadow-card backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-5 w-5 text-primary" />Advanced search</div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={view === "grid" ? "default" : "outline"} size="icon" className="rounded-full" onClick={() => setView("grid")}><Grid2X2 className="h-4 w-4" /><span className="sr-only">Grid view</span></Button>
              <Button type="button" variant={view === "list" ? "default" : "outline"} size="icon" className="rounded-full" onClick={() => setView("list")}><List className="h-4 w-4" /><span className="sr-only">List view</span></Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              ["Brand", brand, setBrand, options.brands],
              ["Category", category, setCategory, options.categories],
              ["Transmission", transmission, setTransmission, options.transmissions],
              ["Fuel", fuel, setFuel, options.fuels],
              ["Seats", seats, setSeats, options.seats],
            ].map(([label, value, setter, values]) => (
              <label key={label as string} className="space-y-2 text-sm text-muted-foreground">
                <span>{label as string}</span>
                <select value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="h-12 w-full rounded-2xl border bg-background px-4 text-foreground">
                  {(values as string[]).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            ))}
            <label className="space-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ArrowDownUp className="h-4 w-4" />Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="h-12 w-full rounded-2xl border bg-background px-4 text-foreground">
                <option value="priceAsc">Price Low to High</option>
                <option value="priceDesc">Price High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <label className="space-y-2 text-sm text-muted-foreground">
              <span>Price range: up to {priceMax} �/day</span>
              <input type="range" min={200} max={maxFleetPrice} step={50} value={priceMax} onChange={(event) => setPriceMax(Number(event.target.value))} className="w-full accent-primary" />
            </label>
            <Badge variant="outline" className="w-fit rounded-full px-4 py-2"><Search className="mr-2 h-4 w-4" />{filtered.length} available</Badge>
          </div>
        </div>

        {compare.length > 0 && (
          <div className="mb-8 rounded-3xl border border-primary/20 bg-primary/10 p-4 text-primary">
            <strong>{compare.length} selected to compare:</strong> {fleet.filter((car) => compare.includes(car.slug)).map((car) => car.name).join(" vs ")}
          </div>
        )}

        <div className={view === "grid" ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3" : "grid gap-6"}>
          {isLoading ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-[460px] rounded-3xl" />) : filtered.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <MiniRail title="Special offers" vehicles={offers} language={language} remember={remember} />
          <MiniRail title="Recently viewed" vehicles={recentlyViewed} language={language} remember={remember} empty="No vehicles viewed yet" />
          <MiniRail title="Recommended for you" vehicles={recommended} language={language} remember={remember} />
        </div>
      </div>
    </section>
  );
};

const MiniRail = ({ title, vehicles, language, remember, empty = "Coming soon" }: { title: string; vehicles: Vehicle[]; language: string; remember: (vehicle: Vehicle) => void; empty?: string }) => (
  <Card className="rounded-3xl p-5 shadow-card">
    <div className="mb-4 flex items-center gap-2"><CarFront className="h-5 w-5 text-primary" /><h3 className="font-semibold">{title}</h3></div>
    <div className="grid gap-3">
      {vehicles.length ? vehicles.map((vehicle) => (
        <Link key={vehicle.id} to={`/${language}/cars/${vehicle.slug}`} onClick={() => remember(vehicle)} className="flex items-center gap-3 rounded-2xl bg-secondary p-3 transition hover:bg-primary/10">
          <img src={vehicle.gallery[0]} alt={vehicle.name} className="h-16 w-20 rounded-xl object-cover" loading="lazy" />
          <span><strong className="block text-sm">{vehicle.name}</strong><span className="text-xs text-muted-foreground">{vehicle.price} �/day</span></span>
        </Link>
      )) : <p className="text-sm text-muted-foreground">{empty}</p>}
    </div>
  </Card>
);
