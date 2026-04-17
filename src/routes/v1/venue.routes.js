const express = require('express');
const validate = require('../../middlewares/validate');
const venueValidation = require('../../validations/venue.validation');
const venueController = require('../../controllers/venue.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
// Submit a Get Started / Book a Demo enquiry (landing page form)
router.post('/enquiries', validate(venueValidation.createEnquiry), venueController.submitEnquiry);

// ─── Admin only ───────────────────────────────────────────────────────────────
// List all venues
router.get('/', auth('manageVenues'), venueController.getAllVenues);

// Get / deactivate a single venue
router.get('/:venueId', auth('manageVenues'), venueController.getVenue);
router.delete('/:venueId', auth('manageVenues'), venueController.deleteVenue);

// List all enquiries (admin)
router.get('/admin/enquiries', auth('manageEnquiries'), venueController.getAllEnquiries);

// Update enquiry status / notes
router.patch('/admin/enquiries/:enquiryId', auth('manageEnquiries'), validate(venueValidation.updateEnquiry), venueController.updateEnquiry);

// Convert enquiry → venue account + send welcome email to venue
router.post(
  '/admin/enquiries/:enquiryId/convert',
  auth('manageVenues'),
  validate(venueValidation.convertEnquiry),
  venueController.convertEnquiryToVenue
);

// ─── Venue (self) ─────────────────────────────────────────────────────────────
// Get / update own venue profile
router.get('/me/profile', auth('manageLandingPages'), venueController.getMyVenue);
router.patch('/me/profile', auth('manageLandingPages'), validate(venueValidation.updateVenue), venueController.updateMyVenue);

// Promoter management
router.get('/me/promoters', auth('managePromoters'), venueController.getMyPromoters);
router.post('/me/promoters', auth('managePromoters'), validate(venueValidation.createPromoter), venueController.addPromoter);
router.patch('/me/promoters/:promoterId', auth('managePromoters'), validate(venueValidation.updatePromoter), venueController.updatePromoter);
router.delete('/me/promoters/:promoterId', auth('managePromoters'), venueController.deletePromoter);

module.exports = router;
