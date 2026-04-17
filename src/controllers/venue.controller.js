const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const response = require("../config/response");
const venueService = require("../services/venue.service");
const { emailService, userService } = require("../services");
const { User, Venue } = require("../models");
const pick = require("../utils/pick");
const config = require("../config/config");

// ─── Admin: list all venues ───────────────────────────────────────────────────

const getAllVenues = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const venues = await venueService.getAllVenues(filter, options);
  res.status(httpStatus.OK).json(
    response({ message: "Venues fetched", status: "OK", statusCode: httpStatus.OK, data: venues })
  );
});

// ─── Get single venue ─────────────────────────────────────────────────────────

const getVenue = catchAsync(async (req, res) => {
  const venue = await venueService.getVenueById(req.params.venueId);
  res.status(httpStatus.OK).json(
    response({ message: "Venue fetched", status: "OK", statusCode: httpStatus.OK, data: venue })
  );
});

// ─── Venue: get own profile ───────────────────────────────────────────────────

const getMyVenue = catchAsync(async (req, res) => {
  const venue = await venueService.getVenueByUserId(req.user.id);
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue profile not found");
  res.status(httpStatus.OK).json(
    response({ message: "Venue profile fetched", status: "OK", statusCode: httpStatus.OK, data: venue })
  );
});

// ─── Venue: update own profile ────────────────────────────────────────────────

const updateMyVenue = catchAsync(async (req, res) => {
  const venue = await venueService.getVenueByUserId(req.user.id);
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue profile not found");
  const updated = await venueService.updateVenue(venue._id, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Venue updated", status: "OK", statusCode: httpStatus.OK, data: updated })
  );
});

// ─── Admin: delete a venue ────────────────────────────────────────────────────

const deleteVenue = catchAsync(async (req, res) => {
  await venueService.deleteVenue(req.params.venueId);
  res.status(httpStatus.OK).json(
    response({ message: "Venue deactivated", status: "OK", statusCode: httpStatus.OK })
  );
});

// ─── PUBLIC: submit Get Started / Book a Demo enquiry ────────────────────────

const submitEnquiry = catchAsync(async (req, res) => {
  const enquiry = await venueService.createEnquiry(req.body);

  // Notify admin by email (fire-and-forget — don't block the response)
  const adminEmail = config.contactUsEmail || process.env.CONTACT_US_EMAIL;
  if (adminEmail) {
    emailService.sendNewEnquiryNotification(adminEmail, enquiry).catch(() => {});
  }

  res.status(httpStatus.CREATED).json(
    response({
      message: "Thanks! We'll be in touch shortly.",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: enquiry,
    })
  );
});

// ─── Admin: list all enquiries ────────────────────────────────────────────────

const getAllEnquiries = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["status"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  // Default: newest first
  if (!options.sortBy) options.sortBy = "createdAt:desc";
  const enquiries = await venueService.getAllEnquiries(filter, options);
  res.status(httpStatus.OK).json(
    response({ message: "Enquiries fetched", status: "OK", statusCode: httpStatus.OK, data: enquiries })
  );
});

// ─── Admin: update enquiry status / notes ────────────────────────────────────

const updateEnquiry = catchAsync(async (req, res) => {
  const enquiry = await venueService.updateEnquiry(req.params.enquiryId, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Enquiry updated", status: "OK", statusCode: httpStatus.OK, data: enquiry })
  );
});

// ─── Admin: convert enquiry → venue account + send welcome email ──────────────

const convertEnquiryToVenue = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const enquiry = await venueService.getEnquiryById(req.params.enquiryId);

  if (enquiry.status === "converted") {
    throw new ApiError(httpStatus.BAD_REQUEST, "This enquiry has already been converted to a venue");
  }
  if (await User.isUsernameTaken(username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username is already taken. Choose another.");
  }

  // 1. Create venue user account
  const venueUser = await userService.createUser({
    username: username.toLowerCase(),
    venueName: enquiry.businessName,
    password,
    role: "venue",
    email: enquiry.email || null,
    isEmailVerified: true,
  });

  // 2. Create venue profile
  const venueDoc = await Venue.create({
    user: venueUser._id,
    name: enquiry.businessName,
    phone: enquiry.phone || null,
    email: enquiry.email || null,
    enquiryRef: enquiry._id,
  });

  // 3. Link venue back to user
  await userService.updateUserById(venueUser.id, { venueRef: venueDoc._id });

  // 4. Mark enquiry as converted
  await venueService.updateEnquiry(enquiry._id, {
    status: "converted",
    convertedVenue: venueDoc._id,
  });

  // 5. Send welcome email to venue (if they have an email)
  if (enquiry.email) {
    const loginUrl = `${process.env.BACKEND_IP || "http://localhost:5173"}/promoterlogin`;
    emailService
      .sendVenueWelcomeEmail(enquiry.email, {
        venueName: enquiry.businessName,
        username: venueUser.username,
        password, // plain-text — only sent once in this email
        loginUrl,
      })
      .catch(() => {});
  }

  res.status(httpStatus.CREATED).json(
    response({
      message: "Venue account created and welcome email sent",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: {
        user: venueUser,
        venue: venueDoc,
        credentials: {
          username: venueUser.username,
          loginUrl: `${process.env.BACKEND_IP || "http://localhost:5173"}/promoterlogin`,
        },
      },
    })
  );
});

// ─── Venue: list own promoters ────────────────────────────────────────────────

const getMyPromoters = catchAsync(async (req, res) => {
  const venue = await venueService.getVenueByUserId(req.user.id);
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue profile not found");
  const promoters = await venueService.getVenuePromoters(venue._id);
  res.status(httpStatus.OK).json(
    response({ message: "Promoters fetched", status: "OK", statusCode: httpStatus.OK, data: promoters })
  );
});

// ─── Venue: add a promoter ────────────────────────────────────────────────────

const addPromoter = catchAsync(async (req, res) => {
  const venue = await venueService.getVenueByUserId(req.user.id);
  if (!venue) throw new ApiError(httpStatus.NOT_FOUND, "Venue profile not found");
  const promoter = await venueService.createPromoter(venue._id, req.body);
  res.status(httpStatus.CREATED).json(
    response({ message: "Promoter added", status: "OK", statusCode: httpStatus.CREATED, data: promoter })
  );
});

// ─── Venue: update a promoter ─────────────────────────────────────────────────

const updatePromoter = catchAsync(async (req, res) => {
  const promoter = await venueService.updatePromoter(req.params.promoterId, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Promoter updated", status: "OK", statusCode: httpStatus.OK, data: promoter })
  );
});

// ─── Venue: delete a promoter ─────────────────────────────────────────────────

const deletePromoter = catchAsync(async (req, res) => {
  await venueService.deletePromoter(req.params.promoterId);
  res.status(httpStatus.OK).json(
    response({ message: "Promoter removed", status: "OK", statusCode: httpStatus.OK })
  );
});

module.exports = {
  getAllVenues,
  getVenue,
  getMyVenue,
  updateMyVenue,
  deleteVenue,
  submitEnquiry,
  getAllEnquiries,
  updateEnquiry,
  convertEnquiryToVenue,
  getMyPromoters,
  addPromoter,
  updatePromoter,
  deletePromoter,
};
