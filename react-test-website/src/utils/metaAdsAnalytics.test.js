import {
  buildMetaAdsSummary,
  filterMetaAdsRows,
  formatMetricValue,
  getComparisonClass,
} from "./metaAdsAnalytics";

test("aggregates raw totals before calculating rates", () => {
  const summary = buildMetaAdsSummary([
    {
      amountSpent: 100,
      impressions: 100,
      reach: 80,
      linkClicks: 10,
      landingPageViews: 5,
      leads: 1,
      purchases: 0,
      purchaseValue: 0,
    },
    {
      amountSpent: 100,
      impressions: 900,
      reach: 600,
      linkClicks: 90,
      landingPageViews: 45,
      leads: 9,
      purchases: 0,
      purchaseValue: 0,
    },
  ]);

  expect(summary.clickThroughRate).toBe(10);
  expect(summary.costPerLead).toBe(20);
  expect(summary.costPerClick).toBe(2);
});

test("formats zero-divisor metrics as an em dash", () => {
  const summary = buildMetaAdsSummary([
    {
      amountSpent: 50,
      impressions: 0,
      reach: 0,
      linkClicks: 0,
      landingPageViews: 0,
      leads: 0,
      purchases: 0,
      purchaseValue: 0,
    },
  ]);

  expect(summary.clickThroughRate).toBeNull();
  expect(summary.costPerLead).toBeNull();
  expect(formatMetricValue(summary.costPerLead, "currency")).toBe("—");
});

test("filters by campaign and platform", () => {
  const rows = [
    { date: "2026-07-01", campaignName: "A", campaignObjective: "Lead", campaignStatus: "Active", platform: "Instagram" },
    { date: "2026-07-01", campaignName: "A", campaignObjective: "Lead", campaignStatus: "Active", platform: "Facebook" },
    { date: "2026-07-01", campaignName: "B", campaignObjective: "Traffic", campaignStatus: "Paused", platform: "Instagram" },
  ];

  expect(
    filterMetaAdsRows(
      rows,
      {
        campaign: "A",
        objective: "all",
        status: "all",
        platform: "Instagram",
      }
    )
  ).toHaveLength(1);
});

test("treats lower cost metrics as improved", () => {
  expect(
    getComparisonClass({ key: "costPerLead", lowerIsBetter: true }, -12)
  ).toBe("meta-ads-comparison-positive");
});
