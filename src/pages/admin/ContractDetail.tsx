import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Mail, MessageCircle, Printer, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ContractPayload, ContractStatus } from "@/lib/api";
import { generateContractPdf } from "@/lib/contract-pdf";
import { getContractPublicUrl } from "@/lib/contract-url";
import { SignatureCanvas } from "@/components/admin/SignatureCanvas";
import { ContractPreview } from "@/components/contracts/ContractPreview";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { useContract, useSaveContract } from "@/hooks/contracts/useContracts";
import { buildContractToken, CONTRACT_STATUSES, normalizeContractStatus } from "@/types/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Mail, MessageCircle, Printer, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ContractPayload, ContractStatus } from "@/lib/api";
import { generateContractPdf } from "@/lib/contract-pdf";
import { getContractPublicUrl } from "@/lib/contract-url";
import { SignatureCanvas } from "@/components/admin/SignatureCanvas";
import { ContractPreview } from "@/components/contracts/ContractPreview";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { useContract, useSaveContract } from "@/hooks/contracts/useContracts";
import { buildContractToken, CONTRACT_STATUSES, normalizeContractStatus } from "@/types/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const formatMoney = (value: number) => new Intl.NumberFormat("fr-MA").format(Number(value) || 0);
const hasSignature = (value?: string | null) => Boolean(value?.startsWith("data:image/"));

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContractStatus>("Brouillon");
  const [notes, setNotes] = useState("");
  const [signedAt, setSignedAt] = useState("");
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [adminSignature, setAdminSignature] = useState<string | null>(null);

  const { data: contract, isLoading, isError, error } = useContract(id);
  const saveContract = useSaveContract(id);

  useEffect(() => {
    if (!contract) return;
    setStatus(normalizeContractStatus(contract.status));
    setNotes(contract.notes ?? "");
    setSignedAt(contract.signedAt ? contract.signedAt.slice(0, 10) : "");
    setClientSignature(contract.clientSignature ?? contract.signatureClient ?? null);
    setAdminSignature(contract.agencySignature ?? contract.signatureAdmin ?? null);
  }, [contract]);

  const payload = useMemo<ContractPayload | null>(() => {
    if (!contract) return null;
    return {
      contractNumber: contract.contractNumber,
      contractToken: contract.contractToken || buildContractToken(contract.contractNumber),
      contractStatus: status,
      qrUrl: getContractPublicUrl(contract.contractNumber),
      qrCode: getContractPublicUrl(contract.contractNumber),
      status,
      bookingId: contract.bookingId ?? null,
      carId: contract.carId ?? 0,
      clientFullName: contract.clientFullName ?? "",
      clientPhone: contract.clientPhone ?? "",
      clientEmail: contract.clientEmail ?? "",
      clientDocumentNumber: contract.clientDocumentNumber ?? "",
      clientAddress: contract.clientAddress ?? "",
      clientLicenseNumber: contract.clientLicenseNumber ?? "",
      clientLicenseIssuedAt: contract.clientLicenseIssuedAt ?? "",
      carMake: contract.carMake ?? "",
      carModel: contract.carModel ?? "",
      carPlate: contract.carPlate ?? "",
      carYear: contract.carYear ?? "",
      carFuel: contract.carFuel ?? "",
      carColor: contract.carColor ?? "",
      carMileage: contract.carMileage ?? 0,
      reservationStartDate: contract.reservationStartDate ?? "",
      reservationEndDate: contract.reservationEndDate ?? "",
      reservationDays: contract.reservationDays ?? 0,
      reservationDailyRate: contract.reservationDailyRate ?? 0,
      reservationDeposit: contract.reservationDeposit ?? 0,
      reservationTotalTTC: contract.reservationTotalTTC ?? 0,
      reservationPaymentMethod: contract.reservationPaymentMethod ?? "Esp\u00e8ces",
      agencyName: contract.agencyName ?? "Service LLD",
      agencyAddress: contract.agencyAddress ?? "VC98+6G Meknes",
      agencyPhone: contract.agencyPhone ?? "0661927502",
      insuranceName: contract.insuranceName ?? "Assurance tous risques",
      insurancePolicyNumber: contract.insurancePolicyNumber ?? "",
      insuranceIncluded: contract.insuranceIncluded ?? true,
      signedAt: signedAt || (status === "Sign\u00e9" ? new Date().toISOString() : ""),
      signatureIp: contract.signatureIp ?? "",
      signatureStatus: contract.signatureStatus ?? (clientSignature ? "signed" : "unsigned"),
      notes,
      signatureClient: clientSignature,
      signatureAdmin: adminSignature,
      clientSignature,
      agencySignature: adminSignature,
    };
  }, [adminSignature, clientSignature, contract, notes, signedAt, status]);

  const previewContract = contract && payload ? { ...contract, ...payload } : contract;

  const save = () => {
    if (!payload) return;
    if (status === "Sign\u00e9" && (!hasSignature(clientSignature) || !hasSignature(adminSignature))) {
      toast.error("Les signatures client et agence sont requises avant de signer le contrat.");
      return;
    }
    saveContract.mutate(payload, {
      onSuccess: () => toast.success("Contrat mis a jour"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Erreur lors de la mise a jour."),
    });
  };

  const saveSignatures = () => {
    if (!hasSignature(clientSignature) || !hasSignature(adminSignature)) {
      toast.error("Les signatures client et agence sont obligatoires.");
      return;
    }
    save();
  };

  const downloadPdf = async () => {
    if (!previewContract) return;
    if (!hasSignature(previewContract.signatureClient)) {
      toast.error("PDF bloque: la signature client est obligatoire.");
      return;
    }

    try {
      await generateContractPdf(previewContract);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de generer le PDF.");
    }
  };

  const sendWhatsApp = () => {
    if (!contract) return;
    const phone = contract.clientPhone.replace(/\D/g, "");
    const text = `Bonjour ${contract.clientFullName}, votre contrat Service LLD ${contract.contractNumber} est pret.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const sendEmail = () => {
    if (!contract) return;
    const subject = `Votre contrat Service LLD ${contract.contractNumber}`;
    const body = `Bonjour ${contract.clientFullName},%0D%0AVotre contrat de location Service LLD est disponible.`;
    window.location.href = `mailto:${contract.clientEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  const timeline = useMemo(() => {
    if (!contract) return [];
    return contract.history?.length
      ? contract.history
      : [
          { date: contract.createdAt ?? "", event: "Contrat genere", actor: "Systeme" },
          { date: contract.reservationStartDate, event: "Debut de location", actor: "Planning" },
          { date: contract.updatedAt ?? "", event: `Statut actuel: ${normalizeContractStatus(contract.status)}`, actor: "Admin" },
          { date: contract.reservationEndDate, event: "Restitution prevue", actor: "Planning" },
        ];
  }, [contract]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-2xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Contrat #{contract?.contractNumber ?? "..."}</h1>
            {contract && <ContractStatusBadge status={contract.status} />}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Apercu, signatures electroniques, historique, impression et export PDF.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-2xl" onClick={downloadPdf} disabled={!previewContract}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => window.print()} disabled={!previewContract}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
          <Button className="rounded-2xl" onClick={sendWhatsApp} disabled={!contract}>
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="secondary" className="rounded-2xl" onClick={sendEmail} disabled={!contract?.clientEmail}>
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      ) : isError ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error instanceof Error ? error.message : "Impossible de charger le contrat."}</CardContent>
        </Card>
      ) : contract && previewContract ? (
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric title="Client" value={contract.clientFullName || "-"} />
              <Metric title="Voiture" value={`${contract.carMake || "-"} ${contract.carModel || ""}`} />
              <Metric title="Total" value={`${formatMoney(contract.reservationTotalTTC)} DH`} />
            </div>
            <ContractPreview contract={previewContract} />
          </div>

          <div className="space-y-6">
            <Card className="border-border/70 shadow-card">
              <CardHeader>
                <CardTitle>Controle du contrat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.signatureStatus === "signed" || normalizeContractStatus(contract.status) === "Sign\u00e9" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p className="font-semibold">Contrat signe</p>
                    <p className="mt-1">Date: {contract.signedAt || "-"} | IP client: {contract.signatureIp || "-"}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Contrat non signe
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as ContractStatus)}>
                    <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{CONTRACT_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date de signature</Label>
                  <Input type="date" value={signedAt} onChange={(event) => setSignedAt(event.target.value)} className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label>Notes internes</Label>
                  <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Remarques, conditions supplementaires ou suivi client" />
                </div>
                <Button className="w-full rounded-2xl" onClick={save} disabled={saveContract.isPending}>
                  <Save className="mr-2 h-4 w-4" /> {saveContract.isPending ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Signature electronique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SignatureCanvas label="Signature client" value={clientSignature} onChange={setClientSignature} />
                <SignatureCanvas label="Signature agence" value={adminSignature} onChange={setAdminSignature} />
                <Button variant="outline" className="w-full rounded-2xl" onClick={saveSignatures} disabled={saveContract.isPending}>
                  Enregistrer les signatures
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeline.map((step, index) => (
                  <div key={`${step.date}-${step.event}-${index}`} className="relative rounded-2xl border border-border/70 p-4">
                    <Badge variant="outline" className="mb-2 rounded-full">{step.actor}</Badge>
                    <p className="font-medium">{step.event}</p>
                    <p className="text-xs text-muted-foreground">{step.date || "-"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Metric = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      <p className="mt-2 truncate text-xl font-semibold">{value}</p>
    </CardContent>
  </Card>
);

export default ContractDetail;
