const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const pricingTierSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    badge: {
      type: String,
      default: "",   // e.g. "Most Popular" — empty string = no badge shown
    },
    setupFee: {
      type: String,
      default: "",   // empty = show "Custom Pricing"
    },
    monthlyPrice: {
      type: String,
      default: "",   // empty = hidden
    },
    yearlyPrice: {
      type: String,
      default: "",   // empty = hidden
    },
    features: {
      type: [String],
      default: [],
    },
    cta: {
      type: String,
      default: "Get Started",
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
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

pricingTierSchema.plugin(toJSON);
pricingTierSchema.plugin(paginate);

const PricingTier = mongoose.model("PricingTier", pricingTierSchema);
module.exports = PricingTier;
