import { useCallback, useEffect, useState } from "react";
import { metaAdsLeadsRepository } from "../utils/metaAdsLeadsRepository";

export function useMetaAdsManualLeads() {
  const [leads, setLeads] = useState(() => metaAdsLeadsRepository.getAllLeads());

  const refresh = useCallback(() => {
    setLeads(metaAdsLeadsRepository.getAllLeads());
  }, []);

  useEffect(() => {
    const handleStorage = () => refresh();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refresh]);

  const createLead = (lead) => {
    const nextLead = metaAdsLeadsRepository.createLead(lead);
    refresh();
    return nextLead;
  };

  const updateLead = (leadId, updates) => {
    const nextLead = metaAdsLeadsRepository.updateLead(leadId, updates);
    refresh();
    return nextLead;
  };

  const deleteLead = (leadId) => {
    metaAdsLeadsRepository.deleteLead(leadId);
    refresh();
  };

  return {
    leads,
    createLead,
    updateLead,
    deleteLead,
  };
}
