export type Car = {
  id: number;
  name: string;
  price: number;
  image: string | null;
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
};

export type BookingPayload = {
  carId: number;
  customerName: string;
  phone: string;
  startDate: string;
  endDate: string;
};

export type LoginResponse = {
  token: string;
};

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseError = async (res: Response) => {
  const fallback = res.status === 401 ? "Email ou mot de passe incorrect" : "Requete echouee";
  const error = await res.json().catch(() => ({ message: fallback }));
  return new Error(error.message || error.error || fallback);
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

export const api = {
  get: async <T>(endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    return parseResponse<T>(res);
  },

  post: async <T>(endpoint: string, body: unknown) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return parseResponse<T>(res);
  },

  put: async <T>(endpoint: string, body: unknown) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return parseResponse<T>(res);
  },

  delete: async <T>(endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return parseResponse<T>(res);
  },
};
