import { motion } from "framer-motion";
import { BadgeCheck, Headphones, MapPinned, Plane, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const TrustSection = () => {
  const { language } = useI18n();
  const isFr = language === "fr";
  const items = [
    { icon: Plane, title: isFr ? "Livraison aeroport" : "Airport delivery", desc: isFr ? "Prise en charge flexible a Meknes." : "Flexible pickup in Meknes." },
    { icon: ShieldCheck, title: isFr ? "Assurance incluse" : "Insurance included", desc: isFr ? "Roulez avec une confirmation claire." : "Drive with clear confirmation." },
    { icon: BadgeCheck, title: isFr ? "Agence verifiee" : "Verified agency", desc: isFr ? "Une vraie equipe locale." : "A real local team." },
    { icon: Headphones, title: isFr ? "Support WhatsApp rapide" : "Fast WhatsApp support", desc: isFr ? "Reponse rapide avant et apres depart." : "Quick replies before and after pickup." },
    { icon: MapPinned, title: isFr ? "Hotel, gare, centre-ville" : "Hotel, station, city center", desc: isFr ? "On adapte la livraison a ton trajet." : "Delivery adapts to your itinerary." },
  ];

  return (
    <section className="bg-background py-16">
      <div className="container">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map(({ icon: Icon, title, desc }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-3xl border border-border/70 bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
