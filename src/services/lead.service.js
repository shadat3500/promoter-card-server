const httpStatus = require("http-status");
const { Venue, Lead, Promoter, Prize } = require("../models");
const ApiError = require("../utils/ApiError");

const getVenueForUser = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  return venue;
};

// Public: submit lead from published page
const createLead = async (slug, data) => {
  const venue = await Venue.findOne({ slug: slug.toLowerCase() });
  if (!venue || !venue.isActive) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const { promoterName, prizeName, prizeId, fieldValues } = data;

  if (!promoterName?.trim()) throw new ApiError(httpStatus.BAD_REQUEST, "promoterName is required");

  const promoter = await Promoter.findOne({ venue: venue._id, name: promoterName.trim(), isActive: true });

  const lead = await Lead.create({
    venue: venue._id,
    promoter: promoter?._id || null,
    promoterName: promoterName.trim(),
    landingPageSlug: slug,
    prizeName: prizeName || null,
    prizeId: prizeId || null,
    status: "pending",
    fieldValues: fieldValues || {},
  });

  // Increment win count on the prize
  if (prizeId) {
    await Prize.findOneAndUpdate({ _id: prizeId, venue: venue._id }, { $inc: { currentWins: 1 } });
  }

  return lead;
};

const getVenueLeads = async (userId, filter = {}, options = {}) => {
  const venue = await getVenueForUser(userId);
  return Lead.paginate({ venue: venue._id, ...filter }, options);
};

const updateLeadStatus = async (userId, leadId, status) => {
  const venue = await getVenueForUser(userId);
  const lead = await Lead.findOne({ _id: leadId, venue: venue._id });
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, "Lead not found");
  lead.status = status;
  await lead.save();
  return lead;
};

module.exports = { createLead, getVenueLeads, updateLeadStatus };
