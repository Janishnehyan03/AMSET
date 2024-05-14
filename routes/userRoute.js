const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

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
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days in milliseconds
    });
    return res.json({
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

module.exports = router;
