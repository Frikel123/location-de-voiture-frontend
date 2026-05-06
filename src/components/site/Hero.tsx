import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";
import heroCar from "@/assets/hero-car.jpg";

export const Hero = () => {
  const { t } = useI18n();

  return (
    <section id="accueil" className="relative min-h-[92vh] flex items-center pt-16 overflow-hidden bg-gradient-hero">
      <img
        src={heroCar}
        alt={t("hero.imageAlt")}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

      <div className="container relative z-10 text-white py-20">
        <div className="max-w-2xl space-y-6">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-sm font-medium text-primary-foreground">
            {t("hero.badge")}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {t("hero.titlePrefix")} <span className="text-primary">Fes</span>
          </h1>
          <p className="text-lg md:text-xl text-white/85">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="text-base h-12 px-6 shadow-elegant">
              <a href={waLink(t("wa.reserve"))} target="_blank" rel="noopener">
                <MessageCircle className="mr-2 h-5 w-5" />
                {t("nav.bookWhatsapp")}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base h-12 px-6 bg-transparent text-white border-white/40 hover:bg-white hover:text-foreground">
              <a href="#voitures">{t("hero.viewCars")}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
