const catchAsync = require("../utils/catchAsync");
const analyticsService = require("../services/analytics.service");

const getAnalytics = catchAsync(async (req, res) => {
  const range = req.query.range || "7days";
  const data = await analyticsService.getAnalytics(req.user.id, range);
  res.json({ status: "success", statusCode: 200, message: "Analytics fetched", data });
});

module.exports = { getAnalytics };
