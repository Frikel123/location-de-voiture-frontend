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

export type ContractStatus = "Brouillon" | "Confirm\u00e9" | "Sign\u00e9" | "Termin\u00e9" | "Annul\u00e9";
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
  signatureIp?: string | null;
  signatureStatus?: string | null;
  notes?: string;
  signatureClient?: string | null;
  signatureAdmin?: string | null;
  signature?: string | null;
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
  signatureIp?: string;
  signatureStatus?: string;
  notes?: string;
  signatureClient?: string | null;
  signatureAdmin?: string | null;
  signature?: string | null;
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

type StorageType = "localStorage" | "sessionStorage";

const getStorage = (storageType: StorageType) => {
  if (typeof window === "undefined") return null;
  return storageType === "localStorage" ? window.localStorage : window.sessionStorage;
};

const hasStorage = (storageType: StorageType = "localStorage") => {
  const storage = getStorage(storageType);
  return Boolean(storage);
};

const getStoredItem = (key: string) => {
  if (!hasStorage("localStorage") && !hasStorage("sessionStorage")) return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
};

export const getStoredAccessToken = () => {
  return getStoredItem(ACCESS_TOKEN_KEY) ?? getStoredItem(LEGACY_TOKEN_KEY);
};

export const getStoredRefreshToken = () => {
  return getStoredItem(REFRESH_TOKEN_KEY);
};

export const saveAuthSession = (
  { accessToken, refreshToken }: AuthSession,
  remember: boolean = true,
) => {
  if (!hasStorage("localStorage") && !hasStorage("sessionStorage")) return;

  if (remember && hasStorage("localStorage")) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    window.localStorage.setItem(LEGACY_TOKEN_KEY, accessToken);
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    return;
  }

  if (hasStorage("sessionStorage")) {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    window.sessionStorage.setItem(LEGACY_TOKEN_KEY, accessToken);
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
};

export const clearAuthSession = () => {
  if (!hasStorage("localStorage") && !hasStorage("sessionStorage")) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
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

const mapApiEndpoint = (endpoint: string) => {
  if (endpoint === "/api/login") return "/auth/login";
  if (endpoint === "/api/logout") return "/auth/logout";
  if (endpoint === "/api/refresh") return "/auth/refresh";
  if (endpoint.startsWith("/api/")) return `/auth/${endpoint.slice(5)}`;
  return endpoint;
};

const isAuthEndpoint = (endpoint: string) =>
  endpoint === "/auth/login" || endpoint === "/auth/refresh" || endpoint === "/auth/logout" || endpoint === "/api/login" || endpoint === "/api/refresh" || endpoint === "/api/logout";

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

  const res = await fetch(`${API_URL}${mapApiEndpoint("/api/refresh")}`, {
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

  const mappedEndpoint = mapApiEndpoint(endpoint);
  let res: Response;

  try {
    res = await fetch(`${API_URL}${mappedEndpoint}`, init);
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
  logout: async () => {
    return request<{ success: boolean }>("/api/logout", {
      method: "POST",
      headers: getHeaders(),
    });
  },
};

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, UNAUTHORIZED_EVENT };
