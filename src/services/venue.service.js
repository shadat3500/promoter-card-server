const httpStatus = require("http-status");
const { Venue, Promoter, Enquiry } = require("../models");
const ApiError = require("../utils/ApiError");

// ─── Venue ────────────────────────────────────────────────────────────────────

const getAllVenues = async (filter = {}, options = {}) => {
  return Venue.paginate({ ...filter }, { ...options, populate: "user" });
};

const getVenueById = async (id) => {
  const venue = await Venue.findById(id).populate("user", "username email fullName");
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  return venue;
};

const getVenueByUserId = async (userId) => {
  return Venue.findOne({ user: userId });
};

const updateVenue = async (venueId, updateBody) => {
  const venue = await Venue.findById(venueId);
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  Object.assign(venue, updateBody);
  await venue.save();
  return venue;
};

const deleteVenue = async (venueId) => {
  const venue = await Venue.findById(venueId);
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  venue.isActive = false;
  await venue.save();
  return venue;
};

// ─── Enquiry (public Get Started form) ───────────────────────────────────────

const createEnquiry = async (body) => {
  return Enquiry.create(body);
};

const getAllEnquiries = async (filter = {}, options = {}) => {
  return Enquiry.paginate(filter, options);
};

const getEnquiryById = async (id) => {
  const enquiry = await Enquiry.findById(id);
  if (!enquiry) throw new ApiError(httpStatus.NOT_FOUND, "Enquiry not found");
  return enquiry;
};

const updateEnquiry = async (id, updateBody) => {
  const enquiry = await getEnquiryById(id);
  Object.assign(enquiry, updateBody);
  await enquiry.save();
  return enquiry;
};

// ─── Promoter ─────────────────────────────────────────────────────────────────

const getVenuePromoters = async (venueId) => {
  return Promoter.find({ venue: venueId }).sort({ createdAt: -1 });
};

const createPromoter = async (venueId, body) => {
  return Promoter.create({ venue: venueId, ...body });
};

const getPromoterById = async (id) => {
  const promoter = await Promoter.findById(id);
  if (!promoter) throw new ApiError(httpStatus.NOT_FOUND, "Promoter not found");
  return promoter;
};

const updatePromoter = async (id, updateBody) => {
  const promoter = await getPromoterById(id);
  Object.assign(promoter, updateBody);
  await promoter.save();
  return promoter;
};

const deletePromoter = async (id) => {
  const promoter = await getPromoterById(id);
  await promoter.deleteOne();
  return promoter;
};

module.exports = {
  getAllVenues,
  getVenueById,
  getVenueByUserId,
  updateVenue,
  deleteVenue,
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  getVenuePromoters,
  createPromoter,
  getPromoterById,
  updatePromoter,
  deletePromoter,
};
