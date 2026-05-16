@php
    $assetPath = rtrim($mcpPackAdmin['asset_path'] ?? '/vendor/mcp-pack-admin', '/');
    $manifestPath = public_path(ltrim($assetPath, '/').'/.vite/manifest.json');
    $manifest = file_exists($manifestPath) ? json_decode((string) file_get_contents($manifestPath), true) : null;
    $entry = is_array($manifest) ? ($manifest['resources/js/main.tsx'] ?? null) : null;
@endphp
<!doctype html>
<html lang="en" data-theme="{{ $mcpPackAdmin['theme_default'] ?? 'dark' }}">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="csrf-token" content="{{ csrf_token() }}"/>
    <title>MCP Pack · Admin Panel</title>
    <link rel="icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='5' fill='%234F46E5'/><path d='M5 5l7 4-7 4M19 5l-7 4 7 4M5 13l7 4-7 4M19 13l-7 4 7 4' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>"/>
    @if ($entry)
        @if (!empty($entry['css']))
            @foreach ($entry['css'] as $cssFile)
                <link rel="stylesheet" href="{{ $assetPath.'/'.$cssFile }}"/>
            @endforeach
        @endif
    @else
        {{-- Dev fallback: the build hasn't run yet, so we surface a friendly hint
             rather than a blank page. Production deploys always have the manifest. --}}
    @endif
    <script>
        window.__MCP_PACK_ADMIN__ = @json($mcpPackAdmin);
    </script>
</head>
<body>
    <div id="mcp-pack-admin-root">
        @unless ($entry)
            <div style="font-family:system-ui;padding:40px;color:#444">
                <h2>MCP Pack Admin — assets not built</h2>
                <p>Run <code>npm install &amp;&amp; npm run build</code> in the package directory,
                   or publish a pre-built bundle via
                   <code>php artisan vendor:publish --tag=mcp-pack-admin-assets</code>.</p>
            </div>
        @endunless
    </div>
    @if ($entry)
        <script type="module" src="{{ $assetPath.'/'.$entry['file'] }}"></script>
    @endif
</body>
</html>
