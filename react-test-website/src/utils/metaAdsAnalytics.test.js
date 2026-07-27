import {
  aggregateByCampaign,
  buildDateWindows,
  buildInsights,
  buildMetaAdsSummary,
  buildTrendRows,
  dedupeMetaAdsRows,
  filterMetaAdsRows,
  formatDateKey,
  formatMetricValue,
  getComparisonClass,
} from "./metaAdsAnalytics";
import { parseMetaAdsSheetResults } from "./metaAdsSheetParser";

const baseFilters = {
  campaign: "all",
  delivery: "all",
  resultIndicator: "all",
};

const dailyRows = [
  {
    reportingStarts: "2026-07-01",
    reportingEnds: "2026-07-01",
    campaignId: "cmp_a",
    campaignName: "Campaign A",
    campaignDelivery: "ACTIVE",
    resultIndicator: "Leads",
    amountSpent: 100,
    results: 4,
    impressions: 1000,
    reach: 800,
    frequency: 1.25,
  },
  {
    reportingStarts: "2026-07-02",
    reportingEnds: "2026-07-02",
    campaignId: "cmp_a",
    campaignName: "Campaign A Renamed",
    campaignDelivery: "PAUSED",
    resultIndicator: "Leads",
    amountSpent: 50,
    results: 0,
    impressions: 500,
    reach: 350,
    frequency: 1.1,
  },
  {
    reportingStarts: "2026-07-02",
    reportingEnds: "2026-07-02",
    campaignId: "cmp_b",
    campaignName: "Campaign B",
    campaignDelivery: "ACTIVE",
    resultIndicator: "Leads",
    amountSpent: 75,
    results: 6,
    impressions: 900,
    reach: 600,
    frequency: 1.5,
  },
];

test("builds inclusive last 7, last 30, this month, last month and custom date windows", () => {
  expect(formatDateKey(buildDateWindows("7", dailyRows).current.startDate)).toBe("2026-06-26");
  expect(formatDateKey(buildDateWindows("30", dailyRows).current.startDate)).toBe("2026-06-03");
  expect(formatDateKey(buildDateWindows("this-month", dailyRows).current.startDate)).toBe("2026-07-01");
  expect(formatDateKey(buildDateWindows("last-month", dailyRows).current.startDate)).toBe("2026-06-01");
  expect(
    buildDateWindows("custom", dailyRows, { start: "2026-07-01", end: "2026-07-02" }).current.invalid
  ).toBeUndefined();
  expect(
    buildDateWindows("custom", dailyRows, { start: "2026-07-03", end: "2026-07-02" }).current.invalid
  ).toBe(true);
});

test("filters rows by inclusive date window, campaign, delivery and result indicator", () => {
  const window = buildDateWindows("custom", dailyRows, {
    start: "2026-07-01",
    end: "2026-07-02",
  }).current;

  expect(
    filterMetaAdsRows(dailyRows, {
      ...baseFilters,
      campaign: "Campaign B",
      delivery: "ACTIVE",
      resultIndicator: "Leads",
    }, window)
  ).toHaveLength(1);

  expect(
    filterMetaAdsRows(dailyRows, baseFilters, buildDateWindows("custom", dailyRows, {
      start: "2026-08-01",
      end: "2026-08-02",
    }).current)
  ).toHaveLength(0);
});

test("aggregates raw totals before calculating cost per lead and preserves zero values", () => {
  const summary = buildMetaAdsSummary(dailyRows);

  expect(summary.amountSpent).toBe(225);
  expect(summary.results).toBe(10);
  expect(summary.costPerResult).toBe(22.5);
  expect(summary.impressions).toBe(2400);
  expect(summary.reach).toBe(1750);
  expect(summary.reachIsEstimate).toBe(true);
});

test("formats unavailable zero-divisor metrics as an em dash", () => {
  const summary = buildMetaAdsSummary([
    { reportingStarts: "2026-07-01", campaignId: "zero", amountSpent: 50, results: 0, impressions: 0, reach: 0 },
  ]);

  expect(summary.costPerResult).toBeNull();
  expect(formatMetricValue(summary.costPerResult, "currency")).toBe("—");
});

