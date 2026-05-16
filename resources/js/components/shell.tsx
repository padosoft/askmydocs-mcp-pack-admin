// @ts-nocheck
import React from 'react';
import {
  NOW, TENANTS, SERVERS, TOOLS, ALL_TOOLS, AUDIT, AUDIT_DETAIL,
  BREAKERS, RESOURCES, RESOURCE_CONTENT, PROMPTS, ME, API_KEYS,
} from '../lib/data';
import {
  Icon, I, StatusDot, Transport, Sparkline,
  fmtRelative, fmtTime, fmtTimeMs, fmtDateTime, fmtDuration, fmtBytes, fmtNum,
  jsonHighlight, useToast, Modal, Drawer, TypeToConfirmModal,
  Kbd, Skeleton, Tabs, EmptyState,
} from '../lib/ui';

// ============== Shell: Sidebar + Topbar + Cmd+K palette ==============

const ROUTES = [
  { key: 'dashboard', label: 'Dashboard', icon: I.Dashboard, shortcut: 'g d', kbd: '⌘1' },
  { key: 'servers', label: 'Servers', icon: I.Server, shortcut: 'g s', kbd: '⌘2' },
  { key: 'tools', label: 'Tools', icon: I.Wrench, shortcut: 'g t', kbd: '⌘3' },
  { key: 'resources', label: 'Resources', icon: I.FileBox, shortcut: 'g r', kbd: '⌘4' },
  { key: 'prompts', label: 'Prompts', icon: I.Sparkles, shortcut: 'g p', kbd: '⌘5' },
  { key: 'audit', label: 'Audit log', icon: I.Scroll, shortcut: 'g a', kbd: '⌘6' },
  { key: 'breakers', label: 'Circuit breakers', icon: I.Zap, shortcut: 'g c', kbd: '⌘7' },
];
const SECONDARY = [
  { key: 'playground', label: 'API Playground', icon: I.Code2 },
  { key: 'settings', label: 'Settings', icon: I.Settings },
  { key: 'help', label: 'Help', icon: I.Help },
];

