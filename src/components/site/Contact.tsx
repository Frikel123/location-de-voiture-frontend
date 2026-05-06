import { MessageCircle, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { PHONE_DISPLAY, WHATSAPP_NUMBER, waLink } from "@/lib/whatsapp";

export const Contact = () => {
  const { t } = useI18n();

  return (
    <section id="contact" className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t("contact.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("contact.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 space-y-5 shadow-card border-border/60">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("contact.phone")}</p>
                <a href={`tel:+${WHATSAPP_NUMBER}`} className="text-lg font-semibold hover:text-primary">{PHONE_DISPLAY}</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("contact.address")}</p>
                <p className="text-lg font-semibold">{t("contact.city")}</p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full">
              <a href={waLink(t("wa.moreInfo"))} target="_blank" rel="noopener">
                <MessageCircle className="mr-2 h-5 w-5" />
                {t("contact.whatsapp")}
              </a>
            </Button>
          </Card>

          <Card className="overflow-hidden shadow-card border-border/60">
            <iframe
              title="NAYS CAR - Fes"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3306.0693546841862!2d-5.001376399999999!3d34.042092!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd9f8b13de68de95%3A0x4876f1e7dcee7a67!2sNAYS%20CAR!5e0!3m2!1sfr!2sma!4v1778083235194!5m2!1sfr!2sma"
              className="w-full h-full min-h-[320px] border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Card>
        </div>
      </div>
    </section>
  );
};
