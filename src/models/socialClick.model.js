const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const socialClickSchema = mongoose.Schema(
  {
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    platform: {
      type: String,
      enum: ["instagram", "tiktok", "whatsapp", "website"],
      required: true,
    },
    url: { type: String, default: "" },
  },
  { timestamps: true }
);

socialClickSchema.plugin(toJSON);

const SocialClick = mongoose.model("SocialClick", socialClickSchema);
module.exports = SocialClick;
