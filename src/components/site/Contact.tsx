import { Phone, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PHONE_DISPLAY, WHATSAPP_NUMBER, waLink } from "@/lib/whatsapp";

export const Contact = () => (
  <section id="contact" className="py-20 bg-secondary/30">
    <div className="container">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Contact</h2>
        <p className="mt-3 text-muted-foreground">Contactez-nous · تواصل معنا</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-5 shadow-card border-border/60">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <a href={`tel:+${WHATSAPP_NUMBER}`} className="text-lg font-semibold hover:text-primary">{PHONE_DISPLAY}</a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="text-lg font-semibold">Fès, Maroc</p>
            </div>
          </div>

          <Button asChild size="lg" className="w-full">
            <a href={waLink("Bonjour Atlas Cars, je souhaite plus d'informations.")} target="_blank" rel="noopener">
              <MessageCircle className="mr-2 h-5 w-5" />
              Discuter sur WhatsApp
            </a>
          </Button>
        </Card>

        <Card className="overflow-hidden shadow-card border-border/60">
          <iframe
            title="Atlas Cars - Fès"
            src="https://www.google.com/maps?q=F%C3%A8s%2C+Morocco&output=embed"
            className="w-full h-full min-h-[320px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Card>
      </div>
    </div>
  </section>
);
