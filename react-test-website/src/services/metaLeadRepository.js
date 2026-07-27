const STORAGE_KEY = "premier-data-meta-leads-v1";

const safeParse = (value) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const readLeads = () => {
  if (typeof window === "undefined" || !window.localStorage) return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
};

const writeLeads = (leads) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
};

const createId = () =>
  `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const LEAD_STATUSES = ["New", "Contacted", "Converted", "Failed"];

export const metaLeadRepository = {
  storageKey: STORAGE_KEY,

  // Temporary local browser storage only. Replace with an authenticated private
  // data service before storing sensitive contact details or shared team data.
  getLeadsByCampaign(campaignId) {
    return readLeads().filter((lead) => lead.campaignId === campaignId);
  },

  createLead(lead) {
    const now = new Date().toISOString();
    const nextLead = {
      id: lead.id || createId(),
      campaignId: lead.campaignId,
      name: lead.name || "",
      dateReceived: lead.dateReceived || "",
      status: LEAD_STATUSES.includes(lead.status) ? lead.status : "New",
      notes: lead.notes || "",
      lastUpdated: now,
    };
    const leads = [...readLeads(), nextLead];
    writeLeads(leads);
    return nextLead;
  },

  updateLead(leadId, updates) {
    let updatedLead = null;
    const leads = readLeads().map((lead) => {
      if (lead.id !== leadId) return lead;
      updatedLead = {
        ...lead,
        ...updates,
        status: LEAD_STATUSES.includes(updates.status) ? updates.status : lead.status,
        lastUpdated: new Date().toISOString(),
      };
      return updatedLead;
    });
    writeLeads(leads);
    return updatedLead;
  },

  deleteLead(leadId) {
    const leads = readLeads();
    writeLeads(leads.filter((lead) => lead.id !== leadId));
  },
};

export const buildManualLeadSummary = (leads, amountSpent) => {
  const total = leads.length;
  const counts = LEAD_STATUSES.reduce(
    (summary, status) => ({ ...summary, [status]: leads.filter((lead) => lead.status === status).length }),
    {}
  );
  const contactedTotal = counts.Contacted + counts.Converted + counts.Failed;

  return {
    total,
    newCount: counts.New,
    contacted: counts.Contacted,
    converted: counts.Converted,
    failed: counts.Failed,
    contactRate: total ? (contactedTotal / total) * 100 : null,
    conversionRate: total ? (counts.Converted / total) * 100 : null,
    costPerConvertedLead: counts.Converted ? amountSpent / counts.Converted : null,
  };
};
