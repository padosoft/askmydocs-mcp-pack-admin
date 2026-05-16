// @ts-nocheck
// Auto-converted from design prototype data.js.
// All fixtures + the NOW reference are exported and consumed
// directly by the UI modules (no window globals at runtime).

// ============== Mock data: realistic MCP ecosystem ==============
export const NOW = new Date('2026-05-15T14:32:00Z').getTime();

const _rand = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
const _spark = (seed, n, base, variance) => {
  const r = _rand(seed);
  return Array.from({ length: n }, () => Math.max(0, Math.round(base + (r() - 0.5) * variance)));
};
const _sparkPulse = (seed, n, base, max, spikes = []) => {
  const r = _rand(seed);
  return Array.from({ length: n }, (_, i) => {
    if (spikes.includes(i)) return max;
    return Math.max(0, Math.round(base + (r() - 0.4) * (max - base) * 0.6));
  });
};

export const TENANTS = [
  { id: 'acme-corp', name: 'Acme Corp', primary: true },
  { id: 'demo-corp', name: 'Demo Corp' },
  { id: 'padosoft-internal', name: 'Padosoft Internal' },
];

export const SERVERS = [
  { id: 'srv_01', name: 'openai-mcp', transport: 'http', url: 'https://mcp.openai.com/v1', status: 'ok', enabled: true,
    tools: 12, resources: 8, prompts: 4,
    last_handshake_at: NOW - 142_000, handshake_dur_ms: 312,
    p50: 142, p95: 484, p99: 1240,
    calls_1h: 1842, errors_1h: 12,
    tenant: 'acme-corp', owner: 'lorenzo@padosoft.com',
    desc: 'OpenAI MCP server — search, summarisation, image generation',
    created_at: NOW - 90 * 86400_000,
    spark: _spark(11, 60, 30, 14),
    spark_latency: _spark(12, 60, 142, 80),
    health: _spark(13, 24, 95, 10),
  },
  { id: 'srv_02', name: 'github-mcp', transport: 'http', url: 'https://api.github.com/mcp', status: 'ok', enabled: true,
    tools: 18, resources: 24, prompts: 6,
    last_handshake_at: NOW - 56_000, handshake_dur_ms: 218,
    p50: 86, p95: 312, p99: 880,
    calls_1h: 982, errors_1h: 3,
    tenant: 'acme-corp', owner: 'marco@padosoft.com',
    desc: 'GitHub repository, issue, and PR tooling',
    created_at: NOW - 60 * 86400_000,
    spark: _spark(21, 60, 16, 8),
    spark_latency: _spark(22, 60, 86, 40),
    health: _spark(23, 24, 99, 4),
  },
  { id: 'srv_03', name: 'slack-mcp', transport: 'sse', url: 'wss://slack-mcp.acme.io/events', status: 'warn', enabled: true,
    tools: 9, resources: 0, prompts: 2,
    last_handshake_at: NOW - 4_200_000, handshake_dur_ms: 1840,
    p50: 312, p95: 1840, p99: 5012,
    calls_1h: 414, errors_1h: 28,
    tenant: 'acme-corp', owner: 'alice@padosoft.com',
    desc: 'Slack workspace integration — post, search, react',
    created_at: NOW - 32 * 86400_000,
    spark: _sparkPulse(31, 60, 8, 16, [42, 51, 55]),
    spark_latency: _sparkPulse(32, 60, 312, 1840, [42, 51, 55]),
    health: _spark(33, 24, 72, 30),
  },
  { id: 'srv_04', name: 'jira-mcp', transport: 'http', url: 'https://acme.atlassian.net/mcp', status: 'ok', enabled: true,
    tools: 14, resources: 2, prompts: 3,
    last_handshake_at: NOW - 12_000, handshake_dur_ms: 412,
    p50: 220, p95: 580, p99: 1420,
    calls_1h: 312, errors_1h: 2,
    tenant: 'acme-corp', owner: 'lorenzo@padosoft.com',
    desc: 'Jira issue tracking & sprint management',
    created_at: NOW - 45 * 86400_000,
    spark: _spark(41, 60, 5, 4),
    spark_latency: _spark(42, 60, 220, 80),
    health: _spark(43, 24, 98, 4),
  },
  { id: 'srv_05', name: 'postgres-readonly', transport: 'stdio', url: '/usr/local/bin/pg-mcp',
    status: 'ok', enabled: true,
    tools: 6, resources: 142, prompts: 1,
    last_handshake_at: NOW - 220_000, handshake_dur_ms: 64,
    p50: 28, p95: 86, p99: 240,
    calls_1h: 2104, errors_1h: 0,
    tenant: 'acme-corp', owner: 'lorenzo@padosoft.com',
    desc: 'Read-only Postgres schema & query MCP (local stdio)',
    created_at: NOW - 14 * 86400_000,
    spark: _spark(51, 60, 35, 18),
    spark_latency: _spark(52, 60, 28, 20),
    health: _spark(53, 24, 99, 2),
  },
  { id: 'srv_06', name: 'filesystem-local', transport: 'stdio', url: 'node mcp-fs.js', status: 'ok', enabled: true,
    tools: 8, resources: 1240, prompts: 0,
    last_handshake_at: NOW - 1_840_000, handshake_dur_ms: 22,
    p50: 4, p95: 12, p99: 38,
    calls_1h: 487, errors_1h: 1,
    tenant: 'acme-corp', owner: 'marco@padosoft.com',
    desc: 'Local sandbox filesystem read/write',
    created_at: NOW - 8 * 86400_000,
    spark: _spark(61, 60, 8, 6),
    spark_latency: _spark(62, 60, 4, 3),
    health: _spark(63, 24, 100, 1),
  },
  { id: 'srv_07', name: 'pinecone-vectors', transport: 'http', url: 'https://prod-eu.pinecone.io/mcp',
    status: 'err', enabled: true,
    tools: 4, resources: 0, prompts: 0,
    last_handshake_at: NOW - 18_400_000, handshake_dur_ms: null,
    p50: 612, p95: 4200, p99: 12_400,
    calls_1h: 84, errors_1h: 72,
    tenant: 'demo-corp', owner: 'alice@padosoft.com',
    desc: 'Pinecone vector store (currently failing handshake)',
    created_at: NOW - 21 * 86400_000,
    spark: _sparkPulse(71, 60, 2, 8, []),
    spark_latency: _spark(72, 60, 4200, 2000),
    health: _spark(73, 24, 18, 18),
    last_error: 'ECONNREFUSED — handshake timeout after 30s',
  },
  { id: 'srv_08', name: 'anthropic-mcp', transport: 'http', url: 'https://mcp.anthropic.com/v1', status: 'ok', enabled: true,
    tools: 8, resources: 0, prompts: 3,
    last_handshake_at: NOW - 320_000, handshake_dur_ms: 286,
    p50: 124, p95: 412, p99: 1100,
    calls_1h: 1314, errors_1h: 4,
    tenant: 'acme-corp', owner: 'lorenzo@padosoft.com',
    desc: 'Anthropic Claude MCP — chat, vision, computer use',
    created_at: NOW - 28 * 86400_000,
    spark: _spark(81, 60, 22, 12),
    spark_latency: _spark(82, 60, 124, 60),
    health: _spark(83, 24, 97, 6),
  },
  { id: 'srv_09', name: 'notion-mcp', transport: 'http', url: 'https://api.notion.com/v1/mcp', status: 'ok', enabled: false,
    tools: 11, resources: 84, prompts: 2,
    last_handshake_at: NOW - 4 * 86400_000, handshake_dur_ms: 412,
    p50: 240, p95: 720, p99: 1840,
    calls_1h: 0, errors_1h: 0,
    tenant: 'demo-corp', owner: 'marco@padosoft.com',
    desc: 'Notion workspace pages, databases, blocks (disabled)',
    created_at: NOW - 12 * 86400_000,
    spark: Array(60).fill(0),
    spark_latency: Array(60).fill(0),
    health: Array(24).fill(0),
  },
  { id: 'srv_10', name: 'sentry-mcp', transport: 'sse', url: 'https://sentry.io/mcp/sse', status: 'ok', enabled: true,
    tools: 7, resources: 16, prompts: 1,
    last_handshake_at: NOW - 84_000, handshake_dur_ms: 184,
    p50: 96, p95: 312, p99: 820,
    calls_1h: 624, errors_1h: 8,
    tenant: 'acme-corp', owner: 'alice@padosoft.com',
    desc: 'Sentry error tracking, issue triage & release health',
    created_at: NOW - 18 * 86400_000,
    spark: _spark(101, 60, 12, 6),
    spark_latency: _spark(102, 60, 96, 40),
    health: _spark(103, 24, 96, 6),
  },
  { id: 'srv_11', name: 'linear-mcp', transport: 'http', url: 'https://api.linear.app/mcp', status: 'ok', enabled: true,
    tools: 16, resources: 4, prompts: 2,
    last_handshake_at: NOW - 142_000, handshake_dur_ms: 312,
    p50: 142, p95: 412, p99: 1080,
    calls_1h: 412, errors_1h: 1,
    tenant: 'acme-corp', owner: 'lorenzo@padosoft.com',
    desc: 'Linear issue tracker, projects, cycles',
    created_at: NOW - 22 * 86400_000,
    spark: _spark(111, 60, 7, 5),
    spark_latency: _spark(112, 60, 142, 50),
    health: _spark(113, 24, 99, 4),
  },
  { id: 'srv_12', name: 'aws-readonly', transport: 'stdio', url: 'mcp-aws --readonly', status: 'ok', enabled: true,
    tools: 22, resources: 8, prompts: 0,
    last_handshake_at: NOW - 8 * 60 * 1000, handshake_dur_ms: 612,
    p50: 218, p95: 612, p99: 1840,
    calls_1h: 184, errors_1h: 0,
    tenant: 'padosoft-internal', owner: 'marco@padosoft.com',
    desc: 'AWS read-only — EC2, S3, RDS, CloudWatch lookups',
    created_at: NOW - 6 * 86400_000,
    spark: _spark(121, 60, 3, 3),
    spark_latency: _spark(122, 60, 218, 80),
    health: _spark(123, 24, 100, 1),
  },
  { id: 'srv_13', name: 'stripe-mcp', transport: 'http', url: 'https://api.stripe.com/mcp/v1',
    status: 'idle', enabled: true,
    tools: 14, resources: 0, prompts: 1,
    last_handshake_at: NOW - 32 * 60 * 1000, handshake_dur_ms: 218,
    p50: 84, p95: 312, p99: 840,
    calls_1h: 12, errors_1h: 0,
    tenant: 'demo-corp', owner: 'alice@padosoft.com',
    desc: 'Stripe payments — customers, charges, subscriptions',
    created_at: NOW - 16 * 86400_000,
    spark: _spark(131, 60, 0.4, 0.8),
    spark_latency: _spark(132, 60, 84, 30),
    health: _spark(133, 24, 100, 1),
  },
  { id: 'srv_14', name: 'figma-mcp', transport: 'http', url: 'https://api.figma.com/v1/mcp', status: 'warn', enabled: true,
    tools: 9, resources: 0, prompts: 1,
    last_handshake_at: NOW - 12 * 60 * 1000, handshake_dur_ms: 1840,
    p50: 412, p95: 2200, p99: 6400,
    calls_1h: 84, errors_1h: 14,
    tenant: 'acme-corp', owner: 'lorenzo@padosoft.com',
    desc: 'Figma file & node API — degraded (high p95)',
    created_at: NOW - 9 * 86400_000,
    spark: _spark(141, 60, 1.4, 2),
    spark_latency: _spark(142, 60, 412, 800),
    health: _spark(143, 24, 78, 26),
  },
];

