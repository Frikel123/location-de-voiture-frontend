import type { Contract } from "@/lib/api";

const normalizeOrigin = (origin?: string | null) => origin?.replace(/\/$/, "");

const getDevelopmentOrigin = () => {
  const configuredHost = import.meta.env.VITE_PUBLIC_DEV_HOST as string | undefined;
  if (configuredHost) return normalizeOrigin(configuredHost);

  if (typeof window === "undefined") return "http://192.168.1.8:8080";

  const { protocol, hostname, port } = window.location;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return normalizeOrigin(window.location.origin);
  }

  return `${protocol}//192.168.1.8:${port || "8080"}`;
};

export const getContractPublicUrl = (contractNumber: string) => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
  const origin = normalizeOrigin(configuredUrl) || getDevelopmentOrigin();

  return `${origin}/signature/${encodeURIComponent(contractNumber)}`;
};

export const getContractPublicUrlFromContract = (contract: Pick<Contract, "contractNumber" | "contractToken" | "qrUrl">) =>
  getContractPublicUrl(contract.contractNumber || contract.contractToken || contract.qrUrl || "");

export const getContractPublicToken = (contract: Pick<Contract, "contractNumber" | "contractToken">) =>
  contract.contractNumber || contract.contractToken;
