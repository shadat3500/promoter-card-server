const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

// Lead captured when a customer taps an NFC card and fills in the form
const leadSchema = mongoose.Schema(
  {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    promoter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promoter",
      default: null,
    },
    // Promoter name as string (in case promoter doc not yet linked)
    promoterName: {
      type: String,
      required: true,
      trim: true,
    },
    landingPageSlug: {
      type: String,
      required: true,
    },
    // Prize won during the game
    prizeName: {
      type: String,
      default: null,
    },
    prizeId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'claimed'],
      default: 'pending',
    },
    // Dynamic form field values (name, email, phone, etc.)
    fieldValues: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

leadSchema.plugin(toJSON);
leadSchema.plugin(paginate);

const Lead = mongoose.model("Lead", leadSchema);
module.exports = Lead;
