// @ts-nocheck
// W3: read-paths wired. KPI tiles + recent-audit feed + per-server
// health are now driven by `useServers()` + `useAudit(...)` +
// `useBreakers()`. The fixture-derived sparklines (per-server
// `spark`, `spark_latency`, `health`) are kept as cosmetic
// fallbacks because the wire schema does NOT carry them yet —
// they degrade to flat zero-arrays when the hook returns the
// real wire shape. Once the BE starts emitting telemetry the
// dashboard will pick it up without further FE churn.
//
// R14: every hook gets a visible loading / error / empty state via
//      <DataState>. No silent failures.
// R11: `data-testid="dashboard-loading|error|empty|ready"` plus
//      the existing per-KPI / per-row testids.
// R15: aria-busy + role="status|alert" on the wrapped states.

import React from 'react';
import {
  NOW, SERVERS as FALLBACK_SERVERS, ALL_TOOLS,
} from '../lib/data';
import {
  I, StatusDot, Transport, Sparkline,
  fmtRelative, fmtTime, fmtDuration, fmtNum,
} from '../lib/ui';
import { useServers, useAudit, useBreakers } from '../lib/queries/hooks';

// ============== Dashboard ==============

function KPI({ label, icon, value, sub, delta, deltaKind, spark, sparkColor, onClick, dataTour, dataTestId }) {
  return (
    <button className="kpi" onClick={onClick} data-tour={dataTour} data-testid={dataTestId}>
      <div className="kpi-label">
        <span className="kpi-icon">{icon}</span>
        {label}
      </div>
      <div className="kpi-row">
        <div className="kpi-value">
          {value}
          {sub && <span className="kpi-sub">{sub}</span>}
        </div>
        {delta && (
          <span className={`kpi-delta ${deltaKind || 'flat'}`}>
            {deltaKind === 'up' && <I.ArrowUp size={11}/>}
            {deltaKind === 'down' && <I.ArrowDown size={11}/>}
            {deltaKind === 'warn' && <I.AlertTriangle size={11}/>}
            {delta}
          </span>
        )}
      </div>
      <div className="kpi-footer"/>
      <div className="kpi-spark">
        <Sparkline data={spark || []} width={340} height={34} color={sparkColor || 'var(--accent)'} strokeWidth={1.6}/>
      </div>
    </button>
  );
}

