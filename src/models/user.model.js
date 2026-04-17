const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");
const { roles } = require("../config/roles");

const userSchema = mongoose.Schema(
  {
    // Used by venue + admin for username-based login
    username: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
      sparse: true, // allows multiple nulls
      default: null,
    },
    fullName: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // allows multiple nulls (promoters/venues may not have email)
      trim: true,
      lowercase: true,
      validate(value) {
        if (value && !validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
      default: null,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      private: true,
    },
    role: {
      type: String,
      enum: roles,
      required: true,
    },
    // Only for venue role
    venueName: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    // Reference to Venue document (for role=venue)
    venueRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      default: null,
    },
    image: {
      type: String,
      default: "/uploads/users/user.png",
    },
    phoneNumber: {
      type: String,
      required: false,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    oneTimeCode: {
      type: String,
      required: false,
      default: null,
    },
    fcmToken: {
      type: String,
      required: false,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  if (!email) return false;
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
  if (!username) return false;
  const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
