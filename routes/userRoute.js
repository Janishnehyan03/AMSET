const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { protect, isAdmin } = require("../utils/middlewares");
const Progress = require("../models/progressModel");
const Chapter = require("../models/chapterModel");
const Course = require("../models/courseModel");
const mongoose = require("mongoose");

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
const getProgress = async (userId, courseId) => {
  try {
    // Find all published chapters for the given course
    const publishedChapters = await Chapter.find({
      course: courseId,
      isPublished: true,
    });

    const publishedChapterIds = publishedChapters.map((chapter) => chapter._id);

    // Count the valid completed chapters by the user
    const validCompletedChapters = await Progress.countDocuments({
      user: userId,
      chapter: { $in: publishedChapterIds },
      isCompleted: true,
    });

    const progressPercentage =
      publishedChapterIds.length > 0
        ? (validCompletedChapters / publishedChapterIds.length) * 100
        : 0;

    return {
      publishedChapters,
      progressPercentage: progressPercentage.toFixed(2),
    };
  } catch (error) {
    console.error("[GET_PROGRESS]", error);
    return 0;
  }
};

router.get("/data/:userId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("courses");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const courseData = [];
    for (const course of user.courses) {
      const { progressPercentage } = await getProgress(user._id, course._id);

      // Find published chapters related to the course
      const publishedChapters = await Chapter.find({
        course: course._id,
        isPublished: true,
      });

      courseData.push({
        course,
        progressPercentage,
        publishedChapters,
      });
    }

    user.password = undefined;
    res.status(200).json({ user, courseData });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    let user = await User.findById(decoded.id);
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
    if (!courseData.isPublished) {
      return res.status(404).json({ message: "This course is not published" });
    }
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { courses: { courseId: mongoose.Types.ObjectId(course) } },
      },
      { new: true }
    );

    res.status(200).json({ message: "Course Added Successfully" });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

router.post("/remove-course", protect, isAdmin, async (req, res) => {
  try {
    let { course, userId } = req.body;
    if (!course) {
      return res.status(400).json({ message: "Please select a course" });
    }
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear the lastWatchedChapter for the specific course
    await User.findOneAndUpdate(
      { _id: userId, "courses.courseId": mongoose.Types.ObjectId(course) },
      { $set: { "courses.$.lastWatchedChapter": null } },
      { new: true, useFindAndModify: false }
    );

    res.status(200).json({ message: "Course Chapter Cleared Successfully" });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

module.exports = router;
