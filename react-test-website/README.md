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

The Google Apps Script sync lives in `automation/google-apps-script/instagram_sync.gs`. It can bootstrap rows from Instagram, backfill media IDs, and sync Instagram metrics into the sheet.
