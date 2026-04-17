const Joi = require("joi");

const updateVenue = {
  body: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string().allow(""),
    address: Joi.string().allow(""),
    phone: Joi.string().allow(""),
    email: Joi.string().email().allow(""),
    website: Joi.string().allow(""),
    googleReviewUrl: Joi.string().allow(""),
    logoUrl: Joi.string().allow(""),
  }),
};

const createEnquiry = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    businessName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow(""),
    cardQuantity: Joi.string().allow(""),
    message: Joi.string().allow(""),
  }),
};

const updateEnquiry = {
  body: Joi.object().keys({
    status: Joi.string().valid("new", "contacted", "converted"),
    notes: Joi.string().allow(""),
  }),
};

const createPromoter = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    nickname: Joi.string().allow(""),
    phone: Joi.string().allow(""),
    email: Joi.string().email().allow(""),
  }),
};

const updatePromoter = {
  body: Joi.object().keys({
    name: Joi.string(),
    nickname: Joi.string().allow(""),
    phone: Joi.string().allow(""),
    email: Joi.string().email().allow(""),
    isActive: Joi.boolean(),
  }),
};

const convertEnquiry = {
  body: Joi.object().keys({
    username: Joi.string().required().min(3).max(30),
    password: Joi.string().required().min(8),
  }),
};

module.exports = {
  updateVenue,
  createEnquiry,
  updateEnquiry,
  convertEnquiry,
  createPromoter,
  updatePromoter,
};
