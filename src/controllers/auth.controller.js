const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const response = require("../config/response");
const { authService, userService, tokenService, emailService } = require("../services");
const { User, Venue, Enquiry } = require("../models");

// ─── Admin: register (create admin account) ───────────────────────────────────

const register = catchAsync(async (req, res) => {
  const { email, fullName, password } = req.body;

  const existing = await userService.getUserByEmail(email);
  if (existing && !existing.isDeleted && existing.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const oneTimeCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  if (existing) {
    await userService.updateUserById(existing.id, {
      fullName, password, oneTimeCode,
      isEmailVerified: false, isDeleted: false,
    });
  } else {
    await userService.createUser({ fullName, email, password, role: "admin", oneTimeCode });
  }

  await emailService.sendEmailVerification(email, oneTimeCode);

  res.status(httpStatus.CREATED).json(
    response({ message: "Registered. Please verify your email.", status: "OK", statusCode: httpStatus.CREATED, data: {} })
  );
});

// ─── Admin login — email + password ──────────────────────────────────────────

const adminLogin = catchAsync(async (req, res) => {
  const { email, password, fcmToken } = req.body;
  const user = await authService.loginAdminWithEmailAndPassword(email, password, fcmToken);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).json(
    response({ message: "Login successful", status: "OK", statusCode: httpStatus.OK, data: { user, tokens } })
  );
});

// ─── Venue login — username + password ───────────────────────────────────────

const venueLogin = catchAsync(async (req, res) => {
  const { username, password, fcmToken } = req.body;
  const user = await authService.loginVenueWithUsernameAndPassword(username, password, fcmToken);
  const tokens = await tokenService.generateAuthTokens(user);

  // Populate venue profile
  const venue = await Venue.findOne({ user: user._id });

  res.status(httpStatus.OK).json(
    response({ message: "Login successful", status: "OK", statusCode: httpStatus.OK, data: { user, venue, tokens } })
  );
});

// ─── Admin: create a venue account ───────────────────────────────────────────

const createVenueAccount = catchAsync(async (req, res) => {
  const { venueName, username, password, email, phone, enquiryId } = req.body;

  if (await User.isUsernameTaken(username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username already taken");
  }

  // Create the user account (role=venue)
  const venueUser = await userService.createUser({
    username: username.toLowerCase(),
    venueName,
    password,
    role: "venue",
    email: email || null,
    isEmailVerified: true, // admin-created accounts are pre-verified
  });

  // Create the Venue profile
  const venueDoc = await Venue.create({
    user: venueUser._id,
    name: venueName,
    phone: phone || null,
    email: email || null,
    enquiryRef: enquiryId || null,
  });

  // Link venue back to user
  await userService.updateUserById(venueUser.id, { venueRef: venueDoc._id });

  // If created from an enquiry, mark it as converted
  if (enquiryId) {
    await Enquiry.findByIdAndUpdate(enquiryId, {
      status: "converted",
      convertedVenue: venueDoc._id,
    });
  }

  res.status(httpStatus.CREATED).json(
    response({
      message: "Venue account created",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: {
        user: venueUser,
        venue: venueDoc,
        credentials: { username: venueUser.username, loginUrl: "/promoterlogin" },
      },
    })
  );
});

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.OK).json(
    response({ message: "Logged out successfully", status: "OK", statusCode: httpStatus.OK })
  );
});

// ─── Refresh tokens ───────────────────────────────────────────────────────────

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).json(
    response({ message: "Tokens refreshed", status: "OK", statusCode: httpStatus.OK, data: tokens })
  );
});

// ─── Forgot password (email OTP) ─────────────────────────────────────────────

const forgotPassword = catchAsync(async (req, res) => {
  const user = await userService.getUserByEmail(req.body.email);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "No account found with this email");

  const oneTimeCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  await userService.updateUserById(user.id, { oneTimeCode, isResetPassword: true });
  await emailService.sendResetPasswordEmail(req.body.email, oneTimeCode);

  res.status(httpStatus.OK).json(
    response({ message: "Password reset code sent to your email", status: "OK", statusCode: httpStatus.OK, data: {} })
  );
});

// ─── Reset password ───────────────────────────────────────────────────────────

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.password, req.body.email);
  res.status(httpStatus.OK).json(
    response({ message: "Password reset successful", status: "OK", statusCode: httpStatus.OK })
  );
});

// ─── Change password (authenticated) ─────────────────────────────────────────

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Password changed successfully", status: "OK", statusCode: httpStatus.OK })
  );
});

// ─── Verify email OTP ─────────────────────────────────────────────────────────

const verifyEmail = catchAsync(async (req, res) => {
  const user = await authService.verifyEmail(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).json(
    response({ message: "Email verified", status: "OK", statusCode: httpStatus.OK, data: { user, tokens } })
  );
});

// ─── Delete own account ───────────────────────────────────────────────────────

const deleteMe = catchAsync(async (req, res) => {
  await authService.deleteMe(req.body.password, req.user);
  res.status(httpStatus.OK).json(
    response({ message: "Account deleted", status: "OK", statusCode: httpStatus.OK })
  );
});

// ─── Get current user (me) ────────────────────────────────────────────────────

const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  let venue = null;
  if (user.role === "venue") {
    venue = await Venue.findOne({ user: user._id });
  }

  res.status(httpStatus.OK).json(
    response({ message: "Profile fetched", status: "OK", statusCode: httpStatus.OK, data: { user, venue } })
  );
});

module.exports = {
  register,
  adminLogin,
  venueLogin,
  createVenueAccount,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  deleteMe,
  getMe,
};
