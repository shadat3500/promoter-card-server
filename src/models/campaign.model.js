const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const campaignSchema = mongoose.Schema(
  {
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, trim: true, default: "" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Promoter" }],
    // "paused" is the only manually overridable status; active/scheduled/completed are derived
    paused: { type: Boolean, default: false },
  },
  { timestamps: true }
);

campaignSchema.plugin(toJSON);

const Campaign = mongoose.model("Campaign", campaignSchema);
module.exports = Campaign;
