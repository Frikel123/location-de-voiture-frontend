import { BadgeDollarSign, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const itemKeys = [
  { icon: BadgeDollarSign, title: "why.priceTitle", desc: "why.priceDesc" },
  { icon: Zap, title: "why.fastTitle", desc: "why.fastDesc" },
  { icon: Clock, title: "why.availableTitle", desc: "why.availableDesc" },
] as const;

export const WhyUs = () => {
  const { t } = useI18n();

  return (
    <section id="pourquoi" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t("why.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("why.subtitle")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {itemKeys.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6 text-center shadow-card hover:shadow-elegant transition-shadow border-border/60">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t(title)}</h3>
              <p className="text-muted-foreground text-sm">{t(desc)}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
