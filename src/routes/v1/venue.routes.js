const express = require('express');
const validate = require('../../middlewares/validate');
const venueValidation = require('../../validations/venue.validation');
const venueController = require('../../controllers/venue.controller');
const gameController = require('../../controllers/game.controller');
const formController = require('../../controllers/form.controller');
const leadController = require('../../controllers/lead.controller');
const pageController = require('../../controllers/page.controller');
const cardController = require('../../controllers/card.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
router.post('/enquiries', validate(venueValidation.createEnquiry), venueController.submitEnquiry);
router.get('/slug/:slug/published', formController.getPublishedData);
router.post('/slug/:slug/leads', leadController.createLead);

// ─── Venue (self) — MUST come before /:venueId ────────────────────────────────
router.get('/me/profile', auth('manageLandingPages'), venueController.getMyVenue);
router.patch('/me/profile', auth('manageLandingPages'), validate(venueValidation.updateVenue), venueController.updateMyVenue);

// Promoters
router.get('/me/promoters', auth('managePromoters'), venueController.getMyPromoters);
router.post('/me/promoters', auth('managePromoters'), validate(venueValidation.createPromoter), venueController.addPromoter);
router.patch('/me/promoters/:promoterId', auth('managePromoters'), validate(venueValidation.updatePromoter), venueController.updatePromoter);
router.delete('/me/promoters/:promoterId', auth('managePromoters'), venueController.deletePromoter);

// Game & Prizes
router.get('/me/game', auth('manageLandingPages'), gameController.getGameConfig);
router.patch('/me/game', auth('manageLandingPages'), gameController.updateGameType);
router.put('/me/game/prizes', auth('manageLandingPages'), gameController.bulkSavePrizes);
router.patch('/me/game/prizes/:prizeId', auth('manageLandingPages'), gameController.updatePrize);
router.delete('/me/game/prizes/:prizeId', auth('manageLandingPages'), gameController.deletePrize);
router.post('/me/game/prizes/:prizeId/reset-wins', auth('manageLandingPages'), gameController.resetPrizeWins);

// Landing Page config
router.get('/me/page', auth('manageLandingPages'), pageController.getPageConfig);
router.put('/me/page', auth('manageLandingPages'), pageController.savePageConfig);

// Form Builder
router.get('/me/form', auth('manageLandingPages'), formController.getFormFields);
router.put('/me/form', auth('manageLandingPages'), formController.saveFormFields);

// Leads (Guest List)
router.get('/me/leads', auth('manageLandingPages'), leadController.getLeads);
router.patch('/me/leads/:leadId', auth('manageLandingPages'), leadController.updateLeadStatus);

// Cards
router.get('/me/cards', auth('manageLandingPages'), cardController.getCards);
router.post('/me/cards', auth('manageLandingPages'), cardController.createCard);
router.patch('/me/cards/:cardId', auth('manageLandingPages'), cardController.updateCard);
router.delete('/me/cards/:cardId', auth('manageLandingPages'), cardController.deleteCard);

// ─── Admin only — fixed paths before /:venueId ────────────────────────────────
router.get('/', auth('manageVenues'), venueController.getAllVenues);
router.get('/admin/enquiries', auth('manageEnquiries'), venueController.getAllEnquiries);
router.patch('/admin/enquiries/:enquiryId', auth('manageEnquiries'), validate(venueValidation.updateEnquiry), venueController.updateEnquiry);
router.post('/admin/enquiries/:enquiryId/convert', auth('manageVenues'), validate(venueValidation.convertEnquiry), venueController.convertEnquiryToVenue);

// ─── Admin: single venue — MUST come after all fixed paths ────────────────────
router.get('/:venueId', auth('manageVenues'), venueController.getVenue);
router.patch('/:venueId/user-email', auth('manageVenues'), venueController.updateVenueUserEmail);
router.delete('/:venueId', auth('manageVenues'), venueController.deleteVenue);

module.exports = router;
