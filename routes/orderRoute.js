const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../utils/middlewares');

router.post('/course/:courseId',protect, orderController.purchaseCourse);
router.post('/chapter/:chapterId',protect, orderController.purchaseChapter);
router.post('/verify',protect, orderController.verifyPayment);

module.exports = router;