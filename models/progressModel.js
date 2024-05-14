const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;
