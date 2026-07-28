import {
  aggregateByCampaign,
  buildMetaAdsSummary,
  formatMetricValue,
  getCampaignIdentity,
  hasNumber,
  parseDate,
  safeDivide,
} from "./metaAdsAnalytics";
import { buildCampaignReviewMetrics, isActiveMetaCampaign } from "./metaAdsCampaignReview";
import { applyPlatformMetrics, calculateTotals, isInstagramReel, isPublishedInYear, parseReelDate } from "./reels";

const DAY_MS = 24 * 60 * 60 * 1000;
const BEST_CAMPAIGN_MIN_LEADS = 3;
const RECENT_CONTENT_DAYS = 30;
const STALE_DATA_DAYS = 2;

const numberFormatter = new Intl.NumberFormat("en-AU", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatDashboardNumber = (value) =>
  hasNumber(value) ? numberFormatter.format(Number(value)) : "—";

export const formatDashboardDate = (value) => {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : "—";
};

export const getPercentageChange = (current, previous) => {
  if (!hasNumber(current) || !hasNumber(previous) || Number(previous) === 0) return null;
  return ((Number(current) - Number(previous)) / Math.abs(Number(previous))) * 100;
};

export const formatPercentageChange = (value) => {
  if (!hasNumber(value)) return "—";
  const sign = Number(value) > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(1)}%`;
};

const getYear = (date) => (date ? date.getFullYear() : null);

const getMonthLabel = (monthIndex) =>
  new Intl.DateTimeFormat("en-AU", { month: "short" }).format(new Date(2026, monthIndex, 1));

const sumMetric = (rows, getValue) =>
  rows.reduce((total, row) => total + Number(getValue(row) || 0), 0);

export const getLatestSyncTime = (...rowSets) => {
  const dates = rowSets
    .flat()
    .map((row) => parseDate(row?.lastSyncedAt || row?.lastSynced || row?.syncTime))
    .filter(Boolean)
    .sort((first, second) => second - first);

  return dates[0] || null;
};

export const buildInstagramSummary = (rows, reportingYear) => {
  const currentRows = rows
    .filter((item) => isPublishedInYear(item, reportingYear))
    .map((item) => applyPlatformMetrics(item, "instagram"));
  const previousRows = rows
    .filter((item) => isPublishedInYear(item, reportingYear - 1))
    .map((item) => applyPlatformMetrics(item, "instagram"));
  const current = {
    views: sumMetric(currentRows, (row) => row.igViews || row.views),
    reach: sumMetric(currentRows, (row) => row.igReach),
    posts: currentRows.length,
    interactions: sumMetric(
      currentRows,
      (row) =>
        Number(row.igLikes || row.likes || 0) +
        Number(row.igComments || row.comments || 0) +
        Number(row.igShares || row.reshares || 0) +
        Number(row.igSaves || row.saves || 0)
    ),
  };
  const previousViews = sumMetric(previousRows, (row) => row.igViews || row.views);
  const latestFollowerRow = rows.find((item) => Number(item.igFollowers || 0) > 0);

  return {
    ...current,
    followers: Number(latestFollowerRow?.igFollowers || 0) || null,
    change: getPercentageChange(current.views, previousViews),
  };
};

export const buildSocialsSummary = (rows, reportingYear) => {
  const currentRows = rows.filter((item) => isPublishedInYear(item, reportingYear));
  const previousRows = rows.filter((item) => isPublishedInYear(item, reportingYear - 1));
  const totals = calculateTotals(currentRows);
  const previousTotals = calculateTotals(previousRows);

  return {
    views: totals.views,
    shares: totals.reshares,
    interactions: totals.likes + totals.comments + totals.reshares + totals.saves,
    reels: currentRows.filter(isInstagramReel).length,
    change: getPercentageChange(totals.views, previousTotals.views),
  };
};

export const buildMetaSummary = (rows) => {
  const summary = buildMetaAdsSummary(rows);
  return {
    ...summary,
    leads: summary.results,
    spend: summary.amountSpent,
    costPerLead: summary.costPerResult,
  };
};

export const buildLeadPipelineSummary = (leads) => {
  const total = leads.length;
  const converted = leads.filter((lead) => lead.status === "Converted").length;
  const requiringAction = leads.filter((lead) => lead.status === "New").length;

  return {
    total,
    converted,
    requiringAction,
    conversionRate: safeDivide(converted, total, 100),
  };
};

export const buildMonthlyTrend = (rows, reportingYear, getValue) => {
  const values = Array.from({ length: 12 }, (_, monthIndex) => ({
    key: `${reportingYear}-${String(monthIndex + 1).padStart(2, "0")}`,
    label: getMonthLabel(monthIndex),
    value: 0,
  }));

  rows.forEach((row) => {
    const date = parseReelDate(row) || parseDate(row.reportingStarts || row.date);
    if (!date || getYear(date) !== reportingYear) return;
    values[date.getMonth()].value += Number(getValue(row) || 0);
  });

  return values.filter((item) => item.value > 0);
};

export const buildDashboardTrend = ({ metric, instagramRows, socialsRows, metaRows, reportingYear }) => {
  if (metric === "social") {
    return buildMonthlyTrend(socialsRows, reportingYear, (row) => row.views);
  }

  if (metric === "meta") {
    return buildMonthlyTrend(metaRows, reportingYear, (row) => row.results);
  }

  return buildMonthlyTrend(
    instagramRows.map((row) => applyPlatformMetrics(row, "instagram")),
    reportingYear,
    (row) => row.igViews || row.views
  );
};

export const buildTrendInsights = (series, previousEquivalentTotal = null) => {
  const currentTotal = sumMetric(series, (item) => item.value);
  const best = [...series].sort((a, b) => b.value - a.value)[0] || null;

  return {
    total: currentTotal,
    change: getPercentageChange(currentTotal, previousEquivalentTotal),
    best,
  };
};

const getTitle = (item) =>
  item.contentTitle || item.reelName || item.name || item.campaignName || item.igMediaId || "Untitled";

export const getTopInstagramContent = (rows, reportingYear) =>
  rows
    .filter((row) => isPublishedInYear(row, reportingYear))
    .map((row) => applyPlatformMetrics(row, "instagram"))
    .sort((a, b) => Number(b.igViews || b.views || 0) - Number(a.igViews || a.views || 0))
    .map((row) => ({
      title: getTitle(row),
      views: Number(row.igViews || row.views || 0),
      secondary: Number(row.igReach || 0) || Number(row.likes || 0) + Number(row.comments || 0) + Number(row.reshares || 0) + Number(row.saves || 0),
      date: row.publishedAt,
    }))[0] || null;

export const getTopSocialContent = (rows, reportingYear) =>
  rows
    .filter((row) => isPublishedInYear(row, reportingYear))
    .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
    .map((row) => {
      const platformValues = [
        { label: "Instagram", value: Number(row.igViews || 0) },
        { label: "Facebook", value: Number(row.fbViews || 0) },
        { label: "TikTok", value: Number(row.ttViews || 0) },
      ].sort((a, b) => b.value - a.value);

      return {
        title: getTitle(row),
        views: Number(row.views || 0),
        shares: Number(row.reshares || 0),
        platform: platformValues[0]?.value > 0 ? platformValues[0].label : "All platforms",
        date: row.publishedAt,
      };
    })[0] || null;

export const getBestMetaCampaign = (rows) =>
  aggregateByCampaign(rows)
    .map((campaign) => buildCampaignReviewMetrics(campaign, []))
    .filter((campaign) => Number(campaign.results || 0) >= BEST_CAMPAIGN_MIN_LEADS && hasNumber(campaign.costPerResult))
    .sort(
      (a, b) =>
        Number(a.costPerResult) - Number(b.costPerResult) ||
        Number(b.results || 0) - Number(a.results || 0)
    )[0] || null;

const getLatestContentDate = (rows) =>
  rows
    .map(parseReelDate)
    .filter(Boolean)
    .sort((a, b) => b - a)[0] || null;

export const buildRecentActivity = ({ instagramRows, socialsRows, metaRows, manualLeads }) => {
  const activity = [];

  instagramRows.forEach((row) => {
    const date = parseReelDate(row);
    if (!date) return;
    activity.push({
      date,
      title: "Instagram content added",
      detail: getTitle(row),
      tab: "new-page",
    });
  });

  socialsRows.filter(isInstagramReel).forEach((row) => {
    const date = parseReelDate(row);
    if (!date) return;
    activity.push({
      date,
      title: "Social reel added",
      detail: getTitle(row),
      tab: "socials",
    });
  });

  aggregateByCampaign(metaRows).forEach((campaign) => {
    const dates = (campaign.rows || [])
      .flatMap((row) => [parseDate(row.reportingStarts), parseDate(row.reportingEnds)])
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (dates[0]) {
      activity.push({
        date: dates[0],
        title: "Meta campaign started",
        detail: campaign.campaignName || "Untitled campaign",
        tab: "meta-ads",
      });
    }
    const lastDate = dates.at(-1);
    if (lastDate && !isActiveMetaCampaign(campaign)) {
      activity.push({
        date: lastDate,
        title: "Meta campaign ended",
        detail: campaign.campaignName || "Untitled campaign",
        tab: "meta-ads",
      });
    }
  });

  manualLeads.forEach((lead) => {
    const date = parseDate(lead.createdAt || lead.date || lead.lastUpdatedAt);
    if (!date) return;
    activity.push({
      date,
      title: "Manual lead recorded",
      detail: lead.campaignName || lead.campaignId || "Lead pipeline",
      tab: "meta-ads",
    });
  });

  return activity
    .sort((a, b) => b.date - a.date)
    .slice(0, 5);
};

const daysBetween = (older, newer) => Math.floor((newer - older) / DAY_MS);

export const buildAttentionItems = ({
  instagramRows,
  socialsRows,
  metaRows,
  manualLeads,
  latestSyncTime,
  now = new Date(),
}) => {
  const items = [];
  const newLeads = manualLeads.filter((lead) => lead.status === "New").length;

  if (newLeads > 0) {
    items.push({
      title: "Leads awaiting contact",
      detail: `${newLeads} manual lead${newLeads === 1 ? "" : "s"} marked New.`,
      tab: "meta-ads",
    });
  }

  aggregateByCampaign(metaRows).filter(isActiveMetaCampaign).forEach((campaign) => {
    const latestRows = [...(campaign.rows || [])]
      .filter((row) => parseDate(row.reportingStarts || row.date))
      .sort((a, b) => parseDate(b.reportingStarts || b.date) - parseDate(a.reportingStarts || a.date))
      .slice(0, 3);
    if (latestRows.length >= 3 && latestRows.every((row) => Number(row.results || 0) === 0)) {
      items.push({
        title: "Active campaign has no recent leads",
        detail: `${campaign.campaignName || "Campaign"} has zero leads in its last 3 reporting days.`,
        tab: "meta-ads",
      });
    }
  });

  const campaigns = aggregateByCampaign(metaRows).map((campaign) => buildCampaignReviewMetrics(campaign, []));
  const validCplCampaigns = campaigns.filter((campaign) => hasNumber(campaign.costPerResult) && Number(campaign.results || 0) > 0);
  const averageCpl =
    validCplCampaigns.length > 0
      ? sumMetric(validCplCampaigns, (campaign) => campaign.costPerResult) / validCplCampaigns.length
      : null;
  const highCpl = validCplCampaigns.find(
    (campaign) => isActiveMetaCampaign(campaign) && averageCpl && Number(campaign.costPerResult) >= averageCpl * 1.2
  );
  if (highCpl) {
    items.push({
      title: "Cost per lead is above average",
      detail: `${highCpl.campaignName || "Active campaign"} is at ${formatMetricValue(highCpl.costPerResult, "currency")} CPL.`,
      tab: "meta-ads",
    });
  }

  if (latestSyncTime && daysBetween(latestSyncTime, now) > STALE_DATA_DAYS) {
    items.push({
      title: "Data may be stale",
      detail: `Latest detected sync was ${formatDashboardDate(latestSyncTime)}.`,
      tab: "dashboard",
    });
  }

  const latestInstagramDate = getLatestContentDate(instagramRows);
  if (latestInstagramDate && daysBetween(latestInstagramDate, now) > RECENT_CONTENT_DAYS) {
    items.push({
      title: "No Instagram content recorded recently",
      detail: `Latest Instagram post was ${formatDashboardDate(latestInstagramDate)}.`,
      tab: "new-page",
    });
  }

  const latestSocialDate = getLatestContentDate(socialsRows);
  if (latestSocialDate && daysBetween(latestSocialDate, now) > RECENT_CONTENT_DAYS) {
    items.push({
      title: "No social reel recorded recently",
      detail: `Latest social reel was ${formatDashboardDate(latestSocialDate)}.`,
      tab: "socials",
    });
  }

  return items.slice(0, 4);
};

export const getPreviousEquivalentTotal = (rows, reportingYear, getValue) =>
  sumMetric(
    rows.filter((row) => {
      const date = parseReelDate(row) || parseDate(row.reportingStarts || row.date);
      return date && date.getFullYear() === reportingYear - 1;
    }),
    getValue
  );

export const getCampaignLinkId = (campaign) => getCampaignIdentity(campaign || {});
