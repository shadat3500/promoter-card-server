const express = require("express");
const validate = require("../../middlewares/validate");
const pricingValidation = require("../../validations/pricing.validation");
const pricingController = require("../../controllers/pricing.controller");
const auth = require("../../middlewares/auth");

const router = express.Router();

// PUBLIC — landing page fetches this
router.get("/", pricingController.getAllTiers);

// ADMIN — bulk replace (Save & Publish from admin panel editor)
router.put("/", auth("managePricing"), validate(pricingValidation.bulkReplace), pricingController.bulkReplace);

// ADMIN — create single tier
router.post("/", auth("managePricing"), validate(pricingValidation.createTier), pricingController.createTier);

// ADMIN — update single tier
router.patch("/:tierId", auth("managePricing"), validate(pricingValidation.updateTier), pricingController.updateTier);

// ADMIN — delete single tier
router.delete("/:tierId", auth("managePricing"), pricingController.deleteTier);

module.exports = router;
