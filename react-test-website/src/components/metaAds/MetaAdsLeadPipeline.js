import { useMemo, useState } from "react";
import { MANUAL_LEAD_STATUSES, buildManualLeadSummary } from "../../utils/metaAdsCampaignReview";
import { formatMetricValue } from "../../utils/metaAdsAnalytics";

const defaultForm = {
  name: "",
  dateReceived: new Date().toISOString().slice(0, 10),
  status: "New",
  notes: "",
};

export function MetaAdsLeadPipeline({ campaignId, leads, campaignSpend, onCreateLead, onUpdateLead, onDeleteLead }) {
  const [form, setForm] = useState(defaultForm);
  const campaignLeads = useMemo(
    () => leads.filter((lead) => lead.campaignId === campaignId),
    [campaignId, leads]
  );
  const summary = useMemo(() => buildManualLeadSummary(campaignLeads), [campaignLeads]);
  const costPerConvertedCustomer = summary.convertedCount
    ? campaignSpend / summary.convertedCount
    : null;

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const handleSubmit = (event) => {
    event.preventDefault();
    onCreateLead({ ...form, campaignId });
    setForm(defaultForm);
  };

  return (
    <section className="analytics-breakdown-card meta-ads-lead-section">
      <div className="analytics-card-header">
        <strong>Lead pipeline</strong>
      </div>

      <div className="meta-ads-pipeline-summary">
        {MANUAL_LEAD_STATUSES.map((status) => (
          <div key={status}>
            <span>{status}</span>
            <strong>{summary.counts[status]}</strong>
          </div>
        ))}
      </div>

      <div className="meta-ads-pipeline-metrics">
        <div>
          <span>Contact Rate</span>
          <strong>{formatMetricValue(summary.contactRate, "percent")}</strong>
        </div>
        <div>
          <span>Conversion Rate</span>
          <strong>{formatMetricValue(summary.conversionRate, "percent")}</strong>
        </div>
        <div>
          <span>Cost Per Converted Customer</span>
          <strong>{formatMetricValue(costPerConvertedCustomer, "currency")}</strong>
        </div>
      </div>

      <form className="meta-ads-lead-form" onSubmit={handleSubmit}>
        <input
          aria-label="Lead name"
          value={form.name}
          placeholder="Lead name"
          onChange={(event) => updateForm("name", event.target.value)}
        />
        <input
          aria-label="Date received"
          type="date"
          value={form.dateReceived}
          onChange={(event) => updateForm("dateReceived", event.target.value)}
        />
        <select
          aria-label="Lead status"
          value={form.status}
          onChange={(event) => updateForm("status", event.target.value)}
        >
          {MANUAL_LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <input
          aria-label="Lead notes"
          value={form.notes}
          placeholder="Short notes"
          onChange={(event) => updateForm("notes", event.target.value)}
        />
        <button type="submit">Add Lead</button>
      </form>

      <div className="analytics-table-scroll">
        <table className="analytics-table meta-ads-lead-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaignLeads.length === 0 ? (
              <tr>
                <td className="analytics-empty-row" colSpan="5">No manual leads have been added for this campaign.</td>
              </tr>
            ) : null}
            {campaignLeads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <input
                    aria-label={`Name for ${lead.name}`}
                    value={lead.name}
                    onChange={(event) => onUpdateLead(lead.id, { name: event.target.value })}
                  />
                </td>
                <td>{lead.dateReceived || "—"}</td>
                <td>
                  <select
                    aria-label={`Status for ${lead.name}`}
                    value={lead.status}
                    onChange={(event) => onUpdateLead(lead.id, { status: event.target.value })}
                  >
                    {MANUAL_LEAD_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    aria-label={`Notes for ${lead.name}`}
                    value={lead.notes}
                    onChange={(event) => onUpdateLead(lead.id, { notes: event.target.value })}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => onDeleteLead(lead.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
