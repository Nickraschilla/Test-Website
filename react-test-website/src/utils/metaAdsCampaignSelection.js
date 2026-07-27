import {
  formatDateLabel,
  formatDateKey,
  getCampaignIdentity,
  parseDate,
} from "./metaAdsAnalytics";

const ACTIVE_DELIVERY_PATTERN = /(active|live|delivering)/i;

const getTime = (value) => {
  const date = parseDate(value);
  return date ? date.getTime() : Number.NEGATIVE_INFINITY;
};

const getMostRecentDateKey = (values) => {
  const dates = values
    .map(parseDate)
    .filter(Boolean)
    .sort((a, b) => b - a);

  return dates[0] ? formatDateKey(dates[0]) : "";
};

const compareText = (first, second) =>
  String(first || "").localeCompare(String(second || ""));

export const isActiveMetaCampaign = (campaign) =>
  ACTIVE_DELIVERY_PATTERN.test(campaign?.campaignDelivery || "");

export const buildCampaignSelectionOptions = (rows) => {
  const groups = new Map();

  rows.forEach((row) => {
    const campaignId = getCampaignIdentity(row);
    const group = groups.get(campaignId) || {
      campaignId,
      campaignName: row.campaignName || "Untitled Campaign",
      campaignDelivery: row.campaignDelivery || "",
      rows: [],
    };

    group.rows.push(row);
    group.campaignName = row.campaignName || group.campaignName;
    if (row.campaignDelivery) group.campaignDelivery = row.campaignDelivery;
    groups.set(campaignId, group);
  });

  return [...groups.values()]
    .map((group) => {
      const reportingEnd = getMostRecentDateKey(group.rows.map((row) => row.reportingEnds));
      const reportingStart = getMostRecentDateKey(group.rows.map((row) => row.reportingStarts || row.date));
      const campaignEnd = getMostRecentDateKey(group.rows.map((row) => row.ends));
      const lastSynced = getMostRecentDateKey(group.rows.map((row) => row.lastSynced));
      const sortDate =
        reportingEnd ||
        reportingStart ||
        campaignEnd ||
        lastSynced ||
        "";
      const active = isActiveMetaCampaign(group);
      const endedLabel = campaignEnd ? `Ended ${formatDateLabel(campaignEnd)}` : group.campaignDelivery || "No status";

      return {
        ...group,
        active,
        latestReportingEnd: reportingEnd,
        latestReportingStart: reportingStart,
        campaignEnd,
        lastSynced,
        sortDate,
        sortTime: getTime(sortDate),
        label: `${group.campaignName} — ${active ? group.campaignDelivery : endedLabel}`,
      };
    })
    .sort((first, second) => {
      if (second.sortTime !== first.sortTime) return second.sortTime - first.sortTime;
      if (Number(second.active) !== Number(first.active)) return Number(second.active) - Number(first.active);
      return compareText(first.campaignName, second.campaignName) || compareText(first.campaignId, second.campaignId);
    });
};

export const selectDefaultMetaCampaignId = (rows) => {
  const options = buildCampaignSelectionOptions(rows);
  const activeCampaigns = options.filter((option) => option.active);

  return (activeCampaigns[0] || options[0])?.campaignId || "";
};

export const getValidCampaignSelection = (rows, requestedCampaignId) => {
  const options = buildCampaignSelectionOptions(rows);
  const requested = options.find((option) => option.campaignId === requestedCampaignId);

  return requested?.campaignId || selectDefaultMetaCampaignId(rows);
};
