import { useEffect, useMemo, useState } from "react";
import { MetaAdsDailyCampaignTable } from "../components/metaAds/MetaAdsDailyCampaignTable";
import { MetaAdsFilters } from "../components/metaAds/MetaAdsFilters";
import { MetaAdsSelectedCampaignKpis } from "../components/metaAds/MetaAdsSelectedCampaignKpis";
import { useMetaAdsData } from "../hooks/useMetaAdsData";
import {
  aggregateByCampaign,
  buildMetaAdsCampaignOptions,
  buildMetaAdsSummary,
  describeDateWindow,
  filterRowsByCampaign,
  getDefaultMetaAdsCampaignId,
  getCampaignIdentity,
  parseDate,
} from "../utils/metaAdsAnalytics";

const describeRowsPeriod = (rows) => {
  const dates = rows
    .flatMap((row) => [row.reportingStarts || row.date, row.reportingEnds])
    .map(parseDate)
    .filter(Boolean)
    .sort((first, second) => first - second);

  if (dates.length === 0) return "No reporting dates";

  return describeDateWindow({
    startDate: dates[0],
    endDate: dates.at(-1),
  });
};

export function MetaAdsReportingPage() {
  const { rows, loading, refreshing, error, usingFallback } = useMetaAdsData();
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const campaignOptions = useMemo(
    () => buildMetaAdsCampaignOptions(rows),
    [rows]
  );
  const selectedCampaign = useMemo(
    () =>
      aggregateByCampaign(rows).find(
        (campaign) => getCampaignIdentity(campaign) === selectedCampaignId
      ) || null,
    [rows, selectedCampaignId]
  );
  const selectedRows = useMemo(
    () => (selectedCampaign ? filterRowsByCampaign(rows, selectedCampaign) : []),
    [rows, selectedCampaign]
  );
  const selectedSummary = useMemo(
    () => buildMetaAdsSummary(selectedRows),
    [selectedRows]
  );
  const selectedPeriod = useMemo(
    () => describeRowsPeriod(selectedRows),
    [selectedRows]
  );

  useEffect(() => {
    if (rows.length === 0) return;
    const campaignExists = campaignOptions.some((campaign) => campaign.id === selectedCampaignId);
    if (!campaignExists) {
      setSelectedCampaignId(getDefaultMetaAdsCampaignId(rows));
    }
  }, [campaignOptions, rows, selectedCampaignId]);

  return (
    <main className="analytics-shell meta-ads-shell">
      <MetaAdsFilters
        campaigns={campaignOptions}
        selectedCampaignId={selectedCampaignId}
        selectedCampaign={selectedCampaign}
        selectedPeriod={selectedPeriod}
        onSelectCampaign={setSelectedCampaignId}
      />

      {refreshing ? (
        <div className="dashboard-refreshing-pill meta-ads-refreshing" role="status" aria-live="polite">
          <span aria-hidden="true" />
          Refreshing...
        </div>
      ) : null}

      {error ? (
        <div className="dashboard-warning meta-ads-warning" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <section className="analytics-breakdown-card meta-ads-state-card" role="status" aria-live="polite">
          Loading Meta Ads data...
        </section>
      ) : null}

      {!loading && rows.length === 0 ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          No Meta Ads rows are available from the published sheet yet.
        </section>
      ) : null}

      {!loading && usingFallback ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          Development fallback data is currently being displayed.
        </section>
      ) : null}

      {!loading && rows.length > 0 ? (
        <>
          {!selectedCampaign ? (
            <section className="analytics-breakdown-card meta-ads-state-card">
              Select a campaign to view Meta Ads performance.
            </section>
          ) : (
            <>
              <MetaAdsSelectedCampaignKpis summary={selectedSummary} />
              <MetaAdsDailyCampaignTable rows={selectedRows} />
            </>
          )}
        </>
      ) : null}
    </main>
  );
}
