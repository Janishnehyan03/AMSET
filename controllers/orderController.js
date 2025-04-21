const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

const ALL_ACCESS_PRICE = 3000; // INR
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email");
    res.status(200).json({
      success: true,
      results: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


exports.initiateAllAccessPurchase = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.hasAllAccess) {
      return res.status(400).json({
        success: false,
        message: "You already have all-access to courses",
      });
    }

    const options = {
      amount: ALL_ACCESS_PRICE * 100,
      currency: "INR",
      receipt: crypto.randomBytes(4).toString("hex"),
    };

    const order = await razorpay.orders.create(options);

    const newOrder = new Order({
      user: req.user._id,
      amount: ALL_ACCESS_PRICE,
      currency: "INR",
      orderId: order.id,
      status: "created",
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.verifyAllAccessPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - invalid signature",
      });
    }

    // Find and update order
    const order = await Order.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        status: "completed",
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Grant all-access to user
    await User.findByIdAndUpdate(order.user, {
      hasAllAccess: true,
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getUserOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOne({
      user: req.user._id,
      status: { $in: ["pending", "completed"] },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No active or pending order found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        createdAt: order.createdAt,
        orderId: order.orderId,
      },
    });
  } catch (error) {
    console.error("Error fetching order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
