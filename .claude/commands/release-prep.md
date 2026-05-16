# /release-prep

Run the pre-release gate locally. Use this before tagging a new version.

## What it does

1. Verifies a clean working tree (`git status --porcelain` must be empty).
2. Installs PHP deps via `composer install --no-interaction --prefer-dist`.
3. Installs JS deps via `npm ci`.
4. Builds the SPA via `npm run build`.
5. Runs PHPUnit (`vendor/bin/phpunit`).
6. Runs Vitest (`npx vitest run`).
7. Runs Playwright (`npx playwright test`).
8. Reports a single PASS/FAIL summary.

## Usage

The agent should run each step in sequence and stop on the first failure.
Surface the failing command's output verbatim so the operator can react.

When all gates pass, suggest the next semver tag and the matching CHANGELOG
entry skeleton.
