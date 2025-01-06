const Chapter = require("../models/chapterModel");
const Course = require("../models/courseModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");

exports.purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const options = {
      amount: course.price * 100, // Convert to smallest currency unit
      currency: "INR",
      receipt: shortid.generate(),
      payment_capture: 1, // Auto capture
    };

    const response = await razorpay.orders.create(options);

    for (const chapter of course.chapters) {
      await Chapter.findByIdAndUpdate(
        chapter.chapter._id,
        { $addToSet: { purchasedUsers: req.user._id } }, // $addToSet ensures no duplicates
        { new: true }
      );
    }

    const order = new Order({
      user: req.user._id,
      course: courseId,
      amount: course.price,
      currency: "INR",
      orderId: response.id,
      status: "pending",
    });

    await order.save();

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error purchasing course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  }
};

exports.purchaseChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(
      chapterId,
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }
    const options = {
      amount: req.body.amount * 100, // Convert to smallest currency unit
      currency: "INR",
      receipt: crypto.randomBytes(4).toString("hex"),
      payment_capture: 1, // Auto capture
    };
    const response = await razorpay.orders.create(options);


    // Save the order
    const order = new Order({
      user: req.user._id,
      chapter: chapter._id,
      amount: req.body.amount,
      currency: "INR",
      orderId: response.id,
      status: "pending",
    });

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error purchasing course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    } else {
      console.log("Payment verified successfully");
    }

    let order = await Order.findOne({ orderId: razorpay_order_id });
    if (order.chapter) {
      // Add the user to the purchasedUsers array for the chapter
      await Chapter.findByIdAndUpdate(order.chapter, {
        $addToSet: { purchasedUsers: order.user },
      });
      await order.updateOne({ status: "completed" });
    } else if (order.course) {
      // Add the user to the purchasedUsers array for all chapters in the course
      const course = await Course.findById(order.course);
      await User.findByIdAndUpdate(order.user, {
        $addToSet: { courses: order.course },
      });
      for (const chapter of course.chapters) {
        await Chapter.findByIdAndUpdate(
          chapter.chapter._id,
          { $addToSet: { purchasedUsers: order.user } },
          { new: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  }
};

exports.getMyChapters = async (req, res) => {
  try {
    // Show the purchased order details and the chapters
    const orders = await Order.find({
      user: req.user._id,
      status: { $ne: "pending" },
    });

    let chapters = [];
    let paymentDetails = [];
    for (const order of orders) {
      if (order.chapter) {
        const chapter = await Chapter.findById(order.chapter);
        chapters.push(chapter);
        paymentDetails.push({
          orderId: order.orderId,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          createdAt: order.createdAt,
          chapter: chapter,
        });
      } else if (order.course) {
        const course = await Course.findById(order.course);
        for (const chapter of course.chapters) {
          chapters.push(chapter.chapter);
          paymentDetails.push({
            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
            createdAt: order.createdAt,
            chapter: chapter.chapter,
          });
        }
      }
    }
    res.status(200).json({
      success: true,
      data: {
        paymentDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user")
      .populate("course")
      .populate("chapter")
      .sort({ createdAt: -1 });
    const totalRevenue = orders.reduce((acc, order) => acc + order.amount, 0);

    res.status(200).json({
      success: true,
      data: orders,
      totalRevenue: totalRevenue,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  }
};
