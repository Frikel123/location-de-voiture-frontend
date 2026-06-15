import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, CarFront, CheckCircle2, FileText, ShieldCheck, UserRound } from "lucide-react";
import { api, type Car } from "@/lib/api";
import { buildFleet, daysBetween } from "@/lib/fleet";
import { setSeo } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const steps = [
  { label: "Vehicle", icon: CarFront },
  { label: "Customer", icon: UserRound },
  { label: "Rental", icon: CalendarDays },
  { label: "Contract", icon: FileText },
  { label: "Confirm", icon: CheckCircle2 },
];

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

const BookingFlow = () => {
  const { lang = "fr" } = useParams();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    vehicleSlug: params.get("vehicle") ?? "",
    fullName: "",
    email: "",
    phone: "",
    pickupDate: today,
    returnDate: tomorrow,
    pickupLocation: "Fez Airport",
    notes: "",
  });

  const { data: cars } = useQuery({ queryKey: ["public-cars"], queryFn: () => api.get<Car[]>("/cars") });
  const fleet = useMemo(() => buildFleet(cars), [cars]);
  const selectedVehicle = fleet.find((vehicle) => vehicle.slug === form.vehicleSlug) ?? fleet[0];
  const rentalDays = daysBetween(form.pickupDate, form.returnDate);
  const total = selectedVehicle.price * rentalDays;

  useEffect(() => {
    setSeo({
      title: "Online car booking | N1 Lux Cars",
      description: "Complete your N1 Lux Cars rental in five steps with vehicle selection, customer details, rental options, contract preview and confirmation.",
      canonical: `/${lang}/booking`,
    });
  }, [lang]);

  const next = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const previous = () => setStep((current) => Math.max(current - 1, 0));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step < steps.length - 1) return next();
    window.open(
      waLink(`N1 Lux Cars booking confirmation request: ${selectedVehicle.name}, ${form.pickupDate} to ${form.returnDate}, ${form.fullName}, ${form.phone}, total ${total} �.`),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <main className="min-h-screen bg-secondary/35 py-24">
      <div className="container">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3 rounded-full">Secure online booking</Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Reserve your N1 Lux Cars vehicle</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">A clear five-step flow with pricing, contract preview and instant WhatsApp confirmation.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full"><Link to={`/${lang}#voitures`}>Back to fleet</Link></Button>
        </div>

        <div className="mb-6 grid gap-2 md:grid-cols-5">
          {steps.map(({ label, icon: Icon }, index) => (
            <div key={label} className={`rounded-2xl border p-4 ${index <= step ? "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground"}`}>
              <Icon className="mb-2 h-5 w-5" />
              <p className="text-sm font-semibold">{index + 1}. {label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-3xl p-6 shadow-card">
            {step === 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-semibold">Step 1: Vehicle selection</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fleet.map((vehicle) => (
                    <button
                      type="button"
                      key={vehicle.id}
                      onClick={() => setForm((current) => ({ ...current, vehicleSlug: vehicle.slug }))}
                      className={`rounded-3xl border p-3 text-left transition hover:-translate-y-1 ${selectedVehicle.slug === vehicle.slug ? "border-primary bg-primary/10" : "bg-background"}`}
                    >
                      <img src={vehicle.gallery[0]} alt={vehicle.name} className="aspect-[16/10] w-full rounded-2xl object-cover" loading="lazy" />
                      <h3 className="mt-3 font-semibold">{vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">{vehicle.category} • {vehicle.price} �/day</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-semibold">Step 2: Customer information</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))} />
                  <Input required type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
                  <Input className="md:col-span-2" type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-semibold">Step 3: Rental details</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Input type="date" value={form.pickupDate} onChange={(e) => setForm((c) => ({ ...c, pickupDate: e.target.value }))} />
                  <Input type="date" value={form.returnDate} onChange={(e) => setForm((c) => ({ ...c, returnDate: e.target.value }))} />
                  <Input className="md:col-span-2" placeholder="Pickup location" value={form.pickupLocation} onChange={(e) => setForm((c) => ({ ...c, pickupLocation: e.target.value }))} />
                  <Textarea className="md:col-span-2" placeholder="Special requests" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-semibold">Step 4: Contract preview</h2>
                <div className="mt-5 rounded-3xl border bg-background p-6">
                  <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-primary" /><strong>N1 Lux Cars rental agreement preview</strong></div>
                  <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                    <p><span className="text-muted-foreground">Vehicle:</span> {selectedVehicle.name}</p>
                    <p><span className="text-muted-foreground">Customer:</span> {form.fullName || "To be completed"}</p>
                    <p><span className="text-muted-foreground">Dates:</span> {form.pickupDate} to {form.returnDate}</p>
                    <p><span className="text-muted-foreground">Pickup:</span> {form.pickupLocation}</p>
                    <p><span className="text-muted-foreground">Insurance:</span> Included</p>
                    <p><span className="text-muted-foreground">Total TTC:</span> {total} �</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
                <h2 className="mt-4 text-3xl font-semibold">Step 5: Confirmation</h2>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Review complete. Submit to send the booking request to N1 Lux Cars on WhatsApp for final confirmation.</p>
              </motion.div>
            )}

            <div className="mt-8 flex justify-between gap-3">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={previous} disabled={step === 0}>Previous</Button>
              <Button type="submit" className="rounded-2xl">{step === steps.length - 1 ? "Confirm on WhatsApp" : "Continue"}</Button>
            </div>
          </Card>

          <Card className="h-fit rounded-3xl p-5 shadow-card">
            <img src={selectedVehicle.gallery[0]} alt={selectedVehicle.name} className="aspect-[4/3] w-full rounded-2xl object-cover" />
            <h2 className="mt-4 text-xl font-semibold">{selectedVehicle.name}</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>{selectedVehicle.category} • {selectedVehicle.transmission} • {selectedVehicle.fuel}</p>
              <p>{rentalDays} day(s) x {selectedVehicle.price} �</p>
            </div>
            <div className="mt-5 rounded-2xl bg-primary/10 p-4 text-primary">
              <p className="text-sm">Total estimate</p>
              <p className="text-3xl font-bold">{total} �</p>
            </div>
          </Card>
        </form>
      </div>
    </main>
  );
};

export default BookingFlow;