function Sidebar({ route, onNav, tenant, onTenantClick, tourTarget }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 5l7 4-7 4M19 5l-7 4 7 4M5 13l7 4-7 4M19 13l-7 4 7 4"/>
          </svg>
        </div>
        <div className="brand-text">
          <b>MCP Pack</b>
          <small>admin · v1.4</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-label">Operate</div>
          {ROUTES.map(it => {
            const Ic = it.icon;
            return (
              <div key={it.key}
                   data-tour={`nav-${it.key}`}
                   className={`nav-item ${route === it.key ? 'active' : ''}`}
                   onClick={() => onNav(it.key)}>
                <Ic size={16} className="nav-icon"/>
                <span>{it.label}</span>
                <span className="kbd-hint">{it.kbd}</span>
              </div>
            );
          })}
        </div>
        <div className="nav-section">
          <div className="nav-label">Configure</div>
          {SECONDARY.map(it => {
            const Ic = it.icon;
            return (
              <div key={it.key}
                   className={`nav-item ${route === it.key ? 'active' : ''}`}
                   onClick={() => onNav(it.key)}>
                <Ic size={16} className="nav-icon"/>
                <span>{it.label}</span>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="tenant-switch" onClick={onTenantClick}>
        <span className="tenant-dot"/>
        <div className="tenant-info">
          <small>Tenant</small>
          <b>{tenant.name}</b>
        </div>
        <I.ChevronDown size={13} className="tertiary"/>
      </div>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">{ME.initials}</div>
          <div className="user-info">
            <b>{ME.name}</b>
            <small>admin · {ME.email.split('@')[1]}</small>
          </div>
        </div>
        <button className="iconbtn" aria-label="Account menu"><I.ChevronUp size={14}/></button>
      </div>
    </aside>
  );
}

function Breadcrumbs({ route, extra, onNav }) {
  const map = {
    dashboard: ['Dashboard'],
    servers: ['Servers'],
    tools: ['Tools'],
    resources: ['Resources'],
    prompts: ['Prompts'],
    audit: ['Audit log'],
    breakers: ['Circuit breakers'],
    playground: ['API Playground'],
    settings: ['Settings'],
    help: ['Help'],
  };
  const segments = [...(map[route] || [route]), ...(extra || [])];
  return (
    <div className="crumbs">
      <a onClick={() => onNav('dashboard')} style={{ display: 'flex' }}>
        <I.Dashboard size={14}/>
      </a>
      <span className="sep"><I.ChevronRight size={11}/></span>
      {segments.map((s, i) => (
        <React.Fragment key={i}>
          {i === segments.length - 1
            ? <b>{s}</b>
            : <a onClick={() => onNav(route)}>{s}</a>}
          {i < segments.length - 1 && <span className="sep"><I.ChevronRight size={11}/></span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Topbar({ route, extra, onNav, theme, onTheme, livePaused, onTogglePaused, onOpenPalette, lastTick, onOpenTour }) {
  return (
    <header className="topbar">
      <Breadcrumbs route={route} extra={extra} onNav={onNav}/>
      <span className="env-badge"><span className="status-dot ok" style={{ width: 5, height: 5 }}/>production</span>

      <div className="topbar-spacer"/>

      <span className={`live-pill ${livePaused ? 'paused' : ''}`} title={livePaused ? 'Live feed paused' : 'Live feed connected'}>
        <span className="pulse"/>
        <span>{livePaused ? 'Paused' : 'Live'}</span>
        <span style={{ opacity: 0.7, marginLeft: 4 }}>· {fmtTime(lastTick)}</span>
      </span>

      <button className="search-trigger" onClick={onOpenPalette} data-tour="palette-trigger">
        <I.Search size={13}/>
        <span>Search servers, tools, audit IDs…</span>
        <span className="kbd">⌘K</span>
      </button>

      <button className="iconbtn" onClick={onTogglePaused}
              title={livePaused ? 'Resume live feed' : 'Pause live feed'}>
        {livePaused ? <I.Play size={14}/> : <I.Pause size={14}/>}
      </button>
      <button className="iconbtn" title="Notifications"><I.Bell size={14}/></button>
      <button className="iconbtn" title="Restart tour" onClick={onOpenTour}><I.Help size={14}/></button>
      <button className="iconbtn" onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme">
        {theme === 'dark' ? <I.Sun size={14}/> : <I.Moon size={14}/>}
      </button>
    </header>
  );
}

// ============== Command palette ==============
function CommandPalette({ open, onClose, onNav, recent }) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQ(''); setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const ql = q.toLowerCase().trim();

  const navItems = React.useMemo(() => [
    ...ROUTES.map(r => ({
      kind: 'nav', label: r.label, icon: <r.icon size={15}/>,
      meta: r.kbd, action: () => onNav(r.key),
    })),
    ...SECONDARY.map(r => ({
      kind: 'nav', label: r.label, icon: <r.icon size={15}/>,
      action: () => onNav(r.key),
    })),
  ], [onNav]);

  const actionItems = React.useMemo(() => [
    { kind: 'action', label: 'Create new server', icon: <I.Plus size={15}/>, action: () => onNav('servers-new') },
    { kind: 'action', label: 'Toggle theme', icon: <I.Sun size={15}/>, action: () => document.dispatchEvent(new CustomEvent('app:toggle-theme')) },
    { kind: 'action', label: 'Pause live feed', icon: <I.Pause size={15}/>, action: () => document.dispatchEvent(new CustomEvent('app:toggle-paused')) },
    { kind: 'action', label: 'Reset all breakers', icon: <I.Refresh size={15}/>, action: () => onNav('breakers') },
    { kind: 'action', label: 'Start guided tour', icon: <I.Sparkles size={15}/>, action: () => document.dispatchEvent(new CustomEvent('app:start-tour')) },
  ], [onNav]);

  const filter = (items) => ql
    ? items.filter(i => i.label.toLowerCase().includes(ql))
    : items;

  const serverMatches = ql
    ? SERVERS.filter(s => s.name.toLowerCase().includes(ql) || s.url.toLowerCase().includes(ql)).slice(0, 8)
    : SERVERS.slice(0, 4);
  const toolMatches = ql
    ? ALL_TOOLS.filter(t => t.name.toLowerCase().includes(ql) || t.server_name?.toLowerCase().includes(ql)).slice(0, 6)
    : [];
  const auditMatches = ql && /^aud_/i.test(ql)
    ? AUDIT.filter(a => a.id.toLowerCase().includes(ql)).slice(0, 4)
    : [];

  const sections = [];
  if (!ql || filter(actionItems).length) sections.push({ section: 'Actions', items: filter(actionItems) });
  if (!ql || filter(navItems).length) sections.push({ section: 'Navigate', items: filter(navItems) });
  if (serverMatches.length) sections.push({ section: 'Servers', items: serverMatches.map(s => ({
    kind: 'server', label: s.name, icon: <I.Server size={15}/>, sub: s.transport,
    meta: `${s.tools} tools`,
    action: () => onNav(`server/${s.id}`),
  })) });
  if (toolMatches.length) sections.push({ section: 'Tools', items: toolMatches.map(t => ({
    kind: 'tool', label: `${t.server_name}.${t.name}`, icon: <I.Wrench size={15}/>,
    meta: fmtDuration(t.p50) + ' p50',
    action: () => onNav(`tool/${t.server_id}/${t.name}`),
  })) });
  if (auditMatches.length) sections.push({ section: 'Audit IDs', items: auditMatches.map(a => ({
    kind: 'audit', label: a.id, icon: <I.Hash size={15}/>, sub: a.method,
    action: () => onNav(`audit/${a.id}`),
  })) });
  if (!ql && recent?.length) {
    sections.push({ section: 'Recent', items: recent.slice(0, 5).map(r => ({
      kind: 'recent', label: r.label, icon: <I.Clock size={15}/>,
      action: () => onNav(r.route),
    })) });
  }

  const flat = sections.flatMap(s => s.items);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(flat.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = flat[active]; if (it) { it.action(); onClose(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, active, onClose]);

  if (!open) return null;
  let i = 0;
  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="palette">
        <div className="palette-input-wrap">
          <I.Search size={16} className="palette-search-icon"/>
          <input ref={inputRef} className="palette-input"
                 placeholder="Type a command, search servers, tools, audit IDs…"
                 value={q} onChange={e => { setQ(e.target.value); setActive(0); }}/>
        </div>
        <div className="palette-list">
          {flat.length === 0 && <div className="empty" style={{ padding: '32px 16px' }}>
            <p>No results for "<b>{q}</b>"</p>
          </div>}
          {sections.map((sec, si) => sec.items.length > 0 && (
            <div key={si}>
              <div className="palette-section">{sec.section}</div>
              {sec.items.map((it) => {
                const idx = i++;
                return (
                  <div key={`${si}-${idx}`}
                       className={`palette-item ${idx === active ? 'active' : ''}`}
                       onMouseEnter={() => setActive(idx)}
                       onClick={() => { it.action(); onClose(); }}>
                    <span className="pl-icon">{it.icon}</span>
                    <span>{it.label}</span>
                    {it.sub && <span className="pl-sub">· {it.sub}</span>}
                    {it.meta && <span className="pl-meta">{it.meta}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span><span className="kbd">↑↓</span> Navigate</span>
          <span><span className="kbd">↵</span> Open</span>
          <span><span className="kbd">esc</span> Close</span>
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{flat.length} result{flat.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </>
  );
}

// ============== Guided tour ==============
const TOUR_STEPS = [
  {
    selector: '[data-tour="kpi-strip"]',
    title: 'Welcome to MCP Pack',
    body: 'Your control room for every Model Context Protocol server you broker. These KPIs are your 5-second status read — sparklines update live as calls stream in.',
    placement: 'bottom',
  },
  {
    selector: '[data-tour="feed"]',
    title: 'Live tool-invocation feed',
    body: 'Every MCP call lands here over SSE. Click a row to open the audit drill-down — full request, response, and JSON-RPC envelope.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-servers"]',
    title: 'Manage servers',
    body: 'Register MCP endpoints, run handshakes, and inspect their tool catalogs. Press ⌘2 to jump there anytime.',
    placement: 'right',
  },
  {
    selector: '[data-tour="nav-breakers"]',
    title: 'Circuit breakers',
    body: 'When a tool starts failing, circuit breakers trip automatically to protect downstream consumers. Reset them here when the upstream recovers.',
    placement: 'right',
  },
  {
    selector: '[data-tour="palette-trigger"]',
    title: 'One keystroke for anything',
    body: 'Press ⌘K (or ⌃K) to fuzzy-search every server, tool, audit ID, action, and screen. The fastest way to navigate this product.',
    placement: 'bottom',
  },
];

function Tour({ active, step, onNext, onClose }) {
  const [rect, setRect] = React.useState(null);
  React.useEffect(() => {
    if (!active) return;
    const s = TOUR_STEPS[step];
    if (!s) return;
    const el = document.querySelector(s.selector);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
    const onResize = () => {
      const r2 = el.getBoundingClientRect();
      setRect({ top: r2.top - 6, left: r2.left - 6, width: r2.width + 12, height: r2.height + 12 });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, step]);

  if (!active) return null;
  const s = TOUR_STEPS[step];
  if (!s) return null;

  let callout = { top: 100, left: window.innerWidth / 2 - 160 };
  if (rect) {
    if (s.placement === 'right') callout = { top: rect.top, left: rect.left + rect.width + 12 };
    else if (s.placement === 'bottom') callout = { top: rect.top + rect.height + 12, left: rect.left };
    else callout = { top: rect.top + rect.height + 12, left: rect.left };
    callout.left = Math.min(callout.left, window.innerWidth - 340);
    callout.left = Math.max(callout.left, 16);
    callout.top = Math.min(callout.top, window.innerHeight - 200);
  }

  return (
    <>
      <div className="tour-overlay" onClick={onClose}/>
      {rect && <div className="tour-spotlight" style={rect}/>}
      <div className="tour-callout" style={callout}>
        <h4>{s.title}</h4>
        <p>{s.body}</p>
        <div className="tour-foot">
          <div className="tour-dots">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={i === step ? 'active' : ''}/>
            ))}
          </div>
          <div className="flex-h" style={{ gap: 6 }}>
            <button className="btn ghost sm" onClick={onClose}>Skip</button>
            <button className="btn primary sm" onClick={onNext}>
              {step === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}
              <I.ArrowRight size={12}/>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export { Sidebar, Topbar, Breadcrumbs, CommandPalette, Tour, ROUTES, SECONDARY, TOUR_STEPS };
