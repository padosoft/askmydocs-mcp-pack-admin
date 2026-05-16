// Convert the prototype JSX files into TS modules.
// Mechanical transformation: prepend shared imports, replace
// `Object.assign(window, {A, B})` with `export {A, B}`, remove
// `const X = window.X` shadows.
//
// Run: `node scripts/convert-design.mjs` (idempotent).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.env.DESIGN_SRC || 'C:/Users/lopad/Downloads/askmydocs-mcp-pack-web-panel/project';
const DST = path.resolve(__dirname, '../resources/js');

if (!fs.existsSync(SRC)) {
  console.error('design source not found at', SRC);
  process.exit(1);
}

const FILES = [
  // [src, dst, isUi?]
  ['data.js', 'lib/data.ts', false],
  ['ui.jsx', 'lib/ui.tsx', true],
  ['shell.jsx', 'components/shell.tsx', false],
  ['tweaks-panel.jsx', 'components/tweaks-panel.tsx', false],
  ['page-dashboard.jsx', 'pages/dashboard.tsx', false],
  ['page-servers.jsx', 'pages/servers.tsx', false],
  ['page-tools.jsx', 'pages/tools.tsx', false],
  ['page-resources.jsx', 'pages/resources.tsx', false],
  ['page-audit.jsx', 'pages/audit.tsx', false],
  ['page-misc.jsx', 'pages/misc.tsx', false],
];

// Names exported by each module. We harvest them from the original
// `Object.assign(window, {...})` line at the bottom of every JSX.
const PROLOGUE_REACT = `// @ts-nocheck
import React from 'react';
`;

const PROLOGUE_DATA = `// @ts-nocheck
// Auto-converted from design prototype data.js.
// All fixtures + the NOW reference are exported and consumed
// directly by the UI modules (no window globals at runtime).

`;

const SHARED_IMPORTS = `import {
  NOW, TENANTS, SERVERS, TOOLS, ALL_TOOLS, AUDIT, AUDIT_DETAIL,
  BREAKERS, RESOURCES, RESOURCE_CONTENT, PROMPTS, ME, API_KEYS,
} from '../lib/data';
import {
  Icon, I, StatusDot, Transport, Sparkline,
  fmtRelative, fmtTime, fmtTimeMs, fmtDateTime, fmtDuration, fmtBytes, fmtNum,
  jsonHighlight, useToast, Modal, Drawer, TypeToConfirmModal,
  Kbd, Skeleton, Tabs, EmptyState,
} from '../lib/ui';
`;

const SHELL_IMPORTS = `${SHARED_IMPORTS}`;

const PAGE_IMPORTS = `${SHARED_IMPORTS}import { Breadcrumbs, ROUTES, SECONDARY } from '../components/shell';
`;

const TWEAKS_IMPORTS = `// @ts-nocheck
import React from 'react';
`;

function extractExports(source) {
  const m = source.match(/Object\.assign\(window,\s*\{([^}]+)\}\s*\);?/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => /^[A-Za-z_$][\w$]*$/.test(s));
}

function stripFinalExports(source) {
  return source.replace(/Object\.assign\(window,\s*\{[^}]+\}\s*\);?\s*$/m, '').trimEnd();
}

function stripUseHooks(source) {
  // Replace `React.useState`, `React.useEffect`, etc. — keep them, they work
  // identically once React is imported. Nothing to strip.
  return source;
}

function fixDataModule(source) {
  // Inject `export` keyword in front of every top-level `const X = ...` or
  // function declaration so we no longer rely on `Object.assign(window, ...)`.
  let s = source;
  s = s.replace(/^const NOW\s*=/m, 'export const NOW =');
  s = s.replace(/^window\.NOW\s*=\s*NOW;?\n?/m, '');
  s = s.replace(/^const TENANTS\s*=/m, 'export const TENANTS =');
  s = s.replace(/^const SERVERS\s*=/m, 'export const SERVERS =');
  s = s.replace(/^const TOOLS\s*=/m, 'export const TOOLS =');
  s = s.replace(/^const ALL_TOOLS\s*=/m, 'export const ALL_TOOLS =');
  s = s.replace(/^const AUDIT\s*=/m, 'export const AUDIT =');
  s = s.replace(/^const AUDIT_DETAIL\s*=/m, 'export const AUDIT_DETAIL =');
  s = s.replace(/^const BREAKERS\s*=/m, 'export const BREAKERS =');
  s = s.replace(/^const RESOURCES\s*=/m, 'export const RESOURCES =');
  s = s.replace(/^const RESOURCE_CONTENT\s*=/m, 'export const RESOURCE_CONTENT =');
  s = s.replace(/^const PROMPTS\s*=/m, 'export const PROMPTS =');
  s = s.replace(/^const ME\s*=/m, 'export const ME =');
  s = s.replace(/^const API_KEYS\s*=/m, 'export const API_KEYS =');
  s = stripFinalExports(s);
  return s;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

for (const [src, dst, _isUi] of FILES) {
  const srcPath = path.join(SRC, src);
  const dstPath = path.join(DST, dst);
  if (!fs.existsSync(srcPath)) {
    console.error('skip (missing)', srcPath);
    continue;
  }
  let raw = fs.readFileSync(srcPath, 'utf8');
  let out = '';

  if (src === 'data.js') {
    out = PROLOGUE_DATA + fixDataModule(raw) + '\n';
  } else if (src === 'tweaks-panel.jsx') {
    const names = extractExports(raw);
    out = TWEAKS_IMPORTS + '\n' + stripFinalExports(raw) + '\n\n' +
      (names.length ? `export { ${names.join(', ')} };\n` : '');
  } else {
    const names = extractExports(raw);
    const imports = src === 'ui.jsx'
      ? PROLOGUE_REACT + "import { NOW } from './data';\n"
      : src === 'shell.jsx'
        ? PROLOGUE_REACT + SHELL_IMPORTS
        : PROLOGUE_REACT + PAGE_IMPORTS;
    out = imports + '\n' + stripFinalExports(stripUseHooks(raw)) + '\n\n' +
      (names.length ? `export { ${names.join(', ')} };\n` : '');
  }

  ensureDir(path.dirname(dstPath));
  fs.writeFileSync(dstPath, out);
  console.log('  wrote', dst);
}

console.log('done');
