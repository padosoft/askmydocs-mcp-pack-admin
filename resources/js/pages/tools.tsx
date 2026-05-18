// @ts-nocheck
// W3: read-paths wired. `ToolsPage` is now hook-backed via `useTools()`
// (flat aggregator across every registered server) for the sidebar tree,
// and `useServers()` for grouping. When `initialTool` is passed in (the
// router for `/tool/:server_id/:name`) we additionally pull the per-server
// tool list to enrich the detail pane.
//
// The fixture `ALL_TOOLS` is retained ONLY as a fallback shape adapter so
// pre-existing UI bits like `calls_24h` / `p50` / `destructive` flags
// degrade gracefully when the wire schema doesn't carry them.
// `ToolPlayground` (try-it) remains fixture-only — it's a write path
// scheduled for W4.

import React from 'react';
import {
  SERVERS as FALLBACK_SERVERS, ALL_TOOLS as FALLBACK_ALL_TOOLS,
} from '../lib/data';
import {
  Icon, I, StatusDot, Transport, Sparkline,
  fmtRelative, fmtTime, fmtTimeMs, fmtDateTime, fmtDuration, fmtBytes, fmtNum,
  jsonHighlight, useToast, Modal, Drawer, TypeToConfirmModal,
  Kbd, Skeleton, Tabs, EmptyState,
} from '../lib/ui';
import { Breadcrumbs, ROUTES, SECONDARY } from '../components/shell';
import { useTools, useServers, useAudit } from '../lib/queries/hooks';
import { DataState } from '../lib/data-state';

// ============== Tools explorer + Try-it playground ==============

