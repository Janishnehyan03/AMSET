const Course = require('../models/courseModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const razorpay = require('../utils/razorpay');

exports.createOrder = async (req, res) => {
    const userId = req.user._id
    const { courseId, } = req.body;
    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ message: "Course not found" });

    const orderOptions = {
        amount: course.price * 100, // Amount in paisa
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(orderOptions);
        const newOrder = new Order({
            user: userId,
            course: courseId,
            amount: course.price,
            orderId: order.id,
            status: 'created'
        });
        await newOrder.save();
        res.json({ orderId: order.id, amount: course.price });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const crypto = require("crypto");

exports.verifyPayment = async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID from the authenticated user
        const { paymentId, orderId, signature } = req.body;

        // Step 1: Generate expected signature using orderId and paymentId
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest("hex");

        // Step 2: Compare the generated signature with the one from Razorpay
        if (generated_signature === signature) {
            // Update order status in the database
            const updatedOrder = await Order.updateOne(
                { orderId },
                {
                    $set: {
                        status: "Paid",
                        paymentId
                    }
                }
            );

            // Optionally, you could also confirm the user has the same ID as the one in the order
            const order = await Order.findOne({ orderId }).populate('course');

            if (order && order.user.toString() === userId.toString()) {
                // If the order exists and belongs to the user, add the course to user's courses array
                await User.findByIdAndUpdate(
                    userId,
                    { $addToSet: { courses: order.course } }, // $addToSet prevents duplicates
                    { new: true }
                );
            }

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully and course added!",
            });
        } else {
            // Payment verification failed
            return res.status(400).json({
                success: false,
                message: "Payment verification failed.",
            });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error. Could not verify payment.",
        });
    }
};