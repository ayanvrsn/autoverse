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
    requestOrderCode,
    confirmOrder
} = require('../controllers/OrderController');

router.get('/admin/all', roleMiddleware(['ADMIN']), getAllOrders);

router.post('/checkout/request-code', authMiddleware, requestOrderCode);
router.post('/checkout/confirm', authMiddleware, confirmOrder);

router.get('/', authMiddleware, getOrders);
router.post('/', authMiddleware, createOrder);
router.get('/:id', authMiddleware, getOrderById);

router.put('/:id/status', roleMiddleware(['ADMIN']), updateOrderStatus);

module.exports = router;
