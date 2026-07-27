export const META_ADS_ANCHOR_DATE = "2026-07-27";

const creative = (label, background, accent) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
      <rect width="320" height="180" rx="18" fill="${background}"/>
      <path d="M0 132 C80 92 142 164 320 92 L320 180 L0 180 Z" fill="${accent}" opacity=".86"/>
      <circle cx="264" cy="44" r="34" fill="#ffffff" opacity=".18"/>
      <text x="26" y="80" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="900">${label}</text>
      <text x="28" y="112" fill="#ffffff" font-family="Arial, sans-serif" font-size="13" font-weight="800" opacity=".82">META ADS CREATIVE</text>
    </svg>
  `)}`;

const campaigns = [
  {
    campaignName: "Cench Lead Engine",
    campaignId: "cmp-cench-leads",
    campaignStatus: "Active",
    campaignObjective: "Lead Generation",
    adSetName: "Metro AFL Audiences",
    adSetId: "set-cench-metro",
    creatives: [
      { adName: "Cench Training Hook", adId: "ad-cench-hook", creativeUrl: creative("Cench", "#e20f25", "#611018") },
      { adName: "Cench Ex-AFL Proof", adId: "ad-cench-proof", creativeUrl: creative("Ex-AFL", "#111827", "#e20f25") },
    ],
    daily: { spend: 132, impressions: 11500, reach: 8200, clicks: 315, lpv: 206, leads: 15, purchases: 1, value: 320 },
  },
  {
    campaignName: "Premier Data Awareness",
    campaignId: "cmp-pd-awareness",
    campaignStatus: "Active",
    campaignObjective: "Awareness",
    adSetName: "Broad Sport Reach",
    adSetId: "set-pd-broad",
    creatives: [
      { adName: "Analytics Snapshot", adId: "ad-pd-snapshot", creativeUrl: creative("Premier Data", "#0d2547", "#ff173a") },
      { adName: "Season Momentum", adId: "ad-pd-season", creativeUrl: creative("Season", "#061424", "#295bb8") },
    ],
    daily: { spend: 88, impressions: 23800, reach: 17800, clicks: 185, lpv: 96, leads: 3, purchases: 0, value: 0 },
  },
  {
    campaignName: "Baseline Trial Signups",
    campaignId: "cmp-baseline-trial",
    campaignStatus: "Paused",
    campaignObjective: "Lead Generation",
    adSetName: "Baseline Retargeting",
    adSetId: "set-baseline-retarget",
    creatives: [
      { adName: "Baseline Sprint Offer", adId: "ad-baseline-sprint", creativeUrl: creative("Baseline", "#20242b", "#d5252e") },
      { adName: "Baseline Review CTA", adId: "ad-baseline-review", creativeUrl: creative("Review", "#060709", "#9ca3af") },
    ],
    daily: { spend: 64, impressions: 7200, reach: 5400, clicks: 168, lpv: 118, leads: 8, purchases: 1, value: 220 },
  },
  {
    campaignName: "Metricon Traffic Push",
    campaignId: "cmp-metricon-traffic",
    campaignStatus: "Learning",
    campaignObjective: "Traffic",
    adSetName: "Sponsor Interest",
    adSetId: "set-metricon-interest",
    creatives: [
      { adName: "Metricon Game Day", adId: "ad-metricon-game", creativeUrl: creative("Metricon", "#1180bf", "#06172a") },
      { adName: "Metricon Offer Click", adId: "ad-metricon-offer", creativeUrl: creative("Offer", "#0c3f77", "#ffffff") },
    ],
    daily: { spend: 44, impressions: 6800, reach: 5200, clicks: 94, lpv: 47, leads: 0, purchases: 0, value: 0 },
  },
];

const dateKeys = [
  "2025-05-01", "2025-05-08", "2025-05-15", "2025-05-22",
  "2026-04-29", "2026-05-06", "2026-05-13", "2026-05-20", "2026-05-27",
  "2026-06-03", "2026-06-10", "2026-06-17", "2026-06-24",
  "2026-07-01", "2026-07-08", "2026-07-15", "2026-07-22", "2026-07-27",
];

export const metaAdsFixtures = dateKeys.flatMap((date, dateIndex) =>
  campaigns.flatMap((campaign, campaignIndex) =>
    ["Instagram", "Facebook"].flatMap((platform, platformIndex) => {
      const creativeItem = campaign.creatives[(dateIndex + platformIndex) % campaign.creatives.length];
      const monthBoost = date.startsWith("2026-07") ? 1.18 : date.startsWith("2026-05") ? 1.08 : 1;
      const legacyFactor = date.startsWith("2025") ? 0.72 : 1;
      const platformFactor = platform === "Instagram" ? 1.12 : 0.88;
      const variation = 0.84 + ((dateIndex + campaignIndex + platformIndex) % 5) * 0.08;
      const factor = monthBoost * legacyFactor * platformFactor * variation;
      const base = campaign.daily;
      const leads = Math.round(base.leads * factor);
      const amountSpent = Number((base.spend * factor).toFixed(2));
      const linkClicks = Math.round(base.clicks * factor);
      const landingPageViews = Math.min(linkClicks, Math.round(base.lpv * factor));
      const impressions = Math.round(base.impressions * factor);
      const reach = Math.min(impressions, Math.round(base.reach * factor));

      return {
        date,
        campaignName: campaign.campaignName,
        campaignId: campaign.campaignId,
        campaignStatus: campaign.campaignStatus,
        campaignObjective: campaign.campaignObjective,
        adSetName: campaign.adSetName,
        adSetId: campaign.adSetId,
        adName: creativeItem.adName,
        adId: creativeItem.adId,
        platform,
        amountSpent,
        impressions,
        reach,
        frequency: reach ? Number((impressions / reach).toFixed(2)) : 0,
        linkClicks,
        landingPageViews,
        leads,
        purchases: Math.round(base.purchases * factor),
        purchaseValue: Number((base.value * factor).toFixed(2)),
        creativeUrl: creativeItem.creativeUrl,
        destinationUrl: `https://premierdata.com.au/${campaign.campaignId}`,
      };
    })
  )
);
