import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameMonth, isWithinInterval, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  StickyNote,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, Booking, Contract } from "@/lib/api";
import { normalizeContractStatus } from "@/types/contracts";

type ClientStatus = "Actif" | "VIP" | "Nouveau" | "Inactif" | "Blacklist";
type SortKey = "name" | "reservations" | "contracts" | "revenue" | "recent";

type ManualClient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  notes: string;
};

type ClientRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  status: ClientStatus;
  reservations: Booking[];
  contracts: Contract[];
  revenue: number;
  lastActivity: Date | null;
  notes: string[];
  manual?: boolean;
};

const pageSize = 8;

const formatMoney = (value: number) => new Intl.NumberFormat("fr-MA").format(Number(value) || 0);

const safeDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CL";

const Clients = () => {
  const { query: globalSearch } = useAdminSearch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [manualClients, setManualClients] = useState<ManualClient[]>([]);
  const [form, setForm] = useState<ManualClient>({
    id: "",
    name: "",
    phone: "",
    email: "",
    document: "",
    notes: "",
  });

  const { data: bookings = [], isLoading: bookingsLoading, isError: bookingsError, error: bookingsErrorValue } = useQuery({
    queryKey: ["admin-bookings-list"],
    queryFn: () => api.get<Booking[]>("/bookings"),
  });

  const { data: contracts = [], isLoading: contractsLoading, isError: contractsError } = useQuery({
    queryKey: ["admin-contracts"],
    queryFn: () => api.get<Contract[]>("/contracts"),
  });

  const loading = bookingsLoading || contractsLoading;

  const clients = useMemo<ClientRecord[]>(() => {
    const map = new Map<string, ClientRecord>();
    const now = new Date();

    const ensure = (phone: string, name: string) => {
      const key = phone || name.toLowerCase();
      const existing = map.get(key);
      if (existing) return existing;

      const created: ClientRecord = {
        id: key,
        name: name || "Client sans nom",
        phone: phone || "-",
        email: "-",
        document: "-",
        status: "Inactif",
        reservations: [],
        contracts: [],
        revenue: 0,
        lastActivity: null,
        notes: [],
      };
      map.set(key, created);
      return created;
    };

    bookings.forEach((booking) => {
      const client = ensure(booking.phone, booking.customerName);
      client.reservations.push(booking);
      client.revenue += Number(booking.totalPrice || 0);
      const activityDate = safeDate(booking.createdAt) ?? safeDate(booking.startDate);
      if (activityDate && (!client.lastActivity || activityDate > client.lastActivity)) client.lastActivity = activityDate;
    });

    contracts.forEach((contract) => {
      const client = ensure(contract.clientPhone, contract.clientFullName);
      client.contracts.push(contract);
      client.email = contract.clientEmail || client.email;
      client.document = contract.clientDocumentNumber || client.document;
      client.revenue += Number(contract.reservationTotalTTC || 0);
      if (contract.notes) client.notes.push(contract.notes);
      const activityDate = safeDate(contract.updatedAt) ?? safeDate(contract.createdAt) ?? safeDate(contract.reservationStartDate);
      if (activityDate && (!client.lastActivity || activityDate > client.lastActivity)) client.lastActivity = activityDate;
    });

    manualClients.forEach((manual) => {
      const client = ensure(manual.phone, manual.name);
      client.name = manual.name || client.name;
      client.email = manual.email || client.email;
      client.document = manual.document || client.document;
      client.manual = true;
      if (manual.notes) client.notes.push(manual.notes);
      client.lastActivity = client.lastActivity ?? now;
    });

    return [...map.values()].map((client) => {
      const hasActiveReservation = client.reservations.some((booking) => {
        const start = safeDate(booking.startDate);
        const end = safeDate(booking.endDate);
        return start && end && isWithinInterval(now, { start, end });
      });
      const isBlacklisted = client.notes.some((note) => /blacklist|blacklisted|bloque|blocked/i.test(note));
      const isVip = client.revenue >= 10000 || client.contracts.length >= 3 || client.reservations.length >= 5;
      const isNew = Boolean(client.lastActivity && isSameMonth(client.lastActivity, now));
      const hasActiveContract = client.contracts.some((contract) => normalizeContractStatus(contract.status) === "Confirm\u00e9");

      return {
        ...client,
        status: isBlacklisted ? "Blacklist" : isVip ? "VIP" : hasActiveReservation || hasActiveContract ? "Actif" : isNew ? "Nouveau" : "Inactif",
      };
    });
  }, [bookings, contracts, manualClients]);

  const filtered = useMemo(() => {
    const combined = [search, globalSearch].filter(Boolean).join(" ").toLowerCase().trim();
    const result = clients.filter((client) => {
      const haystack = [client.name, client.phone, client.email, client.document].join(" ").toLowerCase();
      return (!combined || haystack.includes(combined)) && (statusFilter === "all" || client.status === statusFilter);
    });

    return [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "reservations") return b.reservations.length - a.reservations.length;
      if (sort === "contracts") return b.contracts.length - a.contracts.length;
      if (sort === "revenue") return b.revenue - a.revenue;
      return (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0);
    });
  }, [clients, globalSearch, search, sort, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(
    () => ({
      active: clients.filter((client) => client.status === "Actif").length,
      vip: clients.filter((client) => client.status === "VIP").length,
      blacklisted: clients.filter((client) => client.status === "Blacklist").length,
      newThisMonth: clients.filter((client) => client.lastActivity && isSameMonth(client.lastActivity, new Date())).length,
    }),
    [clients],
  );

  const recentActivity = useMemo(
    () =>
      clients
        .filter((client) => client.lastActivity)
        .sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0))
        .slice(0, 5),
    [clients],
  );

  const resetForm = () => {
    setForm({ id: "", name: "", phone: "", email: "", document: "", notes: "" });
  };

  const addClient = () => {
    if (!form.name.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Le telephone est obligatoire.");
      return;
    }

    setManualClients((current) => [
      ...current,
      { ...form, id: `${form.phone}-${Date.now()}`, name: form.name.trim(), phone: form.phone.trim() },
    ]);
    toast.success("Client ajoute a la liste CRM");
    setFormOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-card lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 rounded-full">CRM clients</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Portefeuille clients</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Vue premium des locataires, documents, reservations, contrats et activite commerciale.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="h-11 rounded-2xl">
            <Plus className="mr-2 h-4 w-4" /> Ajouter client
          </Button>
        </div>
      </section>

      {(bookingsError || contractsError) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {bookingsErrorValue instanceof Error ? bookingsErrorValue.message : "Impossible de charger les donnees clients."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients actifs" value={stats.active} icon={ShieldCheck} tone="from-emerald-500 to-cyan-500" />
        <StatCard label="Clients VIP" value={stats.vip} icon={Crown} tone="from-amber-500 to-orange-500" />
        <StatCard label="Blacklisted" value={stats.blacklisted} icon={Ban} tone="from-rose-500 to-red-500" />
        <StatCard label="Nouveaux ce mois" value={stats.newThisMonth} icon={UserPlus} tone="from-sky-500 to-indigo-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Clients</CardTitle>
              <span className="text-sm text-muted-foreground">{filtered.length} client(s)</span>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_170px_190px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher nom, telephone, CIN ou email..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-2xl pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as ClientStatus | "all"); setPage(1); }}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Nouveau">Nouveau</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                  <SelectItem value="Blacklist">Blacklist</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                <SelectTrigger className="h-11 rounded-2xl"><SlidersHorizontal className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Activite recente</SelectItem>
                  <SelectItem value="name">Nom client</SelectItem>
                  <SelectItem value="reservations">Reservations</SelectItem>
                  <SelectItem value="contracts">Contrats</SelectItem>
                  <SelectItem value="revenue">Chiffre d'affaires</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border">
              {loading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-xl" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Client</TableHead>
                      <TableHead>Telephone</TableHead>
                      <TableHead>CIN / Passport</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Reservations</TableHead>
                      <TableHead className="text-center">Contrats</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((client, index) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.025 }}
                        className="border-b transition-all hover:bg-muted/45"
                      >
                        <TableCell>
                          <div className="flex min-w-[190px] items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                                {initials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{client.name}</p>
                              <p className="text-xs text-muted-foreground">{client.manual ? "Ajoute manuellement" : "Client operationnel"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.document}</TableCell>
                        <TableCell className="max-w-[190px] truncate">{client.email}</TableCell>
                        <TableCell className="text-center font-semibold">{client.reservations.length}</TableCell>
                        <TableCell className="text-center font-semibold">{client.contracts.length}</TableCell>
                        <TableCell><StatusBadge status={client.status} /></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Actions client">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelected(client)}><Eye className="mr-2 h-4 w-4" /> Voir profil</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Ouverture de l'email client")}>
                                <Mail className="mr-2 h-4 w-4" /> Contacter
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toast.info("Notes client pretes dans le profil")}>
                                <StickyNote className="mr-2 h-4 w-4" /> Notes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <EmptyState onAdd={() => setFormOpen(true)} />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Page {currentPage} sur {pageCount}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Activite recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-2xl" />)
            ) : recentActivity.length > 0 ? (
              recentActivity.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelected(client)}
                  className="flex w-full items-center gap-3 rounded-2xl border bg-muted/20 p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-muted/45 hover:shadow-sm"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(client.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.lastActivity ? format(client.lastActivity, "dd/MM/yyyy") : "Activite inconnue"} - {formatMoney(client.revenue)} DH
                    </p>
                  </div>
                  <StatusBadge status={client.status} compact />
                </button>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aucune activite client pour le moment.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="rounded-3xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter client</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <Field label="Telephone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
            <Field label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
            <Field label="CIN / Passport" value={form.document} onChange={(value) => setForm((current) => ({ ...current, document: value }))} />
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 rounded-2xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-2xl">Annuler</Button>
            <Button onClick={addClient} className="rounded-2xl">Ajouter client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-5xl">
          {selected && <ClientProfile client={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: string }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="group border-border/70 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const StatusBadge = ({ status, compact = false }: { status: ClientStatus; compact?: boolean }) => {
  const className =
    status === "VIP"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
      : status === "Actif"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
        : status === "Nouveau"
          ? "border-sky-500/20 bg-sky-500/10 text-sky-600"
          : status === "Blacklist"
            ? "border-red-500/20 bg-red-500/10 text-red-600"
            : "border-slate-500/20 bg-slate-500/10 text-slate-600";

  return <Badge variant="outline" className={`rounded-full ${compact ? "px-2 text-[10px]" : ""} ${className}`}>{status}</Badge>;
};

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
      <Users className="h-7 w-7" />
    </div>
    <h3 className="mt-4 text-lg font-semibold">Aucun client trouve</h3>
    <p className="mt-1 max-w-md text-sm text-muted-foreground">Ajustez les filtres ou ajoutez un nouveau client pour enrichir votre CRM.</p>
    <Button onClick={onAdd} className="mt-5 rounded-2xl"><Plus className="mr-2 h-4 w-4" /> Ajouter client</Button>
  </div>
);

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl" />
  </div>
);

