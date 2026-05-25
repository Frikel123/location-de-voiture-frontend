const env = import.meta.env as ImportMetaEnv & {
  NEXT_PUBLIC_API_URL?: string;
};

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "");

export const API_URL = trimTrailingSlash(
  env.VITE_API_URL || env.NEXT_PUBLIC_API_URL || "",
);

export const API_URL_MISSING_MESSAGE =
  "API URL manquante. Configurez VITE_API_URL sur Netlify avec l'URL publique du backend.";
