import { META_ADS_ANCHOR_DATE } from "../data/metaAdsFixtures";

export const DATE_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "all", label: "All available data" },
  { value: "custom", label: "Custom date range" },
];

export const GROUPING_OPTIONS = ["Daily", "Weekly", "Monthly"];

export const TREND_METRICS = [
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "results", label: "Leads", format: "number" },
  { key: "costPerResult", label: "Cost per Lead", format: "currency", lowerIsBetter: true },
];

export const KPI_METRICS = [
  { key: "amountSpent", label: "Total Spend", format: "currency", neutralComparison: true },
  { key: "results", label: "Total Leads", format: "number" },
  { key: "costPerResult", label: "Cost per Lead", format: "currency", lowerIsBetter: true },
  { key: "reach", label: "Reach Estimate", format: "number", note: "Daily reach summed; use as an estimate." },
  { key: "impressions", label: "Impressions", format: "number" },
];

const MS_PER_DAY = 86400000;

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-AU", {
  maximumFractionDigits: 0,
});

export const hasNumber = (value) =>
  value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

export const parseDate = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getLatestDate = (rows, fallback = META_ADS_ANCHOR_DATE) => {
  const dates = rows
    .map((row) => getRowDate(row))
    .filter(Boolean)
    .sort((a, b) => a - b);

  return dates[dates.length - 1] || parseDate(fallback) || new Date();
};

const getEarliestDate = (rows, fallbackDate) => {
  const dates = rows
    .map((row) => getRowDate(row))
    .filter(Boolean)
    .sort((a, b) => a - b);

  return dates[0] || fallbackDate;
};

export const getRowDate = (row) => parseDate(row.reportingStarts || row.date);

export const safeDivide = (numerator, denominator, multiplier = 1) => {
  if (!hasNumber(denominator) || Number(denominator) === 0) return null;
  if (!hasNumber(numerator)) return null;
  return (Number(numerator) / Number(denominator)) * multiplier;
};

export const buildDateWindows = (
  range,
  rows,
  customRange = {},
  anchorDateKey = META_ADS_ANCHOR_DATE
) => {
  const anchorDate = getLatestDate(rows, anchorDateKey);
  let startDate;
  let endDate = anchorDate;

  if (range === "all") {
    startDate = getEarliestDate(rows, anchorDate);
  } else if (range === "this-month") {
    startDate = startOfMonth(anchorDate);
  } else if (range === "last-month") {
    const lastMonthDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
    startDate = startOfMonth(lastMonthDate);
    endDate = endOfMonth(lastMonthDate);
  } else if (range === "custom") {
    const customStart = parseDate(customRange.start);
    const customEnd = parseDate(customRange.end);
    if (customStart && customEnd && customEnd >= customStart) {
      startDate = customStart;
      endDate = customEnd;
    } else {
      startDate = null;
      endDate = null;
    }
  } else {
    const option = DATE_RANGE_OPTIONS.find((item) => item.value === range) || DATE_RANGE_OPTIONS[1];
    startDate = addDays(endDate, -(option.days - 1));
  }

  if (!startDate || !endDate) {
    return {
      current: { startDate: null, endDate: null, invalid: true },
      previous: { startDate: null, endDate: null, invalid: true },
    };
  }

  const periodDays = Math.max(1, Math.round((endDate - startDate) / MS_PER_DAY) + 1);
  const previousEndDate = addDays(startDate, -1);
  const previousStartDate = addDays(previousEndDate, -(periodDays - 1));

  return {
    current: { startDate, endDate },
    previous: { startDate: previousStartDate, endDate: previousEndDate },
  };
};

export const isWithinWindow = (row, window) => {
  if (!window || window.invalid) return false;
  const rowDate = getRowDate(row);
  if (!rowDate) return false;
  return rowDate >= window.startDate && rowDate <= window.endDate;
};

export const describeDateWindow = (window) => {
  if (!window || window.invalid || !window.startDate || !window.endDate) {
    return "Invalid date range";
  }

  return `${formatDateLabel(formatDateKey(window.startDate))} to ${formatDateLabel(
    formatDateKey(window.endDate)
  )}`;
};

