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

// ============== Resources browser + Prompts library ==============

function ResourcesPage({ onNav }) {
  const [serverId, setServerId] = React.useState('srv_01');
  const [selectedUri, setSelectedUri] = React.useState('mcp://openai/docs/readme.md');
  const [previewTab, setPreviewTab] = React.useState('rendered');
  const [openDirs, setOpenDirs] = React.useState({ 'mcp://openai/docs/': true, 'mcp://openai/schemas/': false });

  const items = RESOURCES[serverId] || [];
  const selected = items.find(r => r.uri === selectedUri);
  const content = RESOURCE_CONTENT[selectedUri];

  const renderTree = () => {
    const nodes = [];
    for (const item of items) {
      if (item.type === 'dir') {
        nodes.push(
          <div key={item.uri}
               className={`tree-node dir ${selectedUri === item.uri ? 'active' : ''}`}
               onClick={() => setOpenDirs({ ...openDirs, [item.uri]: !openDirs[item.uri] })}>
            <I.ChevronRight size={11} className={`tree-chev ${openDirs[item.uri] ? 'open' : ''}`}/>
            <I.Folder size={13} className="tree-icon"/>
            <span>{item.name}</span>
          </div>
        );
      } else if (!item.parent) {
        nodes.push(
          <div key={item.uri}
               className={`tree-node file ${selectedUri === item.uri ? 'active' : ''}`}
               style={{ paddingLeft: 24 }}
               onClick={() => setSelectedUri(item.uri)}>
            <I.File size={13} className="tree-icon"/>
            <span>{item.name}</span>
            <span className="tree-meta">{fmtBytes(item.size)}</span>
          </div>
        );
      } else if (openDirs[item.parent]) {
        const isJson = item.mime === 'application/json';
        nodes.push(
          <div key={item.uri}
               className={`tree-node file ${selectedUri === item.uri ? 'active' : ''}`}
               style={{ paddingLeft: 36 }}
               onClick={() => setSelectedUri(item.uri)}>
            {isJson ? <I.FileCode size={13} className="tree-icon"/> : <I.FileText size={13} className="tree-icon"/>}
            <span>{item.name}</span>
            <span className="tree-meta">{fmtBytes(item.size)}</span>
          </div>
        );
      }
    }
    return nodes;
  };

  return (
    <div style={{ height: 'calc(100vh - var(--topbar-h))' }}>
      <div className="resource-layout">
        {/* Server list */}
        <div className="resource-pane">
          <div className="resource-pane-head">
            <span>Servers</span>
            <button className="iconbtn"><I.Refresh size={12}/></button>
          </div>
          <div className="resource-tree">
            {SERVERS.filter(s => s.resources > 0 && s.enabled).map(s => (
              <div key={s.id}
                   className={`tree-node ${serverId === s.id ? 'active' : ''}`}
                   onClick={() => { setServerId(s.id); }}>
                <StatusDot status={s.status} size={6}/>
                <span style={{ flex: 1 }}>{s.name}</span>
                <span className="tree-meta">{s.resources}</span>
              </div>
            ))}
          </div>
        </div>

        {/* URI tree */}
        <div className="resource-pane">
          <div className="resource-pane-head">
            <span style={{ fontFamily: 'var(--font-mono)', textTransform: 'none', letterSpacing: 0, color: 'var(--text-secondary)' }}>
              {SERVERS.find(s => s.id === serverId)?.name}://
            </span>
            <span className="tertiary mono" style={{ fontSize: 10 }}>{items.length}</span>
          </div>
          <div className="resource-tree">
            {renderTree()}
          </div>
        </div>

        {/* Preview */}
        <div className="resource-pane">
          <div className="resource-pane-head" style={{ paddingRight: 8 }}>
            <span className="mono" style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-secondary)' }}>
              {selected?.uri || '—'}
            </span>
            <div className="flex-h">
              <span className="badge outline">{selected?.mime || '—'}</span>
              <span className="tertiary mono" style={{ fontSize: 10.5 }}>{selected ? fmtBytes(selected.size) : ''}</span>
              <button className="iconbtn" title="Copy URI"><I.Copy size={12}/></button>
              <button className="iconbtn" title="Download"><I.Download size={12}/></button>
            </div>
          </div>
          {selected && (
            <>
              <div className="tabs" style={{ padding: '0 12px' }}>
                {['rendered', 'raw', 'hex', 'metadata'].map(t => (
                  <button key={t}
                          className={`tab ${previewTab === t ? 'active' : ''}`}
                          onClick={() => setPreviewTab(t)}
                          style={{ fontSize: 11.5 }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {previewTab === 'rendered' && content && selected.mime === 'text/markdown' && (
                  <MarkdownRender source={content}/>
                )}
                {previewTab === 'rendered' && content && selected.mime === 'application/json' && (
                  <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(JSON.parse(content || '{}')) }}/>
                )}
                {previewTab === 'rendered' && !content && (
                  <EmptyState icon={<I.File size={20}/>}
                              title="No preview"
                              body={`This is a ${selected.mime} resource. Switch to Raw or Hex to inspect contents.`}/>
                )}
                {previewTab === 'raw' && (
                  <pre className="code-block">{content || `<binary ${selected.mime} — ${fmtBytes(selected.size)}>`}</pre>
                )}
                {previewTab === 'hex' && (
                  <pre className="code-block" style={{ fontSize: 11 }}>
{`00000000  23 20 4f 70 65 6e 41 49  20 4d 43 50 20 2d 2d 20  # OpenAI MCP --
00000010  51 75 69 63 6b 20 73 74  61 72 74 0a 0a 57 65 6c  Quick start..Wel
00000020  63 6f 6d 65 20 74 6f 20  74 68 65 20 4f 70 65 6e  come to the Open
00000030  41 49 20 4d 43 50 20 73  65 72 76 65 72 2e 20 54  AI MCP server. T
00000040  68 69 73 20 73 65 72 76  65 72 20 65 78 70 6f 73  his server expos
00000050  65 73 20 2a 2a 77 65 62  20 73 65 61 72 63 68 2a  es **web search*
...`}
                  </pre>
                )}
                {previewTab === 'metadata' && (
                  <dl className="kv">
                    <dt>URI</dt><dd className="mono">{selected.uri}</dd>
                    <dt>MIME type</dt><dd className="mono">{selected.mime}</dd>
                    <dt>Size</dt><dd className="mono">{fmtBytes(selected.size)} ({selected.size.toLocaleString()} bytes)</dd>
                    <dt>Server</dt><dd>{SERVERS.find(s => s.id === serverId)?.name}</dd>
                    <dt>Last modified</dt><dd className="mono">2026-05-12 09:14:22 UTC</dd>
                    <dt>ETag</dt><dd className="mono">"a1b2c3d4-e5f6"</dd>
                    <dt>Cache-Control</dt><dd className="mono">public, max-age=3600</dd>
                  </dl>
                )}
              </div>
            </>
          )}
          {!selected && <EmptyState icon={<I.FileBox size={26}/>} title="Select a resource"
                                     body="Pick a file from the URI tree to preview its contents."/>}
        </div>
      </div>
    </div>
  );
}

function MarkdownRender({ source }) {
  // Minimal MD renderer (headings, bold, code, lists, tables)
  const html = source
    .replace(/^### (.*$)/gm, '<h3 style="margin:18px 0 8px;font-size:15px;font-weight:600">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="margin:22px 0 8px;font-size:17px;font-weight:600">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="margin:0 0 14px;font-size:22px;font-weight:700;letter-spacing:-0.02em">$1</h1>')
    .replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre class="code-block" style="margin:10px 0">$2</pre>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg-subtle);padding:1px 5px;border-radius:3px;font-family:var(--font-mono);font-size:0.9em">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/^\- (.*$)/gm, '<li style="margin-left:20px;list-style:disc">$1</li>')
    .replace(/^(\|.+\|)\s*$/gm, (m) => {
      const cells = m.split('|').filter(c => c.trim());
      return '<tr>' + cells.map(c => /^[\s\-]+$/.test(c) ? '' : `<td style="border:1px solid var(--border);padding:5px 10px;font-size:12px">${c.trim()}</td>`).filter(Boolean).join('') + '</tr>';
    })
    .replace(/(<tr>.+?<\/tr>(\n<tr>.+?<\/tr>)*)/gs, '<table style="border-collapse:collapse;margin:10px 0">$1</table>')
    .replace(/\n\n/g, '</p><p style="margin:10px 0">')
    .replace(/^([^<].*)$/gm, (m) => /<\/?(h\d|li|table|tr|pre|p|code|td)/.test(m) ? m : `<p style="margin:8px 0;line-height:1.65">${m}</p>`);
  return <div style={{ fontSize: 13.5, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: html }}/>;
}

// ============== Prompts library ==============
function PromptsPage({ onNav }) {
  const all = Object.entries(PROMPTS).flatMap(([sid, ps]) =>
    ps.map(p => ({ ...p, server_id: sid, server_name: SERVERS.find(s => s.id === sid)?.name }))
  );
  const [selected, setSelected] = React.useState(all[0]);
  const [args, setArgs] = React.useState(() => {
    const o = {};
    (all[0]?.args || []).forEach(a => { o[a.name] = a.default || (a.type === 'string' ? '' : null); });
    return o;
  });
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    if (!selected) return;
    const o = {};
    selected.args.forEach(a => { o[a.name] = a.default || (a.type === 'string' ? '' : null); });
    setArgs(o);
  }, [selected?.server_id, selected?.name]);

  const filtered = all.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.desc.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page full" style={{ padding: 0 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '320px 1fr', gap: 1,
        background: 'var(--border)',
        height: 'calc(100vh - var(--topbar-h))',
      }}>
        <div style={{ background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
            <div className="search-input" style={{ maxWidth: 'none' }}>
              <I.Search size={13} className="search-icon"/>
              <input className="input" placeholder="Search prompts…"
                     value={q} onChange={e => setQ(e.target.value)}/>
            </div>
          </div>
          <div style={{ overflow: 'auto', flex: 1 }}>
            {filtered.map(p => (
              <div key={p.server_id + p.name}
                   onClick={() => setSelected(p)}
                   style={{
                     padding: '12px 16px',
                     borderBottom: '1px solid var(--border)',
                     cursor: 'pointer',
                     background: selected?.server_id === p.server_id && selected?.name === p.name ? 'var(--accent-bg)' : 'transparent',
                     borderLeft: selected?.server_id === p.server_id && selected?.name === p.name ? '2px solid var(--accent)' : '2px solid transparent',
                   }}>
                <div className="flex-h-between">
                  <b className="mono">{p.name}</b>
                  <span className="badge outline">{p.args.length} arg{p.args.length === 1 ? '' : 's'}</span>
                </div>
                <p className="muted" style={{ margin: '4px 0 2px', fontSize: 12 }}>{p.desc}</p>
                <span className="tertiary mono" style={{ fontSize: 11 }}>{p.server_name}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--bg)', overflow: 'auto', padding: 24 }}>
          {selected ? (
            <div style={{ maxWidth: 880, margin: '0 auto' }}>
              <div className="page-head">
                <div>
                  <h1 className="page-title" style={{ fontSize: 20 }}>
                    <span className="mono tertiary" style={{ fontSize: 15 }}>{selected.server_name}.</span>
                    <span className="mono">{selected.name}</span>
                  </h1>
                  <p className="page-sub">{selected.desc}</p>
                </div>
                <button className="btn"><I.Send size={13}/> Send to Tools playground</button>
              </div>

              <div className="grid-2" style={{ gridTemplateColumns: '320px 1fr', gap: 16 }}>
                <div className="card">
                  <div className="card-head"><div className="card-title">Arguments</div></div>
                  <div className="card-body">
                    {selected.args.map(a => (
                      <div key={a.name} className="field-group" style={{ marginBottom: 12 }}>
                        <label className="label">
                          <span className="mono">{a.name}</span>
                          {a.required && <span className="req">*</span>}
                          <span className="schema-type" style={{ marginLeft: 6 }}>{a.enum ? 'enum' : a.type}</span>
                        </label>
                        {a.desc && <div className="field-hint" style={{ marginTop: 0, marginBottom: 4 }}>{a.desc}</div>}
                        {a.enum ? (
                          <select className="select" value={args[a.name] || a.default}
                                  onChange={e => setArgs({ ...args, [a.name]: e.target.value })}>
                            {a.enum.map(o => <option key={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input className="input" value={args[a.name] || ''}
                                 onChange={e => setArgs({ ...args, [a.name]: e.target.value })}/>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <I.Sparkles size={13} className="tertiary"/>
                      Live preview · debounced 400ms
                    </div>
                    <div className="flex-h">
                      <button className="btn sm ghost"><I.Copy size={12}/> JSON</button>
                    </div>
                  </div>
                  <div className="card-body">
                    {selected.preview.map((msg, i) => {
                      // interpolate args
                      const text = msg.text.replace(/\{(\w+)\}/g, (m, k) => args[k] || m);
                      return (
                        <div key={i} className="prompt-message">
                          <div className="prompt-message-head">
                            <span className={`prompt-role ${msg.role}`}>{msg.role}</span>
                            <span className="tertiary mono" style={{ fontSize: 11 }}>message[{i}]</span>
                          </div>
                          <div className="prompt-message-body">{text}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : <EmptyState title="Pick a prompt" body="Select a prompt from the sidebar to preview it."/>}
        </div>
      </div>
    </div>
  );
}

export { ResourcesPage, PromptsPage };
