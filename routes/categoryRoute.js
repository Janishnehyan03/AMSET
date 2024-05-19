const express = require("express");
const Category=require('../models/catergoryModel')

const { protect, isAdmin } = require("../utils/middlewares");

const router = express.Router();

// Create a new course (POST)
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const course = new Category(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all categories (GET)
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({results:categories.length, categories});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single course by ID (GET)
router.get("/:id", async (req, res) => {
  try {
    const course = await Category.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a course by ID (PUT)
router.put("/:id", protect, isAdmin, async (req, res) => {
  try {
    const course = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a course by ID (DELETE)
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const course = await Category.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
