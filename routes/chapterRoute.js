const express = require("express");
const Chapter = require("../models/chapterModel");
const { protect, isAdmin } = require("../utils/middlewares");

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
router.get("/:courseId/:chapterId", async (req, res) => {
  try {
    const chapter = await Chapter.findOne({
      course: req.params.courseId,
      _id: req.params.chapterId,
    });
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single course by ID (GET)
router.get("/:id", async (req, res) => {
  try {
    const course = await Chapter.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
