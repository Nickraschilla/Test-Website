# Premier Data Social Dashboard

A Create React App dashboard for tracking 2026 social reel performance. The site reads a published Google Sheet CSV, ranks Instagram reels by momentum, and provides month/coder filters plus clip previews.

## Local Development

```bash
npm start
```

Runs the site at `http://localhost:3000/`.

## Checks

```bash
npm test -- --watchAll=false
npm run build
```

## Project Documentation

See [PROJECT.md](./PROJECT.md) for architecture, data flow, metric rules, coding standards, known technical debt, and the future housekeeping roadmap.

## Data Source

The frontend loads the published Google Sheet CSV in `src/hooks/useReelsData.js`. The expected sheet headers are documented in `automation/google-apps-script/SETUP.md`.

## Automation

Google Apps Script sync files live in `automation/google-apps-script/`:

- `instagram_sync.gs` bootstraps rows from Instagram, backfills media IDs, and syncs Instagram metrics.
- `meta_ads_sync.gs` syncs campaign-level Meta Ads insights into the `Meta Ads API Test` tab.

Setup steps and credential safety notes are documented in `automation/google-apps-script/SETUP.md`.
