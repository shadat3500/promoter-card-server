const httpStatus = require("http-status");
const { Venue, Prize, FormField, Promoter } = require("../models");
const ApiError = require("../utils/ApiError");
const { DEFAULT_BLOCKS } = require("./page.service");

const DEFAULT_FORM_FIELDS = [
  { label: "Full Name",     fieldKey: "name",  fieldType: "text",  placeholder: "Enter your full name",       isRequired: true,  isActive: true,  sortOrder: 0, options: [], isSystem: true },
  { label: "Email",         fieldKey: "email", fieldType: "email", placeholder: "Enter your email address",   isRequired: true,  isActive: true,  sortOrder: 1, options: [], isSystem: true },
  { label: "Phone Number",  fieldKey: "phone", fieldType: "phone", placeholder: "Enter your phone number",    isRequired: false, isActive: false, sortOrder: 2, options: [], isSystem: false },
];

const getVenueForUser = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  return venue;
};

const getFormFields = async (userId) => {
  const venue = await getVenueForUser(userId);
  let fields = await FormField.find({ venue: venue._id }).sort({ sortOrder: 1, createdAt: 1 });

  if (fields.length === 0) {
    const docs = DEFAULT_FORM_FIELDS.map(f => ({ ...f, venue: venue._id }));
    fields = await FormField.insertMany(docs);
  }

  return fields;
};

const saveFormFields = async (userId, fieldsData) => {
  const venue = await getVenueForUser(userId);

  await FormField.deleteMany({ venue: venue._id });

  if (!fieldsData.length) return [];

  const docs = fieldsData.map((f, idx) => ({
    venue: venue._id,
    label: f.label || "Field",
    fieldKey: (f.fieldKey || `field_${idx + 1}`).toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    fieldType: f.fieldType || "text",
    placeholder: f.placeholder || "",
    isRequired: f.isRequired !== false && f.isRequired !== undefined ? Boolean(f.isRequired) : false,
    isActive: f.isActive !== false,
    sortOrder: f.sortOrder ?? idx,
    options: Array.isArray(f.options) ? f.options : [],
    isSystem: Boolean(f.isSystem),
  }));

  return FormField.insertMany(docs);
};

// Public: get all data needed to render the published page
const getPublishedData = async (slug) => {
  const venue = await Venue.findOne({ slug: slug.toLowerCase() });
  if (!venue || !venue.isActive) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const [prizes, formFields, promoters] = await Promise.all([
    Prize.find({ venue: venue._id, isActive: true }).sort({ sortOrder: 1 }),
    FormField.find({ venue: venue._id, isActive: true }).sort({ sortOrder: 1 }),
    Promoter.find({ venue: venue._id, isActive: true }).select("name nickname").sort({ name: 1 }),
  ]);

  return {
    venue: {
      id: venue._id,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      logoUrl: venue.logoUrl,
      googleReviewUrl: venue.googleReviewUrl,
      address: venue.address,
      phone: venue.phone,
      email: venue.email,
      website: venue.website,
    },
    pageTitle: venue.pageTitle || venue.name || "",
    pageBlocks: venue.pageBlocks || DEFAULT_BLOCKS,
    gameType: venue.gameType || "dice",
    prizes,
    formFields,
    promoters,
  };
};

module.exports = { getFormFields, saveFormFields, getPublishedData };
