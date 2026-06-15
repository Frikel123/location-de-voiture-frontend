import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Fuel, Receipt, ShieldCheck, TrendingUp, Wrench } from "lucide-react";
import { api, Booking, Car, Contract } from "@/lib/api";
import { buildExpenses, buildRevenueMonths, currentMonthRange, money } from "@/lib/admin-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const colors = ["#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

const Expenses = () => {
  const { data: cars = [] } = useQuery({ queryKey: ["admin-cars"], queryFn: () => api.get<Car[]>("/cars") });
  const { data: bookings = [] } = useQuery({ queryKey: ["admin-bookings"], queryFn: () => api.get<Booking[]>("/bookings") });
  const { data: contracts = [] } = useQuery({ queryKey: ["admin-contracts"], queryFn: () => api.get<Contract[]>("/contracts") });

  const expenses = useMemo(() => buildExpenses(cars), [cars]);
  const month = currentMonthRange();
  const monthlyRevenue = buildRevenueMonths(bookings, contracts).at(-1)?.revenue ?? 0;
  const monthlyExpenses = expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      return date >= month.start && date <= month.end;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  const profit = monthlyRevenue - monthlyExpenses;
  const byCategory = ["Maintenance", "Insurance", "Fuel", "Taxes"].map((category) => ({
    category,
    amount: expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-card">
        <Badge variant="outline" className="mb-3 rounded-full">Expense management</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Fleet expenses and monthly profit</h2>
        <p className="mt-2 text-sm text-muted-foreground">Maintenance, insurance, fuel and tax costs connected to rental profitability.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Monthly revenue" value={`${money(monthlyRevenue)} �`} icon={TrendingUp} tone="from-emerald-500 to-cyan-500" />
        <Metric label="Monthly expenses" value={`${money(monthlyExpenses)} �`} icon={Receipt} tone="from-rose-500 to-orange-500" />
        <Metric label="Monthly profit" value={`${money(profit)} �`} icon={ShieldCheck} tone="from-sky-500 to-indigo-500" />
        <Metric label="Planned costs" value={`${money(expenses.filter((expense) => expense.status === "Planned").reduce((sum, expense) => sum + expense.amount, 0))} �`} icon={Wrench} tone="from-amber-500 to-yellow-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle>Costs by category</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={110} paddingAngle={4}>
                  {byCategory.map((entry, index) => <Cell key={entry.category} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${money(Number(value))} �`, "Amount"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle>Expense ledger</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell><Category category={expense.category} /></TableCell>
                    <TableCell>{expense.vehicle}</TableCell>
                    <TableCell>{expense.vendor}</TableCell>
                    <TableCell><Badge variant="outline" className="rounded-full">{expense.status}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{money(expense.amount)} �</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Metric = ({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Receipt; tone: string }) => (
  <Card className="border-border/70 shadow-card">
    <CardContent className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 truncate text-2xl font-bold">{value}</p>
      </div>
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white`}>
        <Icon className="h-6 w-6" />
      </div>
    </CardContent>
  </Card>
);

const Category = ({ category }: { category: string }) => {
  const Icon = category === "Fuel" ? Fuel : category === "Maintenance" ? Wrench : category === "Insurance" ? ShieldCheck : Receipt;
  return <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {category}</span>;
};

export default Expenses;
