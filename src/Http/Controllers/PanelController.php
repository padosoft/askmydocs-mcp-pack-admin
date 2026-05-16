<?php

declare(strict_types=1);

namespace Padosoft\AskMyDocsMcpPackAdmin\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Routing\Controller;

/**
 * Single entrypoint: returns the Blade shell that boots the React SPA.
 *
 * Every URL under the configured mount_prefix lands here. The SPA's
 * react-router-dom handles the per-page rendering client-side.
 */
class PanelController extends Controller
{
    public function __invoke(): View
    {
        $config = [
            'api_base' => (string) config('mcp-pack-admin.api_base', '/api/admin/mcp-pack'),
            'mount_prefix' => '/'.ltrim((string) config('mcp-pack-admin.mount_prefix', 'admin/mcp-pack'), '/'),
            'theme_default' => (string) config('mcp-pack-admin.theme_default', 'dark'),
            'asset_path' => '/'.ltrim((string) config('mcp-pack-admin.asset_path', 'vendor/mcp-pack-admin'), '/'),
        ];

        return view('mcp-pack-admin::panel', [
            'mcpPackAdmin' => $config,
        ]);
    }
}
