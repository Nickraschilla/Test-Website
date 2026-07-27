export const BASE_INSTAGRAM_ANALYSIS_TABS = [
  "Everything",
  "Cench Ex-AFL",
  "Baseline",
  "Cench",
  "Best Performers",
  "Sacamanos",
  "The Local",
  "Individual Spotlight",
  "Metricon Sponsor",
  "200 Plus",
];

export const normalizeContentTypeLabel = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const CONTENT_TYPE_DISPLAY_LABELS = {
  reel: "Reels",
  reels: "Reels",
  local: "The Local",
  thelocal: "The Local",
  kickingconsultant: "The Kicking Consultant",
  thekickingconsultant: "The Kicking Consultant",
  tkc: "The Kicking Consultant",
};

export const getContentTypeDisplayLabel = (label) =>
  CONTENT_TYPE_DISPLAY_LABELS[normalizeContentTypeLabel(label)] || String(label || "").trim();

const EXCLUDED_CONTENT_TOTAL_LABELS = new Set(["post", "carousel"]);

export const shouldShowContentTotalLabel = (label) =>
  !EXCLUDED_CONTENT_TOTAL_LABELS.has(normalizeContentTypeLabel(label));

const CONTENT_TYPE_PROFILES = [
  {
    labels: ["Cench", "Cench Ex-AFL", "Ex-AFL Cench"],
    avatar: "/Cench.jpg",
    themeClass: "analytics-follower-count-cench",
  },
  {
    labels: ["Baseline"],
    avatar: "/Baseline.jpg",
    themeClass: "analytics-follower-count-baseline",
  },
  {
    labels: ["Sacamano", "Sacamanos"],
    avatar: "/Sacamano.png",
    themeClass: "analytics-follower-count-sacamano",
  },
  {
    labels: ["Ball magnets", "Ball Magnets"],
    avatar: "/Ball magnets.jpg",
    themeClass: "analytics-follower-count-ball-magnets",
  },
  {
    labels: ["Marmalade", "Marmalde"],
    avatar: "/Marmalade.jpg",
    themeClass: "analytics-follower-count-marmalade",
  },
  {
    labels: ["Big Hat Winner"],
    avatar: "/Big Hat.jpg",
    themeClass: "analytics-follower-count-big-hat",
  },
  {
    labels: ["Local", "The Local"],
    avatar: "/The Local.jpg",
    themeClass: "analytics-follower-count-local",
  },
  {
    labels: ["Prime Train", "Prime train"],
    avatar: "/Prime Train.jpg",
    themeClass: "analytics-follower-count-prime-train",
  },
  {
    labels: ["Shepmates", "Shepmate"],
    avatar: "/Shepmates.webp",
    themeClass: "analytics-follower-count-shepmates",
  },
  {
    labels: ["Individual Spotlight", "Spotlight"],
    avatar: "/Spotlight.png",
    themeClass: "analytics-follower-count-spotlight",
  },
  {
    labels: ["Metricon Sponsor", "Metricon"],
    avatar: "/MetriconLogo.avif",
    themeClass: "analytics-follower-count-metricon",
  },
  {
    labels: ["Best Performers"],
    avatar: "/BP.png",
    themeClass: "analytics-follower-count-best-performers",
  },
  {
    labels: ["200 Plus", "200+", "Two Hundred Plus"],
    avatar: "/200 Plus.jpeg",
    themeClass: "analytics-follower-count-200-plus",
  },
  {
    labels: ["The Kicking Consultant", "Kicking Consultant", "TKC"],
    avatar: "/TKC.png",
    themeClass: "analytics-follower-count-tkc",
  },
];

const CONTENT_TYPE_PROFILE_ALIASES = CONTENT_TYPE_PROFILES.reduce((aliases, profile) => {
  profile.labels.forEach((label) => {
    aliases[normalizeContentTypeLabel(label)] = profile;
  });
  return aliases;
}, {});

export const getContentTypeAvatar = (label) =>
  CONTENT_TYPE_PROFILE_ALIASES[normalizeContentTypeLabel(label)]?.avatar || "";

export const getContentTypeThemeClass = (label) =>
  CONTENT_TYPE_PROFILE_ALIASES[normalizeContentTypeLabel(label)]?.themeClass || "";
