// @ts-nocheck
// W3: read-paths wired. `AuditPage` is now hook-backed via
// `useAudit({...filters})`. The drill-down drawer is hook-backed via
// `useAuditDetail(auditId)`. The `BreakersPage` lives in this module
// (alongside the audit drawer for prototype-historical reasons); it's
// now hook-backed via `useBreakers()`. Mutations (reset breaker / replay
// audit) remain stubbed — W4 wires them.

import React from 'react';
import {
  TENANTS, AUDIT_DETAIL as FALLBACK_AUDIT_DETAIL,
} from '../lib/data';
import {
  Icon, I, StatusDot, Transport, Sparkline,
  fmtRelative, fmtTime, fmtTimeMs, fmtDateTime, fmtDuration, fmtBytes, fmtNum,
  jsonHighlight, useToast, Modal, Drawer, TypeToConfirmModal,
  Kbd, Skeleton, Tabs, EmptyState,
} from '../lib/ui';
import { Breadcrumbs, ROUTES, SECONDARY } from '../components/shell';
import {
  useAudit, useAuditDetail, useBreakers, useServers,
} from '../lib/queries/hooks';

// ============== Audit log + drilldown drawer ==============

function AuditPage({ onNav, onOpenAudit, initialAuditId }) {
  const [filters, setFilters] = React.useState({
    range: '1h',
    tenant: 'all', server: 'all', tool: 'all', status: 'all', actor: 'all',
    q: '',
  });
  const [saved, setSaved] = React.useState(false);

  // Build wire-shape filter object — drop "all" sentinels.
  const wireFilters = React.useMemo(() => {
    const f = { per_page: 80 };
    if (filters.server !== 'all') f.server_id = filters.server;
    if (filters.tool !== 'all') f.tool_name = filters.tool;
    if (filters.status !== 'all') f.status = filters.status;
    return f;
  }, [filters.server, filters.tool, filters.status]);

  const auditQ = useAudit(wireFilters);
  const serversQ = useServers();
  const rawRows = auditQ.data ?? [];
  const liveServers = serversQ.data?.data ?? [];

  // Client-side q filter (BE may not support full-text yet).
  const filtered = rawRows.filter(a => {
    const statusNum = Number(a.status);
    if (filters.tenant !== 'all' && a.tenant_id !== filters.tenant && a.tenant !== filters.tenant) return false;
    if (filters.status === 'success' && statusNum >= 400) return false;
    if (filters.status === 'client_error' && (statusNum < 400 || statusNum >= 500)) return false;
    if (filters.status === 'server_error' && statusNum < 500) return false;
    if (filters.q) {
      const hay = `${a.id} ${a.tool_name || a.tool || ''} ${a.mcp_server_name || a.server || ''}`.toLowerCase();
      if (!hay.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  });

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== 'all' && v !== '' && k !== 'range').length;

  const clearFilters = () => setFilters({ range: '1h', tenant: 'all', server: 'all', tool: 'all', status: 'all', actor: 'all', q: '' });

  if (auditQ.isLoading || auditQ.isPending) {
    return (
      <div className="page" role="status" aria-busy="true" data-testid="audit-loading">
        <div className="page-head">
          <div>
            <h1 className="page-title">Audit log</h1>
            <p className="page-sub">Loading…</p>
          </div>
        </div>
        <div className="card"><div className="card-body row-gap-8" style={{ padding: 16 }}>
          <Skeleton w="100%" h={22}/>
          <Skeleton w="100%" h={22}/>
          <Skeleton w="100%" h={22}/>
        </div></div>
      </div>
    );
  }
  if (auditQ.isError) {
    return (
      <div className="page" role="alert" data-testid="audit-error">
        <EmptyState
          icon={<I.AlertTriangle size={26}/>}
          title="Couldn't load audit log"
          body={auditQ.error?.message || 'An unexpected error occurred.'}
          action={
            <button type="button" className="btn primary"
                    data-testid="audit-error-retry"
                    onClick={() => { void auditQ.refetch(); }}>
              <I.Refresh size={13}/> Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page" data-testid="audit-ready">
      <div className="page-head">
        <div>
          <h1 className="page-title">Audit log</h1>
          <p className="page-sub">{fmtNum(filtered.length)} of {fmtNum(rawRows.length)} rows · last {filters.range} window</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Download size={13}/> Export</button>
          <button className="btn" onClick={() => setSaved(!saved)}>
            <I.Pin size={13}/> {saved ? 'View saved' : 'Save view'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ padding: 12 }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <div className="search-input" style={{ maxWidth: 280 }}>
              <I.Search size={13} className="search-icon"/>
              <input className="input mono" placeholder="Audit ID, tool, server…"
                     value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })}/>
            </div>
            <select className="select" style={{ width: 130 }} value={filters.range}
                    onChange={e => setFilters({ ...filters, range: e.target.value })}>
              <option value="15m">Last 15 min</option>
              <option value="1h">Last 1 hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="custom">Custom…</option>
            </select>
            <select className="select" style={{ width: 150 }} value={filters.tenant}
                    onChange={e => setFilters({ ...filters, tenant: e.target.value })}>
              <option value="all">All tenants</option>
              {TENANTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className="select" style={{ width: 170 }} value={filters.server}
                    onChange={e => setFilters({ ...filters, server: e.target.value })}
                    aria-label="Server filter"
                    data-testid="audit-filter-server">
              <option value="all">All servers</option>
              {liveServers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="select" style={{ width: 130 }} value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="all">All status</option>
              <option value="success">2xx Success</option>
              <option value="client_error">4xx Client error</option>
              <option value="server_error">5xx Server error</option>
            </select>
            <span style={{ flex: 1 }}/>
            {activeFilterCount > 0 && (
              <button className="btn sm ghost" onClick={clearFilters}>
                <I.X size={12}/> Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th style={{ width: 140 }}>Timestamp</th>
                <th style={{ width: 110 }}>Tenant</th>
                <th style={{ width: 140 }}>Server</th>
                <th>Method / Tool</th>
                <th style={{ width: 80 }} className="num">Duration</th>
                <th style={{ width: 70 }}>Status</th>
                <th style={{ width: 170 }}>Actor</th>
                <th style={{ width: 120 }}>Audit ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map(a => {
                const statusNum = Number(a.status);
                const ts = a.created_at ? new Date(a.created_at).getTime() : a.ts;
                const dur = a.duration_ms ?? a.dur;
                const serverLabel = a.mcp_server_name || a.server || a.mcp_server_id;
                const toolLabel = a.tool_name || a.tool;
                return (
                  <tr key={a.id} onClick={() => onOpenAudit(a.id)} data-testid={`audit-row-${a.id}`}>
                    <td><StatusDot status={statusNum === 200 ? 'ok' : statusNum >= 500 ? 'err' : 'warn'}/></td>
                    <td className="mono" style={{ fontSize: 11.5 }}>{ts ? fmtDateTime(ts).slice(11, 19) : '—'}<span className="tertiary"> · {ts ? fmtRelative(ts) : ''}</span></td>
                    <td className="muted mono" style={{ fontSize: 11.5 }}>{a.tenant_id || a.tenant || '—'}</td>
                    <td><b className="mono" style={{ fontSize: 12 }}>{serverLabel}</b></td>
                    <td>
                      {a.method && <span className="mono tertiary" style={{ fontSize: 11.5 }}>{a.method}</span>}
                      {a.method && toolLabel && <span className="tertiary"> · </span>}
                      {toolLabel && <b className="mono">{toolLabel}</b>}
                    </td>
                    <td className="num">
                      <span style={{ color: dur > 2000 ? 'var(--status-err)' : dur > 800 ? 'var(--status-warn)' : 'inherit' }}>
                        {fmtDuration(dur)}
                      </span>
                    </td>
                    <td><span className={`badge mono ${statusNum === 200 ? 'ok' : statusNum >= 500 ? 'err' : 'warn'}`}>{a.status}</span></td>
                    <td className="muted truncate" style={{ maxWidth: 170 }}>{a.actor}</td>
                    <td><span className="id-link">{String(a.id).slice(0, 12)}…</span></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9}>
                  <div role="status" aria-live="polite" data-testid="audit-empty">
                    <EmptyState
                      icon={<I.Scroll size={26}/>}
                      title={rawRows.length === 0 ? 'No audit rows yet' : 'No rows match your filters'}
                      body={rawRows.length === 0
                        ? 'Invoke a tool to generate audit history.'
                        : 'Try widening the filters or selecting a different time window.'}
                      action={rawRows.length > 0
                        ? <button className="btn" onClick={clearFilters}>Clear filters</button>
                        : <button className="btn primary" onClick={() => onNav('tools')}><I.Play size={12}/>Open tools</button>}
                    />
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Showing 1–80 of {fmtNum(filtered.length)}</span>
          <div className="pagination-controls">
            <button className="btn sm" disabled><I.ChevronLeft size={12}/></button>
            <button className="btn sm"><I.ChevronRight size={12}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Map a wire `AuditDetail` (snake_case BE shape) onto the legacy
// fixture-shaped keys the drawer renders below. Without this, the
// drilldown silently mixed the fixture's `server` / `tool` / `dur` /
// `ts` with the live row's `mcp_server_name` / `tool_name` /
// `duration_ms` / `created_at`, so operators saw misleading metadata
// (the seed server name attached to a real audit id). Re-projects only
// the load-bearing primitives; sparse meta/timeline/headers still fall
// through to the fixture via the spread merge below until the BE emits
// them, which is what the fixture-banner warns the operator about.
function projectWireAuditDetail(live) {
  if (!live) return null;
  const ts = live.created_at ? new Date(live.created_at).getTime() : live.ts;
  return {
    ...live,
    server: live.mcp_server_name || live.mcp_server_id || live.server,
    tool: live.tool_name || live.tool,
    dur: live.duration_ms ?? live.dur,
    ts: ts || live.ts,
    tenant: live.tenant_id || live.tenant,
  };
}

// Audit drilldown drawer content
function AuditDrilldown({ auditId, onClose, toast }) {
  const [tab, setTab] = React.useState('request');
  const detailQ = useAuditDetail(auditId);
  // Wire `AuditDetail` carries the same fields but is sparse for fields like
  // `timeline` / `headers` / `meta` until the BE emits them. Merge with the
  // fixture so the drawer still renders a useful narrative — flagged in the
  // banner when the auditId doesn't match the fixture id.
  const live = projectWireAuditDetail(detailQ.data);
  const detail = live ? { ...FALLBACK_AUDIT_DETAIL, ...live } : FALLBACK_AUDIT_DETAIL;
  const [showReplay, setShowReplay] = React.useState(false);

  return (
    <Drawer open={!!auditId} onClose={onClose}
            width={820}
            titleIcon={<I.Hash size={16}/>}
            title={auditId || detail.id}
            sub={fmtDateTime(detail.ts)}
            actions={
              <>
                <button className="btn sm ghost"
                        onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.push({ kind: 'ok', title: 'Permalink copied', body: auditId }); }}>
                  <I.Copy size={12}/> Permalink
                </button>
                <button className="btn sm" onClick={() => setShowReplay(true)}>
                  <I.Replay size={12}/> Replay
                </button>
              </>
            }>
      {detailQ.isError && (
        <div className="banner warn" style={{ margin: 16 }} role="alert" data-testid="audit-drilldown-error">
          <span className="banner-icon"><I.AlertTriangle size={16}/></span>
          <div className="banner-body">
            Couldn't fetch full detail for <b className="mono">{auditId}</b>.
            {detailQ.error?.message ? <> {detailQ.error.message}</> : null}
          </div>
          <button type="button" className="btn sm"
                  data-testid="audit-drilldown-error-retry"
                  onClick={() => { void detailQ.refetch(); }}>
            <I.Refresh size={12}/> Retry
          </button>
        </div>
      )}
      {(detailQ.isLoading || detailQ.isPending) && (
        <div className="banner" style={{ margin: 16 }} role="status" aria-busy="true" data-testid="audit-drilldown-loading">
          <span className="banner-icon"><I.Clock size={16}/></span>
          <div className="banner-body">Loading audit detail…</div>
        </div>
      )}
      {auditId && live && auditId !== live.id && (
        <div className="banner warn" style={{ margin: 16 }} data-testid="audit-drilldown-fixture-banner">
          <span className="banner-icon"><I.Info size={16}/></span>
          <div className="banner-body">
            Some fields below come from the seeded fixture (timeline, headers,
            metadata) because the BE doesn't expose them yet.
          </div>
        </div>
      )}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="flex-h" style={{ gap: 24, flexWrap: 'wrap' }}>
          <KvInline label="Server" v={<><span className="mono">{detail.server}</span></>}/>
          <KvInline label="Tool" v={<b className="mono">{detail.tool}</b>}/>
          <KvInline label="Method" v={<span className="mono">{detail.method}</span>}/>
          <KvInline label="Status" v={<span className={`badge mono ${detail.status === 200 ? 'ok' : 'err'}`}>{detail.status}</span>}/>
          <KvInline label="Duration" v={<b className="mono">{fmtDuration(detail.dur)}</b>}/>
          <KvInline label="Tenant" v={detail.tenant}/>
          <KvInline label="Actor" v={<span className="muted">{detail.actor}</span>}/>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 600 }}>
          Request timeline
        </div>
        <div className="timeline-h">
          <div className="tl-track">
            {detail.timeline.map((p, i) => (
              <div key={i} className={`tl-step ${i === detail.timeline.length - 1 ? 'ok' : 'ok'} ${i === 2 ? 'active' : ''}`}>
                <div className="tl-node"/>
                <div className="tl-label">{p.label}</div>
                <div className="tl-time">{fmtTimeMs(p.t).slice(0, 12)}</div>
                {p.dur && <div className="tl-dur">+{p.dur}ms</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tabs" style={{ padding: '0 16px' }}>
        {['request', 'response', 'headers', 'metadata'].map(t => (
          <button key={t}
                  className={`tab ${tab === t ? 'active' : ''}`}
                  onClick={() => setTab(t)}>
            {t === 'request' && <I.ArrowRight size={13}/>}
            {t === 'response' && <I.ArrowLeft size={13}/>}
            {t === 'headers' && <I.FileCode size={13}/>}
            {t === 'metadata' && <I.Info size={13}/>}
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {tab === 'request' && (
          <>
            <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>JSON-RPC 2.0 envelope sent to {detail.server}</p>
            <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(detail.request) }}/>
          </>
        )}
        {tab === 'response' && (
          <>
            <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>Response received in {detail.dur}ms</p>
            <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(detail.response) }}/>
          </>
        )}
        {tab === 'headers' && (
          <dl className="kv">
            {Object.entries(detail.headers).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="mono">{k}</dt>
                <dd className="mono" style={{ fontSize: 11.5, wordBreak: 'break-all' }}>{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}
        {tab === 'metadata' && (
          <dl className="kv">
            <dt>PII flags</dt><dd>
              {detail.meta.pii_flags.length === 0
                ? <span className="badge ok"><span className="dot"/>none detected</span>
                : detail.meta.pii_flags.map(f => <span key={f} className="badge warn">{f}</span>)}
            </dd>
            <dt>CB state before</dt><dd><span className="badge ok mono">{detail.meta.cb_state_before}</span></dd>
            <dt>CB state after</dt><dd><span className="badge ok mono">{detail.meta.cb_state_after}</span></dd>
            <dt>Cache hit</dt><dd>{detail.meta.cache_hit ? 'yes' : 'no'}</dd>
            <dt>Retries</dt><dd className="mono">{detail.meta.retries}</dd>
            <dt>Bytes in / out</dt><dd className="mono">412 B / 1.2 KB</dd>
          </dl>
        )}
      </div>

      <TypeToConfirmModal
        open={showReplay}
        onClose={() => setShowReplay(false)}
        onConfirm={() => {
          toast.push({ kind: 'ok', title: 'Replay started', body: `Re-invoking ${detail.tool} with original arguments…`, action: { label: 'View result', onClick: () => {} } });
        }}
        title={`Replay invocation of ${detail.tool}?`}
        body={`This will re-send the original request to ${detail.server}. The result will appear as a new audit row.`}
        phrase={`replay-${detail.tool}`}
        dangerLabel="Replay invocation"
      />
    </Drawer>
  );
}

function KvInline({ label, v }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 12.5 }}>{v}</div>
    </div>
  );
}

// ============== Circuit breakers ==============
function BreakersPage({ onNav, toast }) {
  const breakersQ = useBreakers();
  const [stateFilter, setStateFilter] = React.useState('all');
  const [resetting, setResetting] = React.useState(null);
  const [tick, setTick] = React.useState(0);

  // Live countdown for the reopens-in display.
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (breakersQ.isLoading || breakersQ.isPending) {
    return (
      <div className="page" role="status" aria-busy="true" data-testid="breakers-loading">
        <div className="page-head">
          <div>
            <h1 className="page-title">Circuit breakers</h1>
            <p className="page-sub">Loading…</p>
          </div>
        </div>
        <div className="cb-grid">
          {[0, 1, 2].map(i => (
            <div key={i} className="cb-card" style={{ opacity: 0.5 }}>
              <div className="cb-head"><Skeleton w="70%" h={14}/></div>
              <Skeleton w="40%" h={12}/>
              <Skeleton w="60%" h={12}/>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (breakersQ.isError) {
    return (
      <div className="page" role="alert" data-testid="breakers-error">
        <EmptyState
          icon={<I.AlertTriangle size={26}/>}
          title="Couldn't load circuit breakers"
          body={breakersQ.error?.message || 'An unexpected error occurred.'}
          action={
            <button type="button" className="btn primary"
                    data-testid="breakers-error-retry"
                    onClick={() => { void breakersQ.refetch(); }}>
              <I.Refresh size={13}/> Retry
            </button>
          }
        />
      </div>
    );
  }

  const breakers = breakersQ.data ?? [];

  // Live breakers may report `half_open` (wire) vs `half` (fixture). Normalise.
  const norm = (state) => state === 'half_open' ? 'half' : state;

  const filtered = breakers.filter(b => stateFilter === 'all' || norm(b.state) === stateFilter);
  const counts = {
    all: breakers.length,
    open: breakers.filter(b => norm(b.state) === 'open').length,
    half: breakers.filter(b => norm(b.state) === 'half').length,
    closed: breakers.filter(b => norm(b.state) === 'closed').length,
  };

  const doReset = () => {
    if (!resetting) return;
    // W4 wires the actual mutation. For now: toast + close (fixture parity).
    toast.push({ kind: 'ok', title: `Breaker reset`, body: `${resetting.server || resetting.server_id || resetting.key} / ${resetting.tool || resetting.tool_name || '—'} — traffic resumed`, action: { label: 'View audit', onClick: () => onNav('audit') } });
    setResetting(null);
  };

  if (breakers.length === 0) {
    return (
      <div className="page" role="status" data-testid="breakers-empty">
        <div className="page-head">
          <div>
            <h1 className="page-title">Circuit breakers</h1>
            <p className="page-sub">No breakers reporting yet.</p>
          </div>
        </div>
        <EmptyState
          icon={<I.Zap size={26}/>}
          title="No circuit breakers"
          body="Once tool invocations start failing, breakers will appear here."
        />
      </div>
    );
  }

  return (
    <div className="page" data-testid="breakers-ready">
      <div className="page-head">
        <div>
          <h1 className="page-title">Circuit breakers</h1>
          <p className="page-sub">{counts.all} breakers · {counts.open} open, {counts.half} half-open, {counts.closed} closed</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => { void breakersQ.refetch(); }}><I.Refresh size={13}/> Refresh</button>
        </div>
      </div>

      <div className="filter-bar">
        {[
          { k: 'all', l: 'All' },
          { k: 'open', l: 'Open', cls: 'err' },
          { k: 'half', l: 'Half-open', cls: 'warn' },
          { k: 'closed', l: 'Closed', cls: 'ok' },
        ].map(f => (
          <span key={f.k}
                className={`chip ${stateFilter === f.k ? 'active' : ''}`}
                onClick={() => setStateFilter(f.k)}>
            {f.cls && <span className={`status-dot ${f.cls}`} style={{ width: 6, height: 6 }}/>}
            {f.l} <span className="count">{counts[f.k]}</span>
          </span>
        ))}
      </div>

      <div className="cb-grid">
        {filtered.map(b => {
          const state = norm(b.state);
          const id = b.key || b.id;
          const serverLabel = b.server || b.server_id || '—';
          const toolLabel = b.tool || b.tool_name || '—';
          const reopens = state === 'open' ? Math.max(0, (b.reopens_in || 0) - tick) : 0;
          return (
            <div key={id} className={`cb-card ${state}`} data-testid={`breakers-card-${id}`}>
              <div className="cb-head">
                <div className="cb-where truncate">
                  {serverLabel}
                  <span className="tertiary"> / </span>
                  {toolLabel}
                </div>
                {state === 'open' && <I.ZapOff size={14} className="tertiary"/>}
                {state === 'half' && <I.Zap size={14} className="tertiary"/>}
                {state === 'closed' && <I.Zap size={14} className="tertiary"/>}
              </div>
              <div className="cb-state-row">
                <div className="cb-state">
                  <span className="cb-state-dot"/>
                  <span>{state === 'half' ? 'HALF-OPEN' : state.toUpperCase()}</span>
                </div>
                {b.failures != null && (
                  <div className={`cb-counts ${b.threshold && b.failures > b.threshold ? 'bad' : ''}`}>
                    {b.failures}{b.threshold != null ? ` / ${b.threshold}` : ''} fails
                  </div>
                )}
              </div>
              {state === 'open' && b.opened_at != null && (
                <div className="cb-meta">
                  <span>Opened: {fmtRelative(typeof b.opened_at === 'number' ? b.opened_at : new Date(b.opened_at).getTime())}</span>
                  {b.reopens_in != null && <span className="cb-reopens">Reopens in {reopens}s</span>}
                </div>
              )}
              <div className="cb-actions">
                <button className="btn sm"
                        onClick={() => setResetting(b)}
                        disabled={state === 'closed'}
                        data-testid={`breakers-reset-${id}`}>
                  <I.Refresh size={11}/> Reset
                </button>
                <button className="btn sm ghost" onClick={() => onNav('audit')}>
                  Audit <I.ArrowRight size={11}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!resetting}
             onClose={() => setResetting(null)}
             title={resetting ? `Reset breaker?` : ''}
             sub={resetting ? `${resetting.server || resetting.server_id || resetting.key} / ${resetting.tool || resetting.tool_name || '—'}` : ''}
             footer={resetting && <>
               <button className="btn" onClick={() => setResetting(null)}>Cancel</button>
               <button className="btn primary" onClick={doReset}><I.Refresh size={13}/>Reset breaker</button>
             </>}>
        <p className="muted" style={{ margin: 0 }}>
          Resetting the breaker allows traffic to resume immediately. If the upstream is still failing, the breaker will trip again on the next failure threshold.
        </p>
      </Modal>
    </div>
  );
}

export { AuditPage, AuditDrilldown, BreakersPage };
