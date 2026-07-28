import {
  buildAttentionItems,
  buildInstagramSummary,
  buildLeadPipelineSummary,
  buildMetaSummary,
  buildRecentActivity,
  buildSocialsSummary,
  buildTrendInsights,
  formatPercentageChange,
  getBestMetaCampaign,
  getPercentageChange,
  getTopInstagramContent,
  getTopSocialContent,
} from "./dashboardOverview";

const instagramRows = [
  {
    contentTitle: "Newest Post",
    publishedAt: "2026-07-10",
    igViews: 1000,
    igReach: 700,
    igLikes: 100,
    igComments: 10,
    igShares: 5,
    igSaves: 20,
    igFollowers: 40852,
  },
  {
    contentTitle: "Best Post",
    publishedAt: "2026-07-11",
    igViews: 2400,
    igReach: 1800,
    igLikes: 200,
    igComments: 20,
    igShares: 15,
    igSaves: 30,
  },
  {
    contentTitle: "Previous Year Post",
    publishedAt: "2025-07-11",
    igViews: 1700,
    igReach: 1300,
  },
];

const socialRows = [
  {
    reelName: "Best Reel",
    clipUrl: "https://instagram.com/reel/best",
    publishedAt: "2026-07-09",
    views: 5000,
    reshares: 120,
    likes: 400,
    comments: 30,
    saves: 20,
    igViews: 3000,
    fbViews: 2000,
    ttViews: 0,
  },
  {
    reelName: "Other Reel",
    clipUrl: "https://instagram.com/reel/other",
    publishedAt: "2026-07-08",
    views: 1200,
    reshares: 30,
    likes: 110,
    comments: 10,
    saves: 4,
    igViews: 100,
    fbViews: 200,
    ttViews: 900,
  },
  {
    reelName: "Previous Year Reel",
    clipUrl: "https://instagram.com/reel/previous",
    publishedAt: "2025-07-08",
    views: 3100,
    reshares: 10,
  },
];

const metaRows = [
  {
    reportingStarts: "2026-07-01",
    reportingEnds: "2026-07-01",
    campaignId: "good",
    campaignName: "Good Campaign",
    campaignDelivery: "Active",
    amountSpent: 100,
    results: 10,
    impressions: 1000,
    reach: 700,
  },
  {
    reportingStarts: "2026-07-02",
    reportingEnds: "2026-07-02",
    campaignId: "good",
    campaignName: "Good Campaign",
    campaignDelivery: "Active",
    amountSpent: 50,
    results: 5,
    impressions: 800,
    reach: 500,
  },
  {
    reportingStarts: "2026-07-01",
    reportingEnds: "2026-07-01",
    campaignId: "zero",
    campaignName: "Zero Campaign",
    campaignDelivery: "Active",
    amountSpent: 500,
    results: 0,
  },
  {
    reportingStarts: "2026-07-01",
    reportingEnds: "2026-07-01",
    campaignId: "tie",
    campaignName: "Tie Campaign",
    campaignDelivery: "Ended",
    amountSpent: 60,
    results: 6,
  },
];

test("builds executive summaries without combining Instagram and Socials values", () => {
  expect(buildInstagramSummary(instagramRows, 2026)).toMatchObject({
    views: 3400,
    reach: 2500,
    posts: 2,
    followers: 40852,
    currentMonth: {
      views: 3400,
      reach: 2500,
      posts: 2,
      previousViews: 1700,
      change: 100,
    },
  });
  expect(buildSocialsSummary(socialRows, 2026)).toMatchObject({
    views: 6200,
    shares: 150,
    reels: 2,
  });
  expect(buildMetaSummary(metaRows)).toMatchObject({
    leads: 21,
    spend: 710,
    costPerLead: expect.any(Number),
  });
  expect(buildLeadPipelineSummary([
    { status: "Converted" },
    { status: "New" },
    { status: "Contacted" },
  ])).toMatchObject({
    total: 3,
    converted: 1,
    requiringAction: 1,
    conversionRate: 33.33333333333333,
  });
});

test("does not show percentage comparison when previous value is zero", () => {
  expect(getPercentageChange(100, 0)).toBeNull();
  expect(formatPercentageChange(null)).toBe("—");
  expect(formatPercentageChange(getPercentageChange(120, 100))).toBe("+20.0%");
});

test("selects top Instagram and Social content", () => {
  expect(getTopInstagramContent(instagramRows, 2026)).toMatchObject({
    title: "Best Post",
    views: 2400,
    secondary: 1800,
  });
  expect(getTopSocialContent(socialRows, 2026)).toMatchObject({
    title: "Best Reel",
    views: 5000,
    shares: 120,
    platform: "Instagram",
  });
});

test("selects best campaign by lowest CPL, excludes zero leads, and tie-breaks by leads", () => {
  const best = getBestMetaCampaign(metaRows);
  expect(best.campaignName).toBe("Good Campaign");
  expect(best.results).toBe(15);

  const tieBest = getBestMetaCampaign([
    { campaignId: "a", campaignName: "Few Leads", amountSpent: 30, results: 3 },
    { campaignId: "b", campaignName: "More Leads", amountSpent: 60, results: 6 },
    { campaignId: "c", campaignName: "Zero Leads", amountSpent: 0, results: 0 },
  ]);
  expect(tieBest.campaignName).toBe("More Leads");
});

test("builds trend insights and preserves unsupported previous comparisons", () => {
  expect(buildTrendInsights([
    { label: "Jun", value: 20 },
    { label: "Jul", value: 40 },
  ], 0)).toMatchObject({
    total: 60,
    change: null,
    best: { label: "Jul", value: 40 },
  });
});

test("orders recent activity without fabricating events", () => {
  const activity = buildRecentActivity({
    instagramRows,
    socialsRows: socialRows,
    metaRows,
    manualLeads: [{ status: "New" }],
  });

  expect(activity).toHaveLength(5);
  expect(activity[0].date >= activity[1].date).toBe(true);
  expect(activity.some((item) => item.title === "Manual lead recorded")).toBe(false);
});

test("builds transparent attention items", () => {
  const attention = buildAttentionItems({
    instagramRows,
    socialsRows: socialRows,
    metaRows: [
      { campaignId: "quiet", campaignName: "Quiet Active", campaignDelivery: "Active", reportingStarts: "2026-07-03", results: 0, amountSpent: 20 },
      { campaignId: "quiet", campaignName: "Quiet Active", campaignDelivery: "Active", reportingStarts: "2026-07-02", results: 0, amountSpent: 20 },
      { campaignId: "quiet", campaignName: "Quiet Active", campaignDelivery: "Active", reportingStarts: "2026-07-01", results: 0, amountSpent: 20 },
      { campaignId: "average", campaignName: "Average", campaignDelivery: "Ended", reportingStarts: "2026-07-01", results: 10, amountSpent: 100 },
    ],
    manualLeads: [{ status: "New" }],
    latestSyncTime: new Date("2026-07-20"),
    now: new Date("2026-07-28"),
  });

  expect(attention.map((item) => item.title)).toEqual(
    expect.arrayContaining([
      "Leads awaiting contact",
      "Active campaign has no recent leads",
      "Data may be stale",
    ])
  );
});
