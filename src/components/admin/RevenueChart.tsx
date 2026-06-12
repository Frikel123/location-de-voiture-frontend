import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { month: string; revenue: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0].value;
  return (
    <div className="admin-chart-tooltip rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg dark:border-white/10 dark:bg-[#071229]">
      <div className="admin-chart-tooltip-label text-xs text-gray-500 dark:text-slate-400">{label}</div>
      <div className="admin-chart-tooltip-value mt-1 text-lg font-semibold text-gray-900 dark:text-white">{value} DH</div>
    </div>
  );
};

export const RevenueChart: React.FC<{ data: Point[] }> = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradientPremium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.36} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" stroke="var(--admin-chart-axis)" tickLine={false} axisLine={false} />
        <YAxis stroke="var(--admin-chart-axis)" tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fill="url(#revenueGradientPremium)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
