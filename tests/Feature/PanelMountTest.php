<?php

declare(strict_types=1);

namespace Padosoft\AskMyDocsMcpPackAdmin\Tests\Feature;

use Padosoft\AskMyDocsMcpPackAdmin\Tests\TestCase;

class PanelMountTest extends TestCase
{
    public function test_root_mount_returns_html_shell(): void
    {
        $response = $this->get('/admin/mcp-pack');

        $response->assertOk();
        $response->assertSee('mcp-pack-admin-root', false);
        $response->assertSee('window.__MCP_PACK_ADMIN__', false);
    }

    public function test_deep_link_also_returns_html_shell(): void
    {
        $response = $this->get('/admin/mcp-pack/servers');

        $response->assertOk();
        $response->assertSee('mcp-pack-admin-root', false);
    }

    public function test_audit_drilldown_deep_link_also_returns_html_shell(): void
    {
        $response = $this->get('/admin/mcp-pack/audit/aud_demo_123');

        $response->assertOk();
        $response->assertSee('mcp-pack-admin-root', false);
    }

    public function test_panel_exposes_api_base_to_spa_runtime(): void
    {
        $this->app['config']->set('mcp-pack-admin.api_base', '/api/admin/mcp-pack');

        $response = $this->get('/admin/mcp-pack');

        $response->assertSee('"api_base":"\/api\/admin\/mcp-pack"', false);
    }
}