export const getDefaultGrouping = (window) => {
  if (!window || window.invalid || !window.startDate || !window.endDate) return "Monthly";
  const days = Math.round((window.endDate - window.startDate) / MS_PER_DAY) + 1;
  if (days <= 31) return "Daily";
  if (days <= 120) return "Weekly";
  return "Monthly";
};

export const getMetaAdsFilterOptions = (rows) => ({
  campaigns: [...new Set(rows.map((row) => row.campaignName).filter(Boolean))].sort(),
  deliveries: [...new Set(rows.map((row) => row.campaignDelivery).filter(Boolean))].sort(),
  resultIndicators: [...new Set(rows.map((row) => row.resultIndicator).filter(Boolean))].sort(),
});

const getCampaignIdentity = (row) => row.campaignId || row.campaignName || row.id || "campaign";

export const dedupeMetaAdsRows = (rows) => {
  const rowsByKey = new Map();

  rows.forEach((row, index) => {
    const dateKey = row.reportingStarts || row.date || `row-${index}`;
    const key = `${getCampaignIdentity(row)}|${dateKey}`;
    rowsByKey.set(key, row);
  });

  return [...rowsByKey.values()];
};

export const filterMetaAdsRows = (rows, filters, window) =>
  dedupeMetaAdsRows(rows).filter((row) => {
    if (window && !isWithinWindow(row, window)) return false;
    if (filters.campaign !== "all" && row.campaignName !== filters.campaign) return false;
    if (filters.delivery !== "all" && row.campaignDelivery !== filters.delivery) return false;
    if (filters.resultIndicator !== "all" && row.resultIndicator !== filters.resultIndicator) {
      return false;
    }
    return true;
  });

const addMetric = (currentValue, nextValue) =>
  hasNumber(nextValue) ? currentValue + Number(nextValue) : currentValue;

export const sumMetaAdsRows = (rows) =>
  rows.reduce(
    (total, row) => ({
      amountSpent: addMetric(total.amountSpent, row.amountSpent),
      results: addMetric(total.results, row.results),
      impressions: addMetric(total.impressions, row.impressions),
      reach: addMetric(total.reach, row.reach),
      frequencyWeightedReach: hasNumber(row.frequency) && hasNumber(row.reach)
        ? total.frequencyWeightedReach + Number(row.frequency) * Number(row.reach)
        : total.frequencyWeightedReach,
      amountSpentCount: total.amountSpentCount + (hasNumber(row.amountSpent) ? 1 : 0),
      resultsCount: total.resultsCount + (hasNumber(row.results) ? 1 : 0),
      impressionsCount: total.impressionsCount + (hasNumber(row.impressions) ? 1 : 0),
      reachCount: total.reachCount + (hasNumber(row.reach) ? 1 : 0),
      frequencyReachCount: total.frequencyReachCount + (hasNumber(row.frequency) && hasNumber(row.reach) ? Number(row.reach) : 0),
    }),
    {
      amountSpent: 0,
      results: 0,
      impressions: 0,
      reach: 0,
      frequencyWeightedReach: 0,
      amountSpentCount: 0,
      resultsCount: 0,
      impressionsCount: 0,
      reachCount: 0,
      frequencyReachCount: 0,
    }
  );

export const buildMetaAdsSummary = (rows) => {
  const uniqueRows = dedupeMetaAdsRows(rows);
  const totals = sumMetaAdsRows(uniqueRows);

  return {
    ...totals,
    campaignCount: new Set(uniqueRows.map(getCampaignIdentity).filter(Boolean)).size,
    costPerResult: safeDivide(totals.amountSpent, totals.results),
    resultRateByReach: safeDivide(totals.results, totals.reach, 100),
    resultRateByImpressions: safeDivide(totals.results, totals.impressions, 100),
    frequency: safeDivide(totals.frequencyWeightedReach, totals.frequencyReachCount),
    amountSpent: totals.amountSpentCount ? totals.amountSpent : null,
    results: totals.resultsCount ? totals.results : null,
    impressions: totals.impressionsCount ? totals.impressions : null,
    reach: totals.reachCount ? totals.reach : null,
    reachIsEstimate: totals.reachCount > 1,
  };
};