// Tools per server (subset shown)
export const TOOLS = {
  srv_01: [
    { name: 'search', desc: 'Search the web with OpenAI gpt-4 enhanced retrieval', calls_24h: 8420, p50: 142, schema: { type:'object', required:['q'], properties: { q:{ type:'string', description:'Search query' }, max_results:{ type:'integer', minimum: 1, maximum: 50, default: 10 }, recent_only:{ type:'boolean', default: false } } }, destructive: false },
    { name: 'summarise', desc: 'Summarise a URL or text into N bullet points', calls_24h: 2104, p50: 312, schema: { type:'object', required:['text'], properties: { text:{ type:'string' }, bullets:{ type:'integer', default: 5 } } }, destructive: false },
    { name: 'generate_image', desc: 'Generate image via DALL-E 3', calls_24h: 412, p50: 4200, schema: { type:'object', required:['prompt'], properties:{ prompt:{ type:'string' }, size:{ enum:['1024x1024','1792x1024','1024x1792'] }, style:{ enum:['vivid','natural'], default:'vivid' } } }, destructive: false },
    { name: 'transcribe', desc: 'Whisper audio → text', calls_24h: 84, p50: 1240, schema: {}, destructive: false },
    { name: 'embed', desc: 'Get text-embedding-3-small vector', calls_24h: 12_440, p50: 24, schema: {}, destructive: false },
    { name: 'moderate', desc: 'Content moderation classifier', calls_24h: 4220, p50: 28, schema: {}, destructive: false },
  ],
  srv_02: [
    { name: 'list_repos', desc: 'List user/org repositories', calls_24h: 412, p50: 86, schema: {}, destructive: false },
    { name: 'create_issue', desc: 'Create an issue on a repo', calls_24h: 84, p50: 184, schema: { type:'object', required:['repo','title'], properties: { repo:{ type:'string', description:'owner/repo' }, title:{ type:'string' }, body:{ type:'string' }, labels:{ type:'array', items:{ type:'string' } } } }, destructive: true },
    { name: 'merge_pr', desc: 'Merge a pull request', calls_24h: 28, p50: 412, schema: {}, destructive: true },
    { name: 'search_code', desc: 'Search code across visible repos', calls_24h: 1840, p50: 312, schema: {}, destructive: false },
    { name: 'get_file', desc: 'Read a file from a repo at a ref', calls_24h: 4124, p50: 86, schema: {}, destructive: false },
  ],
  srv_03: [
    { name: 'post_message', desc: 'Post message to a channel', calls_24h: 318, p50: 412, schema: { type:'object', required:['channel','text'], properties: { channel:{ type:'string' }, text:{ type:'string' }, thread_ts:{ type:'string' } } }, destructive: true },
    { name: 'search_messages', desc: 'Search workspace history', calls_24h: 86, p50: 612, schema: {}, destructive: false },
    { name: 'list_channels', desc: 'List channels (public + member)', calls_24h: 412, p50: 184, schema: {}, destructive: false },
    { name: 'react', desc: 'React to a message with an emoji', calls_24h: 1240, p50: 86, schema: {}, destructive: false },
  ],
};

