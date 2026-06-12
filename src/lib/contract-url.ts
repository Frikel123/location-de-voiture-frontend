import type { Contract } from "@/lib/api";

const normalizeOrigin = (origin?: string | null) => {
  if (!origin) return undefined;
  const trimmed = origin.trim().replace(/\/$/, "");
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

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

const isAbsoluteUrl = (value?: string) => Boolean(value && /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value));

const normalizeLegacyContractUrl = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();

  const contractQueryMatch = trimmed.match(/(?:\/verify|\/signature)\?contract=([^&]+)/i);
  if (contractQueryMatch) {
    return getContractPublicSignatureUrl(decodeURIComponent(contractQueryMatch[1]));
  }

  const relativeSignatureMatch = trimmed.match(/^(?:https?:\/\/[^/]+)?(\/signature\/[\w-]+)$/i);
  if (relativeSignatureMatch) {
    const origin = normalizeOrigin(import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) || getDevelopmentOrigin();
    return `${origin}${relativeSignatureMatch[1]}`;
  }

  const relativeVerificationMatch = trimmed.match(/^(?:https?:\/\/[^/]+)?(\/contracts\/verify\/[\w-]+)$/i);
  if (relativeVerificationMatch) {
    const origin = normalizeOrigin(import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) || getDevelopmentOrigin();
    return `${origin}${relativeVerificationMatch[1]}`;
  }

  return isAbsoluteUrl(trimmed) ? trimmed : undefined;
};

export const getContractPublicSignatureUrl = (contractNumber: string) => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
  const origin = normalizeOrigin(configuredUrl) || getDevelopmentOrigin();

  return `${origin}/signature/${encodeURIComponent(contractNumber)}`;
};

export const getContractPublicVerificationUrl = (contractNumber: string) => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
  const origin = normalizeOrigin(configuredUrl) || getDevelopmentOrigin();

  return `${origin}/contracts/verify/${encodeURIComponent(contractNumber)}`;
};

export const getContractPublicUrl = getContractPublicSignatureUrl;

export const getContractPublicUrlFromContract = (contract: Pick<Contract, "contractNumber" | "contractToken" | "qrUrl">) => {
  const legacyUrl = contract.qrUrl ? normalizeLegacyContractUrl(contract.qrUrl) : undefined;
  if (legacyUrl) return legacyUrl;

  if (contract.qrUrl && isAbsoluteUrl(contract.qrUrl)) {
    return contract.qrUrl;
  }

  const publicId = contract.contractNumber || contract.contractToken;
  if (!publicId) return contract.qrUrl || "";

  return getContractPublicSignatureUrl(publicId);
};

export const getContractPublicToken = (contract: Pick<Contract, "contractNumber" | "contractToken">) =>
  contract.contractNumber || contract.contractToken;
