import { PHONE_DISPLAY } from "@/lib/whatsapp";

export const Footer = () => (
  <footer className="bg-foreground text-background py-10">
    <div className="container grid gap-6 md:grid-cols-3 items-center">
      <div>
        <p className="text-xl font-bold">Atlas Cars</p>
        <p className="text-sm text-background/70 mt-1">Location de voiture · Fès, Maroc</p>
      </div>
      <div className="text-center text-sm text-background/80">
        <p>{PHONE_DISPLAY}</p>
        <p className="mt-1" dir="rtl">مرحبا بكم في أطلس كارز</p>
      </div>
      <div className="text-center md:text-right text-sm text-background/60">
        © {new Date().getFullYear()} Atlas Cars. Tous droits réservés.
      </div>
    </div>
  </footer>
);
