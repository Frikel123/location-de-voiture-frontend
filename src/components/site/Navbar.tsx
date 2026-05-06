import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { waLink } from "@/lib/whatsapp";

const links = [
  { href: "#accueil", label: "Accueil" },
  { href: "#voitures", label: "Voitures" },
  { href: "#pourquoi", label: "Pourquoi nous" },
  { href: "#contact", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <a href="#accueil" className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">A</span>
          <span>Atlas Cars</span>
        </a>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild size="sm">
            <a href={waLink("Bonjour Atlas Cars, je souhaite réserver une voiture.")} target="_blank" rel="noopener">
              Réserver via WhatsApp
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
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 text-foreground/80 hover:text-primary">
                {l.label}
              </a>
            ))}
            <Button asChild className="w-full">
              <a href={waLink("Bonjour Atlas Cars, je souhaite réserver une voiture.")} target="_blank" rel="noopener">
                Réserver via WhatsApp
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
