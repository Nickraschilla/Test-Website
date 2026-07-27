import { startTransition, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { toNumber } from "../utils/reels";

const SOCIALS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKyQK4e7j5RzWKVaRuyiMG6lw4zwsvE_Klrohk_xf1sUKUOHzLLojyCk2TLgAESkWkN87PZUHfE6Rb/pub?gid=0&single=true&output=csv";

const INSTAGRAM_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKyQK4e7j5RzWKVaRuyiMG6lw4zwsvE_Klrohk_xf1sUKUOHzLLojyCk2TLgAESkWkN87PZUHfE6Rb/pub?gid=681449072&single=true&output=csv";

const parseSheetResults = (results) => {
  const [rawHeaders = [], ...rows] = results.data;
  const headerMap = rawHeaders.reduce((map, value, index) => {
    const key = String(value || "").trim().toLowerCase();
    if (key) {
      map[key] = index;
    }
    return map;
  }, {});

  const getByHeader = (row, header, fallbackIndex = -1) => {
    const index = headerMap[header.toLowerCase()];
    if (index !== undefined) {
      return row[index];
    }
    return fallbackIndex >= 0 ? row[fallbackIndex] : "";
  };

  return rows.map((row) => {
    const igViews = toNumber(getByHeader(row, "igViews", 4));
    const igLikes = toNumber(getByHeader(row, "igLikes", 5));
    const igComments = toNumber(getByHeader(row, "igComments", 6));
    const igShares = toNumber(getByHeader(row, "igShares", 7));
    const igSaves = toNumber(getByHeader(row, "igSaves", 8));
    const igReach = toNumber(getByHeader(row, "igReach") || getByHeader(row, "reach"));
    const igFollowers = toNumber(
      getByHeader(row, "igFollowers") ||
        getByHeader(row, "followers") ||
        getByHeader(row, "followerCount")
    );
    const fbViews = toNumber(getByHeader(row, "fbViews", 11));
    const fbLikes = toNumber(getByHeader(row, "fbLikes", 12));
    const fbComments = toNumber(getByHeader(row, "fbComments", 13));
    const fbShares = toNumber(getByHeader(row, "fbShares", 14));
    const fbSaves = toNumber(getByHeader(row, "fbSaves"));
    const ttViews = toNumber(getByHeader(row, "ttViews") || getByHeader(row, "tiktokViews"));
    const ttLikes = toNumber(getByHeader(row, "ttLikes") || getByHeader(row, "tiktokLikes"));
    const ttComments = toNumber(getByHeader(row, "ttComments") || getByHeader(row, "tiktokComments"));
    const ttShares = toNumber(getByHeader(row, "ttShares") || getByHeader(row, "tiktokShares"));
    const ttSaves = toNumber(getByHeader(row, "ttSaves") || getByHeader(row, "tiktokSaves"));
    const totalViews = igViews + fbViews + ttViews;
    const totalLikes = igLikes + fbLikes + ttLikes;
    const totalComments = igComments + fbComments + ttComments;
    const totalShares = igShares + fbShares + ttShares;
    const totalSaves = igSaves + fbSaves + ttSaves;

    return {
      name: getByHeader(row, "name", 0) || "",
      reelName: getByHeader(row, "reelName", 1) || "",
      contentTitle:
        getByHeader(row, "contentTitle") ||
        getByHeader(row, "postTitle") ||
        getByHeader(row, "reelName", 1) ||
        "",
      contentGroup: getByHeader(row, "contentGroup") || "",
      contentType: getByHeader(row, "contentType") || "",
      mediaType: getByHeader(row, "mediaType") || "",
      mediaProductType: getByHeader(row, "mediaProductType") || "",
      clipUrl: getByHeader(row, "clipUrl", 2) || getByHeader(row, "permalink") || "",
      igMediaId: getByHeader(row, "igMediaId", 3) || "",
      publishedAt:
        getByHeader(row, "publishedAt") ||
        getByHeader(row, "postDate") ||
        getByHeader(row, "date") ||
        getByHeader(row, "timestamp") ||
        "",
      views: toNumber(getByHeader(row, "totalViews", 21)) || totalViews,
      likes: toNumber(getByHeader(row, "totalLikes", 22)) || totalLikes,
      comments: toNumber(getByHeader(row, "totalComments", 23)) || totalComments,
      reshares: toNumber(getByHeader(row, "totalShares", 24)) || totalShares,
      saves: toNumber(getByHeader(row, "totalSaves", 25)) || totalSaves,
      lastSyncedAt: getByHeader(row, "lastSyncedAt", 9) || "",
      igViews,
      igLikes,
      igComments,
      igShares,
      igSaves,
      igReach,
      igFollowers,
      fbViews,
      fbLikes,
      fbComments,
      fbShares,
      fbSaves,
      ttViews,
      ttLikes,
      ttComments,
      ttShares,
      ttSaves,
    };
  });
};

function useSheetData(sheetUrl, errorMessage) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    const loadSheet = () => {
      if (hasLoadedRef.current) {
        setRefreshing(true);
      }
      const separator = sheetUrl.includes("?") ? "&" : "?";
      const cacheBustedSheetUrl = `${sheetUrl}${separator}refresh=${Date.now()}`;

      Papa.parse(cacheBustedSheetUrl, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (!isActive) return;
          const cleaned = parseSheetResults(results);

          startTransition(() => {
            setReels(cleaned);
            setError("");
            hasLoadedRef.current = true;
            setLoading(false);
            setRefreshing(false);
          });
        },
        error: (fetchError) => {
          if (!isActive) return;
          console.error("Papa download error:", fetchError);
          setError(errorMessage);
          setLoading(false);
          setRefreshing(false);
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadSheet();
      }
    };

    loadSheet();

    const intervalId = window.setInterval(loadSheet, 60000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [errorMessage, sheetUrl]);

  return {
    reels,
    loading,
    refreshing,
    error,
  };
}

export function useReelsData() {
  return useSheetData(SOCIALS_SHEET_URL, "Could not load Socials Reporting data.");
}

export function useInstagramData() {
  return useSheetData(INSTAGRAM_SHEET_URL, "Could not load Instagram Reporting data.");
}
