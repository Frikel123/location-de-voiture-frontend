import { api, Contract, ContractPayload } from "@/lib/api";
import { normalizeContractStatus } from "@/types/contracts";

type ContractsApiResponse =
  | Contract[]
  | {
      data?: Contract[];
      items?: Contract[];
      contracts?: Contract[];
      result?: Contract[];
    };

const unwrapContractsResponse = (response: ContractsApiResponse): Contract[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.contracts)) return response.contracts;
  if (Array.isArray(response?.result)) return response.result;
  return [];
};

export const normalizeContract = (raw: any): Contract => {
  const status = normalizeContractStatus(raw.status ?? raw.contractStatus ?? "Brouillon");
  const clientSignature =
    raw.signature ?? raw.clientSignature ?? raw.client_signature ?? raw.signatureClient ?? raw.signature_client ?? null;
  const agencySignature = raw.agencySignature ?? raw.agency_signature ?? raw.signatureAdmin ?? raw.signature_admin ?? null;
  const qrCode = raw.qrCode ?? raw.qr_code ?? raw.qrUrl ?? raw.qr_url ?? null;

  return {
    ...raw,
    id: Number(raw.id),
    contractNumber: raw.contractNumber ?? raw.contract_number ?? "",
    contractToken: raw.contractToken ?? raw.contract_token ?? null,
    contractStatus: raw.contractStatus ?? raw.contract_status ?? status,
    qrUrl: qrCode,
    qrCode,
    status,
    bookingId: raw.bookingId ?? raw.booking_id ?? null,
    clientFullName: raw.clientFullName ?? raw.client_full_name ?? raw.customerName ?? "",
    clientPhone: raw.clientPhone ?? raw.client_phone ?? raw.phone ?? "",
    clientEmail: raw.clientEmail ?? raw.client_email ?? "",
    clientDocumentNumber: raw.clientDocumentNumber ?? raw.client_document_number ?? "",
    clientAddress: raw.clientAddress ?? raw.client_address ?? "",
    clientLicenseNumber: raw.clientLicenseNumber ?? raw.client_license_number ?? "",
    clientLicenseIssuedAt: raw.clientLicenseIssuedAt ?? raw.client_license_issued_at ?? "",
    carId: raw.carId ?? raw.car_id ?? 0,
    carMake: raw.carMake ?? raw.car_make ?? raw.car?.make ?? "",
    carModel: raw.carModel ?? raw.car_model ?? raw.car?.model ?? raw.car?.name ?? "",
    carPlate: raw.carPlate ?? raw.car_plate ?? "",
    carYear: raw.carYear ?? raw.car_year ?? "",
    carFuel: raw.carFuel ?? raw.car_fuel ?? "",
    carColor: raw.carColor ?? raw.car_color ?? "",
    carMileage: Number(raw.carMileage ?? raw.car_mileage ?? 0),
    reservationStartDate: raw.reservationStartDate ?? raw.reservation_start_date ?? raw.startDate ?? "",
    reservationEndDate: raw.reservationEndDate ?? raw.reservation_end_date ?? raw.endDate ?? "",
    reservationDays: Number(raw.reservationDays ?? raw.reservation_days ?? 0),
    reservationDailyRate: Number(raw.reservationDailyRate ?? raw.reservation_daily_rate ?? 0),
    reservationDeposit: Number(raw.reservationDeposit ?? raw.reservation_deposit ?? 0),
    reservationTotalTTC: Number(raw.reservationTotalTTC ?? raw.reservation_total_ttc ?? raw.totalPrice ?? 0),
    reservationPaymentMethod: raw.reservationPaymentMethod ?? raw.reservation_payment_method ?? "",
    agencyName: raw.agencyName ?? raw.agency_name ?? "",
    agencyAddress: raw.agencyAddress ?? raw.agency_address ?? "",
    agencyPhone: raw.agencyPhone ?? raw.agency_phone ?? "",
    insuranceName: raw.insuranceName ?? raw.insurance_name ?? "",
    insurancePolicyNumber: raw.insurancePolicyNumber ?? raw.insurance_policy_number ?? "",
    insuranceIncluded: Boolean(raw.insuranceIncluded ?? raw.insurance_included ?? true),
    signedAt: raw.signedAt ?? raw.signed_at ?? "",
    notes: raw.notes ?? "",
    signatureClient: clientSignature,
    signatureAdmin: agencySignature,
    signature: clientSignature,
    clientSignature,
    agencySignature,
    documents: raw.documents ?? [],
    history: raw.history ?? [],
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
};

export const contractsService = {
  list: async () => {
    const response = await api.get<ContractsApiResponse>("/contracts");
    console.log("[contracts] GET /contracts response:", response);

    const contracts = unwrapContractsResponse(response).map(normalizeContract);
    console.log("[contracts] normalized contracts:", contracts);

    return contracts;
  },
  get: async (id: string | number) => normalizeContract(await api.get<Contract>(`/contracts/${id}`)),
  verify: async (id: string | number) => normalizeContract(await api.get<Contract>(`/contracts/verify/${encodeURIComponent(String(id))}`)),
  create: async (payload: ContractPayload) => normalizeContract(await api.post<Contract>("/contracts", payload)),
  update: async (id: string | number, payload: ContractPayload) => normalizeContract(await api.put<Contract>(`/contracts/${id}`, payload)),
  remove: (id: string | number) => api.delete<{ message?: string }>(`/contracts/${id}`),
};
