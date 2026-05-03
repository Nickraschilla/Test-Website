const GRAPH_API_VERSION = "v23.0";
const DEFAULT_SHEET_NAME = "Sheet1";
const MEDIA_LIMIT = 100;
const HEADER_ROW = [
  "name",
  "reelName",
  "clipUrl",
  "igMediaId",
  "views",
  "likes",
  "comments",
  "reshares",
  "saves",
  "lastSyncedAt",
];

function syncInstagramInsightsToSheet() {
  const config = getConfig_();
  const sheet = getSheet_(config.sheetId, config.sheetName);
  ensureHeaderRow_(sheet);

  const existingRows = readSheetRows_(sheet);
  if (!existingRows.length) {
    throw new Error(
      "No data rows found. Add rows manually first or run bootstrapSheetFromInstagram()."
    );
  }

  const mediaItems = fetchMedia_(config);
  const mediaById = {};
  const mediaByPermalink = {};

  mediaItems.forEach((media) => {
    mediaById[media.id] = media;

    if (media.permalink) {
      mediaByPermalink[normalizeUrl_(media.permalink)] = media;
    }
  });

  const syncedRows = existingRows.map((row) =>
    syncSheetRow_(config, row, mediaById, mediaByPermalink)
  );

  writeRows_(sheet, syncedRows);
}