// Tools list flat
export const ALL_TOOLS = Object.entries(TOOLS).flatMap(([sid, tools]) =>
  tools.map(t => ({ ...t, server_id: sid, server_name: SERVERS.find(s => s.id === sid)?.name }))
);

// Recent audit rows (latest first)
export const AUDIT = (() => {
  const arr = [];
  const methods = ['tools/call', 'tools/list', 'resources/read', 'resources/list', 'prompts/get', 'prompts/list', 'initialize'];
  const actors = ['lorenzo@padosoft.com', 'marco@padosoft.com', 'alice@padosoft.com', 'svc_claude_code', 'svc_chatgpt_team', 'svc_zapier'];
  const r = _rand(7);
  for (let i = 0; i < 240; i++) {
    const srv = SERVERS[Math.floor(r() * SERVERS.length)];
    const tools = TOOLS[srv.id] || [];
    const tool = tools[Math.floor(r() * tools.length)];
    const method = r() < 0.6 ? 'tools/call' : methods[Math.floor(r() * methods.length)];
    const ts = NOW - i * (8_000 + r() * 36_000);
    const dur = method === 'tools/call'
      ? Math.round(srv.p50 + (r() - 0.4) * srv.p95)
      : Math.round(20 + r() * 80);
    const status = srv.id === 'srv_07' && r() < 0.85 ? 504
      : srv.id === 'srv_03' && r() < 0.18 ? 502
      : srv.id === 'srv_14' && r() < 0.22 ? 408
      : r() < 0.04 ? 500 : r() < 0.06 ? 422 : 200;
    arr.push({
      id: `aud_${(NOW - ts).toString(36)}${i}`,
      ts,
      tenant: srv.tenant,
      server_id: srv.id,
      server: srv.name,
      method,
      tool: method === 'tools/call' ? (tool ? tool.name : 'search') : null,
      dur: Math.max(2, dur),
      status,
      actor: actors[Math.floor(r() * actors.length)],
      bytes_in: Math.round(80 + r() * 1800),
      bytes_out: Math.round(120 + r() * 8400),
      cb_state: status === 504 ? 'open' : 'closed',
    });
  }
  return arr;
})();

