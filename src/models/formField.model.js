const mongoose = require("mongoose");
const { toJSON } = require("./plugins");

const formFieldSchema = mongoose.Schema(
  {
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    label: { type: String, required: true, trim: true },
    fieldKey: { type: String, required: true, trim: true, lowercase: true },
    fieldType: {
      type: String,
      enum: ["text", "email", "phone", "textarea", "dropdown", "radio", "checkbox", "date"],
      default: "text",
    },
    placeholder: { type: String, default: "" },
    isRequired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    options: [{ type: String }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

formFieldSchema.plugin(toJSON);

const FormField = mongoose.model("FormField", formFieldSchema);
module.exports = FormField;
