export const META_ADS_SHEET_HEADERS = [
  "Reporting starts",
  "Reporting ends",
  "Campaign name",
  "Campaign delivery",
  "Leads",
  "Result type",
  "Cost per lead",
  "Amount spent (AUD)",
  "Impressions",
  "Reach",
  "Campaign ID",
  "Frequency",
  "Last synced",
];

export const ACCEPTED_LEAD_ACTION_TYPES = [
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

const normaliseActionType = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^actions:/, "");

const acceptedLeadActionSet = new Set(
  ACCEPTED_LEAD_ACTION_TYPES.map(normaliseActionType)
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

export const extractAcceptedLeadActions = (actions = []) =>
  (Array.isArray(actions) ? actions : []).reduce((total, action) => {
    if (!isAcceptedLeadActionType(action?.action_type)) return total;
    return total + (parseMetaApiNumber(action.value) || 0);
  }, 0);

export const calculateCostPerLead = (spend, leads) => {
  const parsedSpend = parseMetaApiNumber(spend);
  const parsedLeads = parseMetaApiNumber(leads);

  if (parsedSpend === null || !parsedLeads) return null;
  return parsedSpend / parsedLeads;
};

export const mapMetaCampaignRecordToSheetRow = ({
  insight,
  campaign = {},
  reportingStarts,
  reportingEnds,
  lastSynced,
}) => {
  const spend = parseMetaApiNumber(insight?.spend);
  const leads = extractAcceptedLeadActions(insight?.actions);
  const costPerLead = calculateCostPerLead(spend, leads);

  return [
    insight?.date_start || reportingStarts || "",
    insight?.date_stop || reportingEnds || "",
    insight?.campaign_name || campaign.name || "",
    campaign.effective_status || campaign.status || "",
    leads,
    "Leads",
    costPerLead === null ? "" : costPerLead,
    spend === null ? "" : spend,
    parseMetaApiNumber(insight?.impressions),
    parseMetaApiNumber(insight?.reach),
    insight?.campaign_id || campaign.id || "",
    parseMetaApiNumber(insight?.frequency),
    lastSynced || "",
  ].map((value) => (value === null ? "" : value));
};
