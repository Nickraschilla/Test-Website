import { startTransition, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { parseMetaAdsLeadSheetResults } from "../utils/metaAdsLeadSheetParser";

const META_ADS_LEADS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKyQK4e7j5RzWKVaRuyiMG6lw4zwsvE_Klrohk_xf1sUKUOHzLLojyCk2TLgAESkWkN87PZUHfE6Rb/pub?gid=522703377&single=true&output=csv";
const META_ADS_LEADS_LOAD_ERROR = "Could not load Meta Ads lead pipeline data.";

export function useMetaAdsManualLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);
  const hasLiveRowsRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    const loadSheet = () => {
      if (hasLoadedRef.current) setRefreshing(true);

      const separator = META_ADS_LEADS_SHEET_URL.includes("?") ? "&" : "?";
      const cacheBustedSheetUrl = `${META_ADS_LEADS_SHEET_URL}${separator}refresh=${Date.now()}`;

      Papa.parse(cacheBustedSheetUrl, {
        download: true,
        header: false,
        skipEmptyLines: false,
        complete: (results) => {
          if (!isActive) return;

          if (results.errors?.length) {
            console.error("Meta Ads lead sheet parse errors:", results.errors);
            startTransition(() => {
              if (!hasLiveRowsRef.current) setLeads([]);
              setError(META_ADS_LEADS_LOAD_ERROR);
              hasLoadedRef.current = true;
              setLoading(false);
              setRefreshing(false);
            });
            return;
          }

          const parsedLeads = parseMetaAdsLeadSheetResults(results);

          startTransition(() => {
            setLeads(parsedLeads);
            setError("");
            hasLiveRowsRef.current = true;
            hasLoadedRef.current = true;
            setLoading(false);
            setRefreshing(false);
          });
        },
        error: (fetchError) => {
          if (!isActive) return;
          console.error("Meta Ads lead sheet download error:", fetchError);
          startTransition(() => {
            if (!hasLiveRowsRef.current) setLeads([]);
            setError(META_ADS_LEADS_LOAD_ERROR);
            hasLoadedRef.current = true;
            setLoading(false);
            setRefreshing(false);
          });
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadSheet();
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
    leads,
    loading,
    refreshing,
    error,
  };
}
