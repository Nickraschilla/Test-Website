import {
  buildMetaAdsSummary,
  filterMetaAdsRows,
  formatMetricValue,
  getComparisonClass,
} from "./metaAdsAnalytics";
import { parseMetaAdsSheetResults } from "./metaAdsSheetParser";

test("aggregates raw totals before calculating cost per lead", () => {
  const summary = buildMetaAdsSummary([
    { amountSpent: 100, results: 4, impressions: 1000, reach: 800 },
    { amountSpent: 50, results: 6, impressions: 500, reach: 350 },
  ]);

  expect(summary.amountSpent).toBe(150);
  expect(summary.results).toBe(10);
  expect(summary.costPerResult).toBe(15);
});

test("formats unavailable zero-divisor metrics as an em dash", () => {
  const summary = buildMetaAdsSummary([
    { amountSpent: 50, results: 0, impressions: 0, reach: 0 },
  ]);

  expect(summary.costPerResult).toBeNull();
  expect(formatMetricValue(summary.costPerResult, "currency")).toBe("—");
});

test("filters by campaign, delivery and result indicator", () => {
  const rows = [
    {
      reportingStarts: "2026-07-01",
      campaignName: "A",
      campaignDelivery: "Active",
      resultIndicator: "Meta leads",
    },
    {
      reportingStarts: "2026-07-01",
      campaignName: "A",
      campaignDelivery: "Paused",
      resultIndicator: "Landing page views",
    },
    {
      reportingStarts: "2026-07-01",
      campaignName: "B",
      campaignDelivery: "Active",
      resultIndicator: "Meta leads",
    },
  ];

  expect(
    filterMetaAdsRows(rows, {
      dateRange: "all",
      campaign: "A",
      delivery: "Active",
      resultIndicator: "Meta leads",
    })
  ).toHaveLength(1);
});

test("treats lower cost metrics as improved", () => {
  expect(
    getComparisonClass({ key: "costPerResult", lowerIsBetter: true }, -12)
  ).toBe("meta-ads-comparison-positive");
});

test("parses representative Meta Ads sheet rows", () => {
  const parsedRows = parseMetaAdsSheetResults({
    data: [
      [
        " Reporting Starts ",
        "Reporting Ends",
        "Campaign Name",
        "Campaign Delivery",
        "Leads",
        "Result Type",
        "Cost Per Lead",
        "Amount Spent (AUD)",
        "Impressions",
        "Reach",
      ],
      [
        "2026-07-01",
        "2026-07-07",
        "Normal Campaign",
        "Active",
        "1,240",
        "Meta leads",
        "$12.40",
        "$1,240.50",
        "10,000",
        "8,500",
      ],
      [
        "2026-07-08",
        "2026-07-14",
        "Blank Leads",
        "Active",
        "",
        "Lead forms",
        "",
        "$0.00",
        "0",
        "0",
      ],
      [
        "2026-07-15",
        "2026-07-21",
        "No Delivery",
        "",
        "0",
        "Meta leads",
        "",
        "$25.00",
        "1,000",
        "900",
      ],
      ["", "", "", "", "", "", "", "", "", ""],
    ],
  });

  expect(parsedRows).toHaveLength(3);
  expect(parsedRows[0]).toMatchObject({
    campaignName: "Normal Campaign",
    campaignDelivery: "Active",
    results: 1240,
    resultIndicator: "Meta leads",
    costPerResult: 12.4,
    amountSpent: 1240.5,
    impressions: 10000,
    reach: 8500,
  });
  expect(parsedRows[1]).toMatchObject({
    campaignName: "Blank Leads",
    results: null,
    costPerResult: null,
    amountSpent: 0,
    impressions: 0,
    reach: 0,
  });
  expect(parsedRows[2]).toMatchObject({
    campaignName: "No Delivery",
    campaignDelivery: "",
    results: 0,
    costPerResult: null,
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
