export const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v", ".ogg"];

export const toNumber = (value) =>
  Number(String(value || "").replace(/,/g, "")) || 0;

export const getImpactScore = (reel) =>
  reel.views * 0.05 +
  reel.likes +
  reel.comments * 3 +
  reel.reshares * 5 +
  reel.saves * 4;

export const formatNumber = (value) => Number(value || 0).toLocaleString();

export const parseReelDate = (reel) => {
  const rawDate =
    reel.publishedAt ||
    reel.postDate ||
    reel.date ||
    reel.timestamp ||
    reel.lastSyncedAt ||
    "";

  if (!rawDate) return null;

  const parsedDate = new Date(rawDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const getMonthKey = (reel) => {
  const date = parseReelDate(reel);
  if (!date) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const isPublishedInYear = (reel, year) => {
  const date = parseReelDate(reel);
  return date ? date.getFullYear() === year : false;
};

export const formatMonthKey = (monthKey) => {
  if (!monthKey) return "";

  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;

  return new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

export const buildMonthOptions = (reels) =>
  [...new Set(reels.map(getMonthKey).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({
      value,
      label: formatMonthKey(value),
    }));

export const isInstagramReel = (reel) => {
  const clipUrl = String(reel.clipUrl || "").toLowerCase();
  return clipUrl.includes("instagram.com/reel/");
};

export const buildSortValueMap = () => ({
  score: (reel) => getImpactScore(reel),
});

export const sortReels = (reels, sortKey, ascending) => {
  const keyMap = buildSortValueMap();

  return [...reels].sort((a, b) => {
    const getValue = (reel) => {
      if (keyMap[sortKey]) {
        return keyMap[sortKey](reel);
      }

      return reel[sortKey];
    };

    const valueA = getValue(a);
    const valueB = getValue(b);

    if (typeof valueA === "string") {
      return ascending
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return ascending ? valueA - valueB : valueB - valueA;
  });
};

export const calculateTotals = (reels) => ({
  views: reels.reduce((sum, reel) => sum + reel.views, 0),
  likes: reels.reduce((sum, reel) => sum + reel.likes, 0),
  comments: reels.reduce((sum, reel) => sum + reel.comments, 0),
  reshares: reels.reduce((sum, reel) => sum + reel.reshares, 0),
  saves: reels.reduce((sum, reel) => sum + reel.saves, 0),
});

export const getClipPresentation = (url) => {
  if (!url) return null;

  const trimmedUrl = String(url).trim();
  const lowerUrl = trimmedUrl.toLowerCase();

  if (DIRECT_VIDEO_EXTENSIONS.some((extension) => lowerUrl.includes(extension))) {
    return { type: "video", src: trimmedUrl };
  }

  const instagramMatch = trimmedUrl.match(
    /instagram\.com\/(reel|p|tv)\/([^/?#]+)/
  );
  if (instagramMatch) {
    const [, kind, id] = instagramMatch;
    return {
      type: "iframe",
      src: `https://www.instagram.com/${kind}/${id}/embed`,
    };
  }

  const driveMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return {
      type: "drive",
      src: `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`,
      fallbackSrc: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
    };
  }

  return { type: "iframe", src: trimmedUrl };
};
