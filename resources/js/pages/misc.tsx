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
import { Breadcrumbs, ROUTES, SECONDARY } from '../components/shell';

// ============== Playground (OpenAPI) + Settings + Help ==============

const OPENAPI_ENDPOINTS = [
  { method: 'GET', path: '/api/admin/mcp-pack/servers', desc: 'List MCP servers' },
  { method: 'POST', path: '/api/admin/mcp-pack/servers', desc: 'Register a new server' },
  { method: 'GET', path: '/api/admin/mcp-pack/servers/{id}', desc: 'Get a specific server' },
  { method: 'PATCH', path: '/api/admin/mcp-pack/servers/{id}', desc: 'Update a server' },
  { method: 'DELETE', path: '/api/admin/mcp-pack/servers/{id}', desc: 'Delete a server' },
  { method: 'POST', path: '/api/admin/mcp-pack/servers/{id}/handshake', desc: 'Run a handshake' },
  { method: 'GET', path: '/api/admin/mcp-pack/servers/{id}/tools', desc: 'List tools for a server' },
  { method: 'POST', path: '/api/admin/mcp-pack/servers/{id}/tools/{name}/invoke', desc: 'Invoke a tool' },
  { method: 'GET', path: '/api/admin/mcp-pack/audit', desc: 'List audit entries' },
  { method: 'GET', path: '/api/admin/mcp-pack/audit/{id}', desc: 'Get audit detail' },
  { method: 'POST', path: '/api/admin/mcp-pack/audit/{id}/replay', desc: 'Replay an audited call' },
  { method: 'GET', path: '/api/admin/mcp-pack/circuit-breakers', desc: 'List circuit breakers' },
  { method: 'POST', path: '/api/admin/mcp-pack/circuit-breakers/{id}/reset', desc: 'Reset a breaker' },
  { method: 'GET', path: '/api/admin/mcp-pack/events', desc: 'SSE — live tool invocations' },
  { method: 'GET', path: '/api/admin/mcp-pack/me', desc: 'Current user + permissions' },
  { method: 'POST', path: '/api/admin/mcp-pack/me/preferences', desc: 'Save user preferences' },
];

