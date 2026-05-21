import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, MapPin, MessageCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";
import heroCar from "@/assets/hero-car.jpg";

export const Hero = () => {
  const { language, t } = useI18n();
  const isFr = language === "fr";

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const labels = {
    badge: isFr ? "Agence verifiee a Fes" : "Verified agency in Fez",
    title: isFr ? "Location premium de voitures a Fes" : "Premium car rental in Fez",
    subtitle: isFr
      ? "Reserve en quelques minutes, recupere ta voiture ou demande une livraison aeroport avec une equipe disponible 24/7."
      : "Book in minutes, collect your car or request airport delivery with a team available 24/7.",
    pickup: isFr ? "Depart" : "Pickup",
    return: isFr ? "Retour" : "Return",
    location: isFr ? "Lieu" : "Location",
    check: isFr ? "Verifier disponibilite" : "Check availability",
    airport: isFr ? "Aeroport, gare ou hotel" : "Airport, station or hotel",
  };

  const stats = [
    { value: "500+", label: isFr ? "clients satisfaits" : "happy clients" },
    { value: "50+", label: isFr ? "voitures disponibles" : "available cars" },
    { value: "24/7", label: isFr ? "support WhatsApp" : "WhatsApp support" },
  ];

  return (
    <section id="accueil" className="relative min-h-screen overflow-hidden bg-[#05070b] pt-20 text-white">
      <img
        src={heroCar}
        alt={t("hero.imageAlt")}
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover opacity-55"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(11,189,146,0.18),transparent_34%),linear-gradient(90deg,rgba(4,7,12,0.95),rgba(4,7,12,0.74)_42%,rgba(4,7,12,0.4))]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-300 to-primary animate-gradient-shift opacity-80" />

      <div className="container relative z-10 grid min-h-[calc(100vh-5rem)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/85 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-primary" />
            {labels.badge}
          </div>
          <h1 className="text-balance text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl">
            {labels.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
            {labels.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-[3.25rem] rounded-full px-7 text-base shadow-elegant">
              <a href={waLink(t("wa.reserve"))} target="_blank" rel="noopener">
                <MessageCircle className="mr-2 h-5 w-5" />
                {t("nav.bookWhatsapp")}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-[3.25rem] rounded-full border-white/25 bg-white/10 px-7 text-base text-white backdrop-blur-xl hover:bg-white hover:text-foreground">
              <a href="#voitures">
                <Search className="mr-2 h-5 w-5" />
                {t("hero.viewCars")}
              </a>
            </Button>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + index * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-xs leading-5 text-white/62">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="luxury-surface rounded-[2rem] p-4 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">{isFr ? "Reservation rapide" : "Fast booking"}</p>
              <h2 className="mt-1 text-2xl font-semibold">{isFr ? "Trouver une voiture" : "Find your car"}</h2>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm text-white/70"><MapPin className="h-4 w-4" />{labels.location}</span>
              <Input defaultValue={labels.airport} className="h-12 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/50" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm text-white/70"><CalendarDays className="h-4 w-4" />{labels.pickup}</span>
                <Input type="date" defaultValue={today} className="h-12 rounded-2xl border-white/10 bg-white/10 text-white [color-scheme:dark]" />
              </label>
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm text-white/70"><CalendarDays className="h-4 w-4" />{labels.return}</span>
                <Input type="date" defaultValue={tomorrow} className="h-12 rounded-2xl border-white/10 bg-white/10 text-white [color-scheme:dark]" />
              </label>
            </div>
            <Button asChild size="lg" className="mt-2 h-[3.25rem] rounded-2xl text-base shadow-elegant">
              <a href={waLink(t("wa.reserve"))} target="_blank" rel="noopener">
                <Search className="mr-2 h-5 w-5" />
                {labels.check}
              </a>
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-white/55">
            {isFr ? "Confirmation en general sous 5 minutes via WhatsApp." : "Confirmation usually arrives within 5 minutes on WhatsApp."}
          </p>
        </motion.div>
      </div>
    </section>
  );
};
