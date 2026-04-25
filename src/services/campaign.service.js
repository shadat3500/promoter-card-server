const { Campaign, Venue, Lead } = require("../models");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

function deriveStatus(campaign) {
  if (campaign.paused) return "paused";
  const now = new Date();
  if (new Date(campaign.endDate) < now) return "completed";
  if (new Date(campaign.startDate) > now) return "scheduled";
  return "active";
}

function deriveProgress(campaign) {
  const now = Date.now();
  const start = new Date(campaign.startDate).getTime();
  const end = new Date(campaign.endDate).getTime();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

async function getLeadStats(venueId, startDate, endDate) {
  const match = {
    venue: venueId,
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  };
  const [signups, prizes] = await Promise.all([
    Lead.countDocuments(match),
    Lead.countDocuments({ ...match, prizeName: { $ne: null } }),
  ]);
  return { signups, prizes };
}

function formatCampaign(c, signups, prizes) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    location: c.location,
    participants: (c.participants ?? []).map((p) => ({
      id: p._id ?? p.id,
      name: p.name,
      nickname: p.nickname ?? null,
    })),
    startDate: c.startDate,
    endDate: c.endDate,
    paused: c.paused,
    status: deriveStatus(c),
    progress: deriveProgress(c),
    signups,
    prizes,
    createdAt: c.createdAt,
  };
}

const getCampaigns = async (userId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const campaigns = await Campaign.find({ venue: venue._id })
    .populate("participants", "name nickname")
    .sort({ createdAt: -1 });

  return Promise.all(
    campaigns.map(async (c) => {
      const { signups, prizes } = await getLeadStats(venue._id, c.startDate, c.endDate);
      return formatCampaign(c, signups, prizes);
    })
  );
};

const createCampaign = async (userId, body) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const campaign = await Campaign.create({
    venue: venue._id,
    name: body.name,
    description: body.description ?? "",
    location: body.location ?? "",
    participants: body.participants ?? [],
    startDate: body.startDate,
    endDate: body.endDate,
    paused: false,
  });

  await campaign.populate("participants", "name nickname");
  return formatCampaign(campaign, 0, 0);
};

const updateCampaign = async (userId, campaignId, body) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const campaign = await Campaign.findOne({ _id: campaignId, venue: venue._id });
  if (!campaign) throw new ApiError(httpStatus.NOT_FOUND, "Campaign not found");

  const allowed = ["name", "description", "location", "participants", "startDate", "endDate", "paused"];
  allowed.forEach((key) => {
    if (body[key] !== undefined) campaign[key] = body[key];
  });
  await campaign.save();
  await campaign.populate("participants", "name nickname");

  const { signups, prizes } = await getLeadStats(venue._id, campaign.startDate, campaign.endDate);
  return formatCampaign(campaign, signups, prizes);
};

const deleteCampaign = async (userId, campaignId) => {
  const venue = await Venue.findOne({ user: userId });
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue not found");

  const campaign = await Campaign.findOneAndDelete({ _id: campaignId, venue: venue._id });
  if (!campaign) throw new ApiError(httpStatus.NOT_FOUND, "Campaign not found");
};

module.exports = { getCampaigns, createCampaign, updateCampaign, deleteCampaign };