// Audit drill-down detail for a sample row
export const AUDIT_DETAIL = {
  id: 'aud_search_142ms',
  ts: NOW - 142_000,
  tenant: 'acme-corp',
  server: 'openai-mcp',
  server_id: 'srv_01',
  method: 'tools/call',
  tool: 'search',
  status: 200,
  dur: 142,
  actor: 'lorenzo@padosoft.com',
  request: {
    jsonrpc: '2.0',
    id: 'req_142ms',
    method: 'tools/call',
    params: {
      name: 'search',
      arguments: {
        q: 'Model Context Protocol official spec 2026',
        max_results: 10,
        recent_only: true,
      },
    },
  },
  response: {
    jsonrpc: '2.0',
    id: 'req_142ms',
    result: {
      content: [
        { type: 'text', text: '## Top results\n\n1. [MCP Spec v2026.5](https://modelcontextprotocol.io/spec)\n2. [Anthropic Engineering Blog – MCP at scale](https://www.anthropic.com/engineering/mcp)\n3. [Padosoft MCP Pack — Laravel adapter](https://github.com/padosoft/askmydocs-mcp-pack)' },
      ],
      isError: false,
    },
  },
  headers: {
    'x-mcp-tenant': 'acme-corp',
    'x-mcp-actor': 'lorenzo@padosoft.com',
    'x-request-id': 'req_142ms_acme_007',
    'authorization': 'Bearer ***redacted***',
    'user-agent': 'AskMyDocs/2.4 (Laravel/12.3)',
  },
  timeline: [
    { label: 'Request received', t: NOW - 142_000 + 1, dur: null },
    { label: 'Handshake reused', t: NOW - 142_000 + 4, dur: 3 },
    { label: 'Server invoked', t: NOW - 142_000 + 12, dur: 8 },
    { label: 'Tool returned', t: NOW - 142_000 + 138, dur: 126 },
    { label: 'Response sent', t: NOW - 142_000 + 142, dur: 4 },
  ],
  meta: {
    pii_flags: [],
    cb_state_before: 'closed',
    cb_state_after: 'closed',
    cache_hit: false,
    retries: 0,
  },
};

