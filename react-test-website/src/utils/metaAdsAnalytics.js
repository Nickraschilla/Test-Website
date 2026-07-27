import { META_ADS_ANCHOR_DATE } from "../data/metaAdsFixtures";

export const DATE_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: null },
];

export const GROUPING_OPTIONS = ["Daily", "Weekly", "Monthly"];

export const TREND_METRICS = [
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "results", label: "Results", format: "number" },
  { key: "costPerResult", label: "Cost per Result", format: "currency", lowerIsBetter: true },
  { key: "impressions", label: "Impressions", format: "number" },
  { key: "reach", label: "Reach", format: "number" },
];

export const KPI_METRICS = TREND_METRICS;

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-AU", {
  maximumFractionDigits: 0,
});

const hasNumber = (value) => value !== null && value !== undefined && Number.isFinite(Number(value));

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

export const safeDivide = (numerator, denominator, multiplier = 1) => {
  if (!hasNumber(denominator) || Number(denominator) === 0) return null;
  if (!hasNumber(numerator)) return null;
  return (Number(numerator) / Number(denominator)) * multiplier;
};

const getRowDate = (row) => parseDate(row.reportingStarts || row.date);

export const buildDateWindows = (range, rows, anchorDateKey = META_ADS_ANCHOR_DATE) => {
  const option = DATE_RANGE_OPTIONS.find((item) => item.value === range) || DATE_RANGE_OPTIONS[1];
  const rowDates = rows
    .map(getRowDate)
    .filter(Boolean)
    .sort((a, b) => a - b);
  const endDate = rowDates[rowDates.length - 1] || parseDate(anchorDateKey) || new Date();
  const startDate = option.days
    ? addDays(endDate, -(option.days - 1))
    : rowDates[0] || endDate;
  const periodDays = Math.max(1, Math.round((endDate - startDate) / 86400000) + 1);
  const previousEndDate = addDays(startDate, -1);
  const previousStartDate = addDays(previousEndDate, -(periodDays - 1));

  return {
    current: { startDate, endDate },
    previous: { startDate: previousStartDate, endDate: previousEndDate },
  };
};

export const isWithinWindow = (row, window) => {
  const rowDate = getRowDate(row);
  if (!rowDate) return false;
  return rowDate >= window.startDate && rowDate <= window.endDate;
};

export const getMetaAdsFilterOptions = (rows) => ({
  campaigns: [...new Set(rows.map((row) => row.campaignName).filter(Boolean))].sort(),
  deliveries: [...new Set(rows.map((row) => row.campaignDelivery).filter(Boolean))].sort(),
  resultIndicators: [...new Set(rows.map((row) => row.resultIndicator).filter(Boolean))].sort(),
});

export const filterMetaAdsRows = (rows, filters, window) =>
  rows.filter((row) => {
    if (window && filters.dateRange !== "all" && !isWithinWindow(row, window)) return false;
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
      amountSpentCount: total.amountSpentCount + (hasNumber(row.amountSpent) ? 1 : 0),
      resultsCount: total.resultsCount + (hasNumber(row.results) ? 1 : 0),
      impressionsCount: total.impressionsCount + (hasNumber(row.impressions) ? 1 : 0),
      reachCount: total.reachCount + (hasNumber(row.reach) ? 1 : 0),
    }),
    {
      amountSpent: 0,
      results: 0,
      impressions: 0,
      reach: 0,
      amountSpentCount: 0,
      resultsCount: 0,
      impressionsCount: 0,
      reachCount: 0,
    }
  );

