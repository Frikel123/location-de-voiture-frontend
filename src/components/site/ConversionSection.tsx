import { motion } from "framer-motion";
import { Building2, CheckCircle2, ClipboardCheck, CreditCard, FileSignature, KeyRound, LockKeyhole, Plane, ShieldCheck, Smile } from "lucide-react";
import { Card } from "@/components/ui/card";

const partners = ["Visa", "Mastercard", "Allianz", "Booking.com", "Google Reviews", "WhatsApp"];

export const ConversionSection = () => {
  const stats = [
    { value: "4.9/5", label: "customer rating" },
    { value: "1,850+", label: "completed rentals" },
    { value: "12 min", label: "average confirmation" },
    { value: "98%", label: "satisfaction score" },
  ];

  const process = [
    { icon: ClipboardCheck, title: "Search availability", desc: "Choose city, dates, category and price range." },
    { icon: FileSignature, title: "Preview contract", desc: "Review rental terms, insurance and deposit clearly." },
    { icon: CreditCard, title: "Confirm securely", desc: "Finalize by WhatsApp or instant booking request." },
    { icon: KeyRound, title: "Pickup and drive", desc: "Receive the vehicle at airport, hotel or agency." },
  ];

  return (
    <section className="bg-background py-24">
      <div className="container">
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="rounded-3xl border bg-card p-6 text-center shadow-card">
              <p className="text-4xl font-bold text-primary">{stat.value}</p>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary">Rental process</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">From search to keys without friction.</h2>
            <p className="mt-4 text-muted-foreground">A premium rental workflow designed for travelers who want clarity, speed and local support.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {process.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="rounded-3xl p-5 shadow-card">
                <Icon className="mb-4 h-7 w-7 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-14 rounded-3xl border bg-[#070d16] p-6 text-white shadow-elegant">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-primary">Security badges</p>
              <h2 className="mt-3 text-3xl font-bold">Trusted payment, verified cars, human support.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: LockKeyhole, text: "Secure booking request" },
                { icon: ShieldCheck, text: "Insurance included" },
                { icon: Plane, text: "Airport delivery" },
                { icon: Smile, text: "Satisfaction follow-up" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 rounded-2xl bg-white/8 p-4"><Icon className="h-5 w-5 text-primary" />{text}</div>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {partners.map((partner) => (
              <div key={partner} className="flex h-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white/70">
                <Building2 className="mr-2 h-4 w-4 text-primary" />{partner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
