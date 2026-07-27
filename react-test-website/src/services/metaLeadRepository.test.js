import {
  buildManualLeadSummary,
  metaLeadRepository,
} from "./metaLeadRepository";

beforeEach(() => {
  window.localStorage.clear();
});

test("persists leads in localStorage and scopes them to the selected campaign", () => {
  const first = metaLeadRepository.createLead({
    campaignId: "campaign-a",
    name: "Lead A",
    status: "New",
  });
  metaLeadRepository.createLead({
    campaignId: "campaign-b",
    name: "Lead B",
    status: "Converted",
  });

  expect(metaLeadRepository.getLeadsByCampaign("campaign-a")).toHaveLength(1);
  expect(metaLeadRepository.getLeadsByCampaign("campaign-a")[0].id).toBe(first.id);
  expect(window.localStorage.getItem(metaLeadRepository.storageKey)).toContain("Lead A");
});

test("updates and deletes manual leads", () => {
  const lead = metaLeadRepository.createLead({
    campaignId: "campaign-a",
    name: "Original",
    status: "New",
  });

  metaLeadRepository.updateLead(lead.id, {
    name: "Updated",
    status: "Contacted",
  });

  expect(metaLeadRepository.getLeadsByCampaign("campaign-a")[0]).toMatchObject({
    name: "Updated",
    status: "Contacted",
  });

  metaLeadRepository.deleteLead(lead.id);

  expect(metaLeadRepository.getLeadsByCampaign("campaign-a")).toEqual([]);
});

test("calculates manual lead summary rates and cost per converted lead", () => {
  const summary = buildManualLeadSummary(
    [
      { status: "New" },
      { status: "Contacted" },
      { status: "Converted" },
      { status: "Failed" },
    ],
    200
  );

  expect(summary.total).toBe(4);
  expect(summary.contactRate).toBe(75);
  expect(summary.conversionRate).toBe(25);
  expect(summary.failedRate).toBe(25);
  expect(summary.requiringAction).toBe(1);
  expect(summary.costPerConvertedLead).toBe(200);
});
