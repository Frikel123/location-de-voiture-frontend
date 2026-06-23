import { motion } from "framer-motion";
import { ArrowRight, Globe2, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export const BlogSection = () => {
  const { language } = useI18n();
  const isFr = language === "fr";
  const posts = [
    {
      title: isFr ? "Guide premium : louer au Maroc" : language === "de" ? "Premium-Leitfaden: Mieten in Marokko" : "Premium guide: renting in Morocco",
      description: isFr
        ? "Conseils locaux pour profiter d'une location fluide a Meknes, Casablanca et Marrakech."
        : language === "de"
        ? "Lokale Tipps fuer eine reibungslose Anmietung in Meknes, Casablanca und Marrakesch."
        : "Local tips for a smooth rental in Meknes, Casablanca and Marrakech.",
      tags: [isFr ? "Conseils" : language === "de" ? "Tipps" : "Tips", isFr ? "Voyage" : language === "de" ? "Reise" : "Travel"],
    },
    {
      title: isFr ? "Livraison aeroport sans stress" : language === "de" ? "Stressfreie Abholung am Flughafen" : "Stress-free airport pickup",
      description: isFr
        ? "Organisez votre arrivee avec livraison a l'aeroport et prise en charge VIP."
        : language === "de"
        ? "Organisieren Sie Ihre Ankunft mit Flughafenzustellung und VIP-Abholung."
        : "Plan your arrival with airport delivery and VIP pickup.",
      tags: [isFr ? "Aeroport" : language === "de" ? "Flughafen" : "Airport", isFr ? "Livraison" : language === "de" ? "Lieferung" : "Delivery"],
    },
    {
      title: isFr ? "Top destinations autour de Meknes" : language === "de" ? "Top-Reiseziele rund um Meknes" : "Top destinations around Meknes",
      description: isFr
        ? "Decouvrez les meilleures excursions en voiture avec des routes panoramiques et des services premium."
        : language === "de"
        ? "Entdecken Sie die besten Tagesausfluege mit Panoramastrassen und Premium-Service."
        : "Explore the best road trips with scenic routes and premium service.",
      tags: [isFr ? "Itineraire" : language === "de" ? "Route" : "Route", isFr ? "Aventure" : language === "de" ? "Abenteuer" : "Adventure"],
    },
  ];

  return (
    <section className="bg-background py-24">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">{isFr ? "Conseils premium" : language === "de" ? "Premium-Tipps" : "Premium insights"}</p>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              {isFr ? "Le blog Service LLD" : language === "de" ? "Service LLD Blog" : "Service LLD blog"}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {isFr
                ? "Guides de voyage, astuces de preparation et recommandations pour votre prochaine location."
                : language === "de"
                ? "Reiseguides, Vorbereitungstipps und Empfehlungen fuer Ihre naechste Anmietung."
                : "Travel guides, planning tips and recommendations for your next rental."}
            </p>
          </div>
          <Button variant="outline" className="rounded-full px-5 py-3">
            <ArrowRight className="mr-2 h-4 w-4" />
            {isFr ? "Voir tous les articles" : language === "de" ? "Alle Beitraege ansehen" : "See all articles"}
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {posts.map((post, index) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="h-full rounded-3xl border-border/70 p-6 shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  {index === 0 ? <Globe2 className="h-6 w-6" /> : index === 1 ? <Truck className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">{post.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{post.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-secondary/20 px-3 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                <Button variant="link" className="mt-8 text-primary">
                  {isFr ? "Lire l'article" : language === "de" ? "Artikel lesen" : "Read article"}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
