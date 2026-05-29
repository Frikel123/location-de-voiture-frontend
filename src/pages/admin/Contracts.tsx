import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { CalendarDays, Download, Eye, FileDown, FileText, MoreHorizontal, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Contract, ContractPayload, ContractStatus } from "@/lib/api";
import { generateContractPdf } from "@/lib/contract-pdf";
import { getContractPublicUrl } from "@/lib/contract-url";
import { ContractPreview } from "@/components/contracts/ContractPreview";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { useContracts, useDeleteContract, useSaveContract } from "@/hooks/contracts/useContracts";
import { buildContractNumber, buildContractToken, CONTRACT_STATUSES, createEmptyContractPayload, normalizeContractStatus, ContractSortKey } from "@/types/contracts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const formatMoney = (value: number) => new Intl.NumberFormat("fr-MA").format(Number(value) || 0);
const hasSignature = (value?: string | null) => Boolean(value?.startsWith("data:image/"));

const toPayload = (contract: Contract): ContractPayload => ({
  contractNumber: contract.contractNumber,
  contractToken: contract.contractToken || buildContractToken(contract.contractNumber),
  contractStatus: contract.contractStatus || normalizeContractStatus(contract.status),
  qrUrl: getContractPublicUrl(contract.contractNumber),
  qrCode: getContractPublicUrl(contract.contractNumber),
  status: normalizeContractStatus(contract.status),
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
  reservationPaymentMethod: contract.reservationPaymentMethod ?? "Espèces",
  agencyName: contract.agencyName ?? "NAYS CAR",
  agencyAddress: contract.agencyAddress ?? "Casablanca, Maroc",
  agencyPhone: contract.agencyPhone ?? "+212 6 00 00 00 00",
  insuranceName: contract.insuranceName ?? "Assurance tous risques",
  insurancePolicyNumber: contract.insurancePolicyNumber ?? "",
  insuranceIncluded: contract.insuranceIncluded ?? true,
  signedAt: contract.signedAt ?? "",
  notes: contract.notes ?? "",
  signatureClient: contract.clientSignature ?? contract.signatureClient,
  signatureAdmin: contract.agencySignature ?? contract.signatureAdmin,
  clientSignature: contract.clientSignature ?? contract.signatureClient,
  agencySignature: contract.agencySignature ?? contract.signatureAdmin,
});

