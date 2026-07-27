var META_ADS_DATE_PRESET = "maximum";
var DEFAULT_META_ADS_TEST_SHEET_NAME = "Meta Ads API Test";
var DEFAULT_META_ADS_DAILY_SHEET_NAME = "Meta Ads Daily";
var DEFAULT_META_ADS_ACTION_AUDIT_SHEET_NAME = "Meta Ads Action Audit";
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
  "Ad Set Budget",
  "Ad Set Budget Type",
  "Amount spent (AUD)",
  "Impressions",
  "Reach",
  "Ends",
  "Attribution Setting",
  "Results (Initial)",
  "Results (Initial) Indicator",
  "Campaign ID",
  "Frequency",
  "Last synced"
];

var META_LEAD_ACTION_TYPE_PRIORITY = [
  "leadgen.other",
  "onsite_conversion.leadgen_grouped",
  "onsite_conversion.leadgen.other",
  "onsite_conversion.lead_grouped",
  "onsite_conversion.lead",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.custom.lead",
  "lead",
  "omni_lead",
  "actions:leadgen.other"
];

var META_ADS_ACTION_AUDIT_HEADERS = [
  "Reporting starts",
  "Reporting ends",
  "Campaign name",
  "Campaign ID",
  "Campaign delivery",
  "Action type",
  "Action value",
  "Would be selected",
  "Amount spent (AUD)",
  "Impressions",
  "Reach",
  "Last synced"
];

var META_ADS_DAILY_SHEET_HEADERS = [
  "Reporting starts",
  "Reporting ends",
  "Campaign name",
  "Campaign ID",
  "Campaign delivery",
  "Results",
  "Result indicator",
  "Cost per results",
  "Ad Set Budget",
  "Ad Set Budget Type",
  "Amount spent (AUD)",
  "Impressions",
  "Reach",
  "Ends",
  "Attribution Setting",
  "Results (Initial)",
  "Results (Initial) Indicator",
  "Frequency",
  "Last synced"
];

