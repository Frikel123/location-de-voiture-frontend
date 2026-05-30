import type { Contract } from "@/lib/api";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { ContractQrCode } from "@/components/contracts/ContractQrCode";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(Number(value) || 0);

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
};

const Field = ({ label, value }: { label: string; value?: string | number | boolean | null }) => (
  <div className="min-w-0 rounded-2xl border border-border/70 bg-background/80 p-3">
    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-1 break-words text-sm font-medium">{value === true ? "Oui" : value === false ? "Non" : value || "-"}</p>
  </div>
);

export const ContractPreview = ({ contract }: { contract: Contract }) => {
  const clientSignature = contract.clientSignature ?? contract.signatureClient;
  const agencySignature = contract.agencySignature ?? contract.signatureAdmin;

  return (
  <article className="mx-auto max-w-[820px] overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
    <header className="bg-slate-950 px-6 py-6 text-white print:bg-slate-950">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200">ATLAS CARS</p>
          <h2 className="mt-3 text-2xl font-semibold">Contrat de location</h2>
          <p className="mt-1 text-sm text-slate-300">Contrat #{contract.contractNumber}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <ContractStatusBadge status={contract.status} />
            <ContractQrCode contract={contract} />
          </div>
          <p className="mt-3 text-sm text-slate-300">Emission: {formatDate(contract.createdAt)}</p>
          <p className="text-sm text-slate-300">Signature: {formatDate(contract.signedAt)}</p>
          <p className="text-sm text-slate-300">Statut signature: {contract.signatureStatus === "signed" ? "Signe" : "Non signe"}</p>
        </div>
      </div>
    </header>

    <div className="space-y-6 p-6">
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Agence</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Nom" value={contract.agencyName || "Atlas Cars"} />
          <Field label="Adresse" value={contract.agencyAddress || "Casablanca, Maroc"} />
          <Field label="Telephone" value={contract.agencyPhone || "06 50 95 86 75"} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Client</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nom complet" value={contract.clientFullName} />
          <Field label="CIN / Passeport" value={contract.clientDocumentNumber} />
          <Field label="Telephone" value={contract.clientPhone} />
          <Field label="Email" value={contract.clientEmail} />
          <Field label="Adresse" value={contract.clientAddress} />
          <Field label="Permis" value={contract.clientLicenseNumber} />
          <Field label="Delivrance permis" value={formatDate(contract.clientLicenseIssuedAt)} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Voiture</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Marque" value={contract.carMake} />
          <Field label="Modele" value={contract.carModel} />
          <Field label="Immatriculation" value={contract.carPlate} />
          <Field label="Kilometrage depart" value={`${contract.carMileage || 0} km`} />
          <Field label="Couleur" value={contract.carColor} />
          <Field label="Carburant" value={contract.carFuel} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Location</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date debut" value={formatDate(contract.reservationStartDate)} />
          <Field label="Date fin" value={formatDate(contract.reservationEndDate)} />
          <Field label="Prix / jour" value={formatMoney(contract.reservationDailyRate)} />
          <Field label="Nombre jours" value={contract.reservationDays} />
          <Field label="Total" value={formatMoney(contract.reservationTotalTTC)} />
          <Field label="Caution" value={formatMoney(contract.reservationDeposit)} />
          <Field label="Assurance" value={contract.insuranceName || "Assurance standard"} />
          <Field label="Police assurance" value={contract.insurancePolicyNumber} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Conditions generales</h3>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>1. Le client est responsable du vehicule, de ses accessoires et documents pendant toute la duree de location.</li>
          <li>2. Tout accident doit etre declare immediatement a l'agence et aux autorites competentes avec constat officiel.</li>
          <li>3. Le vehicule doit etre restitue avec le meme niveau de carburant et dans un etat propre.</li>
          <li>4. Tout retard de restitution peut entrainer une facturation supplementaire selon le tarif journalier.</li>
          <li>5. Les dommages, pertes de cles, pneumatiques, infractions et amendes restent a la charge du client si non couverts.</li>
          <li>6. La conduite est reservee au client signataire et aux conducteurs autorises par ecrit dans le dossier.</li>
          <li>7. La restitution se fait a l'agence ou au lieu convenu apres controle contradictoire du vehicule.</li>
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 p-4">
          <p className="text-sm font-semibold">Signature client</p>
          <p className="mt-1 text-xs text-muted-foreground">Date: {formatDate(contract.signedAt)} | IP: {contract.signatureIp || "-"}</p>
          {clientSignature ? <img src={clientSignature} alt="Signature client" className="mt-4 h-24 w-full object-contain" /> : <div className="mt-12 border-t border-dashed" />}
        </div>
        <div className="rounded-2xl border border-border/70 p-4">
          <p className="text-sm font-semibold">Signature agence</p>
          {agencySignature ? <img src={agencySignature} alt="Signature agence" className="mt-4 h-24 w-full object-contain" /> : <div className="mt-12 border-t border-dashed" />}
        </div>
      </section>
    </div>
  </article>
  );
};
