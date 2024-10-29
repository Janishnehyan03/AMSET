const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide full name"],
    },
    username: {
      type: String,
      required: [true, "Please provide username"],
      unique: [true, "username already used"],
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
  },
  { timestamps: true }
);

const User = mongoose.model("users", userSchema);

module.exports = User;
