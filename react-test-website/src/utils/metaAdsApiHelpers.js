export const META_ADS_SHEET_HEADERS = [
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
  "Last synced",
];

export const LEAD_ACTION_TYPE_PRIORITY = [
  "leadgen.other",
  "onsite_conversion.leadgen_grouped",
  "onsite_conversion.leadgen.other",
  "onsite_conversion.lead_grouped",
  "onsite_conversion.lead",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.custom.lead",
  "lead",
  "omni_lead",
  "actions:leadgen.other",
];

const normaliseActionType = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^actions:/, "");

const acceptedLeadActionSet = new Set(
  LEAD_ACTION_TYPE_PRIORITY.map(normaliseActionType)
);

export const normaliseMetaAdAccountId = (value) => {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "";
  const withoutPrefix = cleaned.replace(/^act_/i, "");
  return `act_${withoutPrefix}`;
};

export const parseMetaApiNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(String(value).replace(/[$,%]/g, "").replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : null;
};

export const isAcceptedLeadActionType = (actionType) =>
  acceptedLeadActionSet.has(normaliseActionType(actionType));

export const getLeadActionResult = (actions = [], preferredActionType = "") => {
  if (!Array.isArray(actions)) {
    return { value: 0, actionType: "" };
  }

  const actionsByType = new Map();

  actions.forEach((action) => {
    const actionType = normaliseActionType(action?.action_type);
    if (!actionType) return;

    actionsByType.set(actionType, {
      originalActionType: action?.action_type || "",
      value: parseMetaApiNumber(action?.value) || 0,
    });
  });

  const preferredType = normaliseActionType(preferredActionType);
  if (preferredType) {
    const preferredAction = actionsByType.get(preferredType);

    return {
      value: preferredAction ? preferredAction.value : 0,
      actionType: preferredAction
        ? preferredAction.originalActionType || preferredType
        : preferredActionType,
    };
  }

  for (const priorityType of LEAD_ACTION_TYPE_PRIORITY) {
    const normalisedPriorityType = normaliseActionType(priorityType);
    const matchedAction = actionsByType.get(normalisedPriorityType);

    if (matchedAction) {
      return {
        value: matchedAction.value,
        actionType: matchedAction.originalActionType || normalisedPriorityType,
      };
    }
  }

  return { value: 0, actionType: "" };
};

export const extractAcceptedLeadActions = (actions = []) =>
  getLeadActionResult(actions).value;

export const calculateCostPerLead = (spend, leads) => {
  const parsedSpend = parseMetaApiNumber(spend);
  const parsedLeads = parseMetaApiNumber(leads);

  if (parsedSpend === null || !parsedLeads) return null;
  return parsedSpend / parsedLeads;
};

export const formatMetaApiDate = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.split("T")[0].split(" ")[0];
};

export const mapMetaCampaignRecordToSheetRow = ({
  insight,
  campaign = {},
  reportingStarts,
  reportingEnds,
  lastSynced,
}) => {
  const spend = parseMetaApiNumber(insight?.spend);
  const leadAction = getLeadActionResult(insight?.actions);
  const leads = leadAction.value;
  const costPerLead = calculateCostPerLead(spend, leads);
  const reportingStartDate = formatMetaApiDate(
    campaign.start_time || insight?.date_start || reportingStarts
  );
  const reportingEndDate = formatMetaApiDate(
    campaign.stop_time || insight?.date_stop || reportingEnds
  );
  const campaignEndDate = formatMetaApiDate(campaign.stop_time);

  return [
    reportingStartDate,
    reportingEndDate,
    insight?.campaign_name || campaign.name || "",
    campaign.effective_status || campaign.status || "",
    leads,
    "Leads",
    costPerLead === null ? "" : costPerLead,
    "",
    "",
    spend === null ? "" : spend,
    parseMetaApiNumber(insight?.impressions),
    parseMetaApiNumber(insight?.reach),
    campaignEndDate,
    insight?.attribution_setting || "",
    "",
    "",
    insight?.campaign_id || campaign.id || "",
    parseMetaApiNumber(insight?.frequency),
    lastSynced || "",
  ].map((value) => (value === null ? "" : value));
};
