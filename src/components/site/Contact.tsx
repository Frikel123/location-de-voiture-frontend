import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { PHONE_DISPLAY, WHATSAPP_NUMBER, waLink } from "@/lib/whatsapp";

export const Contact = () => {
  const { language, t } = useI18n();
  const isFr = language === "fr";
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = `${isFr ? "Bonjour N1 Lux Cars, je suis" : "Hello N1 Lux Cars, I am"} ${form.name || "-"}. ${
      isFr ? "Telephone" : "Phone"
    }: ${form.phone || "-"}. ${form.message || t("wa.moreInfo")}`;
    window.open(waLink(message), "_blank", "noopener,noreferrer");
  };

  const cards = [
    { icon: Phone, label: t("contact.phone"), value: PHONE_DISPLAY, href: `tel:+${WHATSAPP_NUMBER}` },
    { icon: MapPin, label: t("contact.address"), value: t("contact.city"), href: "#contact" },
    { icon: MessageCircle, label: "WhatsApp", value: isFr ? "Support rapide 24/7" : "Fast 24/7 support", href: waLink(t("wa.info")) },
  ];

  return (
    <section id="contact" className="bg-secondary/45 py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            {isFr ? "Contact direct" : "Direct contact"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">{t("contact.title")}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">{t("contact.subtitle")}</p>
        </motion.div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {cards.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener" : undefined}
              className="rounded-3xl border border-border/70 bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 font-semibold">{value}</p>
            </a>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-3xl border-border/70 p-6 shadow-card">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold">{isFr ? "Demander une disponibilite" : "Request availability"}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isFr ? "Envoie ton besoin, l'equipe repond sur WhatsApp." : "Send your request and the team will reply on WhatsApp."}
              </p>
            </div>
            <form onSubmit={submit} className="grid gap-4">
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={isFr ? "Nom complet" : "Full name"}
                className="h-12 rounded-2xl"
              />
              <Input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder={isFr ? "Telephone" : "Phone"}
                className="h-12 rounded-2xl"
              />
              <Textarea
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder={isFr ? "Voiture, dates, lieu de livraison..." : "Car, dates, delivery location..."}
                className="min-h-32 rounded-2xl"
              />
              <Button type="submit" size="lg" className="rounded-2xl">
                <Send className="mr-2 h-5 w-5" />
                {isFr ? "Envoyer sur WhatsApp" : "Send on WhatsApp"}
              </Button>
            </form>
            <Button asChild size="lg" variant="outline" className="mt-3 w-full rounded-2xl">
              <a href={`mailto:contact@n1-lux-cars.ma`}>
                <Mail className="mr-2 h-5 w-5" />
                contact@n1-lux-cars.ma
              </a>
            </Button>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-border/70 shadow-card">
            <iframe
              title="N1 Lux Cars - Fes"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3306.0693546841862!2d-5.001376399999999!3d34.042092!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd9f8b13de68de95%3A0x4876f1e7dcee7a67!2sN1%20Lux%20Cars!5e0!3m2!1sfr!2sma!4v1778083235194!5m2!1sfr!2sma"
              className="h-full min-h-[420px] w-full border-0"
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
