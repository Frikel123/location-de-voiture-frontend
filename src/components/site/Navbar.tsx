import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { language, t, toggleLanguage } = useI18n();

  const links = [
    { href: "#accueil", label: t("nav.home") },
    { href: "#voitures", label: t("nav.cars") },
    { href: "#pourquoi", label: t("nav.why") },
    { href: "#contact", label: t("nav.contact") },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <a href="#accueil" className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">N</span>
          <span>NAYS CAR</span>
        </a>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            aria-label={t("aria.language")}
          >
            {language === "fr" ? "EN" : "FR"}
          </Button>
          <Button asChild size="sm">
            <a href={waLink(t("wa.reserve"))} target="_blank" rel="noopener">
              {t("nav.bookWhatsapp")}
            </a>
          </Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container flex flex-col py-4 gap-3">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-2 text-foreground/80 hover:text-primary">
                {link.label}
              </a>
            ))}
            <Button asChild className="w-full">
              <a href={waLink(t("wa.reserve"))} target="_blank" rel="noopener">
                {t("nav.bookWhatsapp")}
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={toggleLanguage}
              aria-label={t("aria.language")}
            >
              {language === "fr" ? "English" : "Francais"}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
