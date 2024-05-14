const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String },
    isPublished: { type: Boolean, default: false },
    course: { type: mongoose.Types.ObjectId, ref: "Course" },
    position: { type: Number },
  },
  { timestamps: true }
);

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;
