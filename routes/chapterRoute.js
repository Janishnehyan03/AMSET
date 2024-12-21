const express = require("express");
const Chapter = require("../models/chapterModel");
const { protect, isAdmin } = require("../utils/middlewares");
const Progress = require("../models/progressModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const { createChapter, getOneChapter, getChapters, updateChapter, createQuestions, editQuestion, deleteQuestion, completeChapter } = require("../controllers/chapterController");
const router = express.Router();

// Create a new course (POST)
router.post("/", protect, isAdmin, createChapter);

// Get all chapters (GET)
router.get("/", protect, isAdmin, getChapters);
router.get("/:chapterId", protect, getOneChapter);


// Get a single course by ID (GET)
router.patch("/:id/publish", protect, isAdmin, updateChapter);
router.patch("/:id", protect, isAdmin, updateChapter);
router.patch("/:id/questions", protect, isAdmin, createQuestions);
router.patch("/:chapterId/questions/:questionId", protect, isAdmin, editQuestion);
router.post("/:chapterId/complete-chapter", protect, completeChapter);


router.patch("/:id/unpublish", protect, isAdmin, async (req, res) => {
  try {
    // Update isPublished to true
    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { isPublished: false },
      { new: true }
    );

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/completed", protect, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    const existingProgress = await Progress.findOne({
      user: req.user._id,
      chapter: chapter._id,
    });

    if (existingProgress) {
      existingProgress.isCompleted = true;
      await existingProgress.save();
    } else {
      await Progress.create({
        user: req.user._id,
        chapter: chapter._id,
        isCompleted: true,
      });
    }

    res.json({ message: "Chapter Completed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/uncompleted/", protect, async (req, res) => {
  try {
    // Update isPublished to true
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    let data = await Progress.findOneAndUpdate(
      {
        chapter: req.params.id,
        user: req.user._id,
      },
      {
        isCompleted: false,
      },
      { new: true }
    );

    console.log("====================================");
    console.log(data);
    console.log("====================================");

    res.json({ message: "Chapter Uncompleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:courseId/progress", protect, async (req, res) => {
  try {
    // Find the course by ID
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Find all chapters for the course
    let chapters = await Chapter.find({ course: course._id });

    // Extract chapter IDs
    let chapterIds = chapters.map((chapter) => chapter._id);

    // Find progress for the user on these chapters
    let progress = await Progress.find({
      user: req.user._id,
      chapter: { $in: chapterIds },
      isCompleted: true,
    });

    // Return the progress
    res.json(progress);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
