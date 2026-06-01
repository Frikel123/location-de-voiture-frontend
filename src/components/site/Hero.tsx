import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, MapPin, MessageCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";
import heroCar from "@/assets/hero-car.jpg";
import { api, Car } from "@/lib/api";

const cities = [
  { value: "Fes", label: "Fès" },
  { value: "Casablanca", label: "Casablanca" },
  { value: "Marrakech", label: "Marrakech" },
  { value: "Rabat", label: "Rabat" },
];

const daysBetween = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  return diff;
};

export const Hero = () => {
  const { language, t } = useI18n();
  const isFr = language === "fr";

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [pickupCity, setPickupCity] = useState("Fes");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);

  const { data: cars } = useQuery({
    queryKey: ["public-cars"],
    queryFn: () => api.get<Car[]>('/cars'),
  });

  const rentalDays = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const availableCars = cars?.length ?? 0;
  const lowestRate = cars?.reduce((prev, car) => (car.price < prev ? car.price : prev), cars[0]?.price ?? 0) ?? 0;
  const estimatedPrice = lowestRate > 0 ? lowestRate * rentalDays : 0;

  const features = [
    { title: isFr ? "Assurance incluse" : language === "de" ? "Versicherung inklusive" : "Insurance included" },
    { title: isFr ? "Livraison aéroport" : language === "de" ? "Flughafentransfer" : "Airport delivery" },
    { title: isFr ? "Support 24/7" : language === "de" ? "Support 24/7" : "24/7 support" },
    { title: isFr ? "Réservation instantanée" : language === "de" ? "Sofortige Buchung" : "Instant booking" },
  ];

  const stats = [
    { value: "980+", label: isFr ? "clients VIP" : language === "de" ? "VIP-Kunden" : "VIP clients" },
    { value: `${availableCars}+`, label: isFr ? "voitures en stock" : language === "de" ? "Fahrzeuge verfügbar" : "cars available" },
    { value: "Temps réel", label: isFr ? "disponibilité" : language === "de" ? "Verfügbarkeit" : "real-time availability" },
  ];

  return (
    <section id="accueil" className="relative min-h-screen overflow-hidden bg-[#05070b] pt-20 text-white">
      <img
        src={heroCar}
        alt={t("hero.imageAlt")}
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        loading="eager"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(11,189,146,0.14),transparent_22%),linear-gradient(90deg,rgba(4,7,12,0.96),rgba(4,7,12,0.72)_45%,rgba(4,7,12,0.36))]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-300 to-primary animate-gradient-shift opacity-80" />

      <div className="container relative z-10 grid min-h-[calc(100vh-5rem)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-primary" />
            {isFr ? "Agence vérifiée à Fès" : language === "de" ? "Verifizierte Agentur in Fes" : "Verified agency in Fez"}
          </div>
          <h1 className="text-balance text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl">
            {isFr ? "Location de voitures premium en Europe" : language === "de" ? "Premium-Autovermietung in Europa" : "Premium car rental across Europe"}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
            {isFr
              ? "Profitez d'une expérience haut de gamme avec livraison aéroport, assistance 24/7 et confirmation instantanée via WhatsApp."
              : language === "de"
              ? "Genießen Sie ein Premium-Erlebnis mit Flughafenzustellung, 24/7-Support und unmittelbarer Bestätigung per WhatsApp."
              : "Enjoy a premium experience with airport delivery, 24/7 support and instant confirmation via WhatsApp."}
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.06 }}
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/80 shadow-card backdrop-blur-xl"
              >
                {feature.title}
              </motion.div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.06 }}
                className="rounded-3xl border border-white/10 bg-white/10 p-5 text-center text-white/80 backdrop-blur-xl"
              >
                <div className="text-3xl font-semibold text-white">{stat.value}</div>
                <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8 py-4 text-base shadow-elegant">
              <a href={waLink(t("wa.reserve"))} target="_blank" rel="noopener">
                <MessageCircle className="mr-2 h-5 w-5" />
                {isFr ? "Réservez maintenant" : language === "de" ? "Jetzt buchen" : "Book now"}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 py-4 text-base text-white hover:bg-white/15">
              <a href="#voitures">
                <Search className="mr-2 h-5 w-5" />
                {t("hero.viewCars")}
              </a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="luxury-surface rounded-[2rem] border border-white/10 bg-[#08101e]/95 p-6 shadow-elegant backdrop-blur-2xl"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">{isFr ? "Réservation express" : language === "de" ? "Schnellbuchung" : "Express booking"}</p>
              <h2 className="mt-1 text-2xl font-semibold">{isFr ? "Vérifiez les disponibilités" : language === "de" ? "Verfügbarkeit prüfen" : "Check availability"}</h2>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="grid gap-4">
            <label className="space-y-2 text-sm text-white/80">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{isFr ? "Ville de prise" : language === "de" ? "Abholort" : "Pickup city"}</span>
              <select
                value={pickupCity}
                onChange={(event) => setPickupCity(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none transition focus:border-primary"
              >
                {cities.map((city) => (
                  <option key={city.value} value={city.value} className="bg-[#0d1722] text-white">
                    {city.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{isFr ? "Date de départ" : language === "de" ? "Abholdatum" : "Pickup date"}</span>
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/10 text-white" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{isFr ? "Date de retour" : language === "de" ? "Rückgabedatum" : "Return date"}</span>
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/10 text-white" />
              </label>
            </div>
            <div className="rounded-3xl border border-primary/15 bg-primary/10 p-4 text-white/90">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-primary/90">{isFr ? "Disponibilité" : language === "de" ? "Verfügbarkeit" : "Availability"}</p>
                  <p className="mt-2 text-2xl font-semibold">{availableCars} {isFr ? "véhicules prêts" : language === "de" ? "Fahrzeuge bereit" : "cars ready"}</p>
                </div>
                <div className="rounded-3xl bg-white/5 px-4 py-3 text-right text-sm text-white/80">
                  <p>{isFr ? "À partir de" : language === "de" ? "Ab" : "From"}</p>
                  <p className="mt-1 text-xl font-bold">{lowestRate} DH / {isFr ? "jour" : language === "de" ? "Tag" : "day"}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/70">{isFr ? `Estimation pour ${rentalDays} jour(s)` : language === "de" ? `Schätzung für ${rentalDays} Tage` : `Estimate for ${rentalDays} day(s)`}: {estimatedPrice} DH</p>
            </div>
            <Button asChild size="lg" className="rounded-2xl bg-primary text-primary-foreground">
              <a
                href={waLink(
                  `${isFr ? "Bonjour Atlas Cars, je souhaite réserver une voiture." : language === "de" ? "Hallo Atlas Cars, ich möchte ein Auto mieten." : "Hello Atlas Cars, I would like to book a car."} ${isFr ? "Ville" : language === "de" ? "Stadt" : "City"}: ${pickupCity}. ${isFr ? "Dates" : language === "de" ? "Daten" : "Dates"}: ${startDate} - ${endDate}. ${isFr ? "Prix estimé" : language === "de" ? "Geschätzter Preis" : "Estimated price"}: ${estimatedPrice} DH.",
                )}
                target="_blank"
                rel="noopener"
              >
                <Search className="mr-2 h-5 w-5" />
                {isFr ? "Voir les options" : language === "de" ? "Optionen anzeigen" : "View options"}
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
