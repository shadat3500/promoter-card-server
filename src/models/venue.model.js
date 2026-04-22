const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const venueSchema = mongoose.Schema(
  {
    // Linked user account (role=venue)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
    googleReviewUrl: {
      type: String,
      default: null,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    gameType: {
      type: String,
      enum: ["dice", "spin_wheel"],
      default: "dice",
    },
    // Landing page configuration
    pageTitle: {
      type: String,
      default: null,
    },
    pageBlocks: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Linked enquiry that created this venue (if admin converted)
    enquiryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      default: null,
    },
  },
  { timestamps: true }
);

venueSchema.plugin(toJSON);
venueSchema.plugin(paginate);

const Venue = mongoose.model("Venue", venueSchema);
module.exports = Venue;
