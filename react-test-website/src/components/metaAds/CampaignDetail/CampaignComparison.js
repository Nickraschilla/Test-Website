import {
  buildComparisonRows,
  formatMetricValue,
  getComparisonClass,
} from "../../../utils/metaAdsAnalytics";

export function CampaignComparison({ currentSummary, previousSummary }) {
  const rows = buildComparisonRows(currentSummary, previousSummary);
  const hasPreviousData = rows.some((row) => row.previousValue !== null && row.previousValue !== undefined);

  return (
    <section className="analytics-table-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Period comparison</strong>
      </div>
      {!hasPreviousData ? (
        <p className="meta-ads-empty-copy">No previous-period data is available for this campaign.</p>
      ) : (
        <div className="analytics-table-scroll">
          <table className="analytics-table meta-campaign-comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Selected period</th>
                <th>Previous period</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>{formatMetricValue(row.currentValue, row.format)}</td>
                  <td>{formatMetricValue(row.previousValue, row.format)}</td>
                  <td className={getComparisonClass(row, row.change)}>
                    {row.change === null ? "—" : `${row.change > 0 ? "+" : ""}${row.change.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
