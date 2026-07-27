import {
  aggregateByCampaign,
  buildMetaAdsSummary,
  buildTrendRows,
  dedupeMetaAdsRows,
  filterRowsByCampaign,
  formatDateKey,
  getCampaignIdentity,
  hasNumber,
  parseDate,
  safeDivide,
} from "./metaAdsAnalytics";
import { buildManualLeadSummary } from "../services/metaLeadRepository";

const MS_PER_DAY = 86400000;

const metricDefinitions = [
  { key: "costPerResult", label: "Cost per lead", format: "currency", lowerIsBetter: true },
  { key: "results", label: "Leads", format: "number" },
  { key: "leadsPer100", label: "Leads per $100", format: "decimal" },
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "reach", label: "Reach", format: "number" },
];

const getDateRange = (rows) => {
  const dates = dedupeMetaAdsRows(rows)
    .flatMap((row) => [row.reportingStarts || row.date, row.reportingEnds])
    .map(parseDate)
    .filter(Boolean)
    .sort((a, b) => a - b);

  const startDate = dates[0] || null;
  const endDate = dates.at(-1) || null;
  const durationDays = startDate && endDate
    ? Math.max(1, Math.round((endDate - startDate) / MS_PER_DAY) + 1)
    : null;

  return {
    startDate,
    endDate,
    startDateKey: startDate ? formatDateKey(startDate) : "",
    endDateKey: endDate ? formatDateKey(endDate) : "",
    durationDays,
  };
};

const average = (values) => {
  const numeric = values.filter(hasNumber).map(Number);
  if (numeric.length === 0) return null;
  return numeric.reduce((total, value) => total + value, 0) / numeric.length;
};

export const buildCampaignOutcome = (rows, manualLeads = []) => {
  const uniqueRows = dedupeMetaAdsRows(rows);
  const summary = buildMetaAdsSummary(uniqueRows);
  const dateRange = getDateRange(uniqueRows);
  const leadSummary = buildManualLeadSummary(manualLeads, summary.amountSpent || 0);

  return {
    ...summary,
    ...dateRange,
    leadsPerDay: safeDivide(summary.results, dateRange.durationDays),
    leadsPer100: safeDivide(summary.results, summary.amountSpent, 100),
    averageDailySpend: safeDivide(summary.amountSpent, dateRange.durationDays),
    contactRate: leadSummary.contactRate,
    conversionRate: leadSummary.conversionRate,
    failedRate: leadSummary.failedRate,
    costPerConvertedLead: leadSummary.costPerConvertedLead,
    manualLeads: leadSummary,
  };
};

const getComparableCampaigns = (selectedCampaign, campaigns) => {
  const selectedObjective = selectedCampaign.campaignObjective || "";
  const selectedIndicator = selectedCampaign.resultIndicator || "";
  const selectedKey = getCampaignIdentity(selectedCampaign);

  if (selectedObjective) {
    return {
      limited: false,
      reason: `Compared against campaigns with objective ${selectedObjective}.`,
      campaigns: campaigns.filter(
        (campaign) =>
          getCampaignIdentity(campaign) !== selectedKey &&
          campaign.campaignObjective === selectedObjective
      ),
    };
  }

  return {
    limited: true,
    reason: selectedIndicator
      ? `Objective is unavailable, so comparison is limited to campaigns with result type ${selectedIndicator}.`
      : "Objective is unavailable, so comparison is limited to other campaigns with available lead data.",
    campaigns: campaigns.filter((campaign) => {
      if (getCampaignIdentity(campaign) === selectedKey) return false;
      if (selectedIndicator) return campaign.resultIndicator === selectedIndicator;
      return hasNumber(campaign.results);
    }),
  };
};

const enrichCampaign = (campaign, allRows, getLeadsByCampaign) => {
  const campaignRows = filterRowsByCampaign(allRows, campaign);
  const campaignId = getCampaignIdentity(campaign);
  return {
    ...campaign,
    ...buildCampaignOutcome(campaignRows, getLeadsByCampaign(campaignId)),
  };
};

export const rankCampaigns = (campaigns, metricKey, lowerIsBetter = false) => {
  const ranked = campaigns
    .filter((campaign) => hasNumber(campaign[metricKey]))
    .sort((first, second) => {
      const difference = Number(first[metricKey]) - Number(second[metricKey]);
      return lowerIsBetter ? difference : -difference;
    });

  return ranked.map((campaign, index) => ({
    campaign,
    rank: index + 1,
  }));
};

export const buildCampaignComparisonReport = ({
  selectedCampaign,
  allRows,
  getLeadsByCampaign = () => [],
}) => {
  if (!selectedCampaign) {
    return { rows: [], comparableRows: [], limited: true, reason: "No campaign selected." };
  }

  const allCampaigns = aggregateByCampaign(allRows).map((campaign) =>
    enrichCampaign(campaign, allRows, getLeadsByCampaign)
  );
  const selectedKey = getCampaignIdentity(selectedCampaign);
  const selected = allCampaigns.find((campaign) => getCampaignIdentity(campaign) === selectedKey);
  const comparable = getComparableCampaigns(selected || selectedCampaign, allCampaigns);
  const comparableRows = comparable.campaigns;
  const leaderboardRows = [selected, ...comparableRows].filter(Boolean);

  const rows = metricDefinitions.map((metric) => {
    const values = comparableRows.map((campaign) => campaign[metric.key]);
    const ranked = rankCampaigns(leaderboardRows, metric.key, metric.lowerIsBetter);
    const comparableRanked = rankCampaigns(comparableRows, metric.key, metric.lowerIsBetter);
    const selectedRank = ranked.find(
      (item) => getCampaignIdentity(item.campaign) === selectedKey
    )?.rank || null;
    const best = comparableRanked[0]?.campaign || null;

    return {
      ...metric,
      selectedValue: selected?.[metric.key],
      averageValue: average(values),
      bestCampaign: best,
      bestValue: best?.[metric.key],
      selectedRank,
      totalRanked: ranked.length,
    };
  });

  return {
    selected,
    rows,
    comparableRows,
    leaderboardRows,
    limited: comparable.limited,
    reason: comparable.reason,
  };
};

export const buildLeaderboardRows = (comparisonReport) =>
  [...(comparisonReport.leaderboardRows || [])];

export const buildCampaignTimeBreakdownRows = (rows, grouping = "Monthly") =>
  buildTrendRows(rows, grouping, "results").map((row) => ({
    key: row.key,
    label: row.label,
    ...buildCampaignOutcome(row.rows || []),
  }));

export const reviewMetricDefinitions = metricDefinitions;
