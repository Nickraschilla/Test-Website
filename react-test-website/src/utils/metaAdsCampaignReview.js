import {
  aggregateByCampaign,
  buildMetaAdsSummary,
  buildTrendRows,
  dedupeMetaAdsRows,
  formatDateLabel,
  formatMetricValue,
  getCampaignIdentity,
  hasNumber,
  parseDate,
  safeDivide,
} from "./metaAdsAnalytics";

export const MANUAL_LEAD_STATUSES = ["New", "Contacted", "Converted", "Failed"];

const SCORE_LABELS = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  poor: "Poor",
  insufficient: "Insufficient data",
};

const SCORE_SORT_VALUE = {
  [SCORE_LABELS.excellent]: 5,
  [SCORE_LABELS.good]: 4,
  [SCORE_LABELS.average]: 3,
  [SCORE_LABELS.poor]: 2,
  [SCORE_LABELS.insufficient]: 1,
};

const ACTIVE_DELIVERY_PATTERN = /(active|delivering|live)/i;

export const getMetaCampaignId = (campaign) => getCampaignIdentity(campaign || {});

export const isActiveMetaCampaign = (campaign) =>
  ACTIVE_DELIVERY_PATTERN.test(campaign?.campaignDelivery || campaign?.campaignStatus || "");

export const getCampaignLatestDate = (campaign) => {
  const dates = (campaign?.rows || [campaign])
    .flatMap((row) => [row.reportingEnds, row.reportingStarts, row.date, row.ends, row.lastSynced])
    .map(parseDate)
    .filter(Boolean)
    .sort((first, second) => second - first);

  return dates[0] || null;
};

export const getCampaignOptionLabel = (campaign) => {
  const name = campaign.campaignName || "Untitled Campaign";
  const status = campaign.campaignDelivery || campaign.campaignStatus || "";
  if (!status) return name;
  if (isActiveMetaCampaign(campaign)) return `${name} — ${status}`;
  const latestDate = getCampaignLatestDate(campaign);
  return latestDate ? `${name} — ${status} ${formatDateLabel(latestDate)}` : `${name} — ${status}`;
};

export const buildCampaignOptions = (rows) =>
  aggregateByCampaign(rows)
    .map((campaign) => ({
      ...campaign,
      id: getMetaCampaignId(campaign),
      latestDate: getCampaignLatestDate(campaign),
      label: getCampaignOptionLabel(campaign),
    }))
    .sort((first, second) => {
      const firstTime = first.latestDate ? first.latestDate.getTime() : Number.NEGATIVE_INFINITY;
      const secondTime = second.latestDate ? second.latestDate.getTime() : Number.NEGATIVE_INFINITY;
      return secondTime - firstTime || first.campaignName.localeCompare(second.campaignName);
    });

export const getDefaultCampaignId = (rows) => {
  const options = buildCampaignOptions(rows);
  const activeCampaign = options.find(isActiveMetaCampaign);
  return activeCampaign?.id || options[0]?.id || "";
};

export const filterRowsByCampaignId = (rows, campaignId) =>
  dedupeMetaAdsRows(rows).filter((row) => getMetaCampaignId(row) === campaignId);

export const buildManualLeadSummary = (leads = []) => {
  const counts = MANUAL_LEAD_STATUSES.reduce(
    (summary, status) => ({ ...summary, [status]: 0 }),
    {}
  );
  leads.forEach((lead) => {
    if (counts[lead.status] !== undefined) counts[lead.status] += 1;
  });

  const total = leads.length;
  const contactedTotal = counts.Contacted + counts.Converted + counts.Failed;

  return {
    counts,
    total,
    contactedTotal,
    contactRate: safeDivide(contactedTotal, total, 100),
    conversionRate: safeDivide(counts.Converted, total, 100),
    convertedCount: counts.Converted,
    failedRate: safeDivide(counts.Failed, total, 100),
  };
};

