const express = require("express");
const Chapter = require("../models/chapterModel");
const { protect, isAdmin } = require("../utils/middlewares");
const Progress = require("../models/progressModel");

const router = express.Router();

// Create a new course (POST)
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const course = new Chapter(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all chapters (GET)
router.get("/", async (req, res) => {
  try {
    const chapters = await Chapter.find();
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/:chapterId", async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) {
      res.status(404).json({ message: "Chapter Not Found" });
    }
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single course by ID (GET)
router.patch("/:id", protect, isAdmin, async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!chapter) {
      return res.status(404).json({ error: "chapter not found" });
    }
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.patch("/:id/publish", protect, isAdmin, async (req, res) => {
  try {
    // Update isPublished to true
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    const { title, description, videoUrl } = chapter;

    // Check if any required field is missing
    if (!title || !description || !videoUrl) {
      return res.status(400).json({ message: "All fields are required" });
    }
    await Chapter.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true }
    );
    res.json({ message: "Chapter Updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
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
    // Update isPublished to true
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    await Progress.create({
      user: req.user._id,
      chapter: chapter._id,
      isCompleted: true,
    });
    res.json({ message: "Chapter Completed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
