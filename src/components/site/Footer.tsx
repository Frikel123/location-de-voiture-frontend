import { useI18n } from "@/lib/i18n";
import { PHONE_DISPLAY } from "@/lib/whatsapp";

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-foreground text-background py-10">
      <div className="container grid gap-6 md:grid-cols-3 items-center">
        <div>
          <p className="text-xl font-bold">NAYS CAR</p>
          <p className="text-sm text-background/70 mt-1">{t("footer.tagline")}</p>
        </div>
        <div className="text-center text-sm text-background/80">
          <p>{PHONE_DISPLAY}</p>
          <p className="mt-1">{t("footer.welcome")}</p>
        </div>
        <div className="text-center md:text-right text-sm text-background/60">
          &copy; {new Date().getFullYear()} NAYS CAR. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};