function ToolsPage({ onNav, toast, initialTool }) {
  const toolsQ = useTools();
  const serversQ = useServers();
  const [selected, setSelected] = React.useState(initialTool || null);
  const [serverFilter, setServerFilter] = React.useState('all');
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    if (initialTool) setSelected(initialTool);
  }, [initialTool?.server_id, initialTool?.name]);

  const liveTools = toolsQ.data ?? [];
  const liveServers = serversQ.data?.data ?? [];

  // Initial-selection bootstrap when no `initialTool` prop AND the live
  // tool list lands. Pick the first tool so the detail pane isn't empty.
  React.useEffect(() => {
    if (!selected && liveTools.length > 0) {
      setSelected({ server_id: liveTools[0].server_id, name: liveTools[0].name });
    }
  }, [selected, liveTools.length]);

  if (toolsQ.isLoading || toolsQ.isPending || serversQ.isLoading || serversQ.isPending) {
    return (
      <div className="page" role="status" aria-busy="true" data-testid="tools-loading">
        <div style={{ padding: 24 }}>
          <Skeleton w="30%" h={22}/>
          <div style={{ height: 16 }}/>
          <Skeleton w="100%" h={14}/>
          <Skeleton w="90%" h={14}/>
          <Skeleton w="80%" h={14}/>
        </div>
      </div>
    );
  }
  if (toolsQ.isError) {
    return (
      <div className="page" role="alert" data-testid="tools-error">
        <EmptyState
          icon={<I.AlertTriangle size={26}/>}
          title="Couldn't load tools"
          body={toolsQ.error?.message || 'An unexpected error occurred.'}
          action={
            <button type="button" className="btn primary"
                    data-testid="tools-error-retry"
                    onClick={() => { void toolsQ.refetch(); }}>
              <I.Refresh size={13}/> Retry
            </button>
          }
        />
      </div>
    );
  }

  if (liveTools.length === 0) {
    return (
      <div className="page" role="status" data-testid="tools-empty">
        <EmptyState
          icon={<I.Wrench size={26}/>}
          title="No tools yet"
          body="Register an MCP server and run a handshake to discover tools."
          action={<button className="btn primary" onClick={() => onNav('servers')}><I.Server size={12}/>Open servers</button>}
        />
      </div>
    );
  }

  // Build server -> tools grouping from live data, falling back to fixture
  // metadata where present.
  const serverById = {};
  liveServers.forEach(s => { serverById[s.id] = s; });
  FALLBACK_SERVERS.forEach(s => { if (!serverById[s.id]) serverById[s.id] = s; });

  const grouped = Object.values(serverById)
    .filter(s => serverFilter === 'all' || (serverFilter === 'active' && s.enabled !== false && s.status !== 'err')
      || (serverFilter === 'err' && s.status === 'err'))
    .map(s => ({
      server: s,
      tools: liveTools
        .filter(t => t.server_id === s.id)
        .filter(t => !q || t.name.toLowerCase().includes(q.toLowerCase()) || (s.name || '').toLowerCase().includes(q.toLowerCase())),
    }))
    .filter(g => g.tools.length);

  // Resolve selected tool — first try live, then fixture for visual fields.
  const sel = selected && (
    liveTools.find(t => t.server_id === selected.server_id && t.name === selected.name)
    ?? FALLBACK_ALL_TOOLS.find(t => t.server_id === selected.server_id && t.name === selected.name)
  );

  return (
    <div className="page full" style={{ padding: 0, maxWidth: 'none' }} data-testid="tools-ready">
      <div style={{
        display: 'grid', gridTemplateColumns: '260px 1fr',
        height: 'calc(100vh - var(--topbar-h))',
        background: 'var(--border)',
        gap: 1,
      }}>
        <div style={{ background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
            <div className="search-input" style={{ maxWidth: 'none' }}>
              <I.Search size={13} className="search-icon"/>
              <input className="input" placeholder="Search tools…"
                     value={q} onChange={e => setQ(e.target.value)}
                     data-testid="tools-search-input"
                     aria-label="Search tools"/>
            </div>
            <div className="filter-bar" style={{ margin: '8px 0 0', gap: 4 }}>
              {[
                { k: 'all', l: 'All' },
                { k: 'active', l: 'Active' },
                { k: 'err', l: 'Errored' },
              ].map(f => (
                <span key={f.k}
                      className={`chip ${serverFilter === f.k ? 'active' : ''}`}
                      style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={() => setServerFilter(f.k)}>
                  {f.l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ overflow: 'auto', flex: 1, padding: 6 }}>
            {grouped.map(g => (
              <ToolGroup key={g.server.id} server={g.server} tools={g.tools}
                         selected={selected} onSelect={setSelected}/>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--bg)', overflow: 'auto' }}>
          {sel ? <ToolDetailPane tool={sel} toast={toast} onNav={onNav}/> : <EmptyState title="Pick a tool" body="Browse the sidebar and select a tool to see its schema and try it out."/>}
        </div>
      </div>
    </div>
  );
}

function ToolGroup({ server, tools, selected, onSelect }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ marginBottom: 6 }}>
      <div className="flex-h" style={{ padding: '6px 8px', cursor: 'pointer', userSelect: 'none' }}
           onClick={() => setOpen(!open)}>
        <I.ChevronRight size={11} className="tertiary" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 100ms' }}/>
        <StatusDot status={server.status} size={6}/>
        <b style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{server.name}</b>
        <span className="tertiary mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{tools.length}</span>
      </div>
      {open && (
        <div style={{ paddingLeft: 16 }}>
          {tools.map(t => (
            <div key={t.name}
                 className={`tree-node ${selected?.server_id === server.id && selected?.name === t.name ? 'active' : ''}`}
                 onClick={() => onSelect({ server_id: server.id, name: t.name })}>
              <I.Wrench size={12} className="tree-icon"/>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
              {t.destructive && <span className="badge warn mono" style={{ padding: '0 4px', fontSize: 9 }}>!</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolDetailPane({ tool, toast, onNav }) {
  const [tab, setTab] = React.useState('try');
  const server = FALLBACK_SERVERS.find(s => s.id === tool.server_id) || { id: tool.server_id, name: tool.server_name || tool.server_id };
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }} data-testid="tool-detail-ready">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <span className="mono tertiary" style={{ fontSize: 16, fontWeight: 500 }}>{server.name}</span>
            <span className="tertiary" style={{ fontSize: 16 }}>.</span>
            <span className="mono">{tool.name}</span>
            {tool.destructive && <span className="badge warn"><span className="dot"/>destructive</span>}
          </h1>
          <p className="page-sub">{tool.description || tool.desc || '—'}</p>
        </div>
        <div className="page-actions">
          <span className="muted" style={{ fontSize: 12 }}>
            {tool.calls_24h != null && <><b className="mono">{fmtNum(tool.calls_24h)}</b> calls / 24h</>}
            {tool.calls_24h != null && tool.p50 != null && <span className="tertiary"> · </span>}
            {tool.p50 != null && <><b className="mono">{fmtDuration(tool.p50)}</b> p50</>}
          </span>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        { key: 'try', label: 'Try it', icon: <I.Play size={13}/> },
        { key: 'schema', label: 'Schema', icon: <I.FileCode size={13}/> },
        { key: 'recent', label: 'Recent calls', icon: <I.Clock size={13}/> },
      ]}/>

      <div style={{ marginTop: 16 }}>
        {tab === 'try' && <ToolPlayground tool={tool} toast={toast}/>}
        {tab === 'schema' && <ToolSchema schema={tool.input_schema || tool.schema || { type: 'object', properties: {} }}/>}
        {tab === 'recent' && <ToolRecentCalls tool={tool} onNav={onNav}/>}
      </div>
    </div>
  );
}

function ToolPlayground({ tool, toast }) {
  const schema = tool.input_schema || tool.schema || { type: 'object', properties: {} };
  const initial = {};
  Object.entries(schema.properties || {}).forEach(([k, v]) => {
    if (v.default !== undefined) initial[k] = v.default;
    else if (v.type === 'string') initial[k] = '';
    else if (v.type === 'integer' || v.type === 'number') initial[k] = v.minimum || 0;
    else if (v.type === 'boolean') initial[k] = false;
    else if (v.enum) initial[k] = v.enum[0];
  });
  const [args, setArgs] = React.useState(initial);
  const [rawMode, setRawMode] = React.useState(false);
  const [raw, setRaw] = React.useState(JSON.stringify(initial, null, 2));
  const [resp, setResp] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [confirmDanger, setConfirmDanger] = React.useState(false);

  const setArg = (k, v) => setArgs(a => ({ ...a, [k]: v }));

  const invoke = () => {
    if (tool.destructive && !confirmDanger) {
      setConfirmDanger(true);
      return;
    }
    setLoading(true);
    setResp(null);
    setTimeout(() => {
      setLoading(false);
      const dur = Math.round(tool.p50 * (0.7 + Math.random() * 0.6));
      setResp({
        status: 200,
        dur,
        audit_id: 'aud_' + Math.random().toString(36).slice(2, 10),
        body: {
          content: [{
            type: 'text',
            text: tool.name === 'search'
              ? `## Top results for "${args.q || 'your query'}"\n\n1. **MCP Spec v2026.5** — modelcontextprotocol.io/spec\n2. **Anthropic Engineering — MCP at scale** — anthropic.com/engineering/mcp\n3. **Padosoft MCP Pack** — github.com/padosoft/askmydocs-mcp-pack\n\nFound 847 results in 142ms.`
              : tool.name === 'summarise'
              ? `**Summary (${args.bullets || 5} bullets):**\n- ${(args.text || 'Source text…').slice(0, 60)}…\n- Key argument: …\n- Methodology: …\n- Limitations: …\n- Conclusion: …`
              : `Tool invocation complete. Mock response payload here.`,
          }],
          isError: false,
        },
      });
      toast.push({ kind: 'ok', title: `${tool.name} succeeded`, body: `${dur}ms · audit aud_${Math.random().toString(36).slice(2, 6)}` });
    }, 600 + Math.random() * 600);
  };

  return (
    <>
      <div className="playground-split" style={{ height: 'calc(100vh - 280px)', minHeight: 480 }}>
        <div className="playground-pane">
          <div className="flex-h-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <b style={{ fontSize: 12.5 }}>Arguments</b>
            <div className="flex-h">
              <button className={`chip ${!rawMode ? 'active' : ''}`} style={{ fontSize: 11 }}
                      onClick={() => setRawMode(false)}>Form</button>
              <button className={`chip ${rawMode ? 'active' : ''}`} style={{ fontSize: 11 }}
                      onClick={() => { setRaw(JSON.stringify(args, null, 2)); setRawMode(true); }}>Raw JSON</button>
            </div>
          </div>
          <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
            {rawMode ? (
              <textarea className="textarea mono" rows={20} value={raw}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }}
                        onChange={e => {
                          setRaw(e.target.value);
                          try { setArgs(JSON.parse(e.target.value)); } catch (_) {}
                        }}/>
            ) : (
              <SchemaForm schema={schema} value={args} onChange={setArg}/>
            )}
          </div>
          <div className="flex-h" style={{ padding: 12, borderTop: '1px solid var(--border)', gap: 8 }}>
            <button className="btn primary" onClick={invoke} disabled={loading}>
              {loading ? <I.Loader size={13}/> : <I.Play size={13}/>}
              {loading ? 'Invoking…' : 'Invoke tool'}
            </button>
            <span style={{ flex: 1 }}/>
            <button className="btn ghost" onClick={() => setArgs(initial)}>Reset</button>
          </div>
        </div>
        <div className="playground-pane">
          <div className="flex-h-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <b style={{ fontSize: 12.5 }}>Response</b>
            {resp && (
              <div className="flex-h" style={{ gap: 10, fontSize: 12 }}>
                <span className={`badge mono ${resp.status === 200 ? 'ok' : 'err'}`}>{resp.status}</span>
                <span className="muted mono">{resp.dur}ms</span>
                <a className="icon-link mono" style={{ fontSize: 11.5 }}>{resp.audit_id}</a>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {loading && <div className="row-gap-8">
              <Skeleton w="60%" h={14}/><Skeleton w="40%" h={14}/><Skeleton w="80%" h={14}/><Skeleton w="100%" h={14}/><Skeleton w="50%" h={14}/>
            </div>}
            {!loading && !resp && <EmptyState icon={<I.Play size={20}/>}
              title="Ready" body="Fill in the form and click Invoke to send a real JSON-RPC request to this tool."/>}
            {resp && <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(resp.body) }}/>}
          </div>
        </div>
      </div>
      <Modal open={confirmDanger}
             onClose={() => setConfirmDanger(false)}
             title="Confirm destructive action"
             sub={`Tool "${tool.name}" is marked destructive — it may write or mutate state.`}
             footer={<>
               <button className="btn" onClick={() => setConfirmDanger(false)}>Cancel</button>
               <button className="btn danger" onClick={() => { setConfirmDanger(false); invoke(); }}>
                 <I.Send size={13}/> Invoke anyway
               </button>
             </>}>
        <div className="row-gap-8">
          <p className="muted" style={{ margin: 0 }}>
            Effects may include creating resources, modifying records, or sending external messages. Review your arguments carefully.
          </p>
          <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(args) }}/>
        </div>
      </Modal>
    </>
  );
}

function SchemaForm({ schema, value, onChange }) {
  const props = schema.properties || {};
  const required = schema.required || [];
  const entries = Object.entries(props);
  if (entries.length === 0) {
    return <p className="muted">No arguments — click Invoke to call with empty payload.</p>;
  }
  return (
    <div className="row-gap-16">
      {entries.map(([key, p]) => (
        <SchemaField key={key} name={key} schema={p} required={required.includes(key)}
                     value={value[key]} onChange={(v) => onChange(key, v)}/>
      ))}
    </div>
  );
}

function SchemaField({ name, schema, required, value, onChange }) {
  const type = schema.enum ? 'enum' : schema.type;
  return (
    <div className="field-group">
      <label className="label">
        <span className="mono">{name}</span>
        {required && <span className="req">*</span>}
        <span className="schema-type" style={{ marginLeft: 6 }}>{type}</span>
      </label>
      {schema.description && <div className="field-hint" style={{ marginTop: 0, marginBottom: 6 }}>{schema.description}</div>}
      {type === 'enum' && (
        <select className="select" value={value} onChange={e => onChange(e.target.value)}>
          {schema.enum.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {type === 'string' && (
        schema.format === 'long' || (schema.maxLength && schema.maxLength > 200)
          ? <textarea className="textarea" rows={3} value={value || ''} onChange={e => onChange(e.target.value)}/>
          : <input className="input" value={value || ''} onChange={e => onChange(e.target.value)}/>
      )}
      {(type === 'integer' || type === 'number') && (
        <input className="input mono" type="number" value={value ?? ''}
               min={schema.minimum} max={schema.maximum}
               onChange={e => onChange(Number(e.target.value))}/>
      )}
      {type === 'boolean' && (
        <div className="flex-h">
          <input type="checkbox" className="checkbox" checked={!!value}
                 onChange={e => onChange(e.target.checked)}/>
          <span className="muted" style={{ fontSize: 12.5 }}>{schema.description || 'Enabled'}</span>
        </div>
      )}
      {type === 'array' && (
        <textarea className="textarea mono" rows={3} value={JSON.stringify(value || [], null, 2)}
                  onChange={e => { try { onChange(JSON.parse(e.target.value)); } catch (_) {} }}/>
      )}
    </div>
  );
}

function ToolSchema({ schema }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">JSON Schema</div>
        <button className="btn sm ghost"><I.Copy size={12}/> Copy</button>
      </div>
      <div className="card-body">
        <SchemaNode schema={schema} required={schema.required || []} root/>
      </div>
    </div>
  );
}

function SchemaNode({ name, schema, required = [], root }) {
  if (!schema) return null;
  if (schema.type === 'object' || !schema.type) {
    return (
      <div>
        {root && (
          <div className="mono muted" style={{ marginBottom: 8, fontSize: 12 }}>
            {'{'} type: <span className="schema-type object">object</span>{schema.required ? `, required: [${schema.required.join(', ')}]` : ''} {'}'}
          </div>
        )}
        {Object.entries(schema.properties || {}).map(([k, v]) => (
          <div key={k} className="schema-node">
            <div className="flex-h">
              <span className="schema-prop-name">{k}</span>
              {required.includes(k) && <span className="schema-prop-req">*</span>}
              <span className={`schema-type ${v.type}`}>{v.enum ? 'enum' : v.type}</span>
              {v.enum && <span className="tertiary mono" style={{ fontSize: 11 }}>[{v.enum.join(' | ')}]</span>}
              {v.default !== undefined && <span className="tertiary" style={{ marginLeft: 6, fontSize: 11 }}>default: <span className="mono">{JSON.stringify(v.default)}</span></span>}
            </div>
            {v.description && <div className="schema-desc">{v.description}</div>}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function ToolRecentCalls({ tool, onNav }) {
  const q = useAudit({ tool_name: tool.name, per_page: 30 });
  return (
    <DataState
      query={q}
      testIdBase="tool-recent-calls"
      isEmpty={(data) => !data || data.length === 0}
      empty={{ icon: <I.Clock size={26}/>, title: 'No calls yet', body: "This tool hasn't been invoked recently." }}
      ready={(calls) => (
        <div className="card">
          <div className="card-head"><div className="card-title">Recent invocations · last 30</div></div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Time</th>
                  <th style={{ width: 70 }} className="num">Status</th>
                  <th style={{ width: 80 }} className="num">Duration</th>
                  <th>Actor</th>
                  <th style={{ width: 120 }}>Audit ID</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(a => {
                  const statusNum = Number(a.status);
                  const ts = a.created_at ? new Date(a.created_at).getTime() : a.ts;
                  const dur = a.duration_ms ?? a.dur;
                  return (
                    <tr key={a.id} onClick={() => document.dispatchEvent(new CustomEvent('app:open-audit', { detail: a.id }))}
                        data-testid={`tool-recent-calls-row-${a.id}`}>
                      <td><StatusDot status={statusNum === 200 ? 'ok' : 'err'}/></td>
                      <td className="mono tertiary" style={{ fontSize: 11.5 }}>{fmtRelative(ts)}</td>
                      <td><span className={`badge mono ${statusNum === 200 ? 'ok' : statusNum >= 500 ? 'err' : 'warn'}`}>{a.status}</span></td>
                      <td className="num">{fmtDuration(dur)}</td>
                      <td className="muted truncate" style={{ maxWidth: 180 }}>{a.actor}</td>
                      <td><span className="id-link">{String(a.id).slice(0, 14)}…</span></td>
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

export { ToolsPage };
