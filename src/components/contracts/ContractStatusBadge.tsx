import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Contract } from "@/lib/api";
import { normalizeContractStatus } from "@/types/contracts";

const statusStyles = {
  Brouillon: "border-slate-300/60 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
  Confirmé: "border-sky-300/60 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950/70 dark:text-sky-200",
  Signé: "border-emerald-300/60 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
  Terminé: "border-violet-300/60 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
  Annulé: "border-rose-300/60 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
};

export const ContractStatusBadge = ({ status, className }: { status: Contract["status"]; className?: string }) => {
  const normalized = normalizeContractStatus(status);
  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[normalized], className)}>
      {normalized}
    </Badge>
  );
};

