<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Padosoft\AskMyDocsMcpPackAdmin\Http\Controllers\PanelController;

Route::prefix((string) config('mcp-pack-admin.mount_prefix', 'admin/mcp-pack'))
    ->middleware(config('mcp-pack-admin.middleware', ['web', 'auth']))
    ->name('mcp-pack-admin.')
    ->group(function (): void {
        // SPA catch-all: every URL under the mount prefix renders the same
        // Blade shell; react-router-dom decides which page to mount.
        Route::get('/{any?}', PanelController::class)
            ->where('any', '.*')
            ->name('panel');
    });
