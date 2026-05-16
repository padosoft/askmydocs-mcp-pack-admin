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
        // Default value (provider already merged).
        $middleware = $this->app['config']->get('mcp-pack-admin.middleware');
        $this->assertIsArray($middleware);
        $this->assertContains('web', $middleware);
    }
}
