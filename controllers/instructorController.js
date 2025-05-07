const Instructor = require("../models/instuctorModel");

// @desc    Get all instructors
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find();
    res.status(200).json(instructors);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get instructor by ID
exports.getInstructorById = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor)
      return res.status(404).json({ message: "Instructor not found" });
    res.status(200).json(instructor);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Create new instructor
exports.createInstructor = async (req, res) => {
  try {
    const newInstructor = await Instructor.create(req.body);
    res.status(201).json(newInstructor);
  } catch (error) {
    res.status(400).json({ message: "Invalid data", error });
  }
};

// @desc    Update instructor by ID
exports.updateInstructor = async (req, res) => {
  try {
    const updated = await Instructor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Instructor not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Update failed", error });
  }
};

// @desc    Delete instructor
exports.deleteInstructor = async (req, res) => {
  try {
    const deleted = await Instructor.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Instructor not found" });
    res.status(200).json({ message: "Instructor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};
