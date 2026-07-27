# Meta Instagram to Google Sheets Sync

This setup keeps your React dashboard reading from Google Sheets, while Meta supplies fresh reel metrics in the background.

The sheet structure for this version is:

```text
name | reelName | clipUrl | igMediaId | igViews | igLikes | igComments | igShares | igSaves | lastSyncedAt | publishedAt | fbViews | fbLikes | fbComments | fbShares | fbSaves | ttViews | ttLikes | ttComments | ttShares | ttSaves | totalViews | totalLikes | totalComments | totalShares | totalSaves
```

## What the script does

- Keeps your manual columns intact: `name`, `reelName`, `clipUrl`
- Stores the Meta reel identifier in `igMediaId`
- Pulls updated metrics from Meta using that `igMediaId`
- Writes fresh Instagram values into `igViews`, `igLikes`, `igComments`, `igShares`, `igSaves`
- Preserves Facebook, TikTok, and total columns for weekly/manual reporting
- Timestamps each sync in `lastSyncedAt`
- Stores the Instagram publish time from Meta in `publishedAt`

## Files

- Script: [instagram_sync.gs](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/automation/google-apps-script/instagram_sync.gs>)
- React parser updated to match this column order: [useReelsData.js](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/src/hooks/useReelsData.js>)

## What you need before starting

1. An Instagram **professional** account (`Business` or `Creator`)
2. That Instagram account connected to a Facebook Page
3. A Meta developer app with Instagram Graph API access
4. A Google Sheet for your dashboard

Meta help center references:

