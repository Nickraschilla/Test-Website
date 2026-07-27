import { formatMetricValue } from "../../../utils/metaAdsAnalytics";

export function CampaignBenchmarkTable({ comparison }) {
  return (
    <section className="analytics-table-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Campaign comparison</strong>
        <span>{comparison.reason}</span>
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-campaign-comparison-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Selected campaign</th>
              <th>Comparable average</th>
              <th>Best comparable</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{formatMetricValue(row.selectedValue, row.format)}</td>
                <td>{formatMetricValue(row.averageValue, row.format)}</td>
                <td>
                  {row.bestCampaign ? (
                    <>
                      {formatMetricValue(row.bestValue, row.format)}
                      <span className="analytics-row-note">{row.bestCampaign.campaignName}</span>
                    </>
                  ) : "—"}
                </td>
                <td>{row.selectedRank ? `${row.selectedRank} of ${row.totalRanked}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
