const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    isPublished: { type: Boolean, default: false },
    deleted: {
      type: Boolean,
      default: false,
    },
    chapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapter",
      },
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
    
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
