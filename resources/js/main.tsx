import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '../css/panel.css';

// The server-side Blade injects this global with the mount prefix + API base.
declare global {
  interface Window {
    __MCP_PACK_ADMIN__?: {
      api_base?: string;
      mount_prefix?: string;
      theme_default?: string;
      asset_path?: string;
    };
  }
}

const cfg = window.__MCP_PACK_ADMIN__ ?? {};
const basename = (cfg.mount_prefix || '/admin/mcp-pack').replace(/\/$/, '');

const container = document.getElementById('mcp-pack-admin-root');
if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