const formToPreview = (form: Omit<ContractPayload, "contractNumber">, contractNumber: string, id = 0): Contract => ({
  id,
  contractNumber,
  ...form,
  status: form.status,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const Contracts = () => {
  const navigate = useNavigate();
  const { query: globalSearch } = useAdminSearch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [sort, setSort] = useState<ContractSortKey>("date");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<Contract | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [contractNumber, setContractNumber] = useState(buildContractNumber());
  const [form, setForm] = useState<Omit<ContractPayload, "contractNumber">>(createEmptyContractPayload());

  const { data: contracts = [], isLoading, isError, error } = useContracts();
  const saveContract = useSaveContract(editing?.id);
  const deleteContract = useDeleteContract();
  const computedDays =
    form.reservationStartDate && form.reservationEndDate
      ? Math.max(1, differenceInCalendarDays(parseISO(form.reservationEndDate), parseISO(form.reservationStartDate)) + 1)
      : 0;
  const computedTotal = form.reservationDailyRate * computedDays + form.reservationDeposit;

  const filteredContracts = useMemo(() => {
    const normalizedSearch = [search, globalSearch].filter(Boolean).join(" ").trim().toLowerCase();
    return [...contracts]
      .filter((contract) => {
        const normalizedStatus = normalizeContractStatus(contract.status || contract.contractStatus || "Brouillon");
        const haystack = [
          contract.contractNumber,
          contract.contractToken,
          contract.clientFullName,
          contract.clientPhone,
          contract.clientEmail,
          contract.clientDocumentNumber,
          contract.carMake,
          contract.carModel,
          contract.carPlate,
          contract.reservationStartDate,
          contract.reservationEndDate,
          contract.reservationTotalTTC,
          normalizedStatus,
        ]
          .filter((value) => value !== undefined && value !== null)
          .map(String)
          .join(" ")
          .toLowerCase();
        return (!normalizedSearch || haystack.includes(normalizedSearch)) && (statusFilter === "all" || normalizedStatus === statusFilter);
      })
      .sort((a, b) => {
        if (sort === "client") return (a.clientFullName ?? "").localeCompare(b.clientFullName ?? "");
        if (sort === "amount") return Number(b.reservationTotalTTC) - Number(a.reservationTotalTTC);
        if (sort === "status") return normalizeContractStatus(a.status || a.contractStatus || "Brouillon").localeCompare(normalizeContractStatus(b.status || b.contractStatus || "Brouillon"));
        return new Date(b.createdAt ?? b.reservationStartDate).getTime() - new Date(a.createdAt ?? a.reservationStartDate).getTime();
      });
  }, [contracts, globalSearch, search, sort, statusFilter]);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredContracts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filteredContracts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasActiveFilters = Boolean(search.trim() || globalSearch.trim() || statusFilter !== "all");

  const metrics = useMemo(
    () => ({
      total: contracts.length,
      signed: contracts.filter((contract) => normalizeContractStatus(contract.status) === "Signé").length,
      confirmed: contracts.filter((contract) => normalizeContractStatus(contract.status) === "Confirmé").length,
      revenue: contracts.reduce((sum, contract) => sum + Number(contract.reservationTotalTTC || 0), 0),
    }),
    [contracts],
  );

  const resetForm = () => {
    setEditing(null);
    setContractNumber(buildContractNumber());
    setForm(createEmptyContractPayload());
  };

  const openCreateDialog = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditDialog = (contract: Contract) => {
    setEditing(contract);
    setContractNumber(contract.contractNumber);
    setForm(toPayload(contract));
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.clientFullName.trim()) {
      toast.error("Le nom complet du client est requis.");
      return;
    }
    if (!form.clientPhone.trim()) {
      toast.error("Le telephone du client est requis.");
      return;
    }
    if (!form.reservationStartDate || !form.reservationEndDate) {
      toast.error("Les dates de location sont requises.");
      return;
    }
    if (new Date(form.reservationEndDate) < new Date(form.reservationStartDate)) {
      toast.error("La date de fin doit etre apres la date de debut.");
      return;
    }

    const normalizedStatus = normalizeContractStatus(form.status);
    const contractToken = form.contractToken || buildContractToken(contractNumber);

    saveContract.mutate(
      {
        contractNumber,
        ...form,
        contractToken,
        contractStatus: normalizedStatus,
        status: normalizedStatus,
        qrUrl: getContractPublicUrl(contractNumber),
        qrCode: getContractPublicUrl(contractNumber),
        reservationDays: computedDays,
        reservationTotalTTC: computedTotal,
        signedAt: form.status === "Signé" && !form.signedAt ? new Date().toISOString() : form.signedAt,
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Contrat mis a jour" : "Contrat cree");
          setFormOpen(false);
          resetForm();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Impossible de sauvegarder le contrat."),
      },
    );
  };

  const downloadExcel = () => {
    const sheet = utils.json_to_sheet(
      filteredContracts.map((contract) => ({
        ID: contract.contractNumber,
        Client: contract.clientFullName,
        Telephone: contract.clientPhone,
        Voiture: `${contract.carMake} ${contract.carModel}`,
        Immatriculation: contract.carPlate,
        Dates: `${contract.reservationStartDate} - ${contract.reservationEndDate}`,
        Total: contract.reservationTotalTTC,
        Caution: contract.reservationDeposit,
        Statut: normalizeContractStatus(contract.status),
      })),
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, sheet, "Contrats");
    writeFile(workbook, `nayscar_contrats_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const printContract = (contract: Contract) => {
    setPreview(contract);
    window.setTimeout(() => window.print(), 150);
  };

  const downloadPdf = async (contract: Contract) => {
    const clientSignature = contract.clientSignature ?? contract.signatureClient;
    const agencySignature = contract.agencySignature ?? contract.signatureAdmin;
    if (!hasSignature(clientSignature)) {
      toast.error("PDF bloque: la signature client est obligatoire.");
      return;
    }

    try {
      await generateContractPdf(contract);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de generer le PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 rounded-full">Contrats professionnels</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">Gestion des contrats</h2>
          <p className="mt-1 text-sm text-muted-foreground">Contrats generes automatiquement, signatures, PDF, impression et export Excel.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={downloadExcel} className="rounded-2xl">
            <FileDown className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button onClick={openCreateDialog} className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" /> Nouveau contrat
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Contrats" value={metrics.total} />
        <Metric title="Confirmes" value={metrics.confirmed} />
        <Metric title="Signes" value={metrics.signed} />
        <Metric title="Montant total" value={`${formatMoney(metrics.revenue)} DH`} />
      </div>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error instanceof Error ? error.message : "Impossible de charger les contrats."}</CardContent>
        </Card>
      )}

      <Card className="border-border/70 shadow-card">
        <CardHeader className="gap-4">
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Table contrats</CardTitle>
          <div className="grid gap-3 md:grid-cols-[1fr_170px_170px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher contrat, client ou voiture..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-2xl pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as ContractStatus | "all"); setPage(1); }}>
              <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {CONTRACT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as ContractSortKey)}>
              <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Plus recents</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="amount">Montant</SelectItem>
                <SelectItem value="status">Statut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border">
            {isLoading ? (
              <div className="space-y-2 p-4">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Voiture</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((contract, index) => (
                    <motion.tr key={contract.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} className="border-b transition-colors hover:bg-muted/45">
                      <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{contract.clientFullName}</div>
                        <div className="text-xs text-muted-foreground">{contract.clientPhone}</div>
                      </TableCell>
                      <TableCell>{`${contract.carMake || "-"} ${contract.carModel || ""}`}</TableCell>
                      <TableCell className="min-w-[180px] text-muted-foreground">{contract.reservationStartDate} - {contract.reservationEndDate}</TableCell>
                      <TableCell className="font-semibold">{formatMoney(contract.reservationTotalTTC)} DH</TableCell>
                      <TableCell><ContractStatusBadge status={contract.status} /></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Actions contrat">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/admin/contracts/${contract.id}`)}><Eye className="mr-2 h-4 w-4" /> Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPreview(contract)}><FileText className="mr-2 h-4 w-4" /> Apercu</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(contract)}><Pencil className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadPdf(contract)}><Download className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => printContract(contract)}><Printer className="mr-2 h-4 w-4" /> Imprimer</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteId(contract.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14">
                        <ContractsEmptyState hasContracts={contracts.length > 0} hasActiveFilters={hasActiveFilters} onCreate={openCreateDialog} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{filteredContracts.length} contrat(s) trouve(s)</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Precedent</Button>
              <span>Page {currentPage} / {pageCount}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Suivant</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(isOpen) => { setFormOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le contrat" : "Nouveau contrat"}</DialogTitle>
            <DialogDescription>Completez les informations juridiques, tarifaires et vehicule. Le total est calcule automatiquement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <FormSection title="Client">
                <Input placeholder="Nom complet" value={form.clientFullName} onChange={(e) => setForm((prev) => ({ ...prev, clientFullName: e.target.value }))} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="CIN / Passeport" value={form.clientDocumentNumber} onChange={(e) => setForm((prev) => ({ ...prev, clientDocumentNumber: e.target.value }))} />
                  <Input placeholder="Telephone" value={form.clientPhone} onChange={(e) => setForm((prev) => ({ ...prev, clientPhone: e.target.value }))} />
                  <Input placeholder="Email" value={form.clientEmail} onChange={(e) => setForm((prev) => ({ ...prev, clientEmail: e.target.value }))} />
                  <Input placeholder="Numero permis" value={form.clientLicenseNumber} onChange={(e) => setForm((prev) => ({ ...prev, clientLicenseNumber: e.target.value }))} />
                  <Input type="date" value={form.clientLicenseIssuedAt} onChange={(e) => setForm((prev) => ({ ...prev, clientLicenseIssuedAt: e.target.value }))} />
                </div>
                <Textarea placeholder="Adresse complete" value={form.clientAddress} onChange={(e) => setForm((prev) => ({ ...prev, clientAddress: e.target.value }))} />
              </FormSection>

              <FormSection title="Voiture">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Marque" value={form.carMake} onChange={(e) => setForm((prev) => ({ ...prev, carMake: e.target.value }))} />
                  <Input placeholder="Modele" value={form.carModel} onChange={(e) => setForm((prev) => ({ ...prev, carModel: e.target.value }))} />
                  <Input placeholder="Immatriculation" value={form.carPlate} onChange={(e) => setForm((prev) => ({ ...prev, carPlate: e.target.value }))} />
                  <Input placeholder="Couleur" value={form.carColor} onChange={(e) => setForm((prev) => ({ ...prev, carColor: e.target.value }))} />
                  <Input placeholder="Carburant" value={form.carFuel} onChange={(e) => setForm((prev) => ({ ...prev, carFuel: e.target.value }))} />
                  <Input type="number" placeholder="Kilometrage depart" value={form.carMileage || ""} onChange={(e) => setForm((prev) => ({ ...prev, carMileage: Number(e.target.value) }))} />
                </div>
              </FormSection>

              <FormSection title="Location">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input type="date" value={form.reservationStartDate} onChange={(e) => setForm((prev) => ({ ...prev, reservationStartDate: e.target.value }))} />
                  <Input type="date" value={form.reservationEndDate} onChange={(e) => setForm((prev) => ({ ...prev, reservationEndDate: e.target.value }))} />
                  <Input type="number" placeholder="Prix par jour" value={form.reservationDailyRate || ""} onChange={(e) => setForm((prev) => ({ ...prev, reservationDailyRate: Number(e.target.value) }))} />
                  <Input type="number" placeholder="Caution" value={form.reservationDeposit || ""} onChange={(e) => setForm((prev) => ({ ...prev, reservationDeposit: Number(e.target.value) }))} />
                </div>
                <Select value={form.reservationPaymentMethod} onValueChange={(value) => setForm((prev) => ({ ...prev, reservationPaymentMethod: value }))}>
                  <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Espèces">Especes</SelectItem>
                    <SelectItem value="Carte bancaire">Carte bancaire</SelectItem>
                    <SelectItem value="Virement">Virement</SelectItem>
                  </SelectContent>
                </Select>
              </FormSection>
            </div>

            <div className="space-y-5">
              <FormSection title="Parametres">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input readOnly value={contractNumber} />
                  <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as ContractStatus }))}>
                    <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{CONTRACT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input readOnly value={`${computedDays} jour(s)`} />
                  <Input readOnly value={`${formatMoney(computedTotal)} DH`} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border p-3">
                  <div>
                    <Label>Assurance incluse</Label>
                    <p className="text-xs text-muted-foreground">Mention affichee dans le contrat.</p>
                  </div>
                  <Switch checked={Boolean(form.insuranceIncluded)} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, insuranceIncluded: checked }))} />
                </div>
              </FormSection>

              <FormSection title="Agence & assurance">
                <Input placeholder="Nom agence" value={form.agencyName} onChange={(e) => setForm((prev) => ({ ...prev, agencyName: e.target.value }))} />
                <Input placeholder="Telephone agence" value={form.agencyPhone} onChange={(e) => setForm((prev) => ({ ...prev, agencyPhone: e.target.value }))} />
                <Textarea placeholder="Adresse agence" value={form.agencyAddress} onChange={(e) => setForm((prev) => ({ ...prev, agencyAddress: e.target.value }))} />
                <Input placeholder="Assurance" value={form.insuranceName} onChange={(e) => setForm((prev) => ({ ...prev, insuranceName: e.target.value }))} />
                <Input placeholder="Police assurance" value={form.insurancePolicyNumber} onChange={(e) => setForm((prev) => ({ ...prev, insurancePolicyNumber: e.target.value }))} />
                <Textarea placeholder="Notes internes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </FormSection>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPreview(formToPreview({ ...form, reservationDays: computedDays, reservationTotalTTC: computedTotal }, contractNumber, editing?.id))} className="rounded-2xl">
              Apercu
            </Button>
            <Button onClick={submit} disabled={saveContract.isPending} className="rounded-2xl">
              {saveContract.isPending ? "Enregistrement..." : editing ? "Mettre a jour" : "Creer le contrat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(isOpen) => !isOpen && setPreview(null)}>
        <DialogContent className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Apercu du contrat</DialogTitle>
            <DialogDescription>Version imprimable au format A4 avec toutes les clauses importantes.</DialogDescription>
          </DialogHeader>
          {preview && <ContractPreview contract={preview} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => preview && window.print()} className="rounded-2xl"><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
            <Button onClick={() => preview && downloadPdf(preview)} className="rounded-2xl"><Download className="mr-2 h-4 w-4" /> PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(openState) => { if (!openState) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action retirera le contrat de la base. Elle ne modifie pas la reservation liee.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl"
              onClick={() => deleteId && deleteContract.mutate(deleteId, {
                onSuccess: () => {
                  toast.success("Contrat supprime");
                  setDeleteId(null);
                },
                onError: (err) => toast.error(err instanceof Error ? err.message : "Suppression impossible."),
              })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Metric = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </CardContent>
  </Card>
);

const ContractsEmptyState = ({ hasContracts, hasActiveFilters, onCreate }: { hasContracts: boolean; hasActiveFilters: boolean; onCreate: () => void }) => {
  const title = hasContracts && hasActiveFilters ? "Aucun contrat ne correspond aux filtres." : "Aucun contrat enregistre.";
  const description =
    hasContracts && hasActiveFilters
      ? "Essayez de vider la recherche globale, le champ de recherche ou le filtre de statut."
      : "Les contrats sauvegardes dans la base de donnees apparaitront ici.";

  return (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <FileText className="h-7 w-7" />
      </div>
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm">{description}</p>
      {!hasContracts && (
        <Button onClick={onCreate} className="mt-5 rounded-2xl">
          <Plus className="mr-2 h-4 w-4" /> Nouveau contrat
        </Button>
      )}
    </div>
  );
};

const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-3 rounded-3xl border border-border/70 bg-card/80 p-5">
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-primary" />
      <p className="text-sm font-semibold">{title}</p>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

export default Contracts;
