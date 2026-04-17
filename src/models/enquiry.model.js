const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

// Public "Get Started / Book a Demo" form submission from the landing page
const enquirySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
      default: null,
    },
    cardQuantity: {
      type: String,
      required: false,
      default: null,
    },
    message: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted'],
      default: 'new',
    },
    notes: {
      type: String,
      default: '',
    },
    // Set when admin converts this enquiry to a venue account
    convertedVenue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      default: null,
    },
  },
  { timestamps: true }
);

enquirySchema.plugin(toJSON);
enquirySchema.plugin(paginate);

const Enquiry = mongoose.model("Enquiry", enquirySchema);
module.exports = Enquiry;
