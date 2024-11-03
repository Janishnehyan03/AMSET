const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, select: false },
    isPublished: { type: Boolean, default: false },
    course: { type: mongoose.Types.ObjectId, ref: "Course" },
    position: { type: Number },
    isPremium: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;