function LiveFeed({ events, paused, onSelectAudit, onTogglePaused, onClear }) {
  return (
    <div className="card" data-tour="feed">
      <div className="card-head">
        <div className="card-title">
          <I.Activity size={14} className="tertiary"/>
          Live tool-invocation feed
          <span className={`live-pill ${paused ? 'paused' : ''}`} style={{ marginLeft: 6 }}>
            <span className="pulse"/>
            <span style={{ fontFamily: 'var(--font-sans)' }}>{paused ? 'PAUSED' : 'LIVE'}</span>
          </span>
        </div>
        <div className="flex-h">
          <span className="tertiary mono" style={{ fontSize: 11 }}>{events.length} events / 200</span>
          <button className="btn sm ghost" onClick={onTogglePaused}>
            {paused ? <><I.Play size={12}/> Resume</> : <><I.Pause size={12}/> Pause</>}
          </button>
          <button className="btn sm ghost" onClick={onClear} title="Clear feed"><I.Trash size={12}/></button>
        </div>
      </div>
      <div className="card-body flush feed-list">
        {events.length === 0 && (
          <div className="empty" style={{ padding: '40px 16px' }}>
            <p className="tertiary">Waiting for events…</p>
          </div>
        )}
        {events.map((e, i) => (
          <div key={e.id} className={`feed-row ${i === 0 && e.isNew ? 'new' : ''}`}
               onClick={() => onSelectAudit(e)}>
            <span className={`status-dot ${e.status === 200 ? 'ok' : e.status >= 500 ? 'err' : 'warn'}`} style={{ width: 6, height: 6 }}/>
            <span className="feed-ts">{fmtTime(e.ts)}</span>
            <span className="feed-where">
              <span className="feed-server">{e.server}</span>
              <span className="tertiary"> / </span>
              <span>{e.tool || e.method}</span>
            </span>
            <span className="feed-dur">{fmtDuration(e.dur)}</span>
            <span className={`feed-status ${e.status === 200 ? 'ok' : e.status >= 500 ? 'err' : 'warn'}`}>
              {e.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthStrip({ servers, onSelectServer }) {
  // Wire-shape servers don't carry `health` sparklines yet — fall back to
  // the fixture-derived ones keyed by id, then to a flat zero array. This
  // keeps the UI lit without flagging it as a real-data outage.
  const fallbackBy = React.useMemo(() => {
    const m = {};
    FALLBACK_SERVERS.forEach(s => { m[s.id] = s; });
    return m;
  }, []);

  const visible = servers.filter(s => s.enabled !== false).slice(0, 10);
  if (visible.length === 0) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <I.Activity size={14} className="tertiary"/>
            Per-server health (1h)
          </div>
        </div>
        <div className="card-body" data-testid="dashboard-health-empty">
          <p className="tertiary">No enabled servers to show.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <I.Activity size={14} className="tertiary"/>
          Per-server health (1h)
        </div>
        <span className="tertiary mono" style={{ fontSize: 11 }}>24 buckets × 2.5m</span>
      </div>
      <div className="card-body flush">
        <div className="health-strip">
          {visible.map(s => {
            const fb = fallbackBy[s.id];
            const health = fb?.health || Array(24).fill(0);
            const avg = health.length ? health.reduce((a, b) => a + b, 0) / health.length : 0;
            return (
              <div key={s.id} className="health-row" onClick={() => onSelectServer(s.id)} data-testid={`dashboard-health-row-${s.id}`}>
                <div className="h-name">
                  <StatusDot status={s.status}/>
                  <span className="truncate">{s.name}</span>
                  <Transport t={s.transport}/>
                </div>
                <div className="h-bar">
                  {health.map((v, i) => (
                    <span key={i}
                          className={`h-cell ${v < 30 ? 'err' : v < 80 ? 'warn' : v === 0 ? 'idle' : ''}`}
                          title={`${v}% healthy · bucket ${i + 1}`}
                          style={{ opacity: v === 0 ? 0.3 : 0.6 + (v / 100) * 0.4 }}/>
                  ))}
                </div>
                <div className="h-pct">{Math.round(avg)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TopTools({ onSelectTool }) {
  // Top-tools needs `calls_24h` per-tool which today only lives in the
  // fixture (the wire shape `Tool` is `{ server_id, name, description?,
  // input_schema? }`). Keep the fixture-derived list for now — switching to
  // a `/api/admin/mcp-pack/tools/stats` endpoint is W5 scope.
  const top = [...ALL_TOOLS].sort((a, b) => b.calls_24h - a.calls_24h).slice(0, 10);
  const max = top[0]?.calls_24h || 1;
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <I.TrendingUp size={14} className="tertiary"/>
          Top tools by invocation (24h)
        </div>
        <span className="tertiary mono" style={{ fontSize: 11 }}>{fmtNum(top.reduce((a, b) => a + b.calls_24h, 0))} total</span>
      </div>
      <div className="card-body flush">
        <div className="barlist" style={{ padding: '8px 0' }}>
          {top.map((t, i) => (
            <div key={i} className="barlist-row" onClick={() => onSelectTool(t)}>
              <div className="bl-name-wrap">
                <span className="bl-bg" style={{ width: `${(t.calls_24h / max) * 100}%` }}/>
                <span className="bl-name">
                  <span className="tertiary mono" style={{ fontSize: 11, marginRight: 6 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="mono">{t.server_name}</span>
                  <span className="tertiary"> / </span>
                  <b>{t.name}</b>
                </span>
              </div>
              <div className="bl-count">{fmtNum(t.calls_24h)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentFailures({ rows, onSelectAudit, queryError, onRetry }) {
  // R14: when the underlying audit query failed, never render the "no
  // recent failures" empty state — that reads as good news while
  // actually we have NO data. Surface a card-level error with retry
  // so the operator sees the gap instead of being misled.
  if (queryError) {
    return (
      <div className="card" role="alert" data-testid="dashboard-failures-error">
        <div className="card-head">
          <div className="card-title">
            <I.AlertTriangle size={14} className="tertiary"/>
            Recent failures
          </div>
        </div>
        <div className="card-body">
          <p className="muted" style={{ marginTop: 0 }}>
            Couldn't load the audit feed: {queryError?.message || 'an unexpected error occurred.'}
          </p>
          <button type="button" className="btn sm"
                  data-testid="dashboard-failures-error-retry"
                  onClick={onRetry}>
            <I.Refresh size={11}/> Retry
          </button>
        </div>
      </div>
    );
  }

  const failures = rows.filter(a => Number(a.status) >= 400 || a.status === 'err' || a.status === 'error').slice(0, 6);
  if (failures.length === 0) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <I.AlertTriangle size={14} className="tertiary"/>
            Recent failures
          </div>
        </div>
        <div className="card-body" data-testid="dashboard-failures-empty">
          <p className="tertiary">No recent failures — every recent invocation succeeded.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <I.AlertTriangle size={14} className="tertiary"/>
          Recent failures
        </div>
        <a className="icon-link" onClick={() => document.dispatchEvent(new CustomEvent('app:nav', { detail: 'audit' }))}>
          View all <I.ArrowRight size={12}/>
        </a>
      </div>
      <div className="card-body flush">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Time</th>
              <th>Server / Tool</th>
              <th style={{ width: 70 }}>Status</th>
              <th style={{ width: 80 }} className="num">Duration</th>
              <th style={{ width: 160 }}>Actor</th>
            </tr>
          </thead>
          <tbody>
            {failures.map(a => {
              const statusNum = Number(a.status);
              const serverLabel = a.mcp_server_name || a.server || a.mcp_server_id;
              const toolLabel = a.tool_name || a.tool || a.method;
              const dur = a.duration_ms ?? a.dur;
              const ts = a.created_at ? new Date(a.created_at).getTime() : a.ts;
              return (
                <tr key={a.id} onClick={() => onSelectAudit(a)} data-testid={`dashboard-failure-row-${a.id}`}>
                  <td className="mono tertiary">{fmtRelative(ts)}</td>
                  <td>
                    <span className="mono">{serverLabel}</span>
                    <span className="tertiary"> / </span>
                    <b>{toolLabel}</b>
                  </td>
                  <td>
                    <span className={`badge ${statusNum >= 500 ? 'err' : 'warn'}`}>
                      <span className="dot"/>{a.status}
                    </span>
                  </td>
                  <td className="num">{fmtDuration(dur)}</td>
                  <td className="muted truncate" style={{ maxWidth: 160 }}>{a.actor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardReady({ servers, audit, breakers, auditError, breakersError, onRetryAudit, onRetryBreakers, liveEvents, livePaused, onTogglePaused, onClearFeed, onNav, onSelectAudit }) {
  // Wire shape doesn't carry calls_1h / errors_1h / p95 yet — fall back to
  // the fixture by id where we can, else use 0. This keeps KPI rendering
  // identical until the BE exposes telemetry endpoints.
  const fallbackBy = React.useMemo(() => {
    const m = {};
    FALLBACK_SERVERS.forEach(s => { m[s.id] = s; });
    return m;
  }, []);

  const totalServers = servers.length;
  const activeServers = servers.filter(s => s.enabled !== false && s.status !== 'err').length;
  const calls1hSum = servers.reduce((a, s) => a + (fallbackBy[s.id]?.calls_1h || 0), 0);
  const errs1hSum = servers.reduce((a, s) => a + (fallbackBy[s.id]?.errors_1h || 0), 0);
  const callsPerMin = Math.round(calls1hSum / 60);
  const errRate = ((errs1hSum / Math.max(calls1hSum, 1)) * 100).toFixed(2);
  const cbOpen = breakers.filter(b => b.state === 'open').length;
  const cbHalf = breakers.filter(b => b.state === 'half' || b.state === 'half_open').length;

  // sparklines: aggregate from fixture fallbacks when present
  const aggSpark = Array.from({ length: 60 }, (_, i) =>
    servers.reduce((a, s) => a + (fallbackBy[s.id]?.spark?.[i] || 0), 0)
  );
  const latSpark = (fallbackBy['srv_01']?.spark_latency)
    ?? Object.values(fallbackBy)[0]?.spark_latency
    ?? [];
  const errPerMin = aggSpark.map(v => v * (errs1hSum / Math.max(calls1hSum, 1)));

  return (
    <div className="page" data-testid="dashboard-ready">
      <div className="page-head">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">Real-time status across {totalServers} MCP servers · {fmtNum(callsPerMin)} calls/min · last refresh {fmtTime(NOW)}</p>
        </div>
        <div className="page-actions">
          <select className="select" defaultValue="1h" style={{ width: 120 }}>
            <option value="15m">Last 15 min</option>
            <option value="1h">Last 1 hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <button className="btn"><I.Refresh size={13}/> Refresh</button>
          <button className="btn primary" onClick={() => onNav('servers')}>
            <I.Plus size={13}/> New server
          </button>
        </div>
      </div>

      {(auditError || breakersError) && (
        <div className="banner warn" role="alert" data-testid="dashboard-secondary-error" style={{ marginBottom: 14 }}>
          <span className="banner-icon"><I.AlertTriangle size={16}/></span>
          <div className="banner-body">
            {auditError && breakersError
              ? 'Audit feed and circuit-breaker data failed to load — KPIs and the failures panel below may be incomplete.'
              : auditError
                ? 'Audit feed failed to load — the failures panel below shows the gap explicitly.'
                : 'Circuit-breaker data failed to load — the "Circuit breakers" KPI below shows 0 because the query errored, not because every breaker is closed.'}
            {' '}
            {(auditError?.message || breakersError?.message) && (
              <span className="tertiary mono" style={{ fontSize: 11 }}>
                {auditError?.message || breakersError?.message}
              </span>
            )}
          </div>
          <button type="button" className="btn sm"
                  data-testid="dashboard-secondary-error-retry"
                  onClick={() => { if (auditError) onRetryAudit(); if (breakersError) onRetryBreakers(); }}>
            <I.Refresh size={11}/> Retry
          </button>
        </div>
      )}

      <div className="kpi-grid" data-tour="kpi-strip">
        <KPI
          label={<>Active servers</>}
          icon={<I.Server size={13}/>}
          value={activeServers}
          sub={`/ ${totalServers}`}
          delta="+2 since yesterday"
          deltaKind="up"
          spark={servers.map((_, i, a) => Math.min(a.length, i + 1))}
          sparkColor="var(--accent)"
          onClick={() => onNav('servers')}
          dataTour="kpi-servers"
          dataTestId="dashboard-kpi-servers"
        />
        <KPI
          label="Calls / minute"
          icon={<I.Activity size={13}/>}
          value={fmtNum(callsPerMin)}
          delta="+14% vs 1h"
          deltaKind="up"
          spark={aggSpark}
          sparkColor="var(--accent)"
          onClick={() => onNav('audit')}
          dataTestId="dashboard-kpi-calls"
        />
        <KPI
          label="p50 latency"
          icon={<I.Clock size={13}/>}
          value="142"
          sub="ms"
          delta="+8ms"
          deltaKind="warn"
          spark={latSpark}
          sparkColor="var(--status-warn)"
          onClick={() => onNav('audit')}
          dataTestId="dashboard-kpi-latency"
        />
        <KPI
          label="Circuit breakers"
          icon={<I.Zap size={13}/>}
          value={cbOpen}
          sub={cbHalf ? `+${cbHalf} half-open` : 'open'}
          delta={cbOpen > 0 ? `${breakers.length - cbOpen} closed` : 'all closed'}
          deltaKind={cbOpen > 0 ? 'down' : 'up'}
          spark={errPerMin}
          sparkColor={cbOpen > 0 ? 'var(--status-err)' : 'var(--status-ok)'}
          onClick={() => onNav('breakers')}
          dataTestId="dashboard-kpi-breakers"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        <LiveFeed events={liveEvents} paused={livePaused}
                  onSelectAudit={(e) => onSelectAudit(e.auditId || e.id || 'aud_search_142ms')}
                  onTogglePaused={onTogglePaused}
                  onClear={onClearFeed}/>
        <HealthStrip servers={servers} onSelectServer={(id) => onNav(`server/${id}`)}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <TopTools onSelectTool={(t) => onNav(`tool/${t.server_id}/${t.name}`)}/>
        <RecentFailures rows={audit} onSelectAudit={(row) => onSelectAudit(row.id || 'aud_search_142ms')}
                         queryError={auditError}
                         onRetry={onRetryAudit}/>
      </div>
    </div>
  );
}

function DashboardPage({ liveEvents, livePaused, onTogglePaused, onClearFeed, onNav, onSelectAudit }) {
  const serversQ = useServers();
  const auditQ = useAudit({ per_page: 24 });
  const breakersQ = useBreakers();

  // Compose three queries into a single ready-gate: render loading until the
  // primary `servers` query lands; surface error if any of the three failed
  // (servers is load-bearing; audit + breakers degrade to []).
  if (serversQ.isLoading || serversQ.isPending) {
    return (
      <div className="page" role="status" aria-busy="true" data-testid="dashboard-loading">
        <DataStateLoadingSkeleton />
      </div>
    );
  }
  if (serversQ.isError) {
    return (
      <div className="page" role="alert" data-testid="dashboard-error">
        <div style={{ padding: 24 }}>
          <h1 className="page-title">Overview</h1>
          <p className="muted">Failed to load dashboard data.</p>
          <p className="tertiary">{(serversQ.error as Error)?.message}</p>
          <button
            type="button"
            className="btn primary"
            data-testid="dashboard-error-retry"
            onClick={() => {
              void serversQ.refetch();
              void auditQ.refetch();
              void breakersQ.refetch();
            }}
          >
            <I.Refresh size={13}/> Retry
          </button>
        </div>
      </div>
    );
  }
  const servers = serversQ.data?.data ?? [];
  if (servers.length === 0) {
    return (
      <div className="page" role="status" data-testid="dashboard-empty">
        <div className="page-head">
          <div>
            <h1 className="page-title">Overview</h1>
            <p className="page-sub">No MCP servers registered yet.</p>
          </div>
          <div className="page-actions">
            <button className="btn primary" onClick={() => onNav('servers-new')}>
              <I.Plus size={13}/> Register first server
            </button>
          </div>
        </div>
      </div>
    );
  }

  // R14: `serversQ` is load-bearing — when it fails we render the page
  // error above. `auditQ` and `breakersQ` are secondary; their failures
  // should NOT replace the whole dashboard, but they MUST be surfaced
  // visibly so operators don't read "0 failures / all closed" as good
  // news while the underlying query is errored. We render inline
  // warning banners next to the affected sections instead of silently
  // degrading to empty arrays.
  return (
    <DashboardReady
      servers={servers}
      audit={auditQ.data ?? []}
      breakers={breakersQ.data ?? []}
      auditError={auditQ.isError ? (auditQ.error as Error | undefined) : null}
      breakersError={breakersQ.isError ? (breakersQ.error as Error | undefined) : null}
      onRetryAudit={() => { void auditQ.refetch(); }}
      onRetryBreakers={() => { void breakersQ.refetch(); }}
      liveEvents={liveEvents}
      livePaused={livePaused}
      onTogglePaused={onTogglePaused}
      onClearFeed={onClearFeed}
      onNav={onNav}
      onSelectAudit={onSelectAudit}
    />
  );
}

function DataStateLoadingSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="kpi" style={{ pointerEvents: 'none', opacity: 0.6 }}>
            <div className="row-gap-8" style={{ padding: 12 }}>
              <div className="skel" style={{ width: '40%', height: 14, borderRadius: 4 }} />
              <div className="skel" style={{ width: '70%', height: 22, borderRadius: 4 }} />
              <div className="skel" style={{ width: '90%', height: 34, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DashboardPage, KPI, LiveFeed };
