// @ts-nocheck
import React from 'react';
import { NOW } from './data';

// ============== Icons (Lucide-style, 16px, stroke 1.75) ==============
const Icon = ({ d, size = 16, fill = 'none', children, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor"
       strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  // Brand
  Logo: (p) => <Icon {...p}><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12h6M12 9v6"/></Icon>,
  // Nav
  Dashboard: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></Icon>,
  Server: (p) => <Icon {...p}><rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><path d="M6 6h.01M6 18h.01"/></Icon>,
  Wrench: (p) => <Icon {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></Icon>,
  FileBox: (p) => <Icon {...p}><path d="M14.5 22H18a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2.97 13.12c-.6.36-.97 1.01-.97 1.71v3.34c0 .7.37 1.35.97 1.71l3 1.8c.63.38 1.43.38 2.06 0l3-1.8c.6-.36.97-1.01.97-1.71v-3.34c0-.7-.37-1.35-.97-1.71l-3-1.8a2.06 2.06 0 0 0-2.06 0z"/><path d="M7 17l-2.97-1.84M7 17l2.97-1.84M7 17v3.6"/></Icon>,
  Sparkles: (p) => <Icon {...p}><path d="M12 3L13.6 8.4L19 10L13.6 11.6L12 17L10.4 11.6L5 10L10.4 8.4L12 3Z"/><path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z"/></Icon>,
  Scroll: (p) => <Icon {...p}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 0 1-4 0V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></Icon>,
  Zap: (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
  ZapOff: (p) => <Icon {...p}><polyline points="12.41 6.75 13 2 10.57 4.92"/><polyline points="18.57 12.91 21 10 15.66 10"/><polyline points="8 8 3 14 12 14 11 22 16 16"/><line x1="2" y1="2" x2="22" y2="22"/></Icon>,
  Play: (p) => <Icon {...p} fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.16.68.4.92.7"/></Icon>,
  Help: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></Icon>,
  Code2: (p) => <Icon {...p}><path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/></Icon>,

  // UI
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  Sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></Icon>,
  Moon: (p) => <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></Icon>,
  Filter: (p) => <Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Icon>,
  ListFilter: (p) => <Icon {...p}><path d="M3 6h18M7 12h10M10 18h4"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>,
  ChevronUp: (p) => <Icon {...p}><path d="m18 15-6-6-6 6"/></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  Copy: (p) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>,
  External: (p) => <Icon {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>,
  CheckCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></Icon>,
  XCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></Icon>,
  AlertTriangle: (p) => <Icon {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></Icon>,
  Info: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
  Activity: (p) => <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>,
  Send: (p) => <Icon {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Icon>,
  ArrowUp: (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Icon>,
  ArrowLeft: (p) => <Icon {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></Icon>,
  Replay: (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 10 9 10"/></Icon>,
  Command: (p) => <Icon {...p}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></Icon>,
  User: (p) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>,
  Hash: (p) => <Icon {...p}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></Icon>,
  Trash: (p) => <Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></Icon>,
  Edit: (p) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/></Icon>,
  MoreV: (p) => <Icon {...p}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></Icon>,
  Folder: (p) => <Icon {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></Icon>,
  FolderOpen: (p) => <Icon {...p}><path d="M6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></Icon>,
  File: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>,
  FileCode: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13l-2 2 2 2M14 13l2 2-2 2"/></Icon>,
  FileText: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Icon>,
  Terminal: (p) => <Icon {...p}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></Icon>,
  Radio: (p) => <Icon {...p}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></Icon>,
  Key: (p) => <Icon {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></Icon>,
  EyeOff: (p) => <Icon {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></Icon>,
  Building: (p) => <Icon {...p}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/></Icon>,
  Layers: (p) => <Icon {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>,
  Database: (p) => <Icon {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></Icon>,
  Handshake: (p) => <Icon {...p}><path d="m11 17 2 2a1 1 0 0 0 1.4-1.4L13 16l3 3a1 1 0 0 0 1.4-1.4l-3-3 3 3a1 1 0 0 0 1.4-1.4l-3-3 3 3a1 1 0 0 0 1.4-1.4l-7-7-1-1-2-2-1.5 1.5-2 2-2-2"/><path d="m21 3-3 3-2.5 2.5"/><path d="M3 7l3 3 5-5"/></Icon>,
  GitBranch: (p) => <Icon {...p}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></Icon>,
  Power: (p) => <Icon {...p}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></Icon>,
  TrendingUp: (p) => <Icon {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Icon>,
  TrendingDown: (p) => <Icon {...p}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></Icon>,
  Sliders: (p) => <Icon {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></Icon>,
  Loader: (p) => <Icon {...p}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></Icon>,
  Download: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>,
  Maximize: (p) => <Icon {...p}><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></Icon>,
  Pin: (p) => <Icon {...p}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></Icon>,
};

// ============== Time helpers ==============
// NOW is set in data.js (loads first)
function fmtRelative(ts) {
  const diff = (NOW - ts) / 1000;
  if (diff < 0) return `in ${Math.abs(Math.floor(diff))}s`;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
function fmtTime(ts) {
  const d = new Date(ts);
  return d.toISOString().slice(11, 19);
}
function fmtTimeMs(ts) {
  const d = new Date(ts);
  return d.toISOString().slice(11, 23);
}
function fmtDateTime(ts) {
  const d = new Date(ts);
  return d.toISOString().slice(0, 19).replace('T', ' ') + 'Z';
}
function fmtDuration(ms) {
  if (ms == null) return '—';
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms/1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms/60000).toFixed(1)}m`;
  return `${(ms/3600000).toFixed(1)}h`;
}
function fmtBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n/1024).toFixed(1)}KB`;
  return `${(n/1048576).toFixed(2)}MB`;
}
function fmtNum(n) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(1)}k`;
  return String(n);
}

// ============== JSON syntax highlight ==============
function jsonHighlight(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (m) => {
      let cls = 'json-num';
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'json-key' : 'json-string';
      else if (/true|false/.test(m)) cls = 'json-bool';
      else if (/null/.test(m)) cls = 'json-null';
      return `<span class="${cls}">${m}</span>`;
    });
}

// ============== Sparkline ==============
function Sparkline({ data, color, height = 32, width = 96, fill = true, strokeWidth = 1.5, showPopover = false }) {
  const [hover, setHover] = React.useState(null);
  const svgRef = React.useRef(null);
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const onMove = (e) => {
    if (!showPopover) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.round(x / stepX);
    if (idx >= 0 && idx < data.length) {
      setHover({ x, idx, v: data[idx] });
    }
  };
  return (
    <span style={{ position: 'relative', display: 'inline-block' }} onMouseLeave={() => setHover(null)}>
      <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`}
           onMouseMove={onMove}
           style={{ display: 'block' }}>
        {fill && <polygon points={areaPoints} fill={color || 'currentColor'} opacity="0.14" />}
        <polyline points={points} fill="none" stroke={color || 'currentColor'} strokeWidth={strokeWidth} />
        {hover && <circle cx={hover.idx * stepX} cy={height - ((hover.v - min) / range) * (height - 4) - 2}
                          r="2.5" fill={color || 'currentColor'} stroke="var(--bg-elevated)" strokeWidth="1.5"/>}
      </svg>
      {showPopover && hover && (
        <span className="spark-popover" style={{ left: hover.x + 8, top: -28 }}>
          <b style={{ fontFamily: 'var(--font-mono)' }}>{hover.v}</b>
          <span className="tertiary" style={{ marginLeft: 6 }}>{data.length - hover.idx}m ago</span>
        </span>
      )}
    </span>
  );
}

// ============== StatusDot ==============
function StatusDot({ status, size = 8 }) {
  return <span className={`status-dot ${status}`} style={{ width: size, height: size }} />;
}

// ============== Transport pill ==============
function Transport({ t }) {
  return <span className={`transport ${t}`}>{t}</span>;
}

// ============== Toast bus ==============
const ToastContext = React.createContext({ push: () => {}, dismiss: () => {} });
function useToast() { return React.useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, ...t }]);
    const ttl = t.duration ?? (t.kind === 'err' ? 8000 : 4200);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), ttl);
    return id;
  }, []);
  const dismiss = React.useCallback((id) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);
  const icons = { ok: <I.CheckCircle size={16}/>, err: <I.XCircle size={16}/>, warn: <I.AlertTriangle size={16}/>, info: <I.Info size={16}/> };
  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind || 'ok'}`}>
            <span className="toast-icon">{icons[t.kind || 'ok']}</span>
            <div className="toast-body">
              <b>{t.title}</b>
              {t.body && <small>{t.body}</small>}
              {t.action && (
                <span className="toast-action" onClick={() => { t.action.onClick?.(); dismiss(t.id); }}>
                  {t.action.label}
                </span>
              )}
            </div>
            <span className="toast-close" onClick={() => dismiss(t.id)}><I.X size={12}/></span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ============== Modal ==============
function Modal({ open, onClose, title, sub, children, footer, width }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={width ? { width } : null}>
        {title && (
          <div className="modal-head">
            <div className="modal-title">{title}</div>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </>
  );
}

// ============== Drawer ==============
function Drawer({ open, onClose, title, titleIcon, sub, children, actions, width }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" style={width ? { width } : null}>
        <div className="drawer-head">
          <div className="drawer-head-title">
            {titleIcon}
            <span>{title}</span>
            {sub && <span className="tertiary" style={{ fontWeight: 400, fontSize: 12 }}>{sub}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {actions}
            <button className="iconbtn" onClick={onClose} aria-label="Close"><I.X size={16}/></button>
          </div>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}

// ============== Confirm dialog (type-to-confirm) ==============
function TypeToConfirmModal({ open, onClose, onConfirm, title, body, phrase, dangerLabel }) {
  const [text, setText] = React.useState('');
  React.useEffect(() => { if (open) setText(''); }, [open]);
  const matches = text === phrase;
  return (
    <Modal open={open} onClose={onClose} title={title} sub={body}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn danger" disabled={!matches}
                  onClick={() => { onConfirm?.(); onClose?.(); }}>{dangerLabel || 'Confirm'}</button>
        </>
      }>
      <div className="row-gap-8">
        <div className="muted" style={{ fontSize: 12.5 }}>
          Type <code className="mono" style={{ background: 'var(--bg-subtle)', padding: '1px 5px', borderRadius: 3 }}>{phrase}</code> to confirm.
        </div>
        <input className="input mono" autoFocus value={text} onChange={e => setText(e.target.value)} />
      </div>
    </Modal>
  );
}

// ============== Kbd ==============
function Kbd({ children }) {
  return <span style={{
    fontFamily: 'var(--font-mono)', fontSize: 10.5, padding: '1px 5px',
    border: '1px solid var(--border)', borderRadius: 3, background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)', fontWeight: 500,
  }}>{children}</span>;
}

// ============== Skeleton helpers ==============
function Skeleton({ w = '100%', h = 12, r = 4, style }) {
  return <span className="skel" style={{ display: 'inline-block', width: w, height: h, borderRadius: r, ...style }} />;
}

// ============== Tab strip ==============
function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs">
      {items.map(it => (
        <button key={it.key}
                className={`tab ${value === it.key ? 'active' : ''}`}
                onClick={() => onChange(it.key)}>
          {it.icon}
          <span>{it.label}</span>
          {it.count != null && <span className="tab-count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ============== Empty state ==============
function EmptyState({ icon, title, body, action, secondary }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon-wrap">{icon}</div>}
      {title && <h3>{title}</h3>}
      {body && <p>{body}</p>}
      <div className="empty-actions">
        {action}
        {secondary}
      </div>
    </div>
  );
}

export { Icon, I, StatusDot, Transport, Sparkline, fmtRelative, fmtTime, fmtTimeMs, fmtDateTime, fmtDuration, fmtBytes, fmtNum, jsonHighlight, ToastProvider, useToast, Modal, Drawer, TypeToConfirmModal, Kbd, Skeleton, Tabs, EmptyState };
