import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { month: string; revenue: number };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="admin-chart-tooltip rounded-xl border p-3 text-sm shadow-2xl">
      <div className="admin-chart-tooltip-label text-xs uppercase tracking-[0.18em]">{label}</div>
      <div className="admin-chart-tooltip-value mt-1 text-lg font-semibold">
        {formatCurrency(Number(payload[0].value))} MAD
      </div>
    </div>
  );
};

export const RevenueChart: React.FC<{ data: Point[] }> = ({ data = [] }) => {
  const hasData = data.some((point) => Number(point.revenue) > 0);

  if (!hasData) {
    return (
      <div className="admin-chart-empty">
        <div className="admin-chart-empty-visual" />
        <p className="text-sm font-semibold text-foreground">Aucune donnée de revenu</p>
        <p className="mt-1 text-xs text-muted-foreground">Les revenus apparaîtront ici après les premières réservations.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradientPremium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF2B7" stopOpacity={0.42} />
            <stop offset="48%" stopColor="#D4AF37" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--admin-chart-grid)" strokeDasharray="4 8" vertical={false} />
        <XAxis dataKey="month" stroke="var(--admin-chart-axis)" tickLine={false} axisLine={false} tickMargin={12} fontSize={12} />
        <YAxis
          stroke="var(--admin-chart-axis)"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickMargin={10}
          fontSize={12}
          tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#D4AF37"
          strokeWidth={3}
          fill="url(#revenueGradientPremium)"
          dot={{ r: 3, strokeWidth: 2, fill: "#071229", stroke: "#D4AF37" }}
          activeDot={{ r: 6, strokeWidth: 2, fill: "#FFF2B7", stroke: "#D4AF37" }}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
