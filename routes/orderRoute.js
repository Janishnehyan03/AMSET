const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, isAdmin } = require('../utils/middlewares');

router.get('/',protect, isAdmin, orderController.getAllOrders);
router.post('/course/:courseId',protect, orderController.purchaseCourse);
router.post('/chapter/:chapterId',protect, orderController.purchaseChapter);
router.post('/verify',protect, orderController.verifyPayment);
router.get('/chapters',protect, orderController.getMyChapters);

module.exports = router;