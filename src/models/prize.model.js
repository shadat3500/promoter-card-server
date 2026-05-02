const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const prizeSchema = mongoose.Schema(
  {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: null },   // base64 or URL (max 200 KB enforced on client)
    probabilityWeight: { type: Number, default: 10, min: 1, max: 100 },
    maxWins: { type: Number, default: 0, min: 0 },   // 0 = unlimited
    currentWins: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    color: { type: String, default: null },
  },
  { timestamps: true }
);

prizeSchema.plugin(toJSON);

module.exports = mongoose.model("Prize", prizeSchema);
