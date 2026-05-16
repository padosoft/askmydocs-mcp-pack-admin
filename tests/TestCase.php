<?php

declare(strict_types=1);

namespace Padosoft\AskMyDocsMcpPackAdmin\Tests;

use Orchestra\Testbench\TestCase as BaseTestCase;
use Padosoft\AskMyDocsMcpPackAdmin\McpPackAdminServiceProvider;

abstract class TestCase extends BaseTestCase
{
    /**
     * @param  \Illuminate\Foundation\Application  $app
     * @return array<int,class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [McpPackAdminServiceProvider::class];
    }

    protected function defineEnvironment($app): void
    {
        // Disable middleware that would 302 us out of the test on a fresh app.
        $app['config']->set('mcp-pack-admin.middleware', ['web']);
        $app['config']->set('mcp-pack-admin.mount_prefix', 'admin/mcp-pack');
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    }
}
