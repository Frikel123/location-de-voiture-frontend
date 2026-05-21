import { motion } from "framer-motion";
import { BadgeDollarSign, Clock, Headphones, ShieldCheck, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export const WhyUs = () => {
  const { language, t } = useI18n();
  const isFr = language === "fr";
  const items = [
    { icon: BadgeDollarSign, title: t("why.priceTitle"), desc: t("why.priceDesc") },
    { icon: Zap, title: t("why.fastTitle"), desc: t("why.fastDesc") },
    { icon: Clock, title: t("why.availableTitle"), desc: t("why.availableDesc") },
    {
      icon: ShieldCheck,
      title: isFr ? "Reservation securisee" : "Secure booking",
      desc: isFr ? "Process simple, prix clair et confirmation ecrite." : "Simple process, clear pricing and written confirmation.",
    },
    {
      icon: Headphones,
      title: isFr ? "Support local" : "Local support",
      desc: isFr ? "Une equipe a Fes pour t'aider avant et pendant la location." : "A Fez-based team to help before and during your rental.",
    },
  ];

  return (
    <section id="pourquoi" className="relative overflow-hidden bg-[#060912] py-24 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,189,146,0.16),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mb-12 max-w-3xl"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            {isFr ? "Experience NAYS CAR" : "NAYS CAR experience"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">{t("why.title")}</h2>
          <p className="mt-4 text-base leading-7 text-white/65 md:text-lg">{t("why.subtitle")}</p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {items.map(({ icon: Icon, title, desc }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full rounded-3xl border-white/10 bg-white/[0.06] p-6 text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.09]">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">{desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
