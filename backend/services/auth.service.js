const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const registerUser = async (email, password) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error("Email already in use.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ email, password });
  const token = generateToken(user._id);

  return {
    token,
    user: { id: user._id, email: user.email, createdAt: user.createdAt },
  };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    token,
    user: { id: user._id, email: user.email, createdAt: user.createdAt },
  };
};

module.exports = { registerUser, loginUser };