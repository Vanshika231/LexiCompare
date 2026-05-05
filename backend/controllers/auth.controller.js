const { registerUser, loginUser } = require("../services/auth.service");

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const result = await registerUser(email, password);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const result = await loginUser(email, password);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };