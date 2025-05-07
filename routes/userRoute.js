const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { protect, isAdmin } = require("../utils/middlewares");
const Progress = require("../models/progressModel");
const Chapter = require("../models/chapterModel");
const Course = require("../models/courseModel");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const multer = require("multer");

const upload = multer({
  dest: "uploads/",
  storage: multer.memoryStorage(),
});

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

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
      // max age 30 days
      maxAge: 3600000 * 24 * 30,
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

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, mobileNumber, fullName } = req.body;
    if (!email || !password || !mobileNumber || !fullName) {
      return res.status(400).json({
        error: "Please provide full name,  email, mobile number, and password",
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
    const newUser = await User.create({
      ...req.body,
      password: hashedPassword,
    });
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
router.get("/profile", protect, async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    user.password = undefined;
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.patch("/profile/:id", protect, async (req, res) => {
  try {
    let user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    });
    user.password = undefined;
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/data/:userId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("savedJobs");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = undefined;
    res.status(200).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/logout", async (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie("amset_token", {
      httpOnly: true, // Prevents access from JavaScript
      secure: process.env.NODE_ENV === "production", // Ensures the cookie is only sent over HTTPS in production
      sameSite: "strict", // Prevents CSRF attacks
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

// Route to check login status
router.get("/checkLogin", async (req, res) => {
  const token =
    req.cookies.amset_token ||
    (req.headers.authorization &&
      req.headers.authorization.split("Bearer ")[1]);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    let user = await User.findById(decoded.id).populate("savedJobs");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    user.password = undefined;
    res.status(200).json(user);
  });
});
router.post("/add-course", protect, isAdmin, async (req, res) => {
  try {
    let { course, userId } = req.body;

    if (!course) {
      return res.status(400).json({ message: "Please select a course" });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let courseData = await Course.findById(course);
    if (!courseData) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (!courseData.isPublished) {
      return res.status(400).json({ message: "This course is not published" });
    }

    // Ensure courseId is properly cast to ObjectId
    const courseObjectId = new mongoose.Types.ObjectId(course);

    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { courses: courseObjectId },
      },
      { new: true }
    );

    res.status(200).json({ message: "Course added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/remove-course", protect, isAdmin, async (req, res) => {
  try {
    const { course, userId } = req.body;

    if (!course) {
      return res.status(400).json({ message: "Please select a course" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const courseData = await Course.findById(course);
    if (!courseData) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Remove the course from the user's courses array
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: { courses: course },
      },
      { new: true }
    );

    res.status(200).json({ message: "Course removed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/image-upload",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const cldRes = await handleUpload(dataURI);
      await User.findByIdAndUpdate(req.user._id, {
        image: cldRes.secure_url,
      });

      res.json({ message: "Image Uploaded" });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        message: error.message,
      });
    }
  }
);
module.exports = router;
