const { Venue, Lead, SocialClick, Card } = require("../models");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

function getRangeWindow(range) {
  const now = new Date();
  if (range === "all") {
    // epoch start — effectively no lower bound
    const start = new Date(0);
    return { start, end: now, prevStart: new Date(0), prevEnd: new Date(0), isAll: true };
  }
  let start;
  switch (range) {
    case "today":    start = new Date(now); start.setHours(0,0,0,0); break;
    case "7days":    start = new Date(now - 7   * 86400000); break;
    case "30days":   start = new Date(now - 30  * 86400000); break;
    case "3months":  start = new Date(now - 90  * 86400000); break;
    case "6months":
    default:         start = new Date(now - 180 * 86400000); break;
  }
  const duration = now - start;
  const prevStart = new Date(start - duration);
  return { start, end: now, prevStart, prevEnd: start, isAll: false };
}

function pct(cur, prev) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = ["12AM","1AM","2AM","3AM","4AM","5AM","6AM","7AM","8AM","9AM","10AM","11AM",
               "12PM","1PM","2PM","3PM","4PM","5PM","6PM","7PM","8PM","9PM","10PM","11PM"];

const getAnalytics = async (userId, range) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const { start, end, prevStart, prevEnd, isAll } = getRangeWindow(range);

  // Build match filter — for "all", omit the date range entirely
  const curFilter  = isAll
    ? { venue: venue._id }
    : { venue: venue._id, createdAt: { $gte: start, $lte: end } };
  const prevFilter = isAll
    ? null
    : { venue: venue._id, createdAt: { $gte: prevStart, $lte: prevEnd } };

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const [
    curLeads, curClicks, curPrizes,
    prevLeads, prevClicks, prevPrizes,
    activeCards,
  ] = await Promise.all([
    Lead.countDocuments(curFilter),
    SocialClick.countDocuments(curFilter),
    Lead.countDocuments({ ...curFilter, prizeName: { $ne: null } }),
    prevFilter ? Lead.countDocuments(prevFilter) : Promise.resolve(0),
    prevFilter ? SocialClick.countDocuments(prevFilter) : Promise.resolve(0),
    prevFilter ? Lead.countDocuments({ ...prevFilter, prizeName: { $ne: null } }) : Promise.resolve(0),
    Card.countDocuments({ venue: venue._id }),
  ]);

  const kpis = {
    totalParticipants: curLeads,
    totalInteractions: curClicks,
    prizeWins: curPrizes,
    activeCards,
    changes: {
      participants: pct(curLeads, prevLeads),
      interactions: pct(curClicks, prevClicks),
      prizes: pct(curPrizes, prevPrizes),
    },
  };

  // ── Daily trend ───────────────────────────────────────────────────────────────
  const days = range === "all" ? 180 : range === "today" ? 1 : range === "7days" ? 7 : range === "30days" ? 30 : range === "3months" ? 90 : 180;
  const [leadsByDay, clicksByDay] = await Promise.all([
    Lead.aggregate([
      { $match: curFilter },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
    SocialClick.aggregate([
      { $match: curFilter },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
  ]);

  const leadDayMap = Object.fromEntries(leadsByDay.map(x => [x._id, x.count]));
  const clickDayMap = Object.fromEntries(clicksByDay.map(x => [x._id, x.count]));

  const dailyTrend = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date(end);
    d.setDate(d.getDate() - (Math.min(days, 30) - 1 - i));
    const key = d.toISOString().split("T")[0];
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    return { date: label, participants: leadDayMap[key] ?? 0, interactions: clickDayMap[key] ?? 0 };
  });

  // ── Hourly activity (by hour of day across full range) ────────────────────────
  const [leadsByHour, clicksByHour] = await Promise.all([
    Lead.aggregate([
      { $match: curFilter },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
    ]),
    SocialClick.aggregate([
      { $match: curFilter },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
    ]),
  ]);

  const leadHourMap = Object.fromEntries(leadsByHour.map(x => [x._id, x.count]));
  const clickHourMap = Object.fromEntries(clicksByHour.map(x => [x._id, x.count]));

  const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
    hour: HOURS[h],
    participants: leadHourMap[h] ?? 0,
    interactions: clickHourMap[h] ?? 0,
  }));

  const peakHour = hourlyActivity.reduce((max, h) =>
    (h.interactions + h.participants) > (max.interactions + max.participants) ? h : max,
    hourlyActivity[0]
  );

  // ── Weekly pattern (day of week) ─────────────────────────────────────────────
  const [leadsByDow, clicksByDow] = await Promise.all([
    Lead.aggregate([
      { $match: curFilter },
      { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } },
    ]),
    SocialClick.aggregate([
      { $match: curFilter },
      { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } },
    ]),
  ]);

  // MongoDB $dayOfWeek: 1=Sun…7=Sat
  const leadDowMap = Object.fromEntries(leadsByDow.map(x => [x._id - 1, x.count]));
  const clickDowMap = Object.fromEntries(clicksByDow.map(x => [x._id - 1, x.count]));

  const weeklyPattern = DAYS.map((day, i) => ({
    day,
    participants: leadDowMap[i] ?? 0,
    interactions: clickDowMap[i] ?? 0,
  }));

  const bestDay = weeklyPattern.reduce((max, d) =>
    (d.interactions + d.participants) > (max.interactions + max.participants) ? d : max,
    weeklyPattern[0]
  );

  // ── Promoter leaderboard ──────────────────────────────────────────────────────
  const promoterRaw = await Lead.aggregate([
    { $match: curFilter },
    {
      $group: {
        _id: "$promoterName",
        leads: { $sum: 1 },
        prizes: { $sum: { $cond: [{ $ne: ["$prizeName", null] }, 1, 0] } },
      },
    },
    { $sort: { leads: -1 } },
    { $limit: 10 },
  ]);

  const promoterLeaderboard = promoterRaw.map((p) => ({
    name: p._id || "Unknown",
    leads: p.leads,
    prizes: p.prizes,
  }));

  // ── Prize distribution ────────────────────────────────────────────────────────
  const prizeRaw = await Lead.aggregate([
    { $match: { ...curFilter, prizeName: { $ne: null } } },
    { $group: { _id: "$prizeName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  const totalPrizes = prizeRaw.reduce((s, p) => s + p.count, 0);
  const prizeDistribution = prizeRaw.map((p) => ({
    prize: p._id,
    count: p.count,
    percentage: totalPrizes > 0 ? Math.round((p.count / totalPrizes) * 100 * 10) / 10 : 0,
  }));

  const topPrize = prizeDistribution[0] ?? null;

  // ── Recent participants ───────────────────────────────────────────────────────
  const recentLeads = await Lead.find({ venue: venue._id })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const recentParticipants = recentLeads.map((l) => {
    const raw = l.fieldValues;
    const fields = raw instanceof Map ? Object.fromEntries(raw) : (raw ?? {});
    return {
      name: fields.name ?? fields.fullName ?? l.promoterName ?? "Guest",
      email: fields.email ?? "",
      phone: fields.phone ?? fields.phoneNumber ?? "",
      promoter: l.promoterName ?? "",
      prize: l.prizeName ?? null,
      createdAt: l.createdAt,
    };
  });

  return {
    kpis,
    dailyTrend,
    hourlyActivity,
    weeklyPattern,
    promoterLeaderboard,
    prizeDistribution,
    recentParticipants,
    insights: {
      peakHour: peakHour.hour,
      bestDay: bestDay.day,
      topPrize: topPrize?.prize ?? null,
    },
  };
};

module.exports = { getAnalytics };
