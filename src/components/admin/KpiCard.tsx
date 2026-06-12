import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer } from "recharts";

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<any>;
  hint?: string | null;
  sparkData?: Array<Record<string, any>>;
  sparkKey?: string;
};

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon: Icon, hint = null, sparkData, sparkKey = "value" }) => {
  const hasSpark = Array.isArray(sparkData) && sparkData.length > 0;

  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-card transition-all hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="admin-stat-label text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gold-icon">
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </div>
        </div>

        {hasSpark && (
          <div className="mt-3 h-10 w-full">
            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Line type="monotone" dataKey={sparkKey} stroke="#D4AF37" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