export const buildCampaignReviewMetrics = (campaign, manualLeads = []) => {
  const summary = buildMetaAdsSummary(campaign?.rows || []);
  const leadSummary = buildManualLeadSummary(manualLeads);

  return {
    ...campaign,
    ...summary,
    id: getMetaCampaignId(campaign),
    manualLeadCount: leadSummary.total,
    manualConvertedCount: leadSummary.convertedCount,
    contactRate: leadSummary.contactRate,
    conversionRate: leadSummary.conversionRate,
    failedRate: leadSummary.failedRate,
    costPerConvertedCustomer: safeDivide(summary.amountSpent, leadSummary.convertedCount),
    leadsPer100: safeDivide(summary.results, summary.amountSpent, 100),
    leadSummary,
  };
};

export const getComparableCampaigns = (campaigns, selectedCampaign) => {
  const selectedObjective = selectedCampaign?.campaignObjective;
  const selectedResultIndicator = selectedCampaign?.resultIndicator;
  const hasObjective = Boolean(selectedObjective);

  const rows = campaigns.filter((campaign) => {
    if (getMetaCampaignId(campaign) === getMetaCampaignId(selectedCampaign)) return false;
    if (hasObjective) return campaign.campaignObjective === selectedObjective;
    if (selectedResultIndicator) return campaign.resultIndicator === selectedResultIndicator;
    return true;
  });

  return {
    rows,
    limited: !hasObjective,
    reason: hasObjective
      ? `Compared with campaigns using ${selectedObjective}.`
      : "Objective data is unavailable, so comparison uses matching result type where possible.",
  };
};

const average = (rows, key) => {
  const values = rows.map((row) => row[key]).filter(hasNumber);
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + Number(value), 0) / values.length;
};

const scoreRules = [
  { key: "costPerResult", label: "Cost per lead", lowerIsBetter: true, weight: 2 },
  { key: "conversionRate", label: "Conversion rate", lowerIsBetter: false, weight: 1 },
  { key: "costPerConvertedCustomer", label: "Cost per converted customer", lowerIsBetter: true, weight: 1 },
  { key: "results", label: "Lead volume", lowerIsBetter: false, weight: 1 },
  { key: "leadsPer100", label: "Leads per $100", lowerIsBetter: false, weight: 1 },
];

export const calculateCampaignScore = (campaign, comparableCampaigns = []) => {
  if (!hasNumber(campaign?.amountSpent) || !hasNumber(campaign?.results) || Number(campaign.results) <= 0) {
    return {
      label: SCORE_LABELS.insufficient,
      sortValue: SCORE_SORT_VALUE[SCORE_LABELS.insufficient],
      limited: true,
      explanation: "There is not enough spend and lead data to score this campaign.",
      points: 0,
      possiblePoints: 0,
    };
  }

  const evaluatedRules = scoreRules
    .map((rule) => {
      const campaignValue = campaign[rule.key];
      const comparisonValue = average(comparableCampaigns, rule.key);
      if (!hasNumber(campaignValue) || !hasNumber(comparisonValue) || Number(comparisonValue) === 0) {
        return null;
      }
      const improved = rule.lowerIsBetter
        ? Number(campaignValue) < Number(comparisonValue)
        : Number(campaignValue) > Number(comparisonValue);
      const close = Math.abs(Number(campaignValue) - Number(comparisonValue)) / Math.abs(Number(comparisonValue)) <= 0.1;
      return { ...rule, campaignValue, comparisonValue, improved, close };
    })
    .filter(Boolean);

  if (evaluatedRules.length === 0) {
    return {
      label: SCORE_LABELS.insufficient,
      sortValue: SCORE_SORT_VALUE[SCORE_LABELS.insufficient],
      limited: true,
      explanation: "Comparable campaign data is not strong enough to score this campaign.",
      points: 0,
      possiblePoints: 0,
    };
  }

  const points = evaluatedRules.reduce((total, rule) => {
    if (rule.improved) return total + rule.weight;
    if (rule.close) return total + rule.weight * 0.5;
    return total;
  }, 0);
  const possiblePoints = evaluatedRules.reduce((total, rule) => total + rule.weight, 0);
  const ratio = points / possiblePoints;
  const bestRule = evaluatedRules.find((rule) => rule.improved) || evaluatedRules[0];

  let label = SCORE_LABELS.poor;
  if (ratio >= 0.78) label = SCORE_LABELS.excellent;
  else if (ratio >= 0.58) label = SCORE_LABELS.good;
  else if (ratio >= 0.36) label = SCORE_LABELS.average;

  const direction = bestRule.lowerIsBetter
    ? bestRule.campaignValue < bestRule.comparisonValue ? "below" : "above"
    : bestRule.campaignValue > bestRule.comparisonValue ? "above" : "below";
  const limited = !hasNumber(campaign.conversionRate) || !hasNumber(campaign.costPerConvertedCustomer);

  return {
    label,
    sortValue: SCORE_SORT_VALUE[label],
    limited,
    explanation: `${bestRule.label} was ${direction} the comparable campaign average${limited ? ", with manual conversion data limited" : ""}.`,
    points,
    possiblePoints,
  };
};

