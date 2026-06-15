import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { jsPDF } from "jspdf";
import { utils, writeFile } from "xlsx";
import { Download, FileDown, Trophy } from "lucide-react";
import { api, Booking, Car, Contract } from "@/lib/api";
import { buildCustomerRows, buildRevenueMonths, buildVehicleRevenue, money } from "@/lib/admin-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Reports = () => {
  const { data: cars = [] } = useQuery({ queryKey: ["admin-cars"], queryFn: () => api.get<Car[]>("/cars") });
  const { data: bookings = [] } = useQuery({ queryKey: ["admin-bookings"], queryFn: () => api.get<Booking[]>("/bookings") });
  const { data: contracts = [] } = useQuery({ queryKey: ["admin-contracts"], queryFn: () => api.get<Contract[]>("/contracts") });

  const revenueMonths = useMemo(() => buildRevenueMonths(bookings, contracts), [bookings, contracts]);
  const vehicleRevenue = useMemo(() => buildVehicleRevenue(cars, bookings, contracts), [cars, bookings, contracts]);
  const customers = useMemo(() => buildCustomerRows(bookings, contracts), [bookings, contracts]);

  const exportPdf = useCallback(() => {
    const doc = new jsPDF({ format: "a4", unit: "pt" });
    doc.setFontSize(20);
    doc.text("N1 Lux Cars advanced reports", 40, 48);
    doc.setFontSize(12);
    doc.text(`Revenue this month: ${money(revenueMonths.at(-1)?.revenue ?? 0)} �`, 40, 86);
    doc.text(`Top vehicle: ${vehicleRevenue[0]?.vehicle ?? "-"}`, 40, 106);
    doc.text(`Top customer: ${customers[0]?.customer ?? "-"}`, 40, 126);
    vehicleRevenue.slice(0, 8).forEach((row, index) => {
      doc.text(`${index + 1}. ${row.vehicle}: ${money(row.revenue)} � (${row.rentals} rentals)`, 40, 170 + index * 20);
    });
    doc.save("atlas_cars_advanced_reports.pdf");
  }, [customers, revenueMonths, vehicleRevenue]);

  const exportExcel = useCallback(() => {
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.json_to_sheet(revenueMonths), "Revenue by month");
    utils.book_append_sheet(workbook, utils.json_to_sheet(vehicleRevenue), "Revenue by vehicle");
    utils.book_append_sheet(workbook, utils.json_to_sheet(customers), "Top customers");
    writeFile(workbook, "atlas_cars_advanced_reports.xlsx");
  }, [customers, revenueMonths, vehicleRevenue]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 rounded-full">Advanced reports</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Revenue, customers and fleet performance</h2>
            <p className="mt-2 text-sm text-muted-foreground">Monthly revenue, revenue by vehicle, top customers and most rented vehicles.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={exportPdf}><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
            <Button className="rounded-2xl" onClick={exportExcel}><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle>Revenue by month</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueMonths}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${money(Number(value))} �`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle>Revenue by vehicle</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleRevenue.slice(0, 8)} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="vehicle" type="category" width={120} />
                <Tooltip formatter={(value) => [`${money(Number(value))} �`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportTable title="Top customers" rows={customers.slice(0, 8)} first="customer" />
        <ReportTable title="Most rented vehicles" rows={vehicleRevenue.slice(0, 8)} first="vehicle" />
      </div>
    </div>
  );
};

const ReportTable = ({ title, rows, first }: { title: string; rows: any[]; first: "customer" | "vehicle" }) => (
  <Card className="border-border/70 shadow-card">
    <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> {title}</CardTitle></CardHeader>
    <CardContent className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-center">Rentals</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row[first]}>
              <TableCell className="font-medium">{row[first]}</TableCell>
              <TableCell className="text-center">{row.rentals}</TableCell>
              <TableCell className="text-right font-semibold">{money(row.revenue)} �</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default Reports;