// Circuit breakers
export const BREAKERS = [
  { id: 'cb_01', tenant: 'acme-corp', server: 'slack-mcp', server_id: 'srv_03', tool: 'post_message', state: 'open', failures: 7, threshold: 5, reopens_in: 42, last_failure_ago: 30, last_failure_msg: 'Slack API: rate_limited (429)' },
  { id: 'cb_02', tenant: 'demo-corp', server: 'pinecone-vectors', server_id: 'srv_07', tool: 'query', state: 'open', failures: 14, threshold: 5, reopens_in: 18, last_failure_ago: 8, last_failure_msg: 'ECONNREFUSED' },
  { id: 'cb_03', tenant: 'acme-corp', server: 'figma-mcp', server_id: 'srv_14', tool: 'get_file', state: 'half', failures: 3, threshold: 5, reopens_in: 0, last_failure_ago: 184, last_failure_msg: 'Timeout @ 6.4s' },
  { id: 'cb_04', tenant: 'acme-corp', server: 'openai-mcp', server_id: 'srv_01', tool: 'generate_image', state: 'closed', failures: 1, threshold: 5, reopens_in: 0, last_failure_ago: 1840, last_failure_msg: '—' },
  { id: 'cb_05', tenant: 'acme-corp', server: 'github-mcp', server_id: 'srv_02', tool: 'merge_pr', state: 'closed', failures: 0, threshold: 5, reopens_in: 0, last_failure_ago: 24_000, last_failure_msg: '—' },
  { id: 'cb_06', tenant: 'padosoft-internal', server: 'aws-readonly', server_id: 'srv_12', tool: 'cloudwatch_logs', state: 'closed', failures: 0, threshold: 5, reopens_in: 0, last_failure_ago: 86_400, last_failure_msg: '—' },
  { id: 'cb_07', tenant: 'acme-corp', server: 'anthropic-mcp', server_id: 'srv_08', tool: 'computer_use', state: 'closed', failures: 0, threshold: 3, reopens_in: 0, last_failure_ago: 8400, last_failure_msg: '—' },
  { id: 'cb_08', tenant: 'acme-corp', server: 'linear-mcp', server_id: 'srv_11', tool: 'create_issue', state: 'closed', failures: 1, threshold: 5, reopens_in: 0, last_failure_ago: 4200, last_failure_msg: '—' },
];