test("dedupes duplicate campaign-date rows and groups by campaign ID", () => {
  const duplicateRows = [
    ...dailyRows,
    { ...dailyRows[0], amountSpent: 999 },
    {
      reportingStarts: "2026-07-01",
      campaignName: "No ID Campaign",
      amountSpent: 20,
      results: 1,
    },
  ];

  expect(dedupeMetaAdsRows(duplicateRows)).toHaveLength(4);

  const campaigns = aggregateByCampaign(duplicateRows);
  const campaignA = campaigns.find((campaign) => campaign.campaignId === "cmp_a");

  expect(campaignA.campaignName).toBe("Campaign A Renamed");
  expect(campaignA.amountSpent).toBe(1049);
  expect(campaignA.campaignDelivery).toBe("PAUSED");
});

test("builds daily, weekly and monthly buckets with null cost per lead for zero leads", () => {
  expect(buildTrendRows(dailyRows, "Daily", "amountSpent")).toHaveLength(2);
  expect(buildTrendRows(dailyRows, "Weekly", "results")).toHaveLength(1);

  const monthlyCplRows = buildTrendRows([
    { reportingStarts: "2025-12-31", campaignId: "x", amountSpent: 10, results: 1 },
    { reportingStarts: "2026-01-01", campaignId: "x", amountSpent: 20, results: 0 },
  ], "Monthly", "costPerResult");

  expect(monthlyCplRows).toHaveLength(2);
  expect(monthlyCplRows[1].value).toBeNull();
});

test("treats lower cost metrics as improved", () => {
  expect(
    getComparisonClass({ key: "costPerResult", lowerIsBetter: true }, -12)
  ).toBe("meta-ads-comparison-positive");
});

test("generates deterministic campaign insights and avoids forced output", () => {
  const campaigns = aggregateByCampaign([
    ...dailyRows,
    { reportingStarts: "2026-07-01", campaignId: "cmp_c", campaignName: "Campaign C", amountSpent: 310, results: 0, campaignDelivery: "ACTIVE" },
  ]);
  const summary = buildMetaAdsSummary(dailyRows);
  const insights = buildInsights({
    campaigns,
    summary,
    previousSummary: { costPerResult: 18 },
  });

  expect(insights.some((insight) => insight.includes("generated the most leads"))).toBe(true);
  expect(insights.some((insight) => insight.includes("without recording a lead"))).toBe(true);
  expect(buildInsights({ campaigns: [], summary: {}, previousSummary: {} })).toEqual([]);
});

test("parses representative Meta Ads sheet rows", () => {
  const parsedRows = parseMetaAdsSheetResults({
    data: [
      [
        " Reporting Starts ",
        "Reporting Ends",
        "Campaign Name",
        "Campaign ID",
        "Campaign Delivery",
        "Results",
        "Result Indicator",
        "Cost Per Results",
        "Amount Spent (AUD)",
        "Impressions",
        "Reach",
        "Frequency",
      ],
      [
        "2026-07-01",
        "2026-07-01",
        "Normal Campaign",
        "cmp_1",
        "Active",
        "1,240",
        "Meta leads",
        "$12.40",
        "$1,240.50",
        "10,000",
        "8,500",
        "1.25",
      ],
      [
        "invalid-date",
        "",
        "Blank Leads",
        "cmp_2",
        "Active",
        "",
        "Lead forms",
        "",
        "$0.00",
        "0",
        "0",
        "",
      ],
      ["", "", "", "", "", "", "", "", "", "", "", ""],
    ],
  });

  expect(parsedRows).toHaveLength(2);
  expect(parsedRows[0]).toMatchObject({
    campaignId: "cmp_1",
    campaignName: "Normal Campaign",
    results: 1240,
    costPerResult: 12.4,
    amountSpent: 1240.5,
    impressions: 10000,
    reach: 8500,
    frequency: 1.25,
  });
  expect(parsedRows[1]).toMatchObject({
    campaignName: "Blank Leads",
    results: null,
    costPerResult: null,
    amountSpent: 0,
    impressions: 0,
    reach: 0,
  });
});

test("still accepts old Results and Cost Per Results headers as fallbacks", () => {
  const parsedRows = parseMetaAdsSheetResults({
    data: [
      ["Campaign Name", "Results", "Result Indicator", "Cost Per Results"],
      ["Legacy Campaign", "8", "Meta leads", "$20.00"],
    ],
  });

  expect(parsedRows[0]).toMatchObject({
    campaignName: "Legacy Campaign",
    results: 8,
    resultIndicator: "Meta leads",
    costPerResult: 20,
  });
});
