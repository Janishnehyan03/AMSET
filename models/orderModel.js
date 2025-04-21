const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    orderId: String,
    razorpayPaymentId: String,
    razorpayOrderId: String,
    razorpaySignature: String,
    currency: String,
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "failed",'created'],
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
