const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, isAdmin } = require('../utils/middlewares');

// Admin-only routes
router.get('/', protect, isAdmin, orderController.getAllOrders);

// User purchase flow
router.post('/initiate', protect, orderController.initiateAllAccessPurchase);
router.post('/verify', protect, orderController.verifyAllAccessPayment);
router.get('/status', protect, orderController.getUserOrderStatus);

module.exports = router;