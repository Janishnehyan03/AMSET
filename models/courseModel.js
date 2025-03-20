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
        chapter: { type: mongoose.Types.ObjectId, ref: "Chapter" },
        isPremium: { type: Boolean, default: true },
      },
    ],
    coinsOfRecommend: {
      type: Number,
    },
    vacancyCount: {
      type: Number,
    },

    learners: [
      {
        user: { type: mongoose.Types.ObjectId, ref: "User" },
        joinedOn: { type: Date },
      },
    ],
    hiringPartners: [
      {
        companyName: { type: String },
        companyLogo: { type: String },
        poster: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
