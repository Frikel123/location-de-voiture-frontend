import type { Contract, ContractPayload, ContractStatus, LegacyContractStatus } from "@/lib/api";

export const CONTRACT_STATUSES: ContractStatus[] = ["Brouillon", "Confirm�", "Sign�", "Termin�", "Annul�"];

export type ContractSortKey = "date" | "client" | "amount" | "status";

export const normalizeContractStatus = (status: Contract["status"]): ContractStatus => {
  if (status === "En attente" || status === "Actif") return "Confirm�";
  if (status === "Confirm\u00c3\u00a9") return "Confirm�";
  if (status === "Sign\u00c3\u00a9") return "Sign�";
  if (status === "Termin\u00c3\u00a9") return "Termin�";
  if (status === "Annul\u00c3\u00a9") return "Annul�";
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
  reservationPaymentMethod: "Esp�ces",
  agencyName: "N1 Lux Cars",
  agencyAddress: "VCRF+F8M, Meknès",
  agencyPhone: "0646494968",
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
  const year = date.getFullYear();
  // generate a short sequence from timestamp to simulate sequential id
  const seq = String(date.getTime()).slice(-5).padStart(5, "0");
  return `N1-${year}-${seq}`;
};

export const buildContractToken = (contractNumber: string) =>
  contractNumber.trim().replace(/[^a-zA-Z0-9-]/g, "-");