function testMetaConnection() {
  var config = getMetaAdsConfig_();
  var url = buildMetaApiUrl_(config, "/" + config.adAccountId + "/insights", {
    level: "campaign",
    limit: 1,
    fields: "campaign_id,campaign_name,spend,actions",
    date_preset: "last_7d"
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
  var lastSynced = new Date();

  Logger.log(
    "Fetching Meta Ads campaign insights using date preset '" +
      config.datePreset +
      "."
  );

  var campaignMetadataById = fetchMetaCampaignMetadata_(config);
  var insights = fetchMetaCampaignInsights_(config);
  var rows = [];

  for (var i = 0; i < insights.length; i += 1) {
    var insight = insights[i];
    if (!hasUsefulMetaInsightRecord_(insight)) continue;

    rows.push(
      buildMetaAdsSheetRow_(
        insight,
        campaignMetadataById[insight.campaign_id] || {},
        config,
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

function syncMetaAdsDailyData() {
  var config = getMetaAdsConfig_();
  var lastSynced = new Date();

  Logger.log(
    "Fetching daily Meta Ads campaign insights using date preset '" +
      config.datePreset +
      "'."
  );

  var campaignMetadataById = fetchMetaCampaignMetadata_(config);
  var insights = fetchMetaDailyCampaignInsights_(config);
  var rowsByKey = {};

  for (var i = 0; i < insights.length; i += 1) {
    var insight = insights[i];
    if (!hasUsefulMetaInsightRecord_(insight)) continue;

    var campaignId = insight.campaign_id || "";
    var reportingDate = formatMetaDate_(insight.date_start || insight.date_stop);
    var logicalKey = (campaignId || insight.campaign_name || "campaign") + "|" + reportingDate;

    rowsByKey[logicalKey] = buildMetaAdsDailySheetRow_(
      insight,
      campaignMetadataById[campaignId] || {},
      config,
      lastSynced
    );
  }

  var rows = Object.keys(rowsByKey)
    .sort()
    .map(function (key) {
      return rowsByKey[key];
    });

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error(
      "No active spreadsheet found. Use this script from the spreadsheet Apps Script project."
    );
  }

  var sheet =
    spreadsheet.getSheetByName(config.dailySheetName) ||
    spreadsheet.insertSheet(config.dailySheetName);
  var output = [META_ADS_DAILY_SHEET_HEADERS].concat(rows);

  sheet.clearContents();
  sheet.clearFormats();
  sheet
    .getRange(1, 1, output.length, META_ADS_DAILY_SHEET_HEADERS.length)
    .setValues(output);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, META_ADS_DAILY_SHEET_HEADERS.length);
  applyMetaAdsDailySheetFormats_(sheet, Math.max(rows.length, 1));

  Logger.log(
    "Meta Ads daily sync complete. Wrote " +
      rows.length +
      " campaign-day rows to '" +
      config.dailySheetName +
      "'."
  );
}

function auditMetaAdsActionTypes() {
  var config = getMetaAdsConfig_();
  var lastSynced = new Date();
  var campaignMetadataById = fetchMetaCampaignMetadata_(config);
  var insights = fetchMetaCampaignInsights_(config);
  var rows = [];

  for (var i = 0; i < insights.length; i += 1) {
    var insight = insights[i];
    if (!hasUsefulMetaInsightRecord_(insight)) continue;

    var campaign = campaignMetadataById[insight.campaign_id] || {};
    var selectedLeadAction = getLeadActionResult_(
      insight.actions,
      config.leadActionType
    );
    var actionRows = buildMetaActionAuditRows_(
      insight,
      campaign,
      selectedLeadAction,
      lastSynced
    );

    rows.push.apply(rows, actionRows);
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error(
      "No active spreadsheet found. Use this script from the spreadsheet Apps Script project."
    );
  }

  var sheet =
    spreadsheet.getSheetByName(config.actionAuditSheetName) ||
    spreadsheet.insertSheet(config.actionAuditSheetName);
  var output = [META_ADS_ACTION_AUDIT_HEADERS].concat(rows);

  sheet.clearContents();
  sheet.clearFormats();
  sheet
    .getRange(1, 1, output.length, META_ADS_ACTION_AUDIT_HEADERS.length)
    .setValues(output);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, META_ADS_ACTION_AUDIT_HEADERS.length);
  applyMetaAdsActionAuditFormats_(sheet, Math.max(rows.length, 1));

  Logger.log(
    "Meta Ads action audit complete. Wrote " +
      rows.length +
      " action rows to '" +
      config.actionAuditSheetName +
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
    dailySheetName:
      props.getProperty("META_ADS_DAILY_SHEET_NAME") ||
      DEFAULT_META_ADS_DAILY_SHEET_NAME,
    actionAuditSheetName:
      props.getProperty("META_ADS_ACTION_AUDIT_SHEET_NAME") ||
      DEFAULT_META_ADS_ACTION_AUDIT_SHEET_NAME,
    leadActionType: props.getProperty("META_LEAD_ACTION_TYPE") || "",
    datePreset: props.getProperty("META_ADS_DATE_PRESET") || META_ADS_DATE_PRESET
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

function fetchMetaCampaignInsights_(config) {
  var url = buildMetaApiUrl_(config, "/" + config.adAccountId + "/insights", {
    level: "campaign",
    limit: 500,
    fields:
      "date_start,date_stop,campaign_id,campaign_name,spend,impressions,reach,frequency,actions,cost_per_action_type,attribution_setting",
    date_preset: config.datePreset
  });

  return fetchAllMetaPages_(url);
}

function fetchMetaDailyCampaignInsights_(config) {
  var url = buildMetaApiUrl_(config, "/" + config.adAccountId + "/insights", {
    level: "campaign",
    limit: 500,
    fields:
      "date_start,date_stop,campaign_id,campaign_name,spend,impressions,reach,frequency,actions,cost_per_action_type,attribution_setting",
    date_preset: config.datePreset,
    time_increment: 1
  });

  return fetchAllMetaPages_(url);
}

function fetchMetaCampaignMetadata_(config) {
  var url = buildMetaApiUrl_(config, "/" + config.adAccountId + "/campaigns", {
    limit: 500,
    fields: "id,name,status,effective_status,start_time,stop_time"
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
    muteHttpExceptions: true
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
    insight.actions
  ];

  for (var i = 0; i < values.length; i += 1) {
    if (Array.isArray(values[i]) && values[i].length > 0) return true;
    if (String(values[i] === undefined || values[i] === null ? "" : values[i]).trim() !== "") {
      return true;
    }
  }

  return false;
}

function buildMetaAdsSheetRow_(insight, campaign, config, lastSynced) {
  var spend = parseMetaNumber_(insight.spend);
  var leadAction = getLeadActionResult_(insight.actions, config.leadActionType);
  var leads = leadAction.value;
  var costPerLead = calculateCostPerLead_(spend, leads);
  var reportingStarts = formatMetaDate_(campaign.start_time || insight.date_start);
  var reportingEnds = formatMetaDate_(campaign.stop_time || insight.date_stop);
  var campaignEnds = formatMetaDate_(campaign.stop_time);

  return [
    reportingStarts,
    reportingEnds,
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
    campaignEnds,
    insight.attribution_setting || "",
    "",
    "",
    insight.campaign_id || campaign.id || "",
    blankIfNull_(parseMetaNumber_(insight.frequency)),
    lastSynced
  ];
}

function buildMetaAdsDailySheetRow_(insight, campaign, config, lastSynced) {
  var spend = parseMetaNumber_(insight.spend);
  var leadAction = getLeadActionResult_(insight.actions, config.leadActionType);
  var leads = leadAction.value;
  var costPerLead = calculateCostPerLead_(spend, leads);
  var reportingStarts = formatMetaDate_(insight.date_start);
  var reportingEnds = formatMetaDate_(insight.date_stop || insight.date_start);
  var campaignEnds = formatMetaDate_(campaign.stop_time);

  return [
    reportingStarts,
    reportingEnds,
    insight.campaign_name || campaign.name || "",
    insight.campaign_id || campaign.id || "",
    campaign.effective_status || campaign.status || "",
    leads,
    "Leads",
    costPerLead === null ? "" : costPerLead,
    "",
    "",
    spend === null ? "" : spend,
    blankIfNull_(parseMetaNumber_(insight.impressions)),
    blankIfNull_(parseMetaNumber_(insight.reach)),
    campaignEnds,
    insight.attribution_setting || "",
    "",
    "",
    blankIfNull_(parseMetaNumber_(insight.frequency)),
    lastSynced
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

function formatMetaDate_(value) {
  var text = String(value || "").trim();
  if (!text) return "";
  return text.split("T")[0].split(" ")[0];
}

function normaliseActionType_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^actions:/, "");
}

function isAcceptedLeadActionType_(actionType) {
  var normalised = normaliseActionType_(actionType);

  for (var i = 0; i < META_LEAD_ACTION_TYPE_PRIORITY.length; i += 1) {
    if (normaliseActionType_(META_LEAD_ACTION_TYPE_PRIORITY[i]) === normalised) {
      return true;
    }
  }

  return false;
}

function extractAcceptedLeadActions_(actions) {
  return getLeadActionResult_(actions, "").value;
}

function getLeadActionResult_(actions, preferredActionType) {
  if (!Array.isArray(actions)) {
    return { value: 0, actionType: "" };
  }

  var actionsByType = {};

  for (var i = 0; i < actions.length; i += 1) {
    var actionType = normaliseActionType_(actions[i].action_type);
    if (!actionType) continue;

    actionsByType[actionType] = {
      originalActionType: actions[i].action_type || "",
      value: parseMetaNumber_(actions[i].value) || 0
    };
  }

  var preferredType = normaliseActionType_(preferredActionType);
  if (preferredType) {
    var preferredAction = actionsByType[preferredType];

    return {
      value: preferredAction ? preferredAction.value : 0,
      actionType: preferredAction
        ? preferredAction.originalActionType || preferredType
        : preferredActionType
    };
  }

  for (var priorityIndex = 0; priorityIndex < META_LEAD_ACTION_TYPE_PRIORITY.length; priorityIndex += 1) {
    var priorityType = normaliseActionType_(META_LEAD_ACTION_TYPE_PRIORITY[priorityIndex]);
    var matchedAction = actionsByType[priorityType];

    if (matchedAction) {
      return {
        value: matchedAction.value,
        actionType: matchedAction.originalActionType || priorityType
      };
    }
  }

  return { value: 0, actionType: "" };
}

function calculateCostPerLead_(spend, leads) {
  if (spend === null || spend === undefined || !leads) return null;
  return spend / leads;
}

function buildMetaActionAuditRows_(insight, campaign, selectedLeadAction, lastSynced) {
  var actions = Array.isArray(insight.actions) ? insight.actions : [];
  var rows = [];
  var reportingStarts = formatMetaDate_(campaign.start_time || insight.date_start);
  var reportingEnds = formatMetaDate_(campaign.stop_time || insight.date_stop);

  if (actions.length === 0) {
    actions = [{ action_type: "(no actions returned)", value: "" }];
  }

  for (var i = 0; i < actions.length; i += 1) {
    var actionType = actions[i].action_type || "";
    var actionValue = parseMetaNumber_(actions[i].value);

    rows.push([
      reportingStarts,
      reportingEnds,
      insight.campaign_name || campaign.name || "",
      insight.campaign_id || campaign.id || "",
      campaign.effective_status || campaign.status || "",
      actionType,
      actionValue === null ? actions[i].value || "" : actionValue,
      normaliseActionType_(actionType) === normaliseActionType_(selectedLeadAction.actionType)
        ? "Yes"
        : "",
      blankIfNull_(parseMetaNumber_(insight.spend)),
      blankIfNull_(parseMetaNumber_(insight.impressions)),
      blankIfNull_(parseMetaNumber_(insight.reach)),
      lastSynced
    ]);
  }

  return rows;
}

function applyMetaAdsSheetFormats_(sheet, dataRowCount) {
  var firstDataRow = 2;
  var rowCount = Math.max(dataRowCount, 1);

  sheet.getRange(firstDataRow, 7, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 8, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 10, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 11, rowCount, 2).setNumberFormat("#,##0");
  sheet.getRange(firstDataRow, 18, rowCount, 1).setNumberFormat("0.00");
  sheet.getRange(firstDataRow, 19, rowCount, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
}

function applyMetaAdsDailySheetFormats_(sheet, dataRowCount) {
  var firstDataRow = 2;
  var rowCount = Math.max(dataRowCount, 1);

  sheet.getRange(firstDataRow, 8, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 9, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 11, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 12, rowCount, 2).setNumberFormat("#,##0");
  sheet.getRange(firstDataRow, 18, rowCount, 1).setNumberFormat("0.00");
  sheet.getRange(firstDataRow, 19, rowCount, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
}

function applyMetaAdsActionAuditFormats_(sheet, dataRowCount) {
  var firstDataRow = 2;
  var rowCount = Math.max(dataRowCount, 1);

  sheet.getRange(firstDataRow, 7, rowCount, 1).setNumberFormat("#,##0.##");
  sheet.getRange(firstDataRow, 9, rowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(firstDataRow, 10, rowCount, 2).setNumberFormat("#,##0");
  sheet.getRange(firstDataRow, 12, rowCount, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
}
