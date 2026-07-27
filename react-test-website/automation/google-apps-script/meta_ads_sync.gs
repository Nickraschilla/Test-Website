var META_ADS_REPORTING_LOOKBACK_DAYS = 90;
var DEFAULT_META_ADS_TEST_SHEET_NAME = "Meta Ads API Test";
var DEFAULT_META_API_VERSION = "v23.0";
var META_GRAPH_BASE_URL = "https://graph.facebook.com";

var META_ADS_SHEET_HEADERS = [
  "Reporting starts",
  "Reporting ends",
  "Campaign name",
  "Campaign delivery",
  "Leads",
  "Result type",
  "Cost per lead",
  "Ad set budget",
  "Ad set budget type",
  "Amount spent (AUD)",
  "Impressions",
  "Reach",
  "Ends",
  "Attribution setting",
  "Results (initial)",
  "Results (initial) indicator",
  "Campaign ID",
  "Frequency",
  "Last synced",
];

var ACCEPTED_META_LEAD_ACTION_TYPES = [
  "lead",
  "omni_lead",
  "onsite_conversion.lead_grouped",
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.lead",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.custom.lead",
  "leadgen.other",
  "onsite_conversion.leadgen_grouped",
  "onsite_conversion.leadgen.other",
  "actions:leadgen.other",
];

function testMetaConnection() {
  var config = getMetaAdsConfig_();
  var url = buildMetaApiUrl_(config, "/" + config.adAccountId + "/insights", {
    level: "campaign",
    limit: 1,
    fields: "campaign_id,campaign_name,spend,actions",
    date_preset: "last_7d",
  });
  var response = fetchMetaJson_(url);

  Logger.log(
    "Meta connection successful. Read campaign insights for " +
      config.adAccountId +
      "; rows returned: " +
      ((response.data || []).length)
  );
}

function syncMetaAdsData() {
  var config = getMetaAdsConfig_();
  var dateRange = getMetaAdsDateRange_();
  var lastSynced = new Date();

  Logger.log(
    "Fetching Meta Ads campaign insights for " +
      dateRange.since +
      " to " +
      dateRange.until +
      "."
  );

  var campaignMetadataById = fetchMetaCampaignMetadata_(config);
  var insights = fetchMetaCampaignInsights_(config, dateRange);
  var rows = [];

  for (var i = 0; i < insights.length; i += 1) {
    var insight = insights[i];
    if (!hasUsefulMetaInsightRecord_(insight)) continue;

    rows.push(
      buildMetaAdsSheetRow_(
        insight,
        campaignMetadataById[insight.campaign_id] || {},
        dateRange,
        lastSynced
      )
    );
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error(
      "No active spreadsheet found. Use this script from the spreadsheet Apps Script project."
    );
  }

  var sheet =
    spreadsheet.getSheetByName(config.sheetName) ||
    spreadsheet.insertSheet(config.sheetName);
  var output = [META_ADS_SHEET_HEADERS].concat(rows);

  sheet.clearContents();
  sheet.clearFormats();
  sheet
    .getRange(1, 1, output.length, META_ADS_SHEET_HEADERS.length)
    .setValues(output);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, META_ADS_SHEET_HEADERS.length);
  applyMetaAdsSheetFormats_(sheet, Math.max(rows.length, 1));

  Logger.log(
    "Meta Ads sync complete. Wrote " +
      rows.length +
      " campaign rows to '" +
      config.sheetName +
      "'."
  );
}

function createMetaSyncTrigger() {
  deleteMetaSyncTriggers();

  ScriptApp.newTrigger("syncMetaAdsData").timeBased().everyHours(6).create();

  Logger.log("Created six-hour Meta Ads sync trigger for syncMetaAdsData().");
}

function deleteMetaSyncTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var deletedCount = 0;

  for (var i = 0; i < triggers.length; i += 1) {
    if (triggers[i].getHandlerFunction() === "syncMetaAdsData") {
      ScriptApp.deleteTrigger(triggers[i]);
      deletedCount += 1;
    }
  }

  Logger.log("Deleted " + deletedCount + " Meta Ads sync trigger(s).");
}

function getMetaAdsConfig_() {
  var props = PropertiesService.getScriptProperties();
  var config = {
    accessToken: props.getProperty("META_ACCESS_TOKEN"),
    adAccountId: normaliseMetaAdAccountId_(
      props.getProperty("META_AD_ACCOUNT_ID")
    ),
    apiVersion: props.getProperty("META_API_VERSION") || DEFAULT_META_API_VERSION,
    sheetName:
      props.getProperty("META_ADS_TEST_SHEET_NAME") ||
      DEFAULT_META_ADS_TEST_SHEET_NAME,
  };
  var missing = [];

  if (!config.accessToken) missing.push("META_ACCESS_TOKEN");
  if (!config.adAccountId) missing.push("META_AD_ACCOUNT_ID");

  if (missing.length) {
    throw new Error("Missing script properties: " + missing.join(", "));
  }

  return config;
}

function normaliseMetaAdAccountId_(value) {
  var cleaned = String(value || "").trim();
  if (!cleaned) return "";
  return "act_" + cleaned.replace(/^act_/i, "");
}

function getMetaAdsDateRange_() {
  var timeZone = Session.getScriptTimeZone() || "Australia/Melbourne";
  var until = new Date();
  var since = new Date(until);

  since.setDate(since.getDate() - (META_ADS_REPORTING_LOOKBACK_DAYS - 1));

  return {
    since: Utilities.formatDate(since, timeZone, "yyyy-MM-dd"),
    until: Utilities.formatDate(until, timeZone, "yyyy-MM-dd"),
  };
}

