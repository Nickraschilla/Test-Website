const GRAPH_API_VERSION = "v23.0";
const DEFAULT_SHEET_NAME = "Sheet1";
const MEDIA_LIMIT = 100;
const HEADER_ROW = [
  "name",
  "reelName",
  "clipUrl",
  "igMediaId",
  "igViews",
  "igLikes",
  "igComments",
  "igShares",
  "igSaves",
  "lastSyncedAt",
  "publishedAt",
  "fbViews",
  "fbLikes",
  "fbComments",
  "fbShares",
  "fbSaves",
  "totalViews",
  "totalLikes",
  "totalComments",
  "totalShares",
  "totalSaves",
];

function syncInstagramInsightsToSheet() {
  const config = getConfig_();
  const sheet = getSheet_(config.sheetId, config.sheetName);
  ensureHeaderRow_(sheet);

  const headerMap = getHeaderMap_(sheet);
  const existingRows = readSheetRows_(sheet, headerMap);
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

  existingRows.forEach((row) => {
    syncSheetRowInPlace_(config, sheet, headerMap, row, mediaById, mediaByPermalink);
  });
}

function bootstrapSheetFromInstagram() {
  const config = getConfig_();
  const sheet = getSheet_(config.sheetId, config.sheetName);
  ensureHeaderRow_(sheet);

  const headerMap = getHeaderMap_(sheet);
  const existingRows = readSheetRows_(sheet, headerMap);
  const existingKeys = {};

  existingRows.forEach((row) => {
    if (row.igMediaId) {
      existingKeys["id:" + row.igMediaId] = true;
    }

    if (row.clipUrl) {
      existingKeys["url:" + normalizeUrl_(row.clipUrl)] = true;
    }
  });

  const mediaItems = fetchMedia_(config);
  const newRows = mediaItems
    .filter((media) => {
      const idKey = "id:" + media.id;
      const urlKey = "url:" + normalizeUrl_(media.permalink || "");
      return !existingKeys[idKey] && !existingKeys[urlKey];
    })
    .map((media) => buildSheetRowForMedia_(config, headerMap, sheet.getLastColumn(), media));

  if (newRows.length) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, newRows.length, sheet.getLastColumn())
      .setValues(newRows);
  }
}

function backfillMediaIdsFromSheet() {
  const config = getConfig_();
  const sheet = getSheet_(config.sheetId, config.sheetName);
  ensureHeaderRow_(sheet);

  const headerMap = getHeaderMap_(sheet);
  const existingRows = readSheetRows_(sheet, headerMap);
  const mediaItems = fetchMedia_(config);
  const mediaById = {};
  const mediaByPermalink = {};

  mediaItems.forEach((media) => {
    mediaById[media.id] = media;

    if (media.permalink) {
      mediaByPermalink[normalizeUrl_(media.permalink)] = media;
    }
  });

  existingRows.forEach((row) => {
    const matchedMedia =
      mediaById[row.igMediaId] || findMediaForRow_(row, mediaByPermalink);

    if (!matchedMedia) {
      return;
    }

    setCellByHeader_(sheet, headerMap, row.rowNumber, "igMediaId", row.igMediaId || matchedMedia.id);
    setCellByHeader_(sheet, headerMap, row.rowNumber, "clipUrl", row.clipUrl || matchedMedia.permalink || "");
    setCellByHeader_(sheet, headerMap, row.rowNumber, "publishedAt", row.publishedAt || matchedMedia.timestamp || "");
  });
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
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaderValues = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map((value) => String(value || "").trim());
  const currentHeaders = currentHeaderValues.filter(Boolean);
  const normalizedCurrentHeaders = currentHeaders.map((header) =>
    header.toLowerCase()
  );

  if (!currentHeaders.length) {
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
    return;
  }

  const missingHeaders = HEADER_ROW.filter(
    (header) => normalizedCurrentHeaders.indexOf(header.toLowerCase()) === -1
  );

  if (missingHeaders.length) {
    sheet
      .getRange(1, lastColumn + 1, 1, missingHeaders.length)
      .setValues([missingHeaders]);
  }
}