export const buildCampaignComparisonRows = (rows, selectedCampaignId, leadsByCampaign = {}) => {
  const campaigns = aggregateByCampaign(rows).map((campaign) =>
    buildCampaignReviewMetrics(campaign, leadsByCampaign[getMetaCampaignId(campaign)] || [])
  );
  const selectedCampaign = campaigns.find((campaign) => getMetaCampaignId(campaign) === selectedCampaignId) || campaigns[0];
  const comparable = getComparableCampaigns(campaigns, selectedCampaign);
  const selectedComparablePool = comparable.rows.length ? comparable.rows : campaigns.filter(
    (campaign) => getMetaCampaignId(campaign) !== getMetaCampaignId(selectedCampaign)
  );

  return {
    rows: campaigns
      .map((campaign) => {
        const rowComparable = getComparableCampaigns(campaigns, campaign).rows;
        const comparisonPool = rowComparable.length
          ? rowComparable
          : campaigns.filter((item) => getMetaCampaignId(item) !== getMetaCampaignId(campaign));
        const score = calculateCampaignScore(campaign, comparisonPool);

        return {
          ...campaign,
          isSelected: getMetaCampaignId(campaign) === getMetaCampaignId(selectedCampaign),
          latestDate: getCampaignLatestDate(campaign),
          score,
        };
      })
      .sort((first, second) => {
        const firstTime = first.latestDate ? first.latestDate.getTime() : Number.NEGATIVE_INFINITY;
        const secondTime = second.latestDate ? second.latestDate.getTime() : Number.NEGATIVE_INFINITY;
        return secondTime - firstTime || first.campaignName.localeCompare(second.campaignName);
      }),
    selectedCampaign,
    comparableRows: selectedComparablePool,
    comparisonLimited: comparable.limited,
    comparisonReason: comparable.reason,
  };
};

const SORTABLE_SCORE_KEY = "score";
const lowerIsBetterSortKeys = new Set(["costPerResult", "costPerConvertedCustomer"]);

export const sortCampaignComparisonRows = (rows, key, direction = "desc") => {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...rows].sort((first, second) => {
    const firstValue = key === SORTABLE_SCORE_KEY ? first.score.sortValue : first[key];
    const secondValue = key === SORTABLE_SCORE_KEY ? second.score.sortValue : second[key];
    const fallback = (second.latestDate?.getTime() || 0) - (first.latestDate?.getTime() || 0);

    if (!hasNumber(firstValue) && !hasNumber(secondValue)) return fallback;
    if (!hasNumber(firstValue)) return 1;
    if (!hasNumber(secondValue)) return -1;

    const adjustedMultiplier = lowerIsBetterSortKeys.has(key) ? multiplier * -1 : multiplier;
    return (Number(firstValue) - Number(secondValue)) * adjustedMultiplier || fallback;
  });
};

