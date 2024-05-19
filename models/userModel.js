const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
    deleted: {
      type: Boolean,
      default: false,
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("users", userSchema);

module.exports = User;
