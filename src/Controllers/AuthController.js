import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../Models/UserModel.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import AppError from "../Middlewares/AppError.js";
import { sendOtpEmail } from "../Utils/Mailer.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_TTL = "15m";

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtp = () =>
  String(crypto.randomInt(100000, 1000000));

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const userResponse = (user) => ({
  id: user._id,
  firstname: user.firstname,
  middlename: user.middlename,
  lastname: user.lastname,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage,
  role: user.role,
});

export const login = AsyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required.", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Invalid credentials.", 401));
  }

  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Login successfully.",
    token,
    user: userResponse(user),
  });
});

export const logout = AsyncErrorHandler(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully. Please remove the token from client.",
  });
});

export const getLoggedUser = AsyncErrorHandler(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    user: userResponse(req.user),
  });
});

export const changepassword = AsyncErrorHandler(async (req, res, next) => {
  const { oldPassword, password, confirmPassword } = req.body;

  if (!oldPassword || !password || !confirmPassword) {
    return next(
      new AppError(
        "Old password, new password and confirm password are required.",
        400,
      ),
    );
  }

  if (password !== confirmPassword) {
    return next(
      new AppError("Password and confirm password do not match.", 400),
    );
  }

  if (password.length < 6) {
    return next(
      new AppError("Password must be at least 6 characters long.", 400),
    );
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(new AppError("User no longer exists.", 404));
  }

  const isOldCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isOldCorrect) {
    return next(new AppError("Old password is incorrect.", 401));
  }

  const isSamePassword = await bcrypt.compare(password, user.password);
  if (isSamePassword) {
    return next(
      new AppError("New password cannot be the same as old password.", 400),
    );
  }

  user.password = await bcrypt.hash(password, 12);
  user.passwordChangedAt = new Date();
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password changed successfully.",
  });
});

export const forgotPassword = AsyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required.", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always respond success to avoid email enumeration
  if (!user) {
    return res.status(200).json({
      status: "success",
      message: "If an account exists, an OTP has been sent to the email.",
    });
  }

  const otp = generateOtp();
  user.resetOtpHash = hashOtp(otp);
  user.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.resetOtpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpEmail(user.email, otp);
  } catch (err) {
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    console.error("OTP email failed:", err);
    return next(
      new AppError("Failed to send OTP email. Please try again later.", 500),
    );
  }

  res.status(200).json({
    status: "success",
    message: "If an account exists, an OTP has been sent to the email.",
  });
});

export const verifyOtp = AsyncErrorHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Email and OTP are required.", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
    return next(new AppError("Invalid or expired OTP.", 400));
  }

  if (user.resetOtpExpires.getTime() < Date.now()) {
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("OTP expired. Please request a new one.", 400));
  }

  if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("Too many attempts. Please request a new OTP.", 429),
    );
  }

  if (hashOtp(otp) !== user.resetOtpHash) {
    user.resetOtpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Invalid OTP.", 400));
  }

  const resetToken = jwt.sign(
    { id: user._id, purpose: "password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: RESET_TOKEN_TTL },
  );

  res.status(200).json({
    status: "success",
    message: "OTP verified.",
    resetToken,
  });
});

export const resetPassword = AsyncErrorHandler(async (req, res, next) => {
  const { resetToken, password, confirmPassword } = req.body;

  if (!resetToken || !password || !confirmPassword) {
    return next(
      new AppError(
        "Reset token, password and confirm password are required.",
        400,
      ),
    );
  }

  if (password !== confirmPassword) {
    return next(
      new AppError("Password and confirm password do not match.", 400),
    );
  }

  if (password.length < 6) {
    return next(
      new AppError("Password must be at least 6 characters long.", 400),
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    return next(new AppError("Invalid or expired reset token.", 401));
  }

  if (decoded.purpose !== "password_reset") {
    return next(new AppError("Invalid reset token.", 401));
  }

  const user = await User.findById(decoded.id).select("+password");
  if (!user) {
    return next(new AppError("User no longer exists.", 404));
  }

  if (!user.resetOtpHash) {
    return next(
      new AppError("Reset session expired. Please start again.", 400),
    );
  }

  const isSamePassword = await bcrypt.compare(password, user.password);
  if (isSamePassword) {
    return next(
      new AppError("New password cannot be the same as old password.", 400),
    );
  }

  user.password = await bcrypt.hash(password, 12);
  user.passwordChangedAt = new Date();
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password reset successfully. Please log in.",
  });
});
