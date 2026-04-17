const httpStatus = require("http-status");
const { PricingTier } = require("../models");
const ApiError = require("../utils/ApiError");

const getAllTiers = async () => {
  return PricingTier.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
};

const getTierById = async (id) => {
  const tier = await PricingTier.findById(id);
  if (!tier) throw new ApiError(httpStatus.NOT_FOUND, "Pricing tier not found");
  return tier;
};

const createTier = async (body) => {
  return PricingTier.create(body);
};

const updateTier = async (id, updateBody) => {
  const tier = await getTierById(id);
  Object.assign(tier, updateBody);
  await tier.save();
  return tier;
};

const deleteTier = async (id) => {
  const tier = await getTierById(id);
  await tier.deleteOne();
  return tier;
};

// Replace ALL tiers at once (used by admin "Save & Publish" bulk editor)
const bulkReplaceTiers = async (tiersArray) => {
  await PricingTier.deleteMany({});
  return PricingTier.insertMany(
    tiersArray.map((t, i) => ({ ...t, sortOrder: i, isActive: true }))
  );
};

module.exports = {
  getAllTiers,
  getTierById,
  createTier,
  updateTier,
  deleteTier,
  bulkReplaceTiers,
};
