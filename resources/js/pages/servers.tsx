// @ts-nocheck
// W3: read-paths wired. `ServersListPage` + `ServerDetailPage` are now
// hook-backed via `useServers({...filters})`, `useServer(id)`,
// `useServerTools(id)`, `useResources(id)`, `usePrompts(id)`, `useAudit({
// server_id })`. The wire schema for `McpServer` is intentionally minimal
// (id / name / transport / url / status / enabled / tenant). Visual extras
// the fixture carries (sparklines, p50/p95/p99, calls_1h / errors_1h)
// gracefully degrade to "—" or empty arrays when the live wire doesn't
// carry them. W4 wires mutations; W5 wires per-server telemetry.

import React from 'react';
import {
  SERVERS as FALLBACK_SERVERS, TENANTS,
} from '../lib/data';
import {
  Icon, I, StatusDot, Transport, Sparkline,
  fmtRelative, fmtTime, fmtTimeMs, fmtDateTime, fmtDuration, fmtBytes, fmtNum,
  jsonHighlight, useToast, Modal, Drawer, TypeToConfirmModal,
  Kbd, Skeleton, Tabs, EmptyState,
} from '../lib/ui';
import { Breadcrumbs, ROUTES, SECONDARY } from '../components/shell';
import {
  useServers, useServer, useServerTools, useResources, usePrompts, useAudit,
} from '../lib/queries/hooks';
import { DataState } from '../lib/data-state';

// ============== Servers: list + detail + new wizard ==============

