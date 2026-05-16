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

// ============== Dashboard ==============

function KPI({ label, icon, value, sub, delta, deltaKind, spark, sparkColor, onClick, dataTour }) {
  return (
    <button className="kpi" onClick={onClick} data-tour={dataTour}>
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
        <Sparkline data={spark} width={340} height={34} color={sparkColor || 'var(--accent)'} strokeWidth={1.6}/>
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

function HealthStrip({ onSelectServer }) {
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
          {SERVERS.filter(s => s.enabled).slice(0, 10).map(s => {
            const health = s.health;
            const avg = health.reduce((a, b) => a + b, 0) / health.length;
            return (
              <div key={s.id} className="health-row" onClick={() => onSelectServer(s.id)}>
                <div className="h-name">
                  <StatusDot status={s.status} size={6}/>
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
  // top 10 tools by calls_24h across servers
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

function RecentFailures({ onSelectAudit }) {
  const failures = AUDIT.filter(a => a.status >= 400).slice(0, 6);
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
            {failures.map(a => (
              <tr key={a.id} onClick={() => onSelectAudit(a)}>
                <td className="mono tertiary">{fmtRelative(a.ts)}</td>
                <td>
                  <span className="mono">{a.server}</span>
                  <span className="tertiary"> / </span>
                  <b>{a.tool || a.method}</b>
                </td>
                <td>
                  <span className={`badge ${a.status >= 500 ? 'err' : 'warn'}`}>
                    <span className="dot"/>{a.status}
                  </span>
                </td>
                <td className="num">{fmtDuration(a.dur)}</td>
                <td className="muted truncate" style={{ maxWidth: 160 }}>{a.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardPage({ liveEvents, livePaused, onTogglePaused, onClearFeed, onNav, onSelectAudit }) {
  const totalServers = SERVERS.length;
  const activeServers = SERVERS.filter(s => s.enabled && s.status !== 'err').length;
  const callsPerMin = Math.round(SERVERS.reduce((a, s) => a + s.calls_1h, 0) / 60);
  const totalErrs = SERVERS.reduce((a, s) => a + s.errors_1h, 0);
  const totalCalls = SERVERS.reduce((a, s) => a + s.calls_1h, 0);
  const errRate = ((totalErrs / Math.max(totalCalls, 1)) * 100).toFixed(2);
  const cbOpen = BREAKERS.filter(b => b.state === 'open').length;
  const cbHalf = BREAKERS.filter(b => b.state === 'half').length;
  // sum sparks across servers
  const aggSpark = Array.from({ length: 60 }, (_, i) =>
    SERVERS.reduce((a, s) => a + (s.spark[i] || 0), 0)
  );
  const latSpark = SERVERS.find(s => s.id === 'srv_01').spark_latency;
  const errPerMin = SERVERS[0].spark.map((_, i) =>
    SERVERS.reduce((a, s) => a + (s.status === 'err' || s.status === 'warn' ? s.spark[i] * 0.05 : 0), 0)
  );

  return (
    <div className="page">
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

      <div className="kpi-grid" data-tour="kpi-strip">
        <KPI
          label={<>Active servers</>}
          icon={<I.Server size={13}/>}
          value={activeServers}
          sub={`/ ${totalServers}`}
          delta="+2 since yesterday"
          deltaKind="up"
          spark={SERVERS.map(s => s.enabled ? 1 : 0).map((_, i, a) => a.slice(Math.max(0, i - 5), i + 1).reduce((x, y) => x + y, 0))}
          sparkColor="var(--accent)"
          onClick={() => onNav('servers')}
          dataTour="kpi-servers"
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
        />
        <KPI
          label="Circuit breakers"
          icon={<I.Zap size={13}/>}
          value={cbOpen}
          sub={cbHalf ? `+${cbHalf} half-open` : 'open'}
          delta={cbOpen > 0 ? `${BREAKERS.length - cbOpen} closed` : 'all closed'}
          deltaKind={cbOpen > 0 ? 'down' : 'up'}
          spark={errPerMin}
          sparkColor={cbOpen > 0 ? 'var(--status-err)' : 'var(--status-ok)'}
          onClick={() => onNav('breakers')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        <LiveFeed events={liveEvents} paused={livePaused}
                  onSelectAudit={(e) => onSelectAudit(e.auditId || 'aud_search_142ms')}
                  onTogglePaused={onTogglePaused}
                  onClear={onClearFeed}/>
        <HealthStrip onSelectServer={(id) => onNav(`server/${id}`)}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <TopTools onSelectTool={(t) => onNav(`tool/${t.server_id}/${t.name}`)}/>
        <RecentFailures onSelectAudit={() => onSelectAudit('aud_search_142ms')}/>
      </div>
    </div>
  );
}

export { DashboardPage, KPI, LiveFeed };