function getHeaderMap_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), HEADER_ROW.length);
  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map((value) => String(value || "").trim());

  return headers.reduce((map, header, index) => {
    if (header) {
      if (map[header] === undefined) {
        map[header] = index;
      }

      if (map[header.toLowerCase()] === undefined) {
        map[header.toLowerCase()] = index;
      }
    }
    return map;
  }, {});
}

function getRowValue_(row, headerMap, header) {
  const index = headerMap[header] !== undefined ? headerMap[header] : headerMap[header.toLowerCase()];
  return index === undefined ? "" : row[index];
}

function setCellByHeader_(sheet, headerMap, rowNumber, header, value) {
  const index = headerMap[header] !== undefined ? headerMap[header] : headerMap[header.toLowerCase()];
  if (index === undefined) {
    return;
  }

  sheet.getRange(rowNumber, index + 1).setValue(value);
}

function setValueByHeader_(row, headerMap, header, value) {
  const index = headerMap[header] !== undefined ? headerMap[header] : headerMap[header.toLowerCase()];
  if (index !== undefined) {
    row[index] = value;
  }
}

function buildSheetRowForMedia_(config, headerMap, columnCount, media) {
  const row = Array(columnCount).fill("");

  setValueByHeader_(row, headerMap, "name", config.creatorName);
  setValueByHeader_(row, headerMap, "reelName", buildReelName_(media));
  setValueByHeader_(row, headerMap, "clipUrl", media.permalink || "");
  setValueByHeader_(row, headerMap, "igMediaId", media.id);
  setValueByHeader_(row, headerMap, "publishedAt", media.timestamp || "");

  return row;
}

function readSheetRows_(sheet, headerMap) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  const lastColumn = Math.max(sheet.getLastColumn(), HEADER_ROW.length);
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  return values
    .map((row, index) => ({
      rowNumber: index + 2,
      name: getRowValue_(row, headerMap, "name") || "",
      reelName: getRowValue_(row, headerMap, "reelName") || "",
      clipUrl: getRowValue_(row, headerMap, "clipUrl") || "",
      igMediaId: getRowValue_(row, headerMap, "igMediaId") || "",
      igViews: Number(getRowValue_(row, headerMap, "igViews") || 0),
      igLikes: Number(getRowValue_(row, headerMap, "igLikes") || 0),
      igComments: Number(getRowValue_(row, headerMap, "igComments") || 0),
      igShares: Number(getRowValue_(row, headerMap, "igShares") || 0),
      igSaves: Number(getRowValue_(row, headerMap, "igSaves") || 0),
      lastSyncedAt: getRowValue_(row, headerMap, "lastSyncedAt") || "",
      publishedAt: getRowValue_(row, headerMap, "publishedAt") || "",
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

  return (payload.data || []).filter(isReelMedia_);
}

function isReelMedia_(media) {
  const productType = String(media.media_product_type || "").toUpperCase();
  const permalink = String(media.permalink || "").toLowerCase();

  return productType === "REELS" || permalink.indexOf("/reel/") !== -1;
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
    publishedAt: row.publishedAt || matchedMedia.timestamp || "",
    views: getMetricValue_(insights, ["views", "plays", "video_views", "impressions"]),
    likes: matchedMedia.like_count || getMetricValue_(insights, ["likes"]),
    comments:
      matchedMedia.comments_count || getMetricValue_(insights, ["comments"]),
    reshares: getMetricValue_(insights, ["shares"]),
    saves: getMetricValue_(insights, ["saved"]),
    lastSyncedAt: buildTimestamp_(),
  });
}

