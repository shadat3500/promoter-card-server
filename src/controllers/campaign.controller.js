const httpStatus = require("http-status");
const campaignService = require("../services/campaign.service");
const catchAsync = require("../utils/catchAsync");

const getCampaigns = catchAsync(async (req, res) => {
  const data = await campaignService.getCampaigns(req.user.id);
  res.json({ status: "success", statusCode: 200, message: "Campaigns fetched", data });
});

const createCampaign = catchAsync(async (req, res) => {
  const data = await campaignService.createCampaign(req.user.id, req.body);
  res.status(httpStatus.CREATED).json({ status: "success", statusCode: 201, message: "Campaign created", data });
});

const updateCampaign = catchAsync(async (req, res) => {
  const data = await campaignService.updateCampaign(req.user.id, req.params.campaignId, req.body);
  res.json({ status: "success", statusCode: 200, message: "Campaign updated", data });
});

const deleteCampaign = catchAsync(async (req, res) => {
  await campaignService.deleteCampaign(req.user.id, req.params.campaignId);
  res.json({ status: "success", statusCode: 200, message: "Campaign deleted", data: null });
});

module.exports = { getCampaigns, createCampaign, updateCampaign, deleteCampaign };
