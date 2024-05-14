const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    isPublished: { type: Boolean, default: false },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
