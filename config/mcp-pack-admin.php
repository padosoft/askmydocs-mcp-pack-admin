<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Route mount prefix
    |--------------------------------------------------------------------------
    | The URI prefix where the admin SPA is mounted in the host application.
    | Override with the MCP_PACK_ADMIN_PREFIX env variable.
    */
    'mount_prefix' => env('MCP_PACK_ADMIN_PREFIX', 'admin/mcp-pack'),

    /*
    |--------------------------------------------------------------------------
    | Middleware stack
    |--------------------------------------------------------------------------
    | Applied to every admin route. Defaults to ['web', 'auth'] so the host
    | session + the configured authenticator gate access. Override via the
    | MCP_PACK_ADMIN_MIDDLEWARE env variable as a comma-separated list.
    |
    | An empty / whitespace-only env value falls back to ['web']: we never
    | ship an empty middleware array because that would silently disable
    | session, CSRF and the session-driven authenticator.
    */
    'middleware' => (function (): array {
        $resolved = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('MCP_PACK_ADMIN_MIDDLEWARE', 'web,auth')),
        ), static fn (string $name): bool => $name !== ''));

        return $resolved !== [] ? $resolved : ['web'];
    })(),

    /*
    |--------------------------------------------------------------------------
    | Backend API base URL
    |--------------------------------------------------------------------------
    | The SPA reads the v1.4 admin routes from padosoft/askmydocs-mcp-pack at
    | this base URL. Defaults to the conventional `/api/admin/mcp-pack`
    | namespace exposed by the parent package.
    */
    'api_base' => env('MCP_PACK_ADMIN_API_BASE', '/api/admin/mcp-pack'),

    /*
    |--------------------------------------------------------------------------
    | Default theme
    |--------------------------------------------------------------------------
    | 'dark' or 'light'. Persisted per-user in localStorage by the SPA, but
    | this value seeds the initial render before JS hydrates so the
    | first-paint matches the user's preference.
    */
    'theme_default' => env('MCP_PACK_ADMIN_THEME', 'dark'),

    /*
    |--------------------------------------------------------------------------
    | Built-asset publish location
    |--------------------------------------------------------------------------
    | Relative to public_path(). Override only if your host serves vendor
    | assets from a non-standard location.
    */
    'asset_path' => env('MCP_PACK_ADMIN_ASSET_PATH', 'vendor/mcp-pack-admin'),
];
