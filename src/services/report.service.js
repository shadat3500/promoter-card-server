const { Venue, Lead, SocialClick } = require("../models");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getRangeWindow(range) {
  const now = new Date();
  let start;
  switch (range) {
    case "7days":   start = new Date(now - 7   * 86400000); break;
    case "30days":  start = new Date(now - 30  * 86400000); break;
    case "3months": start = new Date(now - 90  * 86400000); break;
    case "6months":
    default:        start = new Date(now - 180 * 86400000); break;
  }
  const duration = now - start;
  const prevStart = new Date(start - duration);
  return { start, end: now, prevStart, prevEnd: start };
}

function pct(cur, prev) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

// ─── Summary + trend ─────────────────────────────────────────────────────────

const getSummary = async (userId, range) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const { start, end, prevStart, prevEnd } = getRangeWindow(range);

  // Current period counts
  const [curLeads, curClicks, curPrizes, prevLeads, prevClicks, prevPrizes] = await Promise.all([
    Lead.countDocuments({ venue: venue._id, createdAt: { $gte: start, $lte: end } }),
    SocialClick.countDocuments({ venue: venue._id, createdAt: { $gte: start, $lte: end } }),
    Lead.countDocuments({ venue: venue._id, createdAt: { $gte: start, $lte: end }, prizeName: { $ne: null } }),
    Lead.countDocuments({ venue: venue._id, createdAt: { $gte: prevStart, $lte: prevEnd } }),
    SocialClick.countDocuments({ venue: venue._id, createdAt: { $gte: prevStart, $lte: prevEnd } }),
    Lead.countDocuments({ venue: venue._id, createdAt: { $gte: prevStart, $lte: prevEnd }, prizeName: { $ne: null } }),
  ]);

  const curConversion = curLeads > 0 ? Math.round((curPrizes / curLeads) * 100 * 10) / 10 : 0;
  const prevConversion = prevLeads > 0 ? Math.round((prevPrizes / prevLeads) * 100 * 10) / 10 : 0;

  const stats = {
    totalParticipants: curLeads,
    totalInteractions: curClicks,
    prizeWins: curPrizes,
    conversionRate: curConversion,
    changes: {
      participants: pct(curLeads, prevLeads),
      interactions: pct(curClicks, prevClicks),
      prizes: pct(curPrizes, prevPrizes),
      conversion: Math.round((curConversion - prevConversion) * 10) / 10,
    },
  };

  // Monthly trend (always last 6 months regardless of range)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [leadsByMonth, clicksByMonth] = await Promise.all([
    Lead.aggregate([
      { $match: { venue: venue._id, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
    SocialClick.aggregate([
      { $match: { venue: venue._id, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
  ]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const label = MONTHS[d.getMonth()];
    const leads = leadsByMonth.find(x => x._id.year === year && x._id.month === month)?.count ?? 0;
    const clicks = clicksByMonth.find(x => x._id.year === year && x._id.month === month)?.count ?? 0;
    return { month: label, participants: leads, interactions: clicks };
  });

  return { stats, trendData };
};

// ─── Export helpers ───────────────────────────────────────────────────────────

const getLeadsExport = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const leads = await Lead.find({ venue: venue._id })
    .populate("promoter", "name nickname")
    .sort({ createdAt: -1 });

  return leads.map((l) => {
    const fields = Object.fromEntries(l.fieldValues ?? new Map());
    return {
      date: l.createdAt.toISOString().split("T")[0],
      promoter: l.promoterName ?? "",
      prize: l.prizeName ?? "",
      status: l.status,
      name: fields.name ?? fields.fullName ?? "",
      email: fields.email ?? "",
      phone: fields.phone ?? fields.phoneNumber ?? "",
      ...fields,
    };
  });
};

const getSocialExport = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const clicks = await SocialClick.find({ venue: venue._id }).sort({ createdAt: -1 });
  return clicks.map((c) => ({
    date: c.createdAt.toISOString().split("T")[0],
    time: c.createdAt.toISOString().split("T")[1].slice(0, 8),
    platform: c.platform,
    url: c.url ?? "",
  }));
};

const getGameExport = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const leads = await Lead.find({ venue: venue._id, prizeName: { $ne: null } })
    .sort({ createdAt: -1 });

  return leads.map((l) => {
    const fields = Object.fromEntries(l.fieldValues ?? new Map());
    return {
      date: l.createdAt.toISOString().split("T")[0],
      prize: l.prizeName ?? "",
      promoter: l.promoterName ?? "",
      status: l.status,
      name: fields.name ?? fields.fullName ?? "",
      email: fields.email ?? "",
      phone: fields.phone ?? fields.phoneNumber ?? "",
    };
  });
};

module.exports = { getSummary, getLeadsExport, getSocialExport, getGameExport };
