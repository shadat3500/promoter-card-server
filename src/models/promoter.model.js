const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const promoterSchema = mongoose.Schema(
  {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nickname: {
      type: String,
      default: null,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

promoterSchema.plugin(toJSON);
promoterSchema.plugin(paginate);

const Promoter = mongoose.model("Promoter", promoterSchema);
module.exports = Promoter;
