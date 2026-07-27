import {
  aggregateByCampaign,
  buildMetaAdsSummary,
  buildTrendRows,
  dedupeMetaAdsRows,
  filterRowsByCampaign,
  formatDateKey,
  formatMetricValue,
  getCampaignIdentity,
  getPercentageChange,
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
  { key: "leadsPerDay", label: "Leads per day", format: "decimal" },
  { key: "conversionRate", label: "Conversion rate", format: "percent" },
  { key: "costPerConvertedLead", label: "Cost per converted lead", format: "currency", lowerIsBetter: true },
  { key: "ctr", label: "CTR", format: "percent" },
  { key: "cpc", label: "CPC", format: "currency", lowerIsBetter: true },
  { key: "cpm", label: "CPM", format: "currency", lowerIsBetter: true },
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

export const buildCampaignFunnel = (outcome) => {
  const stages = [
    { key: "impressions", label: "Impressions", value: outcome.impressions },
    { key: "reach", label: "Reach", value: outcome.reach },
    { key: "linkClicks", label: "Link clicks", value: outcome.linkClicks ?? outcome.clicks },
    { key: "results", label: "Meta leads", value: outcome.results },
    { key: "contacted", label: "Contacted", value: outcome.manualLeads?.contacted + outcome.manualLeads?.converted + outcome.manualLeads?.failed },
    { key: "converted", label: "Converted", value: outcome.manualLeads?.converted },
  ].filter((stage) => hasNumber(stage.value));

  const rateMap = {
    reach: ["Reach rate", outcome.reach, outcome.impressions],
    linkClicks: ["CTR", outcome.linkClicks ?? outcome.clicks, outcome.impressions],
    results: ["Click-to-lead rate", outcome.results, outcome.linkClicks ?? outcome.clicks],
    contacted: ["Contact rate", outcome.manualLeads?.contacted + outcome.manualLeads?.converted + outcome.manualLeads?.failed, outcome.manualLeads?.total],
    converted: ["Lead-to-conversion rate", outcome.manualLeads?.converted, outcome.manualLeads?.total],
  };

  const rates = stages
    .slice(1)
    .map((stage) => {
      const [label, numerator, denominator] = rateMap[stage.key] || [];
      return { key: stage.key, label, value: safeDivide(numerator, denominator, 100) };
    })
    .filter((rate) => rate.label && hasNumber(rate.value));

  return { stages, rates };
};

export const buildCampaignTrendAnalysis = (rows) => {
  const dailyRows = buildTrendRows(rows, "Daily", "results");
  const dailySummaries = buildTrendRows(rows, "Daily", "amountSpent").map((row, index) => ({
    ...dailyRows[index],
    summary: dailyRows[index]?.summary || row.summary,
  }));
  const validLeadDays = dailySummaries.filter((row) => hasNumber(row.summary?.results));
  const validCplDays = dailySummaries.filter((row) => hasNumber(row.summary?.costPerResult));
  const bestLeadDay = [...validLeadDays].sort((a, b) => Number(b.summary.results) - Number(a.summary.results))[0] || null;
  const highestCostPerLeadDay = [...validCplDays].sort((a, b) => Number(b.summary.costPerResult) - Number(a.summary.costPerResult))[0] || null;
  const midpoint = Math.ceil(dailySummaries.length / 2);
  const firstHalf = buildCampaignOutcome(dailySummaries.slice(0, midpoint).flatMap((row) => row.rows || []));
  const secondHalf = buildCampaignOutcome(dailySummaries.slice(midpoint).flatMap((row) => row.rows || []));
  const enoughData = dailySummaries.length >= 4;

  return {
    bestLeadDay,
    highestCostPerLeadDay,
    firstHalf,
    secondHalf,
    leadDirection: enoughData ? getPercentageChange(secondHalf.results, firstHalf.results) : null,
    cplDirection: enoughData ? getPercentageChange(secondHalf.costPerResult, firstHalf.costPerResult) : null,
    enoughData,
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

export const buildPreviousComparableCampaign = (selectedCampaign, comparisonReport) => {
  const selectedStart = parseDate(selectedCampaign?.reportingStarts || selectedCampaign?.startDateKey);
  if (!selectedStart) return null;

  return [...(comparisonReport.comparableRows || [])]
    .filter((campaign) => parseDate(campaign.reportingEnds || campaign.endDateKey) < selectedStart)
    .sort((first, second) => parseDate(second.reportingEnds || second.endDateKey) - parseDate(first.reportingEnds || first.endDateKey))[0] || null;
};

export const buildCampaignVerdict = (outcome, comparisonReport) => {
  if (!hasNumber(outcome.results) || Number(outcome.results) === 0 || !hasNumber(outcome.amountSpent)) {
    return { label: "Insufficient data", score: 0, rules: ["Spend and lead data are required."] };
  }

  let score = 0;
  const rules = [];
  const cplAverage = comparisonReport.rows.find((row) => row.key === "costPerResult")?.averageValue;
  const leadsPer100Average = comparisonReport.rows.find((row) => row.key === "leadsPer100")?.averageValue;
  const conversionAverage = comparisonReport.rows.find((row) => row.key === "conversionRate")?.averageValue;

  if (hasNumber(cplAverage)) {
    if (outcome.costPerResult <= cplAverage * 0.9) score += 2;
    else if (outcome.costPerResult <= cplAverage * 1.1) score += 1;
    else score -= 1;
    rules.push(`Cost per lead compared with average ${formatMetricValue(cplAverage, "currency")}.`);
  }

  if (hasNumber(leadsPer100Average)) {
    if (outcome.leadsPer100 >= leadsPer100Average * 1.1) score += 2;
    else if (outcome.leadsPer100 >= leadsPer100Average * 0.9) score += 1;
    else score -= 1;
    rules.push(`Leads per $100 compared with average ${formatMetricValue(leadsPer100Average, "decimal")}.`);
  }

  if (hasNumber(conversionAverage) && hasNumber(outcome.manualLeads?.conversionRate)) {
    score += outcome.manualLeads.conversionRate >= conversionAverage ? 1 : -1;
    rules.push(`Manual conversion rate compared with average ${formatMetricValue(conversionAverage, "percent")}.`);
  }

  if (rules.length === 0) {
    return { label: "Average", score: 1, rules: ["Limited comparison data is available."] };
  }

  if (score >= 4) return { label: "Excellent", score, rules };
  if (score >= 2) return { label: "Strong", score, rules };
  if (score >= 0) return { label: "Average", score, rules };
  return { label: "Weak", score, rules };
};

const addFinding = (items, text) => {
  if (text && !items.includes(text) && items.length < 3) items.push(text);
};

export const buildCampaignFindings = ({ outcome, comparisonReport, trendAnalysis }) => {
  const worked = [];
  const attention = [];
  const cpl = comparisonReport.rows.find((row) => row.key === "costPerResult");
  const leadsPer100 = comparisonReport.rows.find((row) => row.key === "leadsPer100");
  const conversion = comparisonReport.rows.find((row) => row.key === "conversionRate");

  if (hasNumber(cpl?.averageValue) && hasNumber(outcome.costPerResult)) {
    const change = getPercentageChange(outcome.costPerResult, cpl.averageValue);
    if (change !== null && change <= -10) {
      addFinding(worked, `Cost per lead was ${Math.abs(change).toFixed(1)}% below the comparable-campaign average.`);
    } else if (change !== null && change >= 10) {
      addFinding(attention, `Cost per lead was ${change.toFixed(1)}% above the comparable-campaign average.`);
    }
  }

  if (hasNumber(leadsPer100?.averageValue) && hasNumber(outcome.leadsPer100)) {
    const change = getPercentageChange(outcome.leadsPer100, leadsPer100.averageValue);
    if (change !== null && change >= 10) {
      addFinding(worked, `Leads per $100 was ${change.toFixed(1)}% above the comparable-campaign average.`);
    } else if (change !== null && change <= -10) {
      addFinding(attention, `Leads per $100 was ${Math.abs(change).toFixed(1)}% below the comparable-campaign average.`);
    }
  }

  if (conversion?.selectedRank) {
    addFinding(worked, `Conversion rate ranked ${conversion.selectedRank} of ${conversion.totalRanked} comparable campaigns.`);
  }

  if (trendAnalysis.enoughData && trendAnalysis.cplDirection !== null && trendAnalysis.cplDirection > 20) {
    addFinding(attention, `Cost per lead increased from ${formatMetricValue(trendAnalysis.firstHalf.costPerResult, "currency")} in the first half to ${formatMetricValue(trendAnalysis.secondHalf.costPerResult, "currency")} in the second half.`);
  }

  if ((outcome.manualLeads?.requiringAction || 0) > 0) {
    addFinding(attention, `${formatMetricValue(outcome.manualLeads.requiringAction)} leads still require contact.`);
  }

  if (hasNumber(outcome.manualLeads?.failedRate) && outcome.manualLeads.failedRate >= 30) {
    addFinding(attention, `Failed lead rate is ${formatMetricValue(outcome.manualLeads.failedRate, "percent")}.`);
  }

  return { worked, attention };
};

export const buildCampaignAssessment = ({ verdict, outcome, findings }) => {
  if (verdict.label === "Insufficient data") {
    return {
      overallResult: verdict.label,
      primaryStrength: "—",
      primaryWeakness: "—",
      recommendedNextAction: "Insufficient data to make a recommendation.",
    };
  }

  const hasUncontacted = (outcome.manualLeads?.requiringAction || 0) > 0;
  const highConversion = hasNumber(outcome.manualLeads?.conversionRate) && outcome.manualLeads.conversionRate >= 25;
  const highCpl = findings.attention.some((finding) => /cost per lead/i.test(finding));
  const strongLeadEfficiency = findings.worked.some((finding) => /leads per \$100|cost per lead/i.test(finding));

  let recommendedNextAction = "Preserve the offer and targeting for the next campaign.";
  if (hasUncontacted) recommendedNextAction = "Contact outstanding leads before increasing campaign spend.";
  else if (highCpl) recommendedNextAction = "Refresh campaign creative earlier and review audience efficiency.";
  else if (hasNumber(outcome.results) && outcome.results > 0 && !highConversion) {
    recommendedNextAction = "Review lead qualification because lead volume was recorded but conversion is limited.";
  }

  return {
    overallResult: verdict.label,
    primaryStrength: findings.worked[0] || (strongLeadEfficiency ? "Lead efficiency was competitive." : "Campaign generated measurable lead data."),
    primaryWeakness: findings.attention[0] || "No major measurable weakness identified.",
    recommendedNextAction,
  };
};

export const buildLeaderboardRows = (comparisonReport) =>
  [...(comparisonReport.leaderboardRows || [])].map((campaign) => ({
    ...campaign,
    overallResult: buildCampaignVerdict(campaign, comparisonReport).label,
  }));

export const reviewMetricDefinitions = metricDefinitions;
