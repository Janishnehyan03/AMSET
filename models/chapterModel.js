const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true }, // The text of the question
  options: [{ type: String, required: true }],    // List of options
  correctAnswerIndex: { type: Number, required: true }, // Index of the correct answer
});

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, select: false },
    isPublished: { type: Boolean, default: false },
    position: { type: Number },
    isPremium: { type: Boolean, default: false },
    questions: [questionSchema], // Array of questions
  },
  { timestamps: true }
);

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;
