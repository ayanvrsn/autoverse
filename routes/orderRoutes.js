const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { 
    getOrders, 
    getAllOrders, 
    getOrderById, 
    createOrder, 
    updateOrderStatus 
} = require('../controllers/OrderController');

router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);
router.post('/', authMiddleware, createOrder);

router.get('/admin/all', roleMiddleware(['ADMIN']), getAllOrders);
router.put('/:id/status', roleMiddleware(['ADMIN']), updateOrderStatus);

module.exports = router;
