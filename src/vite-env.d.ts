/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly NEXT_PUBLIC_API_URL?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_SKIP_AUTH?: string;
  readonly VITE_PUBLIC_DEV_HOST?: string;
  readonly VITE_PUBLIC_APP_URL?: string;
}
