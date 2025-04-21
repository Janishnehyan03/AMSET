const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide full name"],
    },
    hasAllAccess: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: [true, "Email already used"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
    },
    mobileNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: [true, "Mobile number already used"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    bioDescription: {
      type: String,
    },
    courses: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Course",
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
    address: {
      type: String,
    },
    postOffice: {
      type: String,
    },
    district: {
      type: String,
    },
    pinCode: {
      type: String,
    },
    country: {
      type: String,
    },
    experience: {
      type: String,
    },
    experienceSector: {
      type: String,
    },
    secondaryMobileNumber: {
      type: String,
    },
    completedChapters: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    ],
    
    answers: [
      {
        chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        userAnswers: [
          {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
            selectedOptionIndex: Number,
          },
        ],
      },
    ],
    courseCoins: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        coins: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
