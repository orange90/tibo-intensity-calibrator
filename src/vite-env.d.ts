/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCORE_URL?: string;
  readonly VITE_TIMELINE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
