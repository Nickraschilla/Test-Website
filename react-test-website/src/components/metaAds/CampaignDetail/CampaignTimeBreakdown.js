import { useMemo, useState } from "react";
import { formatMetricValue } from "../../../utils/metaAdsAnalytics";
import { buildCampaignTimeBreakdownRows } from "../../../utils/metaAdsCampaignReview";

const GROUPINGS = ["Daily", "Monthly", "Yearly"];

const columns = [
  { key: "label", label: "Period" },
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "results", label: "Leads", format: "number" },
  { key: "costPerResult", label: "Cost / lead", format: "currency" },
  { key: "leadsPer100", label: "Leads / $100", format: "decimal" },
  { key: "reach", label: "Reach", format: "number" },
];

export function CampaignTimeBreakdown({ rows }) {
  const [grouping, setGrouping] = useState("Monthly");
  const breakdownRows = useMemo(
    () => buildCampaignTimeBreakdownRows(rows, grouping),
    [grouping, rows]
  );

  return (
    <section className="analytics-table-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Time breakdown</strong>
        <div className="analytics-mode-toggle">
          {GROUPINGS.map((item) => (
            <button
              type="button"
              key={item}
              className={grouping === item ? "active" : ""}
              onClick={() => setGrouping(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-campaign-time-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {breakdownRows.length === 0 ? (
              <tr>
                <td className="analytics-empty-row" colSpan={columns.length}>
                  No campaign rows are available for this period.
                </td>
              </tr>
            ) : null}
            {breakdownRows.map((row) => (
              <tr key={row.key}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.key === "label"
                      ? row.label
                      : formatMetricValue(row[column.key], column.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
