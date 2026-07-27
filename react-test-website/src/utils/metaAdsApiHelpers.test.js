import {
  calculateCostPerLead,
  extractAcceptedLeadActions,
  getLeadActionResult,
  isAcceptedLeadActionType,
  mapMetaCampaignRecordToSheetRow,
  normaliseMetaAdAccountId,
  parseMetaApiNumber,
} from "./metaAdsApiHelpers";

test("normalises Meta ad account IDs with or without act prefix", () => {
  expect(normaliseMetaAdAccountId("123456789")).toBe("act_123456789");
  expect(normaliseMetaAdAccountId("act_123456789")).toBe("act_123456789");
  expect(normaliseMetaAdAccountId("")).toBe("");
});

test("parses numbers, blanks, zeroes and malformed values safely", () => {
  expect(parseMetaApiNumber("$1,240.50")).toBe(1240.5);
  expect(parseMetaApiNumber("0")).toBe(0);
  expect(parseMetaApiNumber("")).toBeNull();
  expect(parseMetaApiNumber("not a number")).toBeNull();
});

test("accepts valid Instant Form and website lead actions", () => {
  expect(isAcceptedLeadActionType("lead")).toBe(true);
  expect(isAcceptedLeadActionType("offsite_conversion.fb_pixel_lead")).toBe(true);
  expect(
    getLeadActionResult([{ action_type: "offsite_conversion.fb_pixel_lead", value: "3" }])
  ).toEqual({ value: 3, actionType: "offsite_conversion.fb_pixel_lead" });
});

test("uses one lead source by priority to avoid double counting Meta action rows", () => {
  const actions = [
    { action_type: "lead", value: "2" },
    { action_type: "leadgen.other", value: "5" },
    { action_type: "link_click", value: "999" },
    { action_type: "landing_page_view", value: "400" },
    { action_type: "post_engagement", value: "200" },
    { action_type: "unknown_custom_action", value: "100" },
  ];

  expect(extractAcceptedLeadActions(actions)).toBe(5);
  expect(getLeadActionResult(actions)).toEqual({
    value: 5,
    actionType: "leadgen.other",
  });
});

test("does not count messaging conversations as leads by default", () => {
  expect(isAcceptedLeadActionType("onsite_conversion.messaging_conversation_started_7d")).toBe(
    false
  );
  expect(
    extractAcceptedLeadActions([
      {
        action_type: "onsite_conversion.messaging_conversation_started_7d",
        value: "49",
      },
    ])
  ).toBe(0);
});

test("handles zero leads, missing actions and zero spend", () => {
  expect(extractAcceptedLeadActions()).toBe(0);
  expect(calculateCostPerLead(100, 0)).toBeNull();
  expect(calculateCostPerLead(0, 5)).toBe(0);
});

test("handles missing spend, malformed values and blank campaign status", () => {
  const row = mapMetaCampaignRecordToSheetRow({
    insight: {
      date_start: "2026-07-01",
      date_stop: "2026-07-27",
      campaign_id: "cmp_1",
      campaign_name: "Malformed Spend",
      spend: "not available",
      impressions: "1,000",
      reach: "900",
      frequency: "1.11",
      actions: [{ action_type: "lead", value: "3" }],
    },
    campaign: { status: "" },
    lastSynced: "2026-07-27T01:00:00Z",
  });

  expect(row[3]).toBe("");
  expect(row[6]).toBe("");
  expect(row[9]).toBe("");
  expect(row[10]).toBe(1000);
  expect(row[11]).toBe(900);
});

test("maps an API campaign record into the existing Meta Ads sheet column order", () => {
  const row = mapMetaCampaignRecordToSheetRow({
    insight: {
      date_start: "2026-07-01",
      date_stop: "2026-07-27",
      campaign_id: "cmp_123",
      campaign_name: "Lead Campaign",
      spend: "200",
      impressions: "10,000",
      reach: "8,000",
      frequency: "1.25",
      attribution_setting: "7-day click",
      actions: [
        { action_type: "lead", value: "4" },
        { action_type: "link_click", value: "80" },
      ],
    },
    campaign: {
      id: "cmp_123",
      effective_status: "ACTIVE",
      stop_time: "2026-08-01",
    },
    lastSynced: "2026-07-27T01:00:00Z",
  });

  expect(row).toEqual([
    "2026-07-01",
    "2026-07-27",
    "Lead Campaign",
    "ACTIVE",
    4,
    "Leads",
    50,
    "",
    "",
    200,
    10000,
    8000,
    "2026-08-01",
    "7-day click",
    "",
    "",
    "cmp_123",
    1.25,
    "2026-07-27T01:00:00Z",
  ]);
});
