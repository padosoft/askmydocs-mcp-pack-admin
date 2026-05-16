<?php

declare(strict_types=1);

namespace Padosoft\AskMyDocsMcpPackAdmin\Tests\Unit;

use Padosoft\AskMyDocsMcpPackAdmin\Tests\TestCase;

class ConfigDefaultsTest extends TestCase
{
    public function test_default_mount_prefix(): void
    {
        $this->assertSame('admin/mcp-pack', $this->app['config']->get('mcp-pack-admin.mount_prefix'));
    }

    public function test_default_api_base(): void
    {
        $this->assertSame('/api/admin/mcp-pack', $this->app['config']->get('mcp-pack-admin.api_base'));
    }

    public function test_default_theme_is_dark(): void
    {
        $this->assertSame('dark', $this->app['config']->get('mcp-pack-admin.theme_default'));
    }

    public function test_middleware_resolves_from_env_csv(): void
    {
        // The defineEnvironment() override in TestCase forces ['web'] for the
        // mount-shell tests. For the CSV-parsing assertion we re-evaluate the
        // closure shipped in `config/mcp-pack-admin.php` directly so we are
        // testing the parser, not the test bootstrap.
        $config = require __DIR__.'/../../config/mcp-pack-admin.php';
        $this->assertIsArray($config['middleware']);
        $this->assertContains('web', $config['middleware']);

        // CSV override produces a clean trimmed array.
        putenv('MCP_PACK_ADMIN_MIDDLEWARE=web, auth , verified');
        $reread = require __DIR__.'/../../config/mcp-pack-admin.php';
        $this->assertSame(['web', 'auth', 'verified'], $reread['middleware']);
        putenv('MCP_PACK_ADMIN_MIDDLEWARE');

        // Empty / whitespace-only env value falls back to ['web'], never an
        // empty middleware array (that would silently disable session + CSRF).
        putenv('MCP_PACK_ADMIN_MIDDLEWARE=   ');
        $fallback = require __DIR__.'/../../config/mcp-pack-admin.php';
        $this->assertSame(['web'], $fallback['middleware']);
        putenv('MCP_PACK_ADMIN_MIDDLEWARE');
    }
}
