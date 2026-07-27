import { startTransition, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { metaAdsFixtures } from "../data/metaAdsFixtures";
import { parseMetaAdsSheetResults } from "../utils/metaAdsSheetParser";

const META_ADS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKyQK4e7j5RzWKVaRuyiMG6lw4zwsvE_Klrohk_xf1sUKUOHzLLojyCk2TLgAESkWkN87PZUHfE6Rb/pub?gid=381178904&single=true&output=csv";

const normaliseFixtureRow = (row, index) => {
  const results = Number(row.results ?? row.leads ?? 0);
  const amountSpent = Number(row.amountSpent ?? 0);

  return {
    ...row,
    id: row.id || `${row.campaignId || row.campaignName}-${index}`,
    reportingStarts: row.reportingStarts || row.date,
    reportingEnds: row.reportingEnds || row.date,
    campaignDelivery: row.campaignDelivery || row.campaignStatus || "",
    campaignStatus: row.campaignStatus || row.campaignDelivery || "",
    results,
    resultIndicator: row.resultIndicator || "Meta results",
    costPerResult: row.costPerResult ?? (results ? amountSpent / results : null),
    amountSpent,
    impressions: Number(row.impressions ?? 0),
    reach: Number(row.reach ?? 0),
  };
};

const fallbackRows = metaAdsFixtures.map(normaliseFixtureRow);

export function useMetaAdsData() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    const loadSheet = () => {
      if (hasLoadedRef.current) {
        setRefreshing(true);
      }

      const separator = META_ADS_SHEET_URL.includes("?") ? "&" : "?";
      const cacheBustedSheetUrl = `${META_ADS_SHEET_URL}${separator}refresh=${Date.now()}`;

      Papa.parse(cacheBustedSheetUrl, {
        download: true,
        header: false,
        skipEmptyLines: false,
        complete: (results) => {
          if (!isActive) return;

          if (results.errors?.length) {
            console.error("Meta Ads Papa parse errors:", results.errors);
            startTransition(() => {
              setRows(fallbackRows);
              setError("Could not load Meta Ads Reporting data. Showing development fallback data.");
              setUsingFallback(true);
              hasLoadedRef.current = true;
              setLoading(false);
              setRefreshing(false);
            });
            return;
          }

          const parsedRows = parseMetaAdsSheetResults(results);

          startTransition(() => {
            setRows(parsedRows.length ? parsedRows : []);
            setError("");
            setUsingFallback(false);
            hasLoadedRef.current = true;
            setLoading(false);
            setRefreshing(false);
          });
        },
        error: (fetchError) => {
          if (!isActive) return;
          console.error("Meta Ads Papa download error:", fetchError);
          startTransition(() => {
            setRows(fallbackRows);
            setError("Could not load Meta Ads Reporting data. Showing development fallback data.");
            setUsingFallback(true);
            hasLoadedRef.current = true;
            setLoading(false);
            setRefreshing(false);
          });
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
  }, []);

  return {
    rows,
    loading,
    refreshing,
    error,
    usingFallback,
  };
}
