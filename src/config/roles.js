const allRoles = {
  admin: ['common', 'manageVenues', 'manageEnquiries', 'managePricing', 'manageUsers'],
  venue: ['common', 'manageLandingPages', 'managePromoters', 'manageCards', 'viewLeads'],
  promoter: ['common'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = { roles, roleRights };
