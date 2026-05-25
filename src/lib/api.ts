export type Car = {
  id: number;
  name: string;
  price: number;
  image: string | null;
  images?: string[] | null;
};

export type Booking = {
  id: number;
  customerName: string;
  phone: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  createdAt?: string;
  car?: Pick<Car, "id" | "name"> | null;
};

export type CarPayload = {
  name: string;
  price: number;
  image?: string | null;
  images?: string[] | null;
};

export type BookingPayload = {
  carId: number;
  customerName: string;
  phone: string;
  startDate: string;
  endDate: string;
};

export type ContractStatus = "Brouillon" | "Confirmé" | "Signé" | "Terminé" | "Annulé";
export type LegacyContractStatus = "En attente" | "Actif";

export type ContractDocument = {
  id: number;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
};

export type ContractHistoryItem = {
  date: string;
  event: string;
  actor: string;
};

export type Contract = {
  id: number;
  contractNumber: string;
  contractToken?: string | null;
  contractStatus?: string | null;
  qrUrl?: string | null;
  qrCode?: string | null;
  status: ContractStatus | LegacyContractStatus;
  bookingId?: number | null;
  clientFullName: string;
  clientPhone: string;
  clientEmail: string;
  clientDocumentNumber: string;
  clientAddress: string;
  clientLicenseNumber: string;
  clientLicenseIssuedAt?: string;
  carId?: number;
  carMake: string;
  carModel: string;
  carPlate: string;
  carYear: string;
  carFuel: string;
  carColor?: string;
  carMileage: number;
  reservationStartDate: string;
  reservationEndDate: string;
  reservationDays: number;
  reservationDailyRate: number;
  reservationDeposit: number;
  reservationTotalTTC: number;
  reservationPaymentMethod: string;
  agencyName?: string;
  agencyAddress?: string;
  agencyPhone?: string;
  insuranceName?: string;
  insurancePolicyNumber?: string;
  insuranceIncluded?: boolean;
  signedAt?: string;
  notes?: string;
  signatureClient?: string | null;
  signatureAdmin?: string | null;
  clientSignature?: string | null;
  agencySignature?: string | null;
  documents?: ContractDocument[];
  history?: ContractHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type ContractPayload = {
  contractNumber: string;
  contractToken?: string;
  contractStatus?: string;
  qrUrl?: string;
  qrCode?: string;
  status: ContractStatus;
  bookingId?: number | null;
  carId: number;
  clientFullName: string;
  clientPhone: string;
  clientEmail: string;
  clientDocumentNumber: string;
  clientAddress: string;
  clientLicenseNumber: string;
  clientLicenseIssuedAt?: string;
  carMake: string;
  carModel: string;
  carPlate: string;
  carYear: string;
  carFuel: string;
  carColor?: string;
  carMileage: number;
  reservationStartDate: string;
  reservationEndDate: string;
  reservationDays: number;
  reservationDailyRate: number;
  reservationDeposit: number;
  reservationTotalTTC: number;
  reservationPaymentMethod: string;
  agencyName?: string;
  agencyAddress?: string;
  agencyPhone?: string;
  insuranceName?: string;
  insurancePolicyNumber?: string;
  insuranceIncluded?: boolean;
  signedAt?: string;
  notes?: string;
  signatureClient?: string | null;
  signatureAdmin?: string | null;
  clientSignature?: string | null;
  agencySignature?: string | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  token?: string;
};

import { API_URL, API_URL_MISSING_MESSAGE } from "@/lib/api-config";

const UNAUTHORIZED_EVENT = "auth:unauthorized";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const LEGACY_TOKEN_KEY = "token";

type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

let refreshRequest: Promise<string> | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

export const getStoredAccessToken = () => {
  if (!hasStorage()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
};

export const getStoredRefreshToken = () => {
  if (!hasStorage()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const saveAuthSession = ({ accessToken, refreshToken }: AuthSession) => {
  if (!hasStorage()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(LEGACY_TOKEN_KEY, accessToken);
};

export const clearAuthSession = () => {
  if (!hasStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

const getHeaders = () => {
  const token = getStoredAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseError = async (res: Response) => {
  const fallback = res.status === 401 ? "Session expiree. Veuillez vous reconnecter." : "Requete echouee";
  const error = await res.json().catch(() => ({ message: fallback }));
  return new ApiError(error.message || error.error || fallback, res.status);
};

const parseResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
};

const isAuthEndpoint = (endpoint: string) => endpoint === "/auth/login" || endpoint === "/auth/refresh";

const notifyUnauthorized = () => {
  clearAuthSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
};

const refreshAccessToken = async () => {
  if (!API_URL) {
    throw new ApiError(API_URL_MISSING_MESSAGE, 500);
  }

  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new ApiError("Session expiree. Veuillez vous reconnecter.", 401);
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const session = await parseResponse<LoginResponse>(res);

  if (!session.accessToken || !session.refreshToken) {
    throw new ApiError("Session invalide. Veuillez vous reconnecter.", 401);
  }

  saveAuthSession(session);
  return session.accessToken;
};

const getFreshAccessToken = () => {
  if (!refreshRequest) {
    refreshRequest = refreshAccessToken().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
};

export const refreshAuthSession = () => getFreshAccessToken();

const request = async <T>(endpoint: string, init: RequestInit = {}, retry = true): Promise<T> => {
  if (!API_URL) {
    throw new ApiError(API_URL_MISSING_MESSAGE, 500);
  }

  let res: Response;

  try {
    res = await fetch(`${API_URL}${endpoint}`, init);
  } catch {
    throw new ApiError("Impossible de joindre le serveur API. Verifiez l'URL du backend.", 0);
  }

  if (res.status !== 401) {
    return parseResponse<T>(res);
  }

  if (!retry || isAuthEndpoint(endpoint)) {
    if (!isAuthEndpoint(endpoint)) notifyUnauthorized();
    throw await parseError(res);
  }

  try {
    const accessToken = await getFreshAccessToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);

    return request<T>(endpoint, { ...init, headers }, false);
  } catch (error) {
    notifyUnauthorized();
    throw error;
  }
};

export const api = {
  get: async <T>(endpoint: string) => {
    return request<T>(endpoint, {
      headers: getHeaders(),
    });
  },

  post: async <T>(endpoint: string, body: unknown) => {
    return request<T>(endpoint, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  },

  postForm: async <T>(endpoint: string, formData: FormData) => {
    const headers = getHeaders();
    // Content-Type must not be set for multipart form data
    delete (headers as Record<string, string>)["Content-Type"];
    return request<T>(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });
  },

  put: async <T>(endpoint: string, body: unknown) => {
    return request<T>(endpoint, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  },

  delete: async <T>(endpoint: string) => {
    return request<T>(endpoint, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },
};

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, UNAUTHORIZED_EVENT };
