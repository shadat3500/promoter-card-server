const { SocialClick, Venue } = require("../models");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const PLATFORMS = ["instagram", "tiktok", "whatsapp", "website"];

const trackClick = async (slug, platform, url = "") => {
  if (!PLATFORMS.includes(platform)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid platform");
  }
  const venue = await Venue.findOne({ slug });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");
  await SocialClick.create({ venue: venue._id, platform, url });
};

const getStats = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  // All-time grouped by platform + url
  const allTimeTotals = await SocialClick.aggregate([
    { $match: { venue: venue._id } },
    { $group: { _id: { platform: "$platform", url: { $ifNull: ["$url", ""] } }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // This week grouped by platform + url
  const thisWeekTotals = await SocialClick.aggregate([
    { $match: { venue: venue._id, createdAt: { $gte: weekStart } } },
    { $group: { _id: { platform: "$platform", url: { $ifNull: ["$url", ""] } }, count: { $sum: 1 } } },
  ]);

  // Previous week grouped by platform + url
  const prevWeekTotals = await SocialClick.aggregate([
    { $match: { venue: venue._id, createdAt: { $gte: prevWeekStart, $lt: weekStart } } },
    { $group: { _id: { platform: "$platform", url: { $ifNull: ["$url", ""] } }, count: { $sum: 1 } } },
  ]);

  // Daily breakdown last 7 days — grouped by date + platform (for chart)
  const dailyClicks = await SocialClick.aggregate([
    { $match: { venue: venue._id, createdAt: { $gte: weekStart } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          platform: "$platform",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  return { allTimeTotals, thisWeekTotals, prevWeekTotals, dailyClicks };
};

module.exports = { trackClick, getStats };
