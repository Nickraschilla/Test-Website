import { useMemo, useState } from "react";
import {
  formatDateLabel,
  formatMetricValue,
  getCampaignIdentity,
  sortRows,
} from "../../../utils/metaAdsAnalytics";

const columns = [
  { key: "campaignName", label: "Campaign" },
  { key: "reportingStarts", label: "Date" },
  { key: "campaignDelivery", label: "Status" },
  { key: "amountSpent", label: "Spend", format: "currency", numeric: true },
  { key: "results", label: "Leads", numeric: true },
  { key: "costPerResult", label: "Cost / lead", format: "currency", numeric: true },
  { key: "leadsPer100", label: "Leads / $100", format: "decimal", numeric: true },
  { key: "reach", label: "Reach", format: "number", numeric: true },
];

export function CampaignLeaderboard({ rows, selectedCampaignId, onSelectCampaign }) {
  const [sort, setSort] = useState({ key: "results", direction: "desc" });
  const sortedRows = useMemo(
    () => sortRows(rows, sort.key, sort.direction),
    [rows, sort]
  );

  const sortArrow = (key) => {
    if (sort.key !== key) return "";
    return sort.direction === "asc" ? " ↑" : " ↓";
  };

  const changeSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  return (
    <section className="analytics-table-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Account campaign leaderboard</strong>
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-campaign-leaderboard-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.numeric || column.key === "campaignName" ? (
                    <button type="button" onClick={() => changeSort(column.key)}>
                      {column.label}{sortArrow(column.key)}
                    </button>
                  ) : column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const campaignId = getCampaignIdentity(row);
              const selected = campaignId === selectedCampaignId;

              return (
                <tr
                  key={campaignId}
                  className={selected ? "meta-ads-campaign-row-selected" : ""}
                  tabIndex="0"
                  aria-selected={selected}
                  onClick={() => onSelectCampaign(campaignId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectCampaign(campaignId);
                    }
                  }}
                >
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.key === "reportingStarts"
                        ? formatDateLabel(row.reportingStarts || row.startDateKey)
                        : column.numeric
                          ? formatMetricValue(row[column.key], column.format)
                          : row[column.key] || "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