export const buildCampaignTrendSummary = (rows) => {
  const dailyRows = buildTrendRows(rows, "Daily", "results");
  const validLeadRows = dailyRows.filter((row) => hasNumber(row.summary.results));
  const bestLeadDay = [...validLeadRows].sort(
    (first, second) => Number(second.summary.results) - Number(first.summary.results)
  )[0];
  const averageLeadsPerDay = validLeadRows.length
    ? validLeadRows.reduce((total, row) => total + Number(row.summary.results), 0) / validLeadRows.length
    : null;

  const midpoint = Math.ceil(dailyRows.length / 2);
  const firstHalf = buildMetaAdsSummary(dailyRows.slice(0, midpoint).flatMap((row) => row.rows || []));
  const secondHalf = buildMetaAdsSummary(dailyRows.slice(midpoint).flatMap((row) => row.rows || []));
  const hasHalves = dailyRows.length >= 4 && hasNumber(firstHalf.costPerResult) && hasNumber(secondHalf.costPerResult);

  return {
    bestLeadDay: bestLeadDay
      ? `${formatMetricValue(bestLeadDay.summary.results)} on ${formatDateLabel(bestLeadDay.key)}`
      : "—",
    averageLeadsPerDay,
    firstHalfCpl: hasHalves ? firstHalf.costPerResult : null,
    secondHalfCpl: hasHalves ? secondHalf.costPerResult : null,
    firstHalfVsSecondHalfCpl: hasHalves
      ? `${formatMetricValue(firstHalf.costPerResult, "currency")} vs ${formatMetricValue(
          secondHalf.costPerResult,
          "currency"
        )}`
      : "Insufficient daily data",
    hasEnoughDailyData: dailyRows.length >= 2,
  };
};

export const buildKeyTakeaways = ({ campaign, comparableCampaigns, trendSummary }) => {
  const worked = [];
  const attention = [];
  const addWorked = (text) => {
    if (worked.length < 3) worked.push(text);
  };
  const addAttention = (text) => {
    if (attention.length < 3) attention.push(text);
  };
  const avgCpl = average(comparableCampaigns, "costPerResult");
  const avgLeads = average(comparableCampaigns, "results");
  const avgLeadsPer100 = average(comparableCampaigns, "leadsPer100");
  const avgConversionRate = average(comparableCampaigns, "conversionRate");
  const avgCostConverted = average(comparableCampaigns, "costPerConvertedCustomer");

  if (hasNumber(campaign.costPerResult) && hasNumber(avgCpl)) {
    if (campaign.costPerResult < avgCpl) addWorked("Cost per lead was below the comparable campaign average.");
    else if (campaign.costPerResult > avgCpl) addAttention("Cost per lead was above the comparable campaign average.");
  }
  if (hasNumber(campaign.results) && hasNumber(avgLeads)) {
    if (campaign.results > avgLeads) addWorked("Lead volume was above the comparable campaign average.");
    else if (campaign.results < avgLeads) addAttention("Lead volume was below the comparable campaign average.");
  }
  if (hasNumber(campaign.leadsPer100) && hasNumber(avgLeadsPer100)) {
    if (campaign.leadsPer100 > avgLeadsPer100) addWorked("Leads per $100 spent was above average.");
    else if (campaign.leadsPer100 < avgLeadsPer100) addAttention("Leads per $100 spent was below average.");
  }
  if (hasNumber(campaign.conversionRate) && hasNumber(avgConversionRate)) {
    if (campaign.conversionRate > avgConversionRate) addWorked("Conversion rate was above average.");
    else if (campaign.conversionRate < avgConversionRate) addAttention("Conversion rate was below average.");
  }
  if (hasNumber(campaign.costPerConvertedCustomer) && hasNumber(avgCostConverted)) {
    if (campaign.costPerConvertedCustomer < avgCostConverted) addWorked("Cost per converted customer was below average.");
    else if (campaign.costPerConvertedCustomer > avgCostConverted) addAttention("Cost per converted customer was high compared with similar campaigns.");
  }
  if (hasNumber(trendSummary?.firstHalfCpl) && hasNumber(trendSummary?.secondHalfCpl)) {
    if (trendSummary.secondHalfCpl < trendSummary.firstHalfCpl) {
      addWorked("Cost per lead improved during the second half of the campaign.");
    } else if (trendSummary.secondHalfCpl > trendSummary.firstHalfCpl) {
      addAttention("Rising cost per lead may indicate declining campaign efficiency.");
    }
  }
  if ((campaign.leadSummary?.counts?.New || 0) > 0) {
    addAttention("Some manual leads are still marked as New.");
  }
  if (hasNumber(campaign.failedRate) && campaign.failedRate >= 35) {
    addAttention("A high proportion of manual leads were marked Failed.");
  }

  return { worked, attention };
};
