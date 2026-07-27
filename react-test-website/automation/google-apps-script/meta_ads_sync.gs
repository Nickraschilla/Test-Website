const META_ADS_REPORTING_LOOKBACK_DAYS = 90;
const DEFAULT_META_ADS_TEST_SHEET_NAME = "Meta Ads API Test";
const DEFAULT_META_API_VERSION = "v23.0";
const META_GRAPH_BASE_URL = "https://graph.facebook.com";

const META_ADS_SHEET_HEADERS = [
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

const ACCEPTED_META_LEAD_ACTION_TYPES = [
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
  const config = getMetaAdsConfig_();
  const url = buildMetaApiUrl_(
    config,
    "/" + config.adAccountId + "/insights",
    {
      level: "campaign",
      limit: 1,
      fields: "campaign_id,campaign_name,spend,actions",
      date_preset: "last_7d",
    }
  );
  const response = fetchMetaJson_(url);

  Logger.log(
    "Meta connection successful. Read campaign insights for " +
      config.adAccountId +
      "; rows returned: " +
      ((response.data || []).length)
  );
}

function syncMetaAdsData() {
  const config = getMetaAdsConfig_();
  const dateRange = getMetaAdsDateRange_();
  const lastSynced = new Date();

  Logger.log(
    "Fetching Meta Ads campaign insights for " +
      dateRange.since +
      " to " +
      dateRange.until +
      "."
  );

  const campaignMetadataById = fetchMetaCampaignMetadata_(config);
  const insights = fetchMetaCampaignInsights_(config, dateRange);
  const rows = insights
    .filter(hasUsefulMetaInsightRecord_)
    .map((insight) =>
      buildMetaAdsSheetRow_(
        insight,
        campaignMetadataById[insight.campaign_id] || {},
        dateRange,
        lastSynced
      )
    );

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("No active spreadsheet found. Use this script from the spreadsheet Apps Script project.");
  }

  const sheet =
    spreadsheet.getSheetByName(config.sheetName) ||
    spreadsheet.insertSheet(config.sheetName);
  const output = [META_ADS_SHEET_HEADERS].concat(rows);

  sheet.clearContents();
  sheet.clearFormats();
  sheet.getRange(1, 1, output.length, META_ADS_SHEET_HEADERS.length).setValues(output);
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

  ScriptApp.newTrigger("syncMetaAdsData")
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log("Created six-hour Meta Ads sync trigger for syncMetaAdsData().");
}

function deleteMetaSyncTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;

  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === "syncMetaAdsData") {
      ScriptApp.deleteTrigger(trigger);
      deletedCount += 1;
    }
  });

  Logger.log("Deleted " + deletedCount + " Meta Ads sync trigger(s).");
}

function getMetaAdsConfig_() {
  const props = PropertiesService.getScriptProperties();
  const config = {
    accessToken: props.getProperty("META_ACCESS_TOKEN"),
    adAccountId: normaliseMetaAdAccountId_(props.getProperty("META_AD_ACCOUNT_ID")),
    apiVersion: props.getProperty("META_API_VERSION") || DEFAULT_META_API_VERSION,
    sheetName:
      props.getProperty("META_ADS_TEST_SHEET_NAME") ||
      DEFAULT_META_ADS_TEST_SHEET_NAME,
  };
  const missing = [];

  if (!config.accessToken) missing.push("META_ACCESS_TOKEN");
  if (!config.adAccountId) missing.push("META_AD_ACCOUNT_ID");

  if (missing.length) {
    throw new Error("Missing script properties: " + missing.join(", "));
  }

  return config;
}

function normaliseMetaAdAccountId_(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "";
  return "act_" + cleaned.replace(/^act_/i, "");
}

