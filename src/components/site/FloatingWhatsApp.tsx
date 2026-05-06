import { MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";

export const FloatingWhatsApp = () => {
  const { t } = useI18n();

  return (
    <a
      href={waLink(t("wa.info"))}
      target="_blank"
      rel="noopener"
      aria-label={t("contact.whatsapp")}
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant animate-pulse-ring hover:scale-105 transition-transform"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};