function PlaygroundPage() {
  const [selected, setSelected] = React.useState(OPENAPI_ENDPOINTS[0]);
  const [body, setBody] = React.useState('{\n  "tenant": "acme-corp"\n}');
  const [resp, setResp] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const tryIt = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResp({
        status: 200,
        dur: Math.round(80 + Math.random() * 240),
        body: selected.path.endsWith('servers')
          ? { data: SERVERS.slice(0, 5).map(s => ({ id: s.id, name: s.name, transport: s.transport, enabled: s.enabled })), meta: { total: SERVERS.length } }
          : selected.path.includes('audit')
          ? { data: AUDIT.slice(0, 3) }
          : selected.path.includes('handshake')
          ? { handshake_id: 'hs_a1b2c3', duration_ms: 312, tools_advertised: 12, server_version: '1.4.2' }
          : { ok: true, ts: new Date().toISOString() },
      });
    }, 500);
  };

  return (
    <div className="page full" style={{ padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 1, background: 'var(--border)', height: 'calc(100vh - var(--topbar-h))' }}>
        <div style={{ background: 'var(--bg-elevated)', overflow: 'auto' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <b style={{ fontSize: 13 }}>OpenAPI explorer</b>
            <p className="tertiary" style={{ margin: '2px 0 0', fontSize: 11.5 }}>
              /api/admin/mcp-pack/openapi.json
            </p>
          </div>
          {OPENAPI_ENDPOINTS.map(ep => (
            <div key={`${ep.method}-${ep.path}`}
                 onClick={() => setSelected(ep)}
                 style={{
                   padding: '8px 16px',
                   borderBottom: '1px solid var(--border)',
                   cursor: 'pointer',
                   background: selected === ep ? 'var(--accent-bg)' : 'transparent',
                   borderLeft: selected === ep ? '2px solid var(--accent)' : '2px solid transparent',
                 }}>
              <div className="flex-h">
                <span className={`badge mono ${ep.method === 'GET' ? 'info' : ep.method === 'POST' ? 'ok' : ep.method === 'DELETE' ? 'err' : 'accent'}`}
                      style={{ minWidth: 52, justifyContent: 'center', fontWeight: 600 }}>{ep.method}</span>
                <span className="mono" style={{ fontSize: 11.5 }}>{ep.path.replace('/api/admin/mcp-pack', '')}</span>
              </div>
              <p className="tertiary" style={{ margin: '4px 0 0', fontSize: 11.5 }}>{ep.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg)', overflow: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div className="flex-h" style={{ gap: 10, marginBottom: 6 }}>
              <span className={`badge lg mono ${selected.method === 'GET' ? 'info' : selected.method === 'POST' ? 'ok' : selected.method === 'DELETE' ? 'err' : 'accent'}`}
                    style={{ fontSize: 12, fontWeight: 700 }}>{selected.method}</span>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 16 }}>{selected.path}</h2>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>{selected.desc}</p>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head">
                <div className="card-title">Request</div>
                <button className="btn primary sm" onClick={tryIt} disabled={loading}>
                  {loading ? <I.Loader size={12}/> : <I.Send size={12}/>}
                  {loading ? 'Sending…' : `Try ${selected.method}`}
                </button>
              </div>
              <div className="card-body">
                <label className="label">Headers</label>
                <pre className="code-block" style={{ marginBottom: 12 }}>{`Accept: application/json
Content-Type: application/json
X-XSRF-TOKEN: ●●●●●●●●●●●●●●●●●●●●
Cookie: laravel_session=●●●●●●●●●`}</pre>
                {selected.method !== 'GET' && selected.method !== 'DELETE' && (
                  <>
                    <label className="label">Body (JSON)</label>
                    <textarea className="textarea mono" rows={6} value={body}
                              onChange={e => setBody(e.target.value)}
                              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}/>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">Response</div>
                {resp && (
                  <div className="flex-h" style={{ fontSize: 12 }}>
                    <span className={`badge mono ${resp.status === 200 ? 'ok' : 'err'}`}>{resp.status} OK</span>
                    <span className="muted mono">{resp.dur}ms</span>
                  </div>
                )}
              </div>
              <div className="card-body">
                {loading && <div className="row-gap-8">
                  <Skeleton w="40%" h={14}/><Skeleton w="80%" h={14}/><Skeleton w="60%" h={14}/>
                </div>}
                {!loading && !resp && <EmptyState icon={<I.Send size={20}/>}
                  title="No response yet" body="Click 'Try' to send a real request to the live backend."/>}
                {resp && <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(resp.body) }}/>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== Settings ==============
function SettingsPage({ theme, onTheme, toast }) {
  const [section, setSection] = React.useState('preferences');

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Manage your preferences, tenant configuration, and API tokens.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-nav">
          <a className={section === 'preferences' ? 'active' : ''} onClick={() => setSection('preferences')}>Preferences</a>
          <a className={section === 'tenants' ? 'active' : ''} onClick={() => setSection('tenants')}>Tenants</a>
          <a className={section === 'apikeys' ? 'active' : ''} onClick={() => setSection('apikeys')}>API keys</a>
          <a className={section === 'integrations' ? 'active' : ''} onClick={() => setSection('integrations')}>Integrations</a>
        </div>
        <div>
          {section === 'preferences' && <PreferencesSection theme={theme} onTheme={onTheme} toast={toast}/>}
          {section === 'tenants' && <TenantsSection/>}
          {section === 'apikeys' && <ApiKeysSection toast={toast}/>}
          {section === 'integrations' && <IntegrationsSection/>}
        </div>
      </div>
    </div>
  );
}

function PreferencesSection({ theme, onTheme, toast }) {
  const [density, setDensity] = React.useState('compact');
  const [landing, setLanding] = React.useState('dashboard');
  const [motion, setMotion] = React.useState('os');
  const [notifs, setNotifs] = React.useState(true);

  return (
    <>
      <div className="settings-section">
        <h3>Appearance</h3>
        <p className="section-desc">Customize how the panel looks.</p>
        <label className="label">Theme</label>
        <div className="radio-cards">
          {[
            { v: 'light', t: 'Light', d: 'Bright surfaces, sharp contrast' },
            { v: 'dark', t: 'Dark', d: 'Reduced eye strain, long sessions' },
            { v: 'system', t: 'System', d: 'Follow OS preference' },
          ].map(o => (
            <button key={o.v}
                    className={`radio-card ${theme === o.v ? 'active' : ''}`}
                    onClick={() => {
                      if (o.v === 'system') {
                        // Resolve against the host OS preference at the moment of
                        // selection. We do NOT persist a tri-state preference
                        // (that would require widening the App-level theme state
                        // shape); instead picking "System" snapshots the OS value
                        // into the per-user override. Users can re-pick "System"
                        // any time to re-sync.
                        const prefersDark = typeof window !== 'undefined'
                          && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
                        onTheme(prefersDark ? 'dark' : 'light');
                      } else {
                        onTheme(o.v);
                      }
                    }}>
              <div className="rc-title">{o.t}</div>
              <div className="rc-desc">{o.d}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <label className="label">Density</label>
        <div className="radio-cards">
          {[
            { v: 'compact', t: 'Compact', d: 'Max info per screen — recommended' },
            { v: 'comfortable', t: 'Comfortable', d: 'More breathing room' },
            { v: 'spacious', t: 'Spacious', d: 'Large hit targets' },
          ].map(o => (
            <button key={o.v} className={`radio-card ${density === o.v ? 'active' : ''}`}
                    onClick={() => setDensity(o.v)}>
              <div className="rc-title">{o.t}</div>
              <div className="rc-desc">{o.d}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Behaviour</h3>
        <p className="section-desc">Where the panel takes you on login and how it animates.</p>

        <div className="grid-2" style={{ gap: 16 }}>
          <div>
            <label className="label">Default landing page</label>
            <select className="select" value={landing} onChange={e => setLanding(e.target.value)}>
              <option value="dashboard">Dashboard</option>
              <option value="servers">Servers</option>
              <option value="audit">Audit log</option>
              <option value="breakers">Circuit breakers</option>
            </select>
          </div>
          <div>
            <label className="label">Reduced motion</label>
            <select className="select" value={motion} onChange={e => setMotion(e.target.value)}>
              <option value="os">Respect OS preference</option>
              <option value="always">Always reduce</option>
              <option value="never">Never reduce</option>
            </select>
          </div>
        </div>

        <div className="flex-h" style={{ marginTop: 14 }}>
          <input type="checkbox" className="checkbox" checked={notifs} onChange={e => setNotifs(e.target.checked)}/>
          <span style={{ fontSize: 12.5 }}>Show in-app toast notifications</span>
        </div>
      </div>

      <div className="settings-section">
        <button className="btn primary" onClick={() => toast.push({ kind: 'ok', title: 'Preferences saved' })}>
          <I.Check size={13}/> Save preferences
        </button>
      </div>
    </>
  );
}

function TenantsSection() {
  return (
    <>
      <div className="settings-section">
        <h3>Tenants</h3>
        <p className="section-desc">Per-tenant configuration overrides and kill-switches.</p>

        <div className="card">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th className="num">Servers</th>
                  <th>Kill-switch</th>
                  <th>Default timeout</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {TENANTS.map(t => {
                  const servers = SERVERS.filter(s => s.tenant === t.id).length;
                  return (
                    <tr key={t.id}>
                      <td>
                        <b>{t.name}</b>
                        <div className="tertiary mono" style={{ fontSize: 11 }}>{t.id}</div>
                      </td>
                      <td className="num">{servers}</td>
                      <td>{t.primary ? <span className="badge ok"><span className="dot"/>All enabled</span> : <span className="badge outline">2 disabled</span>}</td>
                      <td className="mono">30000ms</td>
                      <td><button className="btn sm ghost"><I.ChevronRight size={12}/></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function ApiKeysSection({ toast }) {
  return (
    <>
      <div className="settings-section">
        <div className="flex-h-between">
          <div>
            <h3>API keys</h3>
            <p className="section-desc">Sanctum tokens issued to programmatic consumers.</p>
          </div>
          <button className="btn primary"><I.Plus size={13}/> Issue token</button>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Scopes</th>
                  <th>Last used</th>
                  <th>Created by</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {API_KEYS.map(k => (
                  <tr key={k.id}>
                    <td>
                      <b className="mono">{k.name}</b>
                      <div className="tertiary mono" style={{ fontSize: 11 }}>{k.id}</div>
                    </td>
                    <td>
                      <div className="flex-h" style={{ flexWrap: 'wrap', gap: 4 }}>
                        {k.scopes.map(s => <span key={s} className="badge outline mono" style={{ fontSize: 10 }}>{s}</span>)}
                      </div>
                    </td>
                    <td className="muted mono" style={{ fontSize: 11.5 }}>{fmtRelative(k.last_used_at)}</td>
                    <td className="muted">{k.created_by}</td>
                    <td>
                      <button className="btn sm danger" onClick={() => toast.push({ kind: 'warn', title: `Revoking ${k.name}`, body: 'Type-to-confirm modal would appear here.' })}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: 'Slack notifications', desc: 'Post alerts when breakers trip or handshakes fail', icon: <I.Send size={20}/>, connected: true },
    { name: 'Sentry error tracking', desc: 'Forward server errors to your Sentry project', icon: <I.AlertTriangle size={20}/>, connected: true },
    { name: 'PagerDuty', desc: 'Page on-call when production breakers open', icon: <I.Bell size={20}/>, connected: false },
    { name: 'Webhook (generic)', desc: 'POST audit events to your endpoint', icon: <I.External size={20}/>, connected: false },
  ];
  return (
    <div className="settings-section">
      <h3>Integrations</h3>
      <p className="section-desc">Wire MCP Pack events into your existing tooling.</p>
      <div className="row-gap-8">
        {integrations.map(it => (
          <div key={it.name} className="card">
            <div className="card-body flex-h" style={{ padding: 16, gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8,
                background: 'var(--bg-subtle)', display: 'grid', placeItems: 'center',
                color: 'var(--accent)', flexShrink: 0,
              }}>{it.icon}</div>
              <div style={{ flex: 1 }}>
                <b>{it.name}</b>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12.5 }}>{it.desc}</p>
              </div>
              {it.connected
                ? <><span className="badge ok"><span className="dot"/>Connected</span><button className="btn sm">Configure</button></>
                : <button className="btn primary sm"><I.Plus size={12}/>Connect</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== Help ==============
function HelpPage({ onNav, onStartTour }) {
  const shortcuts = [
    { cat: 'Global', items: [
      { keys: ['⌘', 'K'], action: 'Open command palette' },
      { keys: ['?'], action: 'Show this help' },
      { keys: ['g', 'd'], action: 'Go to Dashboard' },
      { keys: ['g', 's'], action: 'Go to Servers' },
      { keys: ['g', 't'], action: 'Go to Tools' },
      { keys: ['g', 'a'], action: 'Go to Audit log' },
      { keys: ['g', 'c'], action: 'Go to Circuit breakers' },
    ]},
    { cat: 'Audit log', items: [
      { keys: ['/'], action: 'Focus filter search' },
      { keys: ['j'], action: 'Next row' },
      { keys: ['k'], action: 'Previous row' },
      { keys: ['↵'], action: 'Open drill-down' },
      { keys: ['Esc'], action: 'Close drill-down' },
    ]},
    { cat: 'Forms', items: [
      { keys: ['⌘', '↵'], action: 'Submit form' },
      { keys: ['Esc'], action: 'Cancel / close modal' },
    ]},
  ];
  const glossary = [
    { term: 'MCP', def: 'Model Context Protocol — open standard for exposing tools, resources, and prompts to LLM clients.' },
    { term: 'JSON-RPC', def: 'Stateless request/response RPC protocol over JSON. MCP envelopes follow JSON-RPC 2.0.' },
    { term: 'Handshake', def: 'Initial capability exchange where a server advertises its tools, resources, and prompts.' },
    { term: 'Circuit breaker', def: 'Failure isolator that trips open after N failures, blocking calls until probe succeeds.' },
    { term: 'Half-open', def: 'Transitional CB state — one probe request allowed; success closes, failure re-opens.' },
    { term: 'Audit ID', def: 'Stable identifier for an audited tool invocation. Always returned in X-Audit-Id header.' },
  ];
  const checklist = [
    { done: true, label: 'Register first server' },
    { done: true, label: 'Run first handshake' },
    { done: true, label: 'Make first tool invocation' },
    { done: false, label: 'Try the playground' },
    { done: false, label: 'Save a custom audit view' },
    { done: false, label: 'Invite a teammate' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Help</h1>
          <p className="page-sub">Keyboard shortcuts, glossary, and getting started.</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.External size={13}/> Backend docs</button>
          <button className="btn primary" onClick={onStartTour}><I.Sparkles size={13}/> Restart tour</button>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="row-gap-16">
          <div className="card">
            <div className="card-head"><div className="card-title">Keyboard shortcuts</div></div>
            <div className="card-body">
              {shortcuts.map(sec => (
                <div key={sec.cat} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 8 }}>{sec.cat}</div>
                  <div className="shortcut-grid">
                    {sec.items.map((it, i) => (
                      <div key={i} className="shortcut-row">
                        <span className="sc-label">{it.action}</span>
                        <span className="sc-keys">
                          {it.keys.map((k, j) => <Kbd key={j}>{k}</Kbd>)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Glossary</div></div>
            <div className="card-body">
              <dl className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
                {glossary.map(g => (
                  <React.Fragment key={g.term}>
                    <dt><b>{g.term}</b></dt>
                    <dd style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, lineHeight: 1.55 }}>{g.def}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          </div>
        </div>
        <div className="row-gap-16">
          <div className="card">
            <div className="card-head"><div className="card-title">Getting started</div></div>
            <div className="card-body" style={{ padding: 0 }}>
              {checklist.map((c, i) => (
                <div key={i} style={{
                  padding: '10px 16px',
                  borderBottom: i < checklist.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13,
                  opacity: c.done ? 0.6 : 1,
                  textDecoration: c.done ? 'line-through' : 'none',
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: c.done ? 'none' : '1.5px solid var(--border-strong)',
                    background: c.done ? 'var(--status-ok)' : 'transparent',
                    color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    {c.done && <I.Check size={11}/>}
                  </span>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Resources</div></div>
            <div className="card-body row-gap-12">
              <a className="flex-h" style={{ gap: 10, cursor: 'pointer' }}>
                <I.FileText size={16} className="tertiary"/>
                <div>
                  <b>Backend contract v1.4</b>
                  <div className="tertiary" style={{ fontSize: 11.5 }}>padosoft/askmydocs-mcp-pack</div>
                </div>
              </a>
              <a className="flex-h" style={{ gap: 10, cursor: 'pointer' }}>
                <I.GitBranch size={16} className="tertiary"/>
                <div>
                  <b>GitHub</b>
                  <div className="tertiary" style={{ fontSize: 11.5 }}>padosoft/askmydocs-mcp-pack-admin</div>
                </div>
              </a>
              <a className="flex-h" style={{ gap: 10, cursor: 'pointer' }}>
                <I.External size={16} className="tertiary"/>
                <div>
                  <b>MCP specification</b>
                  <div className="tertiary" style={{ fontSize: 11.5 }}>modelcontextprotocol.io</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PlaygroundPage, SettingsPage, HelpPage };
