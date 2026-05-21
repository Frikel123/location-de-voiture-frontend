import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";

export const Testimonials = () => {
  const { language } = useI18n();
  const isFr = language === "fr";
  const reviews = [
    {
      name: "Yassine B.",
      initials: "YB",
      photo: "https://i.pravatar.cc/120?img=12",
      text: isFr ? "Voiture propre, livraison rapide a l'aeroport et prix clair. Tres bonne experience." : "Clean car, fast airport delivery and clear pricing. Great experience.",
    },
    {
      name: "Sofia M.",
      initials: "SM",
      photo: "https://i.pravatar.cc/120?img=47",
      text: isFr ? "Reservation facile sur WhatsApp. L'equipe etait disponible meme tard le soir." : "Easy booking on WhatsApp. The team was available even late at night.",
    },
    {
      name: "Adam R.",
      initials: "AR",
      photo: "https://i.pravatar.cc/120?img=33",
      text: isFr ? "Service serieux, voiture en tres bon etat. Je recommande pour Fes." : "Serious service, car in very good condition. Recommended for Fez.",
    },
  ];

  return (
    <section className="overflow-hidden bg-background py-24">
      <div className="container">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              {isFr ? "Avis clients" : "Customer reviews"}
            </p>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              {isFr ? "Une location qui inspire confiance." : "Rental that feels trustworthy."}
            </h2>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 shadow-card">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-4 w-4 fill-primary text-primary" />
            ))}
            <span className="ml-2 text-sm font-semibold">4.9/5</span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((review, index) => (
            <motion.article
              key={review.name}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-3xl border border-border/70 bg-card p-6 shadow-card"
            >
              <div className="mb-5 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="min-h-24 text-base leading-7 text-muted-foreground">"{review.text}"</p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.photo} alt={review.name} loading="lazy" />
                  <AvatarFallback className="bg-primary/10 text-primary">{review.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{review.name}</p>
                  <p className="text-sm text-muted-foreground">{isFr ? "Client verifie" : "Verified client"}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
