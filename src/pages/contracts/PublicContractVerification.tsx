import { useParams } from "react-router-dom";
import { CheckCircle2, FileWarning, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { contractsService } from "@/services/contracts/contracts.service";
import { ContractPreview } from "@/components/contracts/ContractPreview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PublicContractVerification = () => {
  const { id } = useParams();

  const { data: contract, isLoading, isError, error } = useQuery({
    queryKey: ["public-contract-verification", id],
    queryFn: () => contractsService.verify(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });

  const notFound = isError && error instanceof ApiError && error.status === 404;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_32%),hsl(var(--background))] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/85 p-5 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 rounded-full">Verification officielle</Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">NAYS CAR</h1>
            <p className="mt-1 text-sm text-muted-foreground">Verification publique du contrat #{id}</p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-[620px] rounded-3xl" />
          </div>
        ) : notFound || !contract ? (
          <Card className="border-rose-200 bg-rose-50 text-rose-950 shadow-sm dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100">
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <FileWarning className="h-12 w-12" />
              <div>
                <h2 className="text-2xl font-semibold">Contrat introuvable</h2>
                <p className="mt-2 text-sm opacity-80">Le QR code scanne ne correspond a aucun contrat valide.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <Card className="border-emerald-200 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8" />
                  <div>
                    <h2 className="text-xl font-semibold">Contrat vérifié</h2>
                    <p className="text-sm opacity-80">Ce document existe dans le systeme NAYS CAR.</p>
                  </div>
                </div>
                <Badge className="w-fit rounded-full bg-emerald-600 text-white hover:bg-emerald-600">Valide</Badge>
              </CardContent>
            </Card>
            <ContractPreview contract={contract} />
          </div>
        )}
      </div>
    </main>
  );
};

export default PublicContractVerification;
