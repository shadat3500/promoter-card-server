const Joi = require("joi");
const { password } = require("./custom.validation");

// Admin registers (or seeded)
const register = {
  body: Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    role: Joi.string().valid("admin").default("admin"),
  }),
};

// Admin login — email + password
const adminLogin = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    fcmToken: Joi.string(),
  }),
};

// Venue login — username + password (account created by admin)
const venueLogin = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
    fcmToken: Joi.string(),
  }),
};

// Admin creates a venue account
const createVenue = {
  body: Joi.object().keys({
    venueName: Joi.string().required(),
    username: Joi.string().required().min(3).max(30),
    password: Joi.string().required().custom(password),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    // Optional: link to enquiry that triggered this
    enquiryId: Joi.string().optional(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required().custom(password),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    code: Joi.string().required(),
  }),
};

const deleteMe = {
  body: Joi.object().keys({
    password: Joi.string().required(),
  }),
};

module.exports = {
  register,
  adminLogin,
  venueLogin,
  createVenue,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  deleteMe,
};
