import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { ClipModal } from "./components/ClipModal";
import { ContributorSummary } from "./components/ContributorSummary";
import { DashboardHero } from "./components/DashboardHero";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { MetaAdsReportingPage } from "./pages/MetaAdsReportingPage";
import {
  BASE_INSTAGRAM_ANALYSIS_TABS,
  getContentTypeAvatar,
  getContentTypeDisplayLabel,
  getContentTypeThemeClass,
  normalizeContentTypeLabel,
  shouldShowContentTotalLabel,
} from "./config/instagramContent";
import { useMetaAdsData } from "./hooks/useMetaAdsData";
import { useMetaAdsManualLeads } from "./hooks/useMetaAdsManualLeads";
import { useInstagramData, useReelsData } from "./hooks/useReelsData";
import {
  buildMetaAdsSummary,
  formatMetricValue,
} from "./utils/metaAdsAnalytics";
import { buildCampaignOptions } from "./utils/metaAdsCampaignReview";
import {
  buildMonthOptions,
  buildContributorLeaders,
  calculateTotals,
  formatMonthKey,
  formatNumber,
  applyPlatformMetrics,
  getClipPresentation,
  getMomentumScore,
  getMonthKey,
  isInstagramReel,
  isPublishedInYear,
  PLATFORM_OPTIONS,
  sortReels,
} from "./utils/reels";

const DISPLAY_YEAR = 2026;
const CONTENT_GROUP_STORAGE_KEY = "premier-data-instagram-content-groups";
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;

  return {
    value: String(month),
    label: new Intl.DateTimeFormat("en-AU", { month: "long" }).format(
      new Date(DISPLAY_YEAR, index, 1)
    ),
  };
});
const ANALYTICS_METRICS = [
  { key: "views", label: "Views" },
  { key: "reach", label: "Reach" },
  { key: "interactions", label: "Interactions" },
  { key: "profileVisits", label: "Profile Visits" },
  { key: "shares", label: "Shares" },
  { key: "posts", label: "Posts" },
];
const COLLABORATION_CONTENT_TYPES = new Set(
  [
    "Cench",
    "Cench Ex-AFL",
    "Baseline",
    "Ball Magnets",
    "Prime Train",
    "Marmalade",
    "Shepmates",
    "200 Plus",
    "The Kicking Consultant",
    "Cooper Hamilton",
  ].map(normalizeContentTypeLabel)
);

function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-field" aria-hidden="true" />

      <section className="loading-card">
        <div className="loading-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="loading-copy">
          <div className="loading-pill">Socials Reporting</div>
          <h1>Syncing live data</h1>
          <p>IG live · FB weekly</p>
        </div>

        <div className="loading-visual" aria-hidden="true">
          <div className="loading-bar" />
          <div className="loading-scan" />
        </div>
      </section>
    </div>
  );
}

function SideTabBar({ activeTab, isOpen, onSelectTab, onToggle }) {
  const tabs = [
    {
      id: "dashboard",
      icon: "DB",
      iconType: "text",
      label: "Dashboard",
      ariaLabel: "Dashboard Overview",
      description: "Overview",
    },
    {
      id: "new-page",
      icon: "/Instagram.svg",
      iconType: "image",
      label: "Instagram",
      ariaLabel: "Instagram Reporting Content groups",
      description: "Content groups",
    },
    {
      id: "socials",
      icon: "/Logo App.png",
      iconType: "image",
      label: "Social Media",
      ariaLabel: "Socials Reporting Leaderboard",
      description: "Leaderboard",
    },
    {
      id: "meta-ads",
      icon: "AD",
      iconType: "text",
      label: "Meta Ads",
      ariaLabel: "Meta Ads Reporting Paid campaigns",
      description: "Paid campaigns",
    },
  ];

  return (
    <aside
      className={`side-tabs ${isOpen ? "side-tabs-open" : "side-tabs-collapsed"}`}
      aria-label="Report navigation"
    >
      <div className="side-tabs-brand" aria-hidden="true">
        <img
          className="side-tabs-logo side-tabs-logo-open"
          src="/Premier Data White.png"
          alt=""
        />
        <img
          className="side-tabs-logo side-tabs-logo-collapsed"
          src="/Logo App.png"
          alt=""
        />
      </div>

      <div className="side-tabs-divider" />

      <div className="side-tabs-search" aria-hidden="true">
        <span className="side-tabs-search-icon">⌕</span>
        <span className="side-tabs-search-label">Search dashboard</span>
      </div>

      <nav className="side-tabs-list" aria-label="Report tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`side-tab ${isActive ? "side-tab-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.ariaLabel}
              title={tab.label}
              onClick={() => onSelectTab(tab.id)}
            >
              <span className="side-tab-icon" aria-hidden="true">
                {tab.iconType === "image" ? <img src={tab.icon} alt="" /> : tab.icon}
              </span>
              <span className="side-tab-copy">
                <span className="side-tab-label">{tab.label}</span>
                <span className="side-tab-description">{tab.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className="side-tabs-toggle"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Collapse navigation" : "Open navigation"}
        onClick={onToggle}
      >
        <span className="side-tabs-toggle-icon" aria-hidden="true">
          {isOpen ? "‹" : "›"}
        </span>
        <span className="side-tabs-toggle-label">Collapse</span>
      </button>
    </aside>
  );
}

const getContentKey = (item, index) =>
  item.igMediaId || item.clipUrl || `${item.contentTitle || item.reelName}-${index}`;

const splitContentLabels = (value) =>
  String(value || "")
    .split(";")
    .map((label) => getContentTypeDisplayLabel(label))
    .filter(Boolean);

const INSTAGRAM_MEDIA_LABELS = new Set(["post", "reel", "reels", "video", "carousel"]);
const isInstagramMediaLabel = (value) =>
  splitContentLabels(value).every((label) =>
    INSTAGRAM_MEDIA_LABELS.has(normalizeContentTypeLabel(label))
  );

const getDashboardContentGroup = (item, savedGroup = "") => {
  const sheetGroup = String(item.contentGroup || "").trim();
  const sheetType = String(item.contentType || "").trim();

  if (sheetType && (!sheetGroup || isInstagramMediaLabel(sheetGroup))) {
    return sheetType;
  }

  return sheetGroup || savedGroup || "";
};

const getInstagramContentType = (item) => {
  if (item.contentType && isInstagramMediaLabel(item.contentType)) return item.contentType;
  if (item.contentGroup && isInstagramMediaLabel(item.contentGroup)) return item.contentGroup;

  const productType = String(item.mediaProductType || "").toUpperCase();
  const mediaType = String(item.mediaType || "").toUpperCase();
  const clipUrl = String(item.clipUrl || "").toLowerCase();

  if (productType === "REELS" || clipUrl.includes("/reel/")) return "Reel";
  if (mediaType === "CAROUSEL_ALBUM") return "Carousel";
  if (mediaType === "VIDEO" || clipUrl.includes("/tv/")) return "Video";
  return "Post";
};

