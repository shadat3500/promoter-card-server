const httpStatus = require("http-status");
const { Venue } = require("../models");
const ApiError = require("../utils/ApiError");

const DEFAULT_BLOCKS = [
  {
    id: "hero", type: "hero", label: "Hero Section", enabled: true, expanded: true,
    content: { headline: "Welcome to Our Venue", subheadline: "Tap. Play. Win.", heroImage: "" },
  },
  {
    id: "event", type: "event", label: "Event Details", enabled: true, expanded: false,
    content: { venueName: "", date: "", time: "", location: "" },
  },
  {
    id: "description", type: "description", label: "Description", enabled: true, expanded: false,
    content: { text: "Join us for an unforgettable experience with music, cocktails, and great vibes." },
  },
  {
    id: "game", type: "game", label: "Prize Game", enabled: true, expanded: false,
    content: { reviewUrl: "", reviewPrompt: "Show this screen to a staff member to claim your prize!" },
  },
  {
    id: "social", type: "social", label: "Social Links", enabled: false, expanded: false,
    content: { instagram: "", tiktok: "", whatsapp: "", website: "" },
  },
  {
    id: "contact", type: "contact", label: "Contact Info", enabled: false, expanded: false,
    content: { phone: "", email: "" },
  },
];

const getVenueForUser = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  return venue;
};

const getPageConfig = async (userId) => {
  const venue = await getVenueForUser(userId);
  return {
    slug: venue.slug || "",
    pageTitle: venue.pageTitle || venue.name || "",
    pageBlocks: venue.pageBlocks || DEFAULT_BLOCKS,
  };
};

const savePageConfig = async (userId, { slug, pageTitle, pageBlocks }) => {
  const venue = await getVenueForUser(userId);

  // Check slug uniqueness if changed
  if (slug && slug !== venue.slug) {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const existing = await Venue.findOne({ slug: cleanSlug, _id: { $ne: venue._id } });
    if (existing) throw new ApiError(httpStatus.CONFLICT, "This URL slug is already taken by another venue");
    venue.slug = cleanSlug;
  }

  if (pageTitle !== undefined) venue.pageTitle = pageTitle || null;
  if (pageBlocks !== undefined) {
    venue.pageBlocks = pageBlocks;
    venue.markModified("pageBlocks");
  }

  await venue.save();
  return {
    slug: venue.slug || "",
    pageTitle: venue.pageTitle || "",
    pageBlocks: venue.pageBlocks || DEFAULT_BLOCKS,
  };
};

module.exports = { getPageConfig, savePageConfig, DEFAULT_BLOCKS };
