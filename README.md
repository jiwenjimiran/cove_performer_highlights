# Performer Highlights Extension

Adds a red 1px border to favorite performers' `.performer-badge` badges in Cove cards, using `var(--color-red-400)`. Highlights follow the signed-in user's favorites, including newly loaded cards and changes made with Cove's favorite controls. No configuration required.

## Install

Requires **Cove 1.5.1 or newer**.

1. Download the ZIP from [the latest release](https://github.com/jiwenjimiran/cove_performer_highlights/releases/latest).
2. In Cove, open **Settings → Extensions → Install from ZIP**, select the ZIP, and confirm installation.
3. Enable the extension if needed and refresh Cove once. Favorite performer badges now have a red 1px border.

You can also use **Install from URL** with the release ZIP's download URL. Disabling or uninstalling the extension removes the highlights.

The extension reads favorite state through Cove's authenticated engagement API. It does not modify performers or favorites and makes no external requests. Read access to performer engagement is required. Badges must link to a performer; plain text badges without an identity are left alone. Other browser sessions' changes refresh within 30 seconds while the page is active.

## Development

Requires .NET 10 SDK, Node.js (compatible with jsdom 29), and PowerShell. Frontend modules use Cove's shared React runtime directly; no bundler is needed.

```powershell
npm ci
npm test
./scripts/package.ps1
```

The installable ZIP is written under `artifacts/`, with `extension.json` at its root. Published Cove contracts are build dependencies only and are excluded from the package.