function getMetaAdsDateRange_() {
  const timeZone = Session.getScriptTimeZone() || "Australia/Melbourne";
  const until = new Date();
  const since = new Date(until);

  since.setDate(since.getDate() - (META_ADS_REPORTING_LOOKBACK_DAYS - 1));

  return {
    since: Utilities.formatDate(since, timeZone, "yyyy-MM-dd"),
    until: Utilities.formatDate(until, timeZone, "yyyy-MM-dd"),
  };
}

function fetchMetaCampaignInsights_(config, dateRange) {
  const url = buildMetaApiUrl_(
    config,
    "/" + config.adAccountId + "/insights",
    {
      level: "campaign",
      limit: 500,
      fields:
        "date_start,date_stop,campaign_id,campaign_name,spend,impressions,reach,frequency,actions,cost_per_action_type,attribution_setting",
      time_range: JSON.stringify({
        since: dateRange.since,
        until: dateRange.until,
      }),
    }
  );

  return fetchAllMetaPages_(url);
}

function fetchMetaCampaignMetadata_(config) {
  const url = buildMetaApiUrl_(
    config,
    "/" + config.adAccountId + "/campaigns",
    {
      limit: 500,
      fields: "id,name,status,effective_status,stop_time",
    }
  );
  const campaigns = fetchAllMetaPages_(url);

  return campaigns.reduce((map, campaign) => {
    if (campaign.id) {
      map[campaign.id] = campaign;
    }
    return map;
  }, {});
}

function fetchAllMetaPages_(initialUrl) {
  const rows = [];
  let nextUrl = initialUrl;

  while (nextUrl) {
    const response = fetchMetaJson_(nextUrl);
    const pageRows = Array.isArray(response.data) ? response.data : [];

    rows.push.apply(rows, pageRows);
    nextUrl = response.paging && response.paging.next ? response.paging.next : "";
  }

  return rows;
}

function fetchMetaJson_(url) {
  const response = UrlFetchApp.fetch(url, {
    method: "get",
    muteHttpExceptions: true,
  });
  const status = response.getResponseCode();
  const body = response.getContentText();
  let parsed;

  try {
    parsed = body ? JSON.parse(body) : {};
  } catch (error) {
    throw new Error("Meta API returned non-JSON response. HTTP status: " + status);
  }

  if (status < 200 || status >= 300) {
    const metaError = parsed.error || {};
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
  const queryParts = Object.keys(params || {}).map((key) => {
    return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
  });

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
  return [
    insight.campaign_id,
    insight.campaign_name,
    insight.spend,
    insight.impressions,
    insight.reach,
    insight.actions,
  ].some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value === undefined || value === null ? "" : value).trim() !== "";
  });
}

function buildMetaAdsSheetRow_(insight, campaign, dateRange, lastSynced) {
  const spend = parseMetaNumber_(insight.spend);
  const leads = extractAcceptedLeadActions_(insight.actions);
  const costPerLead = calculateCostPerLead_(spend, leads);

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

  const number = Number(
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
  const normalised = normaliseActionType_(actionType);

  return ACCEPTED_META_LEAD_ACTION_TYPES.some((acceptedType) => {
    return normaliseActionType_(acceptedType) === normalised;
  });
}

function extractAcceptedLeadActions_(actions) {
  if (!Array.isArray(actions)) return 0;

  return actions.reduce((total, action) => {
    if (!isAcceptedLeadActionType_(action.action_type)) return total;

    return total + (parseMetaNumber_(action.value) || 0);
  }, 0);
}

function calculateCostPerLead_(spend, leads) {
  if (spend === null || spend === undefined || !leads) return null;
  return spend / leads;
}

function applyMetaAdsSheetFormats_(sheet, dataRowCount) {
  const firstDataRow = 2;
  const rowCount = Math.max(dataRowCount, 1);

  sheet.getRange(firstDataRow, 7, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 10, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 11, rowCount, 2).setNumberFormat("#,##0");
  sheet.getRange(firstDataRow, 18, rowCount, 1).setNumberFormat("0.00");
  sheet.getRange(firstDataRow, 19, rowCount, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
}
