import { formatMetricValue } from "../../utils/metaAdsAnalytics";

const sortOptions = [
  { key: "leads", label: "Leads" },
  { key: "costPerLead", label: "CPL" },
  { key: "amountSpent", label: "Spend" },
  { key: "clickThroughRate", label: "CTR" },
];

export function MetaAdsCreativePerformance({ rows, sortKey, onSortKeyChange }) {
  return (
    <section className="analytics-table-card meta-ads-table-card">
      <div className="analytics-card-header">
        <strong>Creative Performance</strong>
        <label className="analytics-inline-select">
          Sort
          <select value={sortKey} onChange={(event) => onSortKeyChange(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-ads-creative-table">
          <thead>
            <tr>
              <th>Creative</th>
              <th>Campaign</th>
              <th>Platform</th>
              <th>Spend</th>
              <th>Impressions</th>
              <th>Link Clicks</th>
              <th>CTR</th>
              <th>Leads</th>
              <th>CPL</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="analytics-empty-row" colSpan="9">
                  No creative results for this selection.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={`${row.adId}-${row.platform}`}>
                <td>
                  <span className="meta-ads-creative-cell">
                    <img src={row.creativeUrl} alt="" />
                    <span>{row.adName}</span>
                  </span>
                </td>
                <td>{row.campaignName}</td>
                <td>{row.platform}</td>
                <td>{formatMetricValue(row.amountSpent, "currency")}</td>
                <td>{formatMetricValue(row.impressions)}</td>
                <td>{formatMetricValue(row.linkClicks)}</td>
                <td>{formatMetricValue(row.clickThroughRate, "percent")}</td>
                <td>{formatMetricValue(row.leads)}</td>
                <td>{formatMetricValue(row.costPerLead, "currency")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