function ServersListPage({ onNav, toast }) {
  const [selected, setSelected] = React.useState(new Set());
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [transportFilter, setTransportFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const filters = React.useMemo(() => {
    // The UI status chips are an OPERATOR view (`active` = enabled & not
    // erroring; `disabled` = enabled flag false; `err` / `warn` = real
    // wire status values). The BE only understands the latter two as
    // `status=` — `active` / `disabled` are projections we have to do
    // client-side. Sending `status=active` to the BE returns zero rows
    // (no server reports `status=active`), so the chip would look
    // permanently broken. Only forward the wire-shaped values; let
    // `disabled` map to `enabled=false` and let `active` fall through
    // to client-side filtering below.
    const f = { per_page: 100 };
    if (q) f.q = q;
    if (statusFilter === 'err' || statusFilter === 'warn') {
      f.status = statusFilter;
    } else if (statusFilter === 'disabled') {
      f.enabled = false;
    }
    if (transportFilter !== 'all') f.transport = transportFilter;
    return f;
  }, [q, statusFilter, transportFilter]);

  const serversQ = useServers(filters);
  const rawServers = serversQ.data?.data ?? [];

  // Fixture telemetry for fields the wire schema doesn't carry yet
  // (tools count, sparklines, p95, last_handshake_at, calls_1h). The
  // detail page hits the same fallback merge logic.
  const fallbackBy = React.useMemo(() => {
    const m = {};
    FALLBACK_SERVERS.forEach(s => { m[s.id] = s; });
    return m;
  }, []);

  if (serversQ.isLoading || serversQ.isPending) {
    return (
      <div className="page" role="status" aria-busy="true" data-testid="servers-loading">
        <div className="page-head">
          <div>
            <h1 className="page-title">Servers</h1>
            <p className="page-sub">Loading…</p>
          </div>
        </div>
        <div className="card"><div className="card-body row-gap-8" style={{ padding: 16 }}>
          <Skeleton w="100%" h={32}/>
          <Skeleton w="90%" h={32}/>
          <Skeleton w="80%" h={32}/>
        </div></div>
      </div>
    );
  }
  if (serversQ.isError) {
    return (
      <div className="page" role="alert" data-testid="servers-error">
        <div className="page-head">
          <div>
            <h1 className="page-title">Servers</h1>
            <p className="page-sub">Failed to load servers.</p>
          </div>
        </div>
        <EmptyState
          icon={<I.AlertTriangle size={26}/>}
          title="Couldn't load servers"
          body={serversQ.error?.message || 'An unexpected error occurred.'}
          action={
            <button type="button" className="btn primary"
                    data-testid="servers-error-retry"
                    onClick={() => { void serversQ.refetch(); }}>
              <I.Refresh size={13}/> Retry
            </button>
          }
        />
      </div>
    );
  }

  const filtered = rawServers.filter(s => {
    if (statusFilter === 'active' && (s.enabled === false || s.status === 'err')) return false;
    if (statusFilter === 'disabled' && s.enabled !== false) return false;
    if (statusFilter === 'err' && s.status !== 'err') return false;
    if (statusFilter === 'warn' && s.status !== 'warn') return false;
    if (transportFilter !== 'all' && s.transport !== transportFilter) return false;
    if (q) {
      const hay = `${s.name || ''} ${s.url || ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const counts = {
    all: rawServers.length,
    active: rawServers.filter(s => s.enabled !== false && s.status !== 'err').length,
    disabled: rawServers.filter(s => s.enabled === false).length,
    err: rawServers.filter(s => s.status === 'err').length,
    warn: rawServers.filter(s => s.status === 'warn').length,
  };

  const allSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));
  const someSelected = filtered.some(s => selected.has(s.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };
  const toggleOne = (id) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  return (
    <div className="page" data-testid="servers-ready">
      <div className="page-head">
        <div>
          <h1 className="page-title">Servers</h1>
          <p className="page-sub">{filtered.length} of {rawServers.length} MCP servers shown</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Download size={13}/> Export</button>
          <button className="btn primary" onClick={() => onNav('servers-new')} data-testid="servers-new-btn">
            <I.Plus size={13}/> New server
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <I.Search size={14} className="search-icon"/>
          <input className="input" placeholder="Search by name, URL…"
                 value={q} onChange={e => setQ(e.target.value)}
                 data-testid="servers-search-input"
                 aria-label="Search servers"/>
        </div>
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'warn', label: 'Degraded' },
          { key: 'err', label: 'Errored' },
          { key: 'disabled', label: 'Disabled' },
        ].map(f => (
          <span key={f.key}
                className={`chip ${statusFilter === f.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.key)}
                data-testid={`servers-filter-${f.key}`}>
            {f.label} <span className="count">{counts[f.key]}</span>
          </span>
        ))}
        <span style={{ flex: 1 }}/>
        <select className="select" value={transportFilter}
                onChange={e => setTransportFilter(e.target.value)}
                style={{ width: 130 }}>
          <option value="all">All transports</option>
          <option value="http">HTTP</option>
          <option value="sse">SSE</option>
          <option value="stdio">stdio</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input type="checkbox" className="checkbox"
                         checked={allSelected}
                         ref={el => el && (el.indeterminate = someSelected)}
                         onChange={toggleAll}/>
                </th>
                <th style={{ width: 28 }}></th>
                <th>Name</th>
                <th style={{ width: 84 }}>Transport</th>
                <th style={{ width: 64 }} className="num">Tools</th>
                <th style={{ width: 140 }}>Calls (1h)</th>
                <th style={{ width: 110 }} className="num">p95</th>
                <th style={{ width: 130 }}>Last handshake</th>
                <th style={{ width: 100 }}>Health</th>
                <th style={{ width: 44 }} className="actions"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const fb = fallbackBy[s.id] || {};
                return (
                  <tr key={s.id}
                      className={selected.has(s.id) ? 'selected' : ''}
                      onClick={() => onNav(`server/${s.id}`)}
                      data-testid={`servers-row-${s.id}`}>
                    <td className="checkbox-col" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="checkbox"
                             checked={selected.has(s.id)}
                             onChange={() => toggleOne(s.id)}
                             aria-label={`Select ${s.name}`}/>
                    </td>
                    <td><StatusDot status={s.status}/></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <b>{s.name}</b>
                        {s.enabled === false && <span className="badge idle"><span className="dot"/>Disabled</span>}
                      </div>
                      <div className="tertiary mono" style={{ fontSize: 11, marginTop: 2 }}>{s.url}</div>
                    </td>
                    <td><Transport t={s.transport}/></td>
                    <td className="num">{fb.tools ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkline data={fb.spark || []} width={68} height={20} fill
                                   color={s.status === 'err' ? 'var(--status-err)' : s.status === 'warn' ? 'var(--status-warn)' : 'var(--accent)'}
                                   showPopover/>
                        <span className="mono tnum" style={{ fontSize: 12 }}>{fmtNum(fb.calls_1h ?? 0)}</span>
                      </div>
                    </td>
                    <td className="num">{fb.p95 ? `${fb.p95}ms` : '—'}</td>
                    <td className="muted mono" style={{ fontSize: 11.5 }}>
                      {fb.last_handshake_at ? fmtRelative(fb.last_handshake_at) : '—'}
                    </td>
                    <td>
                      {s.status === 'ok' && <span className="badge ok"><span className="dot"/>OK</span>}
                      {s.status === 'warn' && <span className="badge warn"><span className="dot"/>Degraded</span>}
                      {s.status === 'err' && <span className="badge err"><span className="dot"/>Down</span>}
                      {(!s.status || s.status === 'idle') && <span className="badge idle"><span className="dot"/>Idle</span>}
                    </td>
                    <td className="actions" onClick={e => e.stopPropagation()}>
                      <button className="iconbtn" aria-label="More" title="More actions">
                        <I.MoreV size={14}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10}>
                  <div role="status" aria-live="polite" data-testid="servers-empty">
                    <EmptyState
                      icon={<I.Server size={26}/>}
                      title={rawServers.length === 0 ? 'No servers yet' : 'No servers match your filters'}
                      body={rawServers.length === 0
                        ? 'Register your first MCP server to get started.'
                        : 'Try clearing some filters or registering a new server.'}
                      action={rawServers.length === 0
                        ? <button className="btn primary" onClick={() => onNav('servers-new')}><I.Plus size={12}/>New server</button>
                        : <button className="btn" onClick={() => { setStatusFilter('all'); setTransportFilter('all'); setQ(''); }}>Clear filters</button>}
                      secondary={rawServers.length > 0
                        ? <button className="btn primary" onClick={() => onNav('servers-new')}><I.Plus size={12}/>New server</button>
                        : null}
                    />
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selected.size} selected</span>
          <span className="bulk-sep"/>
          <button className="btn sm" onClick={() => { toast.push({ kind: 'ok', title: `Handshake started`, body: `Running on ${selected.size} servers…`, action: { label: 'View progress', onClick: () => onNav('audit') } }); }}>
            <I.Handshake size={12}/> Handshake
          </button>
          <button className="btn sm" onClick={() => toast.push({ kind: 'ok', title: 'Servers enabled', body: `${selected.size} servers now active.` })}>
            <I.Power size={12}/> Enable
          </button>
          <button className="btn sm" onClick={() => toast.push({ kind: 'warn', title: 'Servers disabled', body: `${selected.size} servers paused.`, action: { label: 'Undo', onClick: () => {} } })}>
            Disable
          </button>
          <button className="btn sm danger" onClick={() => setConfirmDelete(true)}>
            <I.Trash size={12}/> Delete
          </button>
          <span className="bulk-sep"/>
          <button className="btn sm ghost" onClick={() => setSelected(new Set())}>
            <I.X size={12}/> Clear
          </button>
        </div>
      )}

      <TypeToConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          toast.push({ kind: 'err', title: `Deleted ${selected.size} servers`, body: 'Audit history was preserved.' });
          setSelected(new Set());
        }}
        title={`Delete ${selected.size} server${selected.size === 1 ? '' : 's'}?`}
        body="This removes registration and handshake history. Audit log entries are preserved."
        phrase={`delete-${selected.size}-servers`}
        dangerLabel="Delete servers"
      />
    </div>
  );
}

