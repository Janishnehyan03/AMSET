const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    amount: Number,
    paymentId: String,
    orderId: String,
    status: { type: String, default: 'pending' }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order
