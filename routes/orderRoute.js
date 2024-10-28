const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../utils/middlewares');

router.post('/create',protect, orderController.createOrder);
router.post('/verify',protect, orderController.verifyPayment);

module.exports = router;