import {
  buildCampaignComparisonRows,
  buildCampaignOptions,
  buildCampaignReviewMetrics,
  buildCampaignTrendSummary,
  buildKeyTakeaways,
  buildManualLeadSummary,
  calculateCampaignScore,
  filterRowsByCampaignId,
  getDefaultCampaignId,
  sortCampaignComparisonRows,
} from "./metaAdsCampaignReview";
import { metaAdsLeadsRepository, META_ADS_LEADS_STORAGE_KEY } from "./metaAdsLeadsRepository";

const rows = [
  {
    reportingStarts: "2026-07-01",
    reportingEnds: "2026-07-01",
    campaignId: "active-old",
    campaignName: "Active Old",
    campaignDelivery: "Active",
    resultIndicator: "Meta leads",
    amountSpent: 100,
    results: 10,
    impressions: 1000,
    reach: 500,
  },
  {
    reportingStarts: "2026-07-02",
    reportingEnds: "2026-07-02",
    campaignId: "active-old",
    campaignName: "Active Old",
    campaignDelivery: "Active",
    resultIndicator: "Meta leads",
    amountSpent: 80,
    results: 8,
    impressions: 800,
    reach: 400,
  },
  {
    reportingStarts: "2026-07-03",
    reportingEnds: "2026-07-03",
    campaignId: "ended-new",
    campaignName: "Ended New",
    campaignDelivery: "Ended",
    resultIndicator: "Meta leads",
    amountSpent: 220,
    results: 5,
    impressions: 900,
    reach: 450,
  },
  {
    reportingStarts: "2026-06-25",
    reportingEnds: "2026-06-25",
    campaignId: "other-objective",
    campaignName: "Other Objective",
    campaignDelivery: "Ended",
    resultIndicator: "Traffic",
    amountSpent: 50,
    results: 9,
    impressions: 700,
    reach: 350,
  },
];

beforeEach(() => {
  window.localStorage.clear();
});

test("orders campaigns newest to oldest, dedupes by campaign ID, and defaults to most recent active", () => {
  const options = buildCampaignOptions(rows);
  expect(options.map((campaign) => campaign.id)).toEqual([
    "ended-new",
    "active-old",
    "other-objective",
  ]);
  expect(getDefaultCampaignId(rows)).toBe("active-old");
});

test("falls back to the most recent campaign when no campaign is active", () => {
  expect(
    getDefaultCampaignId(rows.map((row) => ({ ...row, campaignDelivery: "Ended" })))
  ).toBe("ended-new");
});

test("filters rows by campaign ID and calculates five KPI values", () => {
  const campaignRows = filterRowsByCampaignId(rows, "active-old");
  const campaign = buildCampaignReviewMetrics(
    { campaignId: "active-old", campaignName: "Active Old", rows: campaignRows },
    [
      { status: "Converted" },
      { status: "Contacted" },
      { status: "Failed" },
    ]
  );

  expect(campaignRows).toHaveLength(2);
  expect(campaign.amountSpent).toBe(180);
  expect(campaign.results).toBe(18);
  expect(campaign.costPerResult).toBe(10);
  expect(campaign.conversionRate).toBeCloseTo(33.333);
  expect(campaign.costPerConvertedCustomer).toBe(180);
  expect(campaign.leadsPer100).toBe(10);
});

test("calculates campaign score from comparable campaign averages and marks limited data", () => {
  const selected = { amountSpent: 180, results: 18, costPerResult: 10, leadsPer100: 10 };
  const comparable = [{ results: 5, costPerResult: 44, leadsPer100: 2.27 }];
  const score = calculateCampaignScore(selected, comparable);

  expect(score.label).toBe("Excellent");
  expect(score.limited).toBe(true);
  expect(score.explanation).toMatch(/Cost per lead was below/i);
});

test("returns insufficient campaign score when data is not scoreable", () => {
  expect(calculateCampaignScore({ amountSpent: 20, results: 0 }, [])).toMatchObject({
    label: "Insufficient data",
  });
});

test("builds trend summary with best lead day, average leads per day and split CPL", () => {
  const trend = buildCampaignTrendSummary([
    { campaignId: "x", reportingStarts: "2026-07-01", amountSpent: 100, results: 10 },
    { campaignId: "x", reportingStarts: "2026-07-02", amountSpent: 100, results: 5 },
    { campaignId: "x", reportingStarts: "2026-07-03", amountSpent: 100, results: 4 },
    { campaignId: "x", reportingStarts: "2026-07-04", amountSpent: 100, results: 2 },
  ]);

  expect(trend.bestLeadDay).toBe("10 on 01 July 2026");
  expect(trend.averageLeadsPerDay).toBe(5.25);
  expect(trend.firstHalfVsSecondHalfCpl).toBe("$13.33 vs $33.33");
});

test("sorts comparison rows for higher and lower is better metrics", () => {
  const comparison = buildCampaignComparisonRows(rows, "active-old", {});

  expect(sortCampaignComparisonRows(comparison.rows, "results", "desc")[0].campaignName).toBe("Active Old");
  expect(sortCampaignComparisonRows(comparison.rows, "costPerResult", "desc")[0].campaignName).toBe("Other Objective");
});

test("builds manual lead status counts and rates", () => {
  const summary = buildManualLeadSummary([
    { status: "New" },
    { status: "Contacted" },
    { status: "Converted" },
    { status: "Failed" },
  ]);

  expect(summary.counts).toMatchObject({ New: 1, Contacted: 1, Converted: 1, Failed: 1 });
  expect(summary.contactRate).toBe(75);
  expect(summary.conversionRate).toBe(25);
});

test("persists local manual leads and keeps campaigns separated", () => {
  const first = metaAdsLeadsRepository.createLead({
    campaignId: "active-old",
    name: "Alex",
    status: "New",
  });
  metaAdsLeadsRepository.createLead({
    campaignId: "ended-new",
    name: "Jordan",
    status: "Converted",
  });
  metaAdsLeadsRepository.updateLead(first.id, { status: "Contacted", notes: "Called" });

  expect(JSON.parse(window.localStorage.getItem(META_ADS_LEADS_STORAGE_KEY))).toHaveLength(2);
  expect(metaAdsLeadsRepository.getLeadsByCampaign("active-old")[0]).toMatchObject({
    name: "Alex",
    status: "Contacted",
    notes: "Called",
  });

  metaAdsLeadsRepository.deleteLead(first.id);
  expect(metaAdsLeadsRepository.getLeadsByCampaign("active-old")).toHaveLength(0);
  expect(metaAdsLeadsRepository.getLeadsByCampaign("ended-new")).toHaveLength(1);
});

test("generates supported takeaways without unsupported causal claims", () => {
  const campaign = {
    costPerResult: 10,
    results: 18,
    leadsPer100: 10,
    conversionRate: 20,
    costPerConvertedCustomer: 100,
    leadSummary: { counts: { New: 1 } },
  };
  const takeaways = buildKeyTakeaways({
    campaign,
    comparableCampaigns: [
      {
        costPerResult: 44,
        results: 5,
        leadsPer100: 2,
        conversionRate: 10,
        costPerConvertedCustomer: 180,
      },
    ],
    trendSummary: { firstHalfCpl: 20, secondHalfCpl: 10 },
  });
  const text = [...takeaways.worked, ...takeaways.attention].join(" ");

  expect(takeaways.worked).toContain("Cost per lead was below the comparable campaign average.");
  expect(takeaways.attention).toContain("Some manual leads are still marked as New.");
  expect(text).not.toMatch(/creative|audience targeting|offer quality/i);
});
