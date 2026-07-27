import { META_ADS_ANCHOR_DATE } from "../data/metaAdsFixtures";

export const DATE_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: null },
];

export const PLATFORM_OPTIONS = ["Combined", "Instagram", "Facebook"];
export const GROUPING_OPTIONS = ["Daily", "Weekly", "Monthly"];

export const TREND_METRICS = [
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "leads", label: "Leads", format: "number" },
  { key: "costPerLead", label: "Cost per Lead", format: "currency" },
  { key: "linkClicks", label: "Link Clicks", format: "number" },
  { key: "clickThroughRate", label: "CTR", format: "percent" },
  { key: "reach", label: "Reach", format: "number" },
  { key: "impressions", label: "Impressions", format: "number" },
];

export const KPI_METRICS = [
  { key: "amountSpent", label: "Amount Spent", format: "currency" },
  { key: "leads", label: "Leads", format: "number" },
  { key: "costPerLead", label: "Cost per Lead", format: "currency", lowerIsBetter: true },
  { key: "linkClicks", label: "Link Clicks", format: "number" },
  { key: "clickThroughRate", label: "Click-through Rate", format: "percent" },
  { key: "costPerClick", label: "Cost per Click", format: "currency", lowerIsBetter: true },
  { key: "reach", label: "Reach", format: "number" },
  { key: "impressions", label: "Impressions", format: "number" },
];

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-AU", {
  maximumFractionDigits: 0,
});

const parseDate = (dateKey) => {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day);
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
  if (!denominator) return null;
  return (Number(numerator || 0) / Number(denominator)) * multiplier;
};

export const buildDateWindows = (range, rows, anchorDateKey = META_ADS_ANCHOR_DATE) => {
  const option = DATE_RANGE_OPTIONS.find((item) => item.value === range) || DATE_RANGE_OPTIONS[1];
  const rowDates = rows.map((row) => parseDate(row.date)).sort((a, b) => a - b);
  const endDate = parseDate(anchorDateKey);
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
  const rowDate = parseDate(row.date);
  return rowDate >= window.startDate && rowDate <= window.endDate;
};

export const getMetaAdsFilterOptions = (rows) => ({
  campaigns: [...new Set(rows.map((row) => row.campaignName))].sort(),
  objectives: [...new Set(rows.map((row) => row.campaignObjective))].sort(),
  statuses: [...new Set(rows.map((row) => row.campaignStatus))].sort(),
});

export const filterMetaAdsRows = (rows, filters, window) =>
  rows.filter((row) => {
    if (window && !isWithinWindow(row, window)) return false;
    if (filters.campaign !== "all" && row.campaignName !== filters.campaign) return false;
    if (filters.objective !== "all" && row.campaignObjective !== filters.objective) return false;
    if (filters.status !== "all" && row.campaignStatus !== filters.status) return false;
    if (filters.platform !== "Combined" && row.platform !== filters.platform) return false;
    return true;
  });

export const sumMetaAdsRows = (rows) =>
  rows.reduce(
    (total, row) => ({
      amountSpent: total.amountSpent + Number(row.amountSpent || 0),
      impressions: total.impressions + Number(row.impressions || 0),
      reach: total.reach + Number(row.reach || 0),
      linkClicks: total.linkClicks + Number(row.linkClicks || 0),
      landingPageViews: total.landingPageViews + Number(row.landingPageViews || 0),
      leads: total.leads + Number(row.leads || 0),
      purchases: total.purchases + Number(row.purchases || 0),
      purchaseValue: total.purchaseValue + Number(row.purchaseValue || 0),
    }),
    {
      amountSpent: 0,
      impressions: 0,
      reach: 0,
      linkClicks: 0,
      landingPageViews: 0,
      leads: 0,
      purchases: 0,
      purchaseValue: 0,
    }
  );

export const buildMetaAdsSummary = (rows) => {
  const totals = sumMetaAdsRows(rows);

  return {
    ...totals,
    clickThroughRate: safeDivide(totals.linkClicks, totals.impressions, 100),
    costPerClick: safeDivide(totals.amountSpent, totals.linkClicks),
    costPerMille: safeDivide(totals.amountSpent, totals.impressions, 1000),
    costPerLead: safeDivide(totals.amountSpent, totals.leads),
    landingPageConversionRate: safeDivide(totals.landingPageViews, totals.linkClicks, 100),
    leadConversionRate: safeDivide(totals.leads, totals.landingPageViews, 100),
    returnOnAdSpend: safeDivide(totals.purchaseValue, totals.amountSpent),
  };
};

export const formatMetricValue = (value, format = "number") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  if (format === "currency") return currencyFormatter.format(value);
  if (format === "percent") return `${Number(value).toFixed(2)}%`;
  if (format === "decimal") return Number(value).toFixed(2);
  return numberFormatter.format(value);
};

