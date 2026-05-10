# Meta Instagram to Google Sheets Sync

This setup keeps your React dashboard reading from Google Sheets, while Meta supplies fresh reel metrics in the background.

The sheet structure for this version is:

```text
name | reelName | clipUrl | igMediaId | views | likes | comments | reshares | saves | lastSyncedAt | publishedAt
```

## What the script does

- Keeps your manual columns intact: `name`, `reelName`, `clipUrl`
- Stores the Meta reel identifier in `igMediaId`
- Pulls updated metrics from Meta using that `igMediaId`
- Writes fresh values into `views`, `likes`, `comments`, `reshares`, `saves`
- Timestamps each sync in `lastSyncedAt`
- Stores the Instagram publish time from Meta in `publishedAt`

## Files

- Script: [instagram_sync.gs](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/automation/google-apps-script/instagram_sync.gs>)
- React parser updated to match this column order: [App.js](</Users/nickraschilla/Desktop/Test Website/Test-Website/react-test-website/src/App.js>)

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
name | reelName | clipUrl | igMediaId | views | likes | comments | reshares | saves | lastSyncedAt | publishedAt
```

Fill at least:

- `name`
- `reelName`
- `clipUrl`

Leave these blank for now if you do not have them yet:

- `igMediaId`
- `views`
- `likes`
- `comments`
- `reshares`
- `saves`
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
