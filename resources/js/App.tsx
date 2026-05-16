// @ts-nocheck — cross-module: the auto-converted prototype modules
// have inferred (any-based) parameter signatures that flip every
// optional prop into a required slot from the outside; properly
// typing them is tracked in scripts/convert-design.mjs.
// App shell — adapted from prototype `app.jsx`. The visible chrome
// (Sidebar + Topbar + CommandPalette + Tour + AuditDrilldown) is
// identical to the prototype; the only change is routing — we use
// react-router-dom v6 instead of hash routing.

import React from 'react';
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  useMatch,
} from 'react-router-dom';
import { I, useToast, ToastProvider } from './lib/ui';
import { TENANTS, ME, NOW, SERVERS, TOOLS, AUDIT } from './lib/data';
import { Sidebar, Topbar, CommandPalette, Tour, TOUR_STEPS } from './components/shell';
import { DashboardPage } from './pages/dashboard';
import { ServersListPage, ServerDetailPage, ServerNewPage } from './pages/servers';
import { ToolsPage } from './pages/tools';
import { ResourcesPage, PromptsPage } from './pages/resources';
import { AuditPage, AuditDrilldown, BreakersPage } from './pages/audit';
import { PlaygroundPage, SettingsPage, HelpPage } from './pages/misc';

function routeKeyFromPath(pathname: string) {
  const segments = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  if (segments.length === 0) return 'dashboard';
  if (segments[0] === 'servers' && segments[1] === 'new') return 'servers-new';
  if (segments[0] === 'server') return 'server-detail';
  if (segments[0] === 'tool') return 'tool-detail';
  return segments[0];
}

