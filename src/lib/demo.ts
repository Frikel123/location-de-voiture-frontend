export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
export const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";
export const AUTH_BYPASS = false;

export const DEMO_USER = {
  id: "demo-admin",
  email: "demo@service-lld.ma",
  role: "admin",
};
