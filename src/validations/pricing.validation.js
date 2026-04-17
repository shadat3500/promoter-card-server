const Joi = require("joi");

const tierBody = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  badge: Joi.string().allow(""),
  setupFee: Joi.string().allow(""),
  monthlyPrice: Joi.string().allow(""),
  yearlyPrice: Joi.string().allow(""),
  features: Joi.array().items(Joi.string()),
  cta: Joi.string(),
  highlighted: Joi.boolean(),
  sortOrder: Joi.number(),
});

const createTier = { body: tierBody };

const updateTier = {
  body: tierBody.fork(["name"], (s) => s.optional()),
};

const bulkReplace = {
  body: Joi.object().keys({
    tiers: Joi.array().items(tierBody).required(),
  }),
};

module.exports = { createTier, updateTier, bulkReplace };
