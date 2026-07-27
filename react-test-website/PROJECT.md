# Premier Data Reporting Dashboard

## Purpose

This project is a Create React App dashboard for Premier Data social reporting. It has two report surfaces:

- `Instagram Reporting`: the default page, focused on Instagram post/content-type performance.
- `Socials Reporting`: a leaderboard for reel performance across Instagram, Facebook, TikTok, or selected platform combinations.

The app is read-only from the browser. It pulls published Google Sheets CSV data, normalises the rows, calculates summary metrics in the client, and renders dashboard tables/charts.

## Architecture

```text
public/
  Brand and content-type image assets used directly by the React app.

src/
  App.js
    Main application composition, page/tab routing, Instagram analytics calculations,
    leaderboard state, and dashboard rendering.

  App.css
    Global visual system and all dashboard-specific layout/styling.

  hooks/useReelsData.js
    Google Sheets CSV loading, parsing, refresh polling, and loading/error state.

  utils/reels.js
    Shared metric utilities: number parsing, platform metric selection, totals,
    date/month helpers, momentum score, sorting, and clip URL presentation.

  config/instagramContent.js
    Canonical Instagram content tabs, content-label normalisation, profile images,
    and selected content-type banner theme classes.

  components/
    Reusable Socials Reporting components: dashboard hero, contributor summary,
    leaderboard table, mini stat cards, and clip modal.

automation/google-apps-script/
  Apps Script used to bootstrap/sync Instagram metrics into Google Sheets.
```

## Data Flow

1. `useReelsData` loads two published Google Sheets CSV feeds:
   - Socials Reporting sheet
   - Instagram Reporting sheet
2. `parseSheetResults` maps rows by header name, with legacy fallback indexes for older sheet layouts.
3. Platform metrics are parsed into per-platform fields (`igViews`, `fbViews`, `ttViews`, etc.) and combined totals (`views`, `likes`, `comments`, `reshares`, `saves`).
4. `App.js` transforms rows for the active report:
   - Socials Reporting filters 2026 reels, applies selected platform metrics, ranks by momentum, and builds contributor/month totals.
   - Instagram Reporting builds month summaries, content-type totals, interaction breakdown rows, KPI cards, and trend bars.
5. The UI refreshes sheet data every 60 seconds and reloads immediately when the browser tab becomes visible again.

## Metric Rules

- `views`, `likes`, `comments`, `shares`, and `saves` come from the sheet parser.
- In code, shares are stored as `reshares` for historical compatibility.
- `interactions = likes + comments + shares + saves`.
- `profileVisits` is currently approximated as `comments + shares` because no dedicated profile-visit field exists in the sheet feed.
- Averages divide by `postCount`; totals use raw sums.
- Momentum score for Socials Reporting is time-adjusted:

```text
(views * 0.04 + likes + comments * 4 + shares * 7 + saves * 6) / liveDays
```

`liveDays` has a minimum divisor of 5 to avoid over-ranking very new posts.

## Coding Standards

- Preserve the current UI unless a change is explicitly requested or fixes a bug.
- Keep Google Sheet header support backward compatible where possible.
- Prefer shared helpers for calculations used by multiple tables.
- Keep metric formulas centralised; do not duplicate interaction or average calculations inline.
- Use `useMemo` for derived dashboard datasets that depend on sheet rows or filters.
- Add tests for utility/calculation changes before changing the UI.
- Keep assets in `public/` when they are referenced by string paths from sheet/content config.
- Avoid committing generated deployment output unless the hosting workflow explicitly requires it.

## Testing

Run before pushing:

```bash
npm test -- --watchAll=false
npm run build
```

Current test coverage includes:

- App tab/default-page behaviour, active loading state, and active error state.
- Sheet parser handling of explicit zero totals, blank total fallback, and empty rows.
- Core metric utilities for number parsing, platform selection, sorting, live-day scoring, and clip URL handling.

## Reliability Notes

- Sheet parsing treats explicit `0` totals as real values, not blanks.
- Blank total columns fall back to summed platform metrics.
- CSV parse errors surface through the existing dashboard error state.
- The active tab controls which loading and error states are shown, preventing hidden Socials Reporting failures from blocking Instagram Reporting.

## Known Technical Debt

- `App.js` is still too large and owns both page composition and a lot of Instagram analytics logic.
- `App.css` is large and global; future style changes can have unintended cross-page effects.
- Instagram analytics helpers are currently local to `App.js`; they should eventually move into a dedicated tested utility module.
- Profile visits are estimated, not sourced from a first-class sheet/API field.
- The app has no checked-in deployment configuration, so live hosting depends on external GitHub/Vercel/Netlify settings.
- Google Apps Script and frontend header expectations must be kept in sync manually.

## Future Roadmap

Next housekeeping candidates:

- Extract `InstagramContentPage` and its analytics helpers into dedicated files.
- Move content-type summary helpers into a tested `src/utils/instagramAnalytics.js`.
- Add integration tests with representative Instagram and Socials sheet fixtures.
- Add deployment documentation once the live host and URL are confirmed.
- Add a typed schema or runtime validator for sheet rows to make sheet changes safer.
- Split `App.css` into report/page/component styles after the component extraction.
