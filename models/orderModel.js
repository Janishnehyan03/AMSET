const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    amount: Number,
    orderId: String,
    status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order
