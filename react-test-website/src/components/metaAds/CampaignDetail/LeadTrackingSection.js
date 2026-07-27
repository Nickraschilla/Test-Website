import { useCallback, useEffect, useState } from "react";
import {
  buildManualLeadSummary,
  LEAD_STATUSES,
  metaLeadRepository,
} from "../../../services/metaLeadRepository";
import { formatMetricValue } from "../../../utils/metaAdsAnalytics";

const emptyLead = {
  name: "",
  dateReceived: "",
  status: "New",
  notes: "",
};

function LeadSummary({ leads, amountSpent }) {
  const summary = buildManualLeadSummary(leads, amountSpent || 0);
  const items = [
    ["Total manual leads", summary.total],
    ["New", summary.newCount],
    ["Contacted", summary.contacted],
    ["Converted", summary.converted],
    ["Failed", summary.failed],
    ["Contact rate", summary.contactRate],
    ["Conversion rate", summary.conversionRate],
    ["Cost per converted lead", summary.costPerConvertedLead],
  ];

  return (
    <div className="meta-lead-summary-grid">
      {items.map(([label, value]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>
            {label.includes("rate")
              ? formatMetricValue(value, "percent")
              : label.includes("Cost")
                ? formatMetricValue(value, "currency")
                : formatMetricValue(value)}
          </strong>
        </article>
      ))}
    </div>
  );
}

function LeadForm({ onSubmit, editingLead, onCancel }) {
  const [form, setForm] = useState(emptyLead);

  useEffect(() => {
    setForm(editingLead || emptyLead);
  }, [editingLead]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="meta-lead-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
        setForm(emptyLead);
      }}
    >
      <label>
        <span>Name</span>
        <input
          value={form.name}
          maxLength={80}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Lead name"
          required
        />
      </label>
      <label>
        <span>Date received</span>
        <input
          type="date"
          value={form.dateReceived}
          onChange={(event) => updateField("dateReceived", event.target.value)}
        />
      </label>
      <label>
        <span>Status</span>
        <select
          value={form.status}
          onChange={(event) => updateField("status", event.target.value)}
        >
          {LEAD_STATUSES.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Notes</span>
        <input
          value={form.notes}
          maxLength={160}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Short note"
        />
      </label>
      <div className="meta-lead-form-actions">
        <button type="submit">{editingLead ? "Save lead" : "Add lead"}</button>
        {editingLead ? (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function LeadTable({ leads, onEdit, onDelete, onStatusChange }) {
  if (leads.length === 0) {
    return <p className="meta-ads-empty-copy">No manually entered leads for this campaign yet.</p>;
  }

  return (
    <div className="analytics-table-scroll">
      <table className="analytics-table meta-lead-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date received</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Last updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.name || "—"}</td>
              <td>{lead.dateReceived || "—"}</td>
              <td>
                <select
                  value={lead.status}
                  onChange={(event) => onStatusChange(lead.id, event.target.value)}
                >
                  {LEAD_STATUSES.map((status) => (
                    <option value={status} key={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td>{lead.notes || "—"}</td>
              <td>{lead.lastUpdated ? new Date(lead.lastUpdated).toLocaleDateString("en-AU") : "—"}</td>
              <td>
                <div className="meta-lead-actions">
                  <button type="button" onClick={() => onEdit(lead)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => onDelete(lead.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadTrackingSection({ campaignId, amountSpent }) {
  const [leads, setLeads] = useState([]);
  const [editingLead, setEditingLead] = useState(null);

  const reloadLeads = useCallback(() => {
    setLeads(metaLeadRepository.getLeadsByCampaign(campaignId));
  }, [campaignId]);

  useEffect(() => {
    reloadLeads();
    setEditingLead(null);
  }, [campaignId, reloadLeads]);

  const saveLead = (lead) => {
    if (editingLead) {
      metaLeadRepository.updateLead(editingLead.id, lead);
    } else {
      metaLeadRepository.createLead({ ...lead, campaignId });
    }
    setEditingLead(null);
    reloadLeads();
  };

  return (
    <section className="analytics-table-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Lead Tracking</strong>
        <span>Manual browser storage</span>
      </div>
      <p className="meta-lead-storage-note">
        Manual lead records stay in this browser only and are not written to the public Meta Ads CSV.
      </p>
      <LeadSummary leads={leads} amountSpent={amountSpent} />
      <LeadForm
        editingLead={editingLead}
        onSubmit={saveLead}
        onCancel={() => setEditingLead(null)}
      />
      <LeadTable
        leads={leads}
        onEdit={setEditingLead}
        onDelete={(leadId) => {
          metaLeadRepository.deleteLead(leadId);
          reloadLeads();
        }}
        onStatusChange={(leadId, status) => {
          metaLeadRepository.updateLead(leadId, { status });
          reloadLeads();
        }}
      />
    </section>
  );
}
