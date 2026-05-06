import { BadgeDollarSign, Zap, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

const items = [
  { icon: BadgeDollarSign, title: "Prix compétitifs", desc: "Les meilleurs tarifs de location à Fès, sans frais cachés." },
  { icon: Zap, title: "Service rapide", desc: "Réservation et livraison rapides via WhatsApp." },
  { icon: Clock, title: "Disponible 24/7", desc: "Notre équipe est à votre écoute jour et nuit." },
];

export const WhyUs = () => (
  <section id="pourquoi" className="py-20">
    <div className="container">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Pourquoi nous choisir</h2>
        <p className="mt-3 text-muted-foreground">Une expérience de location simple et transparente</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="p-6 text-center shadow-card hover:shadow-elegant transition-shadow border-border/60">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Icon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  </section>
);