function fetchMetaCampaignInsights_(config, dateRange) {
  var url = buildMetaApiUrl_(config, "/" + config.adAccountId + "/insights", {
    level: "campaign",
    limit: 500,
    fields:
      "date_start,date_stop,campaign_id,campaign_name,spend,impressions,reach,frequency,actions,cost_per_action_type,attribution_setting",
    time_range: JSON.stringify({
      since: dateRange.since,
      until: dateRange.until,
    }),
  });

  return fetchAllMetaPages_(url);
}

function fetchMetaCampaignMetadata_(config) {
  var url = buildMetaApiUrl_(config, "/" + config.adAccountId + "/campaigns", {
    limit: 500,
    fields: "id,name,status,effective_status,stop_time",
  });
  var campaigns = fetchAllMetaPages_(url);
  var campaignMap = {};

  for (var i = 0; i < campaigns.length; i += 1) {
    if (campaigns[i].id) {
      campaignMap[campaigns[i].id] = campaigns[i];
    }
  }

  return campaignMap;
}

function fetchAllMetaPages_(initialUrl) {
  var rows = [];
  var nextUrl = initialUrl;

  while (nextUrl) {
    var response = fetchMetaJson_(nextUrl);
    var pageRows = Array.isArray(response.data) ? response.data : [];

    rows.push.apply(rows, pageRows);
    nextUrl = response.paging && response.paging.next ? response.paging.next : "";
  }

  return rows;
}

function fetchMetaJson_(url) {
  var response = UrlFetchApp.fetch(url, {
    method: "get",
    muteHttpExceptions: true,
  });
  var status = response.getResponseCode();
  var body = response.getContentText();
  var parsed;

  try {
    parsed = body ? JSON.parse(body) : {};
  } catch (error) {
    throw new Error("Meta API returned non-JSON response. HTTP status: " + status);
  }

  if (status < 200 || status >= 300) {
    var metaError = parsed.error || {};
    throw new Error(
      "Meta API request failed. HTTP status: " +
        status +
        "; message: " +
        (metaError.message || "Unknown Meta API error") +
        "; type: " +
        (metaError.type || "") +
        "; code: " +
        (metaError.code === undefined ? "" : metaError.code)
    );
  }

  return parsed;
}

function buildMetaApiUrl_(config, path, params) {
  var queryParts = [];

  for (var key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      queryParts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
    }
  }

  queryParts.push("access_token=" + encodeURIComponent(config.accessToken));

  return (
    META_GRAPH_BASE_URL +
    "/" +
    config.apiVersion +
    path +
    "?" +
    queryParts.join("&")
  );
}

function hasUsefulMetaInsightRecord_(insight) {
  if (!insight) return false;

  var values = [
    insight.campaign_id,
    insight.campaign_name,
    insight.spend,
    insight.impressions,
    insight.reach,
    insight.actions,
  ];

  for (var i = 0; i < values.length; i += 1) {
    if (Array.isArray(values[i]) && values[i].length > 0) return true;
    if (String(values[i] === undefined || values[i] === null ? "" : values[i]).trim() !== "") {
      return true;
    }
  }

  return false;
}

function buildMetaAdsSheetRow_(insight, campaign, dateRange, lastSynced) {
  var spend = parseMetaNumber_(insight.spend);
  var leads = extractAcceptedLeadActions_(insight.actions);
  var costPerLead = calculateCostPerLead_(spend, leads);

  return [
    insight.date_start || dateRange.since || "",
    insight.date_stop || dateRange.until || "",
    insight.campaign_name || campaign.name || "",
    campaign.effective_status || campaign.status || "",
    leads,
    "Leads",
    costPerLead === null ? "" : costPerLead,
    "",
    "",
    spend === null ? "" : spend,
    blankIfNull_(parseMetaNumber_(insight.impressions)),
    blankIfNull_(parseMetaNumber_(insight.reach)),
    campaign.stop_time || "",
    insight.attribution_setting || "",
    "",
    "",
    insight.campaign_id || campaign.id || "",
    blankIfNull_(parseMetaNumber_(insight.frequency)),
    lastSynced,
  ];
}

function parseMetaNumber_(value) {
  if (value === "" || value === null || value === undefined) return null;

  var number = Number(
    String(value)
      .replace(/[$,%]/g, "")
      .replace(/,/g, "")
      .trim()
  );

  return isFinite(number) ? number : null;
}

function blankIfNull_(value) {
  return value === null || value === undefined ? "" : value;
}

function normaliseActionType_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^actions:/, "");
}

function isAcceptedLeadActionType_(actionType) {
  var normalised = normaliseActionType_(actionType);

  for (var i = 0; i < ACCEPTED_META_LEAD_ACTION_TYPES.length; i += 1) {
    if (normaliseActionType_(ACCEPTED_META_LEAD_ACTION_TYPES[i]) === normalised) {
      return true;
    }
  }

  return false;
}

function extractAcceptedLeadActions_(actions) {
  if (!Array.isArray(actions)) return 0;

  var total = 0;

  for (var i = 0; i < actions.length; i += 1) {
    if (!isAcceptedLeadActionType_(actions[i].action_type)) continue;

    total += parseMetaNumber_(actions[i].value) || 0;
  }

  return total;
}

function calculateCostPerLead_(spend, leads) {
  if (spend === null || spend === undefined || !leads) return null;
  return spend / leads;
}

function applyMetaAdsSheetFormats_(sheet, dataRowCount) {
  var firstDataRow = 2;
  var rowCount = Math.max(dataRowCount, 1);

  sheet.getRange(firstDataRow, 7, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 10, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 11, rowCount, 2).setNumberFormat("#,##0");
  sheet.getRange(firstDataRow, 18, rowCount, 1).setNumberFormat("0.00");
  sheet.getRange(firstDataRow, 19, rowCount, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
}
