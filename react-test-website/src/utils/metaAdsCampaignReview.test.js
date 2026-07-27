import {
  buildCampaignAssessment,
  buildCampaignComparisonReport,
  buildCampaignFindings,
  buildCampaignFunnel,
  buildCampaignOutcome,
  buildCampaignTrendAnalysis,
  buildCampaignVerdict,
  rankCampaigns,
} from "./metaAdsCampaignReview";
import { parseMetaAdsSheetResults } from "./metaAdsSheetParser";

const rows = [
  {
    reportingStarts: "2026-07-01",
    reportingEnds: "2026-07-01",
    campaignId: "selected",
    campaignName: "Selected Campaign",
    campaignDelivery: "Active",
    campaignObjective: "Leads",
    resultIndicator: "Meta leads",
    amountSpent: 100,
    results: 5,
    impressions: 1000,
    reach: 500,
    linkClicks: 50,
  },
  {
    reportingStarts: "2026-07-02",
    reportingEnds: "2026-07-02",
    campaignId: "selected",
    campaignName: "Selected Campaign",
    campaignDelivery: "Active",
    campaignObjective: "Leads",
    resultIndicator: "Meta leads",
    amountSpent: 100,
    results: 5,
    impressions: 1000,
    reach: 500,
    linkClicks: 50,
  },
  {
    reportingStarts: "2026-06-01",
    reportingEnds: "2026-06-02",
    campaignId: "average",
    campaignName: "Average Campaign",
    campaignDelivery: "Ended",
    campaignObjective: "Leads",
    resultIndicator: "Meta leads",
    amountSpent: 300,
    results: 6,
    impressions: 1200,
    reach: 800,
    linkClicks: 30,
  },
  {
    reportingStarts: "2026-05-01",
    reportingEnds: "2026-05-02",
    campaignId: "best",
    campaignName: "Best Campaign",
    campaignDelivery: "Ended",
    campaignObjective: "Leads",
    resultIndicator: "Meta leads",
    amountSpent: 160,
    results: 8,
    impressions: 1600,
    reach: 900,
    linkClicks: 80,
  },
  {
    reportingStarts: "2026-07-01",
    campaignId: "traffic",
    campaignName: "Traffic Campaign",
    campaignObjective: "Traffic",
    resultIndicator: "Link clicks",
    amountSpent: 100,
    results: 30,
  },
];

const leadsByCampaign = {
  selected: [
    { status: "New" },
    { status: "Contacted" },
    { status: "Converted" },
    { status: "Converted" },
  ],
  average: [{ status: "Converted" }, { status: "Failed" }],
  best: [{ status: "Converted" }, { status: "New" }],
};

test("calculates campaign duration, lead efficiency and aggregate frequency", () => {
  const outcome = buildCampaignOutcome(rows.filter((row) => row.campaignId === "selected"), leadsByCampaign.selected);

  expect(outcome.durationDays).toBe(2);
  expect(outcome.leadsPerDay).toBe(5);
  expect(outcome.leadsPer100).toBe(5);
  expect(outcome.averageDailySpend).toBe(100);
  expect(outcome.frequency).toBe(2);
  expect(outcome.conversionRate).toBe(50);
  expect(outcome.failedRate).toBe(0);
  expect(outcome.costPerConvertedLead).toBe(100);
});

test("builds funnel stages and hides unavailable optional fields", () => {
  const outcome = buildCampaignOutcome(rows.filter((row) => row.campaignId === "selected"), leadsByCampaign.selected);
  const funnel = buildCampaignFunnel(outcome);
  const withoutClicks = buildCampaignFunnel(buildCampaignOutcome([{ campaignId: "x", impressions: 100, reach: 50, results: 2 }]));

  expect(funnel.stages.map((stage) => stage.key)).toEqual([
    "impressions",
    "reach",
    "linkClicks",
    "results",
    "contacted",
    "converted",
  ]);
  expect(withoutClicks.stages.map((stage) => stage.key)).toEqual(["impressions", "reach", "results", "contacted", "converted"]);
});

