const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
// Admin registration (creates an admin account — use sparingly or seed instead)
router.post('/register', validate(authValidation.register), authController.register);

// Email OTP verification (for admin registration)
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);

// Admin login — email + password
router.post('/admin/login', validate(authValidation.adminLogin), authController.adminLogin);

// Venue login — username + password (account created by admin)
router.post('/venue/login', validate(authValidation.venueLogin), authController.venueLogin);

// Forgot / reset password (admin email-based only)
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

// Token refresh
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

// Logout
router.post('/logout', validate(authValidation.logout), authController.logout);

// ─── Authenticated ────────────────────────────────────────────────────────────
// Get my profile
router.get('/me', auth('common'), authController.getMe);

// Change password
router.post('/change-password', auth('common'), validate(authValidation.changePassword), authController.changePassword);

// Delete own account
router.post('/delete-me', auth('common'), validate(authValidation.deleteMe), authController.deleteMe);

// ─── Admin only ───────────────────────────────────────────────────────────────
// Admin creates a venue account
router.post('/admin/create-venue', auth('manageVenues'), validate(authValidation.createVenue), authController.createVenueAccount);

module.exports = router;
