import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Search, WalletCards } from "lucide-react";
import { api, Booking, Contract } from "@/lib/api";
import { buildPaymentRecords, money } from "@/lib/admin-analytics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Payments = () => {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const { data: bookings = [] } = useQuery({ queryKey: ["admin-bookings"], queryFn: () => api.get<Booking[]>("/bookings") });
  const { data: contracts = [] } = useQuery({ queryKey: ["admin-contracts"], queryFn: () => api.get<Contract[]>("/contracts") });
  const payments = useMemo(() => buildPaymentRecords(bookings, contracts), [bookings, contracts]);
  const filtered = payments.filter((payment) => {
    const haystack = `${payment.customer} ${payment.vehicle} ${payment.status}`.toLowerCase();
    return (status === "all" || payment.status === status) && (!search || haystack.includes(search.toLowerCase()));
  });
  const totals = payments.reduce((acc, payment) => ({ total: acc.total + payment.total, paid: acc.paid + payment.paid, remaining: acc.remaining + payment.remaining }), { total: 0, paid: 0, remaining: 0 });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-card">
        <Badge variant="outline" className="mb-3 rounded-full">Payment tracking</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Paid, partial and unpaid balances</h2>
        <p className="mt-2 text-sm text-muted-foreground">Track collected amounts and remaining balances per booking and contract.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total billed" value={`${money(totals.total)} �`} />
        <Metric label="Paid" value={`${money(totals.paid)} �`} />
        <Metric label="Remaining balance" value={`${money(totals.remaining)} �`} />
      </div>

      <Card className="border-border/70 shadow-card">
        <CardHeader className="gap-4">
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Payment ledger</CardTitle>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 rounded-2xl pl-9" placeholder="Search customer or vehicle..." />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partial payment">Partial payment</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.customer}</TableCell>
                  <TableCell>{payment.vehicle}</TableCell>
                  <TableCell>{payment.source}</TableCell>
                  <TableCell><PaymentStatus status={payment.status} /></TableCell>
                  <TableCell className="text-right font-semibold">{money(payment.paid)} �</TableCell>
                  <TableCell className="text-right font-semibold">{money(payment.remaining)} �</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <Card className="border-border/70 shadow-card">
    <CardContent className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </div>
      <WalletCards className="h-8 w-8 text-primary" />
    </CardContent>
  </Card>
);

const PaymentStatus = ({ status }: { status: "Paid" | "Partial payment" | "Unpaid" }) => {
  const className = status === "Paid" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" : status === "Partial payment" ? "border-amber-500/20 bg-amber-500/10 text-amber-600" : "border-rose-500/20 bg-rose-500/10 text-rose-500";
  return <Badge variant="outline" className={`rounded-full ${className}`}>{status}</Badge>;
};

export default Payments;
