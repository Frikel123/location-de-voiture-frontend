import type { Contract, ContractPayload, ContractStatus, LegacyContractStatus } from "@/lib/api";

export const CONTRACT_STATUSES: ContractStatus[] = ["Brouillon", "Confirmé", "Signé", "Terminé", "Annulé"];

export type ContractSortKey = "date" | "client" | "amount" | "status";

export const normalizeContractStatus = (status: Contract["status"]): ContractStatus => {
  if (status === "En attente" || status === "Actif") return "Confirmé";
  if (status === "Confirm\u00c3\u00a9") return "Confirmé";
  if (status === "Sign\u00c3\u00a9") return "Signé";
  if (status === "Termin\u00c3\u00a9") return "Terminé";
  if (status === "Annul\u00c3\u00a9") return "Annulé";
  return status as ContractStatus;
};

export const isLegacyContractStatus = (status: Contract["status"]): status is LegacyContractStatus =>
  status === "En attente" || status === "Actif";

export const createEmptyContractPayload = (): Omit<ContractPayload, "contractNumber"> => ({
  status: "Brouillon",
  contractStatus: "Brouillon",
  contractToken: "",
  qrUrl: "",
  bookingId: null,
  carId: 0,
  clientFullName: "",
  clientPhone: "",
  clientEmail: "",
  clientDocumentNumber: "",
  clientAddress: "",
  clientLicenseNumber: "",
  clientLicenseIssuedAt: "",
  carMake: "",
  carModel: "",
  carPlate: "",
  carYear: "",
  carFuel: "",
  carColor: "",
  carMileage: 0,
  reservationStartDate: "",
  reservationEndDate: "",
  reservationDays: 0,
  reservationDailyRate: 0,
  reservationDeposit: 0,
  reservationTotalTTC: 0,
  reservationPaymentMethod: "Espèces",
  agencyName: "Atlas Cars",
  agencyAddress: "Casablanca, Maroc",
  agencyPhone: "06 50 95 86 75",
  insuranceName: "Assurance tous risques",
  insurancePolicyNumber: "",
  insuranceIncluded: true,
  signedAt: "",
  signatureIp: "",
  signatureStatus: "unsigned",
  notes: "",
  signature: null,
});

export const buildContractNumber = () => {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `AC-${ymd}-${String(date.getTime()).slice(-5)}`;
};

export const buildContractToken = (contractNumber: string) =>
  contractNumber.trim().replace(/[^a-zA-Z0-9-]/g, "-");
