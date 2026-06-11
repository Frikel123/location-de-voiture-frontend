export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
export const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";
export const AUTH_BYPASS = DEMO_MODE || SKIP_AUTH;

export const DEMO_USER = {
  id: "demo-admin",
  email: "demo@n1-lux-cars.ma",
  role: "admin",
};
