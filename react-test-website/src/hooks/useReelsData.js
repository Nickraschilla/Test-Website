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

          const rows = results.data.slice(1);
          const cleaned = rows.map((row) => ({
            name: row[0] || "",
            reelName: row[1] || "",
            clipUrl: row[2] || "",
            igMediaId: row[3] || "",
            views: toNumber(row[4]),
            likes: toNumber(row[5]),
            comments: toNumber(row[6]),
            reshares: toNumber(row[7]),
            saves: toNumber(row[8]),
            lastSyncedAt: row[9] || "",
          }));

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
