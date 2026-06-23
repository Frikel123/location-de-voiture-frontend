import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Check, Heart, MessageCircle, ShieldCheck, Star, Users, Zap, ZoomIn } from "lucide-react";
import { api, type Car } from "@/lib/api";
import { buildFleet, daysBetween, getVehicleBySlug } from "@/lib/fleet";
import { setSeo } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

const VehicleDetails = () => {
  const { lang = "fr", slug } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);

  const { data: cars, isLoading } = useQuery({
    queryKey: ["public-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

  const vehicle = useMemo(() => getVehicleBySlug(slug, cars), [cars, slug]);
  const fleet = useMemo(() => buildFleet(cars), [cars]);
  const similar = useMemo(
    () => fleet.filter((item) => item.id !== vehicle?.id && (item.category === vehicle?.category || item.brand === vehicle?.brand)).slice(0, 3),
    [fleet, vehicle],
  );
  const rentalDays = daysBetween(startDate, endDate);
  const total = vehicle ? rentalDays * vehicle.price : 0;

  useEffect(() => {
    if (!vehicle) return;
    setSeo({
      title: `${vehicle.name} rental in Morocco | Service LLD`,
      description: `Book the ${vehicle.name} with instant availability, WhatsApp confirmation, insurance and delivery in Morocco.`,
      canonical: `/${lang}/cars/${vehicle.slug}`,
      image: vehicle.gallery[0],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: vehicle.name,
        brand: vehicle.brand,
        image: vehicle.gallery,
        offers: { "@type": "Offer", price: vehicle.price, priceCurrency: "MAD", availability: "https://schema.org/InStock" },
      },
    });
  }, [lang, vehicle]);

  if (isLoading) {
    return <div className="container grid min-h-screen gap-6 py-28 lg:grid-cols-2"><Skeleton className="h-[520px] rounded-3xl" /><Skeleton className="h-[520px] rounded-3xl" /></div>;
  }

  if (!vehicle) return <Navigate to={`/${lang}#voitures`} replace />;

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[#05070b] pb-10 pt-24 text-white">
        <div className="container">
          <Button asChild variant="ghost" className="mb-6 rounded-full text-white hover:bg-white/10 hover:text-white">
            <Link to={`/${lang}#voitures`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to fleet</Link>
          </Button>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <img
                  src={vehicle.gallery[activeImage]}
                  alt={vehicle.name}
                  className="aspect-[16/10] w-full object-cover"
                  loading="eager"
                />
                <Button size="icon" className="absolute right-4 top-4 rounded-full bg-black/50 text-white hover:bg-black/70" onClick={() => setZoomOpen(true)}>
                  <ZoomIn className="h-5 w-5" /><span className="sr-only">Zoom image</span>
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {vehicle.gallery.slice(0, 3).map((image, index) => (
                  <button key={image} onClick={() => setActiveImage(index)} className={`overflow-hidden rounded-2xl border ${activeImage === index ? "border-primary" : "border-white/10"}`}>
                    <img src={image} alt={`${vehicle.name} view ${index + 1}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-primary text-primary-foreground">Available now</Badge>
                {vehicle.offer && <Badge variant="outline" className="rounded-full border-white/20 text-white">{vehicle.offer}</Badge>}
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">{vehicle.name}</h1>
              <p className="mt-3 text-white/70">{vehicle.category} - {vehicle.transmission} - {vehicle.fuel} - {vehicle.year}</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/8 p-4"><Users className="mx-auto mb-2 h-5 w-5 text-primary" />{vehicle.seats} seats</div>
                <div className="rounded-2xl bg-white/8 p-4"><Star className="mx-auto mb-2 h-5 w-5 fill-primary text-primary" />{vehicle.rating}</div>
                <div className="rounded-2xl bg-white/8 p-4"><Zap className="mx-auto mb-2 h-5 w-5 text-primary" />{vehicle.trips} trips</div>
              </div>

              <div className="mt-6 rounded-3xl bg-white p-5 text-foreground">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium"><span>Pickup date</span><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
                  <label className="space-y-2 text-sm font-medium"><span>Return date</span><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
                </div>
                <div className="mt-4 flex items-end justify-between rounded-2xl bg-secondary p-4">
                  <div><p className="text-sm text-muted-foreground">Estimated total</p><p className="text-3xl font-bold">{total} DH</p></div>
                  <p className="text-right text-sm text-muted-foreground">{rentalDays} days<br />{vehicle.price} DH/day</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Button asChild className="rounded-2xl"><Link to={`/${lang}/booking?vehicle=${vehicle.slug}`}>Instant booking</Link></Button>
                  <Button asChild variant="outline" className="rounded-2xl">
                    <a href={waLink(`Hello Service LLD, I want to reserve ${vehicle.name} from ${startDate} to ${endDate}. Total estimate: ${total} DH.`)} target="_blank" rel="noopener">
                      <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      <section className="container grid gap-8 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Vehicle specifications</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {Object.entries({ Brand: vehicle.brand, Category: vehicle.category, Transmission: vehicle.transmission, Fuel: vehicle.fuel, Seats: `${vehicle.seats}`, Doors: `${vehicle.doors}`, ...vehicle.specs }).map(([key, value]) => (
              <div key={key} className="rounded-2xl bg-secondary p-4"><p className="text-sm text-muted-foreground">{key}</p><p className="mt-1 font-semibold">{value}</p></div>
            ))}
          </div>
        </Card>
        <Card className="rounded-3xl p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Features and availability</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {vehicle.features.map((feature) => <div key={feature} className="flex items-center gap-3 rounded-2xl bg-secondary p-4"><Check className="h-5 w-5 text-primary" />{feature}</div>)}
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2 text-center text-sm">
            {Array.from({ length: 14 }).map((_, index) => <div key={index} className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary"><CalendarDays className="mx-auto mb-1 h-4 w-4" />Open</div>)}
          </div>
        </Card>
      </section>

      <section className="bg-secondary/45 py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between gap-4"><h2 className="text-3xl font-bold">Similar vehicles</h2><ShieldCheck className="h-8 w-8 text-primary" /></div>
          <div className="grid gap-5 md:grid-cols-3">
            {similar.map((item) => (
              <Link key={item.id} to={`/${lang}/cars/${item.slug}`} className="rounded-3xl border bg-card p-4 shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
                <img src={item.gallery[0]} alt={item.name} className="aspect-[4/3] w-full rounded-2xl object-cover" loading="lazy" />
                <h3 className="mt-4 text-lg font-semibold">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.price} DH/day - {item.category}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-6xl border-0 bg-black p-2">
          <img src={vehicle.gallery[activeImage]} alt={vehicle.name} className="max-h-[86vh] w-full rounded-2xl object-contain" />
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default VehicleDetails;
