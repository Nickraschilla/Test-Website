import { formatMetricValue } from "../../utils/metaAdsAnalytics";

const columns = [
  { key: "campaignName", label: "Campaign", numeric: false },
  { key: "amountSpent", label: "Spend", format: "currency", numeric: true },
  { key: "leads", label: "Leads", numeric: true },
  { key: "costPerLead", label: "CPL", format: "currency", numeric: true },
  { key: "linkClicks", label: "Link Clicks", numeric: true },
  { key: "clickThroughRate", label: "CTR", format: "percent", numeric: true },
  { key: "costPerClick", label: "CPC", format: "currency", numeric: true },
  { key: "reach", label: "Reach", numeric: true },
  { key: "impressions", label: "Impressions", numeric: true },
];

export function MetaAdsCampaignTable({
  rows,
  search,
  sort,
  onSearch,
  onSort,
}) {
  const sortArrow = (key) => {
    if (sort.key !== key) return "";
    return sort.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <section className="analytics-table-card meta-ads-table-card">
      <div className="analytics-card-header">
        <strong>Campaign Performance</strong>
        <label className="meta-ads-search">
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Campaign name"
          />
        </label>
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-ads-campaign-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.numeric || column.key === "campaignName" ? (
                    <button type="button" onClick={() => onSort(column.key)}>
                      {column.label}{sortArrow(column.key)}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th>Status</th>
              <th>Objective</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="analytics-empty-row" colSpan="11">
                  No campaigns match this selection.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.campaignId}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.key === "campaignName"
                      ? row.campaignName
                      : formatMetricValue(row[column.key], column.format)}
                  </td>
                ))}
                <td>
                  <span className={`meta-ads-status meta-ads-status-${row.campaignStatus.toLowerCase()}`}>
                    {row.campaignStatus}
                  </span>
                </td>
                <td>{row.campaignObjective}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