const ClientProfile = ({ client }: { client: ClientRecord }) => (
  <>
    <DialogHeader>
      <DialogTitle className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border border-border">
          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">{initials(client.name)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate">{client.name}</span>
          <span className="text-sm font-normal text-muted-foreground">{client.phone}</span>
        </span>
      </DialogTitle>
    </DialogHeader>

    <Tabs defaultValue="info" className="mt-2">
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1">
        <TabsTrigger value="info" className="rounded-xl">Infos</TabsTrigger>
        <TabsTrigger value="reservations" className="rounded-xl">Reservations</TabsTrigger>
        <TabsTrigger value="contracts" className="rounded-xl">Contrats</TabsTrigger>
        <TabsTrigger value="payments" className="rounded-xl">Paiements</TabsTrigger>
        <TabsTrigger value="notes" className="rounded-xl">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="Nom" value={client.name} />
          <Info label="Telephone" value={client.phone} />
          <Info label="Email" value={client.email} />
          <Info label="CIN / Passport" value={client.document} />
          <Info label="Statut" value={client.status} />
          <Info label="CA total" value={`${formatMoney(client.revenue)} DH`} strong />
        </div>
      </TabsContent>

      <TabsContent value="reservations" className="mt-5">
        <HistoryList
          empty="Aucune reservation liee a ce client."
          items={client.reservations.map((booking) => ({
            id: booking.id,
            title: booking.car?.name ?? "Reservation",
            meta: `${booking.startDate} - ${booking.endDate}`,
            amount: `${formatMoney(booking.totalPrice)} DH`,
          }))}
        />
      </TabsContent>

      <TabsContent value="contracts" className="mt-5">
        <HistoryList
          empty="Aucun contrat lie a ce client."
          items={client.contracts.map((contract) => ({
            id: contract.id,
            title: contract.contractNumber,
            meta: `${contract.carMake} ${contract.carModel} - ${normalizeContractStatus(contract.status)}`,
            amount: `${formatMoney(contract.reservationTotalTTC)} DH`,
          }))}
        />
      </TabsContent>

      <TabsContent value="payments" className="mt-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Info label="Total encaisse" value={`${formatMoney(client.revenue)} DH`} strong />
          <Info label="Contrats payes" value={String(client.contracts.length)} />
          <Info label="Mode frequent" value={client.contracts[0]?.reservationPaymentMethod ?? "Non renseigne"} />
        </div>
      </TabsContent>

      <TabsContent value="notes" className="mt-5">
        {client.notes.length > 0 ? (
          <div className="space-y-3">
            {client.notes.map((note, index) => (
              <div key={`${note}-${index}`} className="rounded-2xl border bg-muted/25 p-4 text-sm">{note}</div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aucune note interne pour ce client.</div>
        )}
      </TabsContent>
    </Tabs>
  </>
);

const Info = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
  <div className="rounded-2xl border bg-muted/25 p-4">
    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className={`mt-2 truncate ${strong ? "text-lg font-semibold text-primary" : "font-medium"}`}>{value || "-"}</p>
  </div>
);

const HistoryList = ({ items, empty }: { items: Array<{ id: number; title: string; meta: string; amount: string }>; empty: string }) => {
  if (items.length === 0) {
    return <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">{empty}</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/20 p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.meta}</p>
          </div>
          <div className="flex items-center gap-2 font-semibold text-primary">
            <WalletCards className="h-4 w-4" />
            {item.amount}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Clients;