function bootstrapSheetFromInstagram() {
  const config = getConfig_();
  const sheet = getSheet_(config.sheetId, config.sheetName);
  const mediaItems = fetchMedia_(config);

  const rows = mediaItems.map((media) => [
    config.creatorName,
    buildReelName_(media),
    media.permalink || "",
    media.id,
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  writeRows_(sheet, rows);
}

function backfillMediaIdsFromSheet() {
  const config = getConfig_();
  const sheet = getSheet_(config.sheetId, config.sheetName);
  ensureHeaderRow_(sheet);

  const existingRows = readSheetRows_(sheet);
  const mediaItems = fetchMedia_(config);
  const mediaByPermalink = {};

  mediaItems.forEach((media) => {
    if (media.permalink) {
      mediaByPermalink[normalizeUrl_(media.permalink)] = media;
    }
  });

  const updatedRows = existingRows.map((row) => {
    if (row.igMediaId) {
      return rowToArray_(row);
    }

    const matchedMedia = findMediaForRow_(row, mediaByPermalink);
    return rowToArray_({
      ...row,
      igMediaId: matchedMedia ? matchedMedia.id : row.igMediaId,
      clipUrl: row.clipUrl || (matchedMedia ? matchedMedia.permalink || "" : ""),
    });
  });

  writeRows_(sheet, updatedRows);
}

function getConfig_() {
  const props = PropertiesService.getScriptProperties();

  const config = {
    accessToken: props.getProperty("META_IG_ACCESS_TOKEN"),
    instagramUserId: props.getProperty("META_IG_USER_ID"),
    creatorName: props.getProperty("META_CREATOR_NAME") || "",
    sheetId: props.getProperty("TARGET_SHEET_ID"),
    sheetName: props.getProperty("TARGET_SHEET_NAME") || DEFAULT_SHEET_NAME,
  };

  const missing = Object.entries({
    META_IG_ACCESS_TOKEN: config.accessToken,
    META_IG_USER_ID: config.instagramUserId,
    TARGET_SHEET_ID: config.sheetId,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error("Missing script properties: " + missing.join(", "));
  }

  return config;
}

function getSheet_(sheetId, sheetName) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureHeaderRow_(sheet) {
  const currentHeaders = sheet
    .getRange(1, 1, 1, HEADER_ROW.length)
    .getValues()[0]
    .map((value) => String(value || "").trim());

  const matches = HEADER_ROW.every((header, index) => currentHeaders[index] === header);

  if (!matches) {
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
  }
}

function readSheetRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADER_ROW.length).getValues();

  return values
    .map((row) => ({
      name: row[0] || "",
      reelName: row[1] || "",
      clipUrl: row[2] || "",
      igMediaId: row[3] || "",
      views: Number(row[4] || 0),
      likes: Number(row[5] || 0),
      comments: Number(row[6] || 0),
      reshares: Number(row[7] || 0),
      saves: Number(row[8] || 0),
      lastSyncedAt: row[9] || "",
    }))
    .filter((row) => row.name || row.reelName || row.clipUrl || row.igMediaId);
}

function fetchMedia_(config) {
  const fields = [
    "id",
    "caption",
    "timestamp",
    "permalink",
    "media_product_type",
    "media_type",
    "like_count",
    "comments_count",
  ];

  const url =
    "https://graph.facebook.com/" +
    GRAPH_API_VERSION +
    "/" +
    encodeURIComponent(config.instagramUserId) +
    "/media?fields=" +
    encodeURIComponent(fields.join(",")) +
    "&limit=" +
    MEDIA_LIMIT +
    "&access_token=" +
    encodeURIComponent(config.accessToken);

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const payload = JSON.parse(response.getContentText());

  if (response.getResponseCode() >= 400) {
    throw new Error("Meta media fetch failed: " + response.getContentText());
  }

  return payload.data || [];
}

function syncSheetRow_(config, row, mediaById, mediaByPermalink) {
  const matchedMedia =
    mediaById[row.igMediaId] || findMediaForRow_(row, mediaByPermalink) || null;

  if (!matchedMedia) {
    return rowToArray_({
      ...row,
      lastSyncedAt: buildTimestamp_(),
    });
  }

  const insights = fetchInsightsWithFallback_(config.accessToken, matchedMedia.id);

  return rowToArray_({
    name: row.name || config.creatorName,
    reelName: row.reelName || buildReelName_(matchedMedia),
    clipUrl: row.clipUrl || matchedMedia.permalink || "",
    igMediaId: matchedMedia.id,
    views: getMetricValue_(insights, ["views", "plays", "video_views", "impressions"]),
    likes: matchedMedia.like_count || getMetricValue_(insights, ["likes"]),
    comments:
      matchedMedia.comments_count || getMetricValue_(insights, ["comments"]),
    reshares: getMetricValue_(insights, ["shares"]),
    saves: getMetricValue_(insights, ["saved"]),
    lastSyncedAt: buildTimestamp_(),
  });
}

function findMediaForRow_(row, mediaByPermalink) {
  if (!row.clipUrl) {
    return null;
  }

  const normalizedClipUrl = normalizeUrl_(row.clipUrl);
  return mediaByPermalink[normalizedClipUrl] || null;
}

function buildReelName_(media) {
  const caption = (media.caption || "").trim();
  if (caption) {
    return caption.length > 80 ? caption.slice(0, 77) + "..." : caption;
  }

  return media.permalink || media.id;
}

function fetchInsightsWithFallback_(accessToken, mediaId) {
  const metricSets = [
    ["views", "likes", "comments", "shares", "saved"],
    ["plays", "likes", "comments", "shares", "saved"],
    ["video_views", "likes", "comments", "shares", "saved"],
    ["impressions", "reach", "shares", "saved"],
  ];

  for (let i = 0; i < metricSets.length; i += 1) {
    const metrics = metricSets[i];
    const result = fetchInsights_(accessToken, mediaId, metrics);

    if (result.ok) {
      return result.metrics;
    }
  }

  return {};
}

function fetchInsights_(accessToken, mediaId, metrics) {
  const url =
    "https://graph.facebook.com/" +
    GRAPH_API_VERSION +
    "/" +
    encodeURIComponent(mediaId) +
    "/insights?metric=" +
    encodeURIComponent(metrics.join(",")) +
    "&access_token=" +
    encodeURIComponent(accessToken);

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const payload = JSON.parse(response.getContentText());

  if (response.getResponseCode() >= 400) {
    return { ok: false, metrics: {}, error: payload };
  }

  const values = {};
  (payload.data || []).forEach((item) => {
    const metricValue = Array.isArray(item.values)
      ? item.values[0] && item.values[0].value
      : item.value;

    values[item.name] = Number(metricValue || 0);
  });

  return { ok: true, metrics: values };
}

function getMetricValue_(metrics, names) {
  for (let i = 0; i < names.length; i += 1) {
    const key = names[i];
    if (metrics[key] !== undefined) {
      return Number(metrics[key]) || 0;
    }
  }

  return 0;
}

function normalizeUrl_(url) {
  return String(url || "")
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function buildTimestamp_() {
  return new Date().toISOString();
}

function rowToArray_(row) {
  return [
    row.name || "",
    row.reelName || "",
    row.clipUrl || "",
    row.igMediaId || "",
    Number(row.views || 0),
    Number(row.likes || 0),
    Number(row.comments || 0),
    Number(row.reshares || 0),
    Number(row.saves || 0),
    row.lastSyncedAt || "",
  ];
}

function writeRows_(sheet, rows) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);

  if (!rows.length) {
    return;
  }

  sheet.getRange(2, 1, rows.length, HEADER_ROW.length).setValues(rows);
}

function createHalfHourlyTrigger() {
  deleteSyncTriggers();
  ScriptApp.newTrigger("syncInstagramInsightsToSheet")
    .timeBased()
    .everyMinutes(30)
    .create();
}

function createQuarterHourlyTrigger() {
  deleteSyncTriggers();
  ScriptApp.newTrigger("syncInstagramInsightsToSheet")
    .timeBased()
    .everyMinutes(15)
    .create();
}

function deleteSyncTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === "syncInstagramInsightsToSheet") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}
