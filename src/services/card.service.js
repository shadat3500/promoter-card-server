const { Card, Venue, Promoter } = require("../models");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const getVenueForUser = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  return venue;
};

const getCards = async (userId) => {
  const venue = await getVenueForUser(userId);
  return Card.find({ venue: venue._id })
    .populate("promoter", "name nickname")
    .sort({ createdAt: -1 });
};

const createCard = async (userId, { label, promoterId, pageSlug }) => {
  const venue = await getVenueForUser(userId);
  const promoter = await Promoter.findOne({ _id: promoterId, venue: venue._id });
  if (!promoter) throw new ApiError(httpStatus.NOT_FOUND, "Promoter not found");
  const slug = pageSlug || venue.slug;
  const card = await Card.create({
    venue: venue._id,
    promoter: promoter._id,
    label,
    pageSlug: slug,
  });
  return Card.findById(card._id).populate("promoter", "name nickname");
};

const updateCard = async (userId, cardId, updates) => {
  const venue = await getVenueForUser(userId);
  const card = await Card.findOne({ _id: cardId, venue: venue._id });
  if (!card) throw new ApiError(httpStatus.NOT_FOUND, "Card not found");
  const allowed = ["label", "isActive"];
  allowed.forEach((k) => { if (updates[k] !== undefined) card[k] = updates[k]; });
  await card.save();
  return Card.findById(card._id).populate("promoter", "name nickname");
};

const deleteCard = async (userId, cardId) => {
  const venue = await getVenueForUser(userId);
  const card = await Card.findOneAndDelete({ _id: cardId, venue: venue._id });
  if (!card) throw new ApiError(httpStatus.NOT_FOUND, "Card not found");
};

module.exports = { getCards, createCard, updateCard, deleteCard };