export const formatMetricValue = (value, format = "number") => {
  if (!hasNumber(value)) return "—";
  if (format === "currency") return currencyFormatter.format(value);
  if (format === "percent") return `${Number(value).toFixed(2)}%`;
  if (format === "decimal") return Number(value).toFixed(2);
  return numberFormatter.format(value);
};

export const formatDateLabel = (value) => {
  const date = parseDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const getPercentageChange = (currentValue, previousValue) => {
  if (!hasNumber(currentValue) || !hasNumber(previousValue) || Number(previousValue) === 0) {
    return null;
  }

  return ((Number(currentValue) - Number(previousValue)) / Math.abs(Number(previousValue))) * 100;
};

export const getComparisonLabel = (metric, change) => {
  if (change === null) return "";
  const unchanged = Math.abs(change) < 0.1;
  if (unchanged) return "Flat vs previous";
  if (metric.neutralComparison) return `${change > 0 ? "Up" : "Down"} ${Math.abs(change).toFixed(1)}%`;
  const improved = metric.lowerIsBetter ? change < 0 : change > 0;
  return `${improved ? "Improved" : "Declined"} ${Math.abs(change).toFixed(1)}%`;
};

export const getComparisonClass = (metric, change) => {
  if (change === null || Math.abs(change) < 0.1 || metric.neutralComparison) {
    return "meta-ads-comparison-neutral";
  }
  const improved = metric.lowerIsBetter ? change < 0 : change > 0;
  return improved ? "meta-ads-comparison-positive" : "meta-ads-comparison-negative";
};

const getLatestDelivery = (rows) => {
  const sorted = [...rows]
    .filter((row) => row.campaignDelivery && getRowDate(row))
    .sort((a, b) => getRowDate(a) - getRowDate(b));
  return sorted[sorted.length - 1]?.campaignDelivery || "—";
};

export const aggregateByCampaign = (rows) => {
  const groups = new Map();

  dedupeMetaAdsRows(rows).forEach((row) => {
    const key = getCampaignIdentity(row);
    const group = groups.get(key) || {
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      rows: [],
    };
    group.rows.push(row);
    group.campaignName = row.campaignName || group.campaignName;
    groups.set(key, group);
  });

  return [...groups.values()].map((group) => {
    const summary = buildMetaAdsSummary(group.rows);
    return {
      ...group,
      ...summary,
      campaignDelivery: getLatestDelivery(group.rows),
      resultIndicator: "Leads",
      reportingStarts: group.rows.map((row) => row.reportingStarts).filter(Boolean).sort()[0],
      reportingEnds: group.rows.map((row) => row.reportingEnds).filter(Boolean).sort().at(-1),
    };
  });
};

const getWeekStart = (date) => {
  const nextDate = new Date(date);
  const day = nextDate.getDay() || 7;
  nextDate.setDate(nextDate.getDate() - day + 1);
  return nextDate;
};

const getTrendBucket = (dateValue, grouping) => {
  const date = parseDate(dateValue);
  if (!date) return null;

  if (grouping === "Weekly") {
    const weekStart = getWeekStart(date);
    return {
      key: formatDateKey(weekStart),
      label: `Week of ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
    };
  }

  if (grouping === "Monthly") {
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-AU", { month: "short", year: "2-digit" }).format(date),
    };
  }

  return {
    key: formatDateKey(date),
    label: new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(date),
  };
};

export const buildTrendRows = (rows, grouping, metricKey) => {
  const groups = new Map();

  dedupeMetaAdsRows(rows).forEach((row) => {
    const bucket = getTrendBucket(row.reportingStarts || row.date, grouping);
    if (!bucket) return;
    const group = groups.get(bucket.key) || { key: bucket.key, label: bucket.label, rows: [] };
    group.rows.push(row);
    groups.set(bucket.key, group);
  });

  return [...groups.values()]
    .map((group) => {
      const summary = buildMetaAdsSummary(group.rows);
      return { key: group.key, label: group.label, value: summary[metricKey], summary };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
};

export const sortRows = (rows, sortKey, direction = "desc") => {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const first = a[sortKey];
    const second = b[sortKey];

    if (typeof first === "string" || typeof second === "string") {
      return String(first || "").localeCompare(String(second || "")) * multiplier;
    }

    const firstNumber = hasNumber(first) ? Number(first) : Number.NEGATIVE_INFINITY;
    const secondNumber = hasNumber(second) ? Number(second) : Number.NEGATIVE_INFINITY;
    return (firstNumber - secondNumber) * multiplier;
  });
};

export const buildDeliveryRows = (rows) => {
  const groups = new Map();

  dedupeMetaAdsRows(rows).forEach((row) => {
    const key = row.campaignDelivery || "No delivery";
    const group = groups.get(key) || { label: key, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    ...buildMetaAdsSummary(group.rows),
  }));
};

export const buildInsights = ({ campaigns, summary, previousSummary }) => {
  const insights = [];
  const seen = new Set();
  const addInsight = (key, text) => {
    if (!text || seen.has(key) || insights.length >= 6) return;
    seen.add(key);
    insights.push(text);
  };
  const campaignsWithLeads = campaigns.filter((campaign) => hasNumber(campaign.results) && campaign.results > 0);

  const topLeadCampaign = sortRows(campaignsWithLeads, "results", "desc")[0];
  if (topLeadCampaign) {
    addInsight(
      `top-leads-${topLeadCampaign.campaignId || topLeadCampaign.campaignName}`,
      `${topLeadCampaign.campaignName} generated the most leads in this period with ${formatMetricValue(topLeadCampaign.results)}.`
    );
  }

  const bestCostCampaign = sortRows(
    campaignsWithLeads.filter((campaign) => hasNumber(campaign.costPerResult)),
    "costPerResult",
    "asc"
  )[0];
  if (bestCostCampaign && bestCostCampaign.results >= 2) {
    addInsight(
      `best-cost-${bestCostCampaign.campaignId || bestCostCampaign.campaignName}`,
      `${bestCostCampaign.campaignName} had the lowest Cost per Lead at ${formatMetricValue(bestCostCampaign.costPerResult, "currency")}.`
    );
  }

  const spendNoLeads = sortRows(
    campaigns.filter((campaign) => hasNumber(campaign.amountSpent) && campaign.amountSpent > 0 && Number(campaign.results || 0) === 0),
    "amountSpent",
    "desc"
  )[0];
  if (spendNoLeads) {
    addInsight(
      `spend-no-leads-${spendNoLeads.campaignId || spendNoLeads.campaignName}`,
      `${spendNoLeads.campaignName} spent ${formatMetricValue(spendNoLeads.amountSpent, "currency")} without recording a lead.`
    );
  }

  const highCostCampaign = sortRows(
    campaignsWithLeads.filter(
      (campaign) =>
        hasNumber(campaign.costPerResult) &&
        hasNumber(summary.costPerResult) &&
        campaign.costPerResult > summary.costPerResult
    ),
    "costPerResult",
    "desc"
  )[0];
  if (highCostCampaign) {
    addInsight(
      `high-cost-${highCostCampaign.campaignId || highCostCampaign.campaignName}`,
      `${highCostCampaign.campaignName} had the highest Cost per Lead at ${formatMetricValue(highCostCampaign.costPerResult, "currency")}.`
    );
  }

  const notDelivering = campaigns.find(
    (campaign) => campaign.campaignDelivery && !/active/i.test(campaign.campaignDelivery)
  );
  if (notDelivering) {
    addInsight(
      `delivery-${notDelivering.campaignId || notDelivering.campaignName}`,
      `${notDelivering.campaignName} is currently marked as ${notDelivering.campaignDelivery}.`
    );
  }

  const cplChange = getPercentageChange(summary.costPerResult, previousSummary?.costPerResult);
  if (cplChange !== null) {
    addInsight(
      "account-cpl-change",
      `Account Cost per Lead ${cplChange > 0 ? "increased" : "decreased"} ${Math.abs(cplChange).toFixed(1)}% compared with the previous period.`
    );
  }

  return insights;
};
