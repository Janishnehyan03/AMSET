const mongoose = require("mongoose");

const InstructorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  profileImage: {
    type: String, // URL to cloud storage or local path
    default: "",
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Instructor = mongoose.model("Instructor", InstructorSchema);
module.exports = Instructor;
