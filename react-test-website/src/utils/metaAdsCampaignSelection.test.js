import {
  buildCampaignSelectionOptions,
  getValidCampaignSelection,
  selectDefaultMetaCampaignId,
} from "./metaAdsCampaignSelection";

const rows = [
  {
    campaignId: "old-active",
    campaignName: "Old Active",
    campaignDelivery: "Active",
    reportingStarts: "2026-07-01",
    reportingEnds: "2026-07-01",
  },
  {
    campaignId: "new-live",
    campaignName: "New Live",
    campaignDelivery: "Delivering",
    reportingStarts: "2026-07-03",
    reportingEnds: "2026-07-03",
  },
  {
    campaignId: "new-ended",
    campaignName: "New Ended",
    campaignDelivery: "Ended",
    reportingStarts: "2026-07-04",
    reportingEnds: "2026-07-04",
    ends: "2026-07-04",
  },
  {
    campaignId: "new-live",
    campaignName: "New Live",
    campaignDelivery: "Delivering",
    reportingStarts: "2026-07-02",
    reportingEnds: "2026-07-02",
  },
];

test("defaults to the most recent active campaign", () => {
  expect(selectDefaultMetaCampaignId(rows)).toBe("new-live");
});

test("defaults to the most recent campaign when none are active", () => {
  const inactiveRows = rows.map((row) => ({
    ...row,
    campaignDelivery: "Ended",
  }));

  expect(selectDefaultMetaCampaignId(inactiveRows)).toBe("new-ended");
});

test("orders campaigns from newest to oldest and dedupes by Campaign ID", () => {
  const options = buildCampaignSelectionOptions(rows);

  expect(options.map((option) => option.campaignId)).toEqual([
    "new-ended",
    "new-live",
    "old-active",
  ]);
});

test("uses deterministic fallback when dates are equal", () => {
  const options = buildCampaignSelectionOptions([
    { campaignId: "b", campaignName: "Beta", reportingEnds: "2026-07-01" },
    { campaignId: "a", campaignName: "Alpha", reportingEnds: "2026-07-01" },
  ]);

  expect(options.map((option) => option.campaignId)).toEqual(["a", "b"]);
});

test("accepts valid campaign query selection and falls back from invalid selection", () => {
  expect(getValidCampaignSelection(rows, "old-active")).toBe("old-active");
  expect(getValidCampaignSelection(rows, "missing")).toBe("new-live");
});
