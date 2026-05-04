import { startTransition, useEffect, useState } from "react";
import Papa from "papaparse";
import { toNumber } from "../utils/reels";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKyQK4e7j5RzWKVaRuyiMG6lw4zwsvE_Klrohk_xf1sUKUOHzLLojyCk2TLgAESkWkN87PZUHfE6Rb/pub?gid=0&single=true&output=csv";

export function useReelsData() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadSheet = () => {
      Papa.parse(SHEET_URL, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (!isActive) return;

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

          const cleaned = rows.map((row) => {
            const igViews = toNumber(getByHeader(row, "igViews", 4));
            const igLikes = toNumber(getByHeader(row, "igLikes", 5));
            const igComments = toNumber(getByHeader(row, "igComments", 6));
            const igShares = toNumber(getByHeader(row, "igShares", 7));
            const fbViews = toNumber(getByHeader(row, "fbViews", 10));
            const fbLikes = toNumber(getByHeader(row, "fbLikes", 11));
            const fbComments = toNumber(getByHeader(row, "fbComments", 12));
            const fbShares = toNumber(getByHeader(row, "fbShares", 13));

            return {
              name: getByHeader(row, "name", 0) || "",
              reelName: getByHeader(row, "reelName", 1) || "",
              clipUrl: getByHeader(row, "clipUrl", 2) || "",
              igMediaId: getByHeader(row, "igMediaId", 3) || "",
              views: toNumber(getByHeader(row, "totalViews", 14)) || igViews,
              likes: toNumber(getByHeader(row, "totalLikes", 15)) || igLikes,
              comments: toNumber(getByHeader(row, "totalComments", 16)) || igComments,
              reshares: toNumber(getByHeader(row, "totalShares", 17)) || igShares,
              saves: toNumber(getByHeader(row, "igSaves", 8)),
              lastSyncedAt: getByHeader(row, "lastSyncedAt", 9) || "",
              igViews,
              igLikes,
              igComments,
              igShares,
              fbViews,
              fbLikes,
              fbComments,
              fbShares,
            };
          });

          startTransition(() => {
            setReels(cleaned);
            setError("");
            setLastUpdated(
              new Date().toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })
            );
            setLoading(false);
          });
        },
        error: (fetchError) => {
          if (!isActive) return;
          console.error("Papa download error:", fetchError);
          setError("Could not load Google Sheets data.");
          setLoading(false);
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadSheet();
      }
    };

    loadSheet();

    const intervalId = window.setInterval(loadSheet, 900000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    reels,
    loading,
    error,
    lastUpdated,
  };
}
