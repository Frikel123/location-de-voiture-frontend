import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { PHONE_DISPLAY, waLink } from "@/lib/whatsapp";

export const Footer = () => {
  const { language, t } = useI18n();
  const isFr = language === "fr";
  const links = [
    { href: "#accueil", label: t("nav.home") },
    { href: "#voitures", label: t("nav.cars") },
    { href: "#pourquoi", label: t("nav.why") },
    { href: "#contact", label: t("nav.contact") },
  ];

  return (
    <footer className="bg-[#05070b] text-white">
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.2fr_0.8fr_1fr]">
        <div>
          <a href="#accueil" className="inline-flex items-center gap-3 font-bold">
            <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant ring-1 ring-white/25">
              <span className="absolute inset-x-1 top-1 h-px bg-white/60" />
              AC
            </span>
            <span className="leading-none">
              <span className="block text-2xl tracking-tight">Atlas</span>
              <span className="block text-xs font-semibold uppercase tracking-[0.32em] text-primary">Cars</span>
            </span>
          </a>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/62">{t("footer.tagline")}</p>
          <div className="mt-6 flex gap-2">
            <Button asChild size="icon" variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white hover:text-foreground">
              <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="icon" variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white hover:text-foreground">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="icon" className="rounded-full">
              <a href={waLink(t("wa.info"))} target="_blank" rel="noopener" aria-label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">{isFr ? "Navigation" : "Navigation"}</h3>
          <div className="mt-4 grid gap-3">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-white/62 transition-colors hover:text-primary">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold">{isFr ? "Offres et disponibilites" : "Offers and availability"}</h3>
          <p className="mt-3 text-sm leading-6 text-white/62">
            {isFr ? "Recois les nouveaux vehicules et les offres week-end." : "Get new vehicles and weekend offers."}
          </p>
          <div className="mt-4 flex gap-2">
            <Input placeholder={isFr ? "Votre email" : "Your email"} className="h-11 rounded-full border-white/10 bg-white/10 text-white placeholder:text-white/45" />
            <Button className="rounded-full">{isFr ? "OK" : "Join"}</Button>
          </div>
          <div className="mt-5 text-sm text-white/62">
            <p>{PHONE_DISPLAY}</p>
            <p className="mt-1">{t("footer.welcome")}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="container flex flex-col gap-3 text-sm text-white/48 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Atlas Cars. {t("footer.rights")}</p>
          <div className="flex gap-4">
            <a href="#contact" className="hover:text-primary">{isFr ? "Mentions legales" : "Legal"}</a>
            <a href="#contact" className="hover:text-primary">{isFr ? "Confidentialite" : "Privacy"}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
