const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { protect, isAdmin } = require("../utils/middlewares");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter email and password" });
    }

    //check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    //check if password is correct
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    //create token data
    const tokenData = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    // Create a token with expiration of 1 day
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });
    user.password = undefined;

    // Create a JSON response indicating successful login
    res.cookie("amset_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true if in production and using HTTPS
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days in milliseconds
      sameSite: "Lax", // Adjust based on your needs, 'None' requires secure: true
    });
    return res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/register", protect, isAdmin, async (req, res, next) => {
  try {
    const { username, email, password, mobileNumber } = req.body;
    if (!username || !email || !password || !mobileNumber) {
      return res.status(400).json({
        error: "Please provide username, email, mobile number, and password",
      });
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      mobileNumber,
    });
    await newUser.save();

    // Clear sensitive data
    newUser.password = undefined;

    // Respond with success message and user data
    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", protect, isAdmin, async (req, res) => {
  try {
    let users = await User.find({ isAdmin: { $ne: true } });
    res.status(200).json({ results: users.length, users });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to check login status
router.get("/checkLogin", async (req, res) => {
  const token = req.cookies.amset_token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    let user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    user.password = undefined;
    res.status(200).json(user);
  });
});
module.exports = router;
