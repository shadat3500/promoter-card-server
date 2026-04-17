const httpStatus = require("http-status");
const tokenService = require("./token.service");
const userService = require("./user.service");
const Token = require("../models/token.model");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");

// Admin login — email + password
const loginAdminWithEmailAndPassword = async (email, password, fcmToken) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  if (user.role !== "admin") {
    throw new ApiError(httpStatus.FORBIDDEN, "Access denied. Admin only.");
  }
  if (user.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This account has been deleted");
  }
  if (!user.isEmailVerified) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email not verified");
  }
  if (fcmToken) {
    user.fcmToken = fcmToken;
    await user.save();
  }
  return user;
};

// Venue login — username + password (created by admin, no email verification needed)
const loginVenueWithUsernameAndPassword = async (username, password, fcmToken) => {
  const user = await userService.getUserByUsername(username);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect username or password");
  }
  if (user.role !== "venue") {
    throw new ApiError(httpStatus.FORBIDDEN, "Access denied. Venue accounts only.");
  }
  if (user.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This account has been deleted");
  }
  if (fcmToken) {
    user.fcmToken = fcmToken;
    await user.save();
  }
  return user;
};

const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Refresh token not found");
  }
  await refreshTokenDoc.deleteOne();
};

const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) throw new Error();
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

const resetPassword = async (newPassword, email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (!user.isResetPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please request a password reset first");
  }
  if (await user.isPasswordMatch(newPassword)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "New password must differ from current password");
  }
  await userService.updateUserById(user.id, { password: newPassword, isResetPassword: false, oneTimeCode: null });
  return user;
};

const changePassword = async (reqUser, reqBody) => {
  const { oldPassword, newPassword } = reqBody;
  const user = await userService.getUserById(reqUser.id);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (!(await user.isPasswordMatch(oldPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect current password");
  }
  if (await user.isPasswordMatch(newPassword)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "New password cannot be the same as the old one");
  }
  user.password = newPassword;
  await user.save();
  return user;
};

const verifyEmail = async (reqBody) => {
  const { email, code: oneTimeCode } = reqBody;
  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (!user.oneTimeCode) throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
  if (String(oneTimeCode) !== String(user.oneTimeCode)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }
  if (user.isEmailVerified && !user.isResetPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already verified");
  }
  user.isEmailVerified = true;
  user.oneTimeCode = null;
  await user.save();
  return user;
};

const deleteMe = async (password, reqUser) => {
  const user = await userService.getUserById(reqUser.id);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (!(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
  }
  user.isDeleted = true;
  await user.save();
  return user;
};

module.exports = {
  loginAdminWithEmailAndPassword,
  loginVenueWithUsernameAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  changePassword,
  verifyEmail,
  deleteMe,
};