- [Professional accounts on Instagram](https://www.facebook.com/help/instagram/138925576505882)
- [About Instagram Insights](https://www.facebook.com/help/instagram/788388387972460)
- [Connect your professional Instagram account to a Facebook Page](https://www.facebook.com/help/instagram/402748553849926)

## Step-by-step setup

### 1. Prepare your Google Sheet

Create these headers in row 1:

```text
name | reelName | clipUrl | igMediaId | igViews | igLikes | igComments | igShares | igSaves | lastSyncedAt | publishedAt | fbViews | fbLikes | fbComments | fbShares | fbSaves | ttViews | ttLikes | ttComments | ttShares | ttSaves | totalViews | totalLikes | totalComments | totalShares | totalSaves
```

Fill at least:

- `name`
- `reelName`
- `clipUrl`

Leave these blank for now if you do not have them yet:

- `igMediaId`
- `igViews`
- `igLikes`
- `igComments`
- `igShares`
- `igSaves`
- `lastSyncedAt`
- `publishedAt`

### 2. Create your Meta app

In the Meta developer dashboard:

1. Create a new app
2. Choose a business-style app type if asked
3. Add the Instagram Graph API product
4. Add Facebook Login if the dashboard asks you to complete token setup through login

Note: Meta’s dashboard labels can shift over time, but the goal is always the same: create an app that can read media and insights from your Instagram professional account.

### 3. Make sure Instagram is properly connected

Confirm:

1. Your Instagram account is a `Business` or `Creator` account
2. It is connected to a Facebook Page you manage
3. The Facebook account you use in Meta has access to that Page

### 4. Generate the Meta credentials you need

You need these values:

```text
META_IG_ACCESS_TOKEN
META_IG_USER_ID
TARGET_SHEET_ID
TARGET_SHEET_NAME
META_CREATOR_NAME
```

Notes:

- `TARGET_SHEET_ID` is the long ID inside your Google Sheet URL
- `TARGET_SHEET_NAME` is usually `Sheet1`
- `META_CREATOR_NAME` is optional, but useful if you want the script to fill missing names

### 5. Add the Apps Script

1. Open your Google Sheet
2. Go to `Extensions -> Apps Script`
3. Delete the default code
4. Paste in the contents of [instagram_sync.gs](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/automation/google-apps-script/instagram_sync.gs>)
5. Save the script

### 6. Add Script Properties

In Apps Script:

`Project Settings -> Script Properties`

Add:

```text
META_IG_ACCESS_TOKEN = your-long-lived-meta-token
META_IG_USER_ID = your-instagram-user-id
META_CREATOR_NAME = optional display name
TARGET_SHEET_ID = your-google-sheet-id
TARGET_SHEET_NAME = Sheet1
```

### 7. Choose your starting path

You have two good options.

#### Option A: You already have rows in the sheet

Use this if your sheet already contains the clips you care about.

Run these functions in order:

1. `backfillMediaIdsFromSheet`
2. `syncInstagramInsightsToSheet`

What happens:

- `backfillMediaIdsFromSheet` tries to match each `clipUrl` to a Meta media permalink and fills `igMediaId`
- `syncInstagramInsightsToSheet` pulls the latest metrics for each row

#### Option B: You want Meta to build the rows for you

Use this if you want to start from your Instagram account directly.

Run these functions in order:

1. `bootstrapSheetFromInstagram`
2. Review the imported rows
3. Adjust `name` and `reelName` if needed
4. `syncInstagramInsightsToSheet`

What happens:

- `bootstrapSheetFromInstagram` writes reels into the sheet with `clipUrl` and `igMediaId`
- then the sync fills the metrics

### 8. Approve permissions

The first time you run a function, Google will ask for permission.

Approve:

- Spreadsheet access
- External request access
- Script execution permissions

### 9. Turn on scheduled syncing

Run one of these:

- `createHalfHourlyTrigger`
- `createQuarterHourlyTrigger`

Recommendations:

- `30 minutes` is a nice safe default
- `15 minutes` if you want it to feel more live

### 10. Check the website

Your React site already polls the sheet, so once the sheet updates, the site should update too.

The site lives here locally:

- `http://localhost:3000/`

## How row matching works

The script prefers:

1. `igMediaId` if it exists
2. otherwise `clipUrl`, matched against the Instagram media permalink

So the cleanest long-term setup is:

- store both `clipUrl` and `igMediaId`

## Best practices

- Use the real Instagram permalink in `clipUrl` if possible
- Once `igMediaId` is filled, do not change it unless the reel changed
- Keep one sheet row per reel

## Troubleshooting

### `No data rows found`

Your sheet has headers but no rows. Either:

- add rows manually and run `backfillMediaIdsFromSheet`
- or run `bootstrapSheetFromInstagram`

### Metrics stay at zero

Usually one of these:

- wrong `igMediaId`
- token lacks required permissions
- account is not professional
- account is not connected to the right Facebook Page
- that metric is not available for that media type in your account

### `igMediaId` does not fill automatically

Usually the `clipUrl` does not match Meta’s permalink exactly enough.

Try:

- pasting the reel’s direct Instagram permalink into `clipUrl`
- or running `bootstrapSheetFromInstagram` and copying the generated IDs

## Suggested workflow for you

1. Update the sheet headers
2. Paste your clip URLs
3. Set up the Meta app and token
4. Add Apps Script properties
5. Run `backfillMediaIdsFromSheet`
6. Run `syncInstagramInsightsToSheet`
7. Run `createHalfHourlyTrigger`

That gets you the simplest near-live version without changing your frontend architecture.

---

# Meta Ads API to Google Sheets Sync

This setup automates the Meta Ads data path while keeping the React website unchanged:

```text
Meta Marketing API -> Google Apps Script -> Google Sheet -> published CSV -> React website
```

The script writes automated campaign-level results to a separate test tab named
`Meta Ads API Test` by default. This protects the existing manually maintained
Meta Ads tab while you compare the API output against Meta Ads Manager.

## Files

- Script: [meta_ads_sync.gs](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/automation/google-apps-script/meta_ads_sync.gs>)
- Frontend parser: [metaAdsSheetParser.js](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/src/utils/metaAdsSheetParser.js>)
- Tested helper rules: [metaAdsApiHelpers.js](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/src/utils/metaAdsApiHelpers.js>)

## Sheet tab and headings

The test sync writes to:

```text
Meta Ads API Test
```

The script writes these existing dashboard-compatible headings exactly:

```text
Reporting starts | Reporting ends | Campaign name | Campaign delivery | Results | Result indicator | Cost per results | Ad set budget | Ad set budget type | Amount spent (AUD) | Impressions | Reach | Ends | Attribution setting | Results (initial) | Results (initial) indicator
```

It also appends these safe extra columns:

```text
Campaign ID | Frequency | Last synced
```

Extra columns are safe because the React Meta Ads parser reads columns by header
name and ignores unknown columns.

## Required Meta permissions

Your Meta token needs read access to the ad account and campaign insights.
Common permissions/scopes are:

```text
ads_read
read_insights
```

Depending on your Business Manager setup, Meta may also require appropriate
business/ad-account access for the user or system user that generated the token.

## 1. Open the Apps Script project

1. Open the Google Sheet used by the website.
2. Go to `Extensions -> Apps Script`.
3. Add a new script file or replace your test project code with
   [meta_ads_sync.gs](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/automation/google-apps-script/meta_ads_sync.gs>).
4. Save the project.

Do not paste access tokens into the spreadsheet, React app, or GitHub.

## 2. Add Script Properties

In Apps Script, open:

```text
Project Settings -> Script Properties
```

Add:

```text
META_ACCESS_TOKEN = your Meta token
META_AD_ACCOUNT_ID = your ad account ID, with or without act_
META_API_VERSION = v23.0
META_ADS_TEST_SHEET_NAME = Meta Ads API Test
```

`META_API_VERSION` can be changed later when Meta deprecates a version.
`META_ADS_TEST_SHEET_NAME` is optional; the script uses `Meta Ads API Test`
when it is missing.

Never commit or publish these values.

## 3. Run `testMetaConnection()`

In Apps Script:

1. Select `testMetaConnection`.
2. Click `Run`.
3. Approve permissions on first use.

Google will ask for:

- Spreadsheet access
- External request access
- Script execution permissions

If the Meta request fails, the script throws an error containing the HTTP
status, Meta error message, error type, and error code where Meta provides them.
The access token is never logged.

## 4. Run `syncMetaAdsData()` manually

After `testMetaConnection()` succeeds:

1. Select `syncMetaAdsData`.
2. Click `Run`.
3. Open the `Meta Ads API Test` sheet tab.

The script fetches campaign-level insights for the previous 90 days. To change
that window, edit this clearly named constant in the script:

```javascript
const META_ADS_REPORTING_LOOKBACK_DAYS = 90;
```

The sync replaces the complete contents of the test tab only after the Meta API
fetch and parsing complete successfully. A failed or partial fetch will not
overwrite valid test-tab data.

## 5. Compare against Meta Ads Manager

In Meta Ads Manager:

1. Use the same date range as the script.
2. View campaign-level reporting.
3. Compare:
   - Campaign name
   - Amount spent
   - Impressions
   - Reach
   - Leads
   - Cost per lead

The script counts only accepted lead/enquiry action types. It does not count
link clicks, landing-page views, engagement, impressions, or reach as leads.
Unknown action types are not silently counted.

## 6. Create the six-hour trigger

When the test tab matches expectations:

1. Select `createMetaSyncTrigger`.
2. Click `Run`.

The function removes duplicate `syncMetaAdsData` triggers first, then creates
one time-driven trigger that runs every six hours.

## 7. Delete the trigger

To stop automated syncing:

1. Select `deleteMetaSyncTriggers`.
2. Click `Run`.

Only triggers whose handler is `syncMetaAdsData` are deleted. Instagram or other
project triggers are left alone.

## 8. Rotate or replace an expired token

When a Meta token expires or is replaced:

1. Generate a new valid token in Meta.
2. Open Apps Script `Project Settings -> Script Properties`.
3. Replace only `META_ACCESS_TOKEN`.
4. Run `testMetaConnection()`.
5. Run `syncMetaAdsData()` manually once before relying on the trigger.

Do not publish the token in the sheet, React code, docs, GitHub issues, pull
requests, screenshots, or chat messages.

## Current limitations

- Version one writes campaign-level rows, not ad-set or ad-level rows.
- `Ad set budget` and `Ad set budget type` are left blank because the campaign
  insights request does not provide a reliable campaign-level value for those
  export columns.
- `Results (initial)` columns are left blank because the API response does not
  provide the same export-only initial-result fields.
- The script writes to `Meta Ads API Test` first. Move the published CSV to this
  tab only after you have compared the output and are happy with it.