// Resources tree (sample for openai-mcp)
export const RESOURCES = {
  srv_01: [
    { uri: 'mcp://openai/docs/', name: 'docs/', type: 'dir' },
    { uri: 'mcp://openai/docs/readme.md', name: 'readme.md', type: 'file', mime: 'text/markdown', size: 4128, parent: 'mcp://openai/docs/' },
    { uri: 'mcp://openai/docs/guide.md', name: 'guide.md', type: 'file', mime: 'text/markdown', size: 12_840, parent: 'mcp://openai/docs/' },
    { uri: 'mcp://openai/schemas/', name: 'schemas/', type: 'dir' },
    { uri: 'mcp://openai/schemas/search.json', name: 'search.json', type: 'file', mime: 'application/json', size: 1840, parent: 'mcp://openai/schemas/' },
    { uri: 'mcp://openai/schemas/summarise.json', name: 'summarise.json', type: 'file', mime: 'application/json', size: 612, parent: 'mcp://openai/schemas/' },
    { uri: 'mcp://openai/config.json', name: 'config.json', type: 'file', mime: 'application/json', size: 384 },
    { uri: 'mcp://openai/changelog.txt', name: 'changelog.txt', type: 'file', mime: 'text/plain', size: 2104 },
  ],
};

export const RESOURCE_CONTENT = {
  'mcp://openai/docs/readme.md': `# OpenAI MCP — Quick start

Welcome to the OpenAI MCP server. This server exposes **web search**, **summarisation** and **image generation** as MCP tools.

## Setup

\`\`\`bash
composer require padosoft/askmydocs-mcp-pack:^1.4
php artisan mcp:install openai-mcp
\`\`\`

## Tools

- **search** — high-quality web search with recency filtering
- **summarise** — multi-document summarisation into bullets
- **generate_image** — DALL-E 3 image synthesis

## Auth

Requires \`OPENAI_API_KEY\` environment variable or a Sanctum token with the \`mcp.openai.invoke\` scope.

## Rate limits

| Plan | RPM | TPM |
|------|-----|-----|
| Free | 60  | 40k |
| Team | 600 | 4M  |
`,
};