export const buildMetaAdsSummary = (rows) => {
  const totals = sumMetaAdsRows(rows);

  return {
    ...totals,
    campaignCount: new Set(rows.map((row) => row.campaignName).filter(Boolean)).size,
    costPerResult: safeDivide(totals.amountSpent, totals.results),
    resultRateByReach: safeDivide(totals.results, totals.reach, 100),
    resultRateByImpressions: safeDivide(totals.results, totals.impressions, 100),
    amountSpent: totals.amountSpentCount ? totals.amountSpent : null,
    results: totals.resultsCount ? totals.results : null,
    impressions: totals.impressionsCount ? totals.impressions : null,
    reach: totals.reachCount ? totals.reach : null,
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
  if (change === null) return "No previous period";
  const improved = metric.lowerIsBetter ? change < 0 : change > 0;
  const unchanged = Math.abs(change) < 0.1;

  if (unchanged) return "Flat vs previous";
  return `${improved ? "Improved" : "Needs attention"} ${Math.abs(change).toFixed(1)}%`;
};

export const getComparisonClass = (metric, change) => {
  if (change === null || Math.abs(change) < 0.1) return "meta-ads-comparison-neutral";
  const improved = metric.lowerIsBetter ? change < 0 : change > 0;
  return improved ? "meta-ads-comparison-positive" : "meta-ads-comparison-negative";
};

const mergeLabel = (values) => {
  const uniqueValues = [...new Set(values.filter(Boolean))];
  if (uniqueValues.length === 0) return "—";
  if (uniqueValues.length === 1) return uniqueValues[0];
  return `${uniqueValues.length} types`;
};

export const aggregateByCampaign = (rows) => {
  const groups = new Map();

  rows.forEach((row) => {
    const key = row.campaignName || row.id;
    const group = groups.get(key) || {
      campaignName: row.campaignName,
      rows: [],
    };
    group.rows.push(row);
    groups.set(key, group);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    ...buildMetaAdsSummary(group.rows),
    campaignDelivery: mergeLabel(group.rows.map((row) => row.campaignDelivery)),
    resultIndicator: mergeLabel(group.rows.map((row) => row.resultIndicator)),
    reportingStarts: group.rows
      .map((row) => row.reportingStarts)
      .filter(Boolean)
      .sort()[0],
    reportingEnds: (() => {
      const sortedEnds = group.rows
      .map((row) => row.reportingEnds)
      .filter(Boolean)
        .sort();
      return sortedEnds[sortedEnds.length - 1];
    })(),
  }));
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
    return { key: formatDateKey(weekStart), label: `Week of ${weekStart.getDate()}/${weekStart.getMonth() + 1}` };
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

  rows.forEach((row) => {
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

  rows.forEach((row) => {
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

export const buildInsights = ({ campaigns, summary }) => {
  const insights = [];
  const campaignsWithResults = campaigns.filter((campaign) => hasNumber(campaign.results) && campaign.results > 0);

  const topResultCampaign = sortRows(campaignsWithResults, "results", "desc")[0];
  if (topResultCampaign) {
    insights.push(`${topResultCampaign.campaignName} has the highest result volume with ${formatMetricValue(topResultCampaign.results)} ${topResultCampaign.resultIndicator.toLowerCase()}.`);
  }

  const bestCostCampaign = sortRows(
    campaignsWithResults.filter((campaign) => hasNumber(campaign.costPerResult)),
    "costPerResult",
    "asc"
  )[0];
  if (bestCostCampaign) {
    insights.push(`${bestCostCampaign.campaignName} has the lowest cost per result at ${formatMetricValue(bestCostCampaign.costPerResult, "currency")}.`);
  }

  const noDeliveryCampaign = campaigns.find((campaign) => !campaign.campaignDelivery || campaign.campaignDelivery === "—");
  if (noDeliveryCampaign) {
    insights.push(`${noDeliveryCampaign.campaignName} has no delivery value in the sheet.`);
  }

  const spendNoResults = campaigns.find(
    (campaign) => hasNumber(campaign.amountSpent) && campaign.amountSpent > 0 && campaign.results === 0
  );
  if (spendNoResults) {
    insights.push(`${spendNoResults.campaignName} has spend recorded with zero results for this view.`);
  }

  if (hasNumber(summary.costPerResult)) {
    insights.push(`Overall cost per result is ${formatMetricValue(summary.costPerResult, "currency")} for the selected data.`);
  }

  return insights;
};
