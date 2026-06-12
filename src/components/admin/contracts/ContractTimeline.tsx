import React from "react";
import { ContractHistoryItem } from "@/lib/api";

const ContractTimeline: React.FC<{ items?: ContractHistoryItem[] }> = ({ items = [] }) => {
  if (!items.length) return <div className="text-sm text-muted-foreground">Aucun historique.</div>;

  return (
    <ol className="border-l border-border/70 pl-4 space-y-3">
      {items.map((it, idx) => (
        <li key={idx} className="relative">
          <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary" />
          <div className="text-sm font-semibold">{it.event}</div>
          <div className="text-xs text-muted-foreground">{it.date} • {it.actor}</div>
        </li>
      ))}
    </ol>
  );
};

export default ContractTimeline;
