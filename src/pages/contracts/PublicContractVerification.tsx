import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FileWarning,
  Fingerprint,
  Gauge,
  IdCard,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Signature,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, type Contract } from "@/lib/api";
import { getContractPublicUrlFromContract } from "@/lib/contract-url";
import { contractsService } from "@/services/contracts/contracts.service";
import { ContractQrCode } from "@/components/contracts/ContractQrCode";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
};

const formatMoney = (value?: number | null) =>
  new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const getDisplaySignature = (contract: Contract) =>
  contract.signature ?? contract.clientSignature ?? contract.signatureClient ?? null;

const getStatusTone = (status?: string | null) => {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized.includes("annul")) return "bg-rose-100 text-rose-700 ring-rose-200";
  if (normalized.includes("brouillon")) return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
};

const InfoTile = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof UserRound;
  label: string;
  value?: string | number | null;
  className?: string;
}) => (
  <div className={cn("rounded-lg border border-slate-200 bg-white p-3 shadow-sm", className)}>
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
      <Icon className="h-4 w-4 text-slate-400" />
      {label}
    </div>
    <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value || "Non renseigné"}</p>
  </div>
);

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) => (
  <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-sm">
    <CardContent className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </CardContent>
  </Card>
);

const PublicContractVerification = () => {
  const { id } = useParams();

  const { data: contract, isLoading, isError, error } = useQuery({
    queryKey: ["public-contract-verification", id],
    queryFn: () => contractsService.verify(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });

  const notFound = isError && error instanceof ApiError && error.status === 404;
  const signature = contract ? getDisplaySignature(contract) : null;
  const publicUrl = useMemo(() => (contract ? getContractPublicUrlFromContract(contract) : ""), [contract]);
  const displayStatus = contract?.contractStatus || contract?.status || "Validé";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Badge className="mb-3 rounded-full bg-slate-950 text-white hover:bg-slate-950">
                Verification officielle N1 Lux Cars
              </Badge>
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-4xl">
                Contrat {contract?.contractNumber || id}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                QR code sécurisé servant de preuve officielle de validation du contrat.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              <ShieldCheck className="h-7 w-7 shrink-0" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide">Statut public</p>
                <p className="text-lg font-bold">VALIDÉ</p>
              </div>
            </div>
          </div>
        </motion.header>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-52 rounded-lg" />
            </div>
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : notFound || !contract ? (
          <Card className="border-rose-200 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-rose-700">
                <FileWarning className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Contrat introuvable</h2>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  Le QR code scanne ne correspond a aucun contrat valide dans le systeme N1 Lux Cars.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="grid gap-5 lg:grid-cols-[1fr_320px]"
          >
            <div className="space-y-5">
              <Card className="border-emerald-200 bg-white shadow-sm">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                      <FileCheck2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Contrat vérifié</h2>
                      <p className="text-sm text-slate-600">Ce document existe dans la base officielle N1 Lux Cars.</p>
                    </div>
                  </div>
                  <Badge className={cn("w-fit rounded-full px-3 py-1 ring-1 hover:bg-transparent", getStatusTone(displayStatus))}>
                    {displayStatus}
                  </Badge>
                </CardContent>
              </Card>

              <Section title="Informations du contrat" icon={FileCheck2}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={Fingerprint} label="Numéro" value={contract.contractNumber} />
                  <InfoTile icon={CalendarDays} label="Date de création" value={formatDate(contract.createdAt)} />
                  <InfoTile icon={CalendarDays} label="Début location" value={formatDate(contract.reservationStartDate)} />
                  <InfoTile icon={CalendarDays} label="Fin location" value={formatDate(contract.reservationEndDate)} />
                  <InfoTile icon={CircleDollarSign} label="Total TTC" value={formatMoney(contract.reservationTotalTTC)} />
                  <InfoTile icon={LockKeyhole} label="URL officielle" value={publicUrl} />
                </div>
              </Section>

              <Section title="Informations client" icon={UserRound}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={UserRound} label="Nom complet" value={contract.clientFullName} />
                  <InfoTile icon={Phone} label="Téléphone" value={contract.clientPhone} />
                  <InfoTile icon={IdCard} label="Document" value={contract.clientDocumentNumber} />
                  <InfoTile icon={IdCard} label="Permis" value={contract.clientLicenseNumber} />
                </div>
              </Section>

              <Section title="Informations voiture" icon={Car}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={Car} label="Véhicule" value={`${contract.carMake || ""} ${contract.carModel || ""}`.trim()} />
                  <InfoTile icon={IdCard} label="Immatriculation" value={contract.carPlate} />
                  <InfoTile icon={Gauge} label="Kilométrage" value={`${contract.carMileage || 0} km`} />
                  <InfoTile icon={Car} label="Couleur" value={contract.carColor} />
                </div>
              </Section>

              <Section title="Signature électronique" icon={Signature}>
                {signature ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold">Signature vérifiée</p>
                        <p className="text-sm opacity-80">Signature électronique enregistrée avec le contrat.</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <img
                        src={signature}
                        alt={`Signature électronique du contrat ${contract.contractNumber}`}
                        className="mx-auto max-h-48 w-full max-w-xl object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Aucune signature électronique n'est enregistrée pour ce contrat.
                  </div>
                )}
              </Section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
              <Card className="border-slate-200 bg-slate-950 text-white shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold">QR sécurisé</h2>
                      <p className="text-xs text-slate-300">Preuve officielle de validation</p>
                    </div>
                  </div>
                  <ContractQrCode contract={contract} className="mx-auto max-w-full" size={220} />
                  <p className="mt-4 text-xs leading-5 text-slate-300">
                    Le QR code redirige uniquement vers la page publique de vérification du contrat.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Agence</span>
                    <span className="text-right text-sm font-semibold">{contract.agencyName || "N1 Lux Cars"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Créé le</span>
                    <span className="text-right text-sm font-semibold">{formatDate(contract.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Signature</span>
                    <span className="text-right text-sm font-semibold text-emerald-700">
                      {signature ? "Vérifiée" : "Non disponible"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default PublicContractVerification;