function NavBridge({ children }: { children: (nav: (p: string) => void) => any }) {
  const navigate = useNavigate();
  const nav = React.useCallback(
    (path: string) => {
      if (!path) return;
      if (path === 'servers-new') navigate('/servers/new');
      else navigate('/' + path);
    },
    [navigate],
  );
  return children(nav);
}

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [theme, setTheme] = React.useState<string>(() => {
    // Precedence: per-user override (localStorage) > host operator default
    // (window.__MCP_PACK_ADMIN__.theme_default seeded by the Blade shell from
    // config('mcp-pack-admin.theme_default')) > hard-coded dark.
    const stored = localStorage.getItem('mcp_theme');
    if (stored) return stored;
    const cfg = (window as any).__MCP_PACK_ADMIN__ ?? {};
    return (cfg.theme_default as string) || 'dark';
  });
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [livePaused, setLivePaused] = React.useState(false);
  const [liveEvents, setLiveEvents] = React.useState<any[]>(() => AUDIT.slice(0, 24).map((a: any) => ({ ...a, isNew: false })));
  const [tourActive, setTourActive] = React.useState(() => !localStorage.getItem('mcp_tour_done'));
  const [tourStep, setTourStep] = React.useState(0);
  const [lastTick, setLastTick] = React.useState(NOW);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mcp_theme', theme);
  }, [theme]);

  const nav = React.useCallback(
    (path: string) => {
      if (!path) return;
      if (path === 'servers-new') navigate('/servers/new');
      else navigate('/' + path);
    },
    [navigate],
  );

  // Live feed simulator (per prototype).
  React.useEffect(() => {
    if (livePaused) return;
    const id = setInterval(() => {
      const srv = SERVERS[Math.floor(Math.random() * SERVERS.length)];
      const tools = (TOOLS as any)[srv.id] || [];
      const tool = tools[Math.floor(Math.random() * tools.length)];
      const r = Math.random();
      const status =
        srv.id === 'srv_07' && r < 0.75 ? 504 : srv.id === 'srv_03' && r < 0.18 ? 502 : r < 0.04 ? 500 : 200;
      const ev: any = {
        id: `live_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ts: Date.now() - (Date.now() - NOW) + Math.random() * 1000,
        server: srv.name,
        server_id: srv.id,
        method: 'tools/call',
        tool: tool?.name || 'invoke',
        dur: Math.round(srv.p50 * (0.6 + Math.random() * 1.2)),
        status,
        isNew: true,
        auditId: 'aud_' + Math.random().toString(36).slice(2, 10),
      };
      setLiveEvents((prev) => [ev, ...prev.map((p) => ({ ...p, isNew: false }))].slice(0, 200));
      setLastTick(Date.now());
    }, 1800 + Math.random() * 2200);
    return () => clearInterval(id);
  }, [livePaused]);

  // Keyboard shortcuts (Cmd+K, g d/s/t/r/p/a/c, Cmd+1..7).
  const gPrefixRef = React.useRef(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as any)?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (inField) return;
      if (e.key === '?') {
        e.preventDefault();
        nav('help');
        return;
      }
      if (e.key === 'g') {
        gPrefixRef.current = true;
        setTimeout(() => (gPrefixRef.current = false), 1200);
        return;
      }
      if (gPrefixRef.current) {
        const m: Record<string, string> = { d: 'dashboard', s: 'servers', t: 'tools', r: 'resources', p: 'prompts', a: 'audit', c: 'breakers', h: 'help' };
        if (m[e.key]) {
          e.preventDefault();
          nav(m[e.key]);
          gPrefixRef.current = false;
        }
      }
      const routes = ['dashboard', 'servers', 'tools', 'resources', 'prompts', 'audit', 'breakers'];
      if ((e.metaKey || e.ctrlKey) && /^[1-7]$/.test(e.key)) {
        e.preventDefault();
        nav(routes[Number(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);

  React.useEffect(() => {
    const onToggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    const onTogglePaused = () => setLivePaused((p) => !p);
    const onStartTour = () => {
      setTourActive(true);
      setTourStep(0);
    };
    const onNavEvt = (e: any) => nav(e.detail);
    const onOpenAudit = (e: any) => nav('audit/' + e.detail);
    document.addEventListener('app:toggle-theme', onToggleTheme as any);
    document.addEventListener('app:toggle-paused', onTogglePaused as any);
    document.addEventListener('app:start-tour', onStartTour as any);
    document.addEventListener('app:nav', onNavEvt as any);
    document.addEventListener('app:open-audit', onOpenAudit as any);
    return () => {
      document.removeEventListener('app:toggle-theme', onToggleTheme as any);
      document.removeEventListener('app:toggle-paused', onTogglePaused as any);
      document.removeEventListener('app:start-tour', onStartTour as any);
      document.removeEventListener('app:nav', onNavEvt as any);
      document.removeEventListener('app:open-audit', onOpenAudit as any);
    };
  }, [nav]);

  const route = routeKeyFromPath(location.pathname);
  const topRoute =
    route === 'servers-new' || route === 'server-detail' ? 'servers' : route === 'tool-detail' ? 'tools' : route;

  return (
    <div className="app">
      <Sidebar
        route={topRoute}
        onNav={nav}
        tenant={TENANTS.find((t: any) => t.id === ME.tenant_id)}
        onTenantClick={() => toast.push({ kind: 'info', title: 'Tenant switcher', body: 'Stub UI in this prototype.' })}
      />
      <main className="main">
        <Topbar
          route={topRoute}
          extra={[]}
          onNav={nav}
          theme={theme}
          onTheme={setTheme}
          livePaused={livePaused}
          onTogglePaused={() => setLivePaused((p) => !p)}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenTour={() => {
            setTourActive(true);
            setTourStep(0);
          }}
          lastTick={lastTick}
        />
        <div className="content" data-testid="panel-content">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  liveEvents={liveEvents}
                  livePaused={livePaused}
                  onTogglePaused={() => setLivePaused((p) => !p)}
                  onClearFeed={() => setLiveEvents([])}
                  onNav={nav}
                  onSelectAudit={(id: string) => nav('audit/' + id)}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  liveEvents={liveEvents}
                  livePaused={livePaused}
                  onTogglePaused={() => setLivePaused((p) => !p)}
                  onClearFeed={() => setLiveEvents([])}
                  onNav={nav}
                  onSelectAudit={(id: string) => nav('audit/' + id)}
                />
              }
            />
            <Route path="/servers" element={<ServersListPage onNav={nav} toast={toast} />} />
            <Route path="/servers/new" element={<ServerNewPage onNav={nav} toast={toast} />} />
            <Route path="/server/:id" element={<ServerDetailRouteAdapter nav={nav} toast={toast} />} />
            <Route path="/tools" element={<ToolsPage onNav={nav} toast={toast} />} />
            <Route
              path="/tool/:server_id/:name"
              element={<ToolDetailRouteAdapter nav={nav} toast={toast} />}
            />
            <Route path="/resources" element={<ResourcesPage onNav={nav} />} />
            <Route path="/prompts" element={<PromptsPage onNav={nav} />} />
            <Route
              path="/audit"
              element={<AuditPage onNav={nav} onOpenAudit={(id: string) => nav('audit/' + id)} initialAuditId={null} />}
            />
            <Route
              path="/audit/:auditId"
              element={<AuditPageRouteAdapter nav={nav} />}
            />
            <Route path="/breakers" element={<BreakersPage onNav={nav} toast={toast} />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/settings" element={<SettingsPage theme={theme} onTheme={setTheme} toast={toast} />} />
            <Route
              path="/help"
              element={
                <HelpPage
                  onNav={nav}
                  onStartTour={() => {
                    setTourActive(true);
                    setTourStep(0);
                  }}
                />
              }
            />
          </Routes>
        </div>
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNav={nav}
        recent={[
          { label: 'Dashboard', route: 'dashboard' },
          { label: 'openai-mcp', route: 'server/srv_01' },
          { label: 'github-mcp / create_issue', route: 'tool/srv_02/create_issue' },
        ]}
      />

      <AuditDrilldownRouteAdapter nav={nav} toast={toast} />

      <Tour
        active={tourActive}
        step={tourStep}
        onClose={() => {
          setTourActive(false);
          localStorage.setItem('mcp_tour_done', '1');
        }}
        onNext={() => {
          if (tourStep === TOUR_STEPS.length - 1) {
            setTourActive(false);
            localStorage.setItem('mcp_tour_done', '1');
          } else setTourStep(tourStep + 1);
        }}
      />
    </div>
  );
}

function ServerDetailRouteAdapter({ nav, toast }: any) {
  const { id } = useParams();
  return <ServerDetailPage serverId={id} onNav={nav} toast={toast} onOpenAudit={(aid: string) => nav('audit/' + aid)} />;
}

function ToolDetailRouteAdapter({ nav, toast }: any) {
  const { server_id, name } = useParams();
  return <ToolsPage onNav={nav} toast={toast} initialTool={{ server_id, name }} />;
}

function AuditPageRouteAdapter({ nav }: any) {
  const { auditId } = useParams();
  return <AuditPage onNav={nav} onOpenAudit={(id: string) => nav('audit/' + id)} initialAuditId={auditId} />;
}

function AuditDrilldownRouteAdapter({ nav, toast }: any) {
  // The drawer is intentionally mounted at App root (NOT inside a <Route>) so
  // it overlays the AuditPage while preserving the page's own scroll position
  // — same UX choice the prototype made. We still resolve the audit id via
  // react-router's `useMatch` so the routing tree owns the URL grammar; no
  // ad-hoc regex parsing of `location.pathname`.
  const match = useMatch('/audit/:auditId');
  const auditId = match?.params?.auditId ?? null;
  return <AuditDrilldown auditId={auditId} onClose={() => nav('audit')} toast={toast} />;
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
