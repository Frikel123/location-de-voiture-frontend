import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, CarFront, Gauge, MapPin, MessageCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { api, type Car } from "@/lib/api";
import { buildFleet, daysBetween } from "@/lib/fleet";
import { waLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroCar from "@/assets/hero-car.jpg";

const cities = ["Fes", "Casablanca", "Marrakech", "Rabat", "Tangier"];
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export const Hero = () => {
  const [pickupCity, setPickupCity] = useState("Fes");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [category, setCategory] = useState("All");
  const [priceRange, setPriceRange] = useState(650);

  const { data: cars } = useQuery({ queryKey: ["public-cars"], queryFn: () => api.get<Car[]>("/cars") });
  const fleet = useMemo(() => buildFleet(cars), [cars]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(fleet.map((car) => car.category)))], [fleet]);
  const matchingFleet = useMemo(
    () => fleet.filter((car) => (category === "All" || car.category === category) && car.price <= priceRange),
    [category, fleet, priceRange],
  );
  const rentalDays = daysBetween(startDate, endDate);
  const lowestRate = matchingFleet.reduce((prev, car) => Math.min(prev, car.price), matchingFleet[0]?.price ?? 0);
  const estimate = lowestRate * rentalDays;

  const trust = ["Insurance included", "Airport delivery", "24/7 WhatsApp", "Instant confirmation"];
  const stats = [
    { value: "1,850+", label: "rentals" },
    { value: `${matchingFleet.length}`, label: "matching cars" },
    { value: "12 min", label: "confirmation" },
  ];

  const message = `Hello N1 Lux Cars, I want to check availability. City: ${pickupCity}. Dates: ${startDate} - ${endDate}. Category: ${category}. Budget: ${priceRange} DH/day. Estimate: ${estimate} DH.`;

  return (
    <section id="accueil" className="relative min-h-screen overflow-hidden bg-[#05070b] pt-20 text-white">
      <img src={heroCar} alt="N1 Lux Cars premium rental vehicle" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover opacity-50" loading="eager" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(212,175,55,0.22),transparent_24%),radial-gradient(circle_at_85%_35%,rgba(255,242,183,0.14),transparent_22%),linear-gradient(90deg,rgba(4,10,20,0.96),rgba(11,31,58,0.74)_45%,rgba(11,31,58,0.42))]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[#fff2b7] to-primary animate-gradient-shift" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="container relative z-10 grid min-h-[calc(100vh-5rem)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-primary" /> N1 Lux Cars Morocco
          </div>
          <h1 className="text-balance font-serif text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl">Premium Car Rental Experience in Morocco</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
            Drive Excellence with N1 Lux Cars
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {trust.map((item, index) => (
              <motion.div key={item} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.06 }} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/80 shadow-card backdrop-blur-xl">
                {item}
              </motion.div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-5 text-center text-white/80 backdrop-blur-xl">
                <div className="text-3xl font-semibold text-white">{stat.value}</div>
                <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8 py-4 text-base shadow-elegant">
              <a href="#voitures"><Search className="mr-2 h-5 w-5" />Explore Luxury Fleet</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 py-4 text-base text-white hover:bg-white/15">
              <a href={waLink(message)} target="_blank" rel="noopener"><MessageCircle className="mr-2 h-5 w-5" />Reserve Premium Drive</a>
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="luxury-surface rounded-[2rem] border border-white/10 bg-[#08101e]/95 p-6 shadow-elegant backdrop-blur-2xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div><p className="text-sm font-medium text-primary">Live availability</p><h2 className="mt-1 text-2xl font-semibold">Find your vehicle</h2></div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary"><ShieldCheck className="h-5 w-5" /></div>
          </div>

          <div className="grid gap-4">
            <label className="space-y-2 text-sm text-white/80">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />City</span>
              <Input
                type="text"
                value={pickupCity}
                onChange={(event) => setPickupCity(event.target.value)}
                placeholder="Enter city"
                className="h-12 rounded-2xl border border-white/10 bg-white/10 px-4 text-white placeholder:text-white/50 outline-none focus:border-primary"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Pickup date</span><Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-white/10 text-white" /></label>
              <label className="space-y-2 text-sm text-white/80"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Return date</span><Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-white/10 text-white" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span className="flex items-center gap-2"><CarFront className="h-4 w-4" />Vehicle category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none focus:border-primary">
                  {categories.map((item) => <option key={item} value={item} className="bg-[#0d1722] text-white">{item === "All" ? "All categories" : item}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span className="flex items-center gap-2"><Gauge className="h-4 w-4" />Price range</span>
                <input type="range" min={200} max={1200} step={50} value={priceRange} onChange={(event) => setPriceRange(Number(event.target.value))} className="mt-4 h-2 w-full accent-primary" />
                <span className="block text-xs text-white/70">{priceRange} DH/day</span>
              </label>
            </div>

            <div className="rounded-3xl border border-primary/15 bg-primary/10 p-4 text-white/90">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm uppercase tracking-[0.24em] text-primary/90">Availability</p><p className="mt-2 text-2xl font-semibold">{matchingFleet.length} cars ready</p></div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-right text-sm text-white/80"><p>From</p><p className="mt-1 text-xl font-bold">{lowestRate} DH/day</p></div>
              </div>
              <p className="mt-4 text-sm text-white/70">Estimate for {rentalDays} day(s): {estimate} DH</p>
            </div>

            <Button asChild size="lg" className="rounded-2xl">
              <a href={waLink(message)} target="_blank" rel="noopener"><Search className="mr-2 h-5 w-5" />Check options live</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
