import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/UserModel.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import AppError from "../Middlewares/AppError.js";

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
