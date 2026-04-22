const httpStatus = require("http-status");
const { Venue, Prize } = require("../models");
const ApiError = require("../utils/ApiError");

const getVenueForUser = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  return venue;
};

const DEFAULT_PRIZES = [
  { name: "Free Drink", description: "One complimentary drink at the bar", probabilityWeight: 30, maxWins: 0, isActive: true, sortOrder: 0 },
  { name: "10% Off", description: "10% discount on your next order", probabilityWeight: 25, maxWins: 0, isActive: true, sortOrder: 1 },
  { name: "VIP Table", description: "Upgrade to a VIP table for the night", probabilityWeight: 10, maxWins: 5, isActive: true, sortOrder: 2 },
  { name: "Free Shot", description: "A complimentary shot of your choice", probabilityWeight: 20, maxWins: 0, isActive: true, sortOrder: 3 },
  { name: "Merch Pack", description: "Exclusive venue merchandise", probabilityWeight: 10, maxWins: 10, isActive: true, sortOrder: 4 },
  { name: "Jackpot!", description: "The big prize — ask the staff!", probabilityWeight: 5, maxWins: 2, isActive: true, sortOrder: 5 },
];

const getGameConfig = async (userId) => {
  const venue = await getVenueForUser(userId);
  let prizes = await Prize.find({ venue: venue._id }).sort({ sortOrder: 1, createdAt: 1 });

  if (prizes.length === 0) {
    const docs = DEFAULT_PRIZES.map(p => ({ ...p, venue: venue._id }));
    prizes = await Prize.insertMany(docs);
  }

  return { gameType: venue.gameType || "dice", prizes };
};

const updateGameType = async (userId, gameType) => {
  const venue = await getVenueForUser(userId);
  venue.gameType = gameType;
  await venue.save();
  return { gameType: venue.gameType };
};

// Bulk replace — delete all existing prizes and re-insert.
// Preserves currentWins from client payload so win counts survive a save.
const bulkSavePrizes = async (userId, prizesData) => {
  const venue = await getVenueForUser(userId);
  if (prizesData.length > 6) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Maximum 6 prizes allowed per venue");
  }

  await Prize.deleteMany({ venue: venue._id });

  if (!prizesData.length) return [];

  const docs = prizesData.map((p, idx) => ({
    venue: venue._id,
    name: p.name,
    description: p.description || "",
    imageUrl: p.imageUrl || null,
    probabilityWeight: Math.min(100, Math.max(1, Number(p.probabilityWeight) || 10)),
    maxWins: Math.max(0, Number(p.maxWins) || 0),
    currentWins: Math.max(0, Number(p.currentWins) || 0),
    isActive: p.isActive !== false,
    sortOrder: p.sortOrder ?? idx,
  }));

  return Prize.insertMany(docs);
};

const updatePrize = async (userId, prizeId, updates) => {
  const venue = await getVenueForUser(userId);
  const prize = await Prize.findOne({ _id: prizeId, venue: venue._id });
  if (!prize) throw new ApiError(httpStatus.NOT_FOUND, "Prize not found");
  Object.assign(prize, updates);
  await prize.save();
  return prize;
};

const deletePrize = async (userId, prizeId) => {
  const venue = await getVenueForUser(userId);
  const prize = await Prize.findOne({ _id: prizeId, venue: venue._id });
  if (!prize) throw new ApiError(httpStatus.NOT_FOUND, "Prize not found");
  await prize.deleteOne();
};

const resetPrizeWins = async (userId, prizeId) => {
  const venue = await getVenueForUser(userId);
  const prize = await Prize.findOne({ _id: prizeId, venue: venue._id });
  if (!prize) throw new ApiError(httpStatus.NOT_FOUND, "Prize not found");
  prize.currentWins = 0;
  await prize.save();
  return prize;
};

module.exports = {
  getGameConfig,
  updateGameType,
  bulkSavePrizes,
  updatePrize,
  deletePrize,
  resetPrizeWins,
};
