import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Car, CheckCircle2, CircleDollarSign, Eraser, FileCheck2, FileSignature, Gauge, IdCard, Loader2, LockKeyhole, PenLine, Phone, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ApiError, type Contract } from "@/lib/api";
import { getContractPublicUrlFromContract } from "@/lib/contract-url";
import { contractsService } from "@/services/contracts/contracts.service";
import { contractsKeys } from "@/hooks/contracts/useContracts";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Non renseignee";
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
  contract.clientSignature ?? contract.signatureClient ?? contract.signature ?? null;

const isSigned = (contract?: Contract) =>
  Boolean(contract && (contract.signatureStatus === "signed" || contract.status === "Signé" || getDisplaySignature(contract)));

const InfoTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value?: string | number | null;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
      <Icon className="h-4 w-4 text-slate-400" />
      {label}
    </div>
    <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value || "Non renseigne"}</p>
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
  <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
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

const PublicContractSignature = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const signatureRef = useRef<ReactSignatureCanvas | null>(null);
  const canvasShellRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [hasInk, setHasInk] = useState(false);

  const { data: contract, isLoading, isError, error } = useQuery({
    queryKey: ["public-contract-signature", id],
    queryFn: () => contractsService.getSignatureContract(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });

  const signed = isSigned(contract);
  const signature = contract ? getDisplaySignature(contract) : null;
  const publicUrl = useMemo(() => (contract ? getContractPublicUrlFromContract(contract) : ""), [contract]);

  const syncCanvasSize = useCallback(() => {
    const shell = canvasShellRef.current;
    const pad = signatureRef.current;
    if (!shell || !pad || signed) return;

    const canvas = pad.getCanvas();
    const width = Math.max(1, Math.round(shell.offsetWidth));
    const height = Math.max(1, Math.round(shell.offsetHeight));
    const previousSignature = pad.isEmpty() ? null : canvas.toDataURL("image/png");

    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    setCanvasSize({ width, height });
    pad.clear();

    if (previousSignature) {
      pad.fromDataURL(previousSignature, { width, height });
      setHasInk(true);
    }
  }, [signed]);

  useEffect(() => {
    syncCanvasSize();
    const firstFrame = window.requestAnimationFrame(syncCanvasSize);
    const timeout = window.setTimeout(syncCanvasSize, 250);

    const shell = canvasShellRef.current;
    if (!shell) {
      return () => {
        window.cancelAnimationFrame(firstFrame);
        window.clearTimeout(timeout);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(syncCanvasSize);
    });
    resizeObserver.observe(shell);
    window.addEventListener("orientationchange", syncCanvasSize);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(timeout);
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", syncCanvasSize);
    };
  }, [syncCanvasSize, contract?.contractNumber]);

  const signContract = useMutation({
    mutationFn: (signatureDataUrl: string) => contractsService.sign(id ?? "", signatureDataUrl),
    onSuccess: (updatedContract) => {
      queryClient.setQueryData(["public-contract-signature", id], updatedContract);
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractsKeys.detail(updatedContract.id) });
      queryClient.invalidateQueries({ queryKey: ["public-contract-verification", updatedContract.contractNumber] });
      toast.success("Signature confirmee. Le contrat est maintenant signe.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Impossible de confirmer la signature."),
  });

  const clearSignature = () => {
    signatureRef.current?.clear();
    setHasInk(false);
  };

  const confirmSignature = () => {
    const pad = signatureRef.current;
    if (!pad || pad.isEmpty()) {
      toast.error("Veuillez signer dans la zone prevue.");
      return;
    }

    signContract.mutate(pad.toDataURL("image/png"));
  };

  const notFound = isError && error instanceof ApiError && error.status === 404;

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
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                Signature electronique securisee
              </div>
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-4xl">
                Contrat {contract?.contractNumber || id}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Consultez les informations du contrat puis signez depuis votre telephone, tablette ou ordinateur.
              </p>
            </div>
            <div className={cn("flex items-center gap-3 rounded-lg px-4 py-3", signed ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700")}>
              {signed ? <CheckCircle2 className="h-7 w-7 shrink-0" /> : <PenLine className="h-7 w-7 shrink-0" />}
              <div>
                <p className="text-xs font-medium uppercase">Statut</p>
                <p className="text-lg font-bold">{signed ? "Contrat signe" : "Signature requise"}</p>
              </div>
            </div>
          </div>
        </motion.header>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-52 rounded-lg" />
            </div>
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : notFound || !contract ? (
          <Card className="border-rose-200 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-rose-700">
                <LockKeyhole className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Contrat introuvable</h2>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  Le lien scanne ne correspond a aucun contrat disponible dans le systeme.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="grid gap-5 lg:grid-cols-[1fr_360px]"
          >
            <div className="space-y-5">
              <Card className={cn("border bg-white shadow-sm", signed ? "border-emerald-200" : "border-amber-200")}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className={cn("grid h-12 w-12 place-items-center rounded-lg", signed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      <FileCheck2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">{signed ? "Contrat signe" : "Contrat en attente de signature"}</h2>
                      <p className="text-sm text-slate-600">
                        {signed ? `Signe le ${formatDate(contract.signedAt)}` : "La signature sera associee directement a ce contrat."}
                      </p>
                    </div>
                  </div>
                  <ContractStatusBadge status={contract.status} />
                </CardContent>
              </Card>

              <Section title="Informations du contrat" icon={FileCheck2}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={FileSignature} label="Numero" value={contract.contractNumber} />
                  <InfoTile icon={CalendarDays} label="Debut location" value={formatDate(contract.reservationStartDate)} />
                  <InfoTile icon={CalendarDays} label="Fin location" value={formatDate(contract.reservationEndDate)} />
                  <InfoTile icon={CircleDollarSign} label="Total TTC" value={formatMoney(contract.reservationTotalTTC)} />
                </div>
              </Section>

              <Section title="Informations client" icon={UserRound}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={UserRound} label="Nom complet" value={contract.clientFullName} />
                  <InfoTile icon={Phone} label="Telephone" value={contract.clientPhone} />
                  <InfoTile icon={IdCard} label="Document" value={contract.clientDocumentNumber} />
                  <InfoTile icon={IdCard} label="Permis" value={contract.clientLicenseNumber} />
                </div>
              </Section>

              <Section title="Vehicule" icon={Car}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={Car} label="Vehicule" value={`${contract.carMake || ""} ${contract.carModel || ""}`.trim()} />
                  <InfoTile icon={IdCard} label="Immatriculation" value={contract.carPlate} />
                  <InfoTile icon={Gauge} label="Kilometrage" value={`${contract.carMileage || 0} km`} />
                  <InfoTile icon={Car} label="Couleur" value={contract.carColor} />
                </div>
              </Section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                      <FileSignature className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-950">Signature client</h2>
                      <p className="text-xs text-slate-500">Lien public: {publicUrl}</p>
                    </div>
                  </div>

                  {signed && signature ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        <p className="font-semibold">Contrat signe</p>
                        <p className="mt-1">Nouvelle signature desactivee.</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <img src={signature} alt={`Signature du contrat ${contract.contractNumber}`} className="mx-auto h-36 w-full object-contain" />
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">Date</span>
                          <span className="text-right font-medium">{formatDate(contract.signedAt)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">IP client</span>
                          <span className="text-right font-medium">{contract.signatureIp || "-"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-inner">
                        <div
                          ref={canvasShellRef}
                          className="h-56 w-full overflow-hidden rounded-md bg-white sm:h-64"
                          onPointerDown={() => setHasInk(true)}
                          onTouchStart={() => setHasInk(true)}
                          onMouseDown={() => setHasInk(true)}
                        >
                          <ReactSignatureCanvas
                            ref={signatureRef}
                            clearOnResize={false}
                            backgroundColor="rgb(255,255,255)"
                            penColor="rgb(15, 23, 42)"
                            minWidth={1.3}
                            maxWidth={3}
                            canvasProps={{
                              width: canvasSize.width,
                              height: canvasSize.height,
                              className: "block touch-none select-none bg-white",
                              style: {
                                width: `${canvasSize.width}px`,
                                height: `${canvasSize.height}px`,
                                maxWidth: "100%",
                                touchAction: "none",
                                pointerEvents: "auto",
                                cursor: "crosshair",
                              },
                              "aria-label": "Zone de signature client",
                            }}
                            onBegin={() => setHasInk(true)}
                            onEnd={() => setHasInk(Boolean(signatureRef.current && !signatureRef.current.isEmpty()))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button variant="outline" onClick={clearSignature} disabled={signContract.isPending} className="h-11 rounded-lg">
                          <Eraser className="mr-2 h-4 w-4" />
                          Effacer signature
                        </Button>
                        <Button onClick={confirmSignature} disabled={signContract.isPending} className="h-11 rounded-lg">
                          {signContract.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          Confirmer signature
                        </Button>
                      </div>
                      <p className="text-xs leading-5 text-slate-500">
                        En confirmant, votre signature, la date et l'adresse IP sont enregistrees avec le contrat.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default PublicContractSignature;