// ============== Server detail ==============
function ServerDetailPage({ serverId, onNav, toast, onOpenAudit }) {
  const serverQ = useServer(serverId);
  const [tab, setTab] = React.useState('overview');
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (serverQ.isLoading || serverQ.isPending) {
    return (
      <div className="page" role="status" aria-busy="true" data-testid="server-detail-loading">
        <div className="page-head">
          <div>
            <h1 className="page-title">Server</h1>
            <p className="page-sub">Loading…</p>
          </div>
        </div>
        <div className="card"><div className="card-body row-gap-8" style={{ padding: 16 }}>
          <Skeleton w="40%" h={22}/>
          <Skeleton w="70%" h={14}/>
          <Skeleton w="90%" h={14}/>
        </div></div>
      </div>
    );
  }
  if (serverQ.isError) {
    return (
      <div className="page" role="alert" data-testid="server-detail-error">
        <EmptyState
          icon={<I.AlertTriangle size={26}/>}
          title="Couldn't load server"
          body={serverQ.error?.message || 'An unexpected error occurred.'}
          action={
            <button type="button" className="btn primary"
                    data-testid="server-detail-error-retry"
                    onClick={() => { void serverQ.refetch(); }}>
              <I.Refresh size={13}/> Retry
            </button>
          }
        />
      </div>
    );
  }
  const liveServer = serverQ.data;
  if (!liveServer) {
    return (
      <div className="page" data-testid="server-detail-empty">
        <EmptyState title="Server not found" body={`No server with id ${serverId}.`}
          action={<button className="btn" onClick={() => onNav('servers')}>Back to servers</button>}/>
      </div>
    );
  }

  // Merge in fixture telemetry the wire `McpServer` shape doesn't carry.
  const fb = FALLBACK_SERVERS.find(x => x.id === liveServer.id) || {};
  const s = { ...fb, ...liveServer };
  const handshakeHistory = Array.from({ length: 12 }, (_, i) => ({
    ts: (s.last_handshake_at || Date.now()) - i * 4 * 60 * 60 * 1000,
    dur: Math.round(180 + Math.random() * 400),
    ok: i === 0 ? s.status !== 'err' : Math.random() > 0.05,
    tools: (s.tools || 0) + Math.floor(Math.random() * 3) - 1,
  }));

  return (
    <div className="page" data-testid="server-detail-ready">
      <Breadcrumbs route="servers" extra={[s.name]} onNav={onNav}/>
      <div className="page-head" style={{ marginTop: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusDot status={s.status} size={10}/>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{s.name}</h1>
            <Transport t={s.transport}/>
            {!s.enabled && <span className="badge idle"><span className="dot"/>Disabled</span>}
            {s.status === 'err' && <span className="badge err"><span className="dot"/>Down</span>}
            {s.status === 'warn' && <span className="badge warn"><span className="dot"/>Degraded</span>}
          </div>
          <p className="page-sub" style={{ marginTop: 6 }}>
            {s.desc}
            <span className="tertiary"> · tenant {s.tenant} · owner {s.owner} · created {fmtRelative(s.created_at)}</span>
          </p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Handshake size={13}/> Run handshake</button>
          <button className="btn">
            <I.Power size={13}/> {s.enabled ? 'Disable' : 'Enable'}
          </button>
          <button className="btn"><I.Edit size={13}/> Edit</button>
          <button className="btn danger" onClick={() => setConfirmDelete(true)}>
            <I.Trash size={13}/> Delete
          </button>
        </div>
      </div>

      {s.status === 'err' && (
        <div className="banner warn">
          <span className="banner-icon"><I.AlertTriangle size={16}/></span>
          <div className="banner-body">
            <b>Handshake failed</b> · {s.last_error} · breaker tripped for 2 tools · last attempt {fmtRelative(s.last_handshake_at)}.
          </div>
          <button className="btn sm"><I.Refresh size={12}/> Retry handshake</button>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi" style={{ cursor: 'default' }}>
          <div className="kpi-label"><I.Activity size={13}/>Calls (1h)</div>
          <div className="kpi-row">
            <div className="kpi-value">{fmtNum(s.calls_1h)}</div>
            <span className="kpi-delta up"><I.ArrowUp size={11}/>+8%</span>
          </div>
          <div className="kpi-footer"/>
          <div className="kpi-spark"><Sparkline data={s.spark} width={340} height={34} color="var(--accent)"/></div>
        </div>
        <div className="kpi" style={{ cursor: 'default' }}>
          <div className="kpi-label"><I.Clock size={13}/>p50 / p95</div>
          <div className="kpi-row">
            <div className="kpi-value">{s.p50}<span className="kpi-sub">ms</span></div>
            <span className="kpi-delta tertiary mono">p95 {s.p95}ms</span>
          </div>
          <div className="kpi-footer"/>
          <div className="kpi-spark"><Sparkline data={s.spark_latency} width={340} height={34}
            color={s.status === 'warn' ? 'var(--status-warn)' : 'var(--accent)'}/></div>
        </div>
        <div className="kpi" style={{ cursor: 'default' }}>
          <div className="kpi-label"><I.XCircle size={13}/>Errors (1h)</div>
          <div className="kpi-row">
            <div className="kpi-value">{s.errors_1h}</div>
            <span className={`kpi-delta ${s.errors_1h > 10 ? 'down' : 'flat'}`}>
              {((s.errors_1h / Math.max(s.calls_1h, 1)) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="kpi-footer"/>
        </div>
        <div className="kpi" style={{ cursor: 'default' }}>
          <div className="kpi-label"><I.Layers size={13}/>Capabilities</div>
          <div className="kpi-row">
            <div className="kpi-value mono" style={{ fontSize: 18, fontFamily: 'var(--font-mono)' }}>
              {s.tools} <span className="kpi-sub" style={{ fontSize: 12 }}>tools</span>
            </div>
          </div>
          <div className="tertiary mono" style={{ fontSize: 11.5, marginTop: 4 }}>
            {s.resources} resources · {s.prompts} prompts
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        { key: 'overview', label: 'Overview', icon: <I.Info size={13}/> },
        { key: 'tools', label: 'Tools', icon: <I.Wrench size={13}/>, count: s.tools },
        { key: 'resources', label: 'Resources', icon: <I.FileBox size={13}/>, count: s.resources },
        { key: 'prompts', label: 'Prompts', icon: <I.Sparkles size={13}/>, count: s.prompts },
        { key: 'handshakes', label: 'Handshakes', icon: <I.Handshake size={13}/> },
        { key: 'audit', label: 'Audit', icon: <I.Scroll size={13}/> },
        { key: 'config', label: 'Config', icon: <I.FileCode size={13}/> },
      ]}/>

      <div style={{ marginTop: 16 }}>
        {tab === 'overview' && <ServerOverview s={s}/>}
        {tab === 'tools' && <ServerToolsTab serverId={liveServer.id} onNav={onNav}/>}
        {tab === 'resources' && <ServerResourcesTab serverId={liveServer.id}/>}
        {tab === 'prompts' && <ServerPromptsTab serverId={liveServer.id}/>}
        {tab === 'handshakes' && <ServerHandshakes s={s} history={handshakeHistory}/>}
        {tab === 'audit' && <ServerAuditTab serverId={liveServer.id} serverName={liveServer.name} onOpenAudit={onOpenAudit}/>}
        {tab === 'config' && <ServerConfig s={s}/>}
      </div>

      <TypeToConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          toast.push({ kind: 'err', title: `Deleted server ${s.name}`, body: 'Audit history was preserved.' });
          onNav('servers');
        }}
        title={`Delete server "${s.name}"?`}
        body="This removes the server registration and handshake history. Audit log entries are preserved."
        phrase={`delete-server-${s.name}`}
        dangerLabel="Delete server"
      />
    </div>
  );
}

function ServerOverview({ s }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="card">
        <div className="card-head"><div className="card-title">Configuration</div></div>
        <div className="card-body">
          <dl className="kv">
            <dt>Server ID</dt><dd className="mono">{s.id}</dd>
            <dt>Tenant</dt><dd>{s.tenant || '—'}</dd>
            <dt>Owner</dt><dd>{s.owner || '—'}</dd>
            <dt>Transport</dt><dd><Transport t={s.transport}/></dd>
            <dt>Endpoint</dt><dd className="mono">{s.url}</dd>
            <dt>Created</dt><dd>{s.created_at ? fmtDateTime(s.created_at) : '—'}</dd>
            <dt>Last handshake</dt><dd>
              {s.last_handshake_at ? fmtRelative(s.last_handshake_at) : '—'}
              {s.handshake_dur_ms != null && <span className="tertiary"> · {fmtDuration(s.handshake_dur_ms)}</span>}
            </dd>
            <dt>Timeout</dt><dd className="mono">30000ms</dd>
            <dt>Retry policy</dt><dd className="mono">exponential · max 3</dd>
            <dt>CB threshold</dt><dd className="mono">5 fails / 60s window</dd>
          </dl>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><div className="card-title">Latency distribution (1h)</div></div>
        <div className="card-body">
          <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {(s.spark_latency || []).slice(0, 30).map((v, i) => {
              const arr = s.spark_latency || [];
              const max = arr.length ? Math.max(...arr) : 0;
              const h = max > 0 ? (v / max) * 100 : 0;
              return (
                <div key={i} title={`${v}ms`}
                     style={{
                       flex: 1, height: `${h}%`,
                       background: v > (s.p95 || 1) * 1.5 ? 'var(--status-err)' : v > (s.p95 || Infinity) ? 'var(--status-warn)' : 'var(--accent)',
                       borderRadius: '2px 2px 0 0', minHeight: 2, opacity: 0.85,
                     }}/>
              );
            })}
          </div>
          <div className="flex-h-between" style={{ marginTop: 12, fontSize: 11.5 }}>
            <span><b className="mono">{s.p50 ?? '—'}</b><span className="tertiary"> ms p50</span></span>
            <span><b className="mono">{s.p95 ?? '—'}</b><span className="tertiary"> ms p95</span></span>
            <span><b className="mono">{s.p99 ?? '—'}</b><span className="tertiary"> ms p99</span></span>
            <span><b className="mono">{s.p99 != null ? fmtDuration(s.p99 * 2) : '—'}</b><span className="tertiary"> ms max</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerToolsTab({ serverId, onNav }) {
  const q = useServerTools(serverId);
  return (
    <DataState
      query={q}
      testIdBase="server-tools"
      isEmpty={(data) => !data || data.length === 0}
      empty={{ icon: <I.Wrench size={26}/>, title: 'No tools', body: "This server hasn't advertised any tools yet." }}
      ready={(tools) => (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Tool catalog · {tools.length}</div>
            <div className="flex-h">
              <button className="btn sm"><I.Refresh size={12}/> Re-handshake</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {tools.map(t => (
                  <tr key={t.name} onClick={() => onNav(`tool/${serverId}/${t.name}`)}
                      data-testid={`server-tools-row-${t.name}`}>
                    <td><b className="mono">{t.name}</b></td>
                    <td className="muted">{t.description || '—'}</td>
                    <td>
                      <button className="btn sm" onClick={(e) => { e.stopPropagation(); onNav(`tool/${serverId}/${t.name}`); }}>
                        <I.Play size={12}/> Try it
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    />
  );
}

function ServerResourcesTab({ serverId }) {
  const q = useResources(serverId);
  return (
    <DataState
      query={q}
      testIdBase="server-resources"
      isEmpty={(data) => !data || data.length === 0}
      empty={{ icon: <I.FileBox size={26}/>, title: 'No resources', body: "This server hasn't advertised any resources yet." }}
      ready={(resources) => (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Resources · {resources.length}</div>
            <a className="icon-link" onClick={() => document.dispatchEvent(new CustomEvent('app:nav', { detail: 'resources' }))}>
              Open in resources browser <I.ArrowRight size={12}/>
            </a>
          </div>
          <div className="card-body">
            <p className="muted" style={{ marginTop: 0 }}>
              Latest handshake advertised <b>{resources.length}</b> resource URIs. Full browser available in the Resources screen.
            </p>
          </div>
        </div>
      )}
    />
  );
}

function ServerPromptsTab({ serverId }) {
  const q = usePrompts(serverId);
  return (
    <DataState
      query={q}
      testIdBase="server-prompts"
      isEmpty={(data) => !data || data.length === 0}
      empty={{ icon: <I.Sparkles size={26}/>, title: 'No prompts', body: "This server doesn't expose any prompts." }}
      ready={(prompts) => (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Prompts · {prompts.length}</div>
          </div>
          <div className="card-body flush">
            {prompts.map(p => (
              <div key={p.name} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
                   data-testid={`server-prompts-row-${p.name}`}>
                <div className="flex-h-between">
                  <b className="mono">{p.name}</b>
                  <span className="badge outline">{(p.args || []).length} arg{(p.args || []).length === 1 ? '' : 's'}</span>
                </div>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 12.5 }}>{p.desc || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}

function ServerHandshakes({ s, history }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Handshake history · last 12</div>
        <button className="btn sm"><I.Handshake size={12}/> Run handshake now</button>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Timestamp</th>
              <th style={{ width: 100 }}>Duration</th>
              <th style={{ width: 100 }}>Tools</th>
              <th>Result</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td><StatusDot status={h.ok ? 'ok' : 'err'}/></td>
                <td className="mono" style={{ fontSize: 12 }}>{fmtDateTime(h.ts)}</td>
                <td className="num">{h.dur ? fmtDuration(h.dur) : '—'}</td>
                <td className="num">{h.ok ? h.tools : '—'}</td>
                <td className="muted">{h.ok ? 'capabilities synced' : 'timeout after 30s'}</td>
                <td><button className="btn sm ghost"><I.Code2 size={12}/> Envelope</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServerAuditTab({ serverId, serverName, onOpenAudit }) {
  const q = useAudit({ server_id: serverId, per_page: 30 });
  return (
    <DataState
      query={q}
      testIdBase="server-audit"
      isEmpty={(data) => !data || data.length === 0}
      empty={{ icon: <I.Scroll size={26}/>, title: 'No audit rows', body: 'This server has no recent invocations.' }}
      ready={(rows) => (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Audit log · scoped to {serverName}</div>
            <a className="icon-link" onClick={() => document.dispatchEvent(new CustomEvent('app:nav', { detail: 'audit' }))}>
              Open full audit log <I.ArrowRight size={12}/>
            </a>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th style={{ width: 110 }}>Time</th>
                  <th>Tool</th>
                  <th style={{ width: 80 }} className="num">Dur</th>
                  <th style={{ width: 70 }}>Status</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(a => {
                  const statusNum = Number(a.status);
                  const ts = a.created_at ? new Date(a.created_at).getTime() : a.ts;
                  const dur = a.duration_ms ?? a.dur;
                  return (
                    <tr key={a.id} onClick={() => onOpenAudit(a.id)}
                        data-testid={`server-audit-row-${a.id}`}>
                      <td><StatusDot status={statusNum === 200 ? 'ok' : statusNum >= 500 ? 'err' : 'warn'}/></td>
                      <td className="mono tertiary" style={{ fontSize: 11.5 }}>{fmtRelative(ts)}</td>
                      <td><b className="mono">{a.tool_name || a.tool || '—'}</b></td>
                      <td className="num">{fmtDuration(dur)}</td>
                      <td>
                        <span className={`badge mono ${statusNum === 200 ? 'ok' : statusNum >= 500 ? 'err' : 'warn'}`}>{a.status}</span>
                      </td>
                      <td className="muted truncate" style={{ maxWidth: 180 }}>{a.actor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    />
  );
}

function ServerConfig({ s }) {
  const config = {
    id: s.id,
    name: s.name,
    transport: s.transport,
    endpoint: s.url,
    enabled: s.enabled,
    tenant: s.tenant,
    owner: s.owner,
    timeout_ms: 30000,
    retry_policy: { strategy: 'exponential', base_ms: 500, max_attempts: 3, max_ms: 30000 },
    circuit_breaker: { failure_threshold: 5, open_duration_s: 60, half_open_probes: 1 },
    auth: { type: 'bearer', token_env: `MCP_${s.name.toUpperCase().replace(/-/g, '_')}_TOKEN` },
    headers: { 'x-mcp-version': '2026-05-01', 'user-agent': 'AskMyDocs/2.4' },
    created_at: new Date(s.created_at).toISOString(),
  };
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Effective configuration</div>
        <div className="flex-h">
          <button className="btn sm ghost"><I.Copy size={12}/> Copy JSON</button>
          <button className="btn sm"><I.Edit size={12}/> Edit</button>
        </div>
      </div>
      <div className="card-body">
        <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(config) }}/>
      </div>
    </div>
  );
}

// ============== Server new wizard ==============
function ServerNewPage({ onNav, toast }) {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    name: '', desc: '', tenant: 'acme-corp', owner: 'lorenzo@padosoft.com',
    transport: 'http',
    url: '',
    command: '', args: '',
    headers: [{ k: 'Authorization', v: 'Bearer ${MCP_TOKEN}' }],
    env: [{ k: '', v: '' }],
    auth: 'bearer',
    enabled: true,
    timeout: 30000,
    retry: 'exponential',
    cb_threshold: 5, cb_open_s: 60,
  });
  const [errors, setErrors] = React.useState({});

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!data.name) e.name = 'Name is required';
      else if (!/^[a-z][a-z0-9-]*$/.test(data.name)) e.name = 'Must be kebab-case (lowercase, hyphens)';
    } else if (s === 2) {
      if (data.transport === 'http' || data.transport === 'sse') {
        if (!data.url) e.url = 'URL is required';
      } else if (data.transport === 'stdio') {
        if (!data.command) e.command = 'Command is required';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep(step + 1); };
  const back = () => setStep(Math.max(1, step - 1));
  const submit = () => {
    toast.push({ kind: 'ok', title: `Server ${data.name} registered`, body: 'Running first handshake…', action: { label: 'View audit', onClick: () => onNav('audit') } });
    setTimeout(() => onNav('servers'), 600);
  };

  return (
    <div className="page">
      <Breadcrumbs route="servers" extra={['New server']} onNav={onNav}/>
      <div className="page-head" style={{ marginTop: 12 }}>
        <div>
          <h1 className="page-title">Register MCP server</h1>
          <p className="page-sub">Configure transport, auth, and policies. We'll run a handshake immediately after creation.</p>
        </div>
        <button className="btn ghost" onClick={() => onNav('servers')}><I.X size={13}/> Cancel</button>
      </div>

      <div className="wizard">
        <div className="wizard-steps">
          {[
            { n: 1, label: 'Identity' },
            { n: 2, label: 'Transport' },
            { n: 3, label: 'Policies' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div className={`wizard-step-dot ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
                <span className="dot">{step > s.n ? <I.Check size={12}/> : s.n}</span>
                <small>{s.label}</small>
              </div>
              {i < arr.length - 1 && <div className={`wizard-connector ${step > s.n ? 'done' : ''}`}/>}
            </React.Fragment>
          ))}
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 24 }}>
            {step === 1 && <WizStep1 data={data} setData={setData} errors={errors}/>}
            {step === 2 && <WizStep2 data={data} setData={setData} errors={errors}/>}
            {step === 3 && <WizStep3 data={data} setData={setData} errors={errors}/>}
          </div>
          <div className="modal-foot" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn ghost" onClick={() => onNav('servers')}>Cancel</button>
            <span style={{ flex: 1 }}/>
            {step > 1 && <button className="btn" onClick={back}><I.ChevronLeft size={13}/> Back</button>}
            {step < 3 && <button className="btn primary" onClick={next}>Next <I.ChevronRight size={13}/></button>}
            {step === 3 && <button className="btn primary" onClick={submit}><I.Check size={13}/> Register & handshake</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function WizStep1({ data, setData, errors }) {
  return (
    <div className="row-gap-16">
      <div>
        <label className="label">Name <span className="req">*</span></label>
        <input className={`input mono ${errors.name ? 'input-error' : ''}`}
               placeholder="my-mcp-server"
               value={data.name}
               onChange={e => setData({ ...data, name: e.target.value })}/>
        {errors.name && <div className="field-error"><I.XCircle size={12}/>{errors.name}</div>}
        <div className="field-hint">Lowercase letters, digits and hyphens. Must be unique within tenant.</div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="textarea" rows={2}
                  placeholder="One-line summary of what this server provides…"
                  value={data.desc}
                  onChange={e => setData({ ...data, desc: e.target.value })}/>
      </div>
      <div className="grid-2">
        <div>
          <label className="label">Tenant</label>
          <select className="select" value={data.tenant} onChange={e => setData({ ...data, tenant: e.target.value })}>
            {TENANTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Owner</label>
          <select className="select" value={data.owner} onChange={e => setData({ ...data, owner: e.target.value })}>
            <option>lorenzo@padosoft.com</option>
            <option>marco@padosoft.com</option>
            <option>alice@padosoft.com</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function WizStep2({ data, setData, errors }) {
  return (
    <div className="row-gap-16">
      <div>
        <label className="label">Transport type <span className="req">*</span></label>
        <div className="transport-radio">
          {[
            { v: 'http', label: 'HTTP', icon: <I.Globe size={16}/>, desc: 'Standard JSON-RPC over HTTPS. Best for hosted MCP servers.' },
            { v: 'sse', label: 'SSE', icon: <I.Radio size={16}/>, desc: 'Server-Sent Events. Bidirectional streaming, long-lived.' },
            { v: 'stdio', label: 'stdio', icon: <I.Terminal size={16}/>, desc: 'Local subprocess. Stdin/stdout pipe. Fastest, sandbox-friendly.' },
          ].map(t => (
            <button key={t.v}
                    className={`transport-card ${data.transport === t.v ? 'active' : ''}`}
                    onClick={() => setData({ ...data, transport: t.v })}>
              <div className="tc-head">{t.icon}{t.label}</div>
              <div className="tc-desc">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {(data.transport === 'http' || data.transport === 'sse') && (
        <>
          <div>
            <label className="label">Endpoint URL <span className="req">*</span></label>
            <input className={`input mono ${errors.url ? 'input-error' : ''}`}
                   placeholder={data.transport === 'sse' ? 'wss://example.com/mcp/sse' : 'https://example.com/mcp/v1'}
                   value={data.url}
                   onChange={e => setData({ ...data, url: e.target.value })}/>
            {errors.url && <div className="field-error"><I.XCircle size={12}/>{errors.url}</div>}
          </div>
          <div>
            <label className="label">Auth</label>
            <select className="select" value={data.auth} onChange={e => setData({ ...data, auth: e.target.value })}>
              <option value="none">None</option>
              <option value="bearer">Bearer token</option>
              <option value="basic">Basic auth</option>
              <option value="oauth">OAuth 2.0</option>
            </select>
          </div>
          <div>
            <label className="label">Headers</label>
            {data.headers.map((h, i) => (
              <div key={i} className="kvpair-row">
                <input className="input mono" placeholder="Header"
                       value={h.k} onChange={e => {
                  const n = [...data.headers]; n[i] = { ...n[i], k: e.target.value };
                  setData({ ...data, headers: n });
                }}/>
                <input className="input mono" placeholder="Value"
                       value={h.v} onChange={e => {
                  const n = [...data.headers]; n[i] = { ...n[i], v: e.target.value };
                  setData({ ...data, headers: n });
                }}/>
                <button className="iconbtn" onClick={() => {
                  setData({ ...data, headers: data.headers.filter((_, j) => j !== i) });
                }}><I.X size={14}/></button>
              </div>
            ))}
            <button className="btn sm ghost"
                    onClick={() => setData({ ...data, headers: [...data.headers, { k: '', v: '' }] })}>
              <I.Plus size={12}/> Add header
            </button>
          </div>
        </>
      )}

      {data.transport === 'stdio' && (
        <>
          <div>
            <label className="label">Command <span className="req">*</span></label>
            <input className={`input mono ${errors.command ? 'input-error' : ''}`}
                   placeholder="/usr/local/bin/mcp-fs"
                   value={data.command}
                   onChange={e => setData({ ...data, command: e.target.value })}/>
            {errors.command && <div className="field-error"><I.XCircle size={12}/>{errors.command}</div>}
          </div>
          <div>
            <label className="label">Arguments</label>
            <input className="input mono" placeholder="--port 0 --strict"
                   value={data.args}
                   onChange={e => setData({ ...data, args: e.target.value })}/>
            <div className="field-hint">Space-separated. Use <code className="mono">"quoted"</code> for args with spaces.</div>
          </div>
          <div>
            <label className="label">Environment variables</label>
            <p className="field-hint" style={{ marginTop: 0 }}>Use <code className="mono">{'${VAR}'}</code> to reference host env vars.</p>
            {data.env.map((e, i) => (
              <div key={i} className="kvpair-row">
                <input className="input mono" placeholder="KEY"
                       value={e.k} onChange={ev => {
                  const n = [...data.env]; n[i] = { ...n[i], k: ev.target.value };
                  setData({ ...data, env: n });
                }}/>
                <input className="input mono" placeholder="value"
                       value={e.v} onChange={ev => {
                  const n = [...data.env]; n[i] = { ...n[i], v: ev.target.value };
                  setData({ ...data, env: n });
                }}/>
                <button className="iconbtn" onClick={() => {
                  setData({ ...data, env: data.env.filter((_, j) => j !== i) });
                }}><I.X size={14}/></button>
              </div>
            ))}
            <button className="btn sm ghost"
                    onClick={() => setData({ ...data, env: [...data.env, { k: '', v: '' }] })}>
              <I.Plus size={12}/> Add var
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function WizStep3({ data, setData }) {
  const review = {
    name: data.name,
    transport: data.transport,
    endpoint: data.transport === 'stdio' ? `${data.command} ${data.args}`.trim() : data.url,
    enabled: data.enabled,
    timeout_ms: data.timeout,
    retry_policy: { strategy: data.retry, max_attempts: 3 },
    circuit_breaker: { failure_threshold: data.cb_threshold, open_duration_s: data.cb_open_s },
  };
  return (
    <div className="row-gap-16">
      <div className="grid-2">
        <div>
          <label className="label">Timeout (ms)</label>
          <input className="input mono" type="number" value={data.timeout}
                 onChange={e => setData({ ...data, timeout: Number(e.target.value) })}/>
        </div>
        <div>
          <label className="label">Retry strategy</label>
          <select className="select" value={data.retry}
                  onChange={e => setData({ ...data, retry: e.target.value })}>
            <option value="none">None</option>
            <option value="fixed">Fixed backoff</option>
            <option value="exponential">Exponential backoff</option>
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div>
          <label className="label">CB failure threshold</label>
          <input className="input mono" type="number" value={data.cb_threshold}
                 onChange={e => setData({ ...data, cb_threshold: Number(e.target.value) })}/>
          <div className="field-hint">Number of failures before the breaker opens.</div>
        </div>
        <div>
          <label className="label">CB open duration (s)</label>
          <input className="input mono" type="number" value={data.cb_open_s}
                 onChange={e => setData({ ...data, cb_open_s: Number(e.target.value) })}/>
          <div className="field-hint">How long the breaker stays open before half-open probe.</div>
        </div>
      </div>
      <div>
        <label className="label">Enabled on creation</label>
        <div className="flex-h">
          <input type="checkbox" className="checkbox" checked={data.enabled}
                 onChange={e => setData({ ...data, enabled: e.target.checked })}/>
          <span className="muted" style={{ fontSize: 12.5 }}>Start brokering immediately after handshake completes</span>
        </div>
      </div>
      <hr className="divider"/>
      <div>
        <label className="label">Review</label>
        <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(review) }}/>
      </div>
    </div>
  );
}

export { ServersListPage, ServerDetailPage, ServerNewPage };
