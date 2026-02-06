const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { 
    getOrders, 
    getAllOrders, 
    getOrderById, 
    createOrder, 
    updateOrderStatus,
    createStripeCheckoutSession,
    confirmStripeCheckout
} = require('../controllers/OrderController');

router.get('/admin/all', roleMiddleware(['ADMIN']), getAllOrders);

router.post('/checkout/session', authMiddleware, createStripeCheckoutSession);
router.post('/checkout/confirm', authMiddleware, confirmStripeCheckout);

router.get('/', authMiddleware, getOrders);
router.post('/', authMiddleware, createOrder);
router.get('/:id', authMiddleware, getOrderById);

router.put('/:id/status', roleMiddleware(['ADMIN']), updateOrderStatus);

module.exports = router;
