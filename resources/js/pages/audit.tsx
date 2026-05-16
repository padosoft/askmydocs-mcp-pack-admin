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

// ============== Audit log + drilldown drawer ==============

function AuditPage({ onNav, onOpenAudit, initialAuditId }) {
  const [filters, setFilters] = React.useState({
    range: '1h',
    tenant: 'all', server: 'all', tool: 'all', status: 'all', actor: 'all',
    q: '',
  });
  const [saved, setSaved] = React.useState(false);

  const filtered = AUDIT.filter(a => {
    if (filters.tenant !== 'all' && a.tenant !== filters.tenant) return false;
    if (filters.server !== 'all' && a.server_id !== filters.server) return false;
    if (filters.tool !== 'all' && a.tool !== filters.tool) return false;
    if (filters.status === 'success' && a.status >= 400) return false;
    if (filters.status === 'client_error' && (a.status < 400 || a.status >= 500)) return false;
    if (filters.status === 'server_error' && a.status < 500) return false;
    if (filters.q && !a.id.includes(filters.q) && !(a.tool || '').includes(filters.q) && !a.server.includes(filters.q)) return false;
    return true;
  });

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== 'all' && v !== '' && k !== 'range').length;

  const clearFilters = () => setFilters({ range: '1h', tenant: 'all', server: 'all', tool: 'all', status: 'all', actor: 'all', q: '' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Audit log</h1>
          <p className="page-sub">{fmtNum(filtered.length)} of {fmtNum(AUDIT.length)} rows · last {filters.range} window</p>
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
                    onChange={e => setFilters({ ...filters, server: e.target.value })}>
              <option value="all">All servers</option>
              {SERVERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
              {filtered.slice(0, 80).map(a => (
                <tr key={a.id} onClick={() => onOpenAudit(a.id)}>
                  <td><StatusDot status={a.status === 200 ? 'ok' : a.status >= 500 ? 'err' : 'warn'}/></td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{fmtDateTime(a.ts).slice(11, 19)}<span className="tertiary"> · {fmtRelative(a.ts)}</span></td>
                  <td className="muted mono" style={{ fontSize: 11.5 }}>{a.tenant}</td>
                  <td><b className="mono" style={{ fontSize: 12 }}>{a.server}</b></td>
                  <td>
                    <span className="mono tertiary" style={{ fontSize: 11.5 }}>{a.method}</span>
                    {a.tool && <span className="tertiary"> · </span>}
                    {a.tool && <b className="mono">{a.tool}</b>}
                  </td>
                  <td className="num">
                    <span style={{ color: a.dur > 2000 ? 'var(--status-err)' : a.dur > 800 ? 'var(--status-warn)' : 'inherit' }}>
                      {fmtDuration(a.dur)}
                    </span>
                  </td>
                  <td><span className={`badge mono ${a.status === 200 ? 'ok' : a.status >= 500 ? 'err' : 'warn'}`}>{a.status}</span></td>
                  <td className="muted truncate" style={{ maxWidth: 170 }}>{a.actor}</td>
                  <td><span className="id-link">{a.id.slice(0, 12)}…</span></td>
                </tr>
              ))}
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

// Audit drilldown drawer content
function AuditDrilldown({ auditId, onClose, toast }) {
  const [tab, setTab] = React.useState('request');
  // For demo, we re-use the rich AUDIT_DETAIL regardless of auditId
  const detail = AUDIT_DETAIL;
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
  const [stateFilter, setStateFilter] = React.useState('all');
  const [breakers, setBreakers] = React.useState(BREAKERS);
  const [resetting, setResetting] = React.useState(null);
  const [transitioning, setTransitioning] = React.useState({});
  const [tick, setTick] = React.useState(0);

  // Live countdown
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-transition: half-open after 60s, open after random failure
  React.useEffect(() => {
    // After 4s, transition a half-open to closed for demo
    const t1 = setTimeout(() => {
      setBreakers(prev => prev.map(b => {
        if (b.id === 'cb_03') return { ...b, state: 'closed', failures: 0 };
        return b;
      }));
      setTransitioning(t => ({ ...t, cb_03: true }));
      setTimeout(() => setTransitioning(t => ({ ...t, cb_03: false })), 800);
    }, 6000);
    return () => clearTimeout(t1);
  }, []);

  const filtered = breakers.filter(b => stateFilter === 'all' || b.state === stateFilter);
  const counts = {
    all: breakers.length,
    open: breakers.filter(b => b.state === 'open').length,
    half: breakers.filter(b => b.state === 'half').length,
    closed: breakers.filter(b => b.state === 'closed').length,
  };

  const doReset = () => {
    if (!resetting) return;
    const id = resetting.id;
    setTransitioning(t => ({ ...t, [id]: true }));
    setBreakers(prev => prev.map(b => b.id === id ? { ...b, state: 'closed', failures: 0, reopens_in: 0 } : b));
    setTimeout(() => setTransitioning(t => ({ ...t, [id]: false })), 800);
    toast.push({ kind: 'ok', title: `Breaker reset`, body: `${resetting.server} / ${resetting.tool} — traffic resumed`, action: { label: 'View audit', onClick: () => onNav('audit') } });
    setResetting(null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Circuit breakers</h1>
          <p className="page-sub">{counts.all} breakers across {SERVERS.length} servers · {counts.open} open, {counts.half} half-open, {counts.closed} closed</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Refresh size={13}/> Refresh</button>
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
          const reopens = b.state === 'open' ? Math.max(0, b.reopens_in - tick) : 0;
          return (
            <div key={b.id} className={`cb-card ${b.state} ${transitioning[b.id] ? 'transitioning' : ''}`}>
              <div className="cb-head">
                <div className="cb-where truncate">
                  {b.server}
                  <span className="tertiary"> / </span>
                  {b.tool}
                </div>
                {b.state === 'open' && <I.ZapOff size={14} className="tertiary"/>}
                {b.state === 'half' && <I.Zap size={14} className="tertiary"/>}
                {b.state === 'closed' && <I.Zap size={14} className="tertiary"/>}
              </div>
              <div className="cb-tenant">tenant: {b.tenant}</div>
              <div className="cb-state-row">
                <div className="cb-state">
                  <span className="cb-state-dot"/>
                  <span>{b.state === 'half' ? 'HALF-OPEN' : b.state.toUpperCase()}</span>
                </div>
                <div className={`cb-counts ${b.failures > b.threshold ? 'bad' : ''}`}>
                  {b.failures} / {b.threshold} fails
                </div>
              </div>
              {b.state === 'open' && (
                <div className="cb-meta">
                  <span>Last fail: {fmtDuration(b.last_failure_ago * 1000).replace('ms', 's ago')}</span>
                  <span className="cb-reopens">Reopens in {reopens}s</span>
                </div>
              )}
              {b.state !== 'open' && (
                <div className="cb-meta">
                  <span className="truncate" style={{ maxWidth: 180 }}>
                    Last fail: {b.last_failure_ago > 0 ? fmtDuration(b.last_failure_ago * 1000).replace('ms', '') + ' ago' : '—'}
                  </span>
                </div>
              )}
              <div className="cb-actions">
                <button className="btn sm" onClick={() => setResetting(b)} disabled={b.state === 'closed'}>
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
             sub={resetting ? `${resetting.server} / ${resetting.tool}` : ''}
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
