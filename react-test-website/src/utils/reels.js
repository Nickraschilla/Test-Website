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
      type: "iframe",
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
    };
  }

  return { type: "iframe", src: trimmedUrl };
};
