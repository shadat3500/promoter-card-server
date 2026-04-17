const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const pricingService = require("../services/pricing.service");

// PUBLIC — landing page reads this
const getAllTiers = catchAsync(async (req, res) => {
  const tiers = await pricingService.getAllTiers();
  res.status(httpStatus.OK).json(
    response({ message: "Pricing fetched", status: "OK", statusCode: httpStatus.OK, data: tiers })
  );
});

// ADMIN — create a single tier
const createTier = catchAsync(async (req, res) => {
  const tier = await pricingService.createTier(req.body);
  res.status(httpStatus.CREATED).json(
    response({ message: "Pricing tier created", status: "OK", statusCode: httpStatus.CREATED, data: tier })
  );
});

// ADMIN — update a single tier
const updateTier = catchAsync(async (req, res) => {
  const tier = await pricingService.updateTier(req.params.tierId, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Pricing tier updated", status: "OK", statusCode: httpStatus.OK, data: tier })
  );
});

// ADMIN — delete a single tier
const deleteTier = catchAsync(async (req, res) => {
  await pricingService.deleteTier(req.params.tierId);
  res.status(httpStatus.OK).json(
    response({ message: "Pricing tier deleted", status: "OK", statusCode: httpStatus.OK })
  );
});

// ADMIN — bulk replace all tiers ("Save & Publish" from admin panel)
const bulkReplace = catchAsync(async (req, res) => {
  const tiers = await pricingService.bulkReplaceTiers(req.body.tiers);
  res.status(httpStatus.OK).json(
    response({ message: "Pricing published", status: "OK", statusCode: httpStatus.OK, data: tiers })
  );
});

module.exports = { getAllTiers, createTier, updateTier, deleteTier, bulkReplace };