const getPostContentLabels = (item) => {
  if (Array.isArray(item.contentLabels)) return item.contentLabels;

  const labels = splitContentLabels(item.contentGroup);
  const seenLabels = new Set();

  return labels.filter((label) => {
    const key = normalizeContentTypeLabel(label);
    if (!key || seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });
};

const postHasContentLabel = (item, label) =>
  getPostContentLabels(item).some(
    (contentLabel) => normalizeContentTypeLabel(contentLabel) === normalizeContentTypeLabel(label)
  );

const createMonthSummary = () => ({
  postCount: 0,
  views: 0,
  reach: 0,
  likes: 0,
  comments: 0,
  reshares: 0,
  saves: 0,
});

const addPostToSummary = (summary, item) => ({
  postCount: summary.postCount + 1,
  views: summary.views + Number(item.views || 0),
  reach: summary.reach + Number(item.igReach || item.reach || 0),
  likes: summary.likes + Number(item.likes || 0),
  comments: summary.comments + Number(item.comments || 0),
  reshares: summary.reshares + Number(item.reshares || 0),
  saves: summary.saves + Number(item.saves || 0),
});

const mergeSummaries = (summary, nextSummary) => ({
  postCount: summary.postCount + nextSummary.postCount,
  views: summary.views + nextSummary.views,
  reach: summary.reach + nextSummary.reach,
  likes: summary.likes + nextSummary.likes,
  comments: summary.comments + nextSummary.comments,
  reshares: summary.reshares + nextSummary.reshares,
  saves: summary.saves + nextSummary.saves,
});

const sumMonthlyBreakdown = (breakdown) =>
  breakdown.reduce(
    (totalSummary, monthItem) => mergeSummaries(totalSummary, monthItem.summary),
    createMonthSummary()
  );

const getSummaryEngagements = (summary) =>
  summary.likes + summary.comments + summary.reshares + summary.saves;

const getSummaryDivisor = (summary, mode) =>
  mode === "averages" ? summary.postCount || 1 : 1;

const getSummaryMetricValue = (summary, metricKey, mode) =>
  Math.round(Number(summary[metricKey] || 0) / getSummaryDivisor(summary, mode));

const getAnalyticsMetricValue = (summary, metricKey, mode = "totals") => {
  const divisor = getSummaryDivisor(summary, mode);

  if (metricKey === "interactions") {
    return Math.round(getSummaryEngagements(summary) / divisor);
  }

  if (metricKey === "profileVisits") {
    return Math.round((summary.comments + summary.reshares) / divisor);
  }

  if (metricKey === "shares") {
    return Math.round(summary.reshares / divisor);
  }

  if (metricKey === "posts") {
    return summary.postCount;
  }

  return getSummaryMetricValue(summary, metricKey, mode);
};

const buildMonthlySummaryBreakdown = (posts, yearToSummarise) => {
  const summaries = new Map();

  posts.forEach((item) => {
    const date = new Date(item.publishedAt || "");
    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    if (year !== yearToSummarise) return;

    const month = date.getMonth() + 1;
    const existing = summaries.get(month) || createMonthSummary();

    summaries.set(month, addPostToSummary(existing, item));
  });

  return MONTH_OPTIONS.map(({ value, label }) => {
    const month = Number(value);

    return {
      month,
      label,
      summary: summaries.get(month) || createMonthSummary(),
    };
  });
};

const buildContentTypeRows = ({
  tabs,
  posts,
  scope,
  year,
  selectedMonth,
}) =>
  tabs
    .filter((tab) => {
      if (tab === "Everything") return false;

      const isCollaboration = COLLABORATION_CONTENT_TYPES.has(
        normalizeContentTypeLabel(tab)
      );

      return scope === "collaborations" ? isCollaboration : !isCollaboration;
    })
    .map((tab) => {
      const postsForTab = posts.filter((item) => postHasContentLabel(item, tab));
      const breakdown = buildMonthlySummaryBreakdown(postsForTab, year);
      const summary =
        selectedMonth === "all"
          ? sumMonthlyBreakdown(breakdown)
          : breakdown.find((monthItem) => monthItem.month === Number(selectedMonth))
              ?.summary || createMonthSummary();
      const engagements = getSummaryEngagements(summary);

      return {
        label: tab,
        avatarSrc: getContentTypeAvatar(tab),
        initials: tab
          .split(/\s+/)
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        summary,
        engagements,
        engagementRate: summary.views ? (engagements / summary.views) * 100 : 0,
      };
    })
    .filter((row) => row.summary.postCount > 0);

function KpiIcon({ type }) {
  const icons = {
    views: (
      <>
        <path d="M2.1 12s3.5-6.5 9.9-6.5S21.9 12 21.9 12s-3.5 6.5-9.9 6.5S2.1 12 2.1 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    reach: (
      <>
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="7" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
      </>
    ),
    interactions: (
      <>
        <path d="M4.5 5.5h11a3 3 0 0 1 3 3v5.2a3 3 0 0 1-3 3H10l-4.4 3v-3H4.5a3 3 0 0 1-3-3V8.5a3 3 0 0 1 3-3Z" />
        <path d="M8 10h7" />
        <path d="M8 13h4.7" />
        <path d="M17.5 8.2h2a3 3 0 0 1 3 3v5.2a3 3 0 0 1-3 3h-1.1v2.6l-3.7-2.6h-4.2" />
      </>
    ),
    profile: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="10" cy="10" r="2.4" />
        <path d="M6.5 16.3c.8-2.1 2-3.1 3.5-3.1s2.7 1 3.5 3.1" />
        <path d="M15.7 9.2h2.4" />
        <path d="M15.7 13h2.4" />
      </>
    ),
  };

  const icon = icons[type] || icons.profile;
  const iconType = icons[type] ? type : "profile";

  return (
    <span className={`kpi-glyph kpi-glyph-${iconType}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {icon}
      </svg>
    </span>
  );
}

const getInstagramDashboardSummary = (rows) => {
  const currentYearRows = rows
    .filter((item) => isPublishedInYear(item, DISPLAY_YEAR))
    .map((item) => applyPlatformMetrics(item, "instagram"));
  const totals = currentYearRows.reduce(
    (summary, item) => ({
      views: summary.views + Number(item.igViews || item.views || 0),
      reach: summary.reach + Number(item.igReach || 0),
      likes: summary.likes + Number(item.igLikes || item.likes || 0),
      comments: summary.comments + Number(item.igComments || item.comments || 0),
      shares: summary.shares + Number(item.igShares || item.reshares || 0),
      saves: summary.saves + Number(item.igSaves || item.saves || 0),
      posts: summary.posts + 1,
    }),
    {
      views: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      posts: 0,
    }
  );
  const latestFollowerRow = rows.find((item) => Number(item.igFollowers || 0) > 0);

  return {
    ...totals,
    interactions: totals.likes + totals.comments + totals.shares + totals.saves,
    profileVisits: totals.comments + totals.shares,
    followers: Number(latestFollowerRow?.igFollowers || 0) || 40800,
  };
};

function DashboardOverview({
  socialsRows,
  instagramRows,
  metaAdsData,
  metaAdsLeadsData,
  formatNumber,
  onOpenTab,
}) {
  const socialsTotals = useMemo(() => calculateTotals(socialsRows), [socialsRows]);
  const socialsReelCount = socialsRows.filter(isInstagramReel).length;
  const instagramSummary = useMemo(
    () => getInstagramDashboardSummary(instagramRows),
    [instagramRows]
  );
  const metaSummary = useMemo(
    () => buildMetaAdsSummary(metaAdsData.rows || []),
    [metaAdsData.rows]
  );
  const campaignOptions = useMemo(
    () => buildCampaignOptions(metaAdsData.rows || []),
    [metaAdsData.rows]
  );
  const latestCampaign = campaignOptions[0];
  const manualLeads = metaAdsLeadsData.leads || [];
  const contactedLeads = manualLeads.filter((lead) =>
    ["Contacted", "Converted", "Failed"].includes(lead.status)
  ).length;
  const convertedLeads = manualLeads.filter((lead) => lead.status === "Converted").length;
  const socialsInteractions =
    socialsTotals.likes + socialsTotals.comments + socialsTotals.reshares + socialsTotals.saves;
  const selectedMetaCampaignRows = (latestCampaign?.rows || []).slice(0, 5);

  return (
    <main className="analytics-shell dashboard-overview-shell">
      <section className="analytics-hero-panel dashboard-overview-hero">
        <div className="analytics-hero-copy">
          <span className="analytics-kicker">Dashboard overview</span>
          <div className="analytics-title-row">
            <h2>Dashboard</h2>
          </div>
          <p>
            Performance snapshot across Instagram content, Socials leaderboard and Meta Ads.
          </p>
        </div>

        <div className="dashboard-overview-filter-card">
          <div>
            <span>Year</span>
            <strong>{DISPLAY_YEAR}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>Live sheets</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-overview-snapshot-grid" aria-label="Dashboard snapshots">
        <button
          type="button"
          className="dashboard-overview-snapshot dashboard-overview-snapshot-instagram"
          onClick={() => onOpenTab("new-page")}
        >
          <span>Instagram Reporting</span>
          <strong>{formatNumber(instagramSummary.views)}</strong>
          <em>Views</em>
          <p>{formatNumber(instagramSummary.interactions)} interactions · {formatNumber(instagramSummary.followers)} followers</p>
        </button>
        <button
          type="button"
          className="dashboard-overview-snapshot dashboard-overview-snapshot-socials"
          onClick={() => onOpenTab("socials")}
        >
          <span>Socials Reporting</span>
          <strong>{formatNumber(socialsTotals.views)}</strong>
          <em>Combined platform views</em>
          <p>{formatNumber(socialsInteractions)} interactions · {formatNumber(socialsReelCount)} reels</p>
        </button>
        <button
          type="button"
          className="dashboard-overview-snapshot dashboard-overview-snapshot-meta"
          onClick={() => onOpenTab("meta-ads")}
        >
          <span>Meta Ads Reporting</span>
          <strong>{formatMetricValue(metaSummary.results, "number")}</strong>
          <em>Leads</em>
          <p>{formatMetricValue(metaSummary.amountSpent, "currency")} spend · {formatMetricValue(metaSummary.costPerResult, "currency")} CPL</p>
        </button>
        <button
          type="button"
          className="dashboard-overview-snapshot dashboard-overview-snapshot-pipeline"
          onClick={() => onOpenTab("meta-ads")}
        >
          <span>Lead Pipeline</span>
          <strong>{formatNumber(manualLeads.length)}</strong>
          <em>Manual leads</em>
          <p>{formatNumber(contactedLeads)} contacted · {formatNumber(convertedLeads)} converted</p>
        </button>
      </section>

      <div className="dashboard-overview-grid">
        <section className="analytics-breakdown-card dashboard-overview-table-card">
          <div className="analytics-card-header">
            <strong>Page Summary</strong>
            <span className="analytics-mode-chip">{DISPLAY_YEAR} overview</span>
          </div>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Primary</th>
                <th>Secondary</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Instagram Reporting</td>
                <td>{formatNumber(instagramSummary.views)} views</td>
                <td>{formatNumber(instagramSummary.reach)} reach</td>
                <td>{formatNumber(instagramSummary.posts)} posts</td>
              </tr>
              <tr>
                <td>Socials Reporting</td>
                <td>{formatNumber(socialsTotals.views)} views</td>
                <td>{formatNumber(socialsTotals.reshares)} shares</td>
                <td>{formatNumber(socialsReelCount)} reels</td>
              </tr>
              <tr>
                <td>Meta Ads Reporting</td>
                <td>{formatMetricValue(metaSummary.results, "number")} leads</td>
                <td>{formatMetricValue(metaSummary.amountSpent, "currency")} spend</td>
                <td>{formatNumber(metaSummary.campaignCount)} campaigns</td>
              </tr>
              <tr>
                <td>Lead Pipeline</td>
                <td>{formatNumber(manualLeads.length)} leads</td>
                <td>{formatNumber(contactedLeads)} contacted</td>
                <td>{formatNumber(convertedLeads)} converted</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="analytics-breakdown-card dashboard-overview-side-card">
          <div className="analytics-card-header">
            <strong>Instagram Top Line</strong>
            <span className="analytics-mode-chip">Content</span>
          </div>
          <div className="dashboard-overview-list">
            <div className="dashboard-overview-list-row">
              <span><img src="/Instagram.svg" alt="" /> Followers</span>
              <strong>{formatNumber(instagramSummary.followers)}</strong>
            </div>
            <div className="dashboard-overview-list-row">
              <span>Reach</span>
              <strong>{formatNumber(instagramSummary.reach)}</strong>
            </div>
            <div className="dashboard-overview-list-row">
              <span>Posts</span>
              <strong>{formatNumber(instagramSummary.posts)}</strong>
            </div>
          </div>
        </section>

        <section className="analytics-breakdown-card dashboard-overview-side-card">
          <div className="analytics-card-header">
            <strong>Latest Campaign</strong>
            <span className="analytics-mode-chip">Meta Ads</span>
          </div>
          <div className="dashboard-overview-meta-highlight">
            <span>{latestCampaign?.campaignName || "No campaign data"}</span>
            <strong>{formatMetricValue(latestCampaign?.results, "number")}</strong>
            <em>Leads tracked</em>
            <p>{formatMetricValue(latestCampaign?.amountSpent, "currency")} spend · {formatMetricValue(latestCampaign?.costPerResult, "currency")} CPL</p>
          </div>
        </section>
      </div>

      <section className="analytics-breakdown-card dashboard-overview-wide-card">
        <div className="analytics-card-header">
          <strong>Latest Campaign Daily Snapshot</strong>
          <span className="analytics-mode-chip">{latestCampaign?.campaignName || "Meta Ads"}</span>
        </div>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Leads</th>
              <th>Spend</th>
              <th>Impressions</th>
              <th>Reach</th>
            </tr>
          </thead>
          <tbody>
            {selectedMetaCampaignRows.length ? (
              selectedMetaCampaignRows.map((row, index) => (
                <tr key={`${row.campaignName}-${row.reportingStarts || row.date}-${index}`}>
                  <td>{row.reportingStarts || row.date || "—"}</td>
                  <td>{formatMetricValue(row.results, "number")}</td>
                  <td>{formatMetricValue(row.amountSpent, "currency")}</td>
                  <td>{formatMetricValue(row.impressions, "number")}</td>
                  <td>{formatMetricValue(row.reach, "number")}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No Meta Ads rows available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function InstagramContentPage({
  reels,
  contentGroups,
  formatNumber,
}) {
  const [selectedAnalysisTab, setSelectedAnalysisTab] = useState("Everything");
  const [selectedMetric, setSelectedMetric] = useState("views");
  const [selectedAnalysisMonth, setSelectedAnalysisMonth] = useState("all");
  const [selectedAnalysisYear, setSelectedAnalysisYear] = useState(String(DISPLAY_YEAR));
  const [showYearComparison, setShowYearComparison] = useState(false);
  const [contentTotalsMode, setContentTotalsMode] = useState("totals");
  const [contentTotalsScope, setContentTotalsScope] = useState("premier");
  const [contentTotalsYear, setContentTotalsYear] = useState(String(DISPLAY_YEAR));
  const [interactionBreakdownMode, setInteractionBreakdownMode] = useState("averages");
  const [interactionBreakdownScope, setInteractionBreakdownScope] = useState("premier");
  const [interactionBreakdownYear, setInteractionBreakdownYear] = useState(String(DISPLAY_YEAR));
  const [performanceTrendMode, setPerformanceTrendMode] = useState("totals");
  const [contentTotalsSort, setContentTotalsSort] = useState({
    key: "focused",
    direction: "desc",
  });
  const [interactionBreakdownSort, setInteractionBreakdownSort] = useState({
    key: "interactions",
    direction: "desc",
  });
  const [monthlyBreakdownSort, setMonthlyBreakdownSort] = useState({
    key: "month",
    direction: "asc",
  });

  const instagramPosts = useMemo(
    () =>
      reels
        .map((item, index) => {
          const key = getContentKey(item, index);
          const group = getDashboardContentGroup(item, contentGroups[key]);
          const explicitLabels = splitContentLabels(group);
          const contentLabels = [
            ...new Map(
              explicitLabels.map((label) => [normalizeContentTypeLabel(label), label])
            ).values(),
          ];

          return {
            ...applyPlatformMetrics(item, "instagram"),
            contentKey: key,
            contentGroup: group || "Ungrouped",
            contentType: getInstagramContentType(item),
            contentLabels,
          };
        })
        .filter(
          (item) =>
            item.igMediaId ||
            item.igViews ||
            String(item.clipUrl || "").toLowerCase().includes("instagram.com")
        ),
    [contentGroups, reels]
  );

  const instagramAnalysisTabs = useMemo(() => {
    const tabs = [];
    const seenTabs = new Set();
    const addTab = (value) => {
      const label = String(value || "").trim();
      const key = label.toLowerCase();

      if (
        !label ||
        key === "ungrouped" ||
        seenTabs.has(key) ||
        !shouldShowContentTotalLabel(label)
      ) return;
      seenTabs.add(key);
      tabs.push(label);
    };

    BASE_INSTAGRAM_ANALYSIS_TABS.forEach(addTab);
    instagramPosts.forEach((item) => {
      getPostContentLabels(item).forEach(addTab);
    });

    return tabs;
  }, [instagramPosts]);

  useEffect(() => {
    if (!instagramAnalysisTabs.includes(selectedAnalysisTab)) {
      setSelectedAnalysisTab("Everything");
    }
  }, [instagramAnalysisTabs, selectedAnalysisTab]);

  const analysisPosts = useMemo(
    () =>
      instagramPosts.filter((item) => {
        if (selectedAnalysisTab === "Everything") return true;
        return postHasContentLabel(item, selectedAnalysisTab);
      }),
    [instagramPosts, selectedAnalysisTab]
  );

  const availableYears = useMemo(() => {
    const years = new Set([DISPLAY_YEAR, DISPLAY_YEAR - 1]);

    analysisPosts.forEach((item) => {
      const date = new Date(item.publishedAt || "");
      if (!Number.isNaN(date.getTime())) years.add(date.getFullYear());
    });

    return [...years].sort((a, b) => b - a);
  }, [analysisPosts]);
  const contentTotalsAvailableYears = useMemo(() => {
    const years = new Set([DISPLAY_YEAR, DISPLAY_YEAR - 1]);

    instagramPosts.forEach((item) => {
      const date = new Date(item.publishedAt || "");
      if (!Number.isNaN(date.getTime())) years.add(date.getFullYear());
    });

    return [...years].sort((a, b) => b - a);
  }, [instagramPosts]);

  const selectedYearNumber = Number(selectedAnalysisYear);
  const contentTotalsYearNumber = Number(contentTotalsYear);
  const interactionBreakdownYearNumber = Number(interactionBreakdownYear);
  const comparisonYearNumber = selectedYearNumber - 1;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const monthlyBreakdown = useMemo(
    () => buildMonthlySummaryBreakdown(analysisPosts, selectedYearNumber),
    [analysisPosts, selectedYearNumber]
  );

  const comparisonMonthlyBreakdown = useMemo(
    () => buildMonthlySummaryBreakdown(analysisPosts, comparisonYearNumber),
    [analysisPosts, comparisonYearNumber]
  );

  const selectedPeriodSummary = useMemo(() => {
    if (selectedAnalysisMonth === "all") {
      return sumMonthlyBreakdown(monthlyBreakdown);
    }

    return (
      monthlyBreakdown.find((monthItem) => monthItem.month === Number(selectedAnalysisMonth))
        ?.summary || createMonthSummary()
    );
  }, [monthlyBreakdown, selectedAnalysisMonth]);

  const selectedMonthLabel =
    selectedAnalysisMonth === "all"
      ? "All months"
      : MONTH_OPTIONS.find((month) => month.value === selectedAnalysisMonth)?.label || "Month";
  const visibleChartMonths = useMemo(
    () =>
      MONTH_OPTIONS.filter(({ value }) => {
        const month = Number(value);
        if (selectedYearNumber < currentYear) return true;
        if (selectedYearNumber > currentYear) return false;
        return month <= currentMonth;
      }),
    [currentMonth, currentYear, selectedYearNumber]
  );

  const graphRows = useMemo(() => {
    if (selectedAnalysisMonth === "all") {
      return monthlyBreakdown
        .filter(({ month }) =>
          visibleChartMonths.some((visibleMonth) => Number(visibleMonth.value) === month)
        )
        .map(({ label, month, summary }) => {
          const comparisonSummary =
            comparisonMonthlyBreakdown.find((monthItem) => monthItem.month === month)?.summary ||
            createMonthSummary();

          return {
            id: label,
            label,
            primary: getAnalyticsMetricValue(summary, selectedMetric, performanceTrendMode),
            secondary: showYearComparison
              ? getAnalyticsMetricValue(comparisonSummary, selectedMetric, performanceTrendMode)
              : null,
            primaryLabel: String(selectedYearNumber),
            secondaryLabel: String(comparisonYearNumber),
          };
        });
    }

    return visibleChartMonths.map(({ value, label }) => {
      const month = Number(value);
      const currentSummary =
        monthlyBreakdown.find((monthItem) => monthItem.month === month)?.summary ||
        createMonthSummary();
      const comparisonSummary =
        comparisonMonthlyBreakdown.find((monthItem) => monthItem.month === month)?.summary ||
        createMonthSummary();

      return {
        id: label,
        label,
        primary: getAnalyticsMetricValue(currentSummary, selectedMetric, performanceTrendMode),
        secondary: showYearComparison
          ? getAnalyticsMetricValue(comparisonSummary, selectedMetric, performanceTrendMode)
          : null,
        primaryLabel: String(selectedYearNumber),
        secondaryLabel: String(comparisonYearNumber),
      };
    });
  }, [
    comparisonMonthlyBreakdown,
    comparisonYearNumber,
    monthlyBreakdown,
    performanceTrendMode,
    selectedAnalysisMonth,
    selectedMetric,
    selectedYearNumber,
    showYearComparison,
    visibleChartMonths,
  ]);

  const graphMaxValue = useMemo(
    () =>
      Math.max(
        1,
        ...graphRows.flatMap((row) => [row.primary || 0, row.secondary || 0])
      ),
    [graphRows]
  );

  const contentTotals = useMemo(
    () =>
      buildContentTypeRows({
        tabs: instagramAnalysisTabs,
        posts: instagramPosts,
        scope: contentTotalsScope,
        year: contentTotalsYearNumber,
        selectedMonth: selectedAnalysisMonth,
      })
        .sort((a, b) => {
          const getSortValue = (row) => {
            if (contentTotalsSort.key === "engagementRate") return row.engagementRate;
            if (contentTotalsSort.key === "focused") {
              return getAnalyticsMetricValue(row.summary, selectedMetric, contentTotalsMode);
            }
            return getAnalyticsMetricValue(row.summary, contentTotalsSort.key, contentTotalsMode);
          };
          const direction = contentTotalsSort.direction === "asc" ? 1 : -1;

          return (getSortValue(a) - getSortValue(b)) * direction;
        }),
    [
      contentTotalsMode,
      contentTotalsScope,
      contentTotalsSort,
      contentTotalsYearNumber,
      instagramAnalysisTabs,
      instagramPosts,
      selectedAnalysisMonth,
      selectedMetric,
    ]
  );

  const interactionBreakdownRows = useMemo(
    () =>
      buildContentTypeRows({
        tabs: instagramAnalysisTabs,
        posts: instagramPosts,
        scope: interactionBreakdownScope,
        year: interactionBreakdownYearNumber,
        selectedMonth: selectedAnalysisMonth,
      })
        .sort((a, b) => {
          const getInteractionValue = (row) => {
            const divisor = getSummaryDivisor(row.summary, interactionBreakdownMode);

            if (interactionBreakdownSort.key === "likes") return row.summary.likes / divisor;
            if (interactionBreakdownSort.key === "comments") return row.summary.comments / divisor;
            if (interactionBreakdownSort.key === "shares") return row.summary.reshares / divisor;
            if (interactionBreakdownSort.key === "saves") return row.summary.saves / divisor;
            return row.engagements / divisor;
          };
          const direction = interactionBreakdownSort.direction === "asc" ? 1 : -1;

          return (getInteractionValue(a) - getInteractionValue(b)) * direction;
        }),
    [
      instagramAnalysisTabs,
      instagramPosts,
      interactionBreakdownMode,
      interactionBreakdownSort,
      interactionBreakdownScope,
      interactionBreakdownYearNumber,
      selectedAnalysisMonth,
    ]
  );

  const selectedEngagements = getSummaryEngagements(selectedPeriodSummary);
  const followerCount = useMemo(
    () => {
      const mostRecentRowWithFollowerCount = instagramPosts.find(
        (item) => Number(item.igFollowers || 0) > 0
      );

      return Number(mostRecentRowWithFollowerCount?.igFollowers || 0) || 40800;
    },
    [instagramPosts]
  );
  const selectedProfileVisits = selectedPeriodSummary.reshares + selectedPeriodSummary.comments;
  const kpiSummaryDivisor = getSummaryDivisor(selectedPeriodSummary, contentTotalsMode);
  const kpiViews = Math.round(selectedPeriodSummary.views / kpiSummaryDivisor);
  const kpiReach = Math.round(selectedPeriodSummary.reach / kpiSummaryDivisor);
  const kpiInteractions = Math.round(selectedEngagements / kpiSummaryDivisor);
  const kpiProfileVisits = Math.round(selectedProfileVisits / kpiSummaryDivisor);
  const selectedMetricOption =
    ANALYTICS_METRICS.find((metric) => metric.key === selectedMetric) || ANALYTICS_METRICS[0];
  const periodLabel = `${selectedAnalysisYear} · ${selectedMonthLabel}`;
  const contentScopeLabel =
    selectedAnalysisTab === "Everything" ? "Everything" : selectedAnalysisTab;
  const selectedContentAvatarSrc =
    selectedAnalysisTab === "Everything" ? "" : getContentTypeAvatar(selectedAnalysisTab);
  const selectedContentThemeClass =
    selectedAnalysisTab === "Everything" ? "" : getContentTypeThemeClass(selectedAnalysisTab);
  const selectedContentInitials = selectedAnalysisTab
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const contextLabel = `${periodLabel} · ${contentScopeLabel}`;
  const happenedMonthlyBreakdown = monthlyBreakdown.filter((monthItem) => {
    if (selectedYearNumber < currentYear) return true;
    if (selectedYearNumber > currentYear) return false;
    return monthItem.month <= currentMonth;
  });
  const filteredMonthlyRows =
    selectedAnalysisMonth === "all"
      ? happenedMonthlyBreakdown
      : happenedMonthlyBreakdown.filter(
          (monthItem) => monthItem.month === Number(selectedAnalysisMonth)
        );
  const sortedMonthlyRows = useMemo(() => {
    const getSortValue = ({ month, summary }) => {
      if (monthlyBreakdownSort.key === "month") return month;
      if (monthlyBreakdownSort.key === "interactions") return getSummaryEngagements(summary);
      if (monthlyBreakdownSort.key === "shares") return summary.reshares;
      if (monthlyBreakdownSort.key === "posts") return summary.postCount;
      return Number(summary[monthlyBreakdownSort.key] || 0);
    };
    const direction = monthlyBreakdownSort.direction === "asc" ? 1 : -1;

    return [...filteredMonthlyRows].sort(
      (a, b) => (getSortValue(a) - getSortValue(b)) * direction
    );
  }, [filteredMonthlyRows, monthlyBreakdownSort]);
  const handleMonthlyBreakdownSort = (key) => {
    setMonthlyBreakdownSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "desc" ? "asc" : "desc",
    }));
  };
  const getMonthlyBreakdownSortArrow = (key) => {
    if (monthlyBreakdownSort.key !== key) return "";
    return monthlyBreakdownSort.direction === "asc" ? " ↑" : " ↓";
  };
  const handleContentTotalsSort = (key) => {
    setContentTotalsSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "desc" ? "asc" : "desc",
    }));
  };
  const getContentTotalsSortArrow = (key) => {
    if (contentTotalsSort.key !== key) return "";
    return contentTotalsSort.direction === "asc" ? " ↑" : " ↓";
  };
  const handleInteractionBreakdownSort = (key) => {
    setInteractionBreakdownSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "desc" ? "asc" : "desc",
    }));
  };
  const getInteractionBreakdownSortArrow = (key) => {
    if (interactionBreakdownSort.key !== key) return "";
    return interactionBreakdownSort.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <main className="analytics-shell">
      <section className="analytics-hero-panel">
        <div className="analytics-hero-copy">
          <div className="analytics-kicker">Social Media Analytics</div>
          <div className="analytics-title-row">
            <h2>Instagram Reporting</h2>
            <p className="analytics-hero-followers">
              Followers <strong>{formatNumber(followerCount)}</strong>
            </p>
          </div>
        </div>

        <div className="analytics-filter-card">
          <label>
            <span>Year</span>
            <select
              value={selectedAnalysisYear}
              onChange={(event) => setSelectedAnalysisYear(event.target.value)}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Content Type</span>
            <select
              value={selectedAnalysisTab}
              onChange={(event) => setSelectedAnalysisTab(event.target.value)}
            >
              {instagramAnalysisTabs.map((tab) => (
                <option key={tab} value={tab}>
                  {tab}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Month</span>
            <select
              value={selectedAnalysisMonth}
              onChange={(event) => setSelectedAnalysisMonth(event.target.value)}
            >
              <option value="all">All</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <div className="analytics-filter-meta">
            <span>{periodLabel}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedAnalysisYear(String(DISPLAY_YEAR));
                setSelectedAnalysisTab("Everything");
                setSelectedAnalysisMonth("all");
                setSelectedMetric("views");
                setShowYearComparison(false);
                setContentTotalsMode("totals");
                setContentTotalsScope("premier");
                setInteractionBreakdownMode("averages");
                setInteractionBreakdownScope("premier");
                setInteractionBreakdownYear(String(DISPLAY_YEAR));
                setPerformanceTrendMode("totals");
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {selectedAnalysisTab !== "Everything" ? (
        <section className={`analytics-content-banner ${selectedContentThemeClass}`}>
          <span className="analytics-content-banner-media" aria-hidden="true">
            {selectedContentAvatarSrc ? (
              <img src={selectedContentAvatarSrc} alt="" />
            ) : (
              <span>{selectedContentInitials}</span>
            )}
          </span>
          <div className="analytics-content-banner-copy">
            <span>Content Type</span>
            <strong>{selectedAnalysisTab}</strong>
          </div>
        </section>
      ) : null}

      <section className="analytics-kpi-grid">
        {[
          ["views", "Views", kpiViews],
          ["reach", "Reach", kpiReach],
          ["interactions", "Interactions", kpiInteractions],
          ["profileVisits", "Profile Visits", kpiProfileVisits],
        ].map(([metricKey, label, value]) => (
          <button
            type="button"
            className={`analytics-kpi-card ${
              selectedMetric === metricKey ? "analytics-kpi-card-active" : ""
            }`}
            key={metricKey}
            aria-pressed={selectedMetric === metricKey}
            onClick={() => setSelectedMetric(metricKey)}
          >
            <div
              className={`analytics-kpi-icon analytics-kpi-icon-${metricKey}`}
              aria-hidden="true"
            >
              <KpiIcon type={metricKey} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{formatNumber(value)}</strong>
            </div>
            {selectedMetric === metricKey ? <em>Focused</em> : null}
          </button>
        ))}
      </section>

      <section className="analytics-main-grid">
        <div className="analytics-table-card">
          <div className="analytics-card-header">
            <strong>Content Totals</strong>
            <label className="analytics-inline-select">
              Year
              <select
                value={contentTotalsYear}
                onChange={(event) => setContentTotalsYear(event.target.value)}
              >
                {contentTotalsAvailableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <div className="analytics-mode-toggle" aria-label="Content totals group">
              <button
                type="button"
                className={contentTotalsScope === "premier" ? "analytics-mode-active" : ""}
                aria-pressed={contentTotalsScope === "premier"}
                onClick={() => setContentTotalsScope("premier")}
              >
                Premier Data
              </button>
              <button
                type="button"
                className={contentTotalsScope === "collaborations" ? "analytics-mode-active" : ""}
                aria-pressed={contentTotalsScope === "collaborations"}
                onClick={() => setContentTotalsScope("collaborations")}
              >
                Collaborations
              </button>
            </div>
            <div className="analytics-mode-toggle" aria-label="Content totals mode">
              <button
                type="button"
                className={contentTotalsMode === "totals" ? "analytics-mode-active" : ""}
                aria-pressed={contentTotalsMode === "totals"}
                onClick={() => setContentTotalsMode("totals")}
              >
                Totals
              </button>
              <button
                type="button"
                className={contentTotalsMode === "averages" ? "analytics-mode-active" : ""}
                aria-pressed={contentTotalsMode === "averages"}
                onClick={() => setContentTotalsMode("averages")}
              >
                Averages
              </button>
            </div>
          </div>
          <div className="analytics-table-scroll">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Content Type</th>
                  <th className={selectedMetric === "views" ? "analytics-column-active" : ""}>
                    <button type="button" onClick={() => handleContentTotalsSort("views")}>
                      Views{getContentTotalsSortArrow("views")}
                    </button>
                  </th>
                  <th className={selectedMetric === "reach" ? "analytics-column-active" : ""}>
                    <button type="button" onClick={() => handleContentTotalsSort("reach")}>
                      Reach{getContentTotalsSortArrow("reach")}
                    </button>
                  </th>
                  <th className={selectedMetric === "interactions" ? "analytics-column-active" : ""}>
                    <button type="button" onClick={() => handleContentTotalsSort("interactions")}>
                      Interactions{getContentTotalsSortArrow("interactions")}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleContentTotalsSort("engagementRate")}>
                      Eng. Rate{getContentTotalsSortArrow("engagementRate")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {contentTotals.map(({ label, avatarSrc, initials, summary, engagements, engagementRate }) => {
                  const divisor =
                    contentTotalsMode === "averages" ? summary.postCount || 1 : 1;

                  return (
                    <tr
                      className={selectedAnalysisTab === label ? "analytics-row-selected" : ""}
                      key={label}
                      onClick={() =>
                        setSelectedAnalysisTab((currentTab) =>
                          currentTab === label ? "Everything" : label
                        )
                      }
                    >
                      <td>
                        <button
                          type="button"
                          className="analytics-row-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedAnalysisTab((currentTab) =>
                              currentTab === label ? "Everything" : label
                            );
                          }}
                        >
                          <span className="analytics-content-avatar" aria-hidden="true">
                            {avatarSrc ? (
                              <img src={avatarSrc} alt="" />
                            ) : (
                              initials
                            )}
                          </span>
                          <span>{label}</span>
                        </button>
                        {contentTotalsMode === "averages" ? (
                          <span className="analytics-row-note">
                            {summary.postCount} post{summary.postCount === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </td>
                      <td className={selectedMetric === "views" ? "analytics-column-active" : ""}>
                        {formatNumber(Math.round(summary.views / divisor))}
                      </td>
                      <td className={selectedMetric === "reach" ? "analytics-column-active" : ""}>
                        {formatNumber(Math.round(summary.reach / divisor))}
                      </td>
                      <td className={selectedMetric === "interactions" ? "analytics-column-active" : ""}>
                        {formatNumber(Math.round(engagements / divisor))}
                      </td>
                      <td>{engagementRate.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="analytics-chart-card">
          <div className="analytics-card-header">
            <strong>Performance Trend</strong>
            <div className="analytics-year-compare" aria-label="Year comparison">
              <span className="analytics-year-chip analytics-year-chip-current">
                {selectedAnalysisYear}
              </span>
              <button
                type="button"
                className={`analytics-year-chip analytics-year-chip-previous ${
                  showYearComparison ? "analytics-year-chip-active" : ""
                }`}
                aria-pressed={showYearComparison}
                onClick={() => setShowYearComparison((currentValue) => !currentValue)}
              >
                vs {comparisonYearNumber}
                <span>{showYearComparison ? "On" : "Off"}</span>
              </button>
            </div>
            <button
              type="button"
              className="analytics-compact-mode-toggle"
              aria-label={`Performance trend mode: ${
                performanceTrendMode === "totals" ? "Totals" : "Averages"
              }`}
              onClick={() =>
                setPerformanceTrendMode((currentMode) =>
                  currentMode === "totals" ? "averages" : "totals"
                )
              }
            >
              {performanceTrendMode === "totals" ? "Totals" : "Averages"}
            </button>
            <label>
              Metric
              <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value)}>
                {ANALYTICS_METRICS.map((metric) => (
                  <option key={metric.key} value={metric.key}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="analytics-card-subheader">
            {selectedMetricOption.label} · {contentScopeLabel} ·{" "}
            {performanceTrendMode === "totals" ? "Totals" : "Averages"}
          </div>
          <div className="analytics-bar-chart">
            <div className="analytics-y-axis">
              <span>{formatNumber(graphMaxValue)}</span>
              <span>{formatNumber(Math.round(graphMaxValue * 0.66))}</span>
              <span>{formatNumber(Math.round(graphMaxValue * 0.33))}</span>
              <span>0</span>
            </div>
            <div className="analytics-bars">
              {graphRows.map((row) => (
                <div className="analytics-bar-group" key={row.id}>
                  <div className="analytics-bar-track">
                    <span
                      className="analytics-bar analytics-bar-current"
                      aria-label={`${row.label} ${row.primaryLabel} ${selectedMetricOption.label}: ${formatNumber(row.primary)}`}
                      data-tooltip={`${row.label} · ${row.primaryLabel}: ${formatNumber(row.primary)}`}
                      tabIndex="0"
                      style={{ "--bar-height": `${Math.max(2, (row.primary / graphMaxValue) * 100)}%` }}
                    />
                    {typeof row.secondary === "number" ? (
                      <span
                        className="analytics-bar analytics-bar-previous"
                        aria-label={`${row.label} ${row.secondaryLabel} ${selectedMetricOption.label}: ${formatNumber(row.secondary)}`}
                        data-tooltip={`${row.label} · ${row.secondaryLabel}: ${formatNumber(row.secondary)}`}
                        tabIndex="0"
                        style={{ "--bar-height": `${Math.max(2, (row.secondary / graphMaxValue) * 100)}%` }}
                      />
                    ) : null}
                  </div>
                  <span>{row.label.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="analytics-chart-legend" aria-label="Chart legend">
            <span><i className="analytics-legend-current" /> {selectedAnalysisYear}</span>
            {showYearComparison ? (
              <span><i className="analytics-legend-previous" /> {comparisonYearNumber}</span>
            ) : null}
            <em>{selectedMetricOption.label}</em>
          </div>
        </div>
      </section>

      {selectedMetric === "interactions" ? (
        <section className="analytics-table-card analytics-interaction-breakdown">
          <div className="analytics-card-header">
            <strong>Interaction Breakdown</strong>
            <label className="analytics-inline-select">
              Year
              <select
                value={interactionBreakdownYear}
                onChange={(event) => setInteractionBreakdownYear(event.target.value)}
              >
                {contentTotalsAvailableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <div className="analytics-mode-toggle" aria-label="Interaction breakdown group">
              <button
                type="button"
                className={interactionBreakdownScope === "premier" ? "analytics-mode-active" : ""}
                aria-pressed={interactionBreakdownScope === "premier"}
                onClick={() => setInteractionBreakdownScope("premier")}
              >
                Premier Data
              </button>
              <button
                type="button"
                className={interactionBreakdownScope === "collaborations" ? "analytics-mode-active" : ""}
                aria-pressed={interactionBreakdownScope === "collaborations"}
                onClick={() => setInteractionBreakdownScope("collaborations")}
              >
                Collaborations
              </button>
            </div>
            <div className="analytics-mode-toggle" aria-label="Interaction breakdown mode">
              <button
                type="button"
                className={interactionBreakdownMode === "totals" ? "analytics-mode-active" : ""}
                aria-pressed={interactionBreakdownMode === "totals"}
                onClick={() => setInteractionBreakdownMode("totals")}
              >
                Totals
              </button>
              <button
                type="button"
                className={interactionBreakdownMode === "averages" ? "analytics-mode-active" : ""}
                aria-pressed={interactionBreakdownMode === "averages"}
                onClick={() => setInteractionBreakdownMode("averages")}
              >
                Averages
              </button>
            </div>
          </div>
          <div className="analytics-table-scroll">
            <table className="analytics-table analytics-interaction-table">
              <thead>
                <tr>
                  <th>Content Type</th>
                  <th>
                    <button type="button" onClick={() => handleInteractionBreakdownSort("interactions")}>
                      Interactions{getInteractionBreakdownSortArrow("interactions")}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleInteractionBreakdownSort("likes")}>
                      Likes{getInteractionBreakdownSortArrow("likes")}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleInteractionBreakdownSort("comments")}>
                      Comments{getInteractionBreakdownSortArrow("comments")}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleInteractionBreakdownSort("shares")}>
                      Shares{getInteractionBreakdownSortArrow("shares")}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleInteractionBreakdownSort("saves")}>
                      Saves{getInteractionBreakdownSortArrow("saves")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {interactionBreakdownRows.length === 0 ? (
                  <tr>
                    <td className="analytics-empty-row" colSpan="6">
                      No interaction data for this selection.
                    </td>
                  </tr>
                ) : null}
                {interactionBreakdownRows.map(({ label, avatarSrc, initials, summary, engagements }) => {
                  const divisor =
                    interactionBreakdownMode === "averages" ? summary.postCount || 1 : 1;

                  return (
                    <tr
                      className={selectedAnalysisTab === label ? "analytics-row-selected" : ""}
                      key={label}
                      onClick={() =>
                        setSelectedAnalysisTab((currentTab) =>
                          currentTab === label ? "Everything" : label
                        )
                      }
                    >
                      <td>
                        <button
                          type="button"
                          className="analytics-row-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedAnalysisTab((currentTab) =>
                              currentTab === label ? "Everything" : label
                            );
                          }}
                        >
                          <span className="analytics-content-avatar" aria-hidden="true">
                            {avatarSrc ? (
                              <img src={avatarSrc} alt="" />
                            ) : (
                              initials
                            )}
                          </span>
                          <span>{label}</span>
                        </button>
                        {interactionBreakdownMode === "averages" ? (
                          <span className="analytics-row-note">
                            {summary.postCount} post{summary.postCount === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </td>
                      <td>{formatNumber(Math.round(engagements / divisor))}</td>
                      <td>{formatNumber(Math.round(summary.likes / divisor))}</td>
                      <td>{formatNumber(Math.round(summary.comments / divisor))}</td>
                      <td>{formatNumber(Math.round(summary.reshares / divisor))}</td>
                      <td>{formatNumber(Math.round(summary.saves / divisor))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="analytics-breakdown-card">
        <div className="analytics-card-header">
          <strong>Monthly Performance Breakdown</strong>
          <span>{contextLabel} · {selectedMetricOption.label}</span>
          <div className="analytics-icon-buttons">
            <button
              type="button"
              onClick={() => {
                setSelectedAnalysisMonth("all");
                setSelectedMetric("views");
                setMonthlyBreakdownSort({ key: "month", direction: "asc" });
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="analytics-icon-button"
              aria-label="Instagram selected"
              onClick={() => setSelectedAnalysisTab("Everything")}
            >
              <img src="/Instagram.svg" alt="" />
            </button>
          </div>
        </div>
        <table className="analytics-table analytics-breakdown-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className={selectedMetric === "views" ? "analytics-column-active" : ""}>
                <button type="button" onClick={() => handleMonthlyBreakdownSort("views")}>
                  Views{getMonthlyBreakdownSortArrow("views")}
                </button>
              </th>
              <th className={selectedMetric === "reach" ? "analytics-column-active" : ""}>
                <button type="button" onClick={() => handleMonthlyBreakdownSort("reach")}>
                  Reach{getMonthlyBreakdownSortArrow("reach")}
                </button>
              </th>
              <th className={selectedMetric === "interactions" ? "analytics-column-active" : ""}>
                <button type="button" onClick={() => handleMonthlyBreakdownSort("interactions")}>
                  Interactions{getMonthlyBreakdownSortArrow("interactions")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => handleMonthlyBreakdownSort("posts")}>
                  Posts{getMonthlyBreakdownSortArrow("posts")}
                </button>
              </th>
              <th className={selectedMetric === "shares" ? "analytics-column-active" : ""}>
                <button type="button" onClick={() => handleMonthlyBreakdownSort("shares")}>
                  Shares{getMonthlyBreakdownSortArrow("shares")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMonthlyRows.map(({ label, summary }) => {
              const divisor = getSummaryDivisor(summary, "totals");
              const interactions = getSummaryEngagements(summary);

              return (
                <tr key={label}>
                  <td><span className="analytics-dot" /> {label} {selectedAnalysisYear}</td>
                  <td className={selectedMetric === "views" ? "analytics-column-active" : ""}>
                    {formatNumber(Math.round(summary.views / divisor))}
                  </td>
                  <td className={selectedMetric === "reach" ? "analytics-column-active" : ""}>
                    {formatNumber(Math.round(summary.reach / divisor))}
                  </td>
                  <td className={selectedMetric === "interactions" ? "analytics-column-active" : ""}>
                    {formatNumber(Math.round(interactions / divisor))}
                  </td>
                  <td>{formatNumber(summary.postCount)}</td>
                  <td className={selectedMetric === "shares" ? "analytics-column-active" : ""}>
                    {formatNumber(Math.round(summary.reshares / divisor))}
                  </td>
                </tr>
              );
            })}
            <tr className="analytics-total-row">
              <td>Total</td>
              <td>{formatNumber(selectedPeriodSummary.views)}</td>
              <td>{formatNumber(selectedPeriodSummary.reach)}</td>
              <td>{formatNumber(selectedEngagements)}</td>
              <td>{formatNumber(selectedPeriodSummary.postCount)}</td>
              <td>{formatNumber(selectedPeriodSummary.reshares)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}

function App() {
  const { reels, loading, refreshing, error } = useReelsData();
  const {
    reels: instagramRows,
    loading: instagramLoading,
    refreshing: instagramRefreshing,
    error: instagramError,
  } = useInstagramData();
  const metaAdsData = useMetaAdsData();
  const metaAdsLeadsData = useMetaAdsManualLeads();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentGroups] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(CONTENT_GROUP_STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  });
  const [sortKey, setSortKey] = useState("score");
  const [ascending, setAscending] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [activeClip, setActiveClip] = useState(null);

  const yearFilteredReels = useMemo(
    () => reels.filter((reel) => isPublishedInYear(reel, DISPLAY_YEAR)),
    [reels]
  );

  const monthOptions = useMemo(
    () => buildMonthOptions(yearFilteredReels),
    [yearFilteredReels]
  );

  const monthFilteredReels = useMemo(
    () =>
      selectedMonth === "all"
        ? yearFilteredReels
        : yearFilteredReels.filter((reel) => getMonthKey(reel) === selectedMonth),
    [yearFilteredReels, selectedMonth]
  );

  const contributors = useMemo(
    () =>
      [...new Set(monthFilteredReels.map((reel) => reel.name).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [monthFilteredReels]
  );

  const filteredReels = useMemo(
    () =>
      selectedContributor === "all"
        ? monthFilteredReels
        : monthFilteredReels.filter((reel) => reel.name === selectedContributor),
    [monthFilteredReels, selectedContributor]
  );

  const displayMonthReels = useMemo(
    () => monthFilteredReels.map((reel) => applyPlatformMetrics(reel, selectedPlatforms)),
    [monthFilteredReels, selectedPlatforms]
  );

  const displayFilteredReels = useMemo(
    () => filteredReels.map((reel) => applyPlatformMetrics(reel, selectedPlatforms)),
    [filteredReels, selectedPlatforms]
  );

  const tableReels = useMemo(
    () => displayFilteredReels.filter(isInstagramReel),
    [displayFilteredReels]
  );

  const sortedReels = useMemo(
    () => sortReels(tableReels, sortKey, ascending),
    [tableReels, sortKey, ascending]
  );

  const monthLeaders = useMemo(
    () => buildContributorLeaders(displayMonthReels.filter(isInstagramReel)),
    [displayMonthReels]
  );
  const totals = useMemo(() => calculateTotals(displayFilteredReels), [displayFilteredReels]);
  const overallTotals = useMemo(
    () => calculateTotals(displayMonthReels),
    [displayMonthReels]
  );
  const topPerformer = sortedReels[0];
  const monthLeader = monthLeaders[0];
  const selectedPlatformLabels = PLATFORM_OPTIONS.filter((platform) =>
    selectedPlatforms.includes(platform.value)
  ).map((platform) => platform.label);
  const selectedPlatformLabel =
    selectedPlatformLabels.length === 0
      ? "Total"
      : selectedPlatformLabels.length === 1
        ? selectedPlatformLabels[0]
        : "Multi-platform";
  const platformCopy =
    selectedPlatformLabels.length === 0
      ? "all platforms"
      : selectedPlatformLabels.join(" + ");
  const activeClipPresentation = activeClip
    ? getClipPresentation(activeClip.clipUrl)
    : null;
  const selectedMonthLabel =
    selectedMonth === "all" ? "All months" : formatMonthKey(selectedMonth);
  const activeLoading =
    activeTab === "socials" ? loading : activeTab === "new-page" ? instagramLoading : false;
  const activeRefreshing =
    activeTab === "dashboard"
      ? refreshing || instagramRefreshing || metaAdsData.refreshing || metaAdsLeadsData.refreshing
      : activeTab === "socials"
        ? refreshing
        : activeTab === "new-page"
          ? instagramRefreshing
          : false;
  const activeError =
    activeTab === "socials" ? error : activeTab === "new-page" ? instagramError : "";

  useEffect(() => {
    window.localStorage.setItem(
      CONTENT_GROUP_STORAGE_KEY,
      JSON.stringify(contentGroups)
    );
  }, [contentGroups]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setAscending((currentValue) => !currentValue);
      return;
    }

    setSortKey(key);
    setAscending(false);
  };

  const sortArrow = (key) => {
    if (sortKey !== key) return "↕";
    return ascending ? "↑" : "↓";
  };

  if (activeLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-grid" aria-hidden="true" />
      <div className="dashboard-glow dashboard-glow-one" />
      <div className="dashboard-glow dashboard-glow-two" />

      <div className="dashboard-layout">
        <SideTabBar
          activeTab={activeTab}
          isOpen={sidebarOpen}
          onSelectTab={(tabId) => {
            setActiveTab(tabId);
            setSidebarOpen(false);
          }}
          onToggle={() => setSidebarOpen((currentValue) => !currentValue)}
        />

        <div className="dashboard-content dashboard-content-analytics">
          {activeRefreshing ? (
            <div className="dashboard-refreshing-pill" role="status" aria-live="polite">
              <span aria-hidden="true" />
              Refreshing...
            </div>
          ) : null}

          {activeError ? (
            <div className="dashboard-shell dashboard-alert-shell">
              <div className="dashboard-warning" role="alert">
                {activeError} Check that the published Google Sheets CSV is still available.
              </div>
            </div>
          ) : null}

          {activeTab === "dashboard" ? (
            <DashboardOverview
              socialsRows={yearFilteredReels}
              instagramRows={instagramRows}
              metaAdsData={metaAdsData}
              metaAdsLeadsData={metaAdsLeadsData}
              formatNumber={formatNumber}
              onOpenTab={setActiveTab}
            />
          ) : activeTab === "socials" ? (
            <main className="dashboard-shell socials-reporting-shell">
        <section className="analytics-hero-panel socials-hero-panel">
          <div className="analytics-hero-copy">
            <span className="analytics-kicker">Social media analytics</span>
            <div className="analytics-title-row">
              <h2>Socials Reporting</h2>
            </div>
            <p>
              Performance leaderboard across Premier Data social channels.
            </p>
          </div>

          <div className="socials-platform-card">
            <div className="platform-tabs socials-platform-tabs" aria-label="Social platform filters">
              {PLATFORM_OPTIONS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.value);

                return (
                  <button
                    key={platform.value}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={platform.label}
                    title={platform.label}
                    className={`platform-tab platform-tab-${platform.value} ${
                      isSelected ? "platform-tab-active" : ""
                    }`}
                    onClick={() => {
                      setSelectedPlatforms((currentPlatforms) =>
                        currentPlatforms.includes(platform.value)
                          ? currentPlatforms.filter(
                              (platformValue) => platformValue !== platform.value
                            )
                          : [...currentPlatforms, platform.value]
                      );
                      setAscending(false);
                    }}
                  >
                    <span className="platform-tab-icon-wrap" aria-hidden="true">
                      <img
                        className="platform-tab-icon"
                        src={platform.icon}
                        alt=""
                      />
                    </span>
                    <span className="platform-tab-label">{platform.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <DashboardHero
          totals={overallTotals}
          platformLabel={selectedPlatformLabel}
          formatNumber={formatNumber}
        />

        <section className="leaderboard-stage">
          <div className="leaderboard-stage-top">
            <div className="leaderboard-stage-copy">
              <div className="section-kicker">Performance ranking</div>
              <h2 className="leaderboard-heading">Live leaderboard</h2>
              <p className="leaderboard-subheading">
                {selectedContributor === "all"
                  ? `Momentum rankings for ${selectedMonthLabel.toLowerCase()} across ${platformCopy}.`
                  : `${selectedContributor} performance for ${selectedMonthLabel.toLowerCase()} on ${platformCopy}.`}
              </p>
            </div>

            <div className="leaderboard-stage-actions">
              <div className="leaderboard-status-pill">
                <span className="status-dot" aria-hidden="true" />
                {tableReels.length} reels
              </div>

              {selectedContributor !== "all" ? (
                <button
                  type="button"
                  className="home-button"
                  onClick={() => setSelectedContributor("all")}
                >
                  Back to leaderboard
                </button>
              ) : null}

              <label className="filter-control">
                <span className="filter-label">Coder</span>
                <select
                  className="filter-select"
                  value={selectedContributor}
                  onChange={(event) => setSelectedContributor(event.target.value)}
                >
                  <option value="all">All coders</option>
                  {contributors.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-control">
                <span className="filter-label">Date</span>
                <select
                  className="filter-select filter-select-date"
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value);
                    setSelectedContributor("all");
                  }}
                >
                  <option value="all">All months</option>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {selectedContributor !== "all" ? (
            <ContributorSummary
              selectedContributor={selectedContributor}
              filteredReels={filteredReels}
              totals={totals}
              topPerformer={topPerformer}
              platformLabel={selectedPlatformLabel}
              formatNumber={formatNumber}
              getMomentumScore={getMomentumScore}
            />
          ) : null}

          {selectedContributor === "all" && monthLeader ? (
            <section className="month-leader-card">
              <div className="month-leader-copy">
                <div className="section-kicker">
                  {selectedMonth === "all" ? "Overall leader" : `${selectedMonthLabel} leader`}
                </div>
                <div className="month-leader-name">{monthLeader.name}</div>
                <p className="month-leader-text">
                  {monthLeader.reelCount} reel{monthLeader.reelCount === 1 ? "" : "s"} tracked
                  with {formatNumber(monthLeader.totals.views)} {selectedPlatformLabel.toLowerCase()} views and a {formatNumber(Math.round(monthLeader.score))} momentum score.
                </p>
              </div>

              <div className="month-leader-stats">
                <div className="month-leader-stat">
                  <span>Momentum</span>
                  <strong>{formatNumber(Math.round(monthLeader.score))}</strong>
                </div>
                <div className="month-leader-stat">
                  <span>Views</span>
                  <strong>{formatNumber(monthLeader.totals.views)}</strong>
                </div>
                <div className="month-leader-stat">
                  <span>Top reel</span>
                  <strong>{monthLeader.topReel?.reelName || "-"}</strong>
                </div>
              </div>
            </section>
          ) : null}

          <div className="leaderboard-table-frame">
            <LeaderboardTable
              sortedReels={sortedReels}
              sortArrow={sortArrow}
              handleSort={handleSort}
              selectedContributor={selectedContributor}
              setSelectedContributor={setSelectedContributor}
              setActiveClip={setActiveClip}
              platformLabel={selectedPlatformLabel}
              formatNumber={formatNumber}
              getMomentumScore={getMomentumScore}
            />
          </div>
        </section>
            </main>
          ) : activeTab === "meta-ads" ? (
            <MetaAdsReportingPage
              metaAdsData={metaAdsData}
              metaAdsLeadsData={metaAdsLeadsData}
            />
          ) : (
            <InstagramContentPage
              reels={instagramRows}
              contentGroups={contentGroups}
              formatNumber={formatNumber}
              getMomentumScore={getMomentumScore}
            />
          )}
        </div>
      </div>

      <ClipModal
        activeClip={activeClip}
        activeClipPresentation={activeClipPresentation}
        onClose={() => setActiveClip(null)}
      />
    </div>
  );
}

export default App;
