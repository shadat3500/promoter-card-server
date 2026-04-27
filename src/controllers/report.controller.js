const catchAsync = require("../utils/catchAsync");
const reportService = require("../services/report.service");

const getSummary = catchAsync(async (req, res) => {
  const range = req.query.range || "6months";
  const data = await reportService.getSummary(req.user.id, range);
  res.json({ status: "success", statusCode: 200, message: "Report summary fetched", data });
});

const getLeadsExport = catchAsync(async (req, res) => {
  const data = await reportService.getLeadsExport(req.user.id);
  res.json({ status: "success", statusCode: 200, message: "Leads export ready", data });
});

const getSocialExport = catchAsync(async (req, res) => {
  const data = await reportService.getSocialExport(req.user.id);
  res.json({ status: "success", statusCode: 200, message: "Social export ready", data });
});

const getGameExport = catchAsync(async (req, res) => {
  const data = await reportService.getGameExport(req.user.id);
  res.json({ status: "success", statusCode: 200, message: "Game export ready", data });
});

module.exports = { getSummary, getLeadsExport, getSocialExport, getGameExport };
