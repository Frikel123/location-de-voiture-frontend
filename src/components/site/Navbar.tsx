import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#accueil");
  const [scrolled, setScrolled] = useState(false);
  const { language, t, toggleLanguage } = useI18n();

  const links = useMemo(
    () => [
      { href: "#accueil", label: t("nav.home") },
      { href: "#voitures", label: t("nav.cars") },
      { href: "#pourquoi", label: t("nav.why") },
      { href: "#contact", label: t("nav.contact") },
    ],
    [t],
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      const current = links
        .map((link) => ({ link: link.href, element: document.querySelector(link.href) }))
        .filter((item): item is { link: string; element: Element } => Boolean(item.element))
        .reverse()
        .find((item) => item.element.getBoundingClientRect().top <= 128);
      if (current) setActive(current.link);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [links]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <div
        className={`container flex h-16 items-center justify-between rounded-2xl border transition-all duration-300 ${
          scrolled
            ? "border-border/70 bg-background/90 shadow-card backdrop-blur-2xl"
            : "border-white/10 bg-white/10 text-white backdrop-blur-xl"
        }`}
      >
        <a href="#accueil" className="group flex items-center gap-3 font-bold">
          <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant ring-1 ring-white/30 transition-transform group-hover:scale-105">
            <span className="absolute inset-x-1 top-1 h-px bg-white/60" />
            AC
          </span>
          <span className="leading-none">
            <span className="block text-lg tracking-tight sm:text-xl">Atlas</span>
            <span className="block text-xs font-semibold uppercase tracking-[0.28em] text-primary">Cars</span>
          </span>
        </a>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active === link.href ? "text-primary" : "text-current/75 hover:text-primary"
              }`}
            >
              {link.label}
              {active === link.href && (
                <motion.span
                  layoutId="active-nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-primary/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="rounded-full bg-transparent"
            aria-label={t("aria.language")}
          >
            {language === "fr" ? "EN" : "FR"}
          </Button>
          <Button asChild size="sm" className="rounded-full px-4 shadow-elegant">
            <a href={waLink(t("wa.reserve"))} target="_blank" rel="noopener">
              <MessageCircle className="mr-2 h-4 w-4" />
              {t("nav.bookWhatsapp")}
            </a>
          </Button>
        </div>

        <button className="rounded-full p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="container mt-2 overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-card backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-3 p-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-foreground/80 hover:bg-secondary hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
              <Button asChild className="w-full rounded-xl">
                <a href={waLink(t("wa.reserve"))} target="_blank" rel="noopener">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t("nav.bookWhatsapp")}
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={toggleLanguage}
                aria-label={t("aria.language")}
              >
                {language === "fr" ? "English" : "Francais"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