test("filters comparable campaigns by objective and calculates averages, best campaign and rank direction", () => {
  const comparison = buildCampaignComparisonReport({
    selectedCampaign: { campaignId: "selected", campaignObjective: "Leads", resultIndicator: "Meta leads" },
    allRows: rows,
    getLeadsByCampaign: (campaignId) => leadsByCampaign[campaignId] || [],
  });

  const cpl = comparison.rows.find((row) => row.key === "costPerResult");
  const leads = comparison.rows.find((row) => row.key === "results");

  expect(comparison.comparableRows.map((campaign) => campaign.campaignId)).toEqual(["average", "best"]);
  expect(cpl.averageValue).toBe(35);
  expect(cpl.bestCampaign.campaignId).toBe("best");
  expect(cpl.selectedRank).toBe(1);
  expect(leads.bestCampaign.campaignId).toBe("best");
});

test("falls back to result indicator comparison when objective is unavailable", () => {
  const comparison = buildCampaignComparisonReport({
    selectedCampaign: { campaignId: "selected", resultIndicator: "Meta leads" },
    allRows: rows.map(({ campaignObjective, ...row }) => row),
  });

  expect(comparison.limited).toBe(true);
  expect(comparison.reason).toMatch(/objective is unavailable/i);
});

test("ranks lower-is-better and higher-is-better metrics correctly", () => {
  expect(rankCampaigns([{ id: "a", cost: 3 }, { id: "b", cost: 1 }], "cost", true)[0].campaign.id).toBe("b");
  expect(rankCampaigns([{ id: "a", leads: 3 }, { id: "b", leads: 1 }], "leads", false)[0].campaign.id).toBe("a");
});

test("creates transparent verdicts, supported findings and final assessment", () => {
  const selectedRows = rows.filter((row) => row.campaignId === "selected");
  const outcome = buildCampaignOutcome(selectedRows, leadsByCampaign.selected);
  const comparison = buildCampaignComparisonReport({
    selectedCampaign: { campaignId: "selected", campaignObjective: "Leads", resultIndicator: "Meta leads" },
    allRows: rows,
    getLeadsByCampaign: (campaignId) => leadsByCampaign[campaignId] || [],
  });
  const trendAnalysis = buildCampaignTrendAnalysis(selectedRows);
  const verdict = buildCampaignVerdict(outcome, comparison);
  const findings = buildCampaignFindings({ outcome, comparisonReport: comparison, trendAnalysis });
  const assessment = buildCampaignAssessment({ verdict, outcome, findings });

  expect(verdict.label).toBe("Excellent");
  expect(findings.worked.some((finding) => finding.includes("Cost per lead"))).toBe(true);
  expect(findings.attention.some((finding) => finding.includes("require contact"))).toBe(true);
  expect(assessment.recommendedNextAction).toMatch(/outstanding leads/i);
});

test("does not create unsupported trend claims with too few daily points", () => {
  const analysis = buildCampaignTrendAnalysis(rows.filter((row) => row.campaignId === "selected"));

  expect(analysis.enoughData).toBe(false);
  expect(analysis.leadDirection).toBeNull();
});

test("parses optional future Meta fields without requiring them", () => {
  const parsedRows = parseMetaAdsSheetResults({
    data: [
      [
        "Reporting Starts",
        "Campaign Name",
        "Campaign Objective",
        "Clicks",
        "Link Clicks",
        "CTR",
        "CPC",
        "CPM",
        "Ad Set ID",
        "Ad Set Name",
      ],
      ["2026-07-01", "Optional Fields", "Leads", "1,200", "300", "4.5%", "$1.20", "$12.30", "adset_1", "Prospecting"],
      ["2026-07-02", "Missing Fields", "", "", "", "", "", "", "", ""],
    ],
  });

  expect(parsedRows[0]).toMatchObject({
    campaignObjective: "Leads",
    clicks: 1200,
    linkClicks: 300,
    ctr: 4.5,
    cpc: 1.2,
    cpm: 12.3,
    adSetId: "adset_1",
    adSetName: "Prospecting",
  });
  expect(parsedRows[1]).toMatchObject({
    clicks: null,
    linkClicks: null,
    campaignObjective: "",
  });
});