export const getPercentageChange = (currentValue, previousValue) => {
  if (
    currentValue === null ||
    previousValue === null ||
    currentValue === undefined ||
    previousValue === undefined ||
    previousValue === 0
  ) {
    return null;
  }

  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
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

const withSummary = (key, rows) => ({ key, rows, ...buildMetaAdsSummary(rows) });

export const aggregateByCampaign = (rows) => {
  const groups = new Map();

  rows.forEach((row) => {
    const group = groups.get(row.campaignId) || {
      campaignName: row.campaignName,
      campaignId: row.campaignId,
      campaignStatus: row.campaignStatus,
      campaignObjective: row.campaignObjective,
      rows: [],
    };
    group.rows.push(row);
    groups.set(row.campaignId, group);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    ...buildMetaAdsSummary(group.rows),
  }));
};

export const aggregateByCreative = (rows) => {
  const groups = new Map();

  rows.forEach((row) => {
    const key = `${row.adId}-${row.platform}`;
    const group = groups.get(key) || {
      adName: row.adName,
      adId: row.adId,
      campaignName: row.campaignName,
      platform: row.platform,
      creativeUrl: row.creativeUrl,
      rows: [],
    };
    group.rows.push(row);
    groups.set(key, group);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    ...buildMetaAdsSummary(group.rows),
  }));
};

const getWeekStart = (date) => {
  const nextDate = new Date(date);
  const day = nextDate.getDay() || 7;
  nextDate.setDate(nextDate.getDate() - day + 1);
  return nextDate;
};

const getTrendBucket = (dateKey, grouping) => {
  const date = parseDate(dateKey);

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
    key: dateKey,
    label: new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(date),
  };
};

export const buildTrendRows = (rows, grouping, metricKey) => {
  const groups = new Map();

  rows.forEach((row) => {
    const bucket = getTrendBucket(row.date, grouping);
    const group = groups.get(bucket.key) || withSummary(bucket.key, []);
    groups.set(bucket.key, {
      ...group,
      label: bucket.label,
      rows: [...group.rows, row],
    });
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

    return (Number(first || 0) - Number(second || 0)) * multiplier;
  });
};

export const buildFunnel = (summary) => [
  { label: "Impressions", value: summary.impressions, rate: 100 },
  { label: "Link Clicks", value: summary.linkClicks, rate: summary.clickThroughRate },
  { label: "Landing Page Views", value: summary.landingPageViews, rate: summary.landingPageConversionRate },
  { label: "Leads", value: summary.leads, rate: summary.leadConversionRate },
];

export const buildInsights = ({ campaigns, creatives, summary }) => {
  const insights = [];
  const campaignsWithLeads = campaigns.filter((campaign) => campaign.leads > 0);
  const creativesWithLeads = creatives.filter((creativeItem) => creativeItem.leads > 0);

  const bestLeadCampaign = sortRows(campaignsWithLeads, "leads", "desc")[0];
  if (bestLeadCampaign) {
    insights.push(`${bestLeadCampaign.campaignName} is leading volume with ${formatMetricValue(bestLeadCampaign.leads)} leads.`);
  }

  const lowestCplCampaign = sortRows(campaignsWithLeads, "costPerLead", "asc")[0];
  if (lowestCplCampaign?.costPerLead !== null) {
    insights.push(`${lowestCplCampaign.campaignName} has the lowest cost per lead at ${formatMetricValue(lowestCplCampaign.costPerLead, "currency")}.`);
  }

  const highestCtrCampaign = sortRows(campaigns.filter((campaign) => campaign.clickThroughRate !== null), "clickThroughRate", "desc")[0];
  if (highestCtrCampaign) {
    insights.push(`${highestCtrCampaign.campaignName} has the strongest click-through rate at ${formatMetricValue(highestCtrCampaign.clickThroughRate, "percent")}.`);
  }

  const inefficientCampaign = campaigns.find((campaign) => {
    const spendShare = safeDivide(campaign.amountSpent, summary.amountSpent, 100) || 0;
    const leadShare = safeDivide(campaign.leads, summary.leads, 100) || 0;
    return spendShare >= 30 && leadShare <= 10 && campaign.amountSpent > 0;
  });
  if (inefficientCampaign) {
    insights.push(`${inefficientCampaign.campaignName} is taking a high spend share with a low lead share for this selection.`);
  }

  const bestCreative = sortRows(creativesWithLeads, "leads", "desc")[0];
  if (bestCreative) {
    insights.push(`${bestCreative.adName} is the strongest creative by leads.`);
  }

  const spendNoLeads = campaigns.find((campaign) => campaign.amountSpent > 0 && campaign.leads === 0);
  if (spendNoLeads) {
    insights.push(`${spendNoLeads.campaignName} has spend recorded without leads in this view.`);
  }

  return insights;
};
