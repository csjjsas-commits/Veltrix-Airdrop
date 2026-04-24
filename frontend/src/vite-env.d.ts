/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_TURNSTILE_SITE_KEY: string;
    readonly VITE_API_URL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
