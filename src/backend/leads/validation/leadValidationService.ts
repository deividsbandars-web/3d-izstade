export const leadValidationService = {
  validateLead(lead: any) {
    if (!lead.company_name) return false;
    if (!lead.website && !lead.phone && !lead.email) return false;
    return true;
  },
};