function syncSheetRowInPlace_(config, sheet, headerMap, row, mediaById, mediaByPermalink) {
  const matchedMedia =
    mediaById[row.igMediaId] || findMediaForRow_(row, mediaByPermalink) || null;

  if (!matchedMedia) {
    setCellByHeader_(sheet, headerMap, row.rowNumber, "lastSyncedAt", buildTimestamp_());
    return;
  }

  const insights = fetchInsightsWithFallback_(config.accessToken, matchedMedia.id);

  setCellByHeader_(sheet, headerMap, row.rowNumber, "name", row.name || config.creatorName);
  setCellByHeader_(sheet, headerMap, row.rowNumber, "reelName", row.reelName || buildReelName_(matchedMedia));
  setCellByHeader_(sheet, headerMap, row.rowNumber, "clipUrl", row.clipUrl || matchedMedia.permalink || "");
  setCellByHeader_(sheet, headerMap, row.rowNumber, "igMediaId", matchedMedia.id);
  setCellByHeader_(sheet, headerMap, row.rowNumber, "igViews", getMetricValue_(insights, ["views", "plays", "video_views", "impressions"]));
  setCellByHeader_(sheet, headerMap, row.rowNumber, "igLikes", matchedMedia.like_count || getMetricValue_(insights, ["likes"]));
  setCellByHeader_(sheet, headerMap, row.rowNumber, "igComments", matchedMedia.comments_count || getMetricValue_(insights, ["comments"]));
  setCellByHeader_(sheet, headerMap, row.rowNumber, "igShares", getMetricValue_(insights, ["shares"]));
  setCellByHeader_(sheet, headerMap, row.rowNumber, "igSaves", getMetricValue_(insights, ["saved"]));
  setCellByHeader_(sheet, headerMap, row.rowNumber, "lastSyncedAt", buildTimestamp_());
  setCellByHeader_(sheet, headerMap, row.rowNumber, "publishedAt", row.publishedAt || matchedMedia.timestamp || "");
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
  const metricNames = [
    "views",
    "plays",
    "video_views",
    "impressions",
    "reach",
    "likes",
    "comments",
    "shares",
    "saved",
  ];
  const values = {};

  metricNames.forEach((metricName) => {
    const result = fetchInsights_(accessToken, mediaId, [metricName]);

    if (result.ok) {
      Object.assign(values, result.metrics);
    }
  });

  return values;
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
    row.publishedAt || "",
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

function backfillPublishedAtOnly() {
  const config = getConfig_();
  const sheet = getSheet_(config.sheetId, config.sheetName);
  const headerMap = getHeaderMap_(sheet);

  if (headerMap.publishedAt === undefined) {
    throw new Error("Add a publishedAt header first. This function will not change headers.");
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2) {
    return;
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

  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  values.forEach((row, index) => {
    const rowNumber = index + 2;
    const currentPublishedAt = getRowValue_(row, headerMap, "publishedAt");
    if (currentPublishedAt) {
      return;
    }

    const igMediaId = getRowValue_(row, headerMap, "igMediaId");
    const clipUrl = getRowValue_(row, headerMap, "clipUrl");
    const matchedMedia =
      mediaById[igMediaId] || mediaByPermalink[normalizeUrl_(clipUrl)];

    if (!matchedMedia || !matchedMedia.timestamp) {
      return;
    }

    setCellByHeader_(sheet, headerMap, rowNumber, "publishedAt", matchedMedia.timestamp);
  });
}

function debugInstagramColumnMap() {
  const config = getConfig_();
  const sheet = getSheet_(config.sheetId, config.sheetName);
  const headerMap = getHeaderMap_(sheet);
  const fields = [
    "igMediaId",
    "igViews",
    "igLikes",
    "igComments",
    "igShares",
    "igSaves",
    "lastSyncedAt",
    "publishedAt",
  ];

  fields.forEach((field) => {
    const index =
      headerMap[field] !== undefined ? headerMap[field] : headerMap[field.toLowerCase()];
    Logger.log(field + " -> " + (index === undefined ? "NOT FOUND" : columnLetter_(index + 1)));
  });
}

function debugFirstReelInsights() {
  const config = getConfig_();
  const mediaItems = fetchMedia_(config);

  if (!mediaItems.length) {
    Logger.log("No Reels found for this Instagram account.");
    return;
  }

  const media = mediaItems[0];
  const insights = fetchInsightsWithFallback_(config.accessToken, media.id);

  Logger.log("media id: " + media.id);
  Logger.log("permalink: " + (media.permalink || ""));
  Logger.log("like_count: " + (media.like_count || 0));
  Logger.log("comments_count: " + (media.comments_count || 0));
  Logger.log("insights: " + JSON.stringify(insights));
}

function columnLetter_(columnNumber) {
  let letter = "";
  let number = columnNumber;

  while (number > 0) {
    const remainder = (number - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    number = Math.floor((number - remainder) / 26);
  }

  return letter;
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
