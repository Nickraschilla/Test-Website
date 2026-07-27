import { MANUAL_LEAD_STATUSES } from "./metaAdsCampaignReview";

export const META_ADS_LEADS_STORAGE_KEY = "premier-data-meta-leads-v1";

const isBrowserStorageAvailable = () =>
  typeof window !== "undefined" && Boolean(window.localStorage);

const readAll = () => {
  if (!isBrowserStorageAvailable()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(META_ADS_LEADS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (leads) => {
  if (!isBrowserStorageAvailable()) return;
  window.localStorage.setItem(META_ADS_LEADS_STORAGE_KEY, JSON.stringify(leads));
};

const normaliseLead = (lead) => ({
  id: lead.id || `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  campaignId: lead.campaignId,
  name: String(lead.name || "").trim() || "Unnamed lead",
  dateReceived: lead.dateReceived || new Date().toISOString().slice(0, 10),
  status: MANUAL_LEAD_STATUSES.includes(lead.status) ? lead.status : "New",
  notes: String(lead.notes || "").trim(),
  lastUpdated: lead.lastUpdated || new Date().toISOString(),
});

// Temporary browser-specific storage. Replace this with an authenticated private
// lead data service before multiple users need to share or secure lead records.
export const metaAdsLeadsRepository = {
  getAllLeads() {
    return readAll();
  },

  getLeadsByCampaign(campaignId) {
    return readAll().filter((lead) => lead.campaignId === campaignId);
  },

  createLead(lead) {
    const nextLead = normaliseLead(lead);
    writeAll([...readAll(), nextLead]);
    return nextLead;
  },

  updateLead(leadId, updates) {
    let updatedLead = null;
    const leads = readAll().map((lead) => {
      if (lead.id !== leadId) return lead;
      updatedLead = normaliseLead({
        ...lead,
        ...updates,
        id: lead.id,
        campaignId: lead.campaignId,
        lastUpdated: new Date().toISOString(),
      });
      return updatedLead;
    });
    writeAll(leads);
    return updatedLead;
  },

  deleteLead(leadId) {
    writeAll(readAll().filter((lead) => lead.id !== leadId));
  },
};
