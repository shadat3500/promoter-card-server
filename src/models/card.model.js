const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const cardSchema = mongoose.Schema(
  {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    promoter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promoter",
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    // The landing page slug this card links to
    pageSlug: {
      type: String,
      required: true,
      trim: true,
    },
    // Generated NFC URL: /p/{pageSlug}?p={promoterName}
    nfcUrl: {
      type: String,
      required: false,
      default: null,
    },
    tapCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

cardSchema.plugin(toJSON);
cardSchema.plugin(paginate);

const Card = mongoose.model("Card", cardSchema);
module.exports = Card;
