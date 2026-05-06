import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/whatsapp";

export const FloatingWhatsApp = () => (
  <a
    href={waLink("Bonjour Atlas Cars, je souhaite des informations.")}
    target="_blank"
    rel="noopener"
    aria-label="Contacter via WhatsApp"
    className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant animate-pulse-ring hover:scale-105 transition-transform"
  >
    <MessageCircle className="h-7 w-7" />
  </a>
);