// Prompts
export const PROMPTS = {
  srv_01: [
    { name: 'research_brief', desc: 'Generate a research brief on a topic',
      args: [
        { name: 'topic', type: 'string', required: true, desc: 'Subject to research' },
        { name: 'depth', type: 'string', enum: ['shallow', 'medium', 'deep'], default: 'medium', required: false },
        { name: 'audience', type: 'string', required: false, desc: 'Intended reader' },
      ],
      preview: [
        { role: 'system', text: 'You are a senior research analyst. Produce structured briefs with citations.' },
        { role: 'user', text: 'Research topic: **Model Context Protocol adoption in enterprise**.\nDepth: medium.\nAudience: Padosoft engineering leadership.\n\nReturn: TL;DR (3 bullets), key trends (5), risks (3), next-step recommendations (5).' },
      ],
    },
    { name: 'summary_tweet', desc: 'Turn an article into a single-tweet hook',
      args: [{ name: 'url', type: 'string', required: true }],
      preview: [
        { role: 'system', text: 'You write punchy single-tweet summaries. Maximum 240 chars. No hashtags.' },
        { role: 'user', text: 'Summarise: {url}' },
      ],
    },
  ],
  srv_02: [
    { name: 'pr_review', desc: 'Generate a PR review comment',
      args: [
        { name: 'pr_url', type: 'string', required: true },
        { name: 'focus', type: 'string', enum: ['security', 'performance', 'style', 'general'], default: 'general' },
      ],
      preview: [
        { role: 'system', text: 'You are a senior engineer doing a code review. Be specific, cite line numbers.' },
        { role: 'user', text: 'Review PR {pr_url} focusing on {focus} concerns.' },
      ],
    },
  ],
};

// Current user / me
export const ME = {
  id: 42,
  email: 'lorenzo@padosoft.com',
  name: 'Lorenzo Padovani',
  initials: 'LP',
  tenant_id: 'acme-corp',
  permissions: [
    'mcp.servers.view', 'mcp.servers.create', 'mcp.servers.update', 'mcp.servers.delete', 'mcp.servers.handshake',
    'mcp.tools.invoke', 'mcp.audit.view', 'mcp.audit.replay',
    'mcp.breakers.view', 'mcp.breakers.reset', 'mcp.settings.tenants', 'mcp.settings.api-keys',
  ],
};

// API keys
export const API_KEYS = [
  { id: 'tok_01', name: 'claude-code-cli', scopes: ['mcp.tools.invoke', 'mcp.servers.view'], last_used_at: NOW - 84_000, created_at: NOW - 22 * 86400_000, created_by: 'lorenzo@padosoft.com' },
  { id: 'tok_02', name: 'chatgpt-team-bridge', scopes: ['mcp.tools.invoke'], last_used_at: NOW - 240_000, created_at: NOW - 18 * 86400_000, created_by: 'marco@padosoft.com' },
  { id: 'tok_03', name: 'zapier-webhook', scopes: ['mcp.tools.invoke'], last_used_at: NOW - 12 * 86400_000, created_at: NOW - 60 * 86400_000, created_by: 'alice@padosoft.com' },
  { id: 'tok_04', name: 'observability-readonly', scopes: ['mcp.audit.view', 'mcp.servers.view', 'mcp.breakers.view'], last_used_at: NOW - 4_200, created_at: NOW - 14 * 86400_000, created_by: 'lorenzo@padosoft.com' },
];
