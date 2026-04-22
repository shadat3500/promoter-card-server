const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const response = require("../config/response");
const leadService = require("../services/lead.service");

// POST /venues/slug/:slug/leads  — public
const createLead = catchAsync(async (req, res) => {
  const data = await leadService.createLead(req.params.slug, req.body);
  res.status(httpStatus.CREATED).json(
    response({ message: "Lead captured", status: "CREATED", statusCode: httpStatus.CREATED, data })
  );
});

// GET /venues/me/leads
const getLeads = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 100 } = req.query;
  const filter = status ? { status } : {};
  const options = { page: Number(page), limit: Number(limit), sort: "-createdAt" };
  const data = await leadService.getVenueLeads(req.user.id, filter, options);
  res.status(httpStatus.OK).json(
    response({ message: "Leads fetched", status: "OK", statusCode: httpStatus.OK, data })
  );
});

// PATCH /venues/me/leads/:leadId
const updateLeadStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!["pending", "claimed"].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "status must be 'pending' or 'claimed'");
  }
  const data = await leadService.updateLeadStatus(req.user.id, req.params.leadId, status);
  res.status(httpStatus.OK).json(
    response({ message: "Lead updated", status: "OK", statusCode: httpStatus.OK, data })
  );
});

module.exports = { createLead, getLeads, updateLeadStatus };
