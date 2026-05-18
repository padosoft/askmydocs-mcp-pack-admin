/// <reference types="vite/client" />

// Vite environment variables exposed at build time. Set `VITE_API_BASE` to
// override the default `/api/admin/mcp-pack` prefix (e.g. when the SPA is
// served from a CDN and the API lives on a different origin). Runtime
// overrides flow through `window.__MCP_PACK_ADMIN__.api_base` instead.
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
