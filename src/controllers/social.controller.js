const httpStatus = require("http-status");
const socialService = require("../services/social.service");
const catchAsync = require("../utils/catchAsync");

const trackClick = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const { platform, url = "" } = req.body;
  await socialService.trackClick(slug, platform, url);
  res.json({ status: "success", statusCode: 200, message: "Click tracked", data: null });
});

const getStats = catchAsync(async (req, res) => {
  const stats = await socialService.getStats(req.user.id);
  res.json({ status: "success", statusCode: 200, message: "Stats fetched", data: stats });
});

module.exports = { trackClick, getStats };
